#!/usr/bin/env bash

#
# Copyright contributors to the Galasa project
#
# SPDX-License-Identifier: EPL-2.0
#

# Where is this script executing from ?
BASEDIR=$(dirname "$0");pushd $BASEDIR 2>&1 >> /dev/null ;BASEDIR=$(pwd);popd 2>&1 >> /dev/null
# echo "Running from directory ${BASEDIR}"
export ORIGINAL_DIR=$(pwd)
cd "${BASEDIR}"


#--------------------------------------------------------------------------
# Set Colors
#--------------------------------------------------------------------------
bold=$(tput bold)
underline=$(tput sgr 0 1)
reset=$(tput sgr0)

red=$(tput setaf 1)
green=$(tput setaf 76)
white=$(tput setaf 7)
tan=$(tput setaf 202)
blue=$(tput setaf 25)

#--------------------------------------------------------------------------
#
# Headers and Logging
#
#--------------------------------------------------------------------------
underline() { printf "${underline}${bold}%s${reset}\n" "$@"
}
h1() { printf "\n${underline}${bold}${blue}%s${reset}\n" "$@"
}
h2() { printf "\n${underline}${bold}${white}%s${reset}\n" "$@"
}
debug() { printf "${white}%s${reset}\n" "$@"
}
info() { printf "${white}➜ %s${reset}\n" "$@"
}
success() { printf "${green}✔ %s${reset}\n" "$@"
}
error() { printf "${red}✖ %s${reset}\n" "$@"
}
warn() { printf "${tan}➜ %s${reset}\n" "$@"
}
bold() { printf "${bold}%s${reset}\n" "$@"
}
note() { printf "\n${underline}${bold}${blue}Note:${reset} ${blue}%s${reset}\n" "$@"
}

#-----------------------------------------------------------------------------------------
# Functions
#-----------------------------------------------------------------------------------------
function usage {
    info "Syntax: build-locally.sh [OPTIONS]"
    cat << EOF
Options are:
-c | --clean : Do a clean build. One of the --clean or --delta flags are mandatory.
-d | --delta : Do a delta build. One of the --clean or --delta flags are mandatory.
--docker : Optional. Builds the webui Docker image as webui:latest.

Environment variables used:
None
EOF
}

function check_exit_code () {
    # This function takes 3 parameters in the form:
    # $1 an integer value of the returned exit code
    # $2 an error message to display if $1 is not equal to 0
    if [[ "$1" != "0" ]]; then 
        error "$2" 
        exit 1  
    fi
}

#-----------------------------------------------------------------------------------------
# Process parameters
#-----------------------------------------------------------------------------------------
function process_parameters {
    export build_type=""
    export is_docker_build_requested=""

    while [ "$1" != "" ]; do
        case $1 in
            -c | --clean )          build_type="clean"
                                    ;;
            -d | --delta )          build_type="delta"
                                    ;;
            --docker )              is_docker_build_requested="true"
                                    ;;
            -h | --help )           usage
                                    exit
                                    ;;
            * )                     error "Unexpected argument $1"
                                    usage
                                    exit 1
        esac
        shift
    done

    if [[ "${build_type}" == "" ]]; then
        error "Need to use either the --clean or --delta parameter."
        usage
        exit 1
    fi
}

function clean {
    rm -rf ${BASEDIR}/galasa-ui/src/generated
    success "Cleaned up OK"
}

process_parameters $*

# Clean up if we need to.
if [[ "${build_type}" == "clean" ]]; then
    clean
fi

function download_node_dependencies {
    h2 "Running npm install to download node.js dependencies..."
    cd ${BASEDIR}/galasa-ui

    npm clean-install
    rc=$? 
    check_exit_code $rc  "Failed to download node.js dependencies. rc=${rc}"
    success "OK"
}

# Invoke the generator.
function generate_rest_client {
    h2 "Generate the openapi client TypeScript code..."

    if [[ "${build_type}" == "clean" ]]; then
        h2 "Cleaning the generated code out..."
        rm -fr ${BASEDIR}/galasa-ui/src/generated/*
    fi

    # Set default SOURCE_MAVEN to development URL if not provided
    if [[ -z "$SOURCE_MAVEN" ]]; then        
        SOURCE_MAVEN="https://development.galasa.dev/main/maven-repo/obr"
        warn "SOURCE_MAVEN env not set, defaulting to $SOURCE_MAVEN. If you have a built version of maven then this will be used before SOURCE_MAVEN."
    fi

    # Execute Gradle command with SOURCE_MAVEN passed as a Gradle property
    gradle --warning-mode all --info --debug \
      -PsourceMaven="$SOURCE_MAVEN" \
      generateTypeScriptClient
      
    rc=$? 
    check_exit_code $rc  "Failed to generate the TypeScript client code from the openapi.yaml file. rc=${rc}"
    success "Code generation OK"

    h2 "Fixing compilation errors in generated code..."
    tempDir="${BASEDIR}/temp"
    rm -fr ${tempDir}
    mkdir -p ${tempDir}

    # PromiseAPI.ts gets generated with compilation errors due to a clashing constant named "result", so rename "result" to "apiResult"
    promiseApiFile="${BASEDIR}/galasa-ui/src/generated/galasaapi/types/PromiseAPI.ts"
    cat ${promiseApiFile} | sed "s/const result =/const apiResult =/g" > ${tempDir}/PromiseAPI-temp.ts
    cat ${tempDir}/PromiseAPI-temp.ts | sed "s/return result\.toPromise/return apiResult\.toPromise/g" > ${tempDir}/PromiseAPI.ts
    cp ${tempDir}/PromiseAPI.ts ${promiseApiFile}

    # index.ts gets generated with type errors, so fix them
    indexFile="${BASEDIR}/galasa-ui/src/generated/galasaapi/index.ts"
    cat ${indexFile} | sed "s/export { Configuration/export { type Configuration/1" > ${tempDir}/index-temp.ts
    cat ${tempDir}/index-temp.ts | sed "s/export { PromiseMiddleware/export { type PromiseMiddleware/1" > ${tempDir}/index.ts
    cp ${tempDir}/index.ts ${indexFile}

    success "OK"
}

function run_tests {
    cd ${BASEDIR}/galasa-ui
    
    if [ "$IS_DEV_CONTAINER" = "true" ]; then
        # Jest defaults to using all available CPU threads for parallel test execution. In a containerised environment, this can lead to high thread coordination overhead that slows things down, hence limit CPU cores by 50%.
        npm test -- --maxWorkers=50% --watchAll=false
    else
        npm test -- --watchAll=false
    fi

    rc=$?
    if [[ "${rc}" != "0" ]]; then
        error "Failing tests."
        exit 1
    fi
    success "Unit tests all pass OK."
}

function do_build {
    cd ${BASEDIR}/galasa-ui
    npm run build
    rc=$?
    if [[ "${rc}" != "0" ]]; then
        error "Failed to build."
        exit 1
    fi
    success "Built OK."
}

function check_secrets {
    h2 "updating secrets baseline"
    cd ${BASEDIR}
    detect-secrets scan --exclude-files galasa-ui/package-lock.json --update .secrets.baseline
    rc=$? 
    check_exit_code $rc "Failed to run detect-secrets. Please check it is installed properly" 
    success "updated secrets file"

    h2 "running audit for secrets"
    detect-secrets audit .secrets.baseline
    rc=$? 
    check_exit_code $rc "Failed to audit detect-secrets."
    
    #Check all secrets have been audited
    secrets=$(grep -c hashed_secret .secrets.baseline)
    audits=$(grep -c is_secret .secrets.baseline)
    if [[ "$secrets" != "$audits" ]]; then 
        error "Not all secrets found have been audited"
        exit 1  
    fi
    sed -i '' '/[ ]*"generated_at": ".*",/d' .secrets.baseline
    success "secrets audit complete"
}

function check_docker_installed {
    which docker
    rc=$?
    if [[ "${rc}" != "0" ]]; then
        error "The docker CLI tool is not available on your path. Install docker and try again."
        exit 1
    fi
    success "docker is installed. OK"
}

function build_docker_image {
    h2 "Building webui:latest Docker image..."

    docker build -f "${BASEDIR}/dockerfiles/dockerfile.webui" \
    -t webui:latest \
    ${BASEDIR}

    rc=$?
    check_exit_code ${rc} "Failed to build the webui Docker image."

    success "webui:latest Docker image built OK"
}

#--------------------------------------------------------------------------
#
# Main script logic
#
#--------------------------------------------------------------------------

generate_rest_client
download_node_dependencies
run_tests
do_build

if [[ "${is_docker_build_requested}" == "true" ]]; then
    check_docker_installed
    build_docker_image
fi

${BASEDIR}/detect-secrets.sh

success "Project built OK."

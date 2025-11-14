#!/bin/bash

#
# Copyright contributors to the Galasa project
#
# SPDX-License-Identifier: EPL-2.0
#

#-----------------------------------------------------------------------------------------                   
# Set Colors
#-----------------------------------------------------------------------------------------  
reset=$(tput sgr0)
red=$(tput setaf 1)
green=$(tput setaf 76)

#-----------------------------------------------------------------------------------------                   
# Headers and Logging
#-----------------------------------------------------------------------------------------      
success() { printf "${green}✔ %s${reset}\n" "$@"
}
error() { printf "${red}✖ %s${reset}\n" "$@"
}

#-----------------------------------------------------------------------------------------                   
# Functions
#----------------------------------------------------------------------------------------- 

# Sets envs if they are specified on local machine (prevents null values)
function set_env_vars() {
  local GALASA_DEV_TOKEN_VALUE="$1"
  local GALASA_API_SERVER_URL_VALUE="$2"
  local SOURCE_MAVEN_VALUE="$3"
  local PROFILE_FILE="/home/node/.bashrc"

  if [ -n "$GALASA_DEV_TOKEN_VALUE" ]; then
    echo "export GALASA_DEV_TOKEN=$GALASA_DEV_TOKEN_VALUE" >> "$PROFILE_FILE"
  fi

  if [ -n "$GALASA_API_SERVER_URL_VALUE" ]; then
    echo "export GALASA_API_SERVER_URL=$GALASA_API_SERVER_URL_VALUE" >> "$PROFILE_FILE"
  fi

  if [ -n "$SOURCE_MAVEN_VALUE" ]; then
    echo "export SOURCE_MAVEN=$SOURCE_MAVEN_VALUE" >> "$PROFILE_FILE"
  fi

  success "Existing local envs copied sucessfully"
}

# Installs required python package, pre-commit, for detect-secrets
function setup_python {
  which pip3
  rc=$?
  if [[ "${rc}" != "0" ]]; then
    error "pip3 tool is not available on your path. Install pip3 and re-try to install required python packages."
    exit 1
  fi
  success "pip3 is available. OK"

  pip3 install pre-commit
}

set_env_vars "$1" "$2" "$3"
setup_python

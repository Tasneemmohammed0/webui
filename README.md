# webui

This is the home of the web user-interface for Galasa.

## Technologies used

- [Typescript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [Next](https://nextjs.org)
- [Carbon controls](https://carbondesignsystem.com/all-about-carbon/what-is-carbon/)


When setting up the galasa webui locally, you can either use [(1) our development container (recommended set up)](#1-recommended-set-up-dev-container) or [(2) a manual set up](#2-manual-set-up). Please ensure you've read the [Important Information](#important-information) first.

## Important Information

When attempting to run Galasa's webui locally, you may need to set some environment variables. 

**Note: If setting up in a dev container, your variables will be printed to the console if not set in a .env file.**

### GALASA_DEV_TOKEN and GALASA_API_SERVER_URL
- In order to [connect the local development web UI with a remote API server](#connecting-the-local-development-web-ui-with-a-remote-api-server), you must set the following environment variables (see link for instructions).

- `GALASA_DEV_TOKEN`: a token that the web UI uses in development mode to connect to a remote service.

- `GALASA_API_SERVER_URL`: the URL of your running Galasa service, e.g. `https://my-galasa-service.com/api`.

### NODE_EXTRA_CA_CERTS and NODE_USE_SYSTEM_CA

- If you want to connect to a remote Galasa service that requires certificates signed by internal or corporate CAs, then you'll need to set either NODE_EXTRA_CA_CERTS or NODE_USE_SYSTEM_CA (manual set up only) so that the frontend can trust the certificates.

- `NODE_EXTRA_CA_CERTS`: The path to a PEM file which should contain your intermediate and root CA certificates, e.g. `/Users/user_name/Galasa/certs.pem`.

- `NODE_USE_SYSTEM_CA` (only available to the manual approach): This tells the UI to trust server certificates if they are in the local system keychain, e.g. `NODE_USE_SYSTEM_CA=1`. This is OK for development purposes, but it is not advised to use this technique on a production deployment of a UI.

### SOURCE_MAVEN

- To build the webui, it needs to get the REST interface definition from somewhere, to generate stubs in order to make calling the REST API easy. Hence, we need to tell the build where to get this definition from. 
- If you don't have the `galasa` repository built locally, then the default behaviour is to refer to a hosted version - no need to do anything.
- If, on your machine, you do have a built `galasa` repository already, then the webui will attempt to find this in your `~/.m2` folder automatically. If for some reason it cannot, please set it as such:
```shell
export SOURCE_MAVEN="file://${HOME}/.m2/repository"
```
- If you would prefer to use a separate built version of your own then please set the `SOURCE_MAVEN` environment variable, for example:
```shell
export SOURCE_MAVEN="https://development.galasa.dev/main/maven-repo/obr"
```

## (1) Recommended set up (dev container)

1. Ensure environment variables from [Important Information](#important-information) are set if needed.
2. Install a code editor that has Dev Container support, in this setup we will be using Visual Studio Code.
3. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) VSCode extension by Microsoft.
4. Clone the repository.
5. Install and open a container engine, such as Docker Desktop, Rancher Desktop or Podman.
6. Run the project in a dev container via the VSCode extension.
- Note: Changing your environment variables will require you to restart VSCode for the changes to be reflected in the container.

## (2) Manual set up

1. Ensure environemnt variables from [Important Information](#important-information) are set.
2. Clone the repository.
3. Required items to install: Java, Gradle and Python. Please reference the [devcontainer.json](.devcontainer/devcontainer.json) for known compatible versions.
4. Run the `setup-locally.sh` script and follow instructions.

## To build

- Run the `build-locally.sh` script.

## To run development server locally

Either run:
- `run-locally.sh` or
- `npm run dev` (from inside the galasa-ui folder).

## Connecting the local development web UI with a remote API server

If you would like to run the web UI locally and have it connect to an existing Galasa service's backend, perform the following steps:

1. Make sure that you have access to an existing Galasa service and are able to log in to its web UI - if you do not have access, contact your Galasa service administrator.
2. Navigate to the remote Galasa service's webui and create a new personal access token. The personal access token value will be in the form `<string>:<string>` - note this token value down.
3. Set the `GALASA_DEV_TOKEN` environment variable, either in the terminal that you will use to start the webui or inside a new `.env.development.local` file, to be the personal access token that was just created.
    - For example, if your access token was `my:token`, you could create a new `.env.development.local` file next to the existing `.env` file and then set the environment variable in the file like `GALASA_DEV_TOKEN="my:token"`
4. Set the `GALASA_API_SERVER_URL` environment variable, either in the same terminal that you will use to start the webui or inside the `.env.development.local` file that you may have created in step 3, to be the URL of the remote Galasa service's API server.
    - For example, if the Galasa service's webui URL was `https://my-galasa-service.dev`, then the API server URL would be `https://my-galasa-service.dev/api` (added `/api` to the end of the URL)
5. Start the webui locally.

## Common problems when running the UI locally

### UNABLE_TO_VERIFY_LEAF_SIGNATURE error

If you are contacting a deployed Galasa service which uses a custom signing authority, then the https certificate used by the server may not be recognised by the web UI code and you will get an `UNABLE_TO_VERIFY_LEAF_SIGNATURE` error, resulting in a failure where the Web UI doesn't trust the connection with the server.

In such cases, you can do either of the following:

- (Only availble to the Manual Approach) Tell the Web UI to trust servers if their certificates are in the local host system certificate store.
Set an environment variable `export NODE_USE_SYSTEM_CA=1` which tells the UI to trust server certificates if they are in the local system keychain. Then re-start the web UI.
This is OK for development purposes, but it is not advised to use this technique on a production deployment of a UI.

- Tell the Web UI to trust servers using a specific set of certificates.
Create a `.pem` file containing the intermediate and root ca certificates used by the server. Set the env variable:
`export NODE_EXTRA_CA_CERTS=/path/to/your/certs.pem`, then re-start the web UI.

## How to contribute

See the [contributions.md](./CONTRIBUTIONS.md) file for terms and instructions.

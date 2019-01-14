# Installation Instructions

### Prerequisites

<<<<<<< HEAD
 - [sealog-server](https://github.com/webbpinner/sealog-server-alvin)
 - [nodeJS](https://nodejs.org)
 - [npm](https://www.npmjs.com)
 - [git](https://git-scm.com)
 
#### Installing NodeJS/npm on Ubuntu 16.04LTS
The standard Ubuntu repositories for Ubuntu 16.04 only provide install packages for NodeJS v4.  Sealog-client-jason (and Sealog-Server-Jason) require nodeJS >= v8.7
 
To install nodeJS v8.11 on Ubuntu 16.04LTS run the following commands:
 ```
sudo apt-get install curl build-essential
cd ~
curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt-get install nodejs

 ```

### Clone the repository

```
git clone https://github.com/webbpinner/sealog-client-alvin-topside.git
```

This should clone the repo to a directory called `sealog-client-alvin-topside`

### Create a new configuration file

```
cd ~/sealog-client-alvin-topside
cp ./src/url_config.js.dist ./src/url_config.js
```

### Modify the configuration file

Set the `API_ROOT_URL`, `WS_ROOT_URL`, `ROOT_PATH` and `IMAGES_PATH` values in the `./sealog-client/src/url_config.js` file to meet your specific installation requirements.

By default the file assumes the sealog-server is available on ports 8000/8001 on the same server that is hosting the sealog-server.  The default configuration file also assumes the client will be available from the root of the webserver.  If you want the webclient available at: `http://<serverIP>/sealog` you need to set `ROOT_PATH` to `/sealog/` (notice there is a starting `/` **AND** trailing `/`).

### Create a deployment file

```
cd ~/sealog-client-alvin-topside
cp ./webpack.js.dist ./webpack.js
```

If you are deploying the client to somewhere other than `http://<serverIP>/sealog` you need to set `ROOT_PATH` to the new location. (notice there is a starting `/` **AND** trailing `/`).

### Install the nodeJS modules

From a terminal run:
```
cd ~/sealog-client-alvin-topside
npm install
```

### Build the bundle.js file

From a terminal run:

```
cd ./sealog-client-alvin-topside
npm run build
```

### Configure Apache to host the client

Add the following to your Apache vhosts file:

```
  Alias /sealog /var/www/html/sealog
  <Directory "/var/www/html/sealog">
    AllowOverride all
  </Directory>
```

Create a symbolic link from the repository to the apache document root
```
sudo ln -s /home/sealog/sealog-client-alvin-topside/dist /var/www/html/sealog
```

You will need to tweak this configuration to match your exact installation.  This example assumes the client will live at `http://<serverIP>/sealog` and the git repo is located at: `/home/sealog/sealog-client-alvin-topside`

**Be sure to reload Apache for these changes to take affect.**

### Running in development mode ###
Optionally you can run the client using node's development web-server.  This removes the need to run Apache.  When run in development mode the client is only accessable from the local machine.

To run the client using development mode run the following commands in terminal:
```
cd <path_to>/sealog-client
npm start
```

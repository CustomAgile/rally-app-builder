# Rally App Builder

Rally App Builder is a [Node.js](http://nodejs.org/) command line utility for building apps using the [Rally App SDK](https://help.rallydev.com/apps/2.1/doc/).

## Installation

Rally App Builder is most easily used when installed globally:

`npm i -g rally-app-builder-ca`

However, if that does't work (permission errors, etc.) it can be installed locally as well:

`npm i rally-app-builder-ca`

## API

  Usage: rab-ca [command] [options]

  Commands:

    init [--name] [--sdk] [--server]
    Creates a new Rally App project

    build [--templates]
    Builds the current App

    run [--port]
    Starts a local server and launches the App in the default browser

    watch [--templates] [--ci]
    Automatically builds the App when files are changed

  Options:

    -h, --help     output usage information
    -v, --version  output the version number


## Commands

### init
`rab-ca init --name=myNewApp`
Creating a new Rally App is as easy as using init. The init command creates you a  After init creates your App it will automatically run the build command on it for you.

The init command takes a few parameters.  
*  name : The first is the name for your new App.
    *  `rab-ca init --name=myNewApp`
*  sdk(optional) : The version of the SDK your App will be created against.
    *  `rab-ca init --name=myNewApp --sdk=2.1`
*  server(optional) : The server you want the debug file to point to. The command below will create a new App using version 2.0 and pointing to the server myownRally.com
    *  `rab-ca init --name=myNewApp --sdk=2.1 --server=https://myOwnRally.com`

### build

Use the build command to compile your App into a single HTML page that can be copy and pasted into a Rally customer html [page](http://www.rallydev.com/custom-html)
Run this command before you check your file into source control or whenever you make a change to your config.json file.

The build command can optionally take a templates parameter to use custom html output templates.  Note this is an advanced usage and is generally not necessary unless you are trying to tweak the structure of the generated html output.

`rab-ca build --templates=./templates`

Also note this parameter can be specified in the config.json file as well.

#### Custom build steps

You can define pre and post build commands to be executed by adding them to your config.json. These can be used to extend and support the rally app build/concatenation steps. An example using grunt (which by default will run your tests):
```
{
   "scripts": {
      "prebuild": "./node_modules/.bin/grunt"
      "postbuild": "echo 'build completed'"
   }
}
```


### run
`rab-ca run`

The run command starts a local http server and launches your App-debug.html file in the default browser for quick an easy development.
By default the server listens on port 1337.  This can be changed as follows:

`rab-ca run --port=9999`

Depending on your Rally configuration, an API key might be required in order to load the Rally SDK and make calls to the Rally server.

[Generate an API Key here](https://rally1.rallydev.com/login)

Then place it in a `.env` file like so:

`API_KEY=_abcd1234`

and make sure `.env` is in your `.gitignore`!

### watch
`rab-ca watch [--templates] [--ci]`

The watch command listens for changes to app files and automatically rebuilds the app.
If the optional `--ci` flag is passed the tests will also be run.

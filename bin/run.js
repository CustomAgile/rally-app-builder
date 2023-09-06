import yargs from 'yargs/yargs';
import RallyAppBuilder from '../lib/index.js';

let errorHandler = function (error) {
  if (error) {
    console.error(`\r\n${error[0] || error}`);
    return console.error('\r\n** Build aborted due to error **');
  } else {
    return console.log('** Success **');
  }
};

let build = function (args) {
  let { templates } = args;
  console.log('** Compiling the App **');
  return RallyAppBuilder.build({ templates }, errorHandler);
};

let init = function (args) {
  let { name, sdk, server, templates } = args;
  name = args._[1] || name;
  let sdk_version = args._[2] || sdk;
  server = args._[3] || server;
  console.log('** Creating a new App **');
  return RallyAppBuilder.init({ name, sdk_version, server, templates }, function (error) {
    if (error) {
      return errorHandler(error);
    } else {
      console.log('Initialization complete. Run "npm install" and "rab-ca build" to complete the process');
      return;
    }
  });
};

let watch = function (args) {
  let { templates } = args;
  return RallyAppBuilder.watch({ templates });
};

let run = function (args) {
  let { port } = args;
  port = args._[1] || port;
  return RallyAppBuilder.run({ port });
};

yargs(process.argv.slice(2))
  .command(
    'init',
    'Creates a new Rally App project template.',
    {
      name: { alias: 'n', describe: 'The name of the app' },
      sdk: { alias: 's', describe: 'The SDK version to target', default: '2.1' },
      server: { alias: 'r', describe: 'The server to target' },
      templates: { alias: 't', describe: 'The path containing custom html output templates (advanced)' }
    },
    init
  )
  .command('build', 'Builds the current App.', { templates: { alias: 't', describe: 'The path containing custom html output templates (advanced)' } }, build)
  .command(
    'watch',
    'Watch the current app files for changes and automatically rebuild it.',
    {
      templates: { alias: 't', describe: 'The path containing custom html output templates (advanced)' }
    },
    watch
  )
  .command('run', 'Start a local server and launch the current app in the default browser.', { port: { alias: 'p', default: 1337, describe: 'The port on which to start the local http server' } }, run)
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version').argv;

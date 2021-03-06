let _ = require('lodash');
let fs = require('fs');
let path = require('path');
let mustache = require('mustache');

let files = {
  "app.css": "app.css",
  "App.js": "App.js",
  "config.json": "config.json",
  "gitignore": ".gitignore",
  "README.md": "README.md",
  "package.json": "package.json",
  "templates/App.html": "templates/App.html",
  "templates/App-debug.html": "templates/App-debug.html",
  "templates/App-external.html": "templates/App-external.html",
  "templates/App-uncompressed.html": "templates/App-uncompressed.html",
  ".jshintrc": ".jshintrc"
};

let directories = ["templates"];

module.exports = function (args, callback) {
  let error;
  callback = callback || function () { };
  try {
    args = _.defaults(args, {
      name: `Random App Name${Math.floor(Math.random() * 100000)}`,
      sdk_version: '2.1',
      server: 'https://rally1.rallydev.com',
      path: '.'
    }
    );
    let filePath = args.path;
    args.packageName = args.name.replace(/\s/g, '');
    let view = args;
    let templatePath = path.resolve(__dirname, '../templates/');

    _.each(directories,
      function (value) {
        if (!fs.existsSync(`${filePath}/${value}`)) {
          return fs.mkdirSync(`${filePath}/${value}`);
        }
      });

    _.each(files,
      function (value, key) {
        let templateFile = `${templatePath}/${key}`;
        let destinationFile = `${filePath}/${value}`;
        let file = fs.readFileSync(templateFile, "utf-8");
        // Don't parse templates
        if (key.indexOf('templates') > -1) {
          return fs.writeFileSync(destinationFile, file);
        }
        else {
          let parsed = mustache.render(file, view);
          return fs.writeFileSync(destinationFile, parsed);
        }
      });
  } catch (err) {
    error = err;
  }
  if (error) {
    return callback(error);
  } else {
    return callback();
  }
};

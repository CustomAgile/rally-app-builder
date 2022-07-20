let _ = require('lodash');
let fs = require('fs');
let path = require('path');
let async = require('async');
const { minify } = require('terser');
let { JSHINT } = require('jshint');
let css = require('./css');

let isScriptLocal = scriptName => !scriptName.match(/^.*\/\//);
let isScriptRemote = scriptName => !isScriptLocal(scriptName);

module.exports = {

  getFiles({ configJson, appPath }, callback) {
    let localFiles = _.filter(configJson.javascript, isScriptLocal);
    let localCssFiles = _.filter(configJson.css, isScriptLocal);
    return async.series({
      javascript_files: jsCallback => {
        return this.getJavaScripts({ appPath, scripts: localFiles, compress: true }, jsCallback);
      },
      uncompressed_javascript_files: jsCallback => {
        return this.getJavaScripts({ appPath, scripts: localFiles, compress: false }, jsCallback);
      },
      css_file_names: cssCallback => {
        return cssCallback(null, _.map(localCssFiles, css.getGeneratedFileName));
      },
      css_files: cssCallback => {
        return this.getStylesheets({ appPath, scripts: localCssFiles, compress: true }, cssCallback);
      },
      uncompressed_css_files: cssCallback => {
        return this.getStylesheets({ appPath, scripts: localCssFiles, compress: false }, cssCallback);
      },
      remote_css_files: remoteCssFilesCallback => {
        return remoteCssFilesCallback(null, _.filter(configJson.css, isScriptRemote));
      },
      remote_javascript_files: remoteJsFilesCallback => {
        return remoteJsFilesCallback(null, _.filter(configJson.javascript, isScriptRemote));
      },
      local_javascript_files: localJsFilesCallback => {
        return localJsFilesCallback(null, localFiles);
      },
      html_files: htmlFilesCallback => {
        return this.getScripts({ appPath, scripts: configJson.html }, htmlFilesCallback);
      }
    },
      callback);
  },

  getJavaScripts({ appPath, scripts, compress }, callback) {
    let jshintrc = path.resolve(appPath, '.jshintrc');
    return this.readFile(jshintrc, (e, jshintConfig) => {
      let jshintOptions = JSON.parse(jshintConfig || "{}");
      return this.getScripts({ appPath, scripts }, (err, results) => {
        if (err) {
          return callback(err);
        } else {
          let promises = [];
          for (let key in results) {
            let code = results[key];
            let fileName = scripts[key];
            if (!compress) { this.hintJavaScriptFile(code, jshintOptions, fileName); }
            if (compress) {
              try {
                promises.push(this.compressJavaScript(code).then((compressResults) => (results[key] = compressResults.code)));
              } catch (e) {
                console.error(`\r\nError in ${fileName} on line ${e.line}:`);
                console.error(e.message);
                callback(e);
                return;
              }
            } else {
              results[key] = code;
            }
          }
          return Promise.all(promises).then(() => callback(null, results));
        }
      });
    });
  },

  getStylesheets({ appPath, scripts, compress }, callback) {
    return this.getScripts({ appPath, scripts }, (err, results) => {
      if (err) {
        return callback(err);
      } else {
        return async.map(results, (cssCode, cb) => css.compile(cssCode, compress, cb)
          , callback);
      }
    });
  },

  getScripts({ appPath, scripts, compress }, callback) {
    let fullPathScripts = [];
    for (let script of Array.from(scripts || [])) {
      fullPathScripts.push(path.resolve(appPath, script));
    }
    return async.map(fullPathScripts, this.readFile, callback);
  },

  compressJavaScript(code) {
    return minify(code, { ecma: 2018 });
  },

  readFile: (file, callback) => {
    let wrapper = function (error, fileContents) {
      if (error) {
        error = new Error(`${file} could not be loaded. Is the path correct?`);
      }

      return callback(error, fileContents);
    };
    return fs.readFile(file, "utf-8", wrapper);
  },

  hintJavaScriptFile(code, jshintOptions, fileName) {
    if (fileName.indexOf('node_modules') > -1) {
      return;
    }
    if (!JSHINT(code, jshintOptions)) {
      console.error();
      for (let error of Array.from(JSHINT.errors)) {
        if (!!error) { console.error(`Error in ${fileName} on line ${error.line}: ${error.reason}`); }
      }
      return console.error();
    }
  }
};

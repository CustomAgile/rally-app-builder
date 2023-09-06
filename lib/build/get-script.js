import fs from 'fs';
import path from 'path';
import async from 'async';
import { minify } from 'terser';
import { JSHINT } from 'jshint';
import { compile } from './css.js';

let isScriptLocal = (scriptName) => !scriptName.match(/^.*\/\//);
let isScriptRemote = (scriptName) => !isScriptLocal(scriptName);

export const getFiles = ({ configJson, appPath }, callback) => {
  const localFiles = configJson.javascript.filter(isScriptLocal);
  const localCssFiles = configJson.css.filter(isScriptLocal);

  return async.series(
    {
      javascript_files: (jsCallback) => {
        return getJavaScripts({ appPath, scripts: localFiles, compress: true }, jsCallback);
      },
      uncompressed_javascript_files: (jsCallback) => {
        return getJavaScripts({ appPath, scripts: localFiles, compress: false }, jsCallback);
      },
      css_file_names: (cssCallback) => {
        return cssCallback(
          null,
          localCssFiles.map((css) => css.getGeneratedFileName)
        );
      },
      css_files: (cssCallback) => {
        return getStylesheets({ appPath, scripts: localCssFiles, compress: true }, cssCallback);
      },
      uncompressed_css_files: (cssCallback) => {
        return getStylesheets({ appPath, scripts: localCssFiles, compress: false }, cssCallback);
      },
      remote_css_files: (remoteCssFilesCallback) => {
        return remoteCssFilesCallback(null, configJson.css.filter(isScriptRemote));
      },
      remote_javascript_files: (remoteJsFilesCallback) => {
        return remoteJsFilesCallback(null, configJson.javascript.filter(isScriptRemote));
      },
      local_javascript_files: (localJsFilesCallback) => {
        return localJsFilesCallback(null, localFiles);
      },
      html_files: (htmlFilesCallback) => {
        return getScripts({ appPath, scripts: configJson.html }, htmlFilesCallback);
      }
    },
    callback
  );
};

export const getJavaScripts = ({ appPath, scripts, compress }, callback) => {
  let jshintrc = path.resolve(appPath, '.jshintrc');
  return readFile(jshintrc, (e, jshintConfig) => {
    let jshintOptions = JSON.parse(jshintConfig || '{}');
    return getScripts({ appPath, scripts }, (err, results) => {
      if (err) {
        return callback(err);
      } else {
        let promises = [];
        for (let key in results) {
          let code = results[key];
          let fileName = scripts[key];
          if (!compress) {
            hintJavaScriptFile(code, jshintOptions, fileName);
          }
          if (compress) {
            try {
              promises.push(compressJavaScript(code).then((compressResults) => (results[key] = compressResults.code)));
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
};

export const getStylesheets = ({ appPath, scripts, compress }, callback) => {
  return getScripts({ appPath, scripts }, (err, results) => {
    if (err) {
      return callback(err);
    } else {
      return async.map(results, (cssCode, cb) => compile(cssCode, compress, cb), callback);
    }
  });
};

export const getScripts = ({ appPath, scripts, compress }, callback) => {
  let fullPathScripts = [];
  for (let script of Array.from(scripts || [])) {
    fullPathScripts.push(path.resolve(appPath, script));
  }
  return async.map(fullPathScripts, readFile, callback);
};

export const compressJavaScript = (code) => {
  return minify(code, { ecma: 2018 });
};

export const readFile = (file, callback) => {
  let wrapper = function (error, fileContents) {
    if (error) {
      error = new Error(`${file} could not be loaded. Is the path correct?`);
    }

    return callback(error, fileContents);
  };
  return fs.readFile(file, 'utf-8', wrapper);
};

export const hintJavaScriptFile = (code, jshintOptions, fileName) => {
  if (fileName.indexOf('node_modules') > -1) {
    return;
  }
  if (!JSHINT(code, jshintOptions)) {
    console.error();
    for (let error of Array.from(JSHINT.errors)) {
      if (!!error) {
        console.error(`Error in ${fileName} on line ${error.line}: ${error.reason}`);
      }
    }
    return console.error();
  }
};

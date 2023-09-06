import fs from 'fs';
import pathUtils from 'path';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.API_KEY || '';
export const configFileName = 'config.json';

export const getApiKey = () => apiKey;

let convertToJson = function (callback) {
  return function (error, file) {
    if (!error) {
      let config = JSON.parse(file);
      callback(null, config);
    } else {
      callback(error);
    }
  };
};

export const getConfig = function (path, callback) {
  let configPath = pathUtils.join(path, configFileName);
  if (!fs.existsSync(configPath)) {
    console.log('A config.json not found using current directory');
    callback(null, process.cwd());
  } else {
    fs.readFile(configPath, 'utf-8', convertToJson(callback));
  }
};

export const getPackageJson = function (path, callback) {
  let packageJsonPath = pathUtils.join(path, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('A package.json not found using current directory');
    callback(null, { version: '' });
  } else {
    fs.readFile(packageJsonPath, 'utf-8', convertToJson(callback));
  }
};

export const getAppSourceRoot = (path, callback) =>
  getConfig(path, (err, config) => {
    let root = pathUtils.resolve(path);
    let localFiles = config.javascript.filter((jsFile) => !jsFile.match(/^.*\/\//));
    let dirNames = localFiles.map((appFilePath) => pathUtils.dirname(pathUtils.resolve(pathUtils.join(root, appFilePath))));
    while (!dirNames.every((dir) => dir.indexOf(root) === 0)) {
      root = pathUtils.resolve(root, '..');
    }
    callback(null, root);
  });

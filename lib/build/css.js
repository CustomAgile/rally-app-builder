import less from 'less';
import fs from 'fs';
let LESS_FILE_REGEX = /[.]less$/;
const VARS = { prefix: 'x-' };

export const isLessFile = (cssName) => cssName.match(LESS_FILE_REGEX);

export const getGeneratedFileName = (cssFile) => cssFile.replace(LESS_FILE_REGEX, '.less.css');

export const compile = function (cssCode, compress, callback) {
  Object.entries(VARS).forEach(([key, value]) => (cssCode += `\n@${key}: ${value};`));
  return less.render(cssCode, (err, output) => {
    if (err) {
      return callback(err);
    } else {
      return callback(null, output.css);
    }
  });
};
//todo: figure out how to not strip out comments

export const compileInPlace = function (file, compress, callback) {
  if (isLessFile(file)) {
    return fs.readFile(file, 'utf-8', function (err, contents) {
      if (err) {
        return callback(err);
      } else {
        return compile(contents, compress, function (e, css) {
          let fileName = getGeneratedFileName(file);
          return fs.writeFile(fileName, css, (badThing) => callback(badThing, fileName));
        });
      }
    });
  } else {
    return callback(null, file);
  }
};

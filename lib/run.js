import open from 'open';
import express from 'express';
import path from 'path';
import { getAppSourceRoot } from './config.js';

const app = express();

export default function run(args) {
  let appPath = args.path || process.cwd();
  return getAppSourceRoot(appPath, (error, srcRoot) => {
    let pathToApp = path.relative(srcRoot, appPath);
    if (pathToApp) {
      pathToApp = `/${pathToApp}`;
    }
    app.use(express.static(srcRoot));
    app.listen(args.port, (err) => {
      if (!err) return;
      console.error('Error in server start');
      console.error(err);
    });
    let url = `http://localhost:${args.port}${pathToApp}/App-debug.html`;
    console.log(`Launching ${url} from ${srcRoot}`);
    return open(url);
  });
}

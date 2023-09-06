import chokidar from 'chokidar';
import build from './build/index.js';
import { getAppSourceRoot } from './config.js';

let watcher = null;

let onChange = function onChange(args) {
  console.log('Rebuilding...\n');
  let path = process.cwd();
  let { templates, ci } = args;
  watcher.close();
  return build({ templates, path }, (err) => {
    if (err) {
      console.error('Error in watch (onChange):', err);
    }
    return watch({ templates });
  });
};

export default function watch(args) {
  let { templates } = args;
  console.log('\nWatching for changes...');
  let appPath = args.path || process.cwd();
  return getAppSourceRoot(appPath, (error, srcRoot) => {
    if (error) {
      console.error('Error in watch:', error);
    }
    watcher = chokidar.watch(srcRoot, { ignored: '**/*.html', usePolling: true, interval: 500 });
    return watcher.on('change', (path) => {
      console.log('\nChange detected:', path);
      return onChange({ templates });
    });
  });
}

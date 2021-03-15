const { execSync } = require('child_process')
const bs = require('browser-sync').create()
const settings = require('../settings.json')

const ignored = new RegExp([
  settings.exportDirectory,
  'node_modules',
  '.git',
  '.DS_Store',
  'package.json',
  'package-lock.json'
].join('|'))

const watchOptions = {
  ignored,
  ignoreInitial: true
}

bs.watch('.', watchOptions, (e, file) => {
  console.log('Changed:', file)
  execSync('node ./_scripts/build.js', {
    stdio: [process.stdin, process.stdout, process.stderr]
  })
  console.log('Rebuilt.')
  bs.reload()
});

bs.init({
  server: '_site',
  watch: true,
  ui: false
});

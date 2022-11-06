const { execSync } = require('child_process')
const bs = require('browser-sync').create()
const writSettings = require('./writ-settings.json')

const watchOptions = {
  ignoreInitial: true,
  ignored: new RegExp(
    [
      writSettings.exportDirectory,
      'node_modules',
      '.git',
      '.DS_Store',
      'package.json',
      'package-lock.json',
      '_scripts'
    ].join('|')
  )
}

bs.watch('.', watchOptions, (e, file) => {
  console.log('Changed:', file)
  execSync('node ./_scripts/build.js', {
    stdio: [process.stdin, process.stdout, process.stderr]
  })
  bs.reload()
});

bs.init({
  server: writSettings.exportDirectory,
  watch: true,
  ui: false
});

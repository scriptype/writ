const { execSync } = require('child_process')
const bs = require('browser-sync').create()
const compile = require('writ-cms')
const settings = require('./settings.json')

const watchOptions = {
  ignoreInitial: true,
  ignored: new RegExp(
    [
      settings.exportDirectory,
      'node_modules',
      '.git',
      '.DS_Store',
      'package.json',
      'package-lock.json',
      '_scripts'
    ].join('|')
  )
}

let compilePromise = compile(settings)

bs.watch('.', watchOptions, (e, file) => {
  console.log('Changed:', file)
  compilePromise = compilePromise.then(() => compile(settings))
  bs.reload()
});

bs.init({
  server: settings.exportDirectory,
  watch: true,
  ui: false
});

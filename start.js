const bs = require('browser-sync').create()
const _ = require('lodash')
const { execSync } = require('child_process')
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

bs.watch('.', watchOptions, _.debounce((e, file) => {
  console.log('Changed:', file)
  compilePromise = compilePromise.then(() => compile(settings))
  bs.reload()
}, 100));

bs.init({
  server: settings.exportDirectory,
  watch: true,
  ui: false
});

const _ = require('lodash')
const settingsJSON = require('../settings.json')

const defaultPaths = {
  exportDirectory: '_site',
  categoriesDirectory: '.',
  assetsDirectory: 'assets',
  pagesDirectory: 'pages',
  ignorePaths: []
}

// Allow paths to be defined without a parent "paths" object in settings.json
const defaultSettings = {
  ...defaultPaths,
  site: {
    title: 'Blog',
    description: 'My new blog'
  },
}

const settings = Object.assign({}, defaultSettings, settingsJSON)

const paths = {
  SITE: settings.exportDirectory,
  POSTS_JSON: `${settings.exportDirectory}/posts.json`,
  CATEGORIES: settings.categoriesDirectory,
  ASSETS: settings.assetsDirectory,
  SUBPAGES: settings.pagesDirectory,
  IGNORE: settings.ignorePaths,
  IGNORE_REG_EXP: new RegExp((settings.ignorePaths).join('|'))
}

module.exports = {
  // Avoid having duplicate of paths
  settings: _.omit(settings, Object.keys(defaultPaths)),
  paths
}

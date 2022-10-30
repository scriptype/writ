const settingsJSON = require('../settings.json')

const defaultSettings = {
  site: {
    title: 'Blog',
    description: 'My new blog'
  },
  exportDirectory: '_site',
  ignorePaths: []
}

const settings = Object.assign({}, defaultSettings, settingsJSON)
const SITE_DIR = settings.exportDirectory
const CATEGORY_FILE = settings.categoryFile
const POSTS_JSON_PATH = `${SITE_DIR}/posts.json`
const EXCLUDED_PATHS = new RegExp(settings.ignorePaths.join('|'))

module.exports = {
  settings,
  SITE_DIR,
  POSTS_JSON_PATH,
  EXCLUDED_PATHS
}

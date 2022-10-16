const settings = require('../settings.json')

const SITE_DIR = settings.exportDirectory || '_site'

module.exports = {
  settings,
  SITE_DIR,
  CATEGORY_INFO_FILE: settings.categoryInfoFile || 'category-info.json',
  POSTS_JSON_PATH: `${SITE_DIR}/posts.json`,
  EXCLUDED_PATHS: new RegExp(settings.ignorePaths.join('|')),
}

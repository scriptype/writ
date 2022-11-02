const { join } = require('path')
const { settings, paths } = require('../settings')
const { render } = require('../rendering')

const compileCategoryPages = (categories) => {
  categories.forEach(category => {
    render({
      content: '{{>category}}',
      path: join(paths.SITE, category.name, 'index.html'),
      data: {
        site: settings.site,
        category,
        posts: category.posts
      }
    })
  })
}

module.exports = {
  compile: compileCategoryPages
}

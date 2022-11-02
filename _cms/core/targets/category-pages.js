const { join } = require('path')
const { settings, paths } = require('../settings')
const { render } = require('../rendering')

const compileCategoryPages = ({ categories, categoryTree }) => {
  categories.forEach(category => {
    render({
      content: '{{>category}}',
      path: join(paths.SITE, category.name, 'index.html'),
      data: {
        site: settings.site,
        category,
        posts: categoryTree[category.slug]
      }
    })
  })
}

module.exports = {
  compile: compileCategoryPages
}

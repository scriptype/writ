const fs = require('fs')
const path = require('path')
const { settings, SITE_DIR } = require('../settings')
const { render } = require('../rendering')

const compileCategoryPages = ({ categories, categoryTree }) => {
  categories.forEach(category => {
    const indexFilePath = path.join(SITE_DIR, category.path, 'index.html')
    render({
      content: '{{>category}}',
      path: indexFilePath,
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

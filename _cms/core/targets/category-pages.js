const fs = require('fs')
const path = require('path')
const { settings, SITE_DIR, CATEGORY_FILE } = require('../settings')
const { render } = require('../rendering')

const compileCategoryPages = ({ categories, posts }) => {
  categories.forEach(category => {
    const categoryIndexFilePath = path.format({
      dir: path.join(SITE_DIR, category.name),
      name: 'index',
      ext: '.html'
    })
    const categoryFilePath = path.join(SITE_DIR, category.name, CATEGORY_FILE)
    render({
      content: '{{>category}}',
      path: categoryIndexFilePath,
      data: {
        site: settings.site,
        category,
        posts: posts[category.slug]
      }
    })
    fs.rmSync(categoryFilePath)
  })
}

module.exports = {
  compile: compileCategoryPages
}

const fs = require('fs')
const { settings, SITE_DIR, CATEGORY_FILE } = require('../settings')
const { render } = require('../rendering')

const compileCategoryPages = ({ categories, posts }) => {
  categories.forEach(category => {
    render({
      content: '{{>category}}',
      path: `${SITE_DIR}/${category.name}/index.html`,
      data: {
        site: settings.site,
        category,
        posts: posts[category.slug]
      }
    })
    fs.rmSync(`${SITE_DIR}/${category.name}/${CATEGORY_FILE}`)
  })
}

module.exports = {
  compile: compileCategoryPages
}

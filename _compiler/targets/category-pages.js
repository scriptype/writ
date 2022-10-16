const fs = require('fs')
const { settings, SITE_DIR, CATEGORY_INFO_FILE } = require('../settings')

const compileCategoryPages = ({ categories, posts }, render) => {
  categories.forEach(category => {
    render({
      content: '{{>category}}',
      path: `${SITE_DIR}/${category.slug}/index.html`,
      data: {
        site: settings.site,
        category,
        posts: posts[category.slug]
      }
    })
    fs.rmSync(`${SITE_DIR}/${category.slug}/${CATEGORY_INFO_FILE}`)
  })
}

module.exports = {
  compile: compileCategoryPages
}

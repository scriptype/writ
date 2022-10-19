const { settings, SITE_DIR } = require('../settings')

const compileHomePage = ({ categories, posts }, render) => {
  render({
    content: '{{>index}}',
    path: `${SITE_DIR}/index.html`,
    data: {
      site: settings.site,
      posts,
      categories
    }
  })
}

module.exports = {
  compile: compileHomePage
}

const fs = require('fs')
const Handlebars = require('handlebars')
const helpers = require('./helpers')
const { readFileContent } = require('../helpers/fs')

const registerHelpers = () => {
  Object.keys(helpers).forEach((key) => {
    Handlebars.registerHelper(key, helpers[key])
  })
}

const registerPartials = () => {
  fs.readdirSync('./_partials').forEach(path => {
    const name = path.replace('.hbs', '')
    Handlebars.registerPartial(name, readFileContent(`./_partials/${path}`))
  })
}

const init = () => {
  registerHelpers()
  registerPartials()
}

const render = ({ content, path, data }) => {
  const template = Handlebars.compile(content)
  const output = template(data || {})
  fs.writeFileSync(path, output)
  console.log('created:', path)
  return output
}

module.exports = {
  init,
  render
}

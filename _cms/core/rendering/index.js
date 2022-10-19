const fs = require('fs')
const Handlebars = require('handlebars')
const handlebarsHelpers = require('./handlebars-helpers')
const { readFileContent } = require('../helpers/fs')

const PARTIALS_PATH = './_cms/partials'

const registerHelpers = () => {
  Object.keys(handlebarsHelpers).forEach((key) => {
    Handlebars.registerHelper(key, handlebarsHelpers[key])
  })
}

const registerPartials = () => {
  fs.readdirSync(PARTIALS_PATH).forEach(path => {
    const name = path.replace('.hbs', '')
    Handlebars.registerPartial(name, readFileContent(`${PARTIALS_PATH}/${path}`))
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
  console.log('rendered:', path)
  return output
}

const isTemplate = path => path.match(/.hbs$/)
const isIndexTemplate = path => path.match(/index.hbs$/)
const getOutputPath = path => path.replace('.hbs', '.html')
const getMetaBlock = content => content.match(/\{\{.*\n.*=".*"\n\}\}/gs)[0]
const getTemplateMetadata = (content) => {
  const metaBlock = getMetaBlock(content)
  return metaBlock
    .match(/.*=.*/g)
    .map(s => s
      .trim()
      .split('=')
      .map(k => k.replace(/"/g, ''))
    )
    .reduce((acc, tuple) => ({
      ...acc,
      [tuple[0]]: tuple[1]
    }), {})
}

module.exports = {
  init,
  render,
  isTemplate,
  isIndexTemplate,
  getOutputPath,
  getMetaBlock,
  getTemplateMetadata
}

const fs = require('fs')
const { format, basename, extname, join } = require('path')
const Handlebars = require('handlebars')
const handlebarsHelpers = require('./handlebars-helpers')
const { readFileContent } = require('../helpers/fs')

const PARTIALS_PATH = join('_cms', 'partials')

const registerHelpers = () => {
  Object.keys(handlebarsHelpers).forEach((key) => {
    Handlebars.registerHelper(key, handlebarsHelpers[key])
  })
}

const registerPartials = () => {
  fs.readdirSync(PARTIALS_PATH).forEach(path => {
    const name = path.replace(extname(path), '')
    const partialsPath = join(PARTIALS_PATH, path)
    Handlebars.registerPartial(name, readFileContent(partialsPath))
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

const READ_MORE_DIVIDER = '{{seeMore}}'
const INDEX_TEMPLATE_FILE_NAME = format({ name: 'index', ext: '.hbs'})
const isTemplate = path => extname(path) === '.hbs'
const isIndexTemplate = path => basename(path) === INDEX_TEMPLATE_FILE_NAME
const getOutputPath = path => path.replace(new RegExp(extname(path) + '\$'), '.html')
const getMetaBlock = content => content.match(/\{\{.*\n.*=".*"\n\}\}/gs)[0]
const getContent = content => content.match(/\n\}\}\n(.*)\{\{\/.*\}\}\n$/s)[1]

const getPartialType = (content, metaBlock) => {
  return (metaBlock || getMetaBlock(content)).match(/\{\{#>(.*)/)[1].trim()
}

const getTemplateMetadata = (content, metaBlock) => {
  return (metaBlock || getMetaBlock(content))
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

const parseTemplate = (content) => {
  const metaBlock = getMetaBlock(content)
  return {
    type: getPartialType(content, metaBlock),
    content: getContent(content),
    metadata: getTemplateMetadata(content, metaBlock)
  }
}

module.exports = {
  init,
  render,
  isTemplate,
  READ_MORE_DIVIDER,
  INDEX_TEMPLATE_FILE_NAME,
  isIndexTemplate,
  getOutputPath,
  getMetaBlock,
  getContent,
  getPartialType,
  getTemplateMetadata,
  parseTemplate
}

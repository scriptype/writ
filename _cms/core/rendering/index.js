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

const READ_MORE_DIVIDER = '{{seeMore}}'
const INDEX_TEMPLATE_FILE_NAME = 'index.hbs'
const isTemplate = path => path.match(/.hbs$/)
const isIndexTemplate = path => path.match(/index.hbs$/)
const getOutputPath = path => path.replace(/\.hbs$/, '.html')
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

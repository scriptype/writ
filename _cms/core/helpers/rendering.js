const { format, basename, extname } = require('path')

const READ_MORE_DIVIDER = '{{seeMore}}'
const INDEX_TEMPLATE_FILE_NAME = format({ name: 'index', ext: '.hbs'})
const SUBFOLDER_POST_FILE_NAME = format({ name: 'post', ext: '.hbs'})

const isTemplate = (path) => {
  return extname(path) === '.hbs'
}

const isIndexTemplate = (path) => {
  return basename(path) === INDEX_TEMPLATE_FILE_NAME
}

const getPostNameFromTemplateFileName = (fileName) => {
  return fileName.replace(extname(fileName), '')
}

const getOutputPath = (path) => {
  let newPath = path
  if (basename(path) === SUBFOLDER_POST_FILE_NAME) {
    newPath = path.replace(new RegExp(basename(path)), 'index.html')
  }
  return newPath.replace(new RegExp(extname(path) + '\$'), '.html')
}

const getSubPageOutputPath = (path) => {
  return path
    .replace(new RegExp(extname(path) + '\$'), '.html')
    .replace(/^pages\//, '')
}

const getMetaBlock = (content) => {
  return content.match(/\{\{.*\n.*=".*"\n\}\}/gs)[0]
}

const getContent = (content) => {
  return content.match(/\n\}\}\n(.*)\{\{\/.*\}\}\n$/s)[1]
}

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
  isTemplate,
  READ_MORE_DIVIDER,
  INDEX_TEMPLATE_FILE_NAME,
  SUBFOLDER_POST_FILE_NAME,
  isIndexTemplate,
  getPostNameFromTemplateFileName,
  getOutputPath,
  getSubPageOutputPath,
  getMetaBlock,
  getContent,
  getPartialType,
  getTemplateMetadata,
  parseTemplate
}

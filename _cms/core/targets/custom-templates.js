const fs = require('fs')
const { settings, SITE_DIR } = require('../settings')
const { readFileContent, isDirectory, isInCategory } = require('../helpers/fs')
const { isTemplate, isIndexTemplate, getOutputPath, getTemplateMetadata } = require('../rendering')

const indexCustomTemplates = (directory, customTemplates = []) => {
  const paths = fs.readdirSync(directory).map(path => `${directory}/${path}`)
  const isCategoryDirectory = isInCategory(directory)
  const templates = paths.filter(isTemplate).filter(path => {
    if (isCategoryDirectory) {
      return !isIndexTemplate(path)
    }
    return true
  })
  customTemplates.push(...templates)
  paths.filter(isDirectory).forEach(dir => {
    indexCustomTemplates(dir, customTemplates)
  })
  return customTemplates
}

const getTemplateData = (content) => {
  const { date, ...customMetadata } = getTemplateMetadata(content)
  return {
    ...customMetadata,
    publishedAt: new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
  }
}

const compileCustomTemplates = (paths, render) => {
  paths.forEach(path => {
    const content = readFileContent(path)
    const templateData = getTemplateData(content)
    const outputPath = getOutputPath(path)
    render({
      content,
      path: outputPath,
      data: {
        site: settings.site,
        ...templateData
      }
    })
    console.log('custom template created:', outputPath)
    fs.rmSync(path)
  })
}

module.exports = {
  compile(render) {
    const indexedCustomTemplates = indexCustomTemplates(SITE_DIR)
    return compileCustomTemplates(indexedCustomTemplates, render)
  }
}

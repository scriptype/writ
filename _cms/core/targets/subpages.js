const fs = require('fs')
const { settings } = require('../settings')
const { readFileContent } = require('../helpers/fs')
const { render, getOutputPath, getTemplateMetadata } = require('../rendering')

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

const compileSubPages = (paths) => {
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
    console.log('subpage created:', outputPath)
    fs.rmSync(path)
  })
}

module.exports = {
  compile: compileSubPages
}

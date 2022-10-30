const fs = require('fs')
const { join } = require('path')
const { settings, SITE_DIR } = require('../settings')
const { readFileContent } = require('../helpers/fs')
const { render, getSubPageOutputPath, getOutputPath, getTemplateMetadata } = require('../rendering')

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

const compileSubPages = (subPagePaths) => {
  subPagePaths.forEach(path => {
    const content = readFileContent(path)
    const templateData = getTemplateData(content)
    const outputPath = join(SITE_DIR, getSubPageOutputPath(path))
    render({
      content,
      path: outputPath,
      data: {
        site: settings.site,
        ...templateData
      }
    })
    console.log('subpage rendered:', outputPath)
  })
}

module.exports = {
  compile: compileSubPages
}

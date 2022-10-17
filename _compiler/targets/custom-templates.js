const fs = require('fs')
const { settings, CATEGORY_INFO_FILE, SITE_DIR } = require('../settings')
const { readFileContent } = require('../helpers/fs')

const indexCustomTemplates = (parentDir, wasCategory, pathList = []) => {
  const paths = fs.readdirSync(parentDir).map(p => `${parentDir}/${p}`)
  const templates = paths.filter(p => p.match(/.hbs$/) && (!wasCategory || !p.match(/index.hbs/)))
  pathList.push(...templates)
  const directories = paths.filter(p => fs.lstatSync(p).isDirectory())
  const isCategory = paths.some(p => p.match(CATEGORY_INFO_FILE))
  directories.forEach(dir => {
    indexCustomTemplates(dir, isCategory, pathList)
  })
  return pathList
}

const parseTemplateData = (content) => {
  const metaBlock = content.match(/\{\{.*\n.*=".*"\n\}\}/gs)[0]
  const type = metaBlock.match(/\{\{#>(.*)/)[1].trim()
  const { date, ...customMetadata } = metaBlock
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
    const templateData = parseTemplateData(content)
    render({
      content,
      path: path.replace('.hbs', '.html'),
      data: {
        site: settings.site,
        ...templateData
      }
    })
    console.log('created:', path.replace('.hbs', '.html'))
    fs.rmSync(path)
  })
}

module.exports = {
  compile(render) {
    const indexedCustomTemplates = indexCustomTemplates(SITE_DIR)
    return compileCustomTemplates(indexedCustomTemplates, render)
  }
}

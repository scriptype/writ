#!/usr/bin/env node
const fs = require('fs')
const { execSync } = require('child_process')
const Handlebars = require('handlebars')

const SITE_DIR = '_site'

const EXCLUDED_PATHS = /(node_modules|package.json|package-lock.json|.git|.DS_Store|.gitignore|_.*)/

const isContentDirectory = (path) => {
  const isDirectory = fs.lstatSync(path).isDirectory()
  const isNotMeta = !path.includes('_') && !path.includes('.')
  return isDirectory && isNotMeta
}

const readFileContent = (path) => fs.readFileSync(path, { encoding: 'utf-8' })

const helpers = {
  multiLineTextList(string) {
    return string
      .split('\n')
      .map(s => s.trim())
          .filter(Boolean)
      .map(s => `<li>${Handlebars.escapeExpression(s)}</li>`)
      .join('\n')
  },

  seeMore() {
    return ''
  }
}

Object.keys(helpers).forEach((key) => {
  Handlebars.registerHelper(key, helpers[key])
})

const partials = {
  ['text-post']: readFileContent('./_partials/text-post.hbs'),
  category: readFileContent('./_partials/category.hbs'),
  index: readFileContent('./_partials/index.hbs'),
  search: readFileContent('./_partials/search.hbs'),
}

Object.keys(partials).forEach((key) => {
  Handlebars.registerPartial(key, partials[key])
})

try {
  execSync(`rm -rf ${SITE_DIR}`)
} catch (e) {
  console.log('e', e)
} finally {
  fs.mkdirSync(SITE_DIR)
}

const allPaths = fs.readdirSync('.')

const pathsToCopy = allPaths.filter(p => !p.match(EXCLUDED_PATHS))

pathsToCopy.forEach(path => {
  execSync(`cp -R ${path} ${SITE_DIR}`)
})

const categories = allPaths.filter(isContentDirectory)

const posts = categories.reduce((postsList, category) => {
  const categoryPostDirs = fs.readdirSync(category).filter(d => isContentDirectory(`${category}/${d}`))
  const categoryPosts = []
  categoryPostDirs.forEach(postDir => {
    const templateFiles = fs.readdirSync(`${category}/${postDir}`).filter(p => p.match(/.hbs$/))
    templateFiles.forEach(f => {
      const content = readFileContent(`${category}/${postDir}/${f}`)
      const template = Handlebars.compile(content)
      const output = template()
      const newFileName = f.replace('.hbs', '.html')
      fs.writeFileSync(`${SITE_DIR}/${category}/${postDir}/${newFileName}`, output)
      fs.rmSync(`${SITE_DIR}/${category}/${postDir}/${f}`)
      console.log('created:', `${SITE_DIR}/${category}/${postDir}/${newFileName}`)
      if (newFileName === 'index.html') {
        categoryPosts.push({
          title: content.match(/title="(.*)"/)[1],
          createdAt: new Date(content.match(/writ="(.*)"/)[1]),
          tags: content.match(/keys="(.*)"/)[1],
          content: content.match(/\n\}\}\n(.*)\{\{\/.*\}\}\n$/s)[1],
          get summary() {
            const indexOfSeeMore = this.content.indexOf('{{seeMore}}')
            if (indexOfSeeMore === -1) {
              return this.content
            }
            return this.content.substring(0, indexOfSeeMore)
          },
          permalink: `/${category}/${postDir}`,
          output,
          category
        })
      }
    })
  })

  categoryPosts.sort((a, b) => b.createdAt - a.createdAt)

  const categoryIndexContent = `{{#>category posts=posts}}{{/category}}`
  const categoryIndexTemplate = Handlebars.compile(categoryIndexContent)
  const categoryIndexOutput = categoryIndexTemplate({
    posts: categoryPosts
  })
  fs.writeFileSync(`${SITE_DIR}/${category}/index.html`, categoryIndexOutput)
  console.log('created:', `${SITE_DIR}/${category}/index.html`)

  return [
    ...postsList,
    ...categoryPosts
  ]
}, [])

const indexContent = `{{#>index posts=posts}}{{/index}}`
const indexTemplate = Handlebars.compile(indexContent)
const indexOutput = indexTemplate({ posts })
fs.writeFileSync(`${SITE_DIR}/index.html`, indexOutput)
console.log('created:', `${SITE_DIR}/index.html`)

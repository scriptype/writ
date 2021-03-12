#!/usr/bin/env node
const fs = require('fs')
const { execSync } = require('child_process')
const Handlebars = require('handlebars')

const SITE_DIR = '_site'
const EXCLUDED_PATHS = /(node_modules|package.json|package-lock.json|.git|.DS_Store|.gitignore|_.*)/

const readFileContent = (path) => fs.readFileSync(path, { encoding: 'utf-8' })

const isContentDirectory = (path) => {
  const isDirectory = fs.lstatSync(path).isDirectory()
  const isNotMeta = !path.includes('_') && !path.includes('.')
  return isDirectory && isNotMeta
}

const mkSiteDir = () => {
  try {
    execSync(`rm -rf ${SITE_DIR}`)
  } catch (e) {
    console.log('mkSiteDir error:', e)
  } finally {
    fs.mkdirSync(SITE_DIR)
  }
}

const cpPaths = (paths) => {
  paths
    .filter(p => !p.match(EXCLUDED_PATHS))
    .forEach(path => execSync(`cp -R ${path} ${SITE_DIR}`))
}

const parsePostData = ({ content, output, category, postDir }) => {
  return {
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
    permalink: `/${category.slug}/${postDir}`,
    output,
    category
  }
}

const parseCategoryData = ({ indexContent, categoryName }) => {
  return {
    name: indexContent.match(/name="(.*)"/)[1],
    slug: categoryName,
    permalink: `/${categoryName}`,
    visible: true,
    indexContent
  }
}

const compileTemplate = ({ content, path, data }) => {
  const template = Handlebars.compile(content)
  const output = template(data || {})
  fs.writeFileSync(path, output)
  console.log('created:', path)
  return output
}

const compilePost = ({ path }) => {
  const content = readFileContent(path)
  const newPath = path.replace(/\.hbs$/, '.html')
  const output = compileTemplate({
    content,
    path: `${SITE_DIR}/${newPath}`
  })
  fs.rmSync(`${SITE_DIR}/${path}`)
  return {
    output,
    content
  }
}

const compileCategory = (category, posts) => {
  return compileTemplate({
    content: category.indexContent,
    path: `${SITE_DIR}/${category.slug}/index.html`,
    data: { posts }
  })
}

const compileIndex = (data) => {
  return compileTemplate({
    content: '{{#>index posts=posts}}{{/index}}',
    path: `${SITE_DIR}/index.html`,
    data
  })
}

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

fs.readdirSync('./_partials').forEach(path => {
  const name = path.replace('.hbs', '')
  Handlebars.registerPartial(name, readFileContent(`./_partials/${path}`))
})

const allPaths = fs.readdirSync('.')

mkSiteDir()
cpPaths(allPaths)

const categories = allPaths
  .filter(isContentDirectory)
  .map(categoryName => {
    const paths = fs.readdirSync(categoryName)
    if (!paths.includes('index.hbs')) {
      return {
        name: '',
        slug: categoryName,
        visible: false
      }
    }
    const indexContent = readFileContent(`${categoryName}/index.hbs`)
    return parseCategoryData({
      indexContent,
      categoryName
    })
  })

const posts = categories.reduce((acc, category) => {
  const categoryPostDirs = fs.readdirSync(category.slug).filter(d => isContentDirectory(`${category.slug}/${d}`))
  const categoryPosts = []
  categoryPostDirs.forEach(postDir => {
    fs.readdirSync(`${category.slug}/${postDir}`)
      .filter(p => p.match(/.hbs$/))
      .forEach(postFilePath => {
        const { output, content } = compilePost({
          path: `${category.slug}/${postDir}/${postFilePath}`
        })
        if (category.visible && postFilePath === 'index.hbs') {
          categoryPosts.push(
            parsePostData({
              content,
              output,
              category,
              postDir
            })
          )
        }
      })
  })

  categoryPosts.sort((a, b) => b.createdAt - a.createdAt)

  if (category.visible) {
    compileCategory(category, categoryPosts)
  }

  return [
    ...acc,
    ...categoryPosts
  ]
}, [])

compileIndex({
  categories: categories.filter(c => c.visible),
  posts
})

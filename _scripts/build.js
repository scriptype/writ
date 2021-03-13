#!/usr/bin/env node
const fs = require('fs')
const { execSync } = require('child_process')
const Handlebars = require('handlebars')

const settings = require('../settings.json')

const SITE_DIR = settings.exportDirectory || '_site'
const CATEGORY_INFO_FILE = settings.categoryInfoFile || 'category-info.json'
const EXCLUDED_PATHS = new RegExp(settings.ignorePaths.join('|'))

const readFileContent = (path) => fs.readFileSync(path, { encoding: 'utf-8' })

const isContentDirectory = (path) => {
  const isDirectory = fs.lstatSync(path).isDirectory()
  const isNotMeta = !path.includes('_') && !path.includes('.')
  return isDirectory && isNotMeta
}

const mkSiteDir = () => {
  if (SITE_DIR === '.' || SITE_DIR === '/' || SITE_DIR === '~') {
    throw new Error(`Dangerous export directory: "${SITE_DIR}". Won't continue.`)
  }
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
    publishedAt: new Date(content.match(/date="(.*)"/)[1]),
    tags: content.match(/tags="(.*)"/)[1],
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

const compileTemplate = ({ content, path, data }) => {
  const template = Handlebars.compile(content)
  const output = template(data || {})
  fs.writeFileSync(path, output)
  console.log('created:', path)
  return output
}

const compilePost = ({ path, data }) => {
  const content = readFileContent(path)
  const newPath = path.replace(/\.hbs$/, '.html')
  const output = compileTemplate({
    content,
    path: `${SITE_DIR}/${newPath}`,
    data
  })
  fs.rmSync(`${SITE_DIR}/${path}`)
  return {
    output,
    content
  }
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
  .map(categorySlug => {
    const paths = fs.readdirSync(categorySlug)
    if (!paths.includes(CATEGORY_INFO_FILE)) {
      return {
        name: '',
        slug: categorySlug,
        visible: false
      }
    }
    const info = require(`../${categorySlug}/${CATEGORY_INFO_FILE}`)
    return {
      name: info.name,
      slug: categorySlug,
      permalink: `/${categorySlug}`,
      visible: true
    }
  })

const posts = categories.reduce((acc, category) => {
  const categoryPostDirs = fs.readdirSync(category.slug).filter(d => isContentDirectory(`${category.slug}/${d}`))
  const categoryPosts = []
  categoryPostDirs.forEach(postDir => {
    fs.readdirSync(`${category.slug}/${postDir}`)
      .filter(p => p.match(/.hbs$/))
      .forEach(postFilePath => {
        const { output, content } = compilePost({
          path: `${category.slug}/${postDir}/${postFilePath}`,
          data: {
            site: settings.site,
            category
          }
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

  categoryPosts.sort((a, b) => b.publishedAt - a.publishedAt)

  if (category.visible) {
    compileTemplate({
      content: '{{>category}}',
      path: `${SITE_DIR}/${category.slug}/index.html`,
      data: {
        site: settings.site,
        category,
        posts: categoryPosts
      }
    })
  }

  return [
    ...acc,
    ...categoryPosts
  ]
}, [])

compileTemplate({
  content: '{{>index}}',
  path: `${SITE_DIR}/index.html`,
  data: {
    site: settings.site,
    posts,
    categories: categories.filter(c => c.visible)
  }
})

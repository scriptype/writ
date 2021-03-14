const fs = require('fs')
const { execSync } = require('child_process')
const Handlebars = require('handlebars')

const settings = require('../settings.json')

const SITE_DIR = settings.exportDirectory || '_site'
const CATEGORY_INFO_FILE = settings.categoryInfoFile || 'category-info.json'
const POSTS_JSON_PATH = `${SITE_DIR}/posts.json`
const EXCLUDED_PATHS = new RegExp(settings.ignorePaths.join('|'))

const readFileContent = (path) => fs.readFileSync(path, { encoding: 'utf-8' })

const isTargetDirectory = (path) => {
  const isDirectory = fs.lstatSync(path).isDirectory()
  const isNotMeta = !path.includes('_') && !path.includes('.')
  return isDirectory && isNotMeta
}

const createSiteDir = () => {
  if (SITE_DIR === '.' || SITE_DIR === '/' || SITE_DIR === '~') {
    throw new Error(`Dangerous export directory: "${SITE_DIR}". Won't continue.`)
  }
  try {
    execSync(`rm -rf ${SITE_DIR}`)
  } catch (e) {
    console.log('createSiteDir error:', e)
  } finally {
    fs.mkdirSync(SITE_DIR)
  }
}

const copyPaths = (paths) => {
  paths
    .filter(p => !p.match(EXCLUDED_PATHS))
    .forEach(path => execSync(`cp -R ${path} ${SITE_DIR}`))
}

const createPostsJSON = ({ path, posts }) => {
  const postsJSON = posts.map(({ content, output, ...rest }) => rest)
  fs.writeFileSync(path, JSON.stringify(postsJSON, null, 2))
  console.log('created:', path)
}

const getTargetDirectories = (paths) => {
  return paths
    .filter(isTargetDirectory)
    .map(slug => {
      const paths = fs.readdirSync(slug)
      if (!paths.includes(CATEGORY_INFO_FILE)) {
        return {
          name: '',
          slug,
        }
      }
      const info = require(`../${slug}/${CATEGORY_INFO_FILE}`)
      return {
        name: info.name,
        slug: slug,
        permalink: `/${slug}`,
        isCategory: true
      }
    })
}

const compileNonCategoryDirectories = (directories) => {
  directories.forEach(dir => {
    fs.readdirSync(`${dir.slug}`)
      .filter(p => p.match(/.hbs$/))
      .forEach(fileName => {
        const inPath = `${dir.slug}/${fileName}`
        const outPath = `${SITE_DIR}/${inPath.replace('.hbs', '.html')}`
        compileTemplate({
          content: readFileContent(inPath),
          path: outPath,
          data: {
            site: settings.site
          }
        })
        fs.rmSync(outPath.replace('.html', '.hbs'))
      })
  })
}

const compileTemplate = ({ content, path, data }) => {
  const template = Handlebars.compile(content)
  const output = template(data || {})
  fs.writeFileSync(path, output)
  console.log('created:', path)
  return output
}

const compileCategoryPosts = (categories) => {
  return categories.reduce((acc, category) => {
    const categoryPostDirs = fs.readdirSync(category.slug).filter(d => isTargetDirectory(`${category.slug}/${d}`))
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
          if (postFilePath === 'index.hbs') {
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

    return {
      ...acc,
      [category.slug]: categoryPosts
    }
  }, {})
}

const compileCategoryIndexes = ({ categories, posts }) => {
  categories.forEach(category => {
    compileTemplate({
      content: '{{>category}}',
      path: `${SITE_DIR}/${category.slug}/index.html`,
      data: {
        site: settings.site,
        category,
        posts: posts[category.slug]
      }
    })
    fs.rmSync(`${SITE_DIR}/${category.slug}/${CATEGORY_INFO_FILE}`)
  })
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

const compileIndex = ({ categories, posts }) => {
  compileTemplate({
    content: '{{>index}}',
    path: `${SITE_DIR}/index.html`,
    data: {
      site: settings.site,
      posts,
      categories
    }
  })
}

const parsePostData = ({ content, output, category, postDir }) => {
  return {
    title: content.match(/title="(.*)"/)[1],
    publishedAt: new Date(content.match(/date="(.*)"/)[1]),
    tags: content.match(/tags="(.*)"/)[1].split(',').map(t => t.trim()),
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
const targetDirectories = getTargetDirectories(allPaths)
const categories = targetDirectories.filter(dir => dir.isCategory)
const nonCategoryDirectories = targetDirectories.filter(dir => !dir.isCategory)

createSiteDir()
copyPaths(allPaths)
compileNonCategoryDirectories(nonCategoryDirectories)

const postsByCategories = compileCategoryPosts(categories)
compileCategoryIndexes({
  categories,
  posts: postsByCategories
})

const posts = Object.keys(postsByCategories)
  .reduce((acc, categorySlug) => {
    return [
      ...acc,
      ...postsByCategories[categorySlug]
    ]
  }, [])

compileIndex({
  categories,
  posts
})

createPostsJSON({
  path: POSTS_JSON_PATH,
  posts
})

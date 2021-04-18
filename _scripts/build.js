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

const copyPaths = () => {
  fs.readdirSync('.')
    .filter(p => !p.match(EXCLUDED_PATHS))
    .forEach(path => execSync(`cp -R ${path} ${SITE_DIR}`))
}

const createPostsJSON = ({ path, posts }) => {
  const postsJSON = posts.map(({ content, output, ...rest }) => rest)
  fs.writeFileSync(path, JSON.stringify(postsJSON, null, 2))
  console.log('created:', path)
}

const getTargetDirectories = (paths) => {
  return fs.readdirSync('.')
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

const compileNonCMSTemplates = (paths) => {
  paths.forEach(path => {
    compileTemplate({
      content: readFileContent(path),
      path: path.replace('.hbs', '.html'),
      data: {
        site: settings.site
      }
    })
    console.log('created:', path.replace('.hbs', '.html'))
    fs.rmSync(path)
  })
}

const compileTemplate = ({ content, path, data }) => {
  const template = Handlebars.compile(content)
  const output = template(data || {})
  fs.writeFileSync(path, output)
  console.log('created:', path)
  return output
}

const indexNonCMSTemplates = (parentDir, pathList = [], wasCategory) => {
  const paths = fs.readdirSync(parentDir).map(p => `${parentDir}/${p}`)
  const templates = paths.filter(p => p.match(/.hbs$/) && (!wasCategory || !p.match(/index.hbs/)))
  pathList.push(...templates)
  const directories = paths.filter(p => fs.lstatSync(p).isDirectory())
  const isCategory = paths.some(p => p.match(CATEGORY_INFO_FILE))
  directories.forEach(dir => {
    indexNonCMSTemplates(dir, pathList, isCategory)
  })
  return pathList
}

const indexCategoryPosts = (categories) => {
  const categoryPosts = {}
  categories.forEach(category => {
    const directories = fs.readdirSync(category.slug).filter(d => isTargetDirectory(`${category.slug}/${d}`))
    const directoriesWithPosts = directories
      .map(dir => ({
        name: dir,
        paths: fs.readdirSync(`${category.slug}/${dir}`)
      }))
      .filter(({ paths }) => paths.includes('index.hbs'))

    const posts = directoriesWithPosts.map(dir => {
      const content = readFileContent(`${category.slug}/${dir.name}/index.hbs`)
      return parsePostData({
        content,
        category,
        postDir: dir.name
      })
    })

    posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    categoryPosts[category.slug] = posts
  })

  return categoryPosts
}

const compileCategoryPosts = (categoryPosts) => {
  const compiledCategoryPosts = {}
  Object.keys(categoryPosts).forEach(categorySlug => {
    compiledCategoryPosts[categorySlug] = []
    const sameCategoryPosts = categoryPosts[categorySlug]
    sameCategoryPosts.forEach((post, postIndex) => {
      const additionalData = {}
      if (postIndex > 0) {
        additionalData.nextPost = {
          title: sameCategoryPosts[postIndex - 1].title,
          permalink: sameCategoryPosts[postIndex - 1].permalink
        }
      }
      if (postIndex < sameCategoryPosts.length - 1) {
        additionalData.prevPost = {
          title: sameCategoryPosts[postIndex + 1].title,
          permalink: sameCategoryPosts[postIndex + 1].permalink
        }
      }
      const { output } = compilePost({
        path: `${categorySlug}/${post.postDir}/index.hbs`,
        data: {
          site: settings.site,
          category: post.category,
          publishedAt: post.publishedAt,
          ...additionalData
        }
      })
      compiledCategoryPosts[categorySlug].push({
        ...categoryPosts[categorySlug][postIndex],
        output
      })
    })
  })
  return compiledCategoryPosts
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

const compileHomePage = ({ categories, posts }) => {
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

const parsePostData = ({ content, category, postDir }) => {
  const metaBlock = content.match(/\{\{.*\n.*=".*"\n\}\}/gs)[0]
  const type = metaBlock.match(/\{\{#>(.*)/)[1].trim()
  const { title, date, tags, ...customMetadata } = metaBlock
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
    type,
    title,
    publishedAt: new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    tags: tags.split(',').map(t => t.trim()),
    content: content.match(/\n\}\}\n(.*)\{\{\/.*\}\}\n$/s)[1],
    get summary() {
      const indexOfSeeMore = this.content.indexOf('{{seeMore}}')
      if (indexOfSeeMore === -1) {
        return this.content
      }
      return this.content.substring(0, indexOfSeeMore)
    },
    permalink: `/${category.slug}/${postDir}`,
    postDir,
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
  },

  isPostType(string, type) {
    return string === type
  }
}

Object.keys(helpers).forEach((key) => {
  Handlebars.registerHelper(key, helpers[key])
})

fs.readdirSync('./_partials').forEach(path => {
  const name = path.replace('.hbs', '')
  Handlebars.registerPartial(name, readFileContent(`./_partials/${path}`))
})

createSiteDir()
copyPaths()

const nonCMSTemplates = indexNonCMSTemplates(SITE_DIR)
compileNonCMSTemplates(nonCMSTemplates)

const categories = getTargetDirectories().filter(dir => dir.isCategory)
const postsByCategories = indexCategoryPosts(categories)
const compiledPostsByCategories = compileCategoryPosts(postsByCategories)
compileCategoryIndexes({
  categories,
  posts: compiledPostsByCategories
})

const posts = Object.keys(compiledPostsByCategories)
  .reduce((acc, categorySlug) => {
    return [
      ...acc,
      ...postsByCategories[categorySlug]
    ]
  }, [])
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

compileHomePage({
  categories,
  posts
})

createPostsJSON({
  path: POSTS_JSON_PATH,
  posts
})

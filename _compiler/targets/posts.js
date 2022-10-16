const fs = require('fs')
const { settings, SITE_DIR } = require('../settings')
const {
  readFileContent,
  isTargetDirectory,
} = require('../helpers/fs')

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

const indexPosts = (categories) => {
  const index = {}
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

    index[category.slug] = posts
  })

  return index
}

const sortCompiledPosts = (categoryPosts, compiledPosts) => {
  return Object.keys(compiledPosts)
    .reduce((acc, categorySlug) => {
      return [
        ...acc,
        ...categoryPosts[categorySlug]
      ]
    }, [])
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

const compilePost = ({ path, data }, render) => {
  const content = readFileContent(path)
  const newPath = path.replace(/\.hbs$/, '.html')
  const output = render({
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

const compilePosts = (categoryPosts, render) => {
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
      }, render)
      compiledCategoryPosts[categorySlug].push({
        ...categoryPosts[categorySlug][postIndex],
        output
      })
    })
  })

  const sortedCompiledPosts = sortCompiledPosts(categoryPosts, compiledCategoryPosts)

  return {
    posts: compiledCategoryPosts,
    sortedPosts: sortedCompiledPosts
  }
}

module.exports = {
  compile(categories, render) {
    const indexedPosts = indexPosts(categories)
    return compilePosts(indexedPosts, render)
  }
}

const fs = require('fs')
const { settings, SITE_DIR } = require('../settings')
const { readFileContent, isTargetDirectory } = require('../helpers/fs')
const { getSlug } = require('../helpers/string')
const {
  READ_MORE_DIVIDER,
  INDEX_TEMPLATE_FILE_NAME,
  getOutputPath,
  parseTemplate
} = require('../rendering')

const parsePostData = ({ content, category, postDir }) => {
  const { type, content: postContent, metadata } = parseTemplate(content)
  const { date, tags, ...customMetadata } = metadata
  return {
    ...customMetadata,
    type,
    title: postDir,
    content: postContent,
    category,
    postDir,
    tags: tags.split(',').map(t => t.trim()),
    permalink: `/${category.slug}/${getSlug(postDir)}`,
    publishedAt: new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    get summary() {
      const indexOfReadMore = this.content.indexOf(READ_MORE_DIVIDER)
      if (indexOfReadMore === -1) {
        return this.content
      }
      return this.content.substring(0, indexOfReadMore)
    },
  }
}

const indexPosts = (categories) => {
  const index = {}
  categories.forEach(category => {
    const categoryPath = category.name
    const directories = fs.readdirSync(categoryPath).filter(f => isTargetDirectory(`${categoryPath}/${f}`))
    const directoriesWith = directories
      .map(dir => ({
        name: dir,
        paths: fs.readdirSync(`${categoryPath}/${dir}`)
      }))
    const directoriesWithPosts = directories
      .map(dir => ({
        name: dir,
        paths: fs.readdirSync(`${categoryPath}/${dir}`)
      }))
      .filter(({ paths }) => paths.includes(INDEX_TEMPLATE_FILE_NAME))


    const posts = directoriesWithPosts.map(dir => {
      const content = readFileContent(`${categoryPath}/${dir.name}/${INDEX_TEMPLATE_FILE_NAME}`)
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
  const newPath = getOutputPath(path)
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
        path: `${post.category.name}/${post.postDir}/${INDEX_TEMPLATE_FILE_NAME}`,
        data: {
          site: settings.site,
          ...post,
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

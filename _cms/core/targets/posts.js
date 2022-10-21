const fs = require('fs')
const { join } = require('path')
const { settings, SITE_DIR } = require('../settings')
const { readFileContent, shouldIncludeDirectory } = require('../helpers/fs')
const { getSlug } = require('../helpers/string')
const {
  render,
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
    const paths = fs.readdirSync(categoryPath)
    const directories = paths.filter(path => {
      return shouldIncludeDirectory(join(categoryPath, path))
    })
    const directoriesWithPosts = directories
      .map(dir => ({
        name: dir,
        paths: fs.readdirSync(join(categoryPath, dir))
      }))
      .filter(({ paths }) => paths.includes(INDEX_TEMPLATE_FILE_NAME))


    const posts = directoriesWithPosts.map(dir => {
      const path = join(categoryPath, dir.name, INDEX_TEMPLATE_FILE_NAME)
      const content = readFileContent(path)
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

const compilePost = ({ path, data }) => {
  const content = readFileContent(path)
  const templateFilePath = join(SITE_DIR, path)
  const outputFilePath = join(SITE_DIR, getOutputPath(path))
  const output = render({
    content,
    path: outputFilePath,
    data
  })
  fs.rmSync(templateFilePath)
  return {
    output,
    content
  }
}

const compilePosts = (categoryPosts) => {
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
        path: join(post.category.name, post.postDir, INDEX_TEMPLATE_FILE_NAME),
        data: {
          site: settings.site,
          ...post,
          ...additionalData
        }
      })
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
  compile(categories) {
    const indexedPosts = indexPosts(categories)
    return compilePosts(indexedPosts)
  }
}

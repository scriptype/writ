const { settings } = require('../settings')
const { parseTemplate, READ_MORE_DIVIDER } = require('./helpers/rendering')

const createSubPage = (subPageObject) => {
  if (!subPageObject.content) {
    return subPageObject
  }
  const metadataResult = parseTemplate(subPageObject.content)
  const { type, metadata } = metadataResult
  const result = {
    ...subPageObject,
    ...metadata,
    title: subPageObject.name,
    type,
    tags: metadata.tags.split(',').map(t => t.trim()),
    publishedAt: getPublishedAt(metadata.date),
  }
  return result
}

const createPost = (postObject, postIndex, posts) => {
  const { type, content, metadata } = parseTemplate(postObject.content)
  return {
    ...postObject,
    ...metadata,
    title: postObject.name,
    type,
    tags: metadata.tags.split(',').map(t => t.trim()),
    publishedAt: getPublishedAt(metadata.date),
    summary: getPostSummary(content),
    site: settings.site,
    paging: getPaging(postObject, postIndex, posts)
  }
}

const createCategoryTreePosts = (categoryTree) => {
  for (const key in categoryTree) {
    if (categoryTree.hasOwnProperty(key)) {
      categoryTree[key] = categoryTree[key].map(createPost).sort(sortPosts)
    }
  }
  return categoryTree
}

const getPublishedAt = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getPostSummary = (content) => {
  const indexOfReadMore = content.indexOf(READ_MORE_DIVIDER)
  if (indexOfReadMore === -1) {
    return content
  }
  return content.substring(0, indexOfReadMore)
}

const getPaging = (postObject, postIndex, posts) => {
  const paging = {}
  if (postIndex > 0) {
    paging.nextPost = {
      title: posts[postIndex - 1].title,
      permalink: posts[postIndex - 1].permalink
    }
  }
  if (postIndex < posts.length - 1) {
    paging.prevPost = {
      title: posts[postIndex + 1].title,
      permalink: posts[postIndex + 1].permalink
    }
  }
  return paging
}

const sortPosts = (a, b) => {
  return new Date(b.publishedAt) - new Date(a.publishedAt)
}

const createPostsJSON = (posts) => {
  return posts.map(({ content, output, ...rest }) => rest)
}

const parseIndex = (siteIndex) => {
  const { assets, subPages, categories, posts, categoryTree } = siteIndex
  return {
    assets,
    subPages: subPages.map(createSubPage),
    categories,
    posts: posts.map(createPost).sort(sortPosts),
    categoryTree: createCategoryTreePosts(categoryTree),
    get postsJSON() {
      return createPostsJSON(this.posts)
    }
  }
}

module.exports = {
  parseIndex
}

const { settings, paths } = require('./settings')
const { parseTemplate, READ_MORE_DIVIDER } = require('./helpers/rendering')

const createPostsJSON = (posts) => {
  return posts.map(({ content, output, ...rest }) => rest)
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

const attachPaging = (post, postIndex, posts) => {
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
  return {
    ...post,
    ...paging
  }
}

const sortPosts = (a, b) => {
  return new Date(b.publishedAt) - new Date(a.publishedAt)
}

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

const createPost = (postObject) => {
  const post = parseTemplate(postObject.content)
  return {
    ...postObject,
    ...post.metadata,
    title: postObject.name,
    type: post.type,
    tags: post.metadata.tags.split(',').map(t => t.trim()),
    publishedAt: getPublishedAt(post.metadata.date),
    summary: getPostSummary(post.content),
    site: settings.site,
  }
}

const createCategoriesWithPosts = (categories) => {
  categories.forEach(category => {
    category.posts = category.posts
      .map(createPost)
      .sort(sortPosts)
      .map(attachPaging)
  })
  return categories
}

const createPosts = (categoriesWithPosts) => {
  const posts = [].concat(...categoriesWithPosts.map(({ posts }) => posts))
  return posts.sort(sortPosts)
}

const parseIndex = (siteIndex) => {
  const { assets, subPages, categories } = siteIndex
  const categoriesWithPosts = createCategoriesWithPosts(categories)
  return {
    assets,
    subPages: subPages.map(createSubPage),
    categories: categoriesWithPosts,
    posts: createPosts(categoriesWithPosts),
    get postsJSON() {
      return createPostsJSON(this.posts)
    }
  }
}

module.exports = {
  parseIndex
}

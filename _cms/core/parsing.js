const { settings, paths } = require('./settings')
const { parseTemplate, READ_MORE_DIVIDER } = require('./helpers/rendering')

const createPostsJSON = (posts) => {
  return posts.map(({ content, output, ...rest }) => rest)
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

const attachDates = ({ date, ...rest }) => {
  const locale = 'en-US'
  const publishedAt = new Date(date)
  const publishedAtFull = publishedAt.toLocaleString(locale, { dateStyle: 'full' })
  const publishedAtLong = publishedAt.toLocaleString(locale, { dateStyle: 'long' })
  const publishedAtMedium = publishedAt.toLocaleString(locale, { dateStyle: 'medium' })
  const publishedAtShort = publishedAt.toLocaleString(locale, { dateStyle: 'short' })
  return {
    ...rest,
    publishedAt,
    publishedAtFull,
    publishedAtLong,
    publishedAtMedium,
    publishedAtShort
  }
}

const sortPosts = (a, b) => {
  return new Date(b.publishedAt) - new Date(a.publishedAt)
}

const createSubPage = (subPageFile) => {
  if (!subPageFile.content) {
    return subPageFile
  }
  const metadataResult = parseTemplate(subPageFile.content)
  const { type, metadata } = metadataResult
  const result = {
    ...subPageFile,
    ...metadata,
    ...attachDates(metadata),
    title: subPageFile.name,
    type,
    tags: metadata.tags.split(',').map(t => t.trim()),
  }
  return result
}

const createPost = (postFile) => {
  const post = parseTemplate(postFile.content)
  return {
    ...postFile,
    ...post.metadata,
    title: postFile.name,
    type: post.type,
    tags: post.metadata.tags.split(',').map(t => t.trim()),
    summary: getPostSummary(post.content),
    site: settings.site,
  }
}

const createCategoriesWithPosts = (categories) => {
  categories.forEach(category => {
    category.posts = category.posts
      .map(createPost)
      .map(attachDates)
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
  const categories = createCategoriesWithPosts(siteIndex.categories)
  const posts = createPosts(categories)
  const postsJSON = createPostsJSON(posts)
  return {
    assets: siteIndex.assets,
    subPages: siteIndex.subPages.map(createSubPage).map(attachDates),
    categories,
    posts,
    postsJSON
  }
}

module.exports = {
  parseIndex
}

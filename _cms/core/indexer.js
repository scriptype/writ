const { join, format, basename } = require('path')
const fs = require('fs')
const { getSlug } = require('./helpers/string')
const {
  readFileContent,
  isDirectory,
  shouldIncludeDirectory
} = require('./helpers/fs')
const {
  isTemplate,
  parseTemplate,
  getPostNameFromTemplateFileName,
  READ_MORE_DIVIDER,
  INDEX_TEMPLATE_FILE_NAME,
  SUBFOLDER_POST_FILE_NAME
} = require('./helpers/rendering')

const fetchAssets = (assetsPath) => {
  return fs.readdirSync(assetsPath).map(path => ({
    name: path,
    url: join(assetsPath, path)
  }))
}

const fetchSubPages = (pagesPath, pages = []) => {
  if (!isDirectory(pagesPath)) {
    return []
  }
  const paths = fs.readdirSync(pagesPath).map(path => join(pagesPath, path))
  const templates = paths.filter(isTemplate)
  pages.push(...templates)
  paths
    .filter(isDirectory)
    .forEach(dir => fetchSubPages(dir, pages))
  return pages
}

const fetchCategories = (parentPath) => {
  return fs.readdirSync(parentPath)
    .filter(shouldIncludeDirectory)
    .map(name => {
      const slug = getSlug(name)
      const permalink = `/${slug}`
      const path = join(parentPath, name)
      return {
        name,
        slug,
        permalink,
        path
      }
    })
}

const parsePostData = ({ path, content, category, name }) => {
  const { type, content: postContent, metadata } = parseTemplate(content)
  const { date, tags, ...customMetadata } = metadata
  return {
    ...customMetadata,
    path,
    type,
    title: name,
    content: postContent,
    category,
    tags: tags.split(',').map(t => t.trim()),
    permalink: `/${category.slug}/${getSlug(name)}`,
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

const collectSubFolderPosts = (category) => {
  const categoryPath = category.name
  const childPaths = fs.readdirSync(categoryPath)
  const directoriesToCheck = childPaths.filter(path => {
    return shouldIncludeDirectory(join(categoryPath, path))
  })
  const directoriesWithPosts = directoriesToCheck
    .map(dir => ({
      name: dir,
      paths: fs.readdirSync(join(categoryPath, dir))
    }))
    .filter(({ paths }) => (
      paths.includes(INDEX_TEMPLATE_FILE_NAME) ||
      paths.includes(SUBFOLDER_POST_FILE_NAME)
    ))

  return directoriesWithPosts.map(dir => {
    const fileName = dir.paths.find(p => {
      return p.match(
        new RegExp(`${INDEX_TEMPLATE_FILE_NAME}|${SUBFOLDER_POST_FILE_NAME}`)
      )
    })
    const path = join(categoryPath, dir.name, fileName)
    const content = readFileContent(path)
    return parsePostData({
      path,
      content,
      category,
      name: dir.name
    })
  })
}

const collectFilePosts = (category) => {
  const categoryPath = category.name
  const childPaths = fs.readdirSync(categoryPath)
  const templateFileNames = childPaths.filter(isTemplate)

  return templateFileNames.map(fileName => {
    const path = join(categoryPath, fileName)
    const content = readFileContent(path)
    return parsePostData({
      path,
      content,
      category,
      name: getPostNameFromTemplateFileName(fileName),
    })
  })
}

const fetchPostsOfCategory = (category) => {
  const categoryPath = category.name
  const paths = fs.readdirSync(categoryPath)
  const posts = []
  posts.push(...collectSubFolderPosts(category))
  posts.push(...collectFilePosts(category))
  posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  return posts
}

const createCategoryTree = (categories) => {
  const tree = {}
  categories.forEach(category => {
    const posts = fetchPostsOfCategory(category)
    tree[category.slug] = posts
  })
  return tree
}

const isNotRecognisedDirectory = (recognisedDirectoryNames, directory) =>
  !recognisedDirectoryNames.includes(directory.path)

const indexSite = () => {
  const rootPath = '.'
  const assetsPath = 'assets'
  const subPagesPath = 'pages'
  const assets = fetchAssets(assetsPath)
  const subPages = fetchSubPages(subPagesPath)
  const categories = fetchCategories(rootPath).filter(isNotRecognisedDirectory.bind(null, [assetsPath, subPagesPath]))
  const allPosts = [].concat(...categories.map(fetchPostsOfCategory))
  const posts = [...allPosts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  const categoryTree = createCategoryTree(categories)
  return {
    assets,
    subPages,
    categories,
    posts,
    categoryTree
  }
}

module.exports = {
  indexSite
}

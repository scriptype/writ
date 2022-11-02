const { join } = require('path')
const fs = require('fs')
const { getSlug } = require('./helpers/string')
const {
  readFileContent,
  isDirectory,
  shouldIncludeDirectory,
  removeExtension
} = require('./helpers/fs')
const {
  isTemplate,
  getOutputPath,
  INDEX_TEMPLATE_FILE_NAME,
  SUBFOLDER_POST_FILE_NAME
} = require('./helpers/rendering')
const settings = require('./settings')

const fetchAssets = (assetsPath) => {
  return fs.readdirSync(assetsPath).map(path => {
    const slug = getSlug(path)
    return {
      name: path,
      slug,
      permalink: `/assets/${slug}`,
      src: join(assetsPath, path),
    }
  })
}

const fetchSubPages = (pagesPath, pages = []) => {
  return fs.readdirSync(pagesPath)
    .map(path => join(pagesPath, path))
    .map(path => {
      if (isDirectory(path)) {
        return fetchSubPages(path)
      }
      const name = removeExtension(path.replace(/pages\//, ''))
      const slug = getSlug(name)
      const src = path
      const pageObject = {
        name,
        slug,
        permalink: `/${slug}`,
        src
      }
      if (isTemplate(path)) {
        return {
          ...pageObject,
          content: readFileContent(src)
        }
      }
      return pageObject
    })
}

const fetchCategories = (parentPath, { excludePaths }) => {
  return fs.readdirSync(parentPath)
    .filter(shouldIncludeDirectory)
    .filter(dir => !excludePaths.includes(dir))
    .map(name => {
      const slug = getSlug(name)
      const permalink = `/${slug}`
      const src = join(parentPath, name)
      return {
        name,
        slug,
        permalink,
        src
      }
    })
}

const fetchDirectoriesWithPosts = (parentPath) => {
  const childPaths = fs.readdirSync(parentPath)
  const directoriesToCheck = childPaths.filter(path => {
    return shouldIncludeDirectory(join(parentPath, path))
  })
  return directoriesToCheck
    .map(dir => ({
      name: dir,
      paths: fs.readdirSync(join(parentPath, dir))
    }))
    .filter(({ paths }) => (
      paths.includes(INDEX_TEMPLATE_FILE_NAME) ||
      paths.includes(SUBFOLDER_POST_FILE_NAME)
    ))
}

const fetchSubFolderPosts = (category) => {
  return fetchDirectoriesWithPosts(category.name)
    .map(dir => {
      const fileName = dir.paths.find(p => {
        return p.match(
          new RegExp(`${INDEX_TEMPLATE_FILE_NAME}|${SUBFOLDER_POST_FILE_NAME}`)
        )
      })
      const slug = getSlug(dir.name)
      const permalink = `/${category.slug}/${slug}`
      const src = join(category.name, dir.name, fileName)
      const content = readFileContent(src)
      return {
        name: dir.name,
        slug,
        permalink,
        category,
        src,
        content,
      }
    })
}

const fetchFilePosts = (category) => {
  return fs.readdirSync(category.name)
    .filter(isTemplate)
    .map(fileName => {
      const slug = getSlug(fileName)
      const permalink = getOutputPath(`/${category.slug}/${slug}`)
      const src = join(category.name, fileName)
      const content = readFileContent(src)
      return {
        name: removeExtension(fileName),
        slug,
        permalink,
        category,
        src,
        content,
      }
    })
}

const fetchPostsOfCategory = (category) => {
  const paths = fs.readdirSync(category.name)
  const posts = []
  posts.push(...fetchSubFolderPosts(category))
  posts.push(...fetchFilePosts(category))
  return posts
}

const indexSite = () => {
  const assets = fetchAssets(settings.paths.ASSETS)
  const subPages = fetchSubPages(settings.paths.SUBPAGES)
  const categories = fetchCategories(settings.paths.CATEGORIES, {
    excludePaths: [settings.paths.ASSETS, settings.paths.SUBPAGES]
  })
  .map(category => ({
    ...category,
    posts: fetchPostsOfCategory(category)
  }))
  return {
    assets,
    subPages,
    categories,
  }
}

module.exports = {
  indexSite
}

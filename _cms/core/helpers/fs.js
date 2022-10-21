const fs = require('fs')
const { resolve, basename, join } = require('path')
const { execSync } = require('child_process')
const { SITE_DIR, CATEGORY_FILE, EXCLUDED_PATHS } = require('../settings')
const { getSlug } = require('./string')

const readFileContent = (path) => fs.readFileSync(path, { encoding: 'utf-8' })
const isDirectory = path => fs.lstatSync(path).isDirectory()
const isMeta = path => path.startsWith('_') && !path.includes('.')
const isCategory = path => fs.readdirSync(path).includes(CATEGORY_FILE)
const isInCategory = (path, limit = 5) => {
  const parentDir = resolve(path, '..')
  const isPathSiteRoot = resolve(path) === resolve(SITE_DIR)
  const isOutsideOfSiteRoot = !resolve(path).startsWith(resolve(SITE_DIR))
  if (isPathSiteRoot || isOutsideOfSiteRoot || limit < 1) {
    return false
  }
  return isCategory(path) || isInCategory(parentDir, limit - 1)
}

const createSiteDir = () => {
  if (!SITE_DIR) {
    throw new Error('SITE_DIR is missing. Won\'t continue.')
  }
  const dirname = resolve(__dirname)
  if (SITE_DIR === '.' || SITE_DIR === './' || SITE_DIR === '..' || SITE_DIR === '../' || SITE_DIR === '/' || SITE_DIR === '~') {
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

const sluggifyTree = (directory = SITE_DIR) => {
  const files = fs.readdirSync(directory)
  files.forEach(fileName => {
    const path = join(directory, fileName)
    const newPath = join(directory, getSlug(fileName))
    if (isDirectory(path)) {
      sluggifyTree(path)
    }
    fs.renameSync(path, newPath)
  })
}

const copyPaths = () => {
  fs.readdirSync('.')
    .filter(p => !p.match(EXCLUDED_PATHS))
    .forEach(path => execSync(`cp -R ${path} ${SITE_DIR}`))
}

const createPostsJSON = ({ path, posts }) => {
  const postsJSON = posts.map(({ content, output, ...rest }) => rest)
  fs.writeFileSync(path, JSON.stringify(postsJSON, null, 2))
  console.log('posts.json created:', path)
}

const shouldIncludeDirectory = (path) => {
  return isDirectory(path) && !isMeta(basename(path))
}

const getTargetDirectories = () => {
  return fs.readdirSync('.')
    .filter(shouldIncludeDirectory)
    .map(name => {
      const slug = getSlug(name)
      const directory = {
        name,
        slug
      }
      if (isCategory(name)) {
        Object.assign(directory, {
          permalink: `/${slug}`,
          isCategory: true
        })
      }
      return directory
    })
}

const getCategories = () => {
  return getTargetDirectories().filter(dir => dir.isCategory)
}

module.exports = {
  readFileContent,
  createSiteDir,
  copyPaths,
  sluggifyTree,
  createPostsJSON,
  shouldIncludeDirectory,
  getTargetDirectories,
  getCategories,
  isDirectory,
  isCategory,
  isInCategory
}

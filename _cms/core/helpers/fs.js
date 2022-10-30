const fs = require('fs')
const { resolve, basename, join } = require('path')
const { execSync } = require('child_process')
const { SITE_DIR, CATEGORY_FILE, EXCLUDED_PATHS } = require('../settings')
const { getSlug } = require('./string')

const readFileContent = (path) => fs.readFileSync(path, { encoding: 'utf-8' })
const isDirectory = path => {
  try {
    return fs.lstatSync(path).isDirectory()
  } catch (ENOENT) {
    return false
  }
}
const shouldIgnorePath = path => path.startsWith('_') || path.includes('.')
const isInCategory = (path, limit = 5) => {
  const parentDir = resolve(path, '..')
  const isPathSiteRoot = resolve(path) === resolve(SITE_DIR)
  const isOutsideOfSiteRoot = !resolve(path).startsWith(resolve(SITE_DIR))
  if (isPathSiteRoot || isOutsideOfSiteRoot || limit < 1) {
    return false
  }
  return !shouldIgnorePath(path) || isInCategory(parentDir, limit - 1)
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

const shouldIncludeDirectory = (path) => {
  return isDirectory(path) && !shouldIgnorePath(basename(path)) && !path.match(EXCLUDED_PATHS)
}

module.exports = {
  readFileContent,
  createSiteDir,
  copyPaths,
  sluggifyTree,
  shouldIncludeDirectory,
  shouldIgnorePath,
  isDirectory,
  isInCategory
}

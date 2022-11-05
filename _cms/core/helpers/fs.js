const fs = require('fs')
const { resolve, basename, extname } = require('path')
const { paths } = require('../settings')

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
  const isPathSiteRoot = resolve(path) === resolve(paths.SITE)
  const isOutsideOfSiteRoot = !resolve(path).startsWith(resolve(paths.SITE))
  if (isPathSiteRoot || isOutsideOfSiteRoot || limit < 1) {
    return false
  }
  return !shouldIgnorePath(path) || isInCategory(parentDir, limit - 1)
}

const shouldIncludeDirectory = (path) => {
  return isDirectory(path) && !shouldIgnorePath(basename(path)) && !path.match(paths.IGNORE_REG_EXP)
}

const removeExtension = (fileName) => {
  return fileName.replace(extname(fileName), '')
}

module.exports = {
  readFileContent,
  shouldIncludeDirectory,
  shouldIgnorePath,
  isDirectory,
  isInCategory,
  removeExtension
}

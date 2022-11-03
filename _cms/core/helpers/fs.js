const fs = require('fs')
const { resolve, basename, join, extname } = require('path')
const { execSync } = require('child_process')
const { paths } = require('../settings')
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
  const isPathSiteRoot = resolve(path) === resolve(paths.SITE)
  const isOutsideOfSiteRoot = !resolve(path).startsWith(resolve(paths.SITE))
  if (isPathSiteRoot || isOutsideOfSiteRoot || limit < 1) {
    return false
  }
  return !shouldIgnorePath(path) || isInCategory(parentDir, limit - 1)
}

const createSiteDir = () => {
  if (!paths.SITE) {
    throw new Error('paths.SITE is missing. Won\'t continue.')
  }
  const dirname = resolve(__dirname)
  if (paths.SITE === '.' || paths.SITE === './' || paths.SITE === '..' || paths.SITE === '../' || paths.SITE === '/' || paths.SITE === '~') {
    throw new Error(`Dangerous export directory: "${paths.SITE}". Won't continue.`)
  }
  try {
    execSync(`rm -rf ${paths.SITE}`)
  } catch (e) {
    console.log('createSiteDir error:', e)
  } finally {
    fs.mkdirSync(paths.SITE)
  }
}

const sluggifyTree = (directory = paths.SITE) => {
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
    .filter(p => !p.match(paths.IGNORE_REG_EXP))
    .forEach(path => {
      const pathSlug = path.split(' ').join('\\ ')
      execSync(`cp -R ${pathSlug} ${paths.SITE}`)
    })
}

const shouldIncludeDirectory = (path) => {
  return isDirectory(path) && !shouldIgnorePath(basename(path)) && !path.match(paths.IGNORE_REG_EXP)
}

const removeExtension = (fileName) => {
  return fileName.replace(extname(fileName), '')
}

module.exports = {
  readFileContent,
  createSiteDir,
  copyPaths,
  sluggifyTree,
  shouldIncludeDirectory,
  shouldIgnorePath,
  isDirectory,
  isInCategory,
  removeExtension
}

const fs = require('fs')
const { execSync } = require('child_process')
const { SITE_DIR, CATEGORY_INFO_FILE, EXCLUDED_PATHS } = require('../settings')

const readFileContent = (path) => fs.readFileSync(path, { encoding: 'utf-8' })

const createSiteDir = () => {
  if (SITE_DIR === '.' || SITE_DIR === '..' || SITE_DIR === '../' || SITE_DIR === '/' || SITE_DIR === '~') {
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

const copyPaths = () => {
  fs.readdirSync('.')
    .filter(p => !p.match(EXCLUDED_PATHS))
    .forEach(path => execSync(`cp -R ${path} ${SITE_DIR}`))
}

const createPostsJSON = ({ path, posts }) => {
  const postsJSON = posts.map(({ content, output, ...rest }) => rest)
  fs.writeFileSync(path, JSON.stringify(postsJSON, null, 2))
  console.log('created:', path)
}

const isTargetDirectory = (path) => {
  const isDirectory = fs.lstatSync(path).isDirectory()
  const isNotMeta = !path.includes('_') && !path.includes('.')
  return isDirectory && isNotMeta
}

const getTargetDirectories = () => {
  return fs.readdirSync('.')
    .filter(isTargetDirectory)
    .map(slug => {
      const paths = fs.readdirSync(slug)
      if (!paths.includes(CATEGORY_INFO_FILE)) {
        return {
          name: '',
          slug,
        }
      }
      const info = require(`../../${slug}/${CATEGORY_INFO_FILE}`)
      return {
        name: info.name,
        slug: slug,
        permalink: `/${slug}`,
        isCategory: true
      }
    })
}

module.exports = {
  readFileContent,
  createSiteDir,
  copyPaths,
  createPostsJSON,
  isTargetDirectory,
  getTargetDirectories
}

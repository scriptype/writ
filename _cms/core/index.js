const Rendering = require('./rendering')
const {
  compilePosts,
  compileHomepage,
  compileCategoryPages,
  compileCustomTemplates,
  compilePostsJSON
} = require('./targets')
const {
  getCategories,
  createSiteDir,
  copyPaths,
  sluggifyTree
} = require('./helpers/fs')

const createCompiler = (options) => {
  const categories = getCategories()
  createSiteDir()
  copyPaths()
  Rendering.init()

  return {
    compileAll() {
      compileCustomTemplates()

      const { posts, sortedPosts } = compilePosts(categories)

      compileCategoryPages({
        categories,
        posts
      })

      compileHomepage({
        categories,
        posts: sortedPosts
      })

      compilePostsJSON(sortedPosts)

      sluggifyTree()
    }
  }
}

module.exports = createCompiler

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
      compileCustomTemplates(Rendering.render)

      const { posts, sortedPosts } = compilePosts(categories, Rendering.render)

      compileCategoryPages({
        categories,
        posts
      }, Rendering.render)

      compileHomepage({
        categories,
        posts: sortedPosts
      }, Rendering.render)

      compilePostsJSON(sortedPosts)

      sluggifyTree()
    }
  }
}

module.exports = createCompiler

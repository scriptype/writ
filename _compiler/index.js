const Rendering = require('./rendering')
const {
  compilePosts,
  compileHomepage,
  compileCategoryPages,
  compileCustomTemplates,
  compilePostsJSON
} = require('./targets')
const {
  getTargetDirectories,
  createSiteDir,
  copyPaths,
  createPostsJSON
} = require('./helpers/fs')

const createCompiler = (options) => {
  let compiledPosts, sortedCompiledPosts
  const targetDirectories = getTargetDirectories()
  const categories = targetDirectories.filter(dir => dir.isCategory)
  createSiteDir()
  copyPaths()
  Rendering.init()

  return {
    compilePosts () {
      const compiled = compilePosts(categories, Rendering.render)
      compiledPosts = compiled.posts
      sortedCompiledPosts = compiled.sortedPosts
    },

    compileHomepage() {
      compileHomepage({
        categories,
        posts: sortedCompiledPosts
      }, Rendering.render)
    },

    compileCategoryPages() {
      compileCategoryPages({
        categories,
        posts: compiledPosts
      }, Rendering.render)
    },

    compileCustomTemplates() {
      compileCustomTemplates(Rendering.render)
    },

    compilePostsJSON() {
      compilePostsJSON(sortedCompiledPosts)
    },

    compileAll() {
      this.compileCustomTemplates()
      this.compilePosts()
      this.compileCategoryPages()
      this.compileHomepage()
      this.compilePostsJSON()
    }
  }
}

module.exports = createCompiler

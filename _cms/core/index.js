const Rendering = require('./rendering')
const Indexer = require('./indexer')
const {
  compilePosts,
  compileHomepage,
  compileCategoryPages,
  compileSubPages,
  compilePostsJSON
} = require('./targets')
const {
  createSiteDir,
  copyPaths,
  sluggifyTree
} = require('./helpers/fs')

const createCompiler = (options) => {
  createSiteDir()
  copyPaths()
  Rendering.init()

  return {
    compileAll() {
      console.log('indexing')
      const {
        assets,
        subPages,
        categories,
        posts,
        categoryTree
      } = Indexer.indexSite()

      console.log('compiling subpages')
      compileSubPages(subPages)

      console.log('compiling posts')
      compilePosts(categoryTree)

      console.log('compiling categories')
      compileCategoryPages({
        categories,
        categoryTree
      })

      console.log('compiling homepage')
      compileHomepage({
        categories,
        posts
      })

      console.log('compiling posts.json')
      compilePostsJSON(posts)

      console.log('sluggifying paths')
      sluggifyTree()
    }
  }
}

module.exports = createCompiler

const Renderer = require('./rendering')
const Indexer = require('./indexing')
const Parser = require('./parsing')
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
  Renderer.init()

  return {
    compileAll() {
      const siteIndex = Indexer.indexSite()
      const {
        assets,
        subPages,
        categories,
        posts,
        postsJSON
      } = Parser.parseIndex(siteIndex)

      compileSubPages(subPages)
      compilePosts(posts)
      compileCategoryPages(categories)
      compileHomepage({ categories, posts })
      compilePostsJSON(postsJSON)
      sluggifyTree()
    }
  }
}

module.exports = createCompiler

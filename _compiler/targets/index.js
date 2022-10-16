module.exports = {
  compilePosts: require('./posts').compile,
  compileHomepage: require('./homepage').compile,
  compileCategoryPages: require('./category-pages').compile,
  compileCustomTemplates: require('./custom-templates').compile,
  compilePostsJSON: require('./posts-json').compile
}

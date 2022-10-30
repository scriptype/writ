module.exports = {
  compilePosts: require('./posts').compile,
  compileHomepage: require('./homepage').compile,
  compileCategoryPages: require('./category-pages').compile,
  compileSubPages: require('./subpages').compile,
  compilePostsJSON: require('./posts-json').compile
}

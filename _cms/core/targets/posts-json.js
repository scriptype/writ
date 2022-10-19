const { POSTS_JSON_PATH } = require('../settings')
const { createPostsJSON } = require('../helpers/fs')

const compilePostsJSON = (posts) => {
  createPostsJSON({
    path: POSTS_JSON_PATH,
    posts
  })
}

module.exports = {
  compile: compilePostsJSON
}

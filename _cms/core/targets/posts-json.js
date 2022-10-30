const fs = require('fs')
const { POSTS_JSON_PATH } = require('../settings')

const compilePostsJSON = (posts) => {
  const path = POSTS_JSON_PATH
  const postsJSON = posts.map(({ content, output, ...rest }) => rest)
  fs.writeFileSync(path, JSON.stringify(postsJSON, null, 2))
  console.log('created:', path)
}

module.exports = {
  compile: compilePostsJSON
}

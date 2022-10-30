const fs = require('fs')
const { join } = require('path')
const { settings, SITE_DIR } = require('../settings')
const { readFileContent } = require('../helpers/fs')
const { INDEX_TEMPLATE_FILE_NAME, getOutputPath, } = require('../helpers/rendering')
const { render } = require('../rendering')

const compilePost = ({ path, data }) => {
  const content = readFileContent(path)
  const templateFilePath = join(SITE_DIR, path)
  const outputFilePath = join(SITE_DIR, getOutputPath(path))
  const output = render({
    content,
    path: outputFilePath,
    data
  })
  fs.rmSync(templateFilePath)
  return {
    output,
    content
  }
}

const getAdditionalData = (sameCategoryPosts, postIndex) => {
  const additionalData = {}
  if (postIndex > 0) {
    additionalData.nextPost = {
      title: sameCategoryPosts[postIndex - 1].title,
      permalink: sameCategoryPosts[postIndex - 1].permalink
    }
  }
  if (postIndex < sameCategoryPosts.length - 1) {
    additionalData.prevPost = {
      title: sameCategoryPosts[postIndex + 1].title,
      permalink: sameCategoryPosts[postIndex + 1].permalink
    }
  }
  return additionalData
}

const compilePosts = (categoryTree) => {
  Object.keys(categoryTree).forEach(categorySlug => {
    const sameCategoryPosts = categoryTree[categorySlug]
    sameCategoryPosts.forEach((post, postIndex) => {
      const additionalData = getAdditionalData(sameCategoryPosts, postIndex)
      const { output } = compilePost({
        path: post.path,
        data: {
          site: settings.site,
          ...post,
          ...additionalData
        }
      })
    })
  })
}

module.exports = {
  compile(categoryTree) {
    return compilePosts(categoryTree)
  }
}

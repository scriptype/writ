module.exports = {
  region(name) {
    return ` data-region-id="${name}" `
  },

  seeMore() {
    return ''
  },

  map(...keyValues) {
    return keyValues.reduce((result, keyOrValue, index) => {
      if (index % 2 > 0) {
        return result
      }
      return {
        ...result,
        [keyOrValue]: keyValues[index + 1]
      }
    }, {})
  },

  mention(permalink, options) {
    const pattern = new RegExp('^(|\/)' + permalink)
    const entry = [
      this.homepage,
      ...this.posts,
      ...this.categories,
      ...this.subpages
    ].find(e => pattern.test(e.permalink))
    if (options.fn) {
      return options.fn(entry)
    }
    return `<a href="${entry.permalink}">${entry.title}</a>`
  },

  filterPostsByType(type) {
    return this.posts.filter(p => p.type === type)
  },

  assetsPath() {
    const { permalinkPrefix, assetsDirectory } = this.settings
    const prefix = permalinkPrefix === '/' ? '' : permalinkPrefix
    return prefix + '/' + assetsDirectory
  },

  pageTitle() {
    if (this.page === 'post') {
      return `${this.post.title} / ${this.settings.site.title}`
    }
    if (this.page === 'subpage') {
      return `${this.subpage.title} / ${this.settings.site.title}`
    }
    if (this.page === 'category') {
      return `${this.category.name} / ${this.settings.site.title}`
    }
    if (this.page === 'tag') {
      return `#${this.tag.tag} / ${this.settings.site.title}`
    }
    if (this.page === 'homepage' && this.homepage.title) {
      return `${this.homepage.title} / ${this.settings.site.title}`
    }
    return `${this.settings.site.title}`
  },

  is(value1, value2) {
    return value1 === value2
  },

  isNot(value1, value2) {
    return value1 !== value2
  },

  isEnabled(featureName) {
    return this.settings[featureName] !== 'off'
  },

  isStartMode() {
    return this.settings.mode === 'start'
  },

  isBuildMode() {
    return this.settings.mode === 'build'
  },

  isPostPage() {
    return this.page === 'post'
  },

  isSubPage() {
    return this.page === 'subpage'
  },

  isHomePage() {
    return this.page === 'homepage'
  },

  isCategoryPage() {
    return this.page === 'category'
  }
}

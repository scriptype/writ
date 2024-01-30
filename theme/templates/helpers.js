module.exports = {
  region(name) {
    return ` data-region-id="${name}" `
  },

  seeMore() {
    return ''
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
    if (this.page === 'post' || this.page === 'subpage') {
      return `${this.title} / ${this.settings.site.title}`
    }
    if (this.page === 'category') {
      return `${this.category.name} / ${this.settings.site.title}`
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
    const feature = this.settings[featureName]
    switch (featureName) {
      case 'syntaxHighlighting': return feature !== 'off'
      case 'search': return feature !== 'off'
    }
  },

  featSearchResults() {
    return this.settings.search !== 'off' ? ' id="feat-search-results" ' : ''
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
    return this.page === 'home'
  },

  isCategoryPage() {
    return this.page === 'category'
  }
}
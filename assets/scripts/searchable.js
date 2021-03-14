;(() => {
  function initSearch(searchForm, posts) {
    const searchIndex = posts.map((post, index) => ({
      content: post.textContent,
      index
    }))
    searchForm.addEventListener('submit', event => {
      event.preventDefault()
      const formData = new FormData(event.target)
      const query = formData.get('search')
      const pattern = new RegExp(query, 'gi')
      const matchingPosts = searchIndex.filter(({ content }) => {
        return content.match(pattern)
      })
      posts.forEach((post, i) => {
        const isMatching = matchingPosts.find(({ index }) => index === i)
        post.classList.toggle('hidden', !isMatching)
      })
    })
  }

  document.addEventListener('DOMContentLoaded', () => {
    const UI = {
      searchForm: document.querySelector('#search-form'),
      posts: Array.from(document.querySelectorAll('.post')),
    }

    initSearch(UI.searchForm, UI.posts)
  })
})()


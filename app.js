;(() => {
  const searchForm = document.querySelector('#search-form')
  const posts = Array.from(document.querySelectorAll('.post'))
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
    console.log('matchingPosts', matchingPosts)
    posts.forEach((post, i) => {
      const isMatching = matchingPosts.find(({ index }) => index === i)
      post.classList.toggle('hidden', !isMatching)
    })
  })
})()

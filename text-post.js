;(() => {
  function initPostMetadataIcons({ writCells, keyCells, writIconTmpl, keyIconTmpl }) {
    const writIcon = writIconTmpl.content.firstElementChild
    writCells.forEach(cell => {
      cell.innerHTML = writIcon.cloneNode(true).outerHTML
    })

    const keyIcon = keyIconTmpl.content.firstElementChild
    keyCells.forEach(cell => {
      cell.innerHTML = keyIcon.cloneNode(true).outerHTML
    })
  }

  function initMusicListIcons(musicListItems, { musicListIconTmpl }) {
    const icon = musicListIconTmpl.content.firstElementChild
    musicListItems.forEach(item => {
      item.prepend(icon.cloneNode(true))
    })
  }

  const UI = {
    postMetadataWrits: Array.from(document.querySelectorAll('.post-metadata-writ td:first-child')),
    postMetadataKeys: Array.from(document.querySelectorAll('.post-metadata-keys td:first-child')),
    postMusicListItems: Array.from(document.querySelectorAll('.post-music-list li')),
    writIconTmpl: document.querySelector('#writ-icon-tmpl'),
    keyIconTmpl: document.querySelector('#key-icon-tmpl'),
    musicListIconTmpl: document.querySelector('#music-list-icon-tmpl'),
  }

  initPostMetadataIcons({
    writCells: UI.postMetadataWrits,
    keyCells: UI.postMetadataKeys,
    writIconTmpl: UI.writIconTmpl,
    keyIconTmpl: UI.keyIconTmpl
  })
  initMusicListIcons(UI.postMusicListItems, {
    musicListIconTmpl: UI.musicListIconTmpl
  })
})()


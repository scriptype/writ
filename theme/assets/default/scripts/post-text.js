import initMetadataIcons from './metadataIcons.js'
import initMusicListIcons from './musicListIcons.js'

const UI = {
  metadataDate: document.querySelector('.post-metadata-date td:first-child'),
  metadataCategory: document.querySelector('.post-metadata-category td:first-child'),
  metadataTags: Array.from(document.querySelectorAll('.post-metadata-tags td:first-child')),
  musicListItems: Array.from(document.querySelectorAll('.post-music-list li')),
  dateIconTmpl: document.querySelector('#date-icon-tmpl'),
  categoryIconTmpl: document.querySelector('#category-icon-tmpl'),
  tagIconTmpl: document.querySelector('#tag-icon-tmpl'),
  musicListIconTmpl: document.querySelector('#music-list-icon-tmpl'),
}

initMetadataIcons({
  dateCell: UI.metadataDate,
  categoryCell: UI.metadataCategory,
  tagCells: UI.metadataTags,
  dateIconTmpl: UI.dateIconTmpl,
  categoryIconTmpl: UI.categoryIconTmpl,
  tagIconTmpl: UI.tagIconTmpl
})

initMusicListIcons(UI.musicListItems, {
  musicListIconTmpl: UI.musicListIconTmpl
})

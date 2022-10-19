const getSlug = (string) => {
  return string
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/á/gi, 'a')
    .replace(/é/gi, 'e')
    .replace(/ç/gi, 'c')
    .replace(/í/gi, 'i')
    .replace(/ı/gi, 'i')
    .replace(/ş/gi, 's')
    .replace(/ö/gi, 'o')
    .replace(/ü/gi, 'u')
}

module.exports = {
  getSlug
}

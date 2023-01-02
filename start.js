const bs = require('browser-sync').create()
const bodyParser = require('body-parser')
const frontMatter = require('front-matter')
const TurndownService = require('turndown')
const _ = require('lodash')
const { execSync } = require('child_process')
const compile = require('writ-cms')
const settings = require('./settings.json')

const turndownService = new TurndownService()

const watchOptions = {
  ignoreInitial: true,
  ignored: new RegExp(
    [
      settings.exportDirectory,
      'node_modules',
      '.git',
      '.DS_Store',
      'package.json',
      'package-lock.json',
      '_scripts'
    ].join('|')
  )
}

let compilePromise = compile(settings)

bs.watch('.', watchOptions, _.debounce((e, file) => {
  console.log('Changed:', file)
  compilePromise = compilePromise.then(() => compile(settings))
  bs.reload()
}, 100));

const serverMiddlewares = [
  bodyParser.json(),
  {
    route: "/cms/refresh",
    handle(req, res, next) {
      console.log('refresh')
      compilePromise = compilePromise.then(() => compile(settings))
      return res.end()
    }
  },
  {
    route: "/cms/post/update",
    async handle(req, res, next) {
      const fs = require('fs/promises')
      const { join, extname } = require('path')

      const isDirectory = async (path) => {
        try { return (await fs.lstat(path)).isDirectory() }
        catch (ENOENT) { return false }
      }

      const rootDirectory = settings.rootDirectory || '.'
      const assetsDirectory = settings.assetsDirectory || 'assets'
      const pagesDirectory = settings.pagesDirectory || 'pages'
      const ignorePaths = settings.ignorePaths.push(assetsDirectory, pagesDirectory)
      const IGNORE_REG_EXP = new RegExp(settings.ignorePaths.join('|'))

      const acceptedExtensionsForTemplates = [
        '.hbs',
        '.md',
        '.markdown',
        '.txt',
        '.html'
      ]

      const isTemplate = (path) => {
        const extension = extname(path)
        if (!extension) {
          return false
        }
        const extensions = acceptedExtensionsForTemplates.join('|')
        const pattern = new RegExp(extensions, 'i')
        return pattern.test(extension)
      }

      const forbiddenChars = 'äÄåÅÉéi̇ıİİöÖüÜçÇğĞşŞ'
      const slugChars = 'aaaaeeiiiioouuccggss'

      const getSlug = (string) => {
        string = string.trim()
        string = string.replace(/\s+/g, '-')
        for (let i = 0; i < forbiddenChars.length - 1; i++) {
          const regex = new RegExp(forbiddenChars[i], 'gi')
          string = string.replace(regex, slugChars[i])
        }
        return string.toLowerCase()
      }

      const shouldIncludePath = (path) => {
        return (
          !path.startsWith('_') &&
          !path.startsWith('.') &&
          !path.match(IGNORE_REG_EXP)
        )
      }

      const getPaths = async (directory) => {
        return await Promise.all(
          (await fs.readdir(directory)).map(async path => ({
            path,
            isDirectory: await isDirectory(join(directory, path))
          }))
        )
      }

      const getCategories = async (directory) => {
        const paths = await getPaths(directory)
        return paths.filter(({ path, isDirectory }) => {
          return isDirectory && shouldIncludePath(path)
        }).map(({ path }) => path)
      }

      const categories = await getCategories(rootDirectory)
      const [ categorySlug, postSlug ] = req.url.replace(/^\//g, '').split('/')
      const category = categories.find(cat => getSlug(cat) === categorySlug)

      const posts = await getPaths(join(rootDirectory, category))
      const post = posts.find(({ path }) => getSlug(path) === postSlug)
      const html = req.body.html

      let fullPath
      if (post.isDirectory) {
        const postDirectoryPaths = await getPaths(join(rootDirectory, category, post.path))
        const postFile = postDirectoryPaths.find(({ path, isDirectory }) => {
          return !isDirectory && isTemplate(path) && /^(index|post)/.test(path)
        })

        fullPath = join(rootDirectory, category, post.path, postFile.path)
      } else {
        fullPath = join(rootDirectory, category, post.path)
      }

      const extension = extname(fullPath)
      const isMarkdown = /\.(md|markdown)$/i.test(extension)

      if (isMarkdown) {
        const md = turndownService.turndown(html)
        console.log('path', fullPath)
        console.log('output', md)
        const fileContent = await fs.readFile(fullPath, 'utf-8')
        const front = frontMatter(fileContent)
        const newFileContent = [
          '---',
          front.frontmatter.trim(),
          '---',
          md.trim()
        ].join('\n')
        await fs.writeFile(fullPath, newFileContent)
      }

      return res.end()
    }
  }
]

bs.init({
  server: settings.exportDirectory,
  watch: true,
  ui: false,
  middleware: serverMiddlewares
});

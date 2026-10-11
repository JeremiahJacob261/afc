import i18n from 'i18next'
const navigate = (path, _as, options) => {
  const language = options?.locale || i18n.language
  location.href = '/' + language + path.replace(/^\/(en|my)/, '')
}
const router = { query: { id: 'preview-1' }, pathname: location.pathname.replace(/^\/(en|my)/, ''), asPath: location.pathname, locale: location.pathname.includes('/my/') ? 'my' : 'en', push: navigate, replace: navigate }
export function useRouter() { return router }

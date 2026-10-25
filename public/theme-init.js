// Sets the theme before first paint to avoid a flash. Mirrors resolveTheme() in src/theme.ts.
;(function () {
  var setting = 'system'
  try {
    var stored = JSON.parse(localStorage.getItem('showdown-quiz:v1') || 'null')
    if (stored && stored.settings && typeof stored.settings.theme === 'string') setting = stored.settings.theme
  } catch (e) {}
  var mq = function (q) {
    return window.matchMedia && window.matchMedia(q).matches
  }
  var theme =
    setting !== 'system' ? setting : mq('(prefers-contrast: more)') ? 'high-contrast' : mq('(prefers-color-scheme: dark)') ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
})()

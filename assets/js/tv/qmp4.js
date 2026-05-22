import { load } from 'assets://js/lib/cheerio.min.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
const DEFAULT_HOSTS = [
  'https://www.qwavi.com',
  'https://www.qwmkv.com',
  'https://www.qn63.com',
  'https://www.qmp4.com',
  'https://www.gmp4.com',
  'https://www.qwnull.com',
  'https://www.qwfilm.com',
  'https://www.qnmp4.com',
  'https://www.qnnull.com',
  'https://www.qnhot.com',
  'https://www.qncool.com',
  'https://www.pkmkv.com',
  'https://www.pkavi.com'
]

const CATEGORIES = [
  { type_id: '1', type_name: '\u7535\u5f71' },
  { type_id: '2', type_name: '\u7535\u89c6\u5267' },
  { type_id: '3', type_name: '\u7efc\u827a' },
  { type_id: '4', type_name: '\u52a8\u6f2b' },
  { type_id: '30', type_name: '\u77ed\u5267' },
  { type_id: '20', type_name: '\u7eaa\u5f55\u7247' }
]

let hosts = DEFAULT_HOSTS.slice()
let host = hosts[0]

const json = value => JSON.stringify(value)

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function trimHost(value) {
  value = clean(value)
  return value ? value.replace(/\/+$/, '') : ''
}

function uniq(items) {
  const seen = {}
  return items.filter(item => {
    if (!item || seen[item]) return false
    seen[item] = true
    return true
  })
}

function initHosts(ext) {
  if (!ext) return
  const extra = []
  if (Array.isArray(ext.hosts)) extra.push(...ext.hosts)
  if (ext.host) extra.unshift(ext.host)
  hosts = uniq(extra.map(trimHost).concat(DEFAULT_HOSTS)).filter(Boolean)
  host = hosts[0]
}

function headers(referer = host) {
  return {
    'User-Agent': UA,
    'Referer': referer,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
}

function ok(res) {
  const code = Number(res && res.code)
  return code >= 200 && code < 400 && res.content && String(res.content).length > 0 && !blocked(res.content)
}

function blocked(html) {
  html = String(html || '').toLowerCase()
  return html.includes('just a moment') ||
    html.includes('enable javascript and cookies') ||
    html.includes('cf-browser-verification') ||
    html.includes('cloudflare')
}

function request(url, referer = host) {
  try {
    const res = req(url, {
      headers: headers(referer),
      timeout: 12000,
      redirect: 1
    })
    return ok(res) ? res.content : ''
  } catch (e) {
    console.log('qmp4 request failed', url, e && e.message)
    return ''
  }
}

function absolute(url, base = host) {
  url = clean(url)
  if (!url || url.startsWith('javascript:') || url === '#') return ''
  if (url.startsWith('//')) return 'https:' + url
  return joinUrl(base, url)
}

function getByUrl(url, referer = host) {
  const html = request(url, referer)
  const match = url.match(/^https?:\/\/[^/]+/i)
  if (html && match) host = trimHost(match[0])
  return html
}

function getFirst(paths, referer = host) {
  for (const base of hosts) {
    for (const path of paths) {
      const url = path.startsWith('http') ? path : base + path
      const html = request(url, referer)
      if (!html) continue
      host = trimHost(base)
      return { html, url }
    }
  }
  return { html: '', url: host }
}

function textOf($, root, selectors) {
  for (const selector of selectors) {
    const value = clean(root.find(selector).first().text())
    if (value) return value
  }
  return ''
}

function attrOf($, root, selectors, names) {
  for (const selector of selectors) {
    const el = root.find(selector).first()
    for (const name of names) {
      const value = clean(el.attr(name))
      if (value) return value
    }
  }
  return ''
}

function isDetailHref(href) {
  return /\/(vod)?detail\/|\/detail\/|\/movie\/|\/mv\/|\/vod\/|\/html\//i.test(href) && !/\/(vod)?play\//i.test(href)
}

function cardFrom($, el, base) {
  const root = $(el)
  let a = root.find('a[href]').filter((_, item) => isDetailHref($(item).attr('href') || '')).first()
  if (!a.length) a = root.find('a[href]').first()

  const href = absolute(a.attr('href'), base)
  const pic = absolute(attrOf($, root, ['img', '.lazyload', '.lazy'], ['data-original', 'data-src', 'data-lazy', 'src']), base)
  const name = clean(a.attr('title')) ||
    attrOf($, root, ['img'], ['alt', 'title']) ||
    textOf($, root, ['.module-item-title', '.stui-vodlist__detail .title', '.vodlist_title', '.title', 'h3', 'h4']) ||
    clean(a.text())

  if (!href || !name) return null
  return {
    vod_id: href,
    vod_name: name,
    vod_pic: pic,
    vod_remarks: textOf($, root, ['.bottom2', '.module-item-note', '.pic-text', '.remarks', '.note', '.score', '.continu', '.state', '.tag'])
  }
}

function parseCards(html, base) {
  const $ = load(html)
  const selectors = [
    'ul.content-list > li',
    '.content-list li',
    '.module-items .module-item',
    '.module-list .module-item',
    '.stui-vodlist li',
    '.stui-vodlist__box',
    '.myui-vodlist li',
    '.vodlist li',
    '.show-list li',
    '.list-a li',
    '.search-list li',
    '.hl-vod-list li',
    '.video-list li'
  ]
  let list = []
  for (const selector of selectors) {
    list = $(selector).map((_, el) => cardFrom($, el, base)).get().filter(Boolean)
    if (list.length) break
  }
  if (!list.length) {
    list = $('a[href]').map((_, el) => {
      const href = $(el).attr('href') || ''
      return isDetailHref(href) ? cardFrom($, $(el).parent(), base) : null
    }).get().filter(Boolean)
  }
  const seen = {}
  return list.filter(item => {
    if (seen[item.vod_id]) return false
    seen[item.vod_id] = true
    return true
  })
}

function categoryPaths(tid, pg, extend) {
  const page = pg || '1'
  const by = encodeURIComponent(extend && extend.by ? extend.by : '')
  const area = encodeURIComponent(extend && extend.area ? extend.area : '')
  const year = encodeURIComponent(extend && extend.year ? extend.year : '')
  const klass = encodeURIComponent(extend && extend.class ? extend.class : '')
  const lang = encodeURIComponent(extend && extend.lang ? extend.lang : '')
  const paths = []
  if (klass) paths.push(`/ms/${tid}---${klass}--------.html`)
  if (area) paths.push(`/ms/${tid}-${area}----------.html`)
  if (lang) paths.push(`/ms/${tid}----${lang}-------.html`)
  if (by) paths.push(`/ms/${tid}--${by}---------.html`)
  if (year) paths.push(`/ms/${tid}-----------${year}.html`)
  if (klass || area || lang || by || year) paths.push(`/ms/${tid}-----------.html`)
  if (String(page) !== '1') paths.push(`/vt/${tid}-${page}.html`)
  paths.push(
    `/vt/${tid}.html`,
    `/vt/${tid}-${page}.html`,
    `/vodshow/${tid}-${area}-${by}-${klass}-----${page}---${year}.html`,
    `/vodshow/${tid}--------${page}---.html`,
    `/vodtype/${tid}-${page}.html`,
    `/vodtype/${tid}.html`,
    `/index.php/vod/type/id/${tid}/page/${page}.html`,
    `/index.php/vod/show/id/${tid}/page/${page}.html`
  )
  return paths
}

function searchPaths(key, pg) {
  const page = pg || '1'
  const wd = encodeURIComponent(key)
  return [
    `/index.php/ajax/suggest?mid=1&wd=${wd}`,
    `/search.html?wd=${wd}`,
    `/so/${wd}.html`,
    `/s/${wd}.html`,
    `/vodsearch/${wd}----------${page}---.html`,
    `/search/${wd}----------${page}---.html`,
    `/index.php/vod/search/page/${page}/wd/${wd}.html`,
    `/?s=${wd}`
  ]
}

function titleFrom($, base) {
  return textOf($, base, [
    '.main-ui-meta h1',
    '.module-info-heading h1',
    '.stui-content__detail .title',
    '.myui-content__detail .title',
    '.vodh h2',
    'h1',
    '.title'
  ])
}

function picFrom($, base, url) {
  return absolute(attrOf($, base, [
    '.wrap.row .img img',
    '.module-info-poster img',
    '.stui-content__thumb img',
    '.myui-content__thumb img',
    '.vodImg img',
    '.poster img',
    '.pic img',
    'img'
  ], ['data-original', 'data-src', 'src']), url)
}

function contentFrom($, base) {
  return textOf($, base, [
    '.movie-introduce .sqjj_a',
    '.movie-introduce .zkjj_a',
    '.module-info-introduction-content',
    '.stui-content__desc',
    '.myui-content__detail .content',
    '.vod_content',
    '.desc',
    '.content'
  ])
}

function parseEpisodes($, url) {
  const selectors = [
    '.module-play-list a',
    '.stui-content__playlist a',
    '.myui-content__list a',
    '.playlist a',
    '.play-list a',
    '.anthology-list a',
    '.hl-plays-list a',
    '.vodplayinfo a',
    'a[href*="/vodplay/"]',
    'a[href*="/play/"]'
  ]
  let links = []
  for (const selector of selectors) {
    links = $(selector).map((index, el) => {
      const href = absolute($(el).attr('href'), url)
      const name = clean($(el).text()) || `第${index + 1}集`
      return href ? `${name}$${href}` : ''
    }).get().filter(Boolean)
    if (links.length) break
  }

  const seen = {}
  links = links.filter(item => {
    const href = item.split('$').pop()
    if (seen[href]) return false
    seen[href] = true
    return true
  })
  return links
}

function parseEpisodeGroups($, url) {
  const groups = []
  const tabs = $('#url ul.py-tabs li, .py-tabs li').map((index, el) => clean($(el).text()) || `线路${index + 1}`).get()
  const lists = $('#url .bd ul.player, .bd ul.player')

  lists.each((index, el) => {
    const links = $(el).find('a[href]').map((episodeIndex, item) => {
      const href = absolute($(item).attr('href'), url)
      const name = clean($(item).text()) || `第${episodeIndex + 1}集`
      return href ? `${name}$${href}` : ''
    }).get().filter(Boolean)
    if (!links.length) return
    groups.push({
      name: tabs[index] || `线路${index + 1}`,
      urls: links
    })
  })

  if (groups.length) return groups
  const links = parseEpisodes($, url)
  return links.length ? [{ name: 'QMP4', urls: links }] : []
}

function extractMedia(text) {
  const patterns = [
    /https?:\/\/[^"'\\\s]+?\.m3u8[^"'\\\s]*/i,
    /https?:\/\/[^"'\\\s]+?\.mp4[^"'\\\s]*/i,
    /https?:\/\/[^"'\\\s]+?\.flv[^"'\\\s]*/i
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return normalizeUrl(match[0])
  }
  return ''
}

function base64Decode(input) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let str = String(input || '').replace(/=+$/, '')
  let output = ''
  if (str.length % 4 === 1) return input
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++));) {
    buffer = chars.indexOf(buffer)
    if (buffer < 0) continue
    bs = bc % 4 ? bs * 64 + buffer : buffer
    if (bc++ % 4) output += String.fromCharCode(255 & bs >> (-2 * bc & 6))
  }
  try {
    return decodeURIComponent(escape(output))
  } catch (e) {
    return output
  }
}

function normalizeUrl(url) {
  url = String(url || '')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .trim()
  try {
    url = decodeURIComponent(url)
  } catch (e) {
  }
  return url
}

function parsePlayerObject(html) {
  const match = html.match(/(?:var\s+)?(?:player_aaaa|player_data)\s*=\s*(\{[\s\S]*?\})\s*(?:<\/script>|;)/i)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch (e) {
    return null
  }
}

function decodePlayerUrl(player) {
  if (!player || !player.url) return ''
  let url = String(player.url)
  if (Number(player.encrypt) === 1) url = unescape(url)
  if (Number(player.encrypt) === 2) url = base64Decode(url)
  return normalizeUrl(url)
}

function isMedia(url) {
  return /\.(m3u8|mp4|mkv|flv|avi|mov)(\?|$)/i.test(url)
}

function safe(fn, fallback) {
  try { return fn() } catch (e) { console.log('qmp4 safe catch', e && e.message); return fallback }
}

export default {
  init(ext) {
    safe(() => initHosts(ext))
  },

  home(filter) {
    return safe(() => {
    const filters = {
      1: [
        {
          key: 'class',
          name: '类型',
          value: [
            { n: '全部', v: '' },
            { n: '剧情', v: '剧情' },
            { n: '动作', v: '动作' },
            { n: '喜剧', v: '喜剧' },
            { n: '爱情', v: '爱情' },
            { n: '科幻', v: '科幻' },
            { n: '悬疑', v: '悬疑' },
            { n: '恐怖', v: '恐怖' }
          ]
        },
        {
          key: 'area',
          name: '地区',
          value: [
            { n: '全部', v: '' },
            { n: '大陆', v: '大陆' },
            { n: '香港', v: '香港' },
            { n: '台湾', v: '台湾' },
            { n: '美国', v: '美国' },
            { n: '日本', v: '日本' },
            { n: '韩国', v: '韩国' }
          ]
        },
        {
          key: 'year',
          name: '年份',
          value: [
            { n: '全部', v: '' },
            { n: '2026', v: '2026' },
            { n: '2025', v: '2025' },
            { n: '2024', v: '2024' }
          ]
        },
        {
          key: 'by',
          name: '排序',
          value: [
            { n: '时间', v: 'time' },
            { n: '人气', v: 'hits' },
            { n: '评分', v: 'score' }
          ]
        }
      ]
    }
    return json({ class: CATEGORIES, filters: filter ? filters : {} })
    }, json({ class: CATEGORIES, filters: {} }))
  },

  homeVod() {
    return safe(() => {
    const { html, url } = getFirst(['/'])
    return json({ list: parseCards(html, url).slice(0, 30) })
    }, json({ list: [] }))
  },

  category(tid, pg, filter, extend) {
    return safe(() => {
    const { html, url } = getFirst(categoryPaths(tid, pg, extend || {}))
    return json({
      page: Number(pg || 1),
      pagecount: parseCards(html, url).length ? 999 : 1,
      list: parseCards(html, url)
    })
    }, json({ page: 1, pagecount: 1, list: [] }))
  },

  detail(id) {
    return safe(() => {
    const url = absolute(id)
    const html = getByUrl(url)
    if (!html) return json({ list: [{ vod_id: url || id, vod_name: '', vod_pic: '', vod_content: '', vod_play_from: '', vod_play_url: '' }] })
    const $ = load(html)
    const root = $.root()
    let playGroups = parseEpisodeGroups($, url)
    const media = extractMedia(html)
    if (!playGroups.length && media) playGroups = [{ name: 'QMP4', urls: [`播放$${media}`] }]

    const name = (titleFrom($, root) || clean($('title').text()).replace(/[-_].*$/, '')).replace(/\(\d{4}\)$/, '').trim()
    return json({
      list: [{
        vod_id: url,
        vod_name: name || '',
        vod_pic: picFrom($, root, url),
        vod_content: contentFrom($, root),
        vod_play_from: playGroups.map(group => group.name).join('$$$'),
        vod_play_url: playGroups.map(group => group.urls.join('#')).join('$$$')
      }]
    })
    }, json({ list: [{ vod_id: id || '', vod_name: '', vod_pic: '', vod_content: '', vod_play_from: '', vod_play_url: '' }] }))
  },

  search(key, quick, pg = '1') {
    return safe(() => {
    const { html, url } = getFirst(searchPaths(key, pg))
    let list = []
    try {
      const data = JSON.parse(html)
      const items = data.list || data.data || []
      list = items.map(item => ({
        vod_id: absolute(item.url || item.href || item.link || (item.id ? `/mv/${item.id}.html` : ''), host),
        vod_name: clean(item.name || item.title),
        vod_pic: absolute(item.pic || item.img || item.vod_pic, host),
        vod_remarks: clean(item.remarks || item.note || item.vod_remarks || item.en)
      })).filter(item => item.vod_id && item.vod_name)
    } catch (e) {
      list = parseCards(html, url)
    }
    return json({
      page: Number(pg || 1),
      pagecount: list.length ? 99 : 1,
      list
    })
    }, json({ page: 1, pagecount: 1, list: [] }))
  },

  play(flag, id, flags) {
    return safe(() => {
    id = normalizeUrl(id)
    if (isMedia(id)) return json({ parse: 0, url: id, header: headers(id) })

    const url = absolute(id)
    const html = getByUrl(url)
    const player = parsePlayerObject(html)
    const playerUrl = decodePlayerUrl(player)
    if (isMedia(playerUrl)) return json({ parse: 0, url: absolute(playerUrl, url), header: headers(url) })

    const media = extractMedia(html)
    if (media) return json({ parse: 0, url: media, header: headers(url) })

    return json({ parse: 1, url })
    }, json({ parse: 1, url: normalizeUrl(id || '') }))
  },

  sniffer() {
    return true
  },

  isVideo(url) {
    return isMedia(url)
  },

  proxy(params) {
    return [404, 'text/plain', '']
  },

  destroy() {
  }
}

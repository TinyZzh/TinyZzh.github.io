import { load } from 'assets://js/lib/cheerio.min.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
const DEFAULT_HOSTS = ['https://mxvid.com', 'https://isvod.com', 'https://ucvod.com']

const CATEGORIES = [
  { type_id: 'dianying', type_name: '电影' },
  { type_id: 'dianshiju', type_name: '电视剧' },
  { type_id: 'zongyi', type_name: '综艺' },
  { type_id: 'dongman', type_name: '动漫' },
  { type_id: 'duanju', type_name: '短剧' },
  { type_id: 'tiyu', type_name: '体育' }
]

let hosts = [...DEFAULT_HOSTS]
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
    if (seen[item.vod_id]) return false
    seen[item.vod_id] = true
    return true
  })
}

function initHosts(ext) {
  if (!ext) return
  if (ext.host) {
    const h = trimHost(ext.host)
    if (h) hosts = [h, ...DEFAULT_HOSTS]
  }
}

function headers(referer) {
  return {
    'User-Agent': UA,
    'Referer': referer || hosts[0],
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
    html.includes('cf-browser-verification')
}

function request(url, referer) {
  try {
    const res = req(url, {
      headers: headers(referer),
      timeout: 15000,
      redirect: 1
    })
    return ok(res) ? res.content : ''
  } catch (e) {
    return ''
  }
}

function absolute(url, base) {
  base = base || hosts[0]
  url = clean(url)
  if (!url || url.startsWith('javascript:') || url === '#') return ''
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('http')) return url
  const baseUrl = base.match(/^https?:\/\/[^/]+/i)
  const origin = baseUrl ? trimHost(baseUrl[0]) : trimHost(base)
  if (url.startsWith('/')) return origin + url
  return origin + '/' + url
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

function isMedia(url) {
  return /\.(m3u8|mp4|mkv|flv|avi|mov)(\?|$)/i.test(url)
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

function playToDetailId(href) {
  const m = String(href).match(/\/vodplay\/(\d+)-/)
  if (m) return m[1]
  return ''
}

function playToDetailUrl(href, base) {
  const id = playToDetailId(href)
  if (id) return absolute(`/voddetail/${id}.html`, base)
  return href
}

function getFirst(paths, referer) {
  for (const h of hosts) {
    for (const p of paths) {
      const url = h + p
      const html = request(url, referer || h)
      if (html) return { html, host: h, url }
    }
  }
  return { html: '', host: hosts[0], url: '' }
}

function cardFrom($, el, base) {
  const root = $(el)

  const titleA = root.find('.module-item-titlebox .module-item-title').first()
  const picA = root.find('.module-item-pic a').first()
  const a = titleA.length ? titleA : picA.length ? picA : root.find('a').first()
  if (!a.length) return null

  const playHref = absolute(a.attr('href'), base)
  if (!playHref) return null

  const vodId = playToDetailUrl(playHref, base)

  const img = root.find('.module-item-pic img').first()
  const pic = absolute(
    img.attr('data-src') || img.attr('data-original') || img.attr('src'),
    base
  )

  const name = clean(titleA.text()) || clean(a.attr('title')) || clean(a.text())

  const remarks = root.find('.module-item-caption .video-class').first().text().trim() ||
    root.find('.pic-text').first().text().trim()

  if (!vodId || !name) return null
  return {
    vod_id: vodId,
    vod_name: name,
    vod_pic: pic,
    vod_remarks: clean(remarks)
  }
}

function parseCards(html, base) {
  const $ = load(html)
  const selectors = [
    '.module-items .module-item',
    'ul.myui-vodlist > li',
    '.myui-vodlist li',
    'ul.myui-vodlist__media > li',
    '.myui-vodlist__media li',
    'ul.content-list > li',
    '.content-list li'
  ]
  let list = []
  for (const selector of selectors) {
    list = $(selector).map((_, el) => cardFrom($, el, base)).get().filter(Boolean)
    if (list.length) break
  }
  return uniq(list)
}

function parseSearchCards(html, base) {
  const $ = load(html)
  const selectors = [
    '.module-items .module-item',
    'ul#searchList > li',
    'ul.myui-vodlist__media > li',
    'ul.myui-vodlist > li',
    '.module-search-item'
  ]
  let list = []
  for (const selector of selectors) {
    list = $(selector).map((_, el) => {
      const root = $(el)
      const titleA = root.find('.module-item-titlebox .module-item-title, h4.title a, h4 a, .title a').first()
      const picA = root.find('.module-item-pic a, a.myui-vodlist__thumb').first()
      const a = titleA.length ? titleA : picA.length ? picA : root.find('a').first()
      const href = absolute(a.attr('href'), base)
      const vodId = playToDetailUrl(href, base)
      const img = root.find('.module-item-pic img, img').first()
      const pic = absolute(
        img.attr('data-src') || img.attr('data-original') || img.attr('src'),
        base
      )
      const name = clean(titleA.text()) || clean(a.attr('title')) || clean(a.text())
      const remarks = root.find('.module-item-caption .video-class, .pic-text, .tag').first().text().trim()
      if (!vodId || !name) return null
      return { vod_id: vodId, vod_name: name, vod_pic: pic, vod_remarks: clean(remarks) }
    }).get().filter(Boolean)
    if (list.length) break
  }
  return uniq(list)
}

function buildFilterUrl(tid, pg, extend) {
  const page = pg || '1'
  const area = (extend && extend.area) || ''
  const by = (extend && extend.by) || ''
  const klass = (extend && extend.class) || ''
  const lang = (extend && extend.lang) || ''
  const year = (extend && extend.year) || ''
  const segments = [tid, area, by, klass, '', lang, '', '', page, '', '', year]
  return `/vodshow/${segments.join('-')}.html`
}

const FILTERS = {
  dianying: [
    {
      key: 'class',
      name: '类型',
      value: [
        { n: '全部', v: '' }, { n: '动作', v: '动作' }, { n: '喜剧', v: '喜剧' },
        { n: '爱情', v: '爱情' }, { n: '科幻', v: '科幻' }, { n: '恐怖', v: '恐怖' },
        { n: '剧情', v: '剧情' }, { n: '战争', v: '战争' }, { n: '悬疑', v: '悬疑' },
        { n: '动画', v: '动画' }, { n: '奇幻', v: '奇幻' }, { n: '灾难', v: '灾难' },
        { n: '纪录片', v: '纪录片' }
      ]
    },
    {
      key: 'area',
      name: '地区',
      value: [
        { n: '全部', v: '' }, { n: '大陆', v: '大陆' }, { n: '香港', v: '香港' },
        { n: '台湾', v: '台湾' }, { n: '美国', v: '美国' }, { n: '韩国', v: '韩国' },
        { n: '日本', v: '日本' }, { n: '英国', v: '英国' }, { n: '法国', v: '法国' },
        { n: '泰国', v: '泰国' }, { n: '印度', v: '印度' }
      ]
    },
    {
      key: 'year',
      name: '年份',
      value: [
        { n: '全部', v: '' }, { n: '2026', v: '2026' }, { n: '2025', v: '2025' },
        { n: '2024', v: '2024' }, { n: '2023', v: '2023' }, { n: '2022', v: '2022' },
        { n: '2021', v: '2021' }, { n: '2020', v: '2020' }
      ]
    },
    {
      key: 'lang',
      name: '语言',
      value: [
        { n: '全部', v: '' }, { n: '国语', v: '国语' }, { n: '粤语', v: '粤语' },
        { n: '英语', v: '英语' }, { n: '韩语', v: '韩语' }, { n: '日语', v: '日语' }
      ]
    },
    {
      key: 'by',
      name: '排序',
      value: [
        { n: '时间', v: '' }, { n: '人气', v: '人气' }, { n: '评分', v: '评分' }
      ]
    }
  ],
  dianshiju: [
    {
      key: 'class',
      name: '类型',
      value: [
        { n: '全部', v: '' }, { n: '古装', v: '古装' }, { n: '言情', v: '言情' },
        { n: '武侠', v: '武侠' }, { n: '偶像', v: '偶像' }, { n: '家庭', v: '家庭' },
        { n: '喜剧', v: '喜剧' }, { n: '悬疑', v: '悬疑' }, { n: '犯罪', v: '犯罪' }
      ]
    },
    {
      key: 'area',
      name: '地区',
      value: [
        { n: '全部', v: '' }, { n: '大陆', v: '大陆' }, { n: '香港', v: '香港' },
        { n: '台湾', v: '台湾' }, { n: '美国', v: '美国' }, { n: '韩国', v: '韩国' },
        { n: '日本', v: '日本' }, { n: '英国', v: '英国' }, { n: '泰国', v: '泰国' }
      ]
    },
    {
      key: 'year',
      name: '年份',
      value: [
        { n: '全部', v: '' }, { n: '2026', v: '2026' }, { n: '2025', v: '2025' },
        { n: '2024', v: '2024' }, { n: '2023', v: '2023' }, { n: '2022', v: '2022' }
      ]
    },
    {
      key: 'by',
      name: '排序',
      value: [
        { n: '时间', v: '' }, { n: '人气', v: '人气' }, { n: '评分', v: '评分' }
      ]
    }
  ],
  zongyi: [
    {
      key: 'area',
      name: '地区',
      value: [
        { n: '全部', v: '' }, { n: '大陆', v: '大陆' }, { n: '韩国', v: '韩国' },
        { n: '日本', v: '日本' }, { n: '美国', v: '美国' }
      ]
    },
    {
      key: 'year',
      name: '年份',
      value: [
        { n: '全部', v: '' }, { n: '2026', v: '2026' }, { n: '2025', v: '2025' },
        { n: '2024', v: '2024' }, { n: '2023', v: '2023' }
      ]
    },
    {
      key: 'by',
      name: '排序',
      value: [
        { n: '时间', v: '' }, { n: '人气', v: '人气' }, { n: '评分', v: '评分' }
      ]
    }
  ],
  dongman: [
    {
      key: 'class',
      name: '类型',
      value: [
        { n: '全部', v: '' }, { n: '情感', v: '情感' }, { n: '科幻', v: '科幻' },
        { n: '热血', v: '热血' }, { n: '推理', v: '推理' }, { n: '冒险', v: '冒险' },
        { n: '搞笑', v: '搞笑' }, { n: '少女', v: '少女' }
      ]
    },
    {
      key: 'area',
      name: '地区',
      value: [
        { n: '全部', v: '' }, { n: '国产', v: '国产' }, { n: '日韩', v: '日韩' },
        { n: '欧美', v: '欧美' }
      ]
    },
    {
      key: 'year',
      name: '年份',
      value: [
        { n: '全部', v: '' }, { n: '2026', v: '2026' }, { n: '2025', v: '2025' },
        { n: '2024', v: '2024' }, { n: '2023', v: '2023' }
      ]
    },
    {
      key: 'by',
      name: '排序',
      value: [
        { n: '时间', v: '' }, { n: '人气', v: '人气' }, { n: '评分', v: '评分' }
      ]
    }
  ]
}

function getFiltersForType(tid) {
  return FILTERS[tid] || [
    {
      key: 'by',
      name: '排序',
      value: [
        { n: '时间', v: '' }, { n: '人气', v: '人气' }, { n: '评分', v: '评分' }
      ]
    }
  ]
}

function safe(fn, fallback) {
  try { return fn() } catch (e) { return fallback }
}

function parseDetail(html, url) {
  const $ = load(html)
  const root = $.root()

  const name = root.find('h1.page-title').first().text().trim() ||
    root.find('.module-info-heading h1, h1.title').first().text().trim() ||
    clean($('title').text()).replace(/[-_–—].*$/, '').replace(/\s*(在线观看|线上看|免费)\s*/g, '').trim()

  const img = root.find('div.video-cover img').first()
  const pic = absolute(
    img.attr('data-src') || img.attr('data-original') || img.attr('src'),
    url
  )

  const content = root.find('div.vod_content span').first().text().trim() ||
    root.find('.module-info-introduction-content, .content .sketch').first().text().trim()

  const tabNames = []
  root.find('div.module-tab-item.tab-item').each((_, el) => {
    const val = $(el).attr('data-dropdown-value') || clean($(el).find('span').first().text())
    if (val) tabNames.push(val)
  })

  const playGroups = []
  root.find('div.module-list.module-player-list[id^="glist-"]').each((index, pane) => {
    const links = []
    $(pane).find('div.scroll-content a, div.module-blocklist a').each((_, a) => {
      const href = absolute($(a).attr('href'), url)
      const epName = clean($(a).find('span').first().text()) || clean($(a).text())
      if (href && href.includes('/vodplay/')) links.push(`${epName || '第' + (links.length + 1) + '集'}$${href}`)
    })
    if (!links.length) return

    const groupName = (index < tabNames.length ? tabNames[index] : '') || `线路${index + 1}`
    playGroups.push({ name: groupName, urls: links })
  })

  if (!playGroups.length) {
    const links = []
    root.find('div.scroll-content a[href*="/vodplay/"], a[href*="/vodplay/"]').each((_, a) => {
      const href = absolute($(a).attr('href'), url)
      const epName = clean($(a).find('span').first().text()) || clean($(a).text())
      if (href) links.push(`${epName || '第' + (links.length + 1) + '集'}$${href}`)
    })
    if (links.length) playGroups.push({ name: 'MXVID', urls: links })
  }

  return {
    vod_id: url,
    vod_name: name || '',
    vod_pic: pic,
    vod_content: content,
    vod_play_from: playGroups.map(g => g.name).join('$$$'),
    vod_play_url: playGroups.map(g => g.urls.join('#')).join('$$$')
  }
}

export default {
  init(ext) {
    safe(() => initHosts(ext))
  },

  home(filter) {
    return safe(() => {
      const filters = {}
      for (const cat of CATEGORIES) {
        filters[cat.type_id] = getFiltersForType(cat.type_id)
      }
      return json({ class: CATEGORIES, filters: filter ? filters : {} })
    }, json({ class: CATEGORIES, filters: {} }))
  },

  homeVod() {
    return safe(() => {
      const result = getFirst(['/'])
      if (!result.html) return json({ list: [] })
      return json({ list: parseCards(result.html, result.host).slice(0, 30) })
    }, json({ list: [] }))
  },

  category(tid, pg, filter, extend) {
    return safe(() => {
      const page = pg || '1'
      const hasFilter = extend && (extend.area || extend.by || extend.class || extend.lang || extend.year)
      let path
      if (hasFilter) {
        path = buildFilterUrl(tid, page, extend)
      } else {
        path = page === '1' ? `/vodtype/${tid}.html` : `/vodtype/${tid}-${page}.html`
      }
      const result = getFirst([path])
      const list = parseCards(result.html, result.host)
      return json({ page: Number(page), pagecount: list.length ? 999 : 1, list })
    }, json({ page: 1, pagecount: 1, list: [] }))
  },

  detail(id) {
    return safe(() => {
      for (const h of hosts) {
        const url = absolute(id, h)
        if (!url) continue
        const html = request(url, h)
        if (html) return json({ list: [parseDetail(html, url)] })
      }
      return json({ list: [{ vod_id: id || '', vod_name: '', vod_pic: '', vod_content: '', vod_play_from: '', vod_play_url: '' }] })
    }, json({ list: [{ vod_id: id || '', vod_name: '', vod_pic: '', vod_content: '', vod_play_from: '', vod_play_url: '' }] }))
  },

  search(key, quick, pg = '1') {
    return safe(() => {
      const page = pg || '1'
      const wd = encodeURIComponent(key)
      const paths = [
        page === '1'
          ? `/vodsearch/-------------.html?wd=${wd}`
          : `/vodsearch/${wd}----------${page}---.html`
      ]
      const result = getFirst(paths)
      const list = parseSearchCards(result.html, result.host)
      return json({ page: Number(page), pagecount: list.length ? 99 : 1, list })
    }, json({ page: 1, pagecount: 1, list: [] }))
  },

  play(flag, id, flags) {
    return safe(() => {
      id = normalizeUrl(id)
      if (isMedia(id)) return json({ parse: 0, url: id, header: headers(id) })

      const url = absolute(id)
      const html = request(url)

      const playerMatch = html.match(/var\s+player_aaaa\s*=\s*(\{[\s\S]*?\})\s*<\/script>/i) ||
        html.match(/var\s+player_data\s*=\s*(\{[\s\S]*?\})\s*<\/script>/i)
      if (playerMatch) {
        try {
          const player = JSON.parse(playerMatch[1])
          if (player.url) {
            let playerUrl = normalizeUrl(String(player.url))
            if (Number(player.encrypt) === 1) playerUrl = normalizeUrl(unescape(playerUrl))
            if (Number(player.encrypt) === 2) playerUrl = normalizeUrl(base64Decode(playerUrl))
            if (playerUrl) return json({ parse: 0, url: absolute(playerUrl, url), header: headers(url) })
          }
        } catch (e) {
        }
      }

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

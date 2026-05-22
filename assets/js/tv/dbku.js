import { load } from 'assets://js/lib/cheerio.min.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
const DEFAULT_HOST = 'https://www.dbku.tv'

const CATEGORIES = [
  { type_id: '2', type_name: '连续剧' },
  { type_id: '1', type_name: '电影' },
  { type_id: '3', type_name: '综艺' },
  { type_id: '4', type_name: '动漫' },
  { type_id: '13', type_name: '陆剧' },
  { type_id: '15', type_name: '日韩剧' },
  { type_id: '20', type_name: '港剧' },
  { type_id: '14', type_name: '台泰剧' },
  { type_id: '21', type_name: '短剧' }
]

let host = DEFAULT_HOST
const json = value => JSON.stringify(value)

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function trimHost(value) {
  value = clean(value)
  return value ? value.replace(/\/+$/, '') : ''
}

function initHost(ext) {
  if (!ext) return
  if (ext.host) host = trimHost(ext.host)
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
    html.includes('cf-browser-verification')
}

function request(url, referer = host) {
  try {
    const res = req(url, {
      headers: headers(referer),
      timeout: 15000,
      redirect: 1
    })
    return ok(res) ? res.content : ''
  } catch (e) {
    console.log('dbku request failed', url, e && e.message)
    return ''
  }
}

function absolute(url, base = host) {
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

function cardFrom($, el, base) {
  const root = $(el)
  let a = root.find('a.myui-vodlist__thumb').first()
  if (!a.length) a = root.find('a[href*="/voddetail/"]').first()
  if (!a.length) a = root.find('a[href]').first()

  const href = absolute(a.attr('href'), base)
  const pic = absolute(
    a.attr('data-original') || root.find('img').attr('data-original') || root.find('img').attr('src'),
    base
  )
  const name = clean(a.attr('title')) ||
    root.find('h4.title a, h4.title').first().text().trim() ||
    clean(a.text())

  const remarks = root.find('.pic-text').first().text().trim() ||
    root.find('.tag').first().text().trim()

  if (!href || !name) return null
  return {
    vod_id: href,
    vod_name: name,
    vod_pic: pic,
    vod_remarks: clean(remarks)
  }
}

function parseCards(html, base) {
  const $ = load(html)
  const selectors = [
    'ul.myui-vodlist > li',
    '.myui-vodlist li',
    'ul.myui-vodlist__media > li',
    '.myui-vodlist__media li'
  ]
  let list = []
  for (const selector of selectors) {
    list = $(selector).map((_, el) => cardFrom($, el, base)).get().filter(Boolean)
    if (list.length) break
  }
  const seen = {}
  return list.filter(item => {
    if (seen[item.vod_id]) return false
    seen[item.vod_id] = true
    return true
  })
}

function parseSearchCards(html, base) {
  const $ = load(html)
  const selectors = [
    'ul#searchList > li',
    'ul.myui-vodlist__media > li',
    'ul.myui-vodlist > li'
  ]
  let list = []
  for (const selector of selectors) {
    list = $(selector).map((_, el) => {
      const root = $(el)
      const thumbA = root.find('a.myui-vodlist__thumb').first()
      const titleA = root.find('h4.title a, a.searchkey').first()
      const href = absolute(titleA.attr('href') || thumbA.attr('href'), base)
      const pic = absolute(
        thumbA.attr('data-original') || root.find('img').attr('data-original'),
        base
      )
      const name = clean(titleA.text()) || clean(thumbA.attr('title'))
      const remarks = root.find('.pic-text').first().text().trim()
      if (!href || !name) return null
      return { vod_id: href, vod_name: name, vod_pic: pic, vod_remarks: clean(remarks) }
    }).get().filter(Boolean)
    if (list.length) break
  }
  return list
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
  1: [
    {
      key: 'class',
      name: '类型',
      value: [
        { n: '全部', v: '' },
        { n: '喜剧', v: '喜剧' },
        { n: '爱情', v: '爱情' },
        { n: '恐怖', v: '恐怖' },
        { n: '动作', v: '动作' },
        { n: '科幻', v: '科幻' },
        { n: '剧情', v: '剧情' },
        { n: '警匪', v: '警匪' },
        { n: '战争', v: '战争' },
        { n: '犯罪', v: '犯罪' },
        { n: '动画', v: '动画' },
        { n: '奇幻', v: '奇幻' },
        { n: '武侠', v: '武侠' },
        { n: '冒险', v: '冒险' },
        { n: '悬疑', v: '悬疑' },
        { n: '惊悚', v: '惊悚' },
        { n: '古装', v: '古装' }
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
        { n: '韩国', v: '韩国' },
        { n: '英国', v: '英国' },
        { n: '法国', v: '法国' },
        { n: '加拿大', v: '加拿大' },
        { n: '澳大利亚', v: '澳大利亚' }
      ]
    },
    {
      key: 'year',
      name: '年份',
      value: [
        { n: '全部', v: '' },
        { n: '2026', v: '2026' },
        { n: '2025', v: '2025' },
        { n: '2024', v: '2024' },
        { n: '2023', v: '2023' },
        { n: '2022', v: '2022' },
        { n: '2020', v: '2020' },
        { n: '2019', v: '2019' }
      ]
    },
    {
      key: 'lang',
      name: '语言',
      value: [
        { n: '全部', v: '' },
        { n: '国语', v: '国语' },
        { n: '粤语', v: '粤语' },
        { n: '韩语', v: '韩语' },
        { n: '英语', v: '英语' },
        { n: '法语', v: '法语' }
      ]
    },
    {
      key: 'by',
      name: '排序',
      value: [
        { n: '时间', v: '' },
        { n: '人气', v: '人气' },
        { n: '评分', v: '评分' }
      ]
    }
  ],
  2: [
    {
      key: 'class',
      name: '类型',
      value: [
        { n: '全部', v: '' },
        { n: '剧情', v: '剧情' },
        { n: '悬疑', v: '悬疑' },
        { n: '犯罪', v: '犯罪' },
        { n: '喜剧', v: '喜剧' },
        { n: '爱情', v: '爱情' },
        { n: '科幻', v: '科幻' },
        { n: '恐怖', v: '恐怖' },
        { n: '动作', v: '动作' },
        { n: '奇幻', v: '奇幻' },
        { n: '古装', v: '古装' },
        { n: '战争', v: '战争' }
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
        { n: '韩国', v: '韩国' },
        { n: '日本', v: '日本' },
        { n: '美国', v: '美国' },
        { n: '泰国', v: '泰国' },
        { n: '英国', v: '英国' }
      ]
    },
    {
      key: 'year',
      name: '年份',
      value: [
        { n: '全部', v: '' },
        { n: '2026', v: '2026' },
        { n: '2025', v: '2025' },
        { n: '2024', v: '2024' },
        { n: '2023', v: '2023' },
        { n: '2022', v: '2022' },
        { n: '2020', v: '2020' },
        { n: '2019', v: '2019' }
      ]
    },
    {
      key: 'by',
      name: '排序',
      value: [
        { n: '时间', v: '' },
        { n: '人气', v: '人气' },
        { n: '评分', v: '评分' }
      ]
    }
  ],
  3: [
    {
      key: 'area',
      name: '地区',
      value: [
        { n: '全部', v: '' },
        { n: '大陆', v: '大陆' },
        { n: '韩国', v: '韩国' },
        { n: '日本', v: '日本' }
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
        { n: '时间', v: '' },
        { n: '人气', v: '人气' },
        { n: '评分', v: '评分' }
      ]
    }
  ],
  4: [
    {
      key: 'class',
      name: '类型',
      value: [
        { n: '全部', v: '' },
        { n: '剧情', v: '剧情' },
        { n: '喜剧', v: '喜剧' },
        { n: '冒险', v: '冒险' },
        { n: '科幻', v: '科幻' },
        { n: '动作', v: '动作' },
        { n: '奇幻', v: '奇幻' }
      ]
    },
    {
      key: 'area',
      name: '地区',
      value: [
        { n: '全部', v: '' },
        { n: '大陆', v: '大陆' },
        { n: '日本', v: '日本' },
        { n: '韩国', v: '韩国' },
        { n: '美国', v: '美国' }
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
        { n: '时间', v: '' },
        { n: '人气', v: '人气' },
        { n: '评分', v: '评分' }
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
        { n: '时间', v: '' },
        { n: '人气', v: '人气' },
        { n: '评分', v: '评分' }
      ]
    }
  ]
}

function safe(fn, fallback) {
  try { return fn() } catch (e) { console.log('dbku safe catch', e && e.message); return fallback }
}

export default {
  init(ext) {
    safe(() => initHost(ext))
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
      const html = request(host + '/')
      return json({ list: parseCards(html, host).slice(0, 30) })
    }, json({ list: [] }))
  },

  category(tid, pg, filter, extend) {
    return safe(() => {
      const page = pg || '1'
      const hasFilter = extend && (extend.area || extend.by || extend.class || extend.lang || extend.year)
      let url
      if (hasFilter) {
        url = host + buildFilterUrl(tid, page, extend)
      } else {
        url = page === '1' ? `${host}/vodtype/${tid}.html` : `${host}/vodtype/${tid}-${page}.html`
      }
      const html = request(url)
      const list = parseCards(html, host)
      return json({ page: Number(page), pagecount: list.length ? 999 : 1, list })
    }, json({ page: 1, pagecount: 1, list: [] }))
  },

  detail(id) {
    return safe(() => {
      const url = absolute(id)
      const html = request(url)
      if (!html) return json({ list: [{ vod_id: url || id, vod_name: '', vod_pic: '', vod_content: '', vod_play_from: '', vod_play_url: '' }] })
      const $ = load(html)
      const root = $.root()

      const name = root.find('.myui-content__detail h1.title').first().text().trim() ||
        clean($('title').text()).replace(/[-_].*$/, '').replace(/\s*线上看\s*/, '').trim()

      const pic = absolute(
        root.find('.myui-content__thumb img').attr('data-original') ||
        root.find('.myui-content__thumb img').attr('src'),
        url
      )

      const content = root.find('.content .sketch, .content .data p, .myui-content__detail .data').first().text().trim()

      const playGroups = []
      const tabPanes = root.find('.tab-content .tab-pane')
      tabPanes.each((index, pane) => {
        const links = []
        $(pane).find('ul.myui-content__list a[href], a[href*="/vodplay/"]').each((_, a) => {
          const href = absolute($(a).attr('href'), url)
          const epName = clean($(a).text())
          if (href) links.push(`${epName || '第' + (links.length + 1) + '集'}$${href}`)
        })
        if (!links.length) return
        playGroups.push({ name: `线路${index + 1}`, urls: links })
      })

      if (!playGroups.length) {
        const links = []
        root.find('ul.myui-content__list a[href*="/vodplay/"]').each((_, a) => {
          const href = absolute($(a).attr('href'), url)
          const epName = clean($(a).text())
          if (href) links.push(`${epName || '第' + (links.length + 1) + '集'}$${href}`)
        })
        if (links.length) playGroups.push({ name: 'DBKU', urls: links })
      }

      return json({
        list: [{
          vod_id: url,
          vod_name: name || '',
          vod_pic: pic,
          vod_content: content,
          vod_play_from: playGroups.map(g => g.name).join('$$$'),
          vod_play_url: playGroups.map(g => g.urls.join('#')).join('$$$')
        }]
      })
    }, json({ list: [{ vod_id: id || '', vod_name: '', vod_pic: '', vod_content: '', vod_play_from: '', vod_play_url: '' }] }))
  },

  search(key, quick, pg = '1') {
    return safe(() => {
      const page = pg || '1'
      const wd = encodeURIComponent(key)
      let url
      if (page === '1') {
        url = `${host}/vodsearch/-------------.html?wd=${wd}`
      } else {
        url = `${host}/vodsearch/${wd}----------${page}---.html`
      }
      const html = request(url)
      const list = parseSearchCards(html, host)
      return json({ page: Number(page), pagecount: list.length ? 99 : 1, list })
    }, json({ page: 1, pagecount: 1, list: [] }))
  },

  play(flag, id, flags) {
    return safe(() => {
      id = normalizeUrl(id)
      if (isMedia(id)) return json({ parse: 0, url: id, header: headers(id) })

      const url = absolute(id)
      const html = request(url)

      const playerMatch = html.match(/var\s+player_data\s*=\s*(\{[\s\S]*?\})\s*(?:<\/script>|;)/i)
      if (playerMatch) {
        try {
          const player = JSON.parse(playerMatch[1])
          if (player.url) {
            let playerUrl = String(player.url)
            if (Number(player.encrypt) === 1) playerUrl = unescape(playerUrl)
            if (Number(player.encrypt) === 2) playerUrl = base64Decode(playerUrl)
            playerUrl = normalizeUrl(playerUrl)
            if (isMedia(playerUrl)) return json({ parse: 0, url: absolute(playerUrl, url), header: headers(url) })
          }
        } catch (e) {
          console.log('dbku player_data parse error', e && e.message)
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

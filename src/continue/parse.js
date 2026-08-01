import studio from './studio'

/**
 * Разбор названия торрент-раздачи.
 *
 * Свой, а не штатный Lampa.TitleParser: у того три дыры, которые нам критичны —
 * CAMRip/TSRip не распознаются (шаблон 'CAM(?![a-zA-Z])' ломается о 'Rip'),
 * кириллическая 'х' в '03х01' даёт первый сезон вместо третьего,
 * а 'HDR10+' не считается за HDR. Починить в апстриме мы не можем.
 *
 * @param {string} title - название раздачи
 * @returns {{source: string, is_cam: boolean, source_rank: number, resolution: number|null,
 *            hdr: boolean, dv: boolean, season: number|null, seasons: number[],
 *            episodes: number[]|null, year: number|null, voices: string[], langs: string[]}}
 */
function parse(title) {
    let raw = (title || '') + ''
    let norm = normalize(raw)

    let source = detectSource(norm)

    return {
        source: source,
        is_cam: CAM_SOURCES.indexOf(source) >= 0,
        source_rank: SOURCE_RANK[source] || 0,
        resolution: detectResolution(norm),
        hdr: detectHdr(norm),
        dv: detectDolbyVision(norm),
        season: detectSeason(norm),
        seasons: detectSeasons(norm),
        episodes: detectEpisodes(norm),
        year: detectYear(norm),
        voices: detectVoices(raw),
        langs: detectLangs(norm)
    }
}

/**
 * Приводим к нижнему регистру и чиним кириллицу в номерах.
 * В русских раздачах пишут '03х01' и '1080р' кириллическими буквами.
 */
function normalize(title) {
    return (title + '')
        .toLowerCase()
        .replace(/(\d)\s*х\s*(\d)/g, '$1x$2') // 03х01 -> 03x01
        .replace(/(\d{3,4})\s*р\b/g, '$1p') // 1080р -> 1080p
}

/** Экранки — их мы никогда не предлагаем по умолчанию */
const CAM_SOURCES = ['cam', 'ts', 'tc', 'screener']

/**
 * Чем выше ранг, тем лучше источник записи.
 * Экранки получают ноль, неопознанный источник — середину: отсутствие тега
 * в названии не повод считать раздачу плохой.
 */
const SOURCE_RANK = {
    bluray: 100,
    webdl: 90,
    bdrip: 80,
    webrip: 70,
    webdlrip: 65,
    hdrip: 60,
    hdtv: 50,
    dvdrip: 40,
    dvd: 30,
    unknown: 20,
    screener: 0,
    tc: 0,
    ts: 0,
    cam: 0
}

/**
 * Порядок проверок важен: сначала экранки, затем более длинные теги.
 * 'web-dlrip' обязан проверяться раньше 'web-dl', иначе поглотится.
 */
const SOURCE_PATTERNS = [
    ['cam', /\b(cam-?rip|hd-?cam|\bcam\b|экранка)/],
    ['ts', /\b(ts-?rip|tele-?sync|\bts\b)/],
    ['tc', /\b(tc-?rip|tele-?cine|\btc\b)/],
    ['screener', /\b(screener|dvd-?scr|\bscr\b)/],
    ['bluray', /\b(blu-?ray|bd-?remux|remux|bdmv)/],
    ['bdrip', /\bbd-?rip/],
    ['webdlrip', /\bweb-?dl-?rip/],
    ['webdl', /\bweb-?dl/],
    ['webrip', /\bweb-?rip/],
    ['hdrip', /\bhd-?rip/],
    ['hdtv', /\bhd-?tv/],
    ['dvdrip', /\bdvd-?rip/],
    ['dvd', /\bdvd/]
]

function detectSource(norm) {
    for (let i = 0; i < SOURCE_PATTERNS.length; i++) {
        if (SOURCE_PATTERNS[i][1].test(norm)) return SOURCE_PATTERNS[i][0]
    }

    return 'unknown'
}

/**
 * Разрешение из названия. Возвращаем null, если его нет — это НЕ признак экранки:
 * на живой выдаче четверть нормальных BDRip и WEB-DL идут без указания разрешения.
 */
function detectResolution(norm) {
    if (/\b(2160p?|4k|uhd|ultra-?hd)\b/.test(norm)) return 2160
    if (/\b(1080p?|full-?hd|fhd)\b/.test(norm)) return 1080
    if (/\b720p?\b/.test(norm)) return 720
    if (/\b480p?\b/.test(norm)) return 480

    return null
}

/**
 * После 'hdr' не должно идти букв, иначе за HDR принимаются 'HDRip'
 * и студия 'HDRezka' — оба случая пойманы на живой выдаче.
 */
function detectHdr(norm) {
    return /\bhdr(?![a-zа-яё])\d*\+?/.test(norm)
}

function detectDolbyVision(norm) {
    return /dolby\s*vision|\bdv\b/.test(norm)
}

/**
 * Сезон. Порядок паттернов от специфичного к общему.
 */
function detectSeason(norm) {
    let m

    if ((m = norm.match(/\b(\d{1,2})x\d{1,3}/))) return parseInt(m[1], 10)
    if ((m = norm.match(/\bs(\d{1,2})e\d{1,3}/))) return parseInt(m[1], 10)
    if ((m = norm.match(/(\d{1,2})\s*сезон/))) return parseInt(m[1], 10)
    if ((m = norm.match(/сезон[:\s]*(\d{1,2})/))) return parseInt(m[1], 10)
    // аниме пишут номер сезона как [ТВ-4] или [TV-2].
    // Границу \b использовать нельзя: кириллица не входит в \w
    if ((m = norm.match(/(?:^|[^a-zа-яё])(?:тв|tv)\s*-\s*(\d{1,2})\b/))) return parseInt(m[1], 10)
    if ((m = norm.match(/\bs(\d{1,2})\b/))) return parseInt(m[1], 10)

    return null
}

/** Диапазон сезонов: [s01-02] -> [1,2]. Для обычной раздачи — один сезон. */
function detectSeasons(norm) {
    let range = norm.match(/\bs(\d{1,2})\s*-\s*s?(\d{1,2})\b/)

    if (range) {
        let from = parseInt(range[1], 10)
        let to = parseInt(range[2], 10)
        let list = []

        for (let i = from; i <= to; i++) list.push(i)

        return list
    }

    let season = detectSeason(norm)

    return season === null ? [] : [season]
}

/**
 * Серии. Возвращаем [от, до] — одиночная серия становится [5,5].
 */
function detectEpisodes(norm) {
    let m

    if ((m = norm.match(/\b\d{1,2}x(\d{1,3})(?:\s*-\s*(\d{1,3}))?/))) {
        return [parseInt(m[1], 10), parseInt(m[2] || m[1], 10)]
    }

    if ((m = norm.match(/\bs\d{1,2}e(\d{1,3})(?:\s*-\s*(?:e)?(\d{1,3}))?/))) {
        return [parseInt(m[1], 10), parseInt(m[2] || m[1], 10)]
    }

    // 'E1-12' без сезона — так подписывают аниме и дорамы
    if ((m = norm.match(/(?:^|[^a-zа-яё0-9])e(\d{1,3})\s*-\s*(?:e)?(\d{1,3})\b/))) {
        return [parseInt(m[1], 10), parseInt(m[2], 10)]
    }

    // одиночная серия; диапазон уже разобран шаблоном выше
    if ((m = norm.match(/(?:^|[^a-zа-яё0-9])e(\d{1,3})\b/))) {
        return [parseInt(m[1], 10), parseInt(m[1], 10)]
    }

    if ((m = norm.match(/(\d{1,3})\s*-\s*(\d{1,3})\s*(?:сери|эп|из|of)/))) {
        return [parseInt(m[1], 10), parseInt(m[2], 10)]
    }

    if ((m = norm.match(/(\d{1,3})\s*сери/))) {
        return [parseInt(m[1], 10), parseInt(m[1], 10)]
    }

    // «5 из 13 эп.», «12 of 24», «4 из ?» — сколько серий уже вышло
    if ((m = norm.match(/(\d{1,3})\s*(?:из|of)\s*(?:\d{1,3}|\?)/))) {
        return [1, parseInt(m[1], 10)]
    }

    return null
}

/**
 * Год. Разрешения (2160, 1080) под шаблон не попадают — он ждёт 19xx или 20xx.
 */
function detectYear(norm) {
    let m

    if ((m = norm.match(/\(((?:19|20)\d{2})\s*[-–]\s*(?:19|20)\d{2}\)/))) return parseInt(m[1], 10)
    if ((m = norm.match(/\(((?:19|20)\d{2})\)/))) return parseInt(m[1], 10)
    if ((m = norm.match(/\b((?:19|20)\d{2})\b/))) return parseInt(m[1], 10)

    return null
}

/**
 * Студии озвучки — общий разбор: тем же словарём memory опознаёт названия
 * аудиодорожек, которые человек выбирает в плеере.
 */
function detectVoices(title) {
    return studio.detect(title)
}

/**
 * Языки раздачи. Двухбуквенные коды по названию не ищем — 'ru' и 'en'
 * слишком часто встречаются внутри обычных слов.
 *
 * 'укр' обязано стоять отдельным словом: иначе украинским становится любое
 * «Укрытие» — поймано на живой выдаче.
 */
const LANG_PATTERNS = [
    // 'ukr' может быть склеено с количеством дорожек ('3xUkr'), поэтому слева границу
    // не требуем — важно лишь, чтобы справа не продолжалось слово
    ['uk', /ukr(?![a-zа-яё])|\bukrainian\b|українськ|укр(?![а-яё])/],
    [
        'ru',
        /\brus\b|\brussian\b|русск|дубляж|\bdub\b|многоголос|двухголос|\bmvo\b|\bdvo\b|\bavo\b|(^|[^а-яё])пм([^а-яё]|$)/
    ],
    ['en', /\beng\b|\benglish\b|original/]
]

function detectLangs(norm) {
    let found = []

    LANG_PATTERNS.forEach((pair) => {
        if (pair[1].test(norm)) found.push(pair[0])
    })

    return found
}

export default parse

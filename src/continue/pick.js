import parse from './parse'

/**
 * Выбор раздачи: жёсткие отсечки, затем скоринг.
 *
 * Задача — не «найти лучшее качество», а «не запустить не то».
 * На живой выдаче ловушек больше, чем кажется: по запросу «Moana» приходят
 * три разных фильма, у сериала в топе по сидерам стоят чужие сезоны,
 * а самая качественная 4K-раздача бывает с нулём раздающих.
 */

/** Разрешение в ранг. Неизвестное разрешение — не повод считать раздачу плохой. */
const RESOLUTION_TIER = {
    2160: 4,
    1080: 3,
    720: 2,
    480: 1
}

/** Порядок ослабления фильтров, когда после отсечек не осталось никого */
const RELAX_ORDER = ['voice', 'dv', 'hdr', 'sub', 'quality']

/** Разрешения фильтра Lampa в числа */
const FILTER_QUALITY = {
    '4k': 2160,
    '1080p': 1080,
    '720p': 720
}

/**
 * Результат поиска к единому виду.
 * У JacRed есть готовый info, у настоящего Jackett — только заголовок,
 * поэтому опираемся на разбор названия, а info используем как уточнение.
 */
function normalize(result) {
    let info = result.info || {}
    let parsed = parse(result.Title)

    // info.quality — это разрешение, а не тип источника: CAMRip [1080p] придёт
    // с quality 1080. Поэтому источник берём только из названия.
    if (parsed.resolution === null && info.quality) parsed.resolution = info.quality

    if (!parsed.seasons.length && info.seasons && info.seasons.length) parsed.seasons = info.seasons

    if (!parsed.voices.length && info.voices && info.voices.length) parsed.voices = info.voices

    return {
        raw: result,
        title: result.Title,
        seeders: parseInt(result.Seeders, 10) || 0,
        size: parseInt(result.Size, 10) || 0,
        viewed: !!result.viewed,
        parsed: parsed
    }
}

/**
 * Убираем всё, что мешает сравнению названий: пунктуацию, латиницу вперемешку
 * с кириллицей не трогаем — сравниваем как есть, в нижнем регистре.
 */
function simplify(str) {
    return ((str || '') + '')
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/g, ' ')
        .trim()
}

/**
 * Тот ли это фильм. Первая и главная проверка.
 *
 * Поиск ищет по строке, поэтому по «Moana» приходят и «Moana 2», и «Moana» 2016.
 * Отличить их можно только по году: название сиквела содержит название оригинала.
 *
 * Для сериала год не работает: в карточке стоит дата премьеры сериала, а раздача
 * несёт год своего сезона — у трёхлетнего сериала это расхождение в несколько лет.
 * Там отсекаем по номеру сезона.
 */
function isSameTitle(cand, ctx) {
    let card_year = ctx.is_tv ? null : ctx.year
    let year = cand.parsed.year

    // Год известен с обеих сторон — сравниваем. Допуск в год: дата релиза
    // и дата раздачи расходятся на границе года.
    if (card_year && year && Math.abs(year - card_year) > 1) return false

    let title = simplify(cand.title)
    let names = ctx.names.map(simplify).filter((n) => n.length > 1)

    if (!names.length) return true

    return names.some((name) => title.indexOf(name) >= 0)
}

/**
 * Жёсткие отсечки. relax — множество ослабленных ограничений.
 */
function hardFilter(list, ctx, relax) {
    return list.filter((cand) => {
        let p = cand.parsed

        // мёртвая раздача бесполезна, каким бы ни было качество
        if (!cand.seeders) return false

        if (!isSameTitle(cand, ctx)) return false

        if (ctx.no_cam && p.is_cam) return false

        // нужный сезон обязан быть в раздаче
        if (ctx.season && p.seasons.length && p.seasons.indexOf(ctx.season) === -1) return false

        // Как и нужная серия. Раздача «серии 1-2», когда нужна четвёртая,
        // бесполезна — предлагать её незачем.
        if (ctx.episode && p.episodes && !hasEpisode(cand, ctx)) return false

        if (relax.indexOf('quality') === -1 && ctx.max_resolution && p.resolution) {
            if (p.resolution > ctx.max_resolution) return false
        }

        if (relax.indexOf('hdr') === -1 && ctx.no_hdr && p.hdr) return false

        if (relax.indexOf('dv') === -1 && ctx.no_dv && p.dv) return false

        if (relax.indexOf('voice') === -1 && ctx.voice) {
            if (p.voices.indexOf(ctx.voice) === -1) return false
        }

        // Язык проверяем только когда он в названии указан: у большинства раздач
        // языковых пометок нет вовсе, и отсекать их было бы неверно.
        if (ctx.langs.length && p.langs.length) {
            if (!p.langs.some((l) => ctx.langs.indexOf(l) >= 0)) return false
        }

        return true
    })
}

/**
 * Оценка кандидата. Веса подобраны так, чтобы количество раздающих
 * не могло перебить качество источника: 500 сидеров не делают экранку лучше рипа.
 */
function score(cand, ctx) {
    let p = cand.parsed
    let s = 0

    s += (RESOLUTION_TIER[p.resolution] || 0) * 100

    s += p.source_rank

    // Продолжение из той же раздачи. Самый сильный сигнал: следующая серия
    // почти всегда лежит там же, где предыдущая, и переключать релиз посреди
    // сезона незачем.
    if (hasEpisode(cand, ctx)) s += 400

    // Именно та раздача, которую смотрели по этому тайтлу. Сильнее всего
    // остального вместе взятого: тут гадать не о чем, это она и есть.
    if (isSameRelease(cand, ctx)) s += 1000

    if (cand.viewed) s += 300

    // Раздача, похожая на прошлую. Привычное качество важнее максимального:
    // если сериал смотрели в 1080p, незачем посреди сезона переходить на 4K.
    // Поэтому бонус заведомо больше разницы между соседними ступенями качества.
    if (ctx.last) {
        if (ctx.last.voice && p.voices.indexOf(ctx.last.voice) >= 0) s += 250
        if (ctx.last.resolution && p.resolution === ctx.last.resolution) s += 250
    }

    if (ctx.voice && p.voices.indexOf(ctx.voice) >= 0) s += 200

    // студия, которую обычно смотрит пользователь
    if (ctx.voice_rating) {
        p.voices.forEach((v) => {
            if (ctx.voice_rating[v]) s += 80
        })
    }

    s += Math.min(cand.seeders, 100) * 0.5

    return s
}

/** Раздача содержит нужную серию */
function hasEpisode(cand, ctx) {
    if (!ctx.episode || !cand.parsed.episodes) return false

    return ctx.episode >= cand.parsed.episodes[0] && ctx.episode <= cand.parsed.episodes[1]
}

/**
 * Знакомая раздача, в которой лежит нужная серия. Если такая есть — спрашивать
 * не о чем: продолжаем ровно там, где остановились.
 */
function sameRelease(list, ctx) {
    let exact = list.find((cand) => isSameRelease(cand, ctx) && hasEpisode(cand, ctx))

    // Штатная пометка «эту раздачу открывали» — общая на все тайтлы и без
    // порядка ([parser.js:286](src/core/api/sources/parser.js:286)), поэтому
    // годится лишь как запасной признак: свой хеш точнее.
    return exact || list.find((cand) => cand.viewed && hasEpisode(cand, ctx)) || null
}

/**
 * Та самая раздача, которую запускали по этому тайтлу в прошлый раз.
 *
 * Опознаём по хешу из выдачи парсера — на нём же держится вся штатная механика
 * пометок. Не все трекеры его отдают; тогда сравнивать нечего, и работает
 * обычный подбор.
 */
function isSameRelease(cand, ctx) {
    if (!ctx.last || !ctx.last.hash) return false

    return !!cand.raw.hash && cand.raw.hash === ctx.last.hash
}

/**
 * Основная точка входа.
 *
 * @param {Array} results - результаты Lampa.Parser.get
 * @param {Object} ctx - {names, year, season, episode, voice, lang, max_resolution,
 *                        no_hdr, no_dv, no_cam, voice_rating}
 * @returns {{list: Array, relaxed: string[], confident: boolean, reason: string}}
 */
function pick(results, ctx) {
    let all = (results || []).map(normalize)
    let relax = []
    let list = hardFilter(all, ctx, relax)

    // Ослабляем по одному, пока кто-нибудь не найдётся.
    // Иначе кнопка «умирает» на сериале, который выбранная студия не озвучивает.
    for (let i = 0; i < RELAX_ORDER.length && !list.length; i++) {
        relax = RELAX_ORDER.slice(0, i + 1)

        list = hardFilter(all, ctx, relax)
    }

    if (!list.length) {
        return {
            list: [],
            relaxed: relax,
            confident: false,
            continues: false,
            voices: [],
            reason: emptyReason(all, ctx)
        }
    }

    list.forEach((cand) => {
        cand.score = score(cand, ctx)
    })

    list.sort((a, b) => b.score - a.score)

    let same = sameRelease(list, ctx)

    return {
        list: list,
        relaxed: relax,
        // продолжение из знакомой раздачи не требует подтверждения
        confident: !!same || isConfident(relax),
        continues: !!same,
        voices: voiceOptions(list, 5),
        reason: ''
    }
}

/**
 * Почему не осталось ни одного кандидата. Пользователю нужно понимать разницу
 * между «ничего нет», «есть только экранки» и «серия ещё не появилась в раздачах».
 */
function emptyReason(all, ctx) {
    let same = all.filter((cand) => cand.seeders && isSameTitle(cand, ctx))

    if (!same.length) return 'not_found'

    if (same.every((cand) => cand.parsed.is_cam)) return 'only_cam'

    // раздачи нужного сезона есть, но ни в одной нет нужной серии
    if (ctx.episode) {
        let season = same.filter((cand) => {
            let p = cand.parsed

            return !ctx.season || !p.seasons.length || p.seasons.indexOf(ctx.season) >= 0
        })

        if (season.length && !season.some((cand) => hasEpisode(cand, ctx))) return 'no_episode_yet'
    }

    return 'not_found'
}

/**
 * Уверенность в выборе.
 *
 * Близкие очки у лидеров — НЕ повод спрашивать: если оба варианта хороши,
 * пользователю всё равно, каким именно смотреть, а лишний вопрос ломает
 * весь смысл кнопки. Спрашиваем только когда пришлось нарушить то, что
 * пользователь задал сам: перевод или качество.
 */
function isConfident(relax) {
    return relax.indexOf('voice') === -1 && relax.indexOf('quality') === -1
}

/**
 * Разные студии в верхушке списка. Нужно, чтобы понять, есть ли вообще
 * из чего выбирать, когда предпочтение по озвучке ещё не задано.
 */
function voiceOptions(list, limit) {
    let out = []

    list.slice(0, limit || 5).forEach((cand) => {
        cand.parsed.voices.forEach((v) => {
            if (out.indexOf(v) === -1) out.push(v)
        })
    })

    return out
}

/**
 * Контекст из карточки и фильтров Lampa.
 *
 * Фильтры берём те же, что у штатного экрана торрентов: они уже хранятся
 * отдельно для каждой карточки и синхронизируются через аккаунт.
 */
function context(card, filter, params) {
    filter = filter || {}
    params = params || {}

    // Псевдонимы обязаны участвовать в проверке «тот ли это тайтл»: раздачу
    // нашли по альтернативному названию, и названия карточки в её заголовке
    // может не быть вовсе. Корейский сериал «Суперчудаки» (원더풀스) лежит
    // на трекерах как «Суперглупцы» — без псевдонимов отсеивалось всё.
    let names = [card.original_title, card.original_name, card.title, card.name]
        .concat(toArray(params.aliases))
        .filter(Boolean)

    let year = ((card.release_date || card.first_air_date || '') + '').slice(0, 4)

    let quality = toArray(filter.quality)
        .map((q) => FILTER_QUALITY[q])
        .filter(Boolean)

    return {
        names: names,
        year: parseInt(year, 10) || null,
        is_tv: !!(card.number_of_seasons || card.original_name || card.first_air_date),
        season: params.season || null,
        episode: params.episode || null,
        voice: toArray(filter.voice)[0] || null,
        langs: langCodes(filter.lang),
        max_resolution: quality.length ? Math.max.apply(null, quality) : null,
        no_hdr: filter.hdr === 'no',
        no_dv: filter.dv === 'no',
        no_cam: params.no_cam !== false,
        voice_rating: params.voice_rating || null,
        last: params.last || null
    }
}

function toArray(value) {
    if (!value) return []

    return Array.isArray(value) ? value : [value]
}

/** Языки, которые вообще умеет различать разбор названия */
const KNOWN_LANGS = ['ru', 'uk', 'en']

/**
 * Фильтр Lampa хранит язык переведённым названием — «Русский», «Английский».
 * Приводим к кодам; заодно принимаем и сами коды, чтобы функцию можно было
 * вызывать вне приложения.
 */
function langCodes(values) {
    let out = []

    toArray(values).forEach((value) => {
        let low = ((value || '') + '').toLowerCase()

        if (KNOWN_LANGS.indexOf(low) >= 0) {
            if (out.indexOf(low) === -1) out.push(low)

            return
        }

        if (typeof Lampa === 'undefined' || !Lampa.Lang) return

        KNOWN_LANGS.forEach((code) => {
            let name = (Lampa.Lang.translate('filter_lang_' + code) + '').toLowerCase()

            if (name && name === low && out.indexOf(code) === -1) out.push(code)
        })
    })

    return out
}

export default {pick, context, normalize, score}

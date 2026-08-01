/**
 * Сопоставление аудиодорожек между раздачами.
 *
 * Индекс дорожки для этого не годится: в одной раздаче русская дорожка первая,
 * в другой третья. Поэтому запоминаем язык и название озвучки, а при следующем
 * запуске ищем максимально близкую.
 */

/**
 * Приметы дорожки, по которым её можно узнать в другой раздаче.
 *
 * @param {Object} track - дорожка плеера
 * @returns {{lang: string, label: string}|null}
 */
function describe(track) {
    if (!track) return null

    let lang = language(track.language || track.lang || '')
    let label = clean(track.label || track.name || '')

    if (!lang && !label) return null

    return {lang: lang, label: label}
}

/**
 * Приметы всего списка: языки в том же порядке.
 *
 * Нужны, чтобы понять, та ли это раздача. Названия дорожек приходят не от
 * плеера, а от стороннего плагина `tracks`, который дописывает `label`
 * в объекты дорожек. Он может отвалиться — у нас так и вышло, когда умер
 * домен `cub.red`, — и тогда от дорожки остаётся один язык, а двух русских
 * озвучек это не различает.
 *
 * Зато если список тот же, то и файл тот же, и номер дорожки в нём осмыслен.
 * Проверка дешёвая и честная: разошёлся порядок или число дорожек — значит
 * раздача другая, и номеру верить нельзя.
 *
 * @param {Array} tracks
 * @returns {string} например `ru,ru,en`
 */
function shape(tracks) {
    return (tracks || [])
        .filter(Boolean)
        .map((track) => language(track.language || track.lang || ''))
        .join(',')
}

/**
 * Код языка приходит в разном виде: в браузере двухбуквенный (`ru`),
 * на webOS трёхбуквенный (`rus`). Без приведения запись, сделанная на одном
 * устройстве, не совпала бы с дорожками на другом.
 */
const LANGS = {
    rus: 'ru',
    ukr: 'uk',
    eng: 'en',
    kor: 'ko',
    jpn: 'ja',
    chi: 'zh',
    zho: 'zh',
    ger: 'de',
    deu: 'de',
    fre: 'fr',
    fra: 'fr',
    spa: 'es',
    ita: 'it',
    pol: 'pl',
    tur: 'tr'
}

function language(value) {
    let lang = clean(value)

    return LANGS[lang] || lang
}

/**
 * Найти дорожку, наиболее похожую на запомненную.
 *
 * Совпадение по названию озвучки важнее языка: «Дубляж» и «LostFilm» — обе
 * русские, но человек выбирал конкретную.
 *
 * @param {Array} tracks - дорожки текущего файла
 * @param {Object} saved - результат describe() с прошлого раза
 * @returns {Object|null}
 */
function match(tracks, saved) {
    let list = (tracks || []).filter(Boolean)

    if (!list.length || !saved) return null

    let described = list.map((track) => ({track: track, about: describe(track)}))

    let best = null
    let best_score = 0

    described.forEach((item) => {
        let score = compare(item.about, saved)

        if (score > best_score) {
            best_score = score
            best = item.track
        }
    })

    // По названию ничего не нашлось — 3 балла и выше даёт только совпадение
    // имени, всё что ниже держится на одном языке. Если список дорожек тот же,
    // что и в прошлый раз, значит это та же раздача, и номер точнее языка:
    // русских озвучек бывает две, и без номера берётся первая попавшаяся.
    if (best_score < 3 && byIndex(list, saved)) return byIndex(list, saved)

    return best
}

/** Дорожка по запомненному номеру — только если список не изменился */
function byIndex(list, saved) {
    if (typeof saved.index !== 'number' || !saved.shape) return null

    if (saved.shape !== shape(list)) return null

    return list[saved.index] || null
}

/**
 * Насколько дорожка похожа на запомненную. Ноль означает «не подходит»:
 * лучше оставить выбор плеера, чем включить заведомо чужую озвучку.
 */
function compare(about, saved) {
    if (!about) return 0

    let same_lang = !!about.lang && about.lang === saved.lang
    let same_label = !!about.label && about.label === saved.label

    if (same_label && same_lang) return 4
    if (same_label) return 3

    // название могло записаться иначе, но одна строка входит в другую
    if (
        about.label &&
        saved.label &&
        (about.label.includes(saved.label) || saved.label.includes(about.label))
    ) {
        return same_lang ? 3 : 2
    }

    // язык тот же, а озвучку в прошлый раз не удалось опознать
    if (same_lang && !saved.label) return 2
    if (same_lang) return 1

    return 0
}

/** Выбранная сейчас дорожка */
function selected(tracks) {
    let list = (tracks || []).filter(Boolean)

    return list.find((track) => track.selected) || list.find((track) => track.enabled) || null
}

/**
 * Переключение — та же последовательность, что делает штатная панель плеера:
 * снять признаки со всех, поставить выбранной и позвать её onSelect.
 */
function apply(tracks, track) {
    if (!track) return false

    let list = (tracks || []).filter(Boolean)

    list.forEach((item) => {
        item.enabled = false
        item.selected = false
    })

    track.enabled = true
    track.selected = true

    if (typeof track.onSelect === 'function') track.onSelect(track)

    return true
}

/* -------------------------------------------------------------- субтитры */

/**
 * Дорожки субтитров живут по своим правилам: включённость обозначается полем
 * `mode`, а в списке может лежать псевдострока «Отключено» с индексом -1,
 * которую панель добавляет при первом открытии.
 */
function realSubs(subs) {
    return (subs || []).filter((item) => item && item.index !== -1)
}

/**
 * Что выбрано сейчас. `null` — субтитры выключены, и это полноценный ответ:
 * человек мог отключить их намеренно.
 */
function selectedSub(subs) {
    return realSubs(subs).find((item) => item.selected || item.mode === 'showing') || null
}

/**
 * Переключение повторяет последовательность штатной панели плеера
 * ([panel.js:427](src/interaction/player/panel.js:427)): снять режим со всех,
 * поставить выбранной и позвать её onSelect.
 *
 * Видимость переключает вызывающий: за неё отвечает Video.subsview.
 *
 * Выключение — отдельный случай. На webOS `mode` это не поле, а сеттер, и
 * реагирует он только на `showing` ([webos.js:76](src/interaction/player/webos.js:76)),
 * поэтому «выключить всё» там не выключает ничего. Выключением служит
 * псевдострока «Отключено» с индексом -1: её и выбираем.
 */
function applySub(subs, track) {
    let list = subs || []
    let target = track || list.find((item) => item && item.index === -1) || null

    list.forEach((item) => {
        item.selected = false

        if (item !== target) item.mode = 'disabled'
    })

    if (!target) return false

    target.mode = 'showing'
    target.selected = true

    if (typeof target.onSelect === 'function') target.onSelect(target)

    return !!track
}

function matchSub(subs, saved) {
    return match(realSubs(subs), saved)
}

function clean(value) {
    return ((value || '') + '').toLowerCase().trim()
}

export default {
    describe,
    shape,
    match,
    compare,
    selected,
    apply,
    selectedSub,
    applySub,
    matchSub,
    realSubs
}

import keys from '../shared/keys'
import fresh from './fresh'
import resume from './resume'

/**
 * Новые серии на виду: ряд «Продолжить просмотр» учитывает их выход, а на
 * постере сериала, где бы он ни встретился, стоит пометка.
 *
 * Штатный ряд собирается из порядка истории и поднимает новые серии только по
 * уведомлениям CUB — без аккаунта CUB он молчит. Переупорядочить его снаружи
 * нельзя: ядро собирает его и тут же отдаёт на отрисовку, а событие `line`
 * приходит, когда карточки уже нарисованы. Поэтому continue ставит свой ряд
 * с тем же составом и названием, а штатный один раз выключает.
 *
 * Что считать новым, решает та же логика, что у кнопки «Смотреть»: тот же
 * список серий и то же решение, и та же проверка раздачи. Ряд не может
 * поднять серию, которую кнопка потом не найдёт.
 *
 * Считается всё в фоне и лежит готовым в `cc_continue_fresh`: главная ждёт
 * все ряды первой пачки разом, и медленный ряд задержал бы весь экран.
 */

/** Сколько сериалов из истории проверяем — дальше обычно давно брошенное */
const LIMIT = 30

/** Сколько карточек в ряду — как у штатного */
const ROW_SIZE = 19

/** Штатный ряд, который заменяем: его переключатель в настройках рядов */
const NATIVE_ROW = 'content_rows_continue_watch'

/** Как часто пересчитывать в фоне */
const REFRESH_EVERY = 1000 * 60 * 30

/** Сколько живёт ответ TMDB в памяти: после просмотра серии пересчёт идёт без сети */
const SHOW_TTL = 1000 * 60 * 60 * 3

/**
 * Не раньше этого после запуска: главная собирается первой, и пересчёт с его
 * запросами к TMDB не должен спорить с ней за сеть
 */
const STARTUP_WAIT = 1000 * 30

/**
 * Сколько ждём один сериал. Запросы `Lampa.Api` сбрасываются вместе с её
 * сетью (смена профиля), и тогда ответа не будет вовсе, — пересчёт не должен
 * встать на этом навсегда.
 */
const STEP_WAIT = 1000 * 60

/**
 * Цвета пометки — штатные, от класса `card__new-episode` ядра. Здесь только
 * место на постере и два своих состояния: финал и «раздачи ещё нет».
 */
const STYLE = `<style id="continue-fresh-style">
    .card__view .card__new-episode.cc-fresh{
        bottom: 3em;
        padding: 0 0.5em;
    }
    .card__view .cc-fresh > div{
        padding: 0.3em 0.7em;
        font-size: 0.8em;
        font-weight: 600;
        line-height: 1.2;
    }
    .card__view .cc-fresh--finale > div{
        background: linear-gradient(90deg, #ffd000, #ff7a00);
        color: #000;
    }
    .card__view .cc-fresh--nope{
        opacity: 0.55;
    }
</style>`

/** {t, items: {id: {s, e, n, f, air, ok}}} */
let state = {t: 0, items: {}}

/** Решение и проверка раздачи — у continue, рядом с кнопкой */
let deps = null

/** Есть ли хоть одна новая серия — иначе пометки искать незачем */
let has_items = false

/** Идёт ли пересчёт */
let busy = false

let shows = {}
let network = null
let timer = null
let player_timer = null

/**
 * @param {Object} options
 * @param {Function} options.describe - (card, done(decision, list)) — что включит кнопка
 * @param {Function} options.probe - (card, decision, done(ok|null)) — есть ли раздача
 */
function init(options) {
    deps = options
    network = new Lampa.Reguest()
    state = read()
    has_items = Object.keys(state.items).length > 0

    if (!document.getElementById('continue-fresh-style')) $('body').append(STYLE)

    takeOver()
    addRow()
    watchCards()

    // Сохранённый расчёт ещё свежий — пересчитываем, только когда устареет
    schedule(Math.max(STARTUP_WAIT, state.t + REFRESH_EVERY - Date.now()))

    // Время запуска пишем там же, где ядро поднимает карточку в истории, —
    // так видны и запуски мимо continue
    Lampa.Favorite.listener.follow('add,added', (e) => {
        if (e.where === 'history') played(e.card)
    })

    // Досмотрел серию — она больше не новая, а следующая, может быть, уже да.
    // Изменился только этот сериал, остальные ждут своего пересчёта.
    Lampa.Player.listener.follow('destroy', () => {
        clearTimeout(player_timer)

        player_timer = setTimeout(recheck, 3000)
    })
}

/** Следующий пересчёт — один таймер на всё, чтобы проходы не шли подряд */
function schedule(delay) {
    clearTimeout(timer)

    timer = setTimeout(tick, delay)
}

/** Во время просмотра сеть и процессор нужны плееру — откладываем */
function tick() {
    if (Lampa.Player.opened()) schedule(REFRESH_EVERY)
    else refresh()
}

function read() {
    let saved = Lampa.Storage.get(keys.KEYS.fresh, '{}')

    if (!saved || typeof saved !== 'object' || !saved.items) return {t: 0, items: {}}

    return saved
}

/**
 * Штатный ряд выключается один раз, при первом запуске. Дальше это обычный
 * переключатель в настройках рядов: включил его человек обратно — его выбор.
 */
function takeOver() {
    if (Lampa.Storage.get(keys.KEYS.row, false)) return

    Lampa.Storage.set(NATIVE_ROW, 'false')
    Lampa.Storage.set(keys.KEYS.row, true)

    console.log('Continue', 'native row replaced:', NATIVE_ROW)
}

/**
 * Ряд «Продолжить просмотр» на тех же экранах и том же месте, что штатный.
 * Карточки читаются из истории сразу: сеть здесь не нужна, новые серии уже
 * посчитаны в фоне.
 */
function addRow() {
    Lampa.ContentRows.add({
        name: 'continue_order',
        title: Lampa.Lang.translate('title_continue'),
        index: 1,
        screen: ['main', 'category'],
        call: (params, screen) => {
            let media = screen === 'main' ? 'tv' : params.url
            let results = rowCards(media)

            if (!results.length) return

            let series = media === 'tv' || media === 'anime'

            return (call) => {
                call({
                    results: results,
                    title: Lampa.Lang.translate(series ? 'title_continue' : 'title_watched')
                })
            }
        }
    })
}

/**
 * Состав — как у штатного (`favorite.js → continues`): история без
 * просмотренного и брошенного, по разделам. Сама `continues` не годится:
 * она обрезает список до переупорядочивания, и сериал из глубины истории
 * не поднялся бы. Поменяется состав в ядре — поменять и здесь.
 * Порядок — `fresh.arrange`.
 */
function rowCards(media) {
    let viewed = ids(Lampa.Favorite.get({type: 'viewed'}))
    let thrown = ids(Lampa.Favorite.get({type: 'thrown'}))
    let cards = Lampa.Favorite.get({type: 'history'}).filter(
        (card) => card && !viewed[card.id] && !thrown[card.id] && inSection(card, media)
    )

    let bump = {}

    cards.forEach((card) => {
        let item = itemFor(card)

        if (item?.ok === true) bump[card.id] = item
    })

    return fresh
        .arrange(cards, Lampa.Storage.get(keys.KEYS.played, {}) || {}, bump)
        .slice(0, ROW_SIZE)
        .map((card) => Lampa.Arrays.clone(card))
}

/** Раздел, как его делит штатный ряд: сериалы, аниме и остальное */
function inSection(card, media) {
    let series = card.number_of_seasons || card.first_air_date
    let anime =
        card.original_language === 'ja' || Lampa.Utils.containsJapanese(card.original_name || card.name || '')

    if (media === 'anime') return series && anime
    if (media === 'tv') return series && !anime

    return !series
}

/**
 * Карточку подняли в истории — это запуск. Время пишем сами: ядро хранит
 * только порядок. Карточки, выпавшие из истории, выбрасываются заодно.
 */
function played(card) {
    if (!card?.id) return

    let history = ids(Lampa.Favorite.get({type: 'history'}))
    let saved = Lampa.Storage.get(keys.KEYS.played, {}) || {}
    let out = {}

    Object.keys(saved).forEach((id) => {
        if (history[id]) out[id] = saved[id]
    })

    out[card.id] = Date.now()

    Lampa.Storage.set(keys.KEYS.played, out)
}

/** Какие id есть в списке карточек */
function ids(cards) {
    let out = {}

    cards.forEach((card) => {
        if (card) out[card.id] = true
    })

    return out
}

/** Новая серия сериала, если она есть и ещё не досмотрена */
function itemFor(card) {
    let item = card?.original_name ? state.items[card.id] : null

    return item && !watched(card, item) ? item : null
}

/**
 * Серию уже досмотрели, а фоновый пересчёт ещё не прошёл. Проверяем при
 * каждом показе: прогресс локальный и читается мгновенно. Порог тот же,
 * что у кнопки.
 */
function watched(card, item) {
    let view = Lampa.Timeline.watchedEpisode(card, item.s, item.e, true) || {}

    return view.percent >= resume.WATCHED
}

/**
 * Пересчитать, у каких сериалов есть новое. По одному сериалу за раз:
 * это фоновая работа, спешить ей некуда, а TMDB и трекеры не любят залпов.
 */
function refresh() {
    if (busy) return

    busy = true

    let list = candidates()
    let items = {}
    let i = 0

    next()

    function next() {
        if (i >= list.length) return finish()

        let card = list[i++]
        let over = false
        let timer = setTimeout(() => step(null), STEP_WAIT)

        try {
            inspect(card, step)
        } catch (err) {
            console.error('Continue', 'fresh error:', card.id, err)

            step(null)
        }

        function step(item) {
            if (over) return

            over = true

            clearTimeout(timer)

            if (item) items[card.id] = item

            next()
        }
    }

    function finish() {
        state = {t: Date.now(), items: items}
        has_items = Object.keys(items).length > 0

        Lampa.Storage.set(keys.KEYS.fresh, state)

        console.log('Continue', 'fresh episodes:', Object.keys(items).length, 'of', list.length)

        decorateAll()

        busy = false

        schedule(REFRESH_EVERY)
    }
}

/** После просмотра — только что смотренный сериал, если он в числе проверяемых */
function recheck() {
    let card = candidates()[0]
    let last = Lampa.Favorite.get({type: 'history'})[0]

    if (busy || !card || card.id !== last?.id) return

    try {
        inspect(card, (item) => {
            if (item) state.items[card.id] = item
            else delete state.items[card.id]

            has_items = Object.keys(state.items).length > 0

            Lampa.Storage.set(keys.KEYS.fresh, state)

            decorateAll()
        })
    } catch (err) {
        console.error('Continue', 'fresh error:', card.id, err)
    }
}

/**
 * Один сериал: освежаем карточку из TMDB, спрашиваем кнопку, что она включит,
 * и есть ли на это раздача.
 *
 * Карточка в истории — снимок на момент добавления: число сезонов и
 * следующая серия в ней устарели, и нового сезона по ней не увидеть.
 */
function inspect(card, done) {
    show(card.id, (info) => {
        if (!info) return done(null)

        let live = Lampa.Arrays.clone(card)

        live.number_of_seasons = info.number_of_seasons
        live.next_episode_to_air = info.next_episode_to_air
        // В истории карточка без жанров, а поиск раздачи по ним уточняет
        // запрос и без них падает (parser.js → `jackett`)
        live.genres = live.genres || info.genres

        deps.describe(live, (decision, list) => {
            let item = list ? fresh.check(decision, list, info) : null

            if (!item) return done(null)

            deps.probe(live, decision, (ok) => {
                item.ok = ok

                done(item)
            })
        })
    })
}

/**
 * Сериалы из истории просмотров. Брошенные («Брошено» в закладках) не
 * предлагаем: человек ясно сказал, что смотреть не будет.
 */
function candidates() {
    let thrown = ids(Lampa.Favorite.get({type: 'thrown'}))

    return Lampa.Favorite.get({type: 'history'})
        .filter((c) => c && typeof c.id === 'number' && c.original_name && !thrown[c.id])
        .filter((c) => !c.source || c.source === 'tmdb' || c.source === 'cub')
        .slice(0, LIMIT)
}

/**
 * Карточка сериала из TMDB — только то, что устаревает в истории. Своим
 * запросом, а не через `Lampa.Api`: её сеть общая и сбрасывается при уходе
 * с экрана, а наш пересчёт идёт в фоне.
 */
function show(id, done) {
    let hit = shows[id]

    if (hit && Date.now() - hit.t < SHOW_TTL) return done(hit.info)

    network.timeout(1000 * 10)
    network.silent(
        Lampa.TMDB.api('tv/' + id + '?api_key=' + Lampa.TMDB.key()),
        (json) => {
            let info = {
                number_of_seasons: json.number_of_seasons,
                genres: json.genres || [],
                next_episode_to_air: json.next_episode_to_air || null,
                status: json.status,
                seasons: (json.seasons || []).map((s) => ({
                    season_number: s.season_number,
                    episode_count: s.episode_count
                }))
            }

            shows[id] = {info: info, t: Date.now()}

            done(info)
        },
        () => done(hit ? hit.info : null)
    )
}

/**
 * Пометка на постерах. Карточки рисует ядро, и зацепки для плагина там нет,
 * поэтому смотрим за DOM снаружи: ядро кладёт данные карточки прямо на её
 * элемент (`card_data`), остаётся их прочитать. Объекты ядра не трогаем.
 */
function watchCards() {
    if (typeof MutationObserver === 'undefined') return

    let observer = new MutationObserver((mutations) => {
        // Пометить нечего — не перебираем узлы, которых в плеере много
        if (!has_items) return

        mutations.forEach((mutation) => {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
                let node = mutation.addedNodes[i]

                if (node.nodeType !== 1) continue

                if (node.classList.contains('card')) mark(node)
                else eachCard(node, mark)
            }
        })
    })

    observer.observe(document.body, {childList: true, subtree: true})

    decorateAll()
}

function eachCard(root, fn) {
    let list = root.getElementsByClassName('card')

    for (let i = 0; i < list.length; i++) fn(list[i])
}

/** Новая карточка: пометки на ней ещё нет, снимать нечего */
function mark(node) {
    let data = node.card_data

    if (data?.original_name && state.items[data.id]) decorate(node)
}

/** После пересчёта — все карточки на экране, в том числе снять устаревшие пометки */
function decorateAll() {
    eachCard(document.body, decorate)
}

function decorate(node) {
    let data = node.card_data
    let view = node.getElementsByClassName('card__view')[0]

    if (!view) return

    let badge = view.getElementsByClassName('cc-fresh')[0]
    let item = itemFor(data)

    if (!item) {
        if (badge) badge.parentNode.removeChild(badge)

        return
    }

    let text = fresh.label(item, Lampa.Lang.translate)

    if (item.ok === false) text += ' · ' + Lampa.Lang.translate('continue_not_yet_released')

    if (!badge) {
        badge = document.createElement('div')
        badge.appendChild(document.createElement('div'))

        view.appendChild(badge)
    }

    badge.className =
        'card__new-episode cc-fresh' +
        (item.f ? ' cc-fresh--finale' : '') +
        (item.ok === false ? ' cc-fresh--nope' : '')
    badge.firstChild.textContent = text
}

export default {init, refresh}

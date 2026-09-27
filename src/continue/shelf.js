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
 * Устройство сохранённого расчёта. Это кеш, а не данные человека: расчёт
 * старого устройства просто выбрасывается и считается заново. Поменял поля
 * записи в `fresh.check` — подними число, иначе до пересчёта постеры
 * останутся пустыми.
 */
const FORMAT = 2

/** Больше серий — полоска сплошная: столько делений с дивана не различить */
const SEGMENTS_MAX = 16

/**
 * Пометка стоит в нижнем углу, в одну строку с рейтингом (`card__vote`) и той
 * же высоты: верх постера занят меткой «TV» и иконками, а вынос за край
 * залезает на соседнюю карточку. Зелёный — штатный, от `card__new-episode`.
 *
 * Полоска сезона — по верхнему краю, над меткой и иконками, делениями как
 * у историй в мессенджерах. Под постером ей не место: там рамка фокуса.
 * Отступы от углов — чтобы не резалась скруглением постера.
 *
 * Flex без `gap`: его нет в Chrome 79.
 */
const STYLE = `<style id="continue-fresh-style">
    .card__view .card__new-episode.cc-fresh{
        left: 0.3em;
        right: auto;
        bottom: 0.3em;
        max-width: calc(100% - 5.6em);
        text-align: left;
        z-index: 1;
    }
    .card__view .cc-fresh > div{
        display: flex;
        align-items: center;
        padding: 0.45em 0.7em;
        border-radius: 1em;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        box-shadow: 0 0.15em 0.5em rgba(0, 0, 0, 0.35);
    }
    .card__view .cc-fresh span{
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .card__view .cc-fresh svg{
        width: 1.05em;
        height: 1.05em;
        margin-right: 0.35em;
        flex-shrink: 0;
    }
    .card__view .cc-fresh--finale > div{
        background: linear-gradient(90deg, #ffd000, #ff9a00);
        color: #2b1a00;
    }
    .card__view .cc-fresh--wait > div{
        background: rgba(0, 0, 0, 0.62);
        color: #fff;
    }
    .card__view .cc-season{
        position: absolute;
        top: 0.2em;
        left: 0.9em;
        right: 0.9em;
        height: 0.55em;
        padding: 0.1em;
        display: flex;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 0.25em;
        z-index: 1;
    }
    .card__view .cc-season > i{
        flex: 1 1 0;
        margin-left: 0.08em;
        border-radius: 0.1em;
        background: rgba(255, 255, 255, 0.18);
    }
    .card__view .cc-season > i:first-child{
        margin-left: 0;
    }
    .card__view .cc-season--solid > i{
        margin-left: 0;
        border-radius: 0;
    }
    .card__view .cc-season > .cc-season__seen{
        background: rgba(255, 255, 255, 0.5);
    }
    .card__view .cc-season > .cc-season__open{
        background: #fff;
    }
    .card__view .cc-season > .cc-season__new{
        background: #57f570;
    }
    .card__view .cc-season > .cc-season__finale{
        background: #ffc400;
    }
    .card__view .cc-season > .cc-season__wait{
        background: transparent;
        box-shadow: inset 0 0 0 0.06em rgba(255, 255, 255, 0.85);
    }
</style>`

/** Значки пометки: финал — флажок, «раздачи ещё нет» — часы */
const ICONS = {
    finale: '<svg viewBox="0 0 16 16"><path d="M3.5 1.5v13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M4.5 2.2h8.6l-2.1 3.3 2.1 3.3H4.5z" fill="currentColor"/></svg>',
    wait: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8 4.6V8l2.4 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
}

/** {v, t, items: {id: {s, e, seen, aired, total, fresh, f, air, ok}}} — `fresh.check` */
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

    if (!saved || typeof saved !== 'object' || !saved.items || saved.v !== FORMAT) return {t: 0, items: {}}

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

        if (item?.fresh && item.ok === true) bump[card.id] = item
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

/** Что показать на постере сериала, если серию с пометки ещё не досмотрели */
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

            // Полный проход идёт минутами: показываем каждый сериал, как только
            // он готов, а не всех разом в конце
            apply(card.id, item)

            next()
        }
    }

    function finish() {
        state = {v: FORMAT, t: Date.now(), items: items}
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
            apply(card.id, item)

            Lampa.Storage.set(keys.KEYS.fresh, state)
        })
    } catch (err) {
        console.error('Continue', 'fresh error:', card.id, err)
    }
}

/** Итог по одному сериалу — сразу на постеры */
function apply(id, item) {
    if (item) state.items[id] = item
    else delete state.items[id]

    has_items = Object.keys(state.items).length > 0

    decorateAll()
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

            // Раздачу ищем только для нового: у старого сезона она давно есть,
            // а трекеры не любят лишних запросов
            if (!item.fresh) return done(item)

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
    let view = node.getElementsByClassName('card__view')[0]

    if (!view) return

    let item = itemFor(node.card_data)
    let html = item ? badge(item) + season(item) : ''

    // Карточки перерисовываются часто, а пересчёт меняет немногое
    if (view.cc_fresh === html) return

    view.cc_fresh = html

    let old = view.querySelectorAll('.cc-fresh, .cc-season')

    for (let i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i])

    if (html) view.insertAdjacentHTML('beforeend', html)
}

/** Пометка — только когда что-то случилось: вышла новая серия */
function badge(item) {
    if (!item.fresh) return ''

    let kind = item.ok === false ? 'wait' : item.f ? 'finale' : 'new'

    return (
        '<div class="card__new-episode cc-fresh cc-fresh--' +
        kind +
        '"><div>' +
        (ICONS[kind] || '') +
        '<span>' +
        fresh.label(item, Lampa.Lang.translate) +
        '</span></div></div>'
    )
}

/** Полоска сезона: деление на серию, у длинного сезона — сплошные зоны */
function season(item) {
    let solid = item.total > SEGMENTS_MAX
    let cells = ''

    fresh.zones(item).forEach((zone) => {
        let cell =
            '<i class="cc-season__' +
            zone.kind +
            '"' +
            (solid ? ' style="flex-grow:' + zone.count + '"' : '') +
            '></i>'

        for (let i = 0; i < (solid ? 1 : zone.count); i++) cells += cell
    })

    return '<div class="cc-season' + (solid ? ' cc-season--solid' : '') + '">' + cells + '</div>'
}

export default {init, refresh}

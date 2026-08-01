import keys from '../shared/keys'
import match from '../shared/match'
import watch from '../shared/watch'
import store from './store'
import titles from './titles'

/**
 * «Память просмотра» — тайтл включается так же, как в прошлый раз.
 *
 * Помнит по каждой карточке название, которым реально нашлись раздачи,
 * и аудиодорожку, которую в итоге слушали. Работает при любом запуске плеера
 * и на обычном экране торрентов, а не только через кнопку «Смотреть»:
 * поэтому это отдельный плагин, а не часть continue.
 *
 * Данными плагины делятся через общее хранилище, кодом — нет.
 */

/** Что сейчас играет: карточка и список дорожек текущего файла */
let current = null

let memory = null

function startPlugin() {
    if (window.plugin_memory_ready) return

    window.plugin_memory_ready = true

    memory = store.create(Lampa.Storage)

    followAudio()
    followSearch()
}

/* ---------------------------------------------------------------- дорожки */

function followAudio() {
    Lampa.Player.listener.follow('start', (data) => {
        current = {card: cardOf(data), tracks: null, subs: null}

        seen.reset()
    })

    // Списки дорожек известны только после открытия файла, поэтому переключаем
    // здесь, а не параметрами запуска: там нужны индексы, а они между раздачами
    // разъезжаются.
    Lampa.PlayerVideo.listener.follow('tracks', (e) => {
        try {
            onTracks(e.tracks)
        } catch (err) {
            console.error('Memory', 'tracks error:', err)
        }
    })

    Lampa.PlayerVideo.listener.follow('subs', (e) => {
        try {
            onSubs(e.subs)
        } catch (err) {
            console.error('Memory', 'subs error:', err)
        }
    })

    // На webOS событий tracks и subs не бывает вовсе: плеер обнуляет список
    // и уходит в нативную ветку ([video.js:649](src/interaction/player/video.js:649)),
    // а дорожки приезжают отдельными событиями и попадают сразу в панель.
    // Без этих подписок на телевизоре плагин молчал бы, ничего не восстанавливая.
    Lampa.PlayerVideo.listener.follow('webos_tracks', (e) => {
        try {
            onWebosTracks(e.tracks)
        } catch (err) {
            console.error('Memory', 'webos tracks error:', err)
        }
    })

    Lampa.PlayerVideo.listener.follow('webos_subs', (e) => {
        try {
            onWebosSubs(e.subs)
        } catch (err) {
            console.error('Memory', 'webos subs error:', err)
        }
    })

    Lampa.PlayerVideo.listener.follow('timeupdate', () => {
        try {
            lookAtTracks()
        } catch (err) {
            console.error('Memory', 'track watch error:', err)
        }
    })

    // Субтитры панель объявляет сама, отдельной зацепки не нужно. Событие
    // приходит уже после того, как выставлен `selected` ([panel.js:436]).
    Lampa.PlayerPanel.listener.follow('subsview', () => {
        try {
            rememberSubs()
        } catch (err) {
            console.error('Memory', 'subs save error:', err)
        }
    })

    Lampa.Player.listener.follow('destroy', () => {
        try {
            rememberTrack()
            rememberSubs()
        } catch (err) {
            console.error('Memory', 'save error:', err)
        }

        current = null
    })
}

/**
 * Записать выбор дорожки сразу, а не только на закрытии плеера.
 *
 * Едем на том же событии, на котором Lampa обновляет позицию просмотра
 * ([player.js:137](src/interaction/player.js:137)): `timeupdate` приходит
 * примерно раз в секунду. Своего таймера заводить незачем — этот уже тикает
 * ровно тогда, когда идёт воспроизведение, и замолкает на паузе.
 */
const WATCH_EVERY = 3000

let seen = watch.create()
let looked = 0

function lookAtTracks() {
    if (!current || !current.tracks || current.tracks.length < 2) return

    let now = Date.now()

    if (now - looked < WATCH_EVERY) return

    looked = now

    if (!seen.check(match.describe(match.selected(current.tracks)))) return

    rememberTrack()
}

function onTracks(tracks) {
    if (!current) current = {card: cardOf(null), tracks: null}

    current.tracks = tracks

    // выбирать не из чего
    if (!tracks || tracks.length < 2) return

    let rec = current.card && memory.get(current.card)

    if (!rec || !rec.a) return

    let wanted = match.match(tracks, savedTrack(rec.a))

    if (!wanted || wanted === match.selected(tracks)) return

    // Молча: плагин восстанавливает то, что человек сам и выбрал в прошлый раз,
    // сообщать тут не о чем — а всплывающая плашка в начале каждой серии мешает.
    match.apply(tracks, wanted)
}

/**
 * Сохраняем то, что реально осталось выбранным к концу просмотра — неважно,
 * переключил человек дорожку сам или её выбрал плеер.
 */
function rememberTrack() {
    if (!current || !current.card || !current.tracks || current.tracks.length < 2) return

    let chosen = match.selected(current.tracks)
    let about = match.describe(chosen)

    if (!about) return

    memory.set(current.card, {
        a: {
            l: about.lang,
            n: about.label,
            // Номер дорожки и приметы списка. Названия приходят от стороннего
            // плагина `tracks`, а он может быть не установлен — тогда от двух
            // русских озвучек остаётся один язык, и различить их нечем. Но если
            // список тот же, то и раздача та же, и номер точен.
            i: current.tracks.indexOf(chosen),
            k: match.shape(current.tracks)
        }
    })
}

/** Запомненное о дорожке в том виде, в каком его ждёт сопоставление */
function savedTrack(a) {
    return {lang: a.l || '', label: a.n || '', index: a.i, shape: a.k || ''}
}

/**
 * Субтитры.
 *
 * Выключенные субтитры — такое же осознанное решение, как выбранные, поэтому
 * «выключено» хранится явно. Иначе при следующем запуске сработала бы штатная
 * настройка «включать субтитры сразу», и их пришлось бы выключать каждую серию.
 *
 * Хранятся два разных факта: `so` — включены ли субтитры, `s` — какие именно
 * выбирали. Второе живёт дольше первого. Выключив субтитры, человек не
 * забывает, какие они были, и это знание нужно другим плагинам — subpeek
 * показывает ту же дорожку на время перемотки назад.
 */
function onSubs(subs) {
    if (!current) current = {card: cardOf(null), tracks: null, subs: null}

    current.subs = subs

    let rec = current.card && memory.get(current.card)

    if (!rec || rec.so === undefined) return

    applySubs(subs, rec)
}

function applySubs(subs, rec) {
    // Выключено. Проверять текущее состояние нельзя: в этот момент плеер ещё
    // не показал своё, а через мгновение покажет.
    if (!rec.so) {
        match.applySub(subs, null)

        Lampa.PlayerVideo.subsview(false)

        return
    }

    let wanted = rec.s && match.matchSub(subs, {lang: rec.s.l || '', label: rec.s.n || ''})

    if (!wanted || wanted === match.selectedSub(subs)) return

    match.applySub(subs, wanted)

    Lampa.PlayerVideo.subsview(true)
}

/* ------------------------------------------------------------------ webOS */

/**
 * На телевизоре выбор не применяется руками, а кладётся в `params` плеера.
 *
 * У Lampa для этого есть свой механизм: `saveParams` запоминает выбранные
 * дорожку и субтитры, а `webosLoadTracks`/`webosLoadSubs` применяют их при
 * следующем запуске — и только если там пусто, включают субтитры по штатной
 * настройке ([video.js:189](src/interaction/player/video.js:189)).
 *
 * Мы просто заполняем `params` до того, как плеер до него дойдёт: списки
 * приезжают отдельными событиями раньше, чем плеер их применяет. Так выбор
 * ставит сам плеер, одним движением — без гонки и без двух галочек разом,
 * которые получались, когда две стороны правили список независимо.
 */
function params() {
    return Lampa.PlayerVideo.saveParams()
}

function onWebosTracks(tracks) {
    if (!current) current = {card: cardOf(null), tracks: null, subs: null}

    current.tracks = tracks

    if (!tracks || tracks.length < 2) return

    let rec = current.card && memory.get(current.card)

    if (!rec || !rec.a) return

    let wanted = match.match(tracks, savedTrack(rec.a))

    if (!wanted) return

    // здесь ждут порядковый номер в списке
    params().track = tracks.indexOf(wanted)
}

function onWebosSubs(subs) {
    if (!current) current = {card: cardOf(null), tracks: null, subs: null}

    current.subs = subs

    if (!subs || !subs.length) return

    let rec = current.card && memory.get(current.card)

    if (!rec || rec.so === undefined) return

    let wanted = rec.so && rec.s ? match.matchSub(subs, {lang: rec.s.l || '', label: rec.s.n || ''}) : null

    // а здесь — поле index, где -1 означает «Отключено»
    params().sub = wanted ? wanted.index : -1
}

function rememberSubs() {
    if (!current || !current.card || !current.subs) return

    // выбирать было не из чего — решения человека тут нет
    if (!match.realSubs(current.subs).length) return

    let chosen = match.selectedSub(current.subs)
    let about = chosen && match.describe(chosen)

    // Выключение записывает только `so`: поле `s` остаётся нетронутым, и память
    // о выбранной когда-то дорожке переживает выключение.
    memory.set(current.card, about ? {so: true, s: {l: about.lang, n: about.label}} : {so: false})

    // Язык субтитров человек меняет куда реже, чем тайтлы, поэтому последний
    // выбранный держим ещё и общим — он выручает на карточке, где своей записи
    // ещё нет.
    if (about && about.lang) Lampa.Storage.set(keys.KEYS.subs_lang, about.lang)
}

/* --------------------------------------------------------------- название */

function followSearch() {
    // Подставляем запомненное название до того, как компонент начнёт поиск:
    // событие init приходит после создания компонента, но до его initialize.
    Lampa.Listener.follow('activity', (e) => {
        if (e.component !== 'torrents' || e.type !== 'init') return

        try {
            applyQuery(e.object)
        } catch (err) {
            console.error('Memory', 'query error:', err)
        }
    })

    // Запоминаем название не по факту поиска, а по факту запуска файла:
    // «нашлось» и «это то, что нужно» — разные вещи.
    Lampa.Listener.follow('torrent_file', (e) => {
        if (e.type !== 'onenter') return

        try {
            let active = Lampa.Activity.active() || {}

            if (active.component === 'torrents') rememberQuery(active.movie, active.search)
        } catch (err) {
            console.error('Memory', 'remember error:', err)
        }
    })
}

function applyQuery(object) {
    // человек уточняет название прямо сейчас — его выбор важнее запомненного
    if (!object || !object.movie || object.clarification) return

    let rec = memory.get(object.movie)
    let query = (rec && rec.q) || memory.lastClarify(object.movie)

    if (!query || query === object.search) return

    object.search = query
    object.clarification = true
}

function rememberQuery(card, query) {
    if (!card || !titles.worth(card, query, Lampa.Storage.field('parse_lang'))) return

    memory.set(card, {q: query})
    memory.clarify(card, query)
}

/* ------------------------------------------------------------------ общее */

function cardOf(data) {
    if (data && data.card) return data.card

    let active = Lampa.Activity.active() || {}

    return active.movie || active.card || null
}

// Плагин работает молча и своих строк не имеет: он лишь возвращает то,
// что человек выбрал сам, и рассказывать об этом каждую серию незачем.

if (window.appready) startPlugin()
else {
    Lampa.Listener.follow('app', (e) => {
        if (e.type === 'ready') startPlugin()
    })
}

// доступ для отладки из консоли
window.__memory = {match, store, titles, get: () => memory}

export default {match, store, titles}

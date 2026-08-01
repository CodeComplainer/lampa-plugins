import keys from '../shared/keys'
import match from '../shared/match'
import store from '../memory/store'
import burst from './burst'
import choose from './choose'

/**
 * Субтитры на время перемотки назад.
 *
 * Не расслышал реплику — отмотал — прочитал. Как на Apple TV: короткая перемотка
 * назад показывает субтитры ровно на тот же срок, на который отмотали, и гасит
 * их сама. Лезть в меню субтитров пультом ради одной фразы несоизмеримо дороже.
 *
 * Целевая платформа — LG webOS, где субтитры рисует прошивка, а не Lampa.
 *
 * Чего плагин не делает: не трогает шаг перемотки (это штатная настройка
 * `player_rewind`, от неё же берётся длительность) и не угадывает язык.
 * Включить не ту дорожку хуже, чем не включить ничего.
 */

/**
 * Через сколько после последней перемотки считать серию законченной.
 *
 * Штатный seek происходит через 1000 мс после последнего нажатия
 * ([video.js:1361](src/interaction/player/video.js:1361)) — ждём чуть дольше,
 * чтобы прочитать уже новую позицию, а не старую.
 */
const SERIES_END = 1200

/** Если штатная настройка почему-то пуста */
const DEFAULT_SECONDS = 10

/** Меньший сдвиг считаем дрожанием, а не перемоткой назад */
const MIN_BACK = 0.5

/** Список дорожек субтитров текущего файла */
let subs = null

/**
 * Файл идёт через нативный плеер webOS.
 *
 * Определяется по факту прихода `webos_subs`, а не по `Lampa.Platform`: на том
 * же телевизоре нативная ветка не включается, если источник отдал `voiceovers`
 * ([video.js:979](src/interaction/player/video.js:979)).
 */
let native = false

/** Дорожка, которую человек включал сам за это воспроизведение */
let chosen = null

/** Текущая серия перемоток: {timer, from} */
let series = null

/** Идущая вспышка: {timer} */
let flash = null

let taps = burst.create()

function startPlugin() {
    if (window.plugin_subpeek_ready) return

    window.plugin_subpeek_ready = true

    follow()
}

function follow() {
    // Новая серия приходит без `destroy`, поэтому гасим и здесь: иначе таймер
    // вспышки сработал бы уже поверх следующего файла.
    Lampa.Player.listener.follow('start', () => {
        guard('start', () => {
            stop()
            forget()
        })
    })

    Lampa.Player.listener.follow('destroy', () => {
        guard('destroy', () => {
            stop()
            forget()
        })
    })

    // Списки приходят разными событиями и на разных платформах — разными
    // по смыслу: в браузере это дорожки, которые рисует Lampa, на телевизоре —
    // те, что рисует прошивка.
    Lampa.PlayerVideo.listener.follow('subs', (e) => {
        guard('subs', () => {
            if (!native) subs = e.subs
        })
    })

    Lampa.PlayerVideo.listener.follow('webos_subs', (e) => {
        guard('webos subs', () => {
            subs = e.subs
            native = true
        })
    })

    // Каждый вызов перемотки, включая кнопки панели. Клик и свайп по таймлайну
    // идут мимо — они зовут `Video.to`, который этого события не шлёт, и
    // большие прыжки мышью отсекаются сами.
    Lampa.PlayerVideo.listener.follow('rewind', () => {
        guard('rewind', tick)
    })

    // Отсчёт до гашения ведём по таймлайну, а не по часам, поэтому нужен тик
    // самого воспроизведения: на паузе он не приходит — и правильно, субтитры
    // должны дождаться, пока фильм пойдёт дальше.
    Lampa.PlayerVideo.listener.follow('timeupdate', () => {
        guard('timeupdate', watchFlash)
    })

    // Нажатие не отслеживаем: важно не сколько раз нажали, а отпускали ли
    // кнопку между двумя перемотками.
    Lampa.Keypad.listener.follow('keyup', () => {
        taps.up()
    })

    // Гасим до того, как плеер закроется: канал `back` уходит в шину раньше,
    // чем keypad зовёт `Controller.back()` ([keypad.js:178](src/core/keypad.js:178)).
    // Иначе memory успела бы записать нашу вспышку как выбор человека.
    Lampa.Keypad.listener.follow('back', () => {
        guard('back', stop)
    })

    // Человек сам выбрал дорожку в панели. `selected` там выставляется до
    // отправки события ([panel.js:436](src/interaction/player/panel.js:436)),
    // так что читать можно сразу.
    Lampa.PlayerPanel.listener.follow('subsview', (e) => {
        guard('subsview', () => {
            // Человек взялся за субтитры сам — наш таймер больше не при делах.
            // Именно отпустить, а не погасить: он мог их только что включить.
            release()

            if (!e.status) return

            let about = match.describe(match.selectedSub(subs))

            if (!about) return

            chosen = about

            // Плагин обязан работать и без memory, поэтому общий язык
            // записывает тоже: кто увидел выбор, тот и запомнил.
            if (about.lang) Lampa.Storage.set(keys.KEYS.subs_lang, about.lang)
        })
    })
}

/* ------------------------------------------------------------------ серия */

function tick() {
    taps.tick(Date.now())

    if (!series) series = {timer: null, from: position()}

    clearTimeout(series.timer)

    series.timer = setTimeout(() => {
        guard('series', finish)
    }, SERIES_END)
}

/**
 * Серия закончилась — решаем, была ли это короткая перемотка назад.
 *
 * Направление и величину берём по факту, из позиции до и после: сложить их
 * из числа нажатий нельзя — штатный шаг растёт с ускорением, а вперёд можно
 * ещё и перепрыгнуть рекламный сегмент.
 */
function finish() {
    let info = taps.end()
    let from = series.from

    series = null

    if (info.hold) return

    let back = from - position()

    if (back < MIN_BACK) return

    // перемотали ещё раз, пока субтитры были на экране — просто продлеваем
    if (flash) return show()

    if (match.selectedSub(subs)) return

    let wanted = pick()

    if (!wanted) return

    match.applySub(subs, wanted)

    // На webOS видимостью управляет прошивка, и `subsview` до неё не доходит:
    // он прячет DOM-слой Lampa, а субтитры рисуются поверх видеоплоскости.
    if (!native) Lampa.PlayerVideo.subsview(true)

    show()
}

/**
 * Завести или продлить показ.
 *
 * Отсчёт идёт по таймлайну плеера, а не по часам: субтитры держатся, пока
 * воспроизведение не пройдёт положенные секунды **с текущего места**. Часы
 * тут врут — на паузе они идут, а фильм стоит, и субтитры погасли бы у
 * человека, который отмотал и задумался. Замедление и прыжок вперёд ломали
 * бы отсчёт так же.
 *
 * Новая перемотка не продлевает старый отрезок, а назначает новый: точка
 * отсчёта — то место, куда попали сейчас.
 */
function show() {
    flash = {until: position() + seconds()}
}

/** Пора ли гасить: проверяется на каждом `timeupdate` */
function watchFlash() {
    if (!flash || position() < flash.until) return

    stop()
}

/**
 * Погасить и вернуть всё как было.
 *
 * Именно вернуть, а не оставить дорожку выбранной «на потом»: memory на закрытии
 * плеера считает дорожку выбранной в том числе по `mode === 'showing'`
 * (match.js: selectedSub) и запомнила бы, что человек смотрит с субтитрами.
 */
function stop() {
    if (!release()) return

    match.applySub(subs, null)

    if (!native) Lampa.PlayerVideo.subsview(false)
}

/**
 * Перестать следить за вспышкой, ничего не переключая.
 *
 * @returns {boolean} вспышка была
 */
function release() {
    if (!flash) return false

    flash = null

    return true
}

/* ---------------------------------------------------------------- дорожка */

/**
 * Что показывать. Сам отбор — в choose.js, здесь только сбор того, что о
 * человеке известно: за этими тремя источниками стоит хранилище и активность,
 * а решение должно проверяться тестами без запущенного приложения.
 */
function pick() {
    return choose.choose(subs, {chosen: chosen, remembered: remembered(), language: language()})
}

/**
 * Дорожка, запомненная memory по текущей карточке.
 *
 * Читаем общий ключ напрямую, а не через `store.create`: тот при чтении
 * перекладывает запись в конец и пишет хранилище, а нам нужно только взглянуть.
 * Поле `s` отвечает на вопрос «какие субтитры», а не «включены ли» — на второй
 * отвечает `so`, и нас он не касается: мы включаем на время, а не насовсем.
 */
function remembered() {
    let card = cardOf()

    if (!card) return null

    let key = store.cardID(card)

    if (!key) return null

    let rec = Lampa.Storage.cache(store.KEY, store.LIMIT, {})[key]

    if (!rec || !rec.s) return null

    return rec.s.l || rec.s.n ? rec.s : null
}

/** Последний язык субтитров — общий на все тайтлы */
function language() {
    let saved = Lampa.Storage.get(keys.KEYS.subs_lang, '')

    return saved ? saved + '' : ''
}

function cardOf() {
    let active = Lampa.Activity.active() || {}

    return active.movie || active.card || null
}

/* ------------------------------------------------------------------ общее */

/** Сколько секунд держать субтитры: столько же, на сколько отматывают */
function seconds() {
    let value = parseInt(Lampa.Storage.field('player_rewind'), 10)

    return value > 0 ? value : DEFAULT_SECONDS
}

function position() {
    let video = Lampa.PlayerVideo.video()

    return (video && video.currentTime) || 0
}

/** Новый файл: чужие нажатия и чужие дорожки к нему отношения не имеют */
function forget() {
    if (series) clearTimeout(series.timer)

    subs = null
    native = false
    chosen = null
    series = null

    taps.reset()
}

/** Исключение в подписчике не должно ронять плеер */
function guard(where, run) {
    try {
        run()
    } catch (err) {
        console.error('Subpeek', where + ' error:', err)
    }
}

// Плагин работает молча и своих строк не имеет: он показывает субтитры,
// которые человек и так выбирал сам, и объявлять об этом незачем.

if (window.appready) startPlugin()
else {
    Lampa.Listener.follow('app', (e) => {
        if (e.type === 'ready') startPlugin()
    })
}

// доступ для отладки из консоли
window.__subpeek = {
    burst: taps,
    choose: choose,
    pick: pick,
    state: () => ({subs: subs, native: native, chosen: chosen, flash: !!flash, series: !!series})
}

export default {burst}

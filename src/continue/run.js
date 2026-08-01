/**
 * Запуск выбранной раздачи.
 *
 * Своей цепочки TorrServer здесь нет и не должно быть: Lampa.Torrent.start уже
 * умеет добавить торрент, дождаться файлов, разобрать серии, привязать прогресс
 * и собрать плейлист для перехода к следующей серии. Нам остаётся дождаться
 * списка файлов и нажать нужный за пользователя.
 */

/** Сколько ждём тишины после последнего отрисованного файла */
const SETTLE = 200

/** Сколько ждём сам список файлов: торрент может подниматься долго */
const TIMEOUT = 90000

/**
 * @param {Object} candidate - выбранная раздача (из pick)
 * @param {Object} movie - карточка
 * @param {Object} want - {season, episode} или null для фильма
 * @param {Object} handlers - {onStart, onError}
 */
function run(candidate, movie, want, handlers) {
    handlers = handlers || {}

    if (!Lampa.Torserver.url()) return fail(handlers, 'no_server')

    let files = []
    let finished = false
    let settle = null
    let timeout = null

    function listener(e) {
        if (e.type === 'render') {
            files.push(e)

            clearTimeout(settle)

            settle = setTimeout(choose, SETTLE)
        }

        // пользователь закрыл список сам — больше не вмешиваемся
        if (e.type === 'list_close') stop()
    }

    function choose() {
        if (finished) return

        let target = want ? findEpisode(files, want) : findBiggest(files)

        // Нужной серии в раздаче нет. Список уже открыт — пусть выбирает сам,
        // это честнее, чем запустить наугад другую серию.
        if (!target) {
            stop()

            return fail(handlers, want ? 'no_episode' : 'no_file')
        }

        finished = true

        stop()

        if (handlers.onStart) handlers.onStart(target.element)

        target.item.trigger('hover:enter')
    }

    function stop() {
        clearTimeout(settle)
        clearTimeout(timeout)

        Lampa.Listener.remove('torrent_file', listener)
    }

    Lampa.Listener.follow('torrent_file', listener)

    timeout = setTimeout(() => {
        if (finished) return

        stop()

        fail(handlers, 'timeout')
    }, TIMEOUT)

    // poster нужен, чтобы торрент в TorrServer выглядел как карточка
    candidate.raw.poster = movie.img

    Lampa.Torrent.start(candidate.raw, movie)
}

/** Файл нужной серии */
function findEpisode(files, want) {
    return files.find((e) => {
        return e.element && e.element.season === want.season && e.element.episode === want.episode
    })
}

/**
 * Для фильма берём самый большой файл: в раздачах рядом лежат трейлеры и семплы.
 */
function findBiggest(files) {
    let best = null

    files.forEach((e) => {
        if (!e.element) return

        if (!best || (e.element.length || 0) > (best.element.length || 0)) best = e
    })

    return best
}

function fail(handlers, reason) {
    if (handlers.onError) handlers.onError(reason)
}

export default {run}

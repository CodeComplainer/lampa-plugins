/**
 * Что именно запускать: продолжить начатую серию, включить следующую
 * или начать сериал с начала.
 *
 * Логика вынесена в чистую функцию: список серий и прогресс приходят снаружи,
 * поэтому её можно проверять тестами без запущенного приложения.
 */

/**
 * Порог «досмотрено». Тот же, что в самой Lampa: плеер предлагает продолжить
 * только если просмотрено меньше 90%.
 */
const WATCHED = 90

/**
 * @param {Array} episodes - [{season_number, episode_number}], по порядку выхода
 * @param {Function} viewOf - (season, episode) => {percent} прогресс по серии
 * @param {Object} [meta] - {next: next_episode_to_air из TMDB}
 * @returns {{mode: string, season: number|null, episode: number|null, percent: number, air: string|null}}
 *
 * mode:
 *   resume  — серия начата, но не досмотрена
 *   next    — предыдущая досмотрена, включаем следующую
 *   first   — ничего не смотрели
 *   waiting — всё просмотрено, но сериал продолжается: ждём новую серию
 *   restart — всё просмотрено, продолжения не будет: можно смотреть сначала
 */
function decideSeries(episodes, viewOf, meta) {
    let list = (episodes || []).filter((ep) => ep && ep.episode_number)

    if (!list.length) return {mode: 'first', season: null, episode: null, percent: 0}

    let last_index = -1
    let last_view = null

    // Идём с конца: интересует самая поздняя серия, к которой прикасались.
    // Перебор с начала дал бы неверный ответ, если сериал начали пересматривать.
    for (let i = list.length - 1; i >= 0; i--) {
        let view = viewOf(list[i].season_number, list[i].episode_number) || {}

        if (view.percent) {
            last_index = i
            last_view = view

            break
        }
    }

    if (last_index === -1) {
        return {
            mode: 'first',
            season: list[0].season_number,
            episode: list[0].episode_number,
            percent: 0
        }
    }

    // начатую, но не досмотренную серию просто продолжаем
    if (last_view.percent < WATCHED) {
        return {
            mode: 'resume',
            season: list[last_index].season_number,
            episode: list[last_index].episode_number,
            percent: last_view.percent
        }
    }

    let next = list[last_index + 1]

    if (!next) return nothingLeft(list[last_index], last_view, meta)

    return {
        mode: 'next',
        season: next.season_number,
        episode: next.episode_number,
        percent: 0,
        air: null
    }
}

/**
 * Вышедшие серии кончились. Дальше всё зависит от того, будет ли продолжение.
 *
 * Дату эфира из TMDB показываем как ориентир «не раньше», а не как обещание:
 * раздача с озвучкой появляется позже эфира, иногда на несколько дней.
 */
function nothingLeft(last, view, meta) {
    let next = meta && meta.next

    // серия по данным TMDB уже вышла, а в нашем списке её нет — список устарел,
    // берём её целью: раздача может быть уже доступна
    if (next && next.air_date && !isFuture(next.air_date)) {
        return {
            mode: 'next',
            season: next.season_number,
            episode: next.episode_number,
            percent: 0,
            air: next.air_date
        }
    }

    if (next && next.air_date) {
        return {
            mode: 'waiting',
            season: next.season_number,
            episode: next.episode_number,
            percent: 0,
            air: next.air_date
        }
    }

    return {
        mode: 'restart',
        season: last.season_number,
        episode: last.episode_number,
        percent: view.percent,
        air: null
    }
}

function isFuture(air_date) {
    let air = new Date(air_date).getTime()

    return !Number.isNaN(air) && air > Date.now()
}

/**
 * Фильм: серий нет, решается только тем, начат он или нет.
 */
function decideMovie(view) {
    let percent = (view || {}).percent || 0

    if (!percent) return {mode: 'first', season: null, episode: null, percent: 0, air: null}

    if (percent < WATCHED) return {mode: 'resume', season: null, episode: null, percent: percent, air: null}

    return {mode: 'restart', season: null, episode: null, percent: percent, air: null}
}

/**
 * Подпись под кнопкой. Показывает, что произойдёт по нажатию,
 * чтобы решение плагина не было неожиданным.
 */
function label(decision, translate, formatDate) {
    let t = translate || ((key) => key)

    // Ждём продолжения: показываем ориентир «не раньше эфира». Точную дату
    // появления раздачи никто не знает, обещать её нельзя.
    if (decision.mode === 'waiting') {
        if (!decision.air) return t('continue_waiting')

        let date = formatDate ? formatDate(decision.air) : decision.air

        return t('continue_after') + ' ' + date
    }

    if (decision.mode === 'restart') return t('continue_from_start')

    // Компактная нотация: подпись висит на кнопке, и «S3 · серия 5 · …»
    // растягивает её на пол-экрана
    if (decision.season && decision.episode) {
        let where = 'S' + decision.season + 'E' + decision.episode

        if (decision.mode === 'resume') return where + ' · ' + decision.percent + '%'

        return where
    }

    if (decision.mode === 'resume') return decision.percent + '%'

    return ''
}

export default {decideSeries, decideMovie, label, WATCHED}

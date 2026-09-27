/**
 * Новые серии: у каких сериалов из истории вышло то, что человек ещё не видел.
 *
 * Чистые функции. Решение «какую серию включать» и список вышедших серий
 * приходят снаружи — те же, что у кнопки «Смотреть» (`describe` в continue):
 * иначе ряд обещал бы одну серию, а кнопка включала другую.
 */

const DAY = 24 * 60 * 60 * 1000

/**
 * Сериал считается «идущим», пока последняя вышедшая серия не старше этого.
 *
 * Отсекает досмотр старого сериала запоем: там следующая серия тоже доступна,
 * но она не новая — она вышла годы назад и никуда не денется.
 */
const AIRING_DAYS = 45

/**
 * Дата эфира в миллисекундах, NaN — если её нет. Разбирается как местная
 * полночь, так же как у самой Lampa (`Utils.parseToDate`): «вышла сегодня»
 * должно значить сегодня у человека, а не по Гринвичу.
 */
function airTime(air) {
    if (!air) return NaN

    return new Date(String(air).split('T')[0].replace(/-/g, '/')).getTime()
}

/**
 * Финал ли это: сезона или всего сериала.
 *
 * TMDB с 2023 года размечает серии полем `episode_type`, ему и верим. Где
 * разметки нет, финалом считаем последнюю объявленную серию сезона, после
 * которой в этом сезоне ничего не ждут.
 *
 * @param {Object} show - {seasons, next_episode_to_air, status} из TMDB `tv/{id}`
 * @param {Object} ep - серия из списка
 * @param {Array} list - вышедшие серии
 * @returns {string|null} 'series' | 'season' | null
 */
function finale(show, ep, list) {
    let next = show.next_episode_to_air
    let season = (show.seasons || []).find((s) => s.season_number === ep.season_number)

    let is_finale = ep.episode_type
        ? ep.episode_type === 'finale'
        : !!season &&
          ep.episode_number === season.episode_count &&
          !(next && next.season_number === ep.season_number)

    if (!is_finale) return null

    let ended = show.status === 'Ended' || show.status === 'Canceled'
    let last_season = list[list.length - 1].season_number

    return ended && !next && ep.season_number === last_season ? 'series' : 'season'
}

/**
 * Есть ли у сериала несмотренная новая серия.
 *
 * @param {Object} decision - решение кнопки: `resume.decideSeries`
 * @param {Array} list - вышедшие серии по порядку, как их видит кнопка
 * @param {Object} show - {seasons, next_episode_to_air, status}
 * @param {number} [now]
 * @returns {null|{s, e, n, f, air}} — с какой серии смотреть, сколько новых,
 *   финал ли среди них и когда вышла последняя
 */
function check(decision, list, show, now) {
    // «Досмотрел прошлую — следующая вышла» или «новую уже начал». Ни разу не
    // смотренный сериал — не новое: в истории он оказывается и просто от
    // открытой карточки.
    if (decision.mode !== 'next' && decision.mode !== 'resume') return null

    let index = list.findIndex(
        (ep) => ep.season_number === decision.season && ep.episode_number === decision.episode
    )

    // Цели нет среди вышедших — кнопке её не найти, обещать нечего
    if (index === -1) return null

    let latest = list[list.length - 1]
    let air = airTime(latest.air_date)

    now = now || Date.now()

    if (!(now - air < AIRING_DAYS * DAY)) return null

    return {
        s: decision.season,
        e: decision.episode,
        n: list.length - index,
        f: finale(show, latest, list),
        air: latest.air_date
    }
}

/**
 * Надпись на постере. Короткая: места там на пару слов.
 *
 *   S2E5         одна новая серия
 *   S2E5 +2      с пятой, и после неё ещё две
 *   S2E10 · Финал сезона
 */
function label(item, translate) {
    let text = 'S' + item.s + 'E' + item.e

    if (item.n > 1) text += ' +' + (item.n - 1)

    // continue_fresh_season_finale или continue_fresh_series_finale
    if (item.f) text += ' · ' + translate('continue_fresh_' + item.f + '_finale')

    return text
}

/**
 * Порядок ряда «Продолжить просмотр»: по времени последнего события, свежее выше.
 *
 * Событие — это запуск или выход новой серии, какое из них позже. Вышла серия
 * вчера у сериала, который смотрели две недели назад, — он поднимается над
 * вчерашним фильмом. Посмотрел её — остаётся наверху, уже по запуску.
 *
 * Время запуска ядро не хранит, только порядок истории, поэтому continue
 * записывает его сам (`played`). Для запусков, которых он не видел, время
 * берётся у ближайшего более старого известного: история — это порядок
 * запусков, и выше в ней стоит то, что запускали позже. Так без единой
 * новой серии порядок в точности штатный.
 *
 * @param {Array} cards - карточки в порядке истории, свежие первыми
 * @param {Object} played - {id: время запуска}
 * @param {Object} fresh - {id: {air}} — новые серии, на которые есть раздача
 * @returns {Array} те же карточки в новом порядке
 */
function arrange(cards, played, fresh) {
    let times = []
    let floor = 0

    for (let i = cards.length - 1; i >= 0; i--) {
        floor = Math.max(floor, played[cards[i].id] || 0)
        times[i] = floor
    }

    return cards
        .map((card, i) => {
            let air = fresh[card.id] ? airTime(fresh[card.id].air) || 0 : 0

            return {card: card, i: i, t: Math.max(times[i], air)}
        })
        .sort((a, b) => b.t - a.t || a.i - b.i)
        .map((entry) => entry.card)
}

export default {airTime, finale, check, label, arrange}

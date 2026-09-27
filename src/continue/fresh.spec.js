import fresh from './fresh'
import resume from './resume'

import {expect, suite, test} from 'vitest'

const NOW = new Date(2026, 8, 27, 12).getTime()

function daysAgo(n) {
    let d = new Date(NOW - n * 24 * 60 * 60 * 1000)

    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())

    function pad(v) {
        return (v < 10 ? '0' : '') + v
    }
}

function viewer(progress) {
    return (season, episode) => ({percent: progress[season + ':' + episode] || 0})
}

/**
 * Вышедшие серии в том виде, в каком их видит кнопка: сезоны по порядку,
 * последняя вышла `last_air`, остальные — на неделю раньше каждая.
 */
function aired(counts, last_air, types) {
    let out = []

    counts.forEach((count, s) => {
        for (let e = 1; e <= count; e++) out.push({season_number: s + 1, episode_number: e})
    })

    out.forEach((ep, i) => {
        ep.air_date = daysAgo(last_air + (out.length - 1 - i) * 7)
        ep.episode_type = types?.[ep.season_number + ':' + ep.episode_number] || null
    })

    return out
}

/** Карточка TMDB: объявленные сезоны, следующая серия, статус */
function show(counts, extra) {
    return Object.assign(
        {
            status: 'Returning Series',
            seasons: counts.map((count, i) => ({season_number: i + 1, episode_count: count})),
            next_episode_to_air: null
        },
        extra || {}
    )
}

/** Решение кнопки и итог по тем же данным */
function run(list, progress, info) {
    let decision = resume.decideSeries(list, viewer(progress), {next: info.next_episode_to_air})

    return fresh.check(decision, list, info, NOW)
}

suite('Новая серия', () => {
    test('досмотрел прошлую, следующая вышла на днях', () => {
        let item = run(aired([5], 2), {'1:4': 95}, show([8]))

        expect(item).toMatchObject({s: 1, e: 5, n: 1, f: null})
    })

    test('отстал на несколько серий — считает все новые', () => {
        let item = run(aired([6], 1), {'1:3': 100}, show([8]))

        expect(item).toMatchObject({s: 1, e: 4, n: 3})
    })

    test('новую уже начал — она всё ещё новая, пока не досмотрена', () => {
        let item = run(aired([5], 2), {'1:4': 100, '1:5': 30}, show([8]))

        expect(item).toMatchObject({s: 1, e: 5, n: 1})
    })

    test('всё просмотрено — нового нет', () => {
        expect(run(aired([5], 2), {'1:5': 97}, show([8]))).toBeNull()
    })

    test('ни одной серии не смотрели — не новое, карточку просто открывали', () => {
        expect(run(aired([5], 2), {}, show([8]))).toBeNull()
    })

    test('старый сериал запоем — следующая доступна, но не новая', () => {
        let item = run(aired([10, 10], 900), {'1:3': 100}, show([10, 10], {status: 'Ended'}))

        expect(item).toBeNull()
    })

    test('новый сезон после досмотренного старого', () => {
        let item = run(aired([10, 1], 3), {'1:10': 100}, show([10, 8]))

        expect(item).toMatchObject({s: 2, e: 1, n: 1})
    })

    test('серия, которой нет среди вышедших, не обещается', () => {
        let info = show([8], {
            next_episode_to_air: {season_number: 1, episode_number: 5, air_date: daysAgo(0)}
        })
        let decision = {mode: 'next', season: 1, episode: 5}

        expect(fresh.check(decision, aired([4], 8), info, NOW)).toBeNull()
    })
})

suite('Финал', () => {
    test('размечен в TMDB как финал сезона', () => {
        let item = run(aired([10], 1, {'1:10': 'finale'}), {'1:9': 100}, show([10]))

        expect(item.f).toBe('season')
    })

    test('финал среди нескольких новых серий тоже подсвечивается', () => {
        let item = run(aired([10], 1, {'1:10': 'finale'}), {'1:7': 100}, show([10]))

        expect(item).toMatchObject({e: 8, n: 3, f: 'season'})
    })

    test('финал сериала — если он закончен', () => {
        let item = run(aired([10, 6], 1, {'2:6': 'finale'}), {'2:5': 100}, show([10, 6], {status: 'Ended'}))

        expect(item.f).toBe('series')
    })

    test('середина сезона по разметке — не финал', () => {
        let item = run(aired([8], 1, {'1:8': 'mid_season'}), {'1:7': 100}, show([16]))

        expect(item.f).toBeNull()
    })

    test('без разметки: последняя объявленная серия сезона', () => {
        let list = aired([10], 1)

        expect(fresh.finale(show([10]), list[9], list)).toBe('season')
    })

    test('без разметки: в сезоне ещё ждут серию — не финал', () => {
        let list = aired([10], 1)
        let info = show([10], {
            next_episode_to_air: {season_number: 1, episode_number: 11, air_date: daysAgo(-7)}
        })

        expect(fresh.finale(info, list[9], list)).toBeNull()
    })
})

suite('Подпись, даты и порядок', () => {
    test('подпись', () => {
        let t = (key) => ({continue_fresh_season_finale: 'Финал сезона'})[key] || key

        expect(fresh.label({s: 2, e: 5, n: 1, f: null}, t)).toBe('S2E5')
        expect(fresh.label({s: 2, e: 5, n: 3, f: null}, t)).toBe('S2E5 +2')
        expect(fresh.label({s: 2, e: 10, n: 1, f: 'season'}, t)).toBe('S2E10 · Финал сезона')
    })

    test('дата эфира — местная полночь', () => {
        expect(fresh.airTime('2026-09-27')).toBe(new Date(2026, 8, 27).getTime())
        expect(Number.isNaN(fresh.airTime(null))).toBe(true)
    })
})

suite('Порядок «Продолжить просмотр»', () => {
    const HOUR = 60 * 60 * 1000
    const cards = [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
    const ids = (list) => list.map((c) => c.id)

    test('без новых серий — порядок истории', () => {
        let played = {1: NOW - HOUR, 3: NOW - 5 * HOUR}

        expect(ids(fresh.arrange(cards, played, {}))).toEqual([1, 2, 3, 4])
    })

    test('ничего не записано — тоже порядок истории', () => {
        expect(ids(fresh.arrange(cards, {}, {}))).toEqual([1, 2, 3, 4])
    })

    test('новая серия поднимает сериал над тем, что смотрели раньше неё', () => {
        let played = {1: NOW - 3 * 24 * HOUR, 2: NOW - 5 * 24 * HOUR, 3: NOW - 10 * 24 * HOUR}

        expect(ids(fresh.arrange(cards, played, {3: {air: daysAgo(1)}}))).toEqual([3, 1, 2, 4])
    })

    test('но не над тем, что смотрели уже после её выхода', () => {
        let played = {1: NOW - HOUR, 2: NOW - 5 * 24 * HOUR, 3: NOW - 10 * 24 * HOUR}

        expect(ids(fresh.arrange(cards, played, {3: {air: daysAgo(2)}}))).toEqual([1, 3, 2, 4])
    })

    test('запуски до установки встают по истории, под новой серией', () => {
        expect(ids(fresh.arrange(cards, {}, {4: {air: daysAgo(1)}}))).toEqual([4, 1, 2, 3])
    })

    test('из двух новых выше та, что вышла позже', () => {
        let out = fresh.arrange(cards, {}, {2: {air: daysAgo(6)}, 3: {air: daysAgo(1)}})

        expect(ids(out)).toEqual([3, 2, 1, 4])
    })
})

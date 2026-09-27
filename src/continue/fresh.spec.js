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

        expect(item).toMatchObject({s: 1, e: 5, seen: 4, aired: 5, total: 8, fresh: true, f: null})
    })

    test('отстал на несколько серий — считает все новые', () => {
        let item = run(aired([6], 1), {'1:3': 100}, show([8]))

        expect(item).toMatchObject({s: 1, e: 4, seen: 3, aired: 6, fresh: true})
    })

    test('новую уже начал — она всё ещё новая, пока не досмотрена', () => {
        let item = run(aired([5], 2), {'1:4': 100, '1:5': 30}, show([8]))

        expect(item).toMatchObject({s: 1, e: 5, seen: 4, fresh: true})
    })

    test('всё просмотрено — нового нет', () => {
        expect(run(aired([5], 2), {'1:5': 97}, show([8]))).toBeNull()
    })

    test('ни одной серии не смотрели — не новое, карточку просто открывали', () => {
        expect(run(aired([5], 2), {}, show([8]))).toBeNull()
    })

    test('старый сериал запоем — следующая доступна, но не новая', () => {
        let item = run(aired([10, 10], 900), {'1:3': 100}, show([10, 10], {status: 'Ended'}))

        expect(item).toMatchObject({s: 1, e: 4, seen: 3, aired: 10, total: 10, fresh: false})
    })

    test('догнал эфир — полоска сезона без пометки', () => {
        let info = show([10], {
            next_episode_to_air: {season_number: 1, episode_number: 7, air_date: daysAgo(-5)}
        })
        let item = run(aired([6], 2), {'1:6': 100}, info)

        expect(item).toMatchObject({s: 1, e: 7, seen: 6, aired: 6, total: 10, fresh: false})
    })

    test('догнал эфир, а дальше новый сезон — показывать нечего', () => {
        let info = show([10, 8], {
            next_episode_to_air: {season_number: 2, episode_number: 1, air_date: daysAgo(-30)}
        })

        expect(run(aired([10], 20), {'1:10': 100}, info)).toBeNull()
    })

    test('новый сезон после досмотренного старого', () => {
        let item = run(aired([10, 1], 3), {'1:10': 100}, show([10, 8]))

        expect(item).toMatchObject({s: 2, e: 1, seen: 0, aired: 1, total: 8, fresh: true})
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

    test('финал дальше среди новых — не подсвечивается, пока следующая не он', () => {
        let item = run(aired([10], 1, {'1:10': 'finale'}), {'1:7': 100}, show([10]))

        expect(item).toMatchObject({e: 8, f: null})
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
        let t = (key) => ({continue_fresh_finale: 'Финал'})[key] || key

        expect(fresh.label({s: 2, e: 5, f: null}, t)).toBe('S2E5')
        expect(fresh.label({s: 2, e: 10, f: 'season'}, t)).toBe('Финал')
        expect(fresh.label({s: 3, e: 8, f: 'series'}, t)).toBe('Финал')
        // Раздачи нет — пометка про ожидание, а не про финал
        expect(fresh.label({s: 2, e: 10, f: 'season', ok: false}, t)).toBe('S2E10')
    })

    test('дата эфира — местная полночь', () => {
        expect(fresh.airTime('2026-09-27')).toBe(new Date(2026, 8, 27).getTime())
        expect(Number.isNaN(fresh.airTime(null))).toBe(true)
    })
})

suite('Полоска сезона', () => {
    const kinds = (item) => fresh.zones(item).map((z) => z.kind + ':' + z.count)

    test('сезон в эфире: посмотрено, новое, пустой хвост', () => {
        expect(kinds({seen: 4, aired: 5, total: 10, fresh: true, f: null, ok: true})).toEqual([
            'seen:4',
            'new:1',
            'ahead:5'
        ])
    })

    test('сезон вышел целиком — хвоста нет', () => {
        expect(kinds({seen: 5, aired: 8, total: 8, fresh: true, f: null})).toEqual(['seen:5', 'new:3'])
    })

    test('следующая — финал', () => {
        expect(kinds({seen: 7, aired: 8, total: 8, fresh: true, f: 'season', ok: true})).toEqual([
            'seen:7',
            'finale:1'
        ])
    })

    test('раздачи нет — серии вышли, но смотреть нечем', () => {
        expect(kinds({seen: 9, aired: 10, total: 10, fresh: true, f: 'season', ok: false})).toEqual([
            'seen:9',
            'wait:1'
        ])
    })

    test('старый сериал — доступно, но не ново', () => {
        expect(kinds({seen: 3, aired: 10, total: 10, fresh: false, f: null})).toEqual(['seen:3', 'open:7'])
    })

    test('догнал эфир', () => {
        expect(kinds({seen: 6, aired: 6, total: 12, fresh: false, f: null})).toEqual(['seen:6', 'ahead:6'])
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

import run from './run'

import {expect, suite, test} from 'vitest'

/** Отрисованный файл в том виде, в каком его шлёт torrent_file/render */
function file(season, episode) {
    return {element: {season: season, episode: episode, length: 1}}
}

suite('Файл нужной серии', () => {
    test('точное совпадение сезона и серии', () => {
        let files = [file(3, 4), file(3, 5)]

        expect(run.findEpisode(files, {season: 3, episode: 5}, [3])).toBe(files[1])
    })

    test('раздача третьего сезона с файлами без номера сезона', () => {
        // разбор имени «05. Название.mkv» ставит первый сезон
        let files = [file(1, 4), file(1, 5)]

        expect(run.findEpisode(files, {season: 3, episode: 5}, [3])).toBe(files[1])
    })

    test('сезон раздачи не назван — чужую серию не подсовываем', () => {
        let files = [file(1, 4), file(1, 5)]

        expect(run.findEpisode(files, {season: 3, episode: 5}, [])).toBe(null)
    })

    test('в файлах несколько сезонов — сверяем строго', () => {
        let files = [file(1, 5), file(2, 5)]

        expect(run.findEpisode(files, {season: 3, episode: 5}, [3])).toBe(null)
    })
})

import resume from './resume'

import {expect, suite, test} from 'vitest'

/**
 * Прогресс просмотра задаётся картой 'сезон:серия' -> процент.
 * Так тест читается ближе к тому, что видит пользователь.
 */
function viewer(progress) {
    return (season, episode) => ({percent: progress[season + ':' + episode] || 0})
}

/** Сезон из N серий */
function season(number, count) {
    let out = []

    for (let i = 1; i <= count; i++) out.push({season_number: number, episode_number: i})

    return out
}

suite('Сериал', () => {
    test('ничего не смотрели — начинаем с первой серии', () => {
        let d = resume.decideSeries(season(1, 10), viewer({}))

        expect(d.mode, 'mode').toBe('first')
        expect(d.season, 'season').toBe(1)
        expect(d.episode, 'episode').toBe(1)
    })

    test('серия начата — продолжаем её', () => {
        let d = resume.decideSeries(season(1, 10), viewer({'1:3': 42}))

        expect(d.mode, 'mode').toBe('resume')
        expect(d.episode, 'episode').toBe(3)
        expect(d.percent, 'percent').toBe(42)
    })

    test('серия досмотрена — включаем следующую', () => {
        let d = resume.decideSeries(season(1, 10), viewer({'1:3': 95}))

        expect(d.mode, 'mode').toBe('next')
        expect(d.episode, 'episode').toBe(4)
        expect(d.percent, 'percent').toBe(0)
    })

    // Тот же порог, что у самой Lampa: продолжать предлагается до 90%
    test('ровно 90% считается досмотренным', () => {
        expect(resume.decideSeries(season(1, 10), viewer({'1:3': 90})).mode, '90').toBe('next')
        expect(resume.decideSeries(season(1, 10), viewer({'1:3': 89})).mode, '89').toBe('resume')
    })

    // Сериал закончился: продолжения не будет, предлагаем смотреть сначала
    test('всё просмотрено и продолжения не будет — смотреть сначала', () => {
        let d = resume.decideSeries(season(1, 4), viewer({'1:4': 100}))

        expect(d.mode, 'mode').toBe('restart')
        expect(d.episode, 'episode').toBe(4)
    })

    // Сериал продолжается: первую серию предлагать неуместно, человек ждёт новую
    test('всё просмотрено, но серия ещё не вышла — ждём', () => {
        let d = resume.decideSeries(season(3, 4), viewer({'3:4': 100}), {
            next: {season_number: 3, episode_number: 5, air_date: '2999-01-01'}
        })

        expect(d.mode, 'mode').toBe('waiting')
        expect(d.episode, 'следующая серия').toBe(5)
        expect(d.air, 'дата эфира').toBe('2999-01-01')
    })

    // Список серий мог устареть: TMDB уже знает о вышедшей серии
    test('серия по данным TMDB вышла — берём её целью', () => {
        let d = resume.decideSeries(season(3, 4), viewer({'3:4': 100}), {
            next: {season_number: 3, episode_number: 5, air_date: '2000-01-01'}
        })

        expect(d.mode, 'mode').toBe('next')
        expect(d.episode, 'episode').toBe(5)
    })

    test('переход между сезонами', () => {
        let episodes = season(1, 10).concat(season(2, 8))

        let d = resume.decideSeries(episodes, viewer({'1:10': 96}))

        expect(d.mode, 'mode').toBe('next')
        expect(d.season, 'season').toBe(2)
        expect(d.episode, 'episode').toBe(1)
    })

    // Иначе пересмотр первых серий сбрасывал бы прогресс на начало
    test('при пересмотре берётся самая поздняя затронутая серия', () => {
        let d = resume.decideSeries(season(1, 10), viewer({'1:1': 100, '1:2': 100, '1:7': 30}))

        expect(d.mode, 'mode').toBe('resume')
        expect(d.episode, 'episode').toBe(7)
    })

    test('пропуск в середине не мешает', () => {
        // серии 1-2 досмотрены, 3 пропущена, 4 начата
        let d = resume.decideSeries(season(1, 10), viewer({'1:1': 100, '1:2': 100, '1:4': 15}))

        expect(d.episode, 'episode').toBe(4)
        expect(d.mode, 'mode').toBe('resume')
    })

    test('список серий пуст', () => {
        let d = resume.decideSeries([], viewer({}))

        expect(d.mode, 'mode').toBe('first')
        expect(d.episode, 'episode').toBe(null)
    })
})

suite('Фильм', () => {
    test('не смотрели', () => {
        expect(resume.decideMovie({percent: 0}).mode).toBe('first')
    })

    test('начат — продолжаем', () => {
        let d = resume.decideMovie({percent: 37})

        expect(d.mode, 'mode').toBe('resume')
        expect(d.percent, 'percent').toBe(37)
    })

    test('досмотрен — предлагаем пересмотр', () => {
        expect(resume.decideMovie({percent: 98}).mode).toBe('restart')
    })

    test('прогресса нет вовсе', () => {
        expect(resume.decideMovie(null).mode).toBe('first')
    })
})

suite('Подпись под кнопкой', () => {
    test('серия с процентом', () => {
        let text = resume.label({mode: 'resume', season: 3, episode: 4, percent: 42}, () => 'серия')

        expect(text).toBe('S3E4 · 42%')
    })

    test('следующая серия — без процента', () => {
        expect(resume.label({mode: 'next', season: 3, episode: 5, percent: 0}, () => 'серия')).toBe('S3E5')
    })

    test('фильм с прогрессом', () => {
        expect(resume.label({mode: 'resume', season: null, episode: null, percent: 12})).toBe('12%')
    })

    test('фильм без прогресса — подписи нет', () => {
        expect(resume.label({mode: 'first', season: null, episode: null, percent: 0})).toBe('')
    })

    // Дата эфира — ориентир «не раньше»: раздача с озвучкой выходит позже,
    // поэтому обещать конкретный день нельзя
    test('ожидание новой серии — дата как ориентир', () => {
        let text = resume.label(
            {mode: 'waiting', season: 3, episode: 5, percent: 0, air: '2026-07-30'},
            (key) => (key === 'continue_after' ? 'Новая серия после' : key),
            () => '30 июля'
        )

        expect(text).toBe('Новая серия после 30 июля')
    })

    test('ожидание без известной даты', () => {
        let text = resume.label(
            {mode: 'waiting', season: 3, episode: 5, percent: 0, air: null},
            () => 'Ждём новую серию'
        )

        expect(text).toBe('Ждём новую серию')
    })

    test('всё просмотрено и продолжения не будет', () => {
        let text = resume.label(
            {mode: 'restart', season: 6, episode: 20, percent: 100, air: null},
            () => 'Смотреть сначала'
        )

        expect(text).toBe('Смотреть сначала')
    })
})

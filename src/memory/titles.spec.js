import {describe, expect, it} from 'vitest'
import titles from './titles'

/**
 * Форма карточки повторяет живой ответ TMDB: у сериалов альтернативные
 * названия лежат в `results`, у фильмов — в `titles`.
 */
const SERIES = {
    id: 1,
    title: 'Series Name',
    name: 'Series Name',
    original_title: '원더풀스',
    original_name: '원더풀스',
    first_air_date: '2026-05-15',
    number_of_seasons: 1,
    alternative_titles: {
        results: [
            {iso_3166_1: 'KR', title: 'Korean Alt'},
            {iso_3166_1: 'RU', title: 'Other Russian Name'},
            {iso_3166_1: 'US', title: 'English Alt'},
            {iso_3166_1: 'SA', title: 'Arabic Alt'}
        ]
    }
}

const MOVIE = {
    id: 2,
    title: 'Movie Name',
    original_title: 'Movie Original',
    release_date: '2024-11-27',
    alternative_titles: {
        titles: [{iso_3166_1: 'RU', title: 'Movie Alt'}]
    }
}

describe('primary', () => {
    it('повторяет комбинации штатной кнопки', () => {
        expect(titles.primary(MOVIE, 'df')).toBe('Movie Original')
        expect(titles.primary(MOVIE, 'lg')).toBe('Movie Name')
        expect(titles.primary(MOVIE, 'lg_year')).toBe('Movie Name 2024')
        expect(titles.primary(MOVIE, 'df_lg_year')).toBe('Movie Original Movie Name 2024')
    })

    it('без настройки ведёт себя как df', () => {
        expect(titles.primary(MOVIE)).toBe('Movie Original')
    })

    it('для сериала берёт name и original_name, если title не заполнен', () => {
        let card = {name: 'Series Name', original_name: 'Series Original', first_air_date: '2026-01-01'}

        expect(titles.primary(card, 'lg')).toBe('Series Name')
        expect(titles.primary(card, 'df')).toBe('Series Original')
    })
})

describe('alternatives', () => {
    it('у сериала читает results, свой язык раньше английского', () => {
        expect(titles.alternatives(SERIES, 'ru')).toEqual(['Other Russian Name', 'English Alt'])
    })

    it('у фильма читает titles', () => {
        expect(titles.alternatives(MOVIE, 'ru')).toEqual(['Movie Alt'])
    })

    it('чужие страны отбрасываются', () => {
        expect(titles.alternatives(SERIES, 'ru')).not.toContain('Korean Alt')
        expect(titles.alternatives(SERIES, 'ru')).not.toContain('Arabic Alt')
    })

    it('без блока альтернативных названий пусто', () => {
        expect(titles.alternatives({id: 3}, 'ru')).toEqual([])
    })
})

describe('candidates', () => {
    it('запомненное название идёт первым и с уточнением', () => {
        let list = titles.candidates(SERIES, {remembered: 'Remembered Name', lang: 'ru', parse_lang: 'df'})

        expect(list[0]).toEqual({query: 'Remembered Name', clarification: true})
    })

    it('штатный запрос идёт без уточнения, альтернативные — с ним', () => {
        let list = titles.candidates(SERIES, {lang: 'ru', parse_lang: 'df'})

        expect(list[0]).toEqual({query: '원더풀스', clarification: false})
        expect(list.find((c) => c.query === 'Other Russian Name').clarification).toBe(true)
    })

    it('перебирает оба названия карточки и альтернативные', () => {
        let list = titles.candidates(SERIES, {lang: 'ru', parse_lang: 'df'}).map((c) => c.query)

        expect(list).toEqual(['원더풀스', 'Series Name', 'Other Russian Name', 'English Alt'])
    })

    it('повторы не дублируются', () => {
        let card = {id: 4, title: 'Same Name', original_title: 'Same Name', release_date: '2024-01-01'}

        expect(titles.candidates(card, {remembered: 'Same Name', parse_lang: 'df'})).toEqual([
            {query: 'Same Name', clarification: true}
        ])
    })

    it('пустые названия не попадают в список', () => {
        let card = {id: 5, title: 'Movie Name', original_title: '', release_date: '2024-01-01'}

        let list = titles.candidates(card, {parse_lang: 'df'}).map((c) => c.query)

        expect(list).toEqual(['Movie Name'])
    })
})

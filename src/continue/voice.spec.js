import {describe, expect, it} from 'vitest'
import voice from './voice'

describe('студия по названию дорожки', () => {
    it('название дорожки совпадает с названием студии', () => {
        expect(voice.studio('ColdFilm')).toBe('ColdFilm')
    })

    it('студия узнаётся внутри длинной подписи', () => {
        expect(voice.studio('HDRezka Studio')).toBe('HDrezka')
    })

    it('регистр не важен', () => {
        expect(voice.studio('lostfilm')).toBe('LostFilm')
    })

    it('язык — это не студия', () => {
        expect(voice.studio('English')).toBe(null)
    })

    it('пустое название', () => {
        expect(voice.studio('')).toBe(null)
        expect(voice.studio(null)).toBe(null)
    })
})

describe('что предпочесть при выборе раздачи', () => {
    it('нет записи — нет предпочтения', () => {
        expect(voice.prefer(null, 'ru')).toBe(null)
    })

    it('дорожку не выбирали — остаётся студия запущенной раздачи', () => {
        expect(voice.prefer({v: 'NewComers'}, 'ru')).toBe('NewComers')
    })

    // Проверено на телевизоре: человек слушал ColdFilm внутри раздачи от
    // NewComers, и подмена увела его на другие раздачи посреди сериала.
    it('дорожка внутри раздачи не подменяет саму раздачу', () => {
        let rec = {v: 'NewComers', a: {l: 'ru', n: 'coldfilm'}}

        expect(voice.prefer(rec, 'ru'), 'держимся за ту раздачу, что смотрели').toBe('NewComers')
    })

    it('слушают в оригинале — предпочтение студии снимается', () => {
        let rec = {v: 'NewComers', a: {l: 'en', n: 'english'}}

        expect(voice.prefer(rec, 'ru'), 'а не остаётся русская студия').toBe(null)
    })

    it('дорожка на языке поиска, но студия неизвестна — выручает прежняя', () => {
        let rec = {v: 'NewComers', a: {l: 'ru', n: 'дубляж'}}

        expect(voice.prefer(rec, 'ru')).toBe('NewComers')
    })

    it('язык поиска не задан — отменять нечем, раздача остаётся', () => {
        let rec = {v: 'NewComers', a: {l: 'en', n: 'coldfilm'}}

        expect(voice.prefer(rec, '')).toBe('NewComers')
    })

    // Штатное значение настройки — 'df', «оригинальный»: язык не выбран.
    // Оно тоже из двух букв, и наивное сравнение снимало предпочтение у всех,
    // кто настройку не трогал.
    it('«оригинальный» язык поиска — это не язык', () => {
        let rec = {v: 'NewComers', a: {l: 'en', n: 'english'}}

        expect(voice.prefer(rec, 'df'), 'df не должен совпадать ни с чем').toBe('NewComers')
    })

    it('дорожка без языка ничего не отменяет', () => {
        let rec = {v: 'NewComers', a: {l: '', n: 'lostfilm'}}

        expect(voice.prefer(rec, 'ru')).toBe('NewComers')
    })

    it('дорожка есть, а прежней раздачи нет — предпочитать нечего', () => {
        expect(voice.prefer({a: {l: 'ru', n: 'lostfilm'}}, 'ru')).toBe(null)
    })

    it('ни студии, ни прежней раздачи', () => {
        expect(voice.prefer({a: {l: 'ru', n: 'дубляж'}}, 'ru')).toBe(null)
    })
})

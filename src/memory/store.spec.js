import {describe, expect, it} from 'vitest'
import store from './store'

/**
 * Подмена Lampa.Storage с той же семантикой вытеснения: cache() удаляет
 * ключи в порядке вставки, а не по давности обращения.
 */
function fakeStorage(initial) {
    let data = Object.assign({}, initial)

    return {
        cache(name, max, empty) {
            let value = data[name] === undefined ? JSON.parse(JSON.stringify(empty)) : data[name]

            let keys = Object.keys(value)

            if (keys.length > max) {
                keys.slice(0, keys.length - max).forEach((key) => {
                    delete value[key]
                })
            }

            data[name] = value

            return value
        },
        set(name, value) {
            data[name] = value
        },
        get(name, empty) {
            return data[name] === undefined ? JSON.parse(empty) : data[name]
        },
        field() {
            return ''
        },
        dump() {
            return data
        }
    }
}

const SERIES = {id: 10, original_name: 'Series Name', number_of_seasons: 2}

describe('cardID', () => {
    it('различает сериал и фильм с одинаковым id', () => {
        expect(store.cardID({id: 7, original_name: 'Series Name'})).toBe('7:tv')
        expect(store.cardID({id: 7, original_title: 'Movie Name'})).toBe('7:movie')
    })

    it('без id ключа нет', () => {
        expect(store.cardID({original_name: 'Series Name'})).toBe(null)
        expect(store.cardID(null)).toBe(null)
    })
})

describe('запись и чтение', () => {
    it('возвращает null для незнакомой карточки', () => {
        let memory = store.create(fakeStorage())

        expect(memory.get(SERIES)).toBe(null)
    })

    it('дописывает поля, не затирая прежние', () => {
        let memory = store.create(fakeStorage())

        memory.set(SERIES, {q: 'Other Name'})
        memory.set(SERIES, {a: {l: 'rus', n: 'studio one'}})

        let rec = memory.get(SERIES)

        expect(rec.q).toBe('Other Name')
        expect(rec.a).toEqual({l: 'rus', n: 'studio one'})
    })

    it('сериал и фильм с одним id не смешиваются', () => {
        let memory = store.create(fakeStorage())

        memory.set({id: 7, original_name: 'Series Name'}, {q: 'series query'})
        memory.set({id: 7, original_title: 'Movie Name'}, {q: 'movie query'})

        expect(memory.get({id: 7, original_name: 'Series Name'}).q).toBe('series query')
        expect(memory.get({id: 7, original_title: 'Movie Name'}).q).toBe('movie query')
    })
})

describe('вытеснение', () => {
    function fill(memory, count) {
        for (let i = 1; i <= count; i++) memory.set({id: i, original_title: 'Movie Name'}, {q: 'q' + i})
    }

    it('держит потолок', () => {
        let storage = fakeStorage()
        let memory = store.create(storage)

        fill(memory, store.LIMIT + 10)

        expect(Object.keys(storage.cache(store.KEY, store.LIMIT, {})).length).toBe(store.LIMIT)
    })

    it('чтение спасает запись от вытеснения', () => {
        let memory = store.create(fakeStorage())

        fill(memory, store.LIMIT)

        // первая запись — кандидат на вылет, но к ней вернулись
        memory.get({id: 1, original_title: 'Movie Name'})

        memory.set({id: 999, original_title: 'Movie Name'}, {q: 'fresh'})

        expect(memory.get({id: 1, original_title: 'Movie Name'})).not.toBe(null)
        expect(memory.get({id: 2, original_title: 'Movie Name'})).toBe(null)
    })
})

/**
 * `s` отвечает на вопрос «какие субтитры», `so` — «включены ли». Это два разных
 * факта, и первый живёт дольше второго: выключив субтитры, человек не забывает,
 * какие они были, а подсказке при перемотке без этого нечего показывать.
 */
describe('субтитры: «какие» и «включены ли» — раздельно', () => {
    it('выключение не стирает память о дорожке', () => {
        let storage = fakeStorage({})

        let memory = store.create(storage)

        memory.set(SERIES, {so: true, s: {l: 'ru', n: 'полные'}})
        memory.set(SERIES, {so: false})

        expect(memory.get(SERIES).so, 'выключены').toBe(false)
        expect(memory.get(SERIES).s, 'но помним какие').toEqual({l: 'ru', n: 'полные'})
    })
})

/**
 * Запомненное название стоит первым в каскаде поиска. Если раздача в последний
 * раз нашлась по обычному названию карточки, прежнее больше не нужно — иначе
 * поиск так и начинался бы с устаревшего, и штатный список уточнения тоже.
 */
describe('название для поиска', () => {
    it('нестандартное запоминается и уходит в список уточнения', () => {
        let storage = fakeStorage()
        let memory = store.create(storage)

        memory.query(SERIES, 'Other Name')

        expect(memory.get(SERIES).q).toBe('Other Name')
        expect(storage.dump().user_clarifys[SERIES.id]).toEqual(['Other Name'])
    })

    it('запуск по обычному названию стирает прежнее', () => {
        let storage = fakeStorage()
        let memory = store.create(storage)

        memory.query(SERIES, 'Other Name')
        memory.query(SERIES, 'Series Name')

        expect(memory.get(SERIES).q, 'пустая строка — ищем по карточке').toBe('')
        expect(memory.searchName(SERIES), 'и штатный список его не воскрешает').toBe(null)
    })

    it('чужие уточнения в штатном списке не трогает', () => {
        let storage = fakeStorage({user_clarifys: {[SERIES.id]: ['Typed Name']}})
        let memory = store.create(storage)

        memory.query(SERIES, 'Other Name')
        memory.query(SERIES, 'Series Name')

        expect(storage.dump().user_clarifys[SERIES.id]).toEqual(['Typed Name'])
    })

    it('без запомненного названия обычное ничего не пишет', () => {
        let memory = store.create(fakeStorage())

        memory.query(SERIES, 'Series Name')

        expect(memory.get(SERIES)).toBe(null)
    })
})

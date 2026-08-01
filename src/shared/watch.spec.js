import {describe, expect, it} from 'vitest'
import watch from './watch'

const RU = {lang: 'ru', label: 'coldfilm'}
const EN = {lang: 'en', label: 'english'}

/**
 * Наблюдение начинается посреди воспроизведения, и в этот момент дорожка уже
 * выбрана — плеером. Поэтому первое значение только запоминается.
 */
describe('точка отсчёта', () => {
    it('первое наблюдение решением не считается', () => {
        let w = watch.create()

        expect(w.check(RU), 'дорожку поставил плеер').toBe(null)
    })

    it('смена после точки отсчёта — уже решение', () => {
        let w = watch.create()

        w.check(RU)

        expect(w.check(EN)).toBe(EN)
    })

    it('пустое первое наблюдение тоже годится как отсчёт', () => {
        let w = watch.create()

        expect(w.check(null), 'на webOS плеер свой выбор не помечает').toBe(null)
        expect(w.check(RU), 'а вот это уже человек').toBe(RU)
    })
})

describe('смена выбора', () => {
    it('тот же выбор второй раз — не смена', () => {
        let w = watch.create()

        w.check(RU)
        w.check(EN)

        expect(w.check(EN)).toBe(null)
    })

    it('частые проверки не множат события', () => {
        let w = watch.create()
        let count = 0

        w.check(RU)

        for (let i = 0; i < 20; i++) if (w.check(EN)) count++

        expect(count, 'смена одна, сколько ни спрашивай').toBe(1)
    })

    it('возврат к прежнему — тоже смена', () => {
        let w = watch.create()

        w.check(RU)
        w.check(EN)

        expect(w.check(RU)).toBe(RU)
    })

    it('пропавший выбор не считается сменой', () => {
        let w = watch.create()

        w.check(RU)
        w.check(EN)

        expect(w.check(null), 'выбор пропал из списка').toBe(null)
        expect(w.check(EN), 'и вернулся — это не новая смена').toBe(null)
    })

    it('дорожки различаются по названию при одном языке', () => {
        let w = watch.create()

        w.check({lang: 'ru', label: 'coldfilm'})

        expect(w.check({lang: 'ru', label: 'hdrezka'})).toEqual({lang: 'ru', label: 'hdrezka'})
    })
})

describe('новый файл', () => {
    it('reset возвращает точку отсчёта', () => {
        let w = watch.create()

        w.check(RU)
        w.check(EN)
        w.reset()

        expect(w.check(RU), 'снова первое наблюдение').toBe(null)
        expect(w.check(EN), 'а это уже решение').toBe(EN)
    })
})

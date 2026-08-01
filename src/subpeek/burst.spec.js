import {describe, expect, it} from 'vitest'
import burst from './burst'

/**
 * Порядок событий взят из keypad: `keydown` уходит в шину до того, как
 * контроллер дёрнет перемотку ([keypad.js:58](src/core/keypad.js:58)), а `keyup`
 * приходит по отпусканию. Само нажатие автомат не интересует, поэтому в помощниках
 * его нет — только перемотка и отпускание.
 */
function tap(b, at) {
    b.tick(at)
    b.up()
}

/** Автоповтор: keypad троттлит его до одного раза в 100 мс, keyup между ними нет */
function hold(b, from, times) {
    for (let i = 0; i < times; i++) b.tick(from + i * 100)

    b.up()
}

describe('одиночные нажатия', () => {
    it('одно нажатие — не удержание', () => {
        let b = burst.create()

        tap(b, 1000)

        expect(b.end()).toEqual({hold: false, ticks: 1})
    })

    it('три нажатия подряд — всё ещё не удержание', () => {
        let b = burst.create()

        tap(b, 1000)
        tap(b, 1300)
        tap(b, 1600)

        expect(b.end()).toEqual({hold: false, ticks: 3})
    })

    // человек может тыкать быстрее автоповтора — решает отпускание, не время
    it('очень быстрые тычки различаются по отпусканию', () => {
        let b = burst.create()

        tap(b, 1000)
        tap(b, 1050)

        expect(b.end().hold).toBe(false)
    })
})

describe('удержание', () => {
    it('автоповтор виден со второго тика', () => {
        let b = burst.create()

        hold(b, 1000, 2)

        expect(b.end().hold).toBe(true)
    })

    it('длинное удержание', () => {
        let b = burst.create()

        hold(b, 1000, 30)

        expect(b.end()).toEqual({hold: true, ticks: 30})
    })

    it('удержание сразу после одиночного помечает всю серию', () => {
        let b = burst.create()

        tap(b, 1000)
        hold(b, 1200, 5)

        expect(b.end().hold, 'серия испорчена удержанием').toBe(true)
    })

    // кнопки панели и мышь не дают keyup вовсе — остаётся только промежуток
    it('без отпускания, но с человеческой паузой — не удержание', () => {
        let b = burst.create()

        b.tick(1000)
        b.tick(1500)

        expect(b.end().hold).toBe(false)
    })
})

describe('границы серий', () => {
    it('следующая серия начинается чистой', () => {
        let b = burst.create()

        hold(b, 1000, 5)
        b.end()

        tap(b, 5000)

        expect(b.end()).toEqual({hold: false, ticks: 1})
    })

    // Ровно тот случай, на котором плагин не сработал на телевизоре: признак
    // автоповтора копился с навигации по меню и не давал вспышке случиться.
    it('чужая навигация до серии на неё не влияет', () => {
        let b = burst.create()

        // ходили по меню, кнопки залипали, отпускание терялось
        b.tick(100)
        b.tick(150)
        b.tick(200)

        expect(b.end().hold, 'это была своя серия').toBe(true)

        tap(b, 9000)

        expect(b.end().hold, 'а перемотка в плеере — уже новая').toBe(false)
    })

    it('reset забывает прошлое', () => {
        let b = burst.create()

        b.tick(1000)
        b.reset()

        tap(b, 1050)

        expect(b.end(), 'после сброса это первый тик').toEqual({hold: false, ticks: 1})
    })
})

import {describe, expect, it} from 'vitest'
import choose from './choose'

/**
 * Дорожки в том виде, в каком их отдаёт нативный плеер webOS: язык
 * трёхбуквенный, название может отсутствовать вовсе, а первой строкой идёт
 * псевдо-«Отключено» с индексом -1.
 */
function sub(index, language, label) {
    return {index: index, language: language, label: label, selected: false}
}

const OFF = {index: -1, title: 'Отключено', selected: true}

const LIST = [OFF, sub(0, 'rus', 'Full'), sub(1, 'eng', 'Full'), sub(2, 'eng', 'SDH')]

describe('показывать нечего', () => {
    it('пустой список', () => {
        expect(choose.choose([], {language: 'ru'})).toBe(null)
    })

    it('только «Отключено» — это не дорожка', () => {
        expect(choose.choose([OFF], {language: 'ru'})).toBe(null)
    })

    it('ни выбора, ни памяти по карточке, ни языка', () => {
        expect(choose.choose(LIST, {})).toBe(null)
    })

    it('источники вообще не переданы', () => {
        expect(choose.choose(LIST)).toBe(null)
    })

    it('язык известен, а дорожки на нём нет', () => {
        expect(choose.choose(LIST, {language: 'fr'})).toBe(null)
    })
})

describe('порядок источников', () => {
    it('выбранное зрителем важнее запомненного', () => {
        let out = choose.choose(LIST, {
            chosen: {lang: 'en', label: 'sdh'},
            remembered: {l: 'ru', n: 'full'},
            language: 'ru'
        })

        expect(out.index, 'английские SDH').toBe(2)
    })

    it('запомненное по карточке важнее общего языка', () => {
        let out = choose.choose(LIST, {remembered: {l: 'en', n: 'full'}, language: 'ru'})

        expect(out.index, 'английские Full').toBe(1)
    })

    it('общий язык — последнее слово', () => {
        let out = choose.choose(LIST, {language: 'en'})

        expect(out.index, 'первая английская').toBe(1)
    })
})

describe('подбор по языку', () => {
    // ровно тот случай, ради которого запасной вариант и заведён: фильм новый,
    // субтитры в нём не открывали, но язык человек когда-то выбирал
    it('русский язык находит русскую дорожку', () => {
        expect(choose.choose(LIST, {language: 'ru'}).index).toBe(0)
    })

    // на webOS языки трёхбуквенные, в браузере двухбуквенные: без приведения
    // запись, сделанная на одном устройстве, не совпала бы с другим
    it('трёхбуквенный код дорожки приводится к двухбуквенному', () => {
        let out = choose.choose([OFF, sub(0, 'jpn', ''), sub(1, 'rus', '')], {language: 'ja'})

        expect(out.index, 'японская').toBe(0)
    })

    it('из нескольких дорожек одного языка берётся первая', () => {
        let out = choose.choose([OFF, sub(0, 'eng', 'Full'), sub(1, 'eng', 'SDH')], {language: 'en'})

        expect(out.index).toBe(0)
    })

    it('дорожка без названия тоже годится', () => {
        let out = choose.choose([OFF, sub(0, 'rus', '')], {language: 'ru'})

        expect(out.index).toBe(0)
    })
})

describe('подбор по запомненному', () => {
    it('название важнее языка: дорожки одного языка различаются', () => {
        let list = [OFF, sub(0, 'eng', 'Full'), sub(1, 'eng', 'SDH')]

        expect(choose.choose(list, {remembered: {l: 'en', n: 'sdh'}}).index).toBe(1)
    })

    it('название изменилось, язык тот же — дорожка всё равно находится', () => {
        let out = choose.choose(LIST, {remembered: {l: 'ru', n: 'полные'}})

        expect(out.index, 'русская').toBe(0)
    })

    it('ничего похожего — лучше не показывать, чем показать чужое', () => {
        let list = [OFF, sub(0, 'eng', 'Full')]

        expect(choose.choose(list, {remembered: {l: 'ru', n: 'полные'}})).toBe(null)
    })
})

import {expect, suite, test} from 'vitest'
import {readCases, verdict} from '../../tools/case.js'
import pick from './pick'

/**
 * Архив раздач: живые выдачи, на которых отбор когда-то ошибался (tools/case.js).
 *
 * Упрощать отбор можно смело — пока здесь зелено, ни один из прошлых случаев
 * не вернулся. Покраснело — `node tools/case.js <имя>` покажет, что отбор
 * выбирает теперь и почему.
 */

const cases = readCases()

suite('Архив раздач', () => {
    test('у каждого случая описана проблема и задано ожидание', () => {
        for (let c of cases) {
            expect(c.problem, c.name).toBeTruthy()
            expect(c.problem, c.name).not.toMatch(/^TODO/)
            expect(Object.keys(c.expect || {}).length, c.name).toBeGreaterThan(0)
        }
    })

    for (let c of cases) {
        test(`${c.name}: ${c.problem}`, () => {
            expect(verdict(pick.pick(c.results, c.ctx), c.expect)).toBeNull()
        })
    }
})

/**
 * Дымовая проверка бандлов — собранных так же, как для Pages.
 *
 * Тесты рядом с исходниками проверяют логику, но не отвечают на вопрос «запустится
 * ли плагин вообще»: сборка могла выбросить нужное, минификация — переименовать
 * глобал, а обращение к Lampa на верхнем уровне модуля — упасть раньше, чем приложение
 * готово. Здесь каждый бандл выполняется в чистом контексте с заглушкой вместо Lampa,
 * как его выполнил бы тег <script> на телевизоре.
 *
 * Заглушка «бездонная»: любое свойство и любой вызов возвращают ещё одну заглушку.
 * Поэтому проверка ничего не знает о том, какие модули Lampa нужны плагину, и не
 * требует правок, когда плагин начинает пользоваться новым.
 */

import vm from 'node:vm'
import {beforeAll, describe, expect, it} from 'vitest'
import {compile, published} from './bundle.js'

function deep() {
    let cache = {}

    // biome-ignore lint/complexity/useArrowFunction: стрелку нельзя вызвать через new, а заглушку — нужно
    return new Proxy(function () {}, {
        get(_target, key) {
            if (key === Symbol.toPrimitive) return () => ''
            // иначе заглушку приняли бы за промис и стали бы ждать её вечно
            if (key === 'then') return undefined
            if (!(key in cache)) cache[key] = deep()

            return cache[key]
        },
        set(_target, key, value) {
            cache[key] = value

            return true
        },
        apply: () => deep(),
        construct: () => deep()
    })
}

/**
 * Контекст, похожий на окно Lampa до и после старта приложения.
 * Хранилище отдаёт значения по умолчанию — как на чистом телевизоре.
 */
function sandbox() {
    let followers = []
    let Lampa = deep()

    Lampa.Listener.follow = (name, callback) => followers.push({name, callback})
    Lampa.Storage.get = (_key, value) => value
    // так ведёт себя настоящая Lampa для незарегистрированного ключа (см. CLAUDE.md)
    Lampa.Storage.field = () => 'undefined'
    Lampa.Lang.translate = (key) => key

    let window = {
        Lampa,
        $: deep(),
        document: deep(),
        navigator: {userAgent: 'Mozilla/5.0 (Web0S; Linux/SmartTV)'},
        location: {href: 'http://localhost/', protocol: 'http:', hostname: 'localhost'},
        localStorage: deep(),
        console: deep(),
        // таймеры не запускаем: проверяется старт, а не жизнь плагина
        setTimeout: deep(),
        clearTimeout: deep(),
        setInterval: deep(),
        clearInterval: deep(),
        XMLHttpRequest: deep(),
        fetch: () => new Promise(() => {})
    }

    window.window = window
    window.self = window

    return {context: vm.createContext(window), window, followers}
}

function load(script, env) {
    script.runInContext(env.context)
}

function ready(env) {
    env.window.appready = true
    for (let f of env.followers) if (f.name === 'app') f.callback({type: 'ready'})
}

describe.each(published())('%s.js', (name) => {
    let script

    // Собираем в память тем же compile, что и для Pages: так проверяется ровно
    // опубликованный код, а чужие файлы (dist/, dev-сервер) не трогаются.
    beforeAll(async () => {
        let out = await compile(name, {pages: true})
        let map = Buffer.from(out.map).toString('base64')

        script = new vm.Script(
            out.code.replace(/\/\/# sourceMappingURL=.*$/m, '') +
                '\n//# sourceMappingURL=data:application/json;base64,' +
                map,
            {filename: name + '.js'}
        )
    })

    it('загружается до готовности приложения и ждёт её', () => {
        let env = sandbox()

        expect(() => load(script, env)).not.toThrow()
        expect(env.window['plugin_' + name + '_ready']).toBeFalsy()
        expect(env.followers.some((f) => f.name === 'app')).toBe(true)
    })

    it('стартует, когда приложение готово', () => {
        let env = sandbox()

        load(script, env)

        expect(() => ready(env)).not.toThrow()
        expect(env.window['plugin_' + name + '_ready']).toBe(true)
    })

    it('стартует сразу, если приложение уже готово, и переживает повторную загрузку', () => {
        let env = sandbox()

        env.window.appready = true

        expect(() => load(script, env)).not.toThrow()
        expect(env.window['plugin_' + name + '_ready']).toBe(true)
        expect(() => load(script, env)).not.toThrow()
    })
})

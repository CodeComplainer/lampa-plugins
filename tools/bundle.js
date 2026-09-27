/**
 * Как из исходника получается бандл — одно место на сборку и тесты.
 *
 * Под какой браузер собирать, записано в `browserslist` в package.json. Его же
 * читает проверка бандлов (`npm run check:compat`), поэтому планка одна.
 */

import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import browserslist from 'browserslist'
import {rolldown} from 'rolldown'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const srcDir = resolve(root, 'src')

/** Браузеры из browserslist в виде, который понимает rolldown: `chrome 79` → `chrome79` */
const target = browserslist(undefined, {path: root}).map((b) => b.replace(' ', ''))

/** Плагины — это папки в src/, кроме общего кода: своего бандла у него нет. */
export function plugins() {
    return readdirSync(srcDir, {withFileTypes: true})
        .filter((e) => e.isDirectory() && e.name !== 'shared')
        .map((e) => e.name)
        .filter((name) => existsSync(join(srcDir, name, name + '.js')))
}

/**
 * Опубликованные плагины: всё, кроме помеченных `local` в plugins.json — там же,
 * где пометку читает менеджер. Своего списка заводить нельзя: разъедутся.
 *
 * Самого manager.js в манифесте намеренно нет, и это не делает его локальным.
 */
export function published() {
    let manifest = JSON.parse(readFileSync(resolve(root, 'plugins.json'), 'utf8'))
    let local = manifest.filter((p) => p.local).map((p) => p.file)

    return plugins().filter((name) => local.indexOf(name + '.js') === -1)
}

/**
 * Собрать плагин.
 *
 * Для Pages — минифицированным и с картой исходников: телевизор качает и
 * разбирает бандл при каждом запуске Lampa, а карта возвращает читаемость
 * инструментам разработчика. Для dev-сервера — читаемым как есть.
 *
 * @param {string} name
 * @param {{pages: boolean}} opts
 * @returns {Promise<{code: string, map: string|null}>}
 */
export async function compile(name, opts) {
    // cwd — корень репозитория: от него считаются пути исходников в карте
    let bundle = await rolldown({
        input: join(srcDir, name, name + '.js'),
        cwd: root,
        transform: {target},
        logLevel: 'silent'
    })

    try {
        let {output} = await bundle.generate({
            format: 'iife',
            file: name + '.js',
            sourcemap: opts.pages,
            minify: opts.pages
        })

        return {code: output[0].code, map: output[1] ? output[1].source : null}
    } finally {
        await bundle.close()
    }
}

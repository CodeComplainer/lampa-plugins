/**
 * Сборка плагинов.
 *
 *   node tools/build.js            — собрать все
 *   node tools/build.js <имя>      — собрать один
 *   node tools/build.js <имя> -w   — пересобирать при изменениях
 *
 * Выходов два, и оба нужны:
 *
 *   ./<имя>.js                              корень репозитория — его раздаёт Pages
 *   $LAMPA_SRC/build/web/plugins/<имя>.js   раздаваемый каталог рабочей копии Lampa
 *
 * Второй — ради проверки в браузере, локального режима менеджера и tv.js --deploy.
 * Рабочей копии Lampa может не быть: тогда второй выход просто пропускается,
 * сборка для Pages от этого не зависит.
 *
 * Плагин с пометкой `local` в plugins.json в корень НЕ пишется: он раздаётся
 * только с машины разработчика и в публичном репозитории ему делать нечего.
 */

import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {babel} from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import chokidar from 'chokidar'
import * as rollup from 'rollup'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = resolve(root, 'src')
const lampa = resolve(process.env.LAMPA_SRC || resolve(root, '..', 'lampa-source'))
const serveDir = resolve(lampa, 'build', 'web', 'plugins')

const args = process.argv.slice(2)
const watch = args.includes('--watch') || args.includes('-w')
const only = args.find((a) => !a.startsWith('-'))

/** Плагины — это папки в src/, кроме общего кода: своего бандла у него нет. */
function plugins() {
    return readdirSync(srcDir, {withFileTypes: true})
        .filter((e) => e.isDirectory() && e.name !== 'shared')
        .map((e) => e.name)
        .filter((name) => existsSync(join(srcDir, name, name + '.js')))
}

/**
 * Пометка `local` живёт в plugins.json — там же, где её читает менеджер.
 * Своего списка заводить нельзя: разъедутся.
 *
 * Самого manager.js в манифесте намеренно нет, и это не делает его локальным.
 */
function isLocal(name) {
    try {
        const manifest = JSON.parse(readFileSync(resolve(root, 'plugins.json'), 'utf8'))
        const entry = manifest.find((p) => p.file === name + '.js')

        return Boolean(entry?.local)
    } catch (e) {
        console.error('[!] не прочитался plugins.json:', e.message)

        return false
    }
}

function put(dir, name, code) {
    mkdirSync(dir, {recursive: true})
    writeFileSync(join(dir, name + '.js'), code)
}

async function build(name) {
    const started = Date.now()
    const input = join(srcDir, name, name + '.js')

    try {
        const bundle = await rollup.rollup({
            input,
            plugins: [
                babel({babelHelpers: 'bundled', presets: ['@babel/preset-env']}),
                commonjs,
                nodeResolve
            ],
            onwarn: () => {}
        })

        const {output} = await bundle.generate({format: 'iife'})

        await bundle.close()

        const code = output[0].code
        const where = []

        if (isLocal(name)) where.push('только локально')
        else {
            put(root, name, code)
            where.push(name + '.js')
        }

        if (existsSync(lampa)) {
            put(serveDir, name, code)
            where.push('dev-сервер')
        }

        console.log(`[ok] ${name} — ${where.join(', ')} (${Date.now() - started} ms, ${code.length} b)`)

        return true
    } catch (e) {
        console.error(`[fail] ${name}:`, e.message)

        return false
    }
}

const list = only ? [only] : plugins()

for (const name of list) {
    if (!existsSync(join(srcDir, name, name + '.js'))) {
        console.error(`Нет исходника: src/${name}/${name}.js`)
        process.exit(1)
    }
}

let ok = true

for (const name of list) {
    if (!(await build(name))) ok = false
}

if (!watch && !ok) process.exit(1)

if (watch) {
    // Общий код в бандл попадает наравне с остальным, поэтому следим и за ним:
    // иначе правка shared/ молча не пересобиралась бы.
    const watched = list.map((name) => join(srcDir, name)).concat(join(srcDir, 'shared'))

    console.log('Слежу за', watched.join(', '))

    let timer

    chokidar.watch(watched, {ignoreInitial: true}).on('all', () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            for (const name of list) build(name)
        }, 300)
    })
}

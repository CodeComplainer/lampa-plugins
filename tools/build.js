/**
 * Сборка плагинов.
 *
 *   node tools/build.js            — собрать все
 *   node tools/build.js <имя>      — собрать один
 *   node tools/build.js <имя> -w   — пересобирать при изменениях
 *
 * Выходов два:
 *
 *   dist/<имя>.js + <имя>.js.map            сайт для Pages, рядом манифест plugins.json
 *   $LAMPA_SRC/build/web/plugins/<имя>.js   раздаваемый каталог рабочей копии Lampa
 *
 * dist/ в git не хранится: на GitHub его собирает и публикует check.yml.
 * Второй выход — ради проверки в браузере, локального режима менеджера и
 * tv.js --deploy. Рабочей копии Lampa может не быть: тогда он просто пропускается.
 *
 * В режиме -w пишется только второй: пересборка нужна, чтобы смотреть правку
 * в браузере, а минифицировать для Pages на каждое сохранение незачем.
 *
 * Плагин с пометкой `local` в plugins.json в dist/ НЕ пишется: он раздаётся
 * только с машины разработчика, и на Pages ему делать нечего.
 */

import {copyFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {join, resolve} from 'node:path'
import chokidar from 'chokidar'
import {compile, plugins, published, root} from './bundle.js'

const site = resolve(root, 'dist')
const lampa = resolve(process.env.LAMPA_SRC || resolve(root, '..', 'lampa-source'))
const serveDir = resolve(lampa, 'build', 'web', 'plugins')

const args = process.argv.slice(2)
const watch = args.includes('--watch') || args.includes('-w')
const only = args.find((a) => !a.startsWith('-'))

function put(dir, file, code) {
    mkdirSync(dir, {recursive: true})
    writeFileSync(join(dir, file), code)
}

async function build(name) {
    const started = Date.now()
    const where = []

    try {
        if (!watch && published().indexOf(name) >= 0) {
            const out = await compile(name, {pages: true})

            put(site, name + '.js', out.code)
            put(site, name + '.js.map', out.map)
            where.push(`dist/${name}.js ${Math.round(out.code.length / 1024)} КБ`)
        }

        if (existsSync(lampa)) {
            put(serveDir, name + '.js', (await compile(name, {pages: false})).code)
            where.push('dev-сервер')
        }

        console.log(`[ok] ${name} — ${where.join(', ') || 'некуда писать'} (${Date.now() - started} ms)`)

        return true
    } catch (e) {
        console.error(`[fail] ${name}:`, e.message)

        return false
    }
}

const list = only ? [only] : plugins()

if (only && plugins().indexOf(only) === -1) {
    console.error(`Нет исходника: src/${only}/${only}.js`)
    process.exit(1)
}

if (!watch) {
    // Манифест раздаётся рядом с плагинами: менеджер читает его с того же сайта.
    mkdirSync(site, {recursive: true})
    copyFileSync(resolve(root, 'plugins.json'), join(site, 'plugins.json'))
}

let ok = true

for (const name of list) {
    if (!(await build(name))) ok = false
}

if (!watch && !ok) process.exit(1)

if (watch) {
    // Общий код в бандл попадает наравне с остальным, поэтому следим и за ним:
    // иначе правка shared/ молча не пересобиралась бы.
    const watched = list.map((name) => join(root, 'src', name)).concat(join(root, 'src', 'shared'))

    console.log('Слежу за', watched.join(', '))

    let timer

    chokidar.watch(watched, {ignoreInitial: true}).on('all', () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            for (const name of list) build(name)
        }, 300)
    })
}

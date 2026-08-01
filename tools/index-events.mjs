// Собирает реестр событий Lampa из исходников.
//
// Зачем: канал события в Lampa — это строка, и узнать, существует ли она и что
// приходит в payload, можно только чтением кода. Реестр собирается из мест
// отправки (`listener.send('канал', {...})`), то есть описывает не намерение,
// а факт: что приложение действительно шлёт.
//
// Разбор идёт по AST через ts-morph, а не регулярками: payload у Lampa бывает
// многострочным, и `type` внутри него — главное, что нужно знать подписчику.
//
// Запуск: npm run index:events

import {execFileSync} from 'node:child_process'
import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {dirname, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {Project, SyntaxKind} from 'ts-morph'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lampa = resolve(process.env.LAMPA_SRC || resolve(root, '..', 'lampa-source'))
const out = resolve(root, '.claude', 'skills', 'lampa-api', 'references', 'events.md')

if (!existsSync(resolve(lampa, 'src', 'app.js'))) {
    console.error(`Не нашёл исходники Lampa в ${lampa}. Путь задаётся переменной LAMPA_SRC.`)
    process.exit(1)
}

const git = (...args) => execFileSync('git', ['-C', lampa, ...args], {encoding: 'utf8'}).trim()

const sha = git('rev-parse', '--short', 'HEAD')
const shaDate = git('log', '-1', '--format=%cs')
const dirty = git('status', '--porcelain', '--', 'src').length > 0

const project = new Project({
    compilerOptions: {allowJs: true},
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true
})

project.addSourceFilesAtPaths(resolve(lampa, 'src', '**', '*.js').replace(/\\/g, '/'))

const files = project.getSourceFiles()
const rel = (p) => relative(lampa, p).replace(/\\/g, '/')

// ts-morph отдаёт пути через прямой слэш, а node.resolve на Windows — через
// обратный. Без приведения к одному виду карта модулей не находит ни одного файла.
const norm = (p) => resolve(p).replace(/\\/g, '/')

// --- карта «файл → имя в window.Lampa» -------------------------------------
//
// Нужна, чтобы понять, на какой шине живёт канал: у Lampa есть глобальная
// Lampa.Listener и своя шина почти у каждого модуля (Player.listener и прочие),
// а в коде модуля она называется просто `listener`.

// «локальное имя импорта → файл» для конкретного файла. Нужно, чтобы понять,
// чья шина в `Video.listener.follow(...)`: имя здесь местное, а модуль чужой.
const importsByFile = new Map()

function importsOf(file) {
    const key = norm(file.getFilePath())

    if (importsByFile.has(key)) return importsByFile.get(key)

    const map = new Map()

    for (const decl of file.getImportDeclarations()) {
        const def = decl.getDefaultImport()

        if (!def) continue

        const spec = decl.getModuleSpecifierValue()

        if (!spec.startsWith('.')) continue

        const base = resolve(dirname(file.getFilePath()), spec)
        const target = [`${base}.js`, resolve(base, 'index.js')].find((p) => existsSync(p))

        if (target) map.set(def.getText(), norm(target))
    }

    importsByFile.set(key, map)

    return map
}

function buildModuleMap() {
    const app = project.getSourceFile((f) => rel(f.getFilePath()) === 'src/app.js')
    const map = new Map()

    if (!app) return map

    const imports = importsOf(app)

    // window.Lampa = { Listener: Subscribe(), Lang, ..., Worker: AppWorker }
    for (const bin of app.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
        if (bin.getLeft().getText() !== 'window.Lampa') continue

        const obj = bin.getRight().asKind(SyntaxKind.ObjectLiteralExpression)

        if (!obj) continue

        for (const prop of obj.getProperties()) {
            let exported
            let local

            if (prop.isKind(SyntaxKind.ShorthandPropertyAssignment)) {
                exported = prop.getName()
                local = exported
            } else if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                exported = prop.getName()
                local = prop.getInitializerOrThrow().getText()
            } else continue

            const file = imports.get(local)

            if (file && !map.has(file)) map.set(file, exported)
        }
    }

    return map
}

const moduleByFile = buildModuleMap()

// --- сбор отправок ----------------------------------------------------------

const literal = (node) =>
    node &&
    (node.isKind(SyntaxKind.StringLiteral) || node.isKind(SyntaxKind.NoSubstitutionTemplateLiteral))
        ? node.getLiteralValue()
        : null

// Шина модуля по файлу, где она объявлена.
const busOfFile = (filePath) => {
    const own = moduleByFile.get(norm(filePath))

    // Модуль, который наружу не отдаётся: адресуем файлом.
    return own ? `Lampa.${own}.listener` : `${rel(filePath)} (не экспортируется)`
}

function busOf(receiver, file) {
    // Шина событий — это Subscribe(). Всё остальное с методом send() (например
    // Socket.send — отправка в websocket) событием не является и в реестр не идёт.
    if (!/(^|\.)listener$/i.test(receiver)) return null

    // Глобальная шина: Lampa.Listener.send(...) или Listener.send(...) в ядре.
    if (/(^|\.)Listener$/.test(receiver)) return 'Lampa.Listener'

    // Полный путь уже назван — Lampa.PlayerVideo.listener.follow(...).
    if (/^Lampa\.[A-Za-z]+\.listener$/.test(receiver)) return receiver

    const owner = receiver.replace(/\.?listener$/i, '')
    const path = file.getFilePath()

    // `listener`, `this.listener`, `_self.listener` — своя шина модуля.
    if (owner === '' || owner === 'this' || owner === '_self' || owner === 'self') return busOfFile(path)

    // `Video.listener` — местное имя чужого импорта. Считать такую шину своей
    // нельзя: подписка из player.js на Video.listener принадлежит PlayerVideo.
    const imported = importsOf(file).get(owner)

    return busOfFile(imported || path)
}

const channels = new Map() // ключ: «шина\0канал»
const follows = new Map() // сколько подписок в ядре на канал

for (const file of files) {
    const path = file.getFilePath()

    for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        const access = call.getExpression().asKind(SyntaxKind.PropertyAccessExpression)

        if (!access) continue

        const method = access.getName()

        if (method !== 'send' && method !== 'follow') continue

        const args = call.getArguments()
        const channel = literal(args[0])

        if (!channel) continue

        const bus = busOf(access.getExpression().getText(), file)

        if (!bus) continue

        // Подписки считаются по шине, а не по имени канала: одинаковые имена
        // на разных шинах — разные события, и складывать их нельзя.
        if (method === 'follow') {
            const at = `${bus}\0${channel}`

            follows.set(at, (follows.get(at) || 0) + 1)
            continue
        }

        const key = `${bus}\0${channel}`

        if (!channels.has(key)) channels.set(key, {bus, channel, variants: new Map()})

        const entry = channels.get(key)
        const payload = args[1]
        const fields = new Set()
        const raw = new Set()
        let type = ''

        if (payload && payload.isKind(SyntaxKind.ObjectLiteralExpression)) {
            for (const prop of payload.getProperties()) {
                if (!prop.isKind(SyntaxKind.PropertyAssignment)) {
                    if (prop.isKind(SyntaxKind.ShorthandPropertyAssignment)) fields.add(prop.getName())
                    continue
                }

                const name = prop.getName()

                fields.add(name)

                // type — фактическое имя события: подписчик почти всегда
                // фильтрует именно по нему, а не по каналу.
                if (name === 'type') type = literal(prop.getInitializerOrThrow()) || ''
            }
        } else if (payload) {
            raw.add(payload.getText().replace(/\s+/g, ' ').slice(0, 60))
        }

        // Поля копятся отдельно по каждому type: у канала `full` их четыре,
        // и набор полей у них разный. Объединение выглядело бы так, будто
        // приходит всё сразу.
        if (!entry.variants.has(type))
            entry.variants.set(type, {fields: new Set(), raw: new Set(), sites: []})

        const variant = entry.variants.get(type)

        for (const f of fields) if (f !== 'type') variant.fields.add(f)
        for (const r of raw) variant.raw.add(r)

        variant.sites.push(`${rel(path)}:${call.getStartLineNumber()}`)
    }
}

// --- вывод ------------------------------------------------------------------
//
// Формат рассчитан на чтение моделью. Главное требование: строка должна пережить
// grep. Поэтому у каждого канала полный путь шины прямо в строке — найдя канал
// поиском, читатель сразу видит, куда подписываться, а не только как называется
// событие. Ради этого мирятся с повторами внутри раздела.

const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100
    const b = a % 10

    if (a > 10 && a < 20) return many
    if (b > 1 && b < 5) return few
    if (b === 1) return one

    return many
}

// «interaction/player/video.js:304, 1381» — путь без src/ остаётся однозначным,
// а голого имени файла не хватает: settings.js и params.js в Lampa не по одному.
function places(sites) {
    const byFile = new Map()

    for (const site of sites) {
        const at = site.lastIndexOf(':')
        const file = site.slice(0, at).replace(/^src\//, '')

        if (!byFile.has(file)) byFile.set(file, [])

        byFile.get(file).push(site.slice(at + 1))
    }

    const parts = [...byFile.entries()].map(([file, lines]) => {
        const shown = lines.slice(0, 4).join(', ')

        return `${file}:${shown}${lines.length > 4 ? ` +${lines.length - 4}` : ''}`
    })

    return parts.slice(0, 3).join(' · ') + (parts.length > 3 ? ` · +${parts.length - 3} файл.` : '')
}

// Порядок разделов: сначала глобальная шина, затем шины доступных из плагина
// модулей, в конце — внутренние, до которых из плагина не дотянуться.
const weight = (bus) => (bus === 'Lampa.Listener' ? 0 : bus.startsWith('Lampa.') ? 1 : 2)

const list = [...channels.values()].sort(
    (a, b) =>
        weight(a.bus) - weight(b.bus) || a.bus.localeCompare(b.bus) || a.channel.localeCompare(b.channel)
)

const buses = [...new Set(list.map((e) => e.bus))]
const sends = list.reduce(
    (n, e) => n + [...e.variants.values()].reduce((m, v) => m + v.sites.length, 0),
    0
)

let md = `# События Lampa

Собрано автоматически: \`npm run index:events\`. **Руками не править — перезапишется.**

Источник — \`lampa-source\` на коммите \`${sha}\` от ${shaDate}${dirty ? ' (в `src/` есть несохранённые правки)' : ''}.
Каналов: ${list.length}, мест отправки: ${sends}, шин: ${buses.length}.

Реестр построен по местам **отправки** (\`.send()\`) — то есть описывает то, что
приложение действительно шлёт, а не то, что задумывалось.

Как читать запись:

\`\`\`
\`Lampa.Шина.listener\` \`канал\`
  e: поле, поле               ← поля объекта, который придёт в обработчик
  2 подписки в ядре · путь/файл.js:304, 1381   ← сколько раз ядро само слушает
\`\`\`                                             и откуда шлётся

Если канал шлётся с разным \`type\`, поля расписаны по каждому отдельно: наборы
у них не совпадают, и объединять их нельзя.

\`\`\`
\`Lampa.Шина.listener\` \`канал\`
  type=первый   e: поле, поле · путь/файл.js:96
  type=второй   e: поле · путь/файл.js:215, 270
  1 подписка в ядре
\`\`\`

- **Шина важнее канала.** \`Lampa.Listener\` и \`Lampa.Player.listener\` — разные шины,
  одноимённых каналов на них может не быть.
- **\`e.type\`** — фактическое имя события: подписчик почти всегда фильтрует по нему,
  а не по каналу: \`Lampa.Listener.follow('app', (e) => { if(e.type === 'ready') … })\`.
- **«подписок в ядре: 0»** — канал существует, но самой Lampa не нужен: как правило,
  он и заведён для внешнего кода.
- Разделы **«не экспортируется»** — внутренние шины, из плагина недоступны.

Это указатель, а не замена исходникам: условия отправки и точный смысл полей —
только в коде, по ссылкам \`файл:строка\` (пути даны от \`src/\`).

## Шины

`

for (const bus of buses) {
    const n = list.filter((e) => e.bus === bus).length

    md += `- \`${bus}\` — ${n} ${plural(n, 'канал', 'канала', 'каналов')}\n`
}

md += '\n'

for (const bus of buses) {
    md += `## ${bus}\n\n`

    for (const e of list.filter((x) => x.bus === bus)) {
        const variants = [...e.variants.entries()].sort(([a], [b]) => a.localeCompare(b))
        const n = follows.get(`${e.bus}\0${e.channel}`) || 0
        const subs = `${n} ${plural(n, 'подписка', 'подписки', 'подписок')} в ядре`

        const payloadOf = (v) =>
            v.fields.size
                ? `e: ${[...v.fields].sort().join(', ')}`
                : v.raw.size
                  ? `e: ${[...v.raw].join(' | ')}`
                  : 'без payload'

        md += `\`${e.bus}\` \`${e.channel}\`\n`

        // Один вариант без type — самый частый случай, разворачивать нечего.
        if (variants.length === 1 && variants[0][0] === '') {
            md += `  ${payloadOf(variants[0][1])}\n`
            md += `  ${subs} · ${places(variants[0][1].sites)}\n\n`
            continue
        }

        const label = (type) => (type ? `type=${type}` : 'без type')
        const width = Math.max(...variants.map(([type]) => label(type).length))

        for (const [type, v] of variants) {
            md += `  ${label(type).padEnd(width)}  ${payloadOf(v)} · ${places(v.sites)}\n`
        }

        md += `  ${subs}\n\n`
    }
}

mkdirSync(dirname(out), {recursive: true})
writeFileSync(out, md)

const outRel = relative(root, out).replace(/\\/g, '/')

console.log(`${outRel} — ${list.length} каналов на ${buses.length} шинах, коммит ${sha}`)


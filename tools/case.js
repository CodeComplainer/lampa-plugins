/**
 * Архив раздач: живые выдачи, на которых отбор continue ошибался.
 *
 * Почти каждая подстройка отбора появилась из-за конкретной раздачи. Пока выдача
 * живёт только в памяти, через полгода уже не проверить, зачем нужно то или иное
 * правило и не сломает ли упрощение старый случай. Поэтому выдача сохраняется
 * целиком, вместе с ожиданием, а тест src/continue/cases.spec.js прогоняет по
 * всему архиву тот отбор, что лежит в исходниках сейчас.
 *
 *   node tools/case.js                        сводка: что выбирает отбор по каждому случаю
 *   node tools/case.js <имя>                  подробно: первые кандидаты с очками и разбором
 *   node tools/case.js add <имя> [файл]       сохранить снимок в архив (без файла — из stdin)
 *
 * Снимок — `window.__continue.last` с телевизора или из браузера: его пишет сам
 * continue при каждом отборе.
 *
 *   node ../lampa-source/tools/tv.js "JSON.stringify(window.__continue.last)" \
 *     | node tools/case.js add moana-sequel
 *
 * При сохранении названия тайтла заменяются вымышленными (как во всех тестах),
 * а ссылки на скачивание выбрасываются: в них бывает личный ключ трекера.
 */

import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const CASES = resolve(root, 'src', 'continue', 'cases')

/** Поля выдачи со ссылками на скачивание: в них бывает личный passkey трекера */
const PRIVATE_FIELDS = ['Link', 'MagnetUri', 'Guid']

/**
 * Заменить названия тайтла во всех строках снимка.
 *
 * Имена берутся из самого отбора (`ctx.names` — карточка, псевдонимы и запрос),
 * поэтому заменяется ровно то, по чему отбор узнаёт «тот ли это тайтл», и
 * проверка после замены работает так же, как до неё.
 */
function anonymize(snapshot) {
    let ctx = snapshot.ctx
    let kind = ctx.is_tv ? 'Series' : 'Movie'
    let names = Array.from(new Set((ctx.names || []).filter((n) => n && n.length > 1)))

    // длинные первыми: иначе «Moana» съела бы часть «Moana 2»
    names.sort((a, b) => b.length - a.length)

    let pairs = names.map((name, i) => ({
        re: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        to: kind + ' ' + String.fromCharCode(65 + i)
    }))

    // Замена повторяет регистр найденного: производные поля вроде ключа раздачи
    // (pick.js → releaseKey) собраны из заголовка в нижнем регистре, и замена
    // в них должна совпасть с тем, что отбор получит из заменённого заголовка.
    let clean = (value) => {
        if (typeof value === 'string') {
            return pairs.reduce(
                (str, p) => str.replace(p.re, (m) => (m === m.toLowerCase() ? p.to.toLowerCase() : p.to)),
                value
            )
        }

        if (Array.isArray(value)) return value.map(clean)

        if (value && typeof value === 'object') {
            let out = {}

            for (let key in value) {
                if (PRIVATE_FIELDS.indexOf(key) === -1) out[key] = clean(value[key])
            }

            return out
        }

        return value
    }

    return clean(snapshot)
}

/**
 * Снимок из вывода tv.js или консоли: берём JSON, даже если вокруг него текст.
 * Вывод бывает и объектом, и строкой с JSON внутри — смотря чем его напечатали.
 */
function extract(text) {
    let from = text.search(/[{"]/)
    let data = null

    try {
        data = JSON.parse(text.slice(from, text.lastIndexOf(text[from] === '{' ? '}' : '"') + 1))

        if (typeof data === 'string') data = JSON.parse(data)
    } catch {
        // сообщение ниже объясняет, что ожидалось
    }

    if (!data?.ctx || !Array.isArray(data.results)) {
        throw new Error('это не снимок отбора: нужны поля ctx и results (window.__continue.last)')
    }

    return data
}

export function readCases() {
    if (!existsSync(CASES)) return []

    return readdirSync(CASES)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) =>
            Object.assign(
                {name: f.replace(/\.json$/, ''), expect: {}},
                JSON.parse(readFileSync(join(CASES, f), 'utf8'))
            )
        )
}

/**
 * Совпал ли итог отбора с ожиданием. Одно место на тест и сводку.
 *
 * Ожидание — любое сочетание полей:
 *   pick   — заголовок раздачи, которая должна быть первой;
 *   avoid  — заголовки, которые первыми быть не должны (когда годится любая другая);
 *   reason — почему не нашлось ничего (pick.js → emptyReason);
 *   ask    — должен ли continue спросить человека, а не выбрать сам.
 *
 * @returns {string|null} что не так, или null
 */
export function verdict(out, expect) {
    let first = out.list[0]?.title ?? null

    if (expect.pick !== undefined && first !== expect.pick) {
        return 'выбрано «' + first + '», ждали «' + expect.pick + '»'
    }

    if (expect.avoid) {
        if (expect.avoid.includes(first)) return 'выбрано «' + first + '», а эту раздачу выбирать нельзя'
    }

    if (expect.reason !== undefined && out.reason !== expect.reason) {
        return 'причина «' + out.reason + '», ждали «' + expect.reason + '»'
    }

    if (expect.ask !== undefined && !out.confident !== expect.ask) {
        return expect.ask ? 'выбрал сам, а должен был спросить' : 'спросил, а должен был выбрать сам'
    }

    return null
}

/**
 * Отбор из исходников, а не из бандла: сверяем то, что сейчас в работе.
 * Исходники импортируют модули без расширений, как принято у сборщиков, а Node
 * так не умеет, — поэтому собираем их тем же rolldown в память.
 */
async function loadPick() {
    // сборщик нужен только сводке, тесту архива его грузить незачем
    let {rolldown} = await import('rolldown')
    let bundle = await rolldown({input: join(root, 'src', 'continue', 'pick.js'), logLevel: 'silent'})
    let {output} = await bundle.generate({format: 'es'})

    await bundle.close()

    let mod = await import('data:text/javascript;base64,' + Buffer.from(output[0].code).toString('base64'))

    return mod.default
}

function summary(pick) {
    let cases = readCases()

    if (!cases.length) {
        console.log('Архив пуст. Сохранить случай: node tools/case.js add <имя> [файл]')

        return 0
    }

    let failed = 0

    for (let c of cases) {
        let out = pick.pick(c.results, c.ctx)
        let bad = verdict(out, c.expect)

        if (bad) failed++

        console.log(`${bad ? '✗' : '✓'} ${c.added}  ${c.name}`)
        console.log(`    ${c.problem || '(описания нет)'}`)
        if (bad) console.log(`    ${bad}`)
    }

    console.log(`\n${cases.length - failed} из ${cases.length} как ожидалось`)

    return failed ? 1 : 0
}

function explain(pick, name) {
    let file = join(CASES, name + '.json')

    if (!existsSync(file)) throw new Error('нет случая ' + name)

    let c = Object.assign({name, expect: {}}, JSON.parse(readFileSync(file, 'utf8')))

    let out = pick.pick(c.results, c.ctx)

    console.log(`${c.name} (${c.added}): ${c.problem || ''}`)
    console.log(`запрос: ${c.query}; ожидание: ${JSON.stringify(c.expect)}`)
    console.log(`ослаблено: ${out.relaxed.join(', ') || 'ничего'}; спросит: ${!out.confident}; ${out.reason}`)
    console.log(`прошли отсечки: ${out.list.length} из ${c.results.length}\n`)

    for (let cand of out.list.slice(0, 8)) {
        let p = cand.parsed

        console.log(`${Math.round(cand.score).toString().padStart(5)}  ${cand.title}`)
        console.log(
            `       ${p.resolution || '?'}p ${p.source || ''} сидеры ${cand.seeders}` +
                (p.voices.length ? ' · ' + p.voices.join(', ') : '') +
                (cand.viewed ? ' · открывали' : '')
        )
    }

    return verdict(out, c.expect) ? 1 : 0
}

function add(name, file) {
    if (!/^[a-z0-9-]+$/.test(name || ''))
        throw new Error('имя случая — латиница, цифры и дефисы: moana-sequel')

    let target = join(CASES, name + '.json')

    if (existsSync(target)) throw new Error('случай уже есть: ' + target)

    let data = {
        added: new Date().toISOString().slice(0, 10),
        problem: 'TODO: что пошло не так, человеческими словами',
        // Пустой pick не совпадёт ни с чем: случай провален, пока ожидание не вписано.
        // Другие виды ожиданий — в verdict.
        expect: {pick: ''},
        ...anonymize(extract(readFileSync(file || 0, 'utf8')))
    }

    mkdirSync(CASES, {recursive: true})
    writeFileSync(target, JSON.stringify(data, null, 2) + '\n')

    console.log(`Сохранено: ${target}`)
    console.log('Осталось вписать problem и expect. Что выбирает отбор сейчас:')
    console.log(`  node tools/case.js ${name}`)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
    let [cmd, ...rest] = process.argv.slice(2)

    try {
        if (cmd === 'add') add(rest[0], rest[1])
        else {
            let pick = await loadPick()

            process.exitCode = cmd ? explain(pick, cmd) : summary(pick)
        }
    } catch (e) {
        console.error('[!]', e.message)
        process.exitCode = 1
    }
}

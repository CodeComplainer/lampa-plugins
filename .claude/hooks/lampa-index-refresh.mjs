// SessionStart: держит реестр событий в соответствии с исходниками Lampa.
//
// Проверка стоит ~20 мс (один git rev-parse), пересборка запускается только когда
// коммит Lampa действительно изменился — то есть редко.

import {existsSync, readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync} from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const lampa = resolve(process.env.LAMPA_SRC || resolve(root, '..', 'lampa-source'))
const index = resolve(root, '.claude', 'skills', 'lampa-api', 'references', 'events.md')

function message(text) {
    process.stdout.write(JSON.stringify({systemMessage: text}))
}

try {
    if (!existsSync(resolve(lampa, 'src', 'app.js'))) process.exit(0)

    const head = execFileSync('git', ['-C', lampa, 'rev-parse', '--short', 'HEAD'], {
        encoding: 'utf8'
    }).trim()

    const built = existsSync(index) ? (readFileSync(index, 'utf8').match(/коммите `([0-9a-f]+)`/) || [])[1] : null

    if (built === head) process.exit(0)

    execFileSync(process.execPath, [resolve(root, 'tools', 'index-events.mjs')], {
        cwd: root,
        encoding: 'utf8'
    })

    message(
        built
            ? `Реестр событий Lampa пересобран: ${built} → ${head}.`
            : `Реестр событий Lampa собран по коммиту ${head}.`
    )
} catch (e) {
    // Молчать нельзя: устаревший индекс выглядит как актуальный.
    message(`Не удалось обновить реестр событий Lampa: ${String(e.message).split('\n')[0]}`)
}

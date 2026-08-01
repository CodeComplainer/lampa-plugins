// PostToolUse: прогоняет Biome по исходнику плагина сразу после правки.

import {readFileSync} from 'node:fs'
import {basename, dirname, extname, resolve, sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const biome = resolve(root, 'node_modules', '@biomejs', 'biome', 'bin', 'biome')

try {
    const input = JSON.parse(readFileSync(0, 'utf8'))
    const file =
        (input.tool_response && input.tool_response.filePath) ||
        (input.tool_input && input.tool_input.file_path) ||
        ''

    if (!file) process.exit(0)

    const full = resolve(file)

    // Только исходники плагинов: бандлы в корне и всё вне src/ Biome не касается.
    if (!full.startsWith(resolve(root, 'src') + sep)) process.exit(0)
    if (extname(full) !== '.js') process.exit(0)
    if (basename(full) === 'voices.js') process.exit(0) // справочные данные, исключены и в biome.json

    // --error-on-warnings: без него Biome выходит с нулём даже когда что-то нашёл,
    // и предупреждения (например, неиспользуемая переменная) прошли бы молча.
    const args = [biome, 'check', '--write', '--error-on-warnings', full]
    const res = spawnSync(process.execPath, args, {encoding: 'utf8'})

    if (res.status === 0) process.exit(0)

    // Что Biome не смог починить сам — возвращаем в контекст, а не прячем.
    const out = ((res.stdout || '') + (res.stderr || '')).trim().slice(0, 4000)

    process.stdout.write(
        JSON.stringify({
            hookSpecificOutput: {
                hookEventName: 'PostToolUse',
                additionalContext: `Biome нашёл в ${basename(full)} то, что не исправляется автоматически:\n${out}`
            }
        })
    )
} catch {
    // Хук не должен ломать работу: непонятный ввод — пропускаем.
    process.exit(0)
}

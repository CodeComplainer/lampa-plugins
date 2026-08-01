// PreToolUse: не даёт править собранные бандлы в корне репозитория.
//
// Файлы в корне (continue.js, memory.js, manager.js) — результат сборки.
// Правка в них исчезает при следующем `node tools/plugin-dev.js <имя>`,
// причём молча: ни ошибки, ни предупреждения не будет.

import {readFileSync} from 'node:fs'
import {dirname, extname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Возвращает текст отказа или пустую строку, если правка законная.
function check() {
    const input = JSON.parse(readFileSync(0, 'utf8'))
    const file = (input.tool_input && input.tool_input.file_path) || ''

    if (!file) return ''

    const full = resolve(file)

    // Бандл — это любой .js прямо в корне: там не лежит ничего, кроме сборок.
    if (dirname(full) !== root || extname(full) !== '.js') return ''

    const name = full.slice(root.length + 1, -3)

    return (
        `${name}.js в корне — собранный бандл, а не исходник. Правка потеряется ` +
        `при следующей сборке.\n` +
        `Исходники: ../lampa-source/plugins/${name}/\n` +
        `Сборка: rm -f build/web/plugins/${name}.js && node tools/plugin-dev.js ${name}\n` +
        `Копирование сюда: cp build/web/plugins/${name}.js ../lampa-plugins/${name}.js`
    )
}

let reason = ''

try {
    reason = check()
} catch {
    // Хук не должен ломать работу: непонятный ввод — пропускаем.
}

// Без process.exit: вывод в конвейер уходит асинхронно и на выходе потерялся бы.
if (reason) {
    process.stdout.write(
        JSON.stringify({
            hookSpecificOutput: {
                hookEventName: 'PreToolUse',
                permissionDecision: 'deny',
                permissionDecisionReason: reason
            }
        })
    )
}

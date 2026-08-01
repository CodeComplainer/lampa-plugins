/**
 * Отладка Lampa на телевизоре с ноутбука.
 *
 * На webOS нет ни консоли, ни отладчика, а половина поведения — нативный плеер,
 * аудиодорожки, скорость отрисовки — в браузере не воспроизводится. Плагин
 * открывает канал к dev-серверу: телевизор сам спрашивает, нет ли для него
 * выражения, выполняет его и возвращает результат. Заодно шлёт консоль.
 *
 * Инициатива у телевизора намеренно: снаружи в него не постучаться, а так
 * работает и через NAT, и без вебсокетов, которых на старых webOS может не быть.
 *
 * Адрес dev-сервера берётся из собственного адреса плагина, ничего настраивать
 * не нужно: подключили `http://<ноутбук>:3000/plugins/devtools.js` — канал есть.
 *
 * ВНИМАНИЕ: плагин выполняет присланный код. Опасен не исходник, а собранный
 * бандл, подключённый с чужого адреса, поэтому:
 *
 * - канал поднимается только на локальный адрес (см. isLocal ниже), с любого
 *   другого молча выключается;
 * - бандл не публикуется. В plugins.json стоит `local: true`, сборка по этой
 *   пометке не кладёт его в корень репозитория, а `/devtools.js` в .gitignore
 *   закрывает и ручное копирование;
 * - `default: false` — сам не ставится, включается переключателем.
 */

/** Адрес dev-сервера — вычисляется из адреса самого плагина */
let HOST = ''

/** Пауза перед повторной попыткой, если сервер недоступен */
const RETRY = 5000

/** Как часто отправляем накопленную консоль */
const FLUSH = 2000

let lines = []
let device = ''

function startPlugin() {
    if (window.plugin_devtools_ready) return

    window.plugin_devtools_ready = true

    HOST = detectHost()

    if (!HOST) return

    // Канал выполняет присланный код, поэтому он обязан быть локальным.
    // Плагин, случайно оставшийся подключённым с внешнего адреса, молча
    // выключается, а не открывает телевизор наружу.
    if (!isLocal(HOST)) {
        console.log('DevTools', 'адрес не локальный, канал выключен:', HOST)

        return
    }

    device = describeDevice()

    captureConsole()

    poll()

    setInterval(flush, FLUSH)

    console.log('DevTools', 'bridge to', HOST)
}

/**
 * Свой адрес — единственный надёжный источник: телевизор не знает, с какой
 * машины его подключили.
 */
function detectHost() {
    let scripts = document.getElementsByTagName('script')

    for (let i = 0; i < scripts.length; i++) {
        let src = scripts[i].src || ''

        if (src.indexOf('devtools.js') === -1) continue

        let match = src.match(/^(https?:\/\/[^/]+)/)

        if (match) return match[1]
    }

    return ''
}

/**
 * Свой ли это адрес: петля, домашняя сеть или mDNS-имя.
 * Всё остальное — интернет, туда нам нельзя.
 */
function isLocal(host) {
    let name = host
        .replace(/^https?:\/\//, '')
        .split(':')[0]
        .toLowerCase()

    if (name === 'localhost' || name.slice(-6) === '.local') return true

    let parts = name.match(/^(\d+)\.(\d+)\.\d+\.\d+$/)

    if (!parts) return false

    let a = parseInt(parts[1], 10)
    let b = parseInt(parts[2], 10)

    if (a === 127 || a === 10) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true

    return false
}

function describeDevice() {
    let platform = window.Lampa && Lampa.Platform ? Lampa.Platform.get() : ''

    return (platform || 'unknown') + ' ' + (navigator.userAgent || '').slice(0, 60)
}

/* ----------------------------------------------------------------- запросы */

/**
 * Запрос держится сервером до появления команды, поэтому опрос не жрёт сеть
 * и при этом отвечает мгновенно.
 */
function poll() {
    post(
        '/__tv/poll',
        {device: device, info: version()},
        (answer) => {
            if (answer && answer.command) execute(answer.command)

            poll()
        },
        () => setTimeout(poll, RETRY)
    )
}

function execute(command) {
    let payload = {id: command.id}

    try {
        payload.result = present(eval(command.code))
    } catch (e) {
        payload.error = (e && e.message) + '\n' + (e && e.stack)
    }

    post('/__tv/result', payload)
}

function flush() {
    if (!lines.length) return

    let sending = lines

    lines = []

    post('/__tv/log', {lines: sending}, null, () => {
        // не потерять при обрыве связи
        lines = sending.concat(lines)
    })
}

function post(path, data, done, fail) {
    let xhr = new XMLHttpRequest()

    try {
        xhr.open('POST', HOST + path, true)
    } catch (e) {
        if (fail) fail()

        return
    }

    xhr.setRequestHeader('Content-Type', 'application/json')

    xhr.onload = () => {
        if (!done) return

        try {
            done(JSON.parse(xhr.responseText || '{}'))
        } catch (e) {
            done({})
        }
    }

    xhr.onerror = () => {
        if (fail) fail()
    }

    xhr.ontimeout = xhr.onerror

    try {
        xhr.send(JSON.stringify(data))
    } catch (e) {
        if (fail) fail()
    }
}

/* ------------------------------------------------------------------ вывод */

/**
 * Результат нужно довезти по сети, поэтому всё, что не переживает JSON,
 * заменяется понятной пометкой: молчаливое `{}` вместо элемента или функции
 * при отладке хуже, чем честное «это элемент».
 */
function present(value) {
    if (value === undefined) return '[undefined]'
    if (value === null) return null

    let type = typeof value

    if (type === 'function') return '[function ' + (value.name || 'anonymous') + ']'
    if (type !== 'object') return value

    if (window.$ && value instanceof window.$)
        return '[jQuery ' + value.length + '] ' + text(value.first ? value.first() : value)

    if (typeof Element !== 'undefined' && value instanceof Element)
        return '[element ' + value.tagName + '] ' + (value.className || '')

    return plain(value, 0)
}

function plain(value, depth, seen) {
    seen = seen || []

    if (value === null || typeof value !== 'object') return value === undefined ? '[undefined]' : value

    if (seen.indexOf(value) >= 0) return '[circular]'
    if (depth > 4) return '[deep]'

    seen = seen.concat([value])

    if (Array.isArray(value)) return value.slice(0, 200).map((item) => plain(item, depth + 1, seen))

    let out = {}

    Object.keys(value)
        .slice(0, 100)
        .forEach((key) => {
            let item = value[key]

            if (typeof item === 'function') return

            out[key] = plain(item, depth + 1, seen)
        })

    return out
}

function text(node) {
    try {
        return (node.text() || '').trim().slice(0, 80)
    } catch (e) {
        return ''
    }
}

function version() {
    if (!window.Lampa || !Lampa.Manifest) return null

    return {app: Lampa.Manifest.app_digital, plugins: pluginFlags()}
}

function pluginFlags() {
    return Object.keys(window)
        .filter((key) => key.indexOf('plugin_') === 0 && key.indexOf('_ready') > 0)
        .join(', ')
}

/* --------------------------------------------------------------- консоль */

function captureConsole() {
    ;['log', 'warn', 'error'].forEach((level) => {
        let original = console[level]

        console[level] = function () {
            record(level, Array.prototype.slice.call(arguments))

            if (original) original.apply(console, arguments)
        }
    })

    window.addEventListener('error', (e) => {
        record('error', [e.message, (e.filename || '') + ':' + e.lineno])
    })

    window.addEventListener('unhandledrejection', (e) => {
        record('error', ['unhandled rejection', (e.reason && e.reason.message) || String(e.reason)])
    })
}

function record(level, args) {
    let stamp = new Date().toISOString().slice(11, 19)

    let message = args
        .map((arg) => {
            if (typeof arg === 'string') return arg

            try {
                return JSON.stringify(plain(arg, 0))
            } catch (e) {
                return String(arg)
            }
        })
        .join(' ')

    lines.push(stamp + ' ' + level + ': ' + message.slice(0, 2000))

    // не копим бесконечно, если сервер недоступен
    if (lines.length > 500) lines = lines.slice(-500)
}

// Запускаемся сразу, не дожидаясь готовности приложения: ошибки старта —
// как раз то, ради чего этот канал и нужен.
startPlugin()

export default {}

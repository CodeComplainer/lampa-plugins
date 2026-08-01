import keys from '../shared/keys'
import Voices from './voices'

/**
 * Студии озвучки: опознание по словарю и рейтинг привычек.
 *
 * Знание принадлежит continue: только он решает, какую раздачу включить, и
 * только ему нужно понимать, что «HDRezka Studio» в названии дорожки и
 * «HDRezka» в заголовке раздачи — одна студия.
 *
 * Словарь один и тот же для заголовков и для названий дорожек: студии
 * подписывают дорожки теми же именами, какими метят раздачи.
 */

/**
 * В словаре Lampa есть языковые и типовые пометки — их нельзя считать студиями.
 * Поймано на живой выдаче: 'Ukr/Eng' превращалось в озвучку «UKR».
 */
const NOT_A_STUDIO = ['ukr', 'eng', 'rus', 'sub', 'dub', 'mvo', 'dvo', 'avo', 'lmo', 'orig']

/** Сколько студий держим в рейтинге и когда включается затухание */
const KEEP = 30
const DECAY_AFTER = 40

/**
 * Студии по словарю. Сортировка по длине нужна, чтобы длинное название
 * находилось раньше короткого, входящего в него как подстрока.
 */
let sorted = null

/**
 * @param {string} text - заголовок раздачи или название дорожки
 * @returns {string[]} найденные студии, самая длинная первой
 */
function detect(text) {
    if (!text) return []

    if (!sorted) {
        sorted = Voices.filter((v) => NOT_A_STUDIO.indexOf(v.toLowerCase()) === -1).sort(
            (a, b) => b.length - a.length
        )
    }

    let lower = (text + '').toLowerCase()
    let found = []

    sorted.forEach((voice) => {
        let name = voice.toLowerCase()

        // короткие названия ищем только как отдельное слово, иначе ловим мусор
        if (name.length <= 4) {
            if (!new RegExp('(^|[^a-zа-яё0-9])' + escapeRegExp(name) + '([^a-zа-яё0-9]|$)', 'i').test(lower))
                return
        } else if (lower.indexOf(name) === -1) return

        // пропускаем студию, если она уже вошла в найденное более длинное название
        if (found.some((f) => f.toLowerCase().indexOf(name) >= 0)) return

        found.push(voice)
    })

    return found
}

/** Первая студия в строке либо null */
function one(text) {
    let found = detect(text)

    return found.length ? found[0] : null
}

/**
 * Подкрутить рейтинг студии.
 *
 * Свидетельства разной силы: запуск раздачи — слабое (её выбрали за сидеров и
 * качество, а студия оказалась какой была), выбор дорожки в плеере — прямое
 * решение. Вес задаёт вызывающий.
 *
 * @param {Object} storage - Lampa.Storage или его подмена в тестах
 * @param {string} name - студия
 * @param {number} weight
 */
function bump(storage, name, weight) {
    if (!name) return

    let rating = storage.get(keys.KEYS.voices, '{}') || {}

    rating[name] = (rating[name] || 0) + weight

    let names = Object.keys(rating)

    // Затухание: свежие предпочтения должны весить больше давних, иначе
    // студия, которую смотрели три года назад, останется лидером навсегда.
    let total = names.reduce((sum, key) => sum + rating[key], 0)

    if (total > DECAY_AFTER) {
        names.forEach((key) => {
            rating[key] = rating[key] / 2

            if (rating[key] < 1) delete rating[key]
        })
    }

    // держим только заметные студии, чтобы ключ не разрастался
    names = Object.keys(rating).sort((a, b) => rating[b] - rating[a])

    if (names.length > KEEP) {
        names.slice(KEEP).forEach((key) => {
            delete rating[key]
        })
    }

    storage.set(keys.KEYS.voices, rating)
}

function escapeRegExp(str) {
    return (str + '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default {detect, one, bump, NOT_A_STUDIO}

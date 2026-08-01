import match from '../shared/match'

/**
 * Какую дорожку субтитров показать на время перемотки назад.
 *
 * Три источника по убыванию точности. Порядок здесь и есть вся суть: каждый
 * следующий знает о человеке меньше предыдущего, и спускаться к нему можно,
 * только когда точный не ответил.
 *
 * @param {Array} subs - список дорожек текущего файла
 * @param {Object} from - что известно о человеке
 * @param {{lang: string, label: string}} [from.chosen] - что включал руками в этом файле
 * @param {{l: string, n: string}} [from.remembered] - что запомнено по этой карточке
 * @param {string} [from.language] - последний язык субтитров вообще
 * @returns {Object|null} дорожка из списка либо null, если показывать нечего
 */
function choose(subs, from) {
    // «Отключено» — псевдострока панели, показывать там нечего
    if (!match.realSubs(subs).length) return null

    let known = from || {}

    // Включал руками прямо сейчас — сомнений нет
    if (known.chosen) return match.matchSub(subs, known.chosen)

    // Запомнено по этой карточке. Неважно, включены ли субтитры сейчас:
    // «какие» и «включены ли» — разные вопросы, и нас интересует первый.
    if (known.remembered) {
        return match.matchSub(subs, {lang: known.remembered.l || '', label: known.remembered.n || ''})
    }

    // Остался только язык — тогда годится любая дорожка на нём. Пустое название
    // в запросе именно это и означает: совпадение по языку достаточно.
    if (!known.language) return null

    return match.matchSub(subs, {lang: known.language, label: ''})
}

export default {choose}

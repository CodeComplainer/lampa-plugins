/**
 * Названия, по которым имеет смысл искать раздачи.
 *
 * Название карточки и трекерное название совпадают далеко не всегда: корейский
 * сериал «Суперчудаки» (원더풀스) лежит на трекерах как «Суперглупцы», и ни одно
 * из двух названий карточки не находит ничего. Поэтому поиск идёт каскадом:
 * привычное название, затем альтернативные из TMDB.
 */

/**
 * Признак `clarification` важнее, чем кажется: без него поиск дополнительно
 * фильтруется по названиям самой карточки ([parser.js:302](src/core/api/sources/parser.js:302)),
 * и чужое название гарантированно даёт пустую выдачу. Проверено на живых
 * данных: «Суперглупцы» без него — 0 раздач, с ним — 4.
 */
function candidates(card, opts) {
    opts = opts || {}

    let out = []
    let seen = {}

    function push(query, clarification) {
        query = clean(query)

        if (!query) return

        let low = query.toLowerCase()

        if (seen[low]) return

        seen[low] = true

        out.push({query: query, clarification: !!clarification})
    }

    // Название, которым раздача нашлась в прошлый раз, — самое надёжное:
    // человек уже смотрел этот тайтл именно по нему.
    push(opts.remembered, true)

    push(primary(card, opts.parse_lang), false)

    push(title(card), false)
    push(original(card), false)

    alternatives(card, opts.lang).forEach((name) => {
        push(name, true)
    })

    return out
}

/**
 * Запрос, который строит штатная кнопка торрентов
 * ([full/start/torrents.js:14](src/components/full/start/torrents.js:14)).
 *
 * Повторяем её точь-в-точь: если человек привык, что обычный список раздач
 * что-то находит, кнопка «Смотреть» обязана находить то же самое.
 */
function primary(card, parse_lang) {
    let lg = title(card)
    let df = original(card)
    let year = yearOf(card)

    let combinations = {
        df: df,
        df_year: df + ' ' + year,
        df_lg: df + ' ' + lg,
        df_lg_year: df + ' ' + lg + ' ' + year,

        lg: lg,
        lg_year: lg + ' ' + year,
        lg_df: lg + ' ' + df,
        lg_df_year: lg + ' ' + df + ' ' + year
    }

    return combinations[parse_lang || 'df'] || df || lg
}

/**
 * Стоит ли запоминать название.
 *
 * То, что и так строится из карточки, хранить незачем: место в памяти
 * ограничено, и занимать его очевидным — значит вытеснять полезное.
 */
function worth(card, query, parse_lang) {
    return !!clean(query) && clean(query) !== primary(card, parse_lang)
}

/**
 * Альтернативные названия из TMDB.
 *
 * Форма ответа зависит от типа: у сериалов это `results`, у фильмов `titles`.
 * Штатный список уточнения читает только `titles`
 * ([filter.js:76](src/interaction/filter.js:76)), поэтому для сериалов он
 * альтернативных названий не показывает вовсе — приходится доставать самим.
 *
 * Свой язык идёт раньше английского: русские раздачи чаще подписаны русским
 * альтернативным названием.
 */
function alternatives(card, lang) {
    let block = card && card.alternative_titles

    if (!block) return []

    let list = block.results || block.titles || []

    let own = []
    let english = []

    list.forEach((item) => {
        let code = ((item.iso_3166_1 || '') + '').toLowerCase()

        if (lang && code === lang) own.push(item.title)
        else if (code === 'us') english.push(item.title)
    })

    return own.concat(english)
}

function title(card) {
    return clean((card && (card.title || card.name)) || '')
}

function original(card) {
    return clean((card && (card.original_title || card.original_name)) || '')
}

function yearOf(card) {
    return (((card && (card.first_air_date || card.release_date)) || '0000') + '').slice(0, 4)
}

function clean(value) {
    return ((value || '') + '').trim()
}

export default {candidates, primary, alternatives, worth}

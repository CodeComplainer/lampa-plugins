import keys from '../shared/keys'
import titles from './titles'

/**
 * Память по тайтлу: как этот сериал или фильм смотрели в прошлый раз.
 *
 * Одна запись на карточку вместо разрозненных ключей — название для поиска,
 * студия, качество и аудиодорожка живут вместе, потому что нужны вместе:
 * запустить «как в прошлый раз» — это все четыре сразу.
 *
 * Хранилище задаётся снаружи, чтобы логику вытеснения можно было проверить
 * тестами без запущенного приложения.
 */

const KEY = keys.KEYS.watch

/**
 * Сколько тайтлов помним.
 *
 * Хранить всё незачем: смысл памяти в том, чтобы человек, вернувшийся
 * к сериалу, попал в привычные настройки. Запись — около сотни байт,
 * так что потолок упирается в разумные ~20 КБ и дальше не растёт.
 */
const LIMIT = 200

/** Сколько запросов на карточку оставляем в штатном списке уточнения */
const CLARIFY_KEEP = 5

/**
 * Ключ — карточка целиком, а не отдельная серия: и озвучку, и название
 * для поиска выбирают на сериал, а не на каждый эпизод.
 */
function cardID(card) {
    if (!card?.id) return null

    let tv = card.number_of_seasons || card.original_name || card.first_air_date

    return card.id + ':' + (tv ? 'tv' : 'movie')
}

/**
 * @param {Object} storage - Lampa.Storage или его подмена в тестах
 */
function create(storage) {
    function all() {
        return storage.cache(KEY, LIMIT, {})
    }

    /**
     * Storage.cache вытесняет по порядку вставки, а не по обращению, поэтому
     * запись перекладывается в конец при каждом использовании — иначе давно
     * заведённый, но активно смотримый сериал вытеснился бы первым.
     */
    function touch(map, key) {
        let keys = Object.keys(map)

        // уже последняя — переписывать хранилище незачем
        if (keys[keys.length - 1] === key) return

        let rec = map[key]

        delete map[key]

        map[key] = rec

        storage.set(KEY, map)
    }

    /**
     * @returns {{q: string, v: string, r: number, a: {l: string, n: string}, t: number}|null}
     *
     * q — название, по которому нашлись раздачи; пустая строка — «ищем по
     *     названию карточки», запомненное прежде оказалось лишним
     * v — студия озвучки
     * r — разрешение
     * h — хеш заголовка запущенной раздачи
     * d — ключ той же раздачи, переживающий её обновление (новые серии)
     * a — аудиодорожка: язык и название
     * t — когда запись трогали в последний раз
     */
    function get(card) {
        let key = cardID(card)

        if (!key) return null

        let map = all()
        let rec = map[key]

        if (!rec) return null

        touch(map, key)

        return rec
    }

    function set(card, patch) {
        let key = cardID(card)

        if (!key || !patch) return null

        let map = all()
        let rec = map[key] || {}

        Object.keys(patch).forEach((name) => {
            if (patch[name] !== undefined && patch[name] !== null) rec[name] = patch[name]
        })

        rec.t = patch.t || Date.now()

        delete map[key]

        map[key] = rec

        storage.set(KEY, map)

        return rec
    }

    /**
     * Поправить свою карточку в штатном списке уточнения.
     *
     * Ключ `user_clarifys` синхронизируется через CUB и читается обычным экраном
     * торрентов ([filter.js:36](src/interaction/filter.js:36)), поэтому рабочее
     * название всплывает первым и на другом устройстве — короче становится и
     * нативный путь, а не только наша кнопка. Свою карточку заодно подрезаем:
     * штатный код дописывает туда запросы вообще без ограничения.
     *
     * @param {Function} edit - (list) => новый список
     */
    function clarifys(card, edit) {
        let all = storage.get('user_clarifys', '{}') || {}
        let list = all[card.id] || []

        all[card.id] = edit(list).slice(-CLARIFY_KEEP)

        storage.set('user_clarifys', all)
    }

    /**
     * Название, по которому нашлась запущенная раздача.
     *
     * Нестандартное запоминаем и ставим последним в штатный список уточнения.
     * Если нашлось по обычному названию карточки, прежнее запомненное стираем —
     * и из списка тоже, — а в `q` пишем пустую строку: «ищем по названию
     * карточки». Иначе устаревшее название стояло бы первым в каждом следующем
     * поиске, хотя человек давно ищет иначе.
     */
    function query(card, value) {
        if (!card?.id || !value) return

        if (titles.worth(card, value, storage.field('parse_lang'))) {
            set(card, {q: value})
            clarifys(card, (list) => list.filter((item) => item !== value).concat(value))

            return
        }

        let rec = get(card)

        if (!rec?.q) return

        let stale = rec.q

        clarifys(card, (list) => list.filter((item) => item !== stale))
        set(card, {q: ''})
    }

    /**
     * По какому названию искать эту карточку, если не по её собственному.
     *
     * Запомненное по факту запуска — первым. Своей записи может не быть: уточнить
     * поиск и уйти, ничего не включив, — обычное дело, а штатный список при этом
     * уже всё запомнил, и не воспользоваться этим значит заставить человека
     * уточнять заново. Пустое `q` — прошлый запуск нашёлся по названию карточки,
     * и старые уточнения тут не к месту.
     *
     * @returns {string|null}
     */
    function searchName(card) {
        if (!card?.id) return null

        let rec = get(card)

        if (rec && typeof rec.q === 'string') return rec.q || null

        let list = storage.get('user_clarifys', '{}')?.[card.id] || []

        return list[list.length - 1] || null
    }

    return {get, set, query, searchName, cardID, KEY, LIMIT}
}

export default {create, cardID, KEY, LIMIT}

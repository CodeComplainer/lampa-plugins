import keys from '../shared/keys'

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
    if (!card || !card.id) return null

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
     * q — название, по которому нашлись раздачи
     * v — студия озвучки
     * r — разрешение
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
     * Продублировать рабочее название в штатный список уточнения.
     *
     * Ключ `user_clarifys` синхронизируется через CUB и читается обычным экраном
     * торрентов ([filter.js:36](src/interaction/filter.js:36)), поэтому название
     * всплывает первым и на другом устройстве — короче становится и нативный путь,
     * а не только наша кнопка.
     *
     * Свою карточку заодно подрезаем: штатный код дописывает туда запросы
     * вообще без ограничения.
     */
    function clarify(card, query, keep) {
        if (!card || !card.id || !query) return

        let all = storage.get('user_clarifys', '{}') || {}
        let list = (all[card.id] || []).filter((item) => item !== query)

        list.push(query)

        all[card.id] = list.slice(-(keep || CLARIFY_KEEP))

        storage.set('user_clarifys', all)
    }

    /**
     * Последнее название, которое человек вводил руками на экране торрентов.
     *
     * Своей записи может не быть: в память название попадает по факту запуска
     * файла, а уточнить поиск и уйти, ничего не включив, — обычное дело.
     * Штатный список при этом уже всё запомнил, и не воспользоваться этим
     * значит заставить человека уточнять поиск заново.
     */
    function lastClarify(card) {
        if (!card || !card.id) return null

        let list = (storage.get('user_clarifys', '{}') || {})[card.id] || []

        return list[list.length - 1] || null
    }

    return {get, set, clarify, lastClarify, cardID, KEY, LIMIT}
}

export default {create, cardID, KEY, LIMIT}

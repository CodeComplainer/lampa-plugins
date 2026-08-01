import keys from '../shared/keys'
import store from '../memory/store'
import titles from '../memory/titles'
import parse from './parse'
import pick from './pick'
import resume from './resume'
import run from './run'
import studio from './studio'
import voice from './voice'

/**
 * «Продолжить» — кнопка на карточке, запускающая нужную серию из торрента
 * без ручного выбора раздачи и файла.
 *
 * Память по тайтлу (название для поиска, студия, качество) общая с плагином
 * memory: делятся данными, но не кодом — каждый работает и без другого.
 */

/** Память по тайтлу, общая с плагином memory */
let memory = null

/**
 * Круговая стрелка с треугольником внутри — «продолжить просмотр».
 * Стиль штатных кнопок: контур currentColor, толщина 2.5, высота 30.
 */
const BUTTON_ICON = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.5 15C26.5 21.3513 21.3513 26.5 15 26.5C8.64873 26.5 3.5 21.3513 3.5 15C3.5 8.64873 8.64873 3.5 15 3.5C18.7014 3.5 21.9946 5.24784 24.1 7.96" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M25.2 2.8V9H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.8 10.7L19.4 15L12.8 19.3V10.7Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
</svg>`

/**
 * Подпись рисуем сами: штатный data-subtitle виден только в выпадающем списке
 * кнопки «Смотреть», а нам нужно показать серию прямо на кнопке.
 */
/**
 * Подпись показывается только при фокусе — иначе кнопка выбивается из ряда,
 * где у остальных видны одни иконки. Штатное название при этом прячется:
 * иначе строка вырастает в «Смотреть · S3E5 · нет раздачи».
 *
 * Недоступность видна без наведения — по приглушённой иконке.
 */
const BUTTON_STYLE = `<style id="continue-style">
    .full-start-new__buttons .full-start__button span.button--continue__hint{
        display: none;
        margin-left: .7em;
        font-size: 1.1em;
        white-space: nowrap;
    }
    .full-start-new__buttons .full-start__button.button--continue.focus span.button--continue__hint,
    .full-start-new__buttons .full-start__button.button--continue.hover span.button--continue__hint{
        display: inline-block !important;
    }
    .full-start-new__buttons .full-start__button.button--continue.has--hint.focus span:not(.button--continue__hint),
    .full-start-new__buttons .full-start__button.button--continue.has--hint.hover span:not(.button--continue__hint){
        display: none !important;
    }
    .full-start-new__buttons .full-start__button.button--continue.is--unavailable svg{
        opacity: .35;
    }
    .full-start-new__buttons .full-start__button.button--continue.is--unavailable.focus svg{
        opacity: .55;
    }
</style>`

/**
 * Веса свидетельств о привычной студии. Запуск раздачи — самое лёгкое: её
 * выбрали за сидеров и качество, а студия оказалась какой была. Дорожку в
 * плеере переключают осознанно, поэтому она весит втрое.
 */
const LAUNCH_WEIGHT = 1
const PICK_WEIGHT = 3

function startPlugin() {
    if (window.plugin_continue_ready) return

    window.plugin_continue_ready = true

    memory = store.create(Lampa.Storage)

    if (!document.getElementById('continue-style')) $('body').append(BUTTON_STYLE)

    Lampa.Listener.follow('full', (e) => {
        if (e.type !== 'complite') return

        try {
            addButton(e)
        } catch (err) {
            console.error('Continue', 'button error:', err)
        }
    })

    // Возврат на карточку с другого экрана
    Lampa.Listener.follow('activity', (e) => {
        if (e.type !== 'start' || e.component !== 'full') return

        refresh(e.object)
    })

    // Закрытие плеера.
    //
    // Одного события активности мало: ни список файлов, ни сам плеер активностями
    // не являются — это Modal поверх карточки. Досмотрев серию и выйдя назад,
    // человек возвращается на ту же самую активность, 'start' не приходит,
    // и подпись продолжает показывать прошлую серию.
    Lampa.Player.listener.follow('destroy', () => {
        let active = Lampa.Activity.active()

        if (active && active.component === 'full') refresh(active)
    })
}

/**
 * Пересчитать подпись у уже нарисованной кнопки.
 */
function refresh(object) {
    try {
        let card = (object && (object.card || object.movie)) || null

        if (card && object.activity) hint(card, object.activity.render())
    } catch (err) {
        console.error('Continue', 'refresh error:', err)
    }
}

/**
 * Кнопка вставляется первой в ряд, чтобы стать и визуально первой,
 * и сфокусированной по умолчанию: Controller берёт первый .selector.
 */
function addButton(e) {
    let card = e.data.movie
    let root = e.object.activity.render()
    let row = root.find('.full-start-new__buttons')

    if (!row.length || row.find('.button--continue').length) return

    let button = $(`<div class="full-start__button selector button--continue" data-subtitle="">
        ${BUTTON_ICON}
        <span>${Lampa.Lang.translate('continue_button')}</span>
    </div>`)

    button.on('hover:enter', () => onEnter(card))

    row.prepend(button)

    hint(card, root)
}

/**
 * Подпись на кнопке: какая серия включится.
 *
 * Ищем кнопку в актуальном DOM, а не держим ссылку: за время запроса за сериями
 * карточка могла перерисоваться, и старый объект остался бы вне документа.
 */
function hint(card, root) {
    describe(card, (decision) => {
        draw(root, resume.label(decision, Lampa.Lang.translate, formatDate))

        probeFresh(card, decision, (available) => {
            // Серия вышла по календарю, но раздачи с ней ещё нет. Приглушаем
            // иконку, чтобы это читалось без наведения, а подпись объясняет
            // причину, когда кнопка в фокусе.
            let where = resume.label(decision, Lampa.Lang.translate, formatDate)

            draw(
                root,
                available
                    ? where
                    : (where ? where + ' · ' : '') + Lampa.Lang.translate('continue_not_yet_released'),
                !available
            )
        })
    })

    function draw(root, text, unavailable) {
        let live = root.find('.button--continue')

        if (!live.length) return

        live.find('.button--continue__hint').remove()
        live.toggleClass('has--hint', !!text)
        live.toggleClass('is--unavailable', !!unavailable)

        if (!text) return

        live.attr('data-subtitle', text)
        live.append(`<span class="button--continue__hint">${text}</span>`)
    }
}

/** Серия считается свежей, пока раздачи могут ещё не появиться */
const FRESH_DAYS = 7

/** Насколько доверяем прошлой проверке */
const PROBE_TTL = 1000 * 60 * 30

/**
 * Фоновая проверка: есть ли вообще раздача с нужной серией.
 *
 * Делается только для свежих серий — у старых раздачи заведомо есть, и гонять
 * поиск при каждом открытии карточки незачем. Результат кешируется, поэтому
 * повторные заходы обходятся без запроса.
 */
function probeFresh(card, decision, done) {
    if (decision.mode !== 'next' && decision.mode !== 'first') return
    if (!decision.episode || !isSeries(card)) return
    if (!decision.air || !isFresh(decision.air)) return

    let key = cardID(card) + ':' + decision.season + ':' + decision.episode
    let cache = Lampa.Storage.cache(keys.KEYS.probe, 100, {})
    let cached = cache[key]

    if (cached && Date.now() - cached.t < PROBE_TTL) return done(cached.ok)

    search(
        card,
        (results, query) => {
            let out = pick.pick(
                results,
                pick.context(card, cardFilter(card), {
                    season: decision.season,
                    episode: decision.episode,
                    no_cam: Lampa.Storage.field(keys.KEYS.no_cam) !== false,
                    aliases: aliases(card, query)
                })
            )

            let ok = out.list.length > 0

            remember(key, ok)

            done(ok)
        },
        () => {}
    )

    function remember(key, ok) {
        let all = Lampa.Storage.cache(keys.KEYS.probe, 100, {})

        delete all[key]

        all[key] = {ok: ok, t: Date.now()}

        Lampa.Storage.set(keys.KEYS.probe, all)
    }
}

function isFresh(air) {
    let time = new Date(air).getTime()

    if (Number.isNaN(time)) return false

    return Date.now() - time < FRESH_DAYS * 24 * 60 * 60 * 1000
}

/**
 * Что произойдёт по нажатию. Нужно и для подписи, и для самого запуска.
 */
function describe(card, done) {
    if (!isSeries(card)) {
        return done(resume.decideMovie(Lampa.Timeline.view(Lampa.Utils.hash(card.original_title))))
    }

    episodes(card, (list) => {
        let decision = resume.decideSeries(
            list,
            (season, episode) => {
                return Lampa.Timeline.watchedEpisode(card, season, episode, true)
            },
            {next: card.next_episode_to_air}
        )

        // дата выхода целевой серии нужна, чтобы понять, свежая ли она
        if (!decision.air && decision.episode) {
            let target = list.find(
                (ep) => ep.season_number === decision.season && ep.episode_number === decision.episode
            )

            if (target) decision.air = target.air_date || null
        }

        done(decision)
    })
}

/** Дата в том же виде, в каком её показывает сама карточка */
function formatDate(air) {
    try {
        return Lampa.Utils.parseTime(air).short
    } catch {
        return air
    }
}

function isSeries(card) {
    return !!(card.number_of_seasons || card.original_name || card.first_air_date)
}

/**
 * Вышедшие серии по порядку. Невышедшие отбрасываем: предлагать серию,
 * которой ещё нет, бессмысленно.
 */
function episodes(card, done) {
    let numbers = []

    for (let i = 1; i <= (card.number_of_seasons || 1); i++) numbers.push(i)

    Lampa.Api.seasons(card, numbers, (data) => {
        let out = []
        let now = Date.now()

        numbers.forEach((number) => {
            let season = data[number]

            if (!season || !season.episodes) return

            season.episodes.forEach((ep) => {
                let air = ep.air_date ? new Date(ep.air_date).getTime() : 0

                if (air && air > now) return

                out.push({
                    season_number: ep.season_number || number,
                    episode_number: ep.episode_number,
                    air_date: ep.air_date || null
                })
            })
        })

        done(out)
    })
}

/**
 * Нажатие: решаем что смотреть, ищем раздачу, запускаем.
 */
function onEnter(card) {
    if (!Lampa.Storage.field('parser_use')) return notice('continue_error_noparser')

    Lampa.Loading.start(() => {
        Lampa.Loading.stop()
    })

    describe(card, (decision) => {
        // Смотреть нечего: либо ждём новую серию, либо сериал кончился.
        // Искать раздачи в обоих случаях бессмысленно.
        if (decision.mode === 'waiting' || decision.mode === 'restart') {
            Lampa.Loading.stop()

            return finished(card, decision)
        }

        play(card, decision)
    })
}

/**
 * Найти раздачу под нужную серию и запустить.
 */
function play(card, decision) {
    Lampa.Loading.start(() => Lampa.Loading.stop())

    search(
        card,
        (results, query) => {
            let filter = cardFilter(card)
            let params = {
                season: decision.season,
                episode: decision.episode,
                no_cam: Lampa.Storage.field(keys.KEYS.no_cam) !== false,
                last: lastRelease(card),
                voice_rating: voiceRating(),
                aliases: aliases(card, query)
            }

            let out = pick.pick(results, pick.context(card, filter, params))

            Lampa.Loading.stop()

            if (!out.list.length) return nothingFound(card, out)

            if (needAsk(card, out)) return choose(card, out, decision, query)

            launch(card, out.list[0], decision, query)
        },
        () => {
            Lampa.Loading.stop()

            notice('continue_error_search')
        }
    )
}

/** Сколько названий пробуем, прежде чем признать, что раздач нет */
const MAX_QUERIES = 5

/**
 * Все названия, под которыми тайтл может встретиться в заголовке раздачи.
 *
 * Нужны отбору: проверка «тот ли это тайтл» ищет название карточки в заголовке,
 * а раздачу мы могли найти по совсем другому названию.
 */
function aliases(card, query) {
    return [query].concat(titles.alternatives(card, Lampa.Storage.field('language'))).filter(Boolean)
}

/**
 * Поиск раздач.
 *
 * Первым идёт запрос штатной кнопки торрентов — чтобы привычная выдача
 * оставалась привычной. Если он пуст, перебираем остальные названия тайтла:
 * трекерное название совпадает с названием карточки далеко не всегда, и без
 * перебора кнопка на таких сериалах просто мертва.
 *
 * @param {Function} done - (results, query) — по какому названию нашлось
 */
function search(card, done, fail) {
    let rec = memory.get(card)

    let list = titles
        .candidates(card, {
            remembered: rec && rec.q,
            parse_lang: Lampa.Storage.field('parse_lang'),
            lang: Lampa.Storage.field('language')
        })
        .slice(0, MAX_QUERIES)

    let title = card.title || card.name
    let original = card.original_title || card.original_name
    let index = 0

    next()

    function next() {
        if (index >= list.length) return done([], null)

        let candidate = list[index++]

        Lampa.Parser.get(
            {
                movie: card,
                search: candidate.query,
                search_one: title,
                search_two: original,
                clarification: candidate.clarification,
                page: 1
            },
            (data) => {
                let results = (data && data.Results) || []

                if (results.length) return done(results, candidate.query)

                next()
            },
            // Не «названия не подошли», а поиск недоступен — перебор бессмыслен.
            fail
        )
    }
}

/**
 * Спрашивать ли пользователя.
 *
 * Смысл кнопки в том, чтобы не спрашивать. Вопрос уместен ровно в двух случаях:
 * пришлось нарушить заданные фильтры, либо это первое знакомство с тайтлом
 * и вариантов озвучки действительно несколько.
 */
function needAsk(card, out) {
    if (!out.confident) return true

    // продолжаем ту же раздачу, из которой смотрели прошлую серию
    if (out.continues) return false

    // уже запускали этот тайтл — предпочтение известно
    if (lastRelease(card)) return false

    return out.voices.length > 1
}

/** Ключ карточки, общий для фильтров и нашего хранилища */
function cardID(card) {
    return card.id + ':' + (isSeries(card) ? 'tv' : 'movie')
}

/**
 * Чем смотрели прошлый раз: студия и качество.
 *
 * Нужно на случай, когда прежней раздачи в выдаче уже нет — тогда берём
 * максимально похожую, а не начинаем выбор заново.
 */
function lastRelease(card) {
    let rec = memory.get(card)

    if (!rec) return null

    return {
        voice: voice.prefer(rec, Lampa.Storage.field('parse_lang')),
        resolution: rec.r || null,
        hash: rec.h || null
    }
}

/**
 * Пометить раздачу как открытую — тем же способом, что и штатный экран торрентов.
 *
 * Метку ставит сам компонент торрентов при запуске файла, но мы запускаем в обход
 * него, поэтому раздача оставалась непомеченной: следующая серия не опознавалась
 * как продолжение, и плагин каждый раз спрашивал заново. Заодно раздача получает
 * привычную галочку в обычном списке.
 */
function markViewed(cand) {
    let viewed = Lampa.Storage.cache('torrents_view', 5000, [])
    let hash = cand.raw.hash || Lampa.Utils.hash(cand.title)

    if (viewed.indexOf(hash) >= 0) return

    viewed.push(hash)

    Lampa.Storage.set('torrents_view', viewed)
}

/**
 * Чем и по какому названию смотрели — в общую память тайтла.
 *
 * Название сохраняем только нестандартное: обычное и так строится из карточки,
 * и занимать им место значит вытеснять что-то полезное.
 */
function rememberRelease(card, cand, query) {
    memory.set(card, {
        v: cand.parsed.voices[0] || null,
        r: cand.parsed.resolution || null,
        // Сама раздача, а не приметы. Штатная пометка «открывали» общая на все
        // тайтлы и без порядка, так что «ту самую» помним сами.
        h: cand.raw.hash || null
    })

    if (titles.worth(card, query, Lampa.Storage.field('parse_lang'))) {
        memory.set(card, {q: query})
        memory.clarify(card, query)
    }

    countVoice(cand)
}

/**
 * Рейтинг студий по всем просмотренным тайтлам.
 *
 * Нужен для первого запуска незнакомого сериала: предпочтение по нему ещё
 * не задано, но привычная студия обычно та же, что и в остальных.
 */
function countVoice(cand) {
    studio.bump(Lampa.Storage, cand.parsed.voices[0], LAUNCH_WEIGHT)
}

/**
 * Привычные студии: запуски раздач плюс дорожки, которые человек выбирал сам.
 *
 * Второе весомее: раздачу выбирают за сидеров и качество, а студия там
 * оказывается какой была, — тогда как дорожку в плеере переключают осознанно.
 *
 * Считается при чтении, а не копится отдельным ключом. Выбор дорожки наблюдает
 * memory и кладёт в свою запись по карточке; толковать название и решать, что
 * из этого следует, — работа continue. Так ни один плагин не пишет ради
 * другого: нет memory — останутся одни запуски, и подбор просто станет грубее.
 *
 * Про вес без иллюзий: отбор смотрит только на присутствие студии в этой карте
 * ([pick.js](pick.js): `if (ctx.voice_rating[v]) s += 80`), а не на величину.
 * Вес важен для сохраняемого счётчика запусков — он решает, кто переживёт
 * затухание и обрезку до тридцати, — а здесь, в разовой карте, ни на что не
 * влияет и стоит только ради единообразия.
 */
function voiceRating() {
    let rating = Object.assign({}, Lampa.Storage.get(keys.KEYS.voices, '{}') || {})
    let watched = Lampa.Storage.cache(store.KEY, store.LIMIT, {})

    Object.keys(watched).forEach((key) => {
        let track = watched[key] && watched[key].a
        let name = track && studio.one(track.n)

        if (name) rating[name] = (rating[name] || 0) + PICK_WEIGHT
    })

    return rating
}

/**
 * Фильтры именно этой карточки — те же, что показывает штатный экран торрентов.
 */
function cardFilter(card) {
    let all = Lampa.Storage.cache('torrents_filter_data', 500, {})
    let cid = card.id + ':' + (isSeries(card) ? 'tv' : 'movie')

    return all[cid] || Lampa.Storage.get('torrents_filter', '{}') || {}
}

/**
 * Всё просмотрено.
 *
 * Завершённый сериал и фильм ведут себя как в стримингах — сразу запускают
 * с начала. Для выходящего сериала это неуместно: человек ждёт новую серию,
 * а не первую, поэтому предлагаем выбор и говорим, когда примерно ждать.
 */
function finished(card, decision) {
    if (decision.mode === 'restart') return restart(card)

    let title = decision.air
        ? Lampa.Lang.translate('continue_after') + ' ' + formatDate(decision.air)
        : Lampa.Lang.translate('continue_waiting')

    let subtitle =
        decision.season && decision.episode
            ? 'S' +
              decision.season +
              ' · ' +
              Lampa.Lang.translate('continue_episode') +
              ' ' +
              decision.episode
            : ''

    Lampa.Select.show({
        title: Lampa.Lang.translate('continue_button'),
        items: [
            {title: title, subtitle: subtitle, wait: true},
            {title: Lampa.Lang.translate('continue_rewatch_last'), rewatch: true},
            {title: Lampa.Lang.translate('continue_from_start'), restart: true},
            {title: Lampa.Lang.translate('continue_open_torrents'), open_torrents: true}
        ],
        onSelect: (item) => {
            Lampa.Controller.toggle('full_start')

            if (item.open_torrents) return openTorrents(card)
            if (item.restart) return restart(card)
            if (item.rewatch) return rewatchLast(card)
            // «ждём новую серию» — просто закрываем, действий нет
        },
        onBack: () => Lampa.Controller.toggle('full_start')
    })
}

/** Смотреть сначала: первая серия первого сезона, для фильма — он сам */
function restart(card) {
    let target = isSeries(card)
        ? {mode: 'first', season: 1, episode: 1, percent: 0}
        : {mode: 'first', season: null, episode: null, percent: 0}

    play(card, target)
}

/** Пересмотреть последнюю серию, на которой остановились */
function rewatchLast(card) {
    describe(card, (decision) => {
        play(card, {
            mode: 'first',
            season: decision.season,
            episode: decision.episode,
            percent: 0
        })
    })
}

/**
 * Ничего не подошло. Молчать нельзя — объясняем причину и даём выход
 * на обычный список раздач.
 */
function nothingFound(card, out) {
    let keys = {
        only_cam: 'continue_only_cam',
        no_episode_yet: 'continue_no_episode_yet'
    }

    let text = Lampa.Lang.translate(keys[out.reason] || 'continue_not_found')

    Lampa.Select.show({
        title: Lampa.Lang.translate('continue_button'),
        items: [
            {title: text, subtitle: Lampa.Lang.translate('continue_open_torrents'), open_torrents: true},
            {title: Lampa.Lang.translate('continue_cancel')}
        ],
        onSelect: (item) => {
            Lampa.Controller.toggle('full_start')

            if (item.open_torrents) openTorrents(card)
        },
        onBack: () => Lampa.Controller.toggle('full_start')
    })
}

/**
 * Уверенности нет — короткий список лучших вариантов.
 * Пять строк на пульте пролистываются быстрее, чем сотня раздач с фильтрами.
 */
function choose(card, out, decision, query) {
    let top = out.list.slice(0, 5)

    let items = top.map((cand) => ({
        title: candidateTitle(cand),
        subtitle: candidateSubtitle(cand),
        cand: cand
    }))

    // Одинаковые заголовки выбирать невозможно — различаем их трекером
    items.forEach((item, i) => {
        let same = items.some((other, j) => j !== i && other.title === item.title)

        if (same && top[i].raw.Tracker) item.subtitle = top[i].raw.Tracker + ' · ' + item.subtitle
    })

    items.push({title: Lampa.Lang.translate('continue_open_torrents'), open_torrents: true})

    Lampa.Select.show({
        title: Lampa.Lang.translate('continue_choose'),
        items: items,
        onSelect: (item) => {
            Lampa.Controller.toggle('full_start')

            if (item.open_torrents) return openTorrents(card)

            rememberVoice(card, item.cand)

            launch(card, item.cand, decision, query)
        },
        onBack: () => Lampa.Controller.toggle('full_start')
    })
}

function quality(cand) {
    let res = cand.parsed.resolution

    let name = res === 2160 ? '4K' : res ? res + 'p' : Lampa.Lang.translate('continue_quality_unknown')

    if (cand.parsed.hdr) name += ' HDR'
    if (cand.parsed.dv) name += ' DV'

    return name
}

/** Человекочитаемые названия источников */
const SOURCE_NAMES = {
    bluray: 'Blu-ray',
    webdl: 'WEB-DL',
    bdrip: 'BDRip',
    webrip: 'WEBRip',
    webdlrip: 'WEB-DLRip',
    hdrip: 'HDRip',
    hdtv: 'HDTV',
    dvdrip: 'DVDRip',
    dvd: 'DVD',
    cam: 'CAMRip',
    ts: 'TS',
    tc: 'TC',
    screener: 'Screener'
}

/**
 * Заголовок строки: качество и озвучка — то, по чему реально выбирают.
 * Если студий в названии нет, показываем язык или источник, иначе строки
 * получаются одинаковыми и выбирать не из чего.
 */
function candidateTitle(cand) {
    let parts = [quality(cand)]
    let voices = cand.parsed.voices

    if (voices.length) parts.push(voices.slice(0, 3).join(', '))
    else {
        let langs = cand.parsed.langs.map((l) => Lampa.Lang.translate('continue_lang_' + l)).filter(Boolean)

        if (langs.length) parts.push(langs.join(', '))
        else if (SOURCE_NAMES[cand.parsed.source]) parts.push(SOURCE_NAMES[cand.parsed.source])
    }

    return parts.join(' · ')
}

/**
 * Подзаголовок: скорость, размер, источник и предупреждения.
 */
function candidateSubtitle(cand) {
    let parts = [Lampa.Lang.translate('continue_seeds') + ': ' + cand.seeders]

    if (cand.raw.size) parts.push(cand.raw.size)

    // источник дублируем в подзаголовок, только если он не ушёл в заголовок
    if (cand.parsed.voices.length && SOURCE_NAMES[cand.parsed.source])
        parts.push(SOURCE_NAMES[cand.parsed.source])

    if (cand.viewed) parts.push(Lampa.Lang.translate('continue_seen'))

    return parts.join(' · ')
}

/**
 * Выбор пользователя сохраняем в тот же фильтр карточки, которым пользуется
 * штатный экран: тогда плагин и обычный список не расходятся, а выбор
 * уезжает в облако вместе с остальными настройками.
 */
function rememberVoice(card, cand) {
    if (!cand.parsed.voices.length) return

    let all = Lampa.Storage.cache('torrents_filter_data', 500, {})
    let cid = card.id + ':' + (isSeries(card) ? 'tv' : 'movie')

    let filter = all[cid] || {}

    filter.voice = [cand.parsed.voices[0]]

    delete all[cid]

    all[cid] = filter

    Lampa.Storage.set('torrents_filter_data', all)
}

function launch(card, cand, decision, query) {
    rememberRelease(card, cand, query)

    let want =
        decision.season && decision.episode ? {season: decision.season, episode: decision.episode} : null

    run.run(cand, card, want, {
        onStart: () => markViewed(cand),
        onError: (reason) => {
            let keys = {
                no_server: 'continue_error_noserver',
                no_episode: 'continue_error_noepisode',
                no_file: 'continue_error_nofile',
                timeout: 'continue_error_timeout'
            }

            notice(keys[reason] || 'continue_not_found')
        }
    })
}

function openTorrents(card) {
    Lampa.Activity.push({
        url: '',
        title: Lampa.Lang.translate('title_torrents'),
        component: 'torrents',
        search: card.title || card.name,
        search_one: card.title || card.name,
        search_two: card.original_title || card.original_name,
        movie: card,
        page: 1
    })
}

function notice(key) {
    Lampa.Noty.show(Lampa.Lang.translate(key))
}

Lampa.Lang.add({
    continue_button: {
        ru: 'Смотреть',
        en: 'Watch',
        uk: 'Дивитися'
    },
    continue_episode: {
        ru: 'серия',
        en: 'episode',
        uk: 'серія'
    },
    continue_choose: {
        ru: 'Выберите раздачу',
        en: 'Choose a release',
        uk: 'Оберіть роздачу'
    },
    continue_not_found: {
        ru: 'Подходящих раздач не найдено',
        en: 'No suitable releases found',
        uk: 'Відповідних роздач не знайдено'
    },
    continue_only_cam: {
        ru: 'Есть только экранки',
        en: 'Only cam rips available',
        uk: 'Є лише екранки'
    },
    continue_open_torrents: {
        ru: 'Открыть список раздач',
        en: 'Open torrent list',
        uk: 'Відкрити список роздач'
    },
    continue_cancel: {
        ru: 'Отмена',
        en: 'Cancel',
        uk: 'Скасувати'
    },
    continue_seeds: {
        ru: 'Раздают',
        en: 'Seeds',
        uk: 'Роздають'
    },
    continue_quality_unknown: {
        ru: 'Качество не указано',
        en: 'Quality unknown',
        uk: 'Якість не вказана'
    },
    continue_seen: {
        ru: 'уже смотрели',
        en: 'watched before',
        uk: 'вже дивилися'
    },
    continue_not_yet_released: {
        ru: 'нет раздачи',
        en: 'no release',
        uk: 'немає роздачі'
    },
    continue_no_episode_yet: {
        ru: 'Этой серии пока нет в раздачах',
        en: 'This episode is not in any release yet',
        uk: 'Цієї серії ще немає в роздачах'
    },
    continue_lang_ru: {
        ru: 'Русский',
        en: 'Russian',
        uk: 'Російська'
    },
    continue_lang_uk: {
        ru: 'Украинский',
        en: 'Ukrainian',
        uk: 'Українська'
    },
    continue_lang_en: {
        ru: 'Английский',
        en: 'English',
        uk: 'Англійська'
    },
    continue_after: {
        ru: 'Новая серия после',
        en: 'New episode after',
        uk: 'Нова серія після'
    },
    continue_waiting: {
        ru: 'Ждём новую серию',
        en: 'Waiting for a new episode',
        uk: 'Чекаємо на нову серію'
    },
    continue_from_start: {
        ru: 'Смотреть сначала',
        en: 'Watch from the start',
        uk: 'Дивитися спочатку'
    },
    continue_rewatch_last: {
        ru: 'Пересмотреть последнюю серию',
        en: 'Rewatch the last episode',
        uk: 'Переглянути останню серію'
    },
    continue_error_noserver: {
        ru: 'Не настроен TorrServer',
        en: 'TorrServer is not configured',
        uk: 'Не налаштовано TorrServer'
    },
    continue_error_noparser: {
        ru: 'Не включён поиск торрентов',
        en: 'Torrent search is disabled',
        uk: 'Не увімкнено пошук торентів'
    },
    continue_error_search: {
        ru: 'Поиск раздач не отвечает',
        en: 'Torrent search failed',
        uk: 'Пошук роздач не відповідає'
    },
    continue_error_noepisode: {
        ru: 'В раздаче нет нужной серии, выберите файл вручную',
        en: 'The release has no such episode, pick a file manually',
        uk: 'У роздачі немає потрібної серії, оберіть файл вручну'
    },
    continue_error_nofile: {
        ru: 'В раздаче не нашлось видеофайла',
        en: 'No video file in the release',
        uk: 'У роздачі не знайдено відеофайл'
    },
    continue_error_timeout: {
        ru: 'Раздача не отвечает, попробуйте другую',
        en: 'The release is not responding, try another',
        uk: 'Роздача не відповідає, спробуйте іншу'
    }
})

if (window.appready) startPlugin()
else {
    Lampa.Listener.follow('app', (e) => {
        if (e.type === 'ready') startPlugin()
    })
}

// доступ для отладки: позволяет прогонять парсер и отбор на живой выдаче из консоли
window.__continue = {parse, pick, resume, run}

export default {parse, pick, resume, run}

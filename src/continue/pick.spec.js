import pick from './pick'

import {expect, suite, test} from 'vitest'

/**
 * Названия вымышленные. Проверяются ситуации, найденные на живой выдаче:
 * чужие фильмы-тёзки, чужие сезоны в топе по сидерам, мёртвые 4K-раздачи,
 * экранки с большим числом раздающих.
 */

/** Заготовка результата поиска в том виде, в каком его отдаёт Lampa.Parser */
function row(title, seeders, extra) {
    return Object.assign(
        {
            Title: title,
            Seeders: seeders,
            Size: 1073741824,
            viewed: false
        },
        extra || {}
    )
}

const SERIES = {
    id: 1,
    name: 'Название',
    original_name: 'Series Name',
    number_of_seasons: 3,
    first_air_date: '2023-05-04'
}

const MOVIE = {
    id: 2,
    title: 'Фильм',
    original_title: 'Movie Name',
    release_date: '2026-01-15'
}

/**
 * «Та же раздача, где смотрели прошлую серию» — первый приоритет по замыслу,
 * но опознавалась она косвенно, по совпадению студии и качества. Штатная
 * пометка «открывали» общая на все тайтлы и без порядка, так что саму раздачу
 * плагин помнит сам, по хешу из выдачи парсера.
 */
suite('Та самая раздача', () => {
    const SEEN = {season: 2, episode: 5, last: {hash: 'abc123', voice: 'LostFilm', resolution: 1080}}

    test('запомненная раздача побеждает более качественную чужую', () => {
        let results = [
            row('Series Name S02 2160p WEB-DL', 300, {hash: 'other'}),
            row('Series Name S02E01-10 1080p WEB-DL', 5, {hash: 'abc123'})
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, SEEN))

        expect(out.list[0].raw.hash, 'первой идёт своя').toBe('abc123')
        expect(out.continues, 'продолжение, спрашивать не о чем').toBe(true)
        expect(out.confident).toBe(true)
    })

    test('нужной серии в ней нет — продолжением не считается', () => {
        let results = [
            row('Series Name S02E01-03 1080p WEB-DL', 50, {hash: 'abc123'}),
            row('Series Name S02E01-10 1080p WEB-DL', 50, {hash: 'other'})
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, SEEN))

        expect(out.continues, 'серии 5 в ней нет').toBe(false)
    })

    test('раздача пропала из выдачи — работает обычный подбор', () => {
        let results = [row('Series Name S02E01-10 1080p WEB-DL', 50, {hash: 'gone'})]

        let out = pick.pick(results, pick.context(SERIES, {}, SEEN))

        expect(out.list.length, 'кандидат всё равно есть').toBe(1)
        expect(out.list[0].raw.hash).toBe('gone')
    })

    // не все трекеры отдают hash — тогда сравнивать нечего
    test('без хеша в выдаче ничего не ломается', () => {
        let results = [row('Series Name S02E01-10 1080p WEB-DL', 50)]

        let out = pick.pick(results, pick.context(SERIES, {}, SEEN))

        expect(out.list.length).toBe(1)
        expect(out.continues, 'опознать нечем').toBe(false)
    })

    test('хеша не запоминали — прежнее поведение по пометке «открывали»', () => {
        let results = [
            row('Series Name S02E01-10 1080p WEB-DL', 50, {hash: 'a', viewed: true}),
            row('Series Name S02E01-10 2160p WEB-DL', 90, {hash: 'b'})
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 2, episode: 5}))

        expect(out.continues, 'знакомая раздача с нужной серией').toBe(true)
        expect(out.list[0].raw.hash).toBe('a')
    })
})

suite('Отсев чужих релизов', () => {
    // Найдено на живой выдаче: по запросу приходят три разных фильма-тёзки
    test('фильм другого года отсекается, даже с лучшим качеством', () => {
        let results = [
            row('Movie Name 2 / Movie Name 2 (2024) BluRay Remux 2160p HDR', 90),
            row('Movie Name / Movie Name (2026) WEB-DL 1080p', 20)
        ]

        let out = pick.pick(results, pick.context(MOVIE, {}, {}))

        expect(out.list.length, 'остался один').toBe(1)
        expect(out.list[0].parsed.year, 'год').toBe(2026)
    })

    test('раздача без года не отсекается', () => {
        let out = pick.pick([row('Movie Name WEB-DL 1080p', 10)], pick.context(MOVIE, {}, {}))

        expect(out.list.length).toBe(1)
    })

    test('совсем другое название отсекается', () => {
        let results = [row('Other Title (2026) WEB-DL 1080p', 200), row('Movie Name (2026) WEB-DL 1080p', 5)]

        let out = pick.pick(results, pick.context(MOVIE, {}, {}))

        expect(out.list.length, 'остался один').toBe(1)
        expect(out.list[0].title).toContain('Movie Name')
    })
})

suite('Экранки', () => {
    // Живой случай: TSRip шёл первым по сидерам среди всей выдачи
    test('экранка не выбирается, даже когда раздающих больше всех', () => {
        let results = [
            row('Movie Name (2026) TSRip [H.264] [AD]', 114),
            row('Movie Name (2026) WEB-DL 1080p', 8)
        ]

        let out = pick.pick(results, pick.context(MOVIE, {}, {}))

        expect(out.list[0].parsed.is_cam, 'лидер не экранка').toBe(false)
        expect(out.list.length, 'экранка отсеяна').toBe(1)
    })

    test('когда есть только экранки — честно сообщаем', () => {
        let results = [
            row('Movie Name (2026) TSRip [H.264] [AD]', 114),
            row('Movie Name (2026) CAMRip [H.264/1080p] [DVO]', 40)
        ]

        let out = pick.pick(results, pick.context(MOVIE, {}, {}))

        expect(out.list.length, 'ничего не выбрано').toBe(0)
        expect(out.reason, 'причина').toBe('only_cam')
        expect(out.confident, 'без уверенности').toBe(false)
    })

    test('экранки можно разрешить явно', () => {
        let results = [row('Movie Name (2026) TSRip [H.264]', 114)]

        let out = pick.pick(results, pick.context(MOVIE, {}, {no_cam: false}))

        expect(out.list.length).toBe(1)
    })
})

suite('Живость раздачи', () => {
    // Живой случай: лучшая 4K-раздача сериала имела ноль раздающих
    test('раздача без сидеров не выбирается, даже если это 4K', () => {
        let results = [
            row('Series Name [S03] (2026) UHD WEB-DL 2160p | 4K', 0),
            row('Series Name [S03] (2026) WEB-DL 1080p', 12)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3}))

        expect(out.list.length, 'мёртвая отсеяна').toBe(1)
        expect(out.list[0].parsed.resolution).toBe(1080)
    })

    test('сидеры не перебивают качество источника', () => {
        let results = [
            row('Series Name [S03] (2026) WEB-DL 2160p', 20),
            row('Series Name [S03] (2026) HDRip 480p', 500)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3}))

        expect(out.list[0].parsed.resolution, 'лидер — 4K').toBe(2160)
    })
})

suite('Сезоны', () => {
    // Живой случай: в топе по сидерам стояли первый и второй сезон, а нужен третий
    test('чужой сезон отсекается, даже если он популярнее', () => {
        let results = [
            row('Series Name (S1) (2023) WEB-DL 1080p', 85),
            row('Series Name (S2) (2024) WEB-DL 1080p', 108),
            row('Series Name / S3E1-4 of 10 (2026) WEB-DL 1080p', 69)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3}))

        expect(out.list.length, 'остался третий сезон').toBe(1)
        expect(out.list[0].parsed.season).toBe(3)
    })

    // Раньше такие раздачи показывались с пометкой «серии может не быть».
    // Предлагать их бессмысленно: файла с этой серией там физически нет.
    test('раздача без нужной серии не предлагается вовсе', () => {
        let results = [
            row('Series Name / S3E1-2 of 10 (2026) WEB-DL 2160p', 400),
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 1080p', 40)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3, episode: 5}))

        expect(out.list.length, 'осталась одна').toBe(1)
        expect(out.list[0].parsed.episodes, 'та, где серия есть').toEqual([1, 6])
    })

    test('серия ещё не вышла в раздачах — говорим об этом прямо', () => {
        let results = [
            row('Series Name / S3E1-2 of 10 (2026) WEB-DL 2160p', 400),
            row('Series Name / S3E1-3 of 10 (2026) WEB-DL 1080p', 40)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3, episode: 7}))

        expect(out.list.length, 'кандидатов нет').toBe(0)
        expect(out.reason, 'причина').toBe('no_episode_yet')
    })
})

suite('Язык и озвучка', () => {
    // Живой случай: в топе по сидерам стояли украинские раздачи
    test('раздача на другом языке отсекается', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 1080p 3xUkr/Eng | Sub Ukr', 108),
            row('Series Name (S3) (2026) WEB-DL 1080p | Дубляж', 20)
        ]

        let out = pick.pick(results, pick.context(SERIES, {lang: 'ru'}, {season: 3}))

        expect(out.list.length, 'осталась русская').toBe(1)
        expect(out.list[0].parsed.langs).toContain('ru')
    })

    // Найдено при прогоне на живой выдаче: фильтр Lampa хранит не код языка,
    // а переведённое название — «Русский», «Английский»
    test('язык из фильтра понимается и в виде названия', () => {
        global.Lampa = {
            Lang: {
                translate: (key) =>
                    ({
                        filter_lang_ru: 'Русский',
                        filter_lang_uk: 'Украинский',
                        filter_lang_en: 'Английский'
                    })[key] || key
            }
        }

        let results = [
            row('Series Name (S3) (2026) WEB-DL 1080p 3xUkr/Eng | Sub Ukr', 108),
            row('Series Name (S3) (2026) WEB-DL 1080p | Дубляж', 20)
        ]

        let out = pick.pick(results, pick.context(SERIES, {lang: ['Русский']}, {season: 3}))

        delete global.Lampa

        expect(out.list.length, 'осталась русская').toBe(1)
        expect(out.list[0].parsed.langs).toContain('ru')
    })

    test('несколько языков в фильтре — подходит любой из них', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 1080p 3xUkr/Eng', 50),
            row('Series Name (S3) (2026) WEB-DL 1080p | Дубляж', 20)
        ]

        let out = pick.pick(results, pick.context(SERIES, {lang: ['ru', 'uk']}, {season: 3}))

        expect(out.list.length, 'обе подходят').toBe(2)
    })

    test('выбранная студия побеждает более популярную раздачу', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 1080p | HDrezka', 100),
            row('Series Name (S3) (2026) WEB-DL 1080p | LostFilm', 30)
        ]

        let out = pick.pick(results, pick.context(SERIES, {voice: 'LostFilm'}, {season: 3}))

        expect(out.list[0].parsed.voices, 'лидер — выбранная студия').toContain('LostFilm')
    })

    test('привычная студия даёт преимущество при прочих равных', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 1080p | HDrezka', 30),
            row('Series Name (S3) (2026) WEB-DL 1080p | LostFilm', 30)
        ]

        let out = pick.pick(
            results,
            pick.context(
                SERIES,
                {},
                {
                    season: 3,
                    voice_rating: {LostFilm: 12}
                }
            )
        )

        expect(out.list[0].parsed.voices).toContain('LostFilm')
    })
})

suite('Ослабление фильтров', () => {
    // Ради этого случая ослабление и делалось: студия не озвучивает новый сериал,
    // а фильтр перешёл с прошлой карточки
    test('студии нет в раздачах — ограничение снимается, кнопка работает', () => {
        let results = [row('Series Name (S3) (2026) WEB-DL 1080p | HDrezka', 30)]

        let out = pick.pick(results, pick.context(SERIES, {voice: 'LostFilm'}, {season: 3}))

        expect(out.list.length, 'кандидат найден').toBe(1)
        expect(out.relaxed, 'перевод ослаблен').toContain('voice')
        expect(out.confident, 'но уверенности нет').toBe(false)
    })

    test('пока фильтр выполним — ничего не ослабляем', () => {
        let results = [row('Series Name (S3) (2026) WEB-DL 1080p | LostFilm', 30)]

        let out = pick.pick(results, pick.context(SERIES, {voice: 'LostFilm'}, {season: 3}))

        expect(out.relaxed, 'ослаблений нет').toEqual([])
    })

    test('ограничение по качеству соблюдается, пока есть выбор', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 2160p', 50),
            row('Series Name (S3) (2026) WEB-DL 1080p', 10)
        ]

        let out = pick.pick(results, pick.context(SERIES, {quality: ['1080p']}, {season: 3}))

        expect(out.list.length, '4K отсеяно').toBe(1)
        expect(out.list[0].parsed.resolution).toBe(1080)
    })

    test('HDR не предлагается, когда выключен', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 2160p HDR10+', 50),
            row('Series Name (S3) (2026) WEB-DL 2160p SDR', 10)
        ]

        let out = pick.pick(results, pick.context(SERIES, {hdr: 'no'}, {season: 3}))

        expect(out.list.length, 'HDR отсеян').toBe(1)
        expect(out.list[0].parsed.hdr).toBe(false)
    })
})

suite('Уверенность в выборе', () => {
    test('явный лидер — запускаем молча', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 2160p', 50),
            row('Series Name (S3) (2026) HDRip 480p', 10)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3}))

        expect(out.confident).toBe(true)
    })

    // Раньше близкие очки считались поводом спросить. Это ломало смысл кнопки:
    // если оба варианта хороши, пользователю всё равно, каким смотреть.
    test('два равных кандидата — всё равно запускаем, не спрашивая', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 1080p | LostFilm', 40),
            row('Series Name (S3) (2026) WEB-DL 1080p | HDrezka', 40)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3}))

        expect(out.confident, 'выбор не блокируется').toBe(true)
        expect(out.voices.length, 'но студии для вопроса собраны').toBe(2)
    })

    test('нарушение заданного качества — повод спросить', () => {
        let results = [row('Series Name (S3) (2026) WEB-DL 2160p', 30)]

        let out = pick.pick(results, pick.context(SERIES, {quality: ['720p']}, {season: 3}))

        expect(out.relaxed, 'качество ослаблено').toContain('quality')
        expect(out.confident, 'нужен вопрос').toBe(false)
    })

    test('единственный кандидат — уверенно', () => {
        let out = pick.pick(
            [row('Series Name (S3) (2026) WEB-DL 1080p', 30)],
            pick.context(SERIES, {}, {season: 3})
        )

        expect(out.confident).toBe(true)
    })

    test('ничего не найдено', () => {
        let out = pick.pick([], pick.context(SERIES, {}, {season: 3}))

        expect(out.list.length, 'пусто').toBe(0)
        expect(out.reason, 'причина').toBe('not_found')
    })
})

suite('Уже просмотренная раздача', () => {
    // Метку ставит сама Lampa при открытии раздачи, она же синхронизируется
    test('раздача, которую уже смотрели, идёт первой при равном качестве', () => {
        let results = [
            row('Series Name (S3) (2026) WEB-DL 1080p | LostFilm', 60),
            row('Series Name (S3) (2026) WEB-DL 1080p | HDrezka', 40, {viewed: true})
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3}))

        expect(out.list[0].viewed, 'лидер — знакомая раздача').toBe(true)
    })

    // Главный сценарий сериала: смотрели S3E3 из раздачи S3E1-4,
    // четвёртая серия лежит там же — переключать релиз незачем
    test('следующая серия берётся из той же раздачи, без вопросов', () => {
        let results = [
            row('Series Name / S3E1-4 of 10 (2026) WEB-DL 2160p | LostFilm', 30, {viewed: true}),
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 2160p | HDrezka', 300)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3, episode: 4}))

        expect(out.list[0].viewed, 'лидер — знакомая раздача').toBe(true)
        expect(out.continues, 'это продолжение').toBe(true)
        expect(out.confident, 'спрашивать не о чем').toBe(true)
    })

    test('если нужной серии в знакомой раздаче нет — берём ту, где она есть', () => {
        let results = [
            row('Series Name / S3E1-4 of 10 (2026) WEB-DL 2160p | LostFilm', 300, {viewed: true}),
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 2160p | HDrezka', 30)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3, episode: 6}))

        expect(out.list[0].parsed.episodes, 'лидер содержит серию 6').toEqual([1, 6])
        expect(out.continues, 'это уже не то же самое').toBe(false)
    })

    // Привычное качество важнее максимального: незачем посреди сезона
    // переходить с 1080p на 4K, если сериал смотрели в 1080p
    test('прежнее качество побеждает более высокое', () => {
        let results = [
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 2160p', 100),
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 1080p', 100)
        ]

        let out = pick.pick(
            results,
            pick.context(
                SERIES,
                {},
                {
                    season: 3,
                    episode: 4,
                    last: {voice: null, resolution: 1080}
                }
            )
        )

        expect(out.list[0].parsed.resolution, 'лидер — привычные 1080p').toBe(1080)
    })

    test('без прошлого выбора берётся лучшее качество', () => {
        let results = [
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 1080p', 100),
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 2160p', 100)
        ]

        let out = pick.pick(results, pick.context(SERIES, {}, {season: 3, episode: 4}))

        expect(out.list[0].parsed.resolution, 'лидер — 4K').toBe(2160)
    })

    // Прежней раздачи в выдаче не осталось — ищем максимально похожую
    test('без знакомой раздачи предпочитается прежняя студия и качество', () => {
        let results = [
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 2160p | HDrezka', 200),
            row('Series Name / S3E1-6 of 10 (2026) WEB-DL 2160p | LostFilm', 20)
        ]

        let out = pick.pick(
            results,
            pick.context(
                SERIES,
                {},
                {
                    season: 3,
                    episode: 4,
                    last: {voice: 'LostFilm', resolution: 2160}
                }
            )
        )

        expect(out.list[0].parsed.voices, 'лидер — прежняя студия').toContain('LostFilm')
    })

    test('но знакомая экранка всё равно не выбирается', () => {
        let results = [
            row('Movie Name (2026) TSRip', 60, {viewed: true}),
            row('Movie Name (2026) WEB-DL 1080p', 10)
        ]

        let out = pick.pick(results, pick.context(MOVIE, {}, {}))

        expect(out.list[0].parsed.is_cam).toBe(false)
    })
})

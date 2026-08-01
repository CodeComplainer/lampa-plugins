import parse from './parse'

import {expect, suite, test} from 'vitest'

/**
 * Все названия в тестах вымышленные — проверяется только форма заголовка:
 * теги качества, нумерация сезонов/серий, студии, языковые пометки.
 * Названия студий настоящие, это справочные данные, без них не проверить детект озвучек.
 */

suite('Источник записи', () => {
    // Главная дыра штатного парсера: 'CAM(?![a-zA-Z])' ломается о 'Rip'
    test('CAMRip распознаётся как экранка', () => {
        let r = parse('Movie Name (2026) CAMRip [H.264/1080p] [DVO] [AD]')

        expect(r.source, 'source').toBe('cam')
        expect(r.is_cam, 'is_cam').toBe(true)
    })

    test('TSRip распознаётся как экранка', () => {
        let r = parse('Movie Name (2026) TSRip [H.264] [AD]')

        expect(r.source, 'source').toBe('ts')
        expect(r.is_cam, 'is_cam').toBe(true)
    })

    test('чистый TS распознаётся как экранка', () => {
        expect(parse('Movie Name (2026) TS [H.265/1080p] [EN / RU, EN Sub]').is_cam).toBe(true)
    })

    test('экранка с указанным разрешением всё равно экранка', () => {
        let r = parse('Movie Name (2026) CAMRip [H.264/1080p] [AD]')

        expect(r.resolution, 'resolution').toBe(1080)
        expect(r.is_cam, 'is_cam').toBe(true)
    })

    test('нормальные источники не считаются экранкой', () => {
        expect(parse('Movie Name (2024) BDRip-AVC Ukr/Eng').is_cam, 'BDRip').toBe(false)
        expect(parse('Movie Name (2024) DUB HDRip').is_cam, 'HDRip').toBe(false)
        expect(parse('Series Name (S2) (2024) WEB-DL 1080p').is_cam, 'WEB-DL').toBe(false)
        expect(parse('Movie Name (2024) DUB, Sub WEBDL').is_cam, 'WEBDL').toBe(false)
    })

    test('источник определяется точнее общего Rip', () => {
        expect(parse('Movie Name (2024) BDRip-AVC').source, 'BDRip').toBe('bdrip')
        expect(parse('Series Name (2026) WEB-DLRip-AVC').source, 'WEB-DLRip').toBe('webdlrip')
        expect(parse('Series Name (2026) WEB-DL 2160p').source, 'WEB-DL').toBe('webdl')
        expect(parse('Movie Name (2024) BluRay Remux').source, 'Remux').toBe('bluray')
    })

    test('ранг источника: диск лучше рипа, экранка хуже всех', () => {
        let bluray = parse('Movie Name (2024) BluRay Remux').source_rank
        let webdl = parse('Series Name (2026) WEB-DL 2160p').source_rank
        let hdrip = parse('Movie Name (2024) DUB HDRip').source_rank
        let cam = parse('Movie Name (2026) CAMRip').source_rank

        expect(bluray).toBeGreaterThan(webdl)
        expect(webdl).toBeGreaterThan(hdrip)
        expect(cam).toBe(0)
    })
})

suite('Разрешение', () => {
    test('латинские обозначения', () => {
        expect(parse('Series Name (2026) WEB-DL 2160p').resolution, '2160p').toBe(2160)
        expect(parse('Series Name (2024) WEB-DL 1080p').resolution, '1080p').toBe(1080)
        expect(parse('Series Name (2024) WEB-DL 720p').resolution, '720p').toBe(720)
        expect(parse('Series Name (2026) [H.265/2160p] [4K]').resolution, '4K').toBe(2160)
        expect(parse('Movie Name (2024) UHD WEB-DL').resolution, 'UHD').toBe(2160)
        expect(parse('Movie Name (2024) FullHD').resolution, 'FullHD').toBe(1080)
    })

    // В русских раздачах пишут кириллическую 'р' вместо латинской 'p'
    test('кириллическая р в 1080р', () => {
        expect(parse('Series Name (2024) WEB-DL 1080р').resolution).toBe(1080)
        expect(parse('Series Name (2024) WEB-DL 720р').resolution).toBe(720)
    })

    // Критично: отсутствие разрешения НЕ признак экранки
    test('нет разрешения в названии — unknown, но не экранка', () => {
        let r = parse('Movie Name (2024) BDRip-AVC Ukr/Eng | Sub Ukr/Eng')

        expect(r.resolution, 'resolution').toBe(null)
        expect(r.is_cam, 'is_cam').toBe(false)
    })
})

suite('Сезоны и серии', () => {
    test('латинская x в номере серии', () => {
        let r = parse('Название / Series Name [03x01-04 из 10] (2026) UHD WEB-DL 2160p')

        expect(r.season, 'season').toBe(3)
        expect(r.episodes, 'episodes').toEqual([1, 4])
    })

    // Вторая дыра штатного парсера: кириллическая 'х' даёт season = 1
    test('кириллическая х в номере серии', () => {
        let r = parse('Название / Series Name [03х01-04 из 08] (2026) WEB-DLRip-AVC | HDrezka Studio')

        expect(r.season, 'season').toBe(3)
        expect(r.episodes, 'episodes').toEqual([1, 4])
    })

    test('формат SxxExx', () => {
        let r = parse('Series Name / S3E1-4 of 10 (2026) WEB-DL [H.265/2160p]')

        expect(r.season, 'season').toBe(3)
        expect(r.episodes, 'episodes').toEqual([1, 4])
    })

    test('сезон без серий', () => {
        let r = parse('Series Name (S2) (2024) WEB-DL 1080p 3xUkr/Eng | Sub Ukr')

        expect(r.season, 'season').toBe(2)
        expect(r.episodes, 'episodes').toBe(null)
    })

    test('русская запись сезона и серий', () => {
        let r = parse('Название (3 сезон: 1-2 серии из 10) / Series Name / 2026 / WEB-DLRip')

        expect(r.season, 'season').toBe(3)
        expect(r.episodes, 'episodes').toEqual([1, 2])
    })

    test('одиночная серия', () => {
        let r = parse('Series Name S01E05 (2024) WEB-DL 1080p')

        expect(r.season, 'season').toBe(1)
        expect(r.episodes, 'episodes').toEqual([5, 5])
    })

    test('диапазон сезонов', () => {
        expect(parse('Series Name [S01-02] (2024) WEB-DLRip').seasons).toEqual([1, 2])
    })

    // Формат «вышло N из M» — типичен для аниме и онгоингов
    test('N из M — вышедшие серии', () => {
        expect(parse('Anime Title [2026, TV, 5 из 13 эп.] WEBRip 720p raw').episodes, 'из').toEqual([1, 5])
        expect(parse('Anime Title [12 из 12] (2024) WEB-DL 1080p').episodes, 'полный сезон').toEqual([1, 12])
        expect(parse('Anime Title [2026, TV, 4 из ?] WEB-DL').episodes, 'неизвестно сколько').toEqual([1, 4])
        expect(parse('Series Name (12 of 24) (2024) WEBRip').episodes, 'of').toEqual([1, 12])
    })

    // Формат без сезона, найден на живых данных (аниме и дорамы)
    test('E1-12 — серии без указания сезона', () => {
        let r = parse('Series Name / Original Name - E1-12 - 2022 3 x MVO (Studio One)')

        expect(r.episodes, 'episodes').toEqual([1, 12])
        expect(r.season, 'season').toBe(null)
    })

    test('одиночная серия в формате E5', () => {
        expect(parse('Series Name - E5 - 2025 РУ, Sub WEBDL (AVC)').episodes).toEqual([5, 5])
    })

    test('год в спортивной раздаче не считается сезоном', () => {
        // S2026 — это год сезона чемпионата, а не номер сезона сериала
        expect(parse('Sport Event. S2026. Этап 22. Гонка (26.07.2026) WEB-DL 1080p').season).toBe(null)
    })

    test('диапазон серий вместе с «из»', () => {
        expect(parse('Series Name [03x01-04 из 10] (2026) WEB-DL').episodes, 'x-формат').toEqual([1, 4])
        expect(parse('Название (3 сезон: 2-5 серии из 10) / Series Name (2026)').episodes, 'русский').toEqual(
            [2, 5]
        )
    })

    test('у фильма сезона нет', () => {
        expect(parse('Movie Name (2024) BDRip-AVC').season).toBe(null)
    })

    // Аниме-конвенция, найдена при прогоне на 2279 живых заголовках
    test('[ТВ-4] означает четвёртый сезон', () => {
        expect(parse('Название [ТВ-4] | Anime Title (2026) WEBRip 1080p').season, 'кириллица').toBe(4)
        expect(parse('Anime Title [TV-2] (2024) WEBRip 720p').season, 'латиница').toBe(2)
    })

    test('одиночный ТВ без номера не считается сезоном', () => {
        expect(parse('Anime Title [2026, TV, 5 из 13 эп.] WEBRip 720p raw').season).toBe(null)
    })
})

suite('HDR и Dolby Vision', () => {
    // Третья дыра: '\b(HDR|Dolby Vision)\b' не матчит HDR10
    test('HDR10+ распознаётся', () => {
        let r = parse('Series Name / S3E1-4 of 10 (2026) WEB-DL [H.265/2160p] [4K, HDR10+, DV 8.1, 10-bit]')

        expect(r.hdr, 'hdr').toBe(true)
        expect(r.dv, 'dv').toBe(true)
    })

    test('простой HDR', () => {
        expect(parse('Movie Name (2024) 4K HDR BluRay').hdr).toBe(true)
    })

    test('Dolby Vision словами', () => {
        let r = parse('Series Name (2024) UHD WEB-DL 2160p | HDR10+ | Dolby Vision Profile 8')

        expect(r.dv, 'dv').toBe(true)
    })

    test('SDR не считается HDR', () => {
        let r = parse('Series Name (2026) UHD WEB-DL 2160p | 4K | SDR | P, A')

        expect(r.hdr, 'hdr').toBe(false)
        expect(r.dv, 'dv').toBe(false)
    })

    // Найдено на живых данных: студия HDRezka давала ложный HDR
    test('название студии HDRezka не считается за HDR', () => {
        expect(parse('Series Name (2026) WEB-DLRip-AVC | HDRezka Studio').hdr).toBe(false)
    })

    test('HDRip не считается за HDR', () => {
        expect(parse('Movie Name (2024) DUB HDRip').hdr).toBe(false)
    })
})

suite('Озвучки', () => {
    test('одна студия', () => {
        expect(parse('Series Name (2026) WEB-DLRip-AVC | HDrezka Studio').voices).toContain('HDrezka')
    })

    test('несколько студий в одной раздаче', () => {
        let r = parse(
            'Series Name (2026) WEB-DL [H.265/2160p] HDRezka, NewComers, Red Head Sound, LostFilm, TVShows'
        )

        expect(r.voices).toContain('HDrezka')
        expect(r.voices).toContain('LostFilm')
        expect(r.voices).toContain('NewComers')
    })

    test('студия в скобках', () => {
        expect(
            parse('Название (3 сезон) / Series Name / 2026 / ПМ (LostFilm), СТ / WEB-DLRip').voices
        ).toContain('LostFilm')
    })

    test('без студий — пустой список', () => {
        expect(parse('Movie Name (2024) BDRip-AVC').voices).toEqual([])
    })

    // Найдено на живых данных: в словаре Lampa есть короткие языковые коды
    test('языковые пометки не считаются студиями', () => {
        expect(parse('Series Name (2024) WEB-DL 1080p 3xUkr/Eng | Sub Ukr').voices).toEqual([])
        expect(parse('Movie Name (2024) BDRip Ukr/Eng | Sub Ukr/Eng').voices).toEqual([])
    })
})

suite('Языки', () => {
    test('украинская раздача', () => {
        let r = parse('Series Name (S2) (2024) WEB-DL 1080p 3xUkr/Eng | Sub Ukr')

        expect(r.langs, 'langs').toContain('uk')
    })

    test('русская раздача', () => {
        expect(parse('Название / Series Name (2026) WEB-DL 1080p | Дубляж').langs).toContain('ru')
    })

    test('английская дорожка отмечается', () => {
        expect(parse('Movie Name (2024) BDRip Ukr/Eng').langs).toContain('en')
    })

    // Найдено на живых данных: 'укр' находилось внутри обычных русских слов
    test('слово, начинающееся на укр, не делает раздачу украинской', () => {
        // «Укрытие» — русское название, а не украинская озвучка
        let r = parse('Укрытие / Series Name (2026) WEB-DL 2160p | Дубляж')

        expect(r.langs, 'langs').not.toContain('uk')
        expect(r.langs, 'langs').toContain('ru')
    })

    test('украинская раздача всё ещё определяется', () => {
        expect(parse('Series Name (2024) WEB-DL 1080p 3xUkr/Eng').langs, 'Ukr').toContain('uk')
        expect(parse('Назва / Series Name (2024) WEB-DL українською').langs, 'кириллица').toContain('uk')
    })
})

suite('Год', () => {
    test('год в скобках', () => {
        expect(parse('Movie Name (2024) BDRip-AVC').year).toBe(2024)
    })

    test('диапазон лет — берём первый', () => {
        expect(parse('Series Name (2022-2023) WEB-DLRip').year).toBe(2022)
    })

    test('год без скобок', () => {
        expect(parse('Movie Name Second Title 2024 DUB WEBDL').year).toBe(2024)
    })

    test('разрешение не путается с годом', () => {
        expect(parse('Movie Name (2024) WEB-DL 2160p').year).toBe(2024)
    })
})

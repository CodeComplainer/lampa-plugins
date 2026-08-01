import match from './match'

import {expect, suite, test} from 'vitest'

/**
 * Дорожки заданы так, как их отдаёт плеер: язык, название и признаки выбора.
 * Названия студий настоящие — по ним и происходит сопоставление.
 */
function track(language, label, extra) {
    return Object.assign({language: language, label: label, enabled: false, selected: false}, extra || {})
}

suite('Приметы дорожки', () => {
    test('язык и название приводятся к единому виду', () => {
        let about = match.describe(track('RUS', '  LostFilm '))

        expect(about.lang, 'lang').toBe('ru')
        expect(about.label, 'label').toBe('lostfilm')
    })

    // В браузере код языка двухбуквенный, на webOS трёхбуквенный — без
    // приведения запись с одного устройства не совпала бы с дорожками другого
    test('трёхбуквенный код языка сводится к двухбуквенному', () => {
        expect(match.describe(track('rus', 'x')).lang).toBe('ru')
        expect(match.describe(track('ru', 'x')).lang).toBe('ru')
        expect(match.describe(track('kor', 'x')).lang).toBe('ko')
        expect(match.describe(track('eng', 'x')).lang).toBe('en')
    })

    test('незнакомый код остаётся как есть', () => {
        expect(match.describe(track('xyz', 'x')).lang).toBe('xyz')
    })

    test('дорожка без опознавательных знаков', () => {
        expect(match.describe(track('', ''))).toBe(null)
        expect(match.describe(null)).toBe(null)
    })

    test('name используется, если label пуст', () => {
        let about = match.describe({language: 'rus', name: 'Дубляж'})

        expect(about.label).toBe('дубляж')
    })
})

suite('Поиск подходящей дорожки', () => {
    // Главный сценарий: в другой раздаче порядок дорожек другой
    test('находит ту же озвучку на другой позиции', () => {
        let tracks = [track('eng', 'Original'), track('rus', 'Дубляж'), track('rus', 'LostFilm')]

        let found = match.match(tracks, {lang: 'ru', label: 'lostfilm'})

        expect(found, 'найдена').toBe(tracks[2])
    })

    // Обе дорожки русские, но человек выбирал конкретную студию
    test('название озвучки важнее языка', () => {
        let tracks = [track('rus', 'Дубляж'), track('eng', 'LostFilm')]

        let found = match.match(tracks, {lang: 'ru', label: 'lostfilm'})

        expect(found.label, 'выбрана по названию').toBe('LostFilm')
    })

    test('при отсутствии озвучки берётся тот же язык', () => {
        let tracks = [track('eng', 'Original'), track('rus', 'HDrezka')]

        let found = match.match(tracks, {lang: 'ru', label: 'lostfilm'})

        expect(found.language, 'та же речь').toBe('rus')
    })

    test('название записано чуть иначе — всё равно узнаём', () => {
        let tracks = [track('eng', 'Original'), track('rus', 'LostFilm Studio')]

        let found = match.match(tracks, {lang: 'ru', label: 'lostfilm'})

        expect(found.label).toBe('LostFilm Studio')
    })

    // Лучше оставить выбор плеера, чем включить заведомо чужую озвучку
    test('ничего похожего — не выбираем наугад', () => {
        let tracks = [track('jpn', 'Original'), track('eng', 'English')]

        expect(match.match(tracks, {lang: 'ru', label: 'lostfilm'})).toBe(null)
    })

    test('пустой список и отсутствие памяти', () => {
        expect(match.match([], {lang: 'ru', label: 'x'}), 'пусто').toBe(null)
        expect(match.match([track('rus', 'LostFilm')], null), 'нет памяти').toBe(null)
    })
})

suite('Текущая дорожка', () => {
    test('берётся отмеченная как выбранная', () => {
        let tracks = [track('eng', 'Original'), track('rus', 'LostFilm', {selected: true})]

        expect(match.selected(tracks).label).toBe('LostFilm')
    })

    test('если признака selected нет — смотрим на enabled', () => {
        let tracks = [track('eng', 'Original', {enabled: true}), track('rus', 'LostFilm')]

        expect(match.selected(tracks).label).toBe('Original')
    })

    test('ничего не выбрано', () => {
        expect(match.selected([track('eng', 'Original')])).toBe(null)
    })
})

suite('Переключение', () => {
    // Та же последовательность, что делает штатная панель плеера
    test('признаки снимаются со всех и ставятся выбранной', () => {
        let tracks = [track('eng', 'Original', {enabled: true, selected: true}), track('rus', 'LostFilm')]

        match.apply(tracks, tracks[1])

        expect(tracks[0].selected, 'прежняя снята').toBe(false)
        expect(tracks[0].enabled, 'прежняя выключена').toBe(false)
        expect(tracks[1].selected, 'новая выбрана').toBe(true)
        expect(tracks[1].enabled, 'новая включена').toBe(true)
    })

    test('вызывается onSelect дорожки — через него переключается HLS', () => {
        let called = null
        let tracks = [track('eng', 'Original'), track('rus', 'LostFilm', {onSelect: (t) => (called = t)})]

        match.apply(tracks, tracks[1])

        expect(called, 'onSelect вызван').toBe(tracks[1])
    })

    test('без дорожки ничего не делаем', () => {
        expect(match.apply([track('eng', 'Original')], null)).toBe(false)
    })
})

/**
 * Названия дорожек приходят не от плеера, а от стороннего плагина `tracks`.
 * Он может быть не установлен или отвалиться — тогда от дорожки остаётся один
 * язык, и две русские озвучки становятся неразличимы. Выручает номер, но
 * доверять ему можно, только если список дорожек тот же, то есть раздача та же.
 */
suite('Опознание по номеру, когда имён нет', () => {
    function plain(language) {
        return {language: language}
    }

    const LIST = [plain('ru'), plain('ru'), plain('en')]

    test('приметы списка — языки по порядку', () => {
        expect(match.shape(LIST)).toBe('ru,ru,en')
    })

    test('трёхбуквенные коды дают те же приметы', () => {
        expect(match.shape([plain('rus'), plain('rus'), plain('eng')])).toBe('ru,ru,en')
    })

    test('список тот же — берётся запомненный номер, а не первая русская', () => {
        let saved = {lang: 'ru', label: '', index: 1, shape: 'ru,ru,en'}

        expect(match.match(LIST, saved)).toBe(LIST[1])
    })

    test('список другой — номеру не верим, остаётся язык', () => {
        let saved = {lang: 'ru', label: '', index: 1, shape: 'ru,ru,en'}
        let other = [plain('en'), plain('ru')]

        expect(match.match(other, saved), 'первая русская').toBe(other[1])
    })

    test('порядок изменился — это уже другая раздача', () => {
        let saved = {lang: 'ru', label: '', index: 1, shape: 'ru,ru,en'}
        let other = [plain('ru'), plain('en'), plain('ru')]

        expect(match.match(other, saved)).toBe(other[0])
    })

    test('номера не запоминали — прежнее поведение', () => {
        expect(match.match(LIST, {lang: 'ru', label: ''})).toBe(LIST[0])
    })

    test('название нашлось — оно важнее номера', () => {
        let list = [
            {language: 'ru', label: 'HDRezka'},
            {language: 'ru', label: 'ColdFilm'}
        ]
        let saved = {lang: 'ru', label: 'coldfilm', index: 0, shape: 'ru,ru'}

        expect(match.match(list, saved), 'по имени, а не по номеру').toBe(list[1])
    })

    test('номер за пределами списка ничего не ломает', () => {
        let saved = {lang: 'ru', label: '', index: 9, shape: 'ru,ru,en'}

        expect(match.match(LIST, saved)).toBe(LIST[0])
    })
})

suite('Субтитры', () => {
    function sub(index, language, label, showing) {
        return {index: index, language: language, label: label, mode: showing ? 'showing' : 'disabled'}
    }

    test('псевдострока «Отключено» не участвует в подборе', () => {
        let subs = [{index: -1, title: 'Отключено'}, sub(0, 'rus', 'Полные')]

        expect(match.realSubs(subs).length).toBe(1)
        expect(match.matchSub(subs, {lang: 'ru', label: 'полные'}).index).toBe(0)
    })

    test('выключенные субтитры — это null, а не первая строка', () => {
        expect(match.selectedSub([sub(0, 'rus', 'Полные'), sub(1, 'eng', 'Full')])).toBe(null)
    })

    test('включение снимает режим со всех остальных', () => {
        let subs = [sub(0, 'rus', 'Полные', true), sub(1, 'eng', 'Full')]

        match.applySub(subs, subs[1])

        expect(subs[0].mode).toBe('disabled')
        expect(subs[1].mode).toBe('showing')
        expect(match.selectedSub(subs).index).toBe(1)
    })

    test('выключение снимает режим со всех', () => {
        let subs = [sub(0, 'rus', 'Полные', true)]

        match.applySub(subs, null)

        expect(match.selectedSub(subs)).toBe(null)
    })
})

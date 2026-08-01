import keys from '../shared/keys'

/**
 * Менеджер плагинов.
 *
 * Смысл: на телевизоре длинные адреса набирать пультом невыносимо. Этот плагин
 * вводится один раз, дальше все остальные включаются переключателями в настройках,
 * а список берётся из манифеста в репозитории — новые плагины появляются сами.
 *
 * Для отладки есть переключатель источника: те же плагины можно грузить с локального
 * сервера разработки, не публикуя сборку в репозиторий.
 */

/**
 * GitHub Pages, а не raw: raw отдаёт файлы как text/plain с заголовком nosniff,
 * и браузер отказывается выполнять их как скрипт — плагин просто не загрузится.
 * Pages отдаёт правильный application/javascript.
 */
const REPO = 'https://codecomplainer.github.io/lampa-plugins/'
const COMPONENT = 'manager'
const MANIFEST = REPO + 'plugins.json'

/**
 * Запасной список на случай, если манифест недоступен: без сети менеджер
 * всё равно должен показывать хоть что-то.
 */
const FALLBACK = [
    {file: 'continue.js', name: 'Смотреть одной кнопкой', descr: 'Запуск нужной серии без выбора раздачи'}
]

const ICON = `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="14" height="14" rx="3" stroke="white" stroke-width="2.5"/>
    <rect x="22" y="2" width="14" height="14" rx="3" stroke="white" stroke-width="2.5"/>
    <rect x="2" y="22" width="14" height="14" rx="3" stroke="white" stroke-width="2.5"/>
    <path d="M29 22V36M22 29H36" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
</svg>`

let catalog = FALLBACK

function startPlugin() {
    if (window.plugin_manager_ready) return

    window.plugin_manager_ready = true

    Lampa.SettingsApi.addComponent({
        component: COMPONENT,
        icon: ICON,
        name: Lampa.Lang.translate('manager_title')
    })

    // Себя менеджер подписывает сам: в манифест он не входит, а безымянная
    // строка в списке расширений мешает не меньше остальных.
    nameSelf()

    render(catalog)

    loadManifest((list) => {
        catalog = list

        // Сначала приводим список плагинов в соответствие манифесту, потом
        // рисуем настройки: иначе переключатель запомнит состояние «выключен»,
        // которое было до установки.
        reconcile(catalog)

        render(catalog)
    })

    // Список плагинов обновляется при каждом заходе в настройки: иначе новый
    // плагин появится на телевизоре только после перезапуска приложения.
    //
    // Момент — открытие главного экрана настроек, а не нашего раздела: наши
    // параметры собираются при создании раздела, и перерисовывать их, когда он
    // уже на экране, поздно. В свой раздел человек всё равно заходит отсюда.
    Lampa.Settings.listener.follow('open', (e) => {
        if (e.name !== 'main') return

        loadManifest((list) => {
            catalog = list

            reconcile(catalog)

            render(catalog)
        })
    })
}

/**
 * Привести список плагинов в соответствие манифесту.
 *
 * Три вещи, которые человек не должен делать руками на телевизоре:
 * поставить появившийся плагин, переехать на переименованный и убрать
 * исчезнувший. Пультом это мучительно, а знаний, что плагин переименовали,
 * у человека вообще нет.
 *
 * Ключ `cc_manager_seen` помнит, какие плагины менеджер уже предлагал. Без него
 * пришлось бы выбирать между «новые плагины не появляются» и «выключенные
 * возвращаются при каждом запуске».
 */
function reconcile(list) {
    let seen = known()
    let added = []

    list.forEach((item) => {
        // Переименование: плагин тот же, файл другой. Старый убираем всегда,
        // а новый ставим, только если старый стоял — иначе это была бы
        // установка без спроса.
        let inherited = false

        toArray(item.replaces).forEach((old) => {
            forget(old)

            let exist = installed(old)

            if (!exist) return

            Lampa.Plugins.remove(exist)

            inherited = true
        })

        let first = seen.indexOf(item.file) === -1

        if (first) seen.push(item.file)

        // название могло появиться в манифесте позже самого плагина
        let exist = installed(item.file)

        if (exist) nameIt(exist)

        if (available(item) && !installed(item.file) && (inherited || (first && item.default !== false))) {
            install(item.file)

            added.push(item.name || item.file)
        }
    })

    // Плагин пропал из манифеста — убираем и у себя. Трогаем только свои
    // адреса: плагины, добавленные мимо менеджера, не наше дело.
    Lampa.Plugins.get()
        .slice()
        .forEach((plugin) => {
            let file = ourFile(plugin.url)

            if (!file || file === 'manager.js') return

            if (list.some((item) => item.file === file)) return

            Lampa.Plugins.remove(plugin)

            forget(file)
        })

    Lampa.Storage.set(keys.KEYS.seen, seen)

    if (added.length) {
        Lampa.Noty.show(Lampa.Lang.translate('manager_installed') + ': ' + added.join(', '))
    }
}

/**
 * Какие плагины менеджер уже предлагал.
 *
 * До появления этого ключа факт «первый запуск был» хранился одним флагом.
 * Чтобы переход не выглядел как переустановка всего подряд, при первом чтении
 * считаем уже предложенным всё, что стоит сейчас.
 */
function known() {
    let seen = Lampa.Storage.get(keys.KEYS.seen, '')

    if (Array.isArray(seen)) return seen

    return Lampa.Plugins.get()
        .map((plugin) => ourFile(plugin.url))
        .filter(Boolean)
}

/**
 * Имя файла, если адрес наш. Чужие плагины остаются нетронутыми.
 */
function ourFile(url) {
    let clean = (url + '').replace(/\?.*$/, '')
    let ours = [REPO, base(), localBase()].filter(Boolean)

    if (!ours.some((prefix) => clean.indexOf(prefix) === 0)) return null

    return clean.split('/').pop() || null
}

/**
 * Плагин, помеченный `local`, в репозиторий не публикуется — предлагать его
 * некуда, пока не задан адрес машины, где он лежит. Общий источник при этом
 * не важен: остальные плагины продолжают приезжать с GitHub.
 */
function available(item) {
    return !item.local || !!localBase()
}

/**
 * Сбросить переключатель исчезнувшего плагина: иначе, вернись он когда-нибудь
 * под тем же именем, переключатель показал бы «включен» от прошлой жизни.
 *
 * Именно сбросить, а не удалить ключ: `Storage.remove` — это про снятие
 * значения с синхронизации, а не про localStorage, и здесь бы просто
 * ничего не сделала.
 */
function forget(file) {
    Lampa.Storage.set(keys.KEYS.plugin_on + file, false)
}

function toArray(value) {
    if (!value) return []

    return Array.isArray(value) ? value : [value]
}

/** Сколько раз пробуем достать манифест и с какой паузой */
const TRIES = 4
const RETRY = 3000

/**
 * Манифест — единственный источник знаний о плагинах, и без него менеджер
 * не делает ничего: ни названий, ни новых плагинов, ни переименований.
 *
 * Одной попытки мало. Телевизор запускает приложение раньше, чем поднимается
 * сеть, и запрос при старте проваливается молча — а выглядит это так, будто
 * плагины «Без названия» и новых просто нет. Поэтому пробуем несколько раз
 * с нарастающей паузой и говорим о неудаче в консоль.
 */
function loadManifest(done, attempt) {
    let network = new Lampa.Reguest()

    attempt = attempt || 1

    network.silent(
        MANIFEST + '?ts=' + Date.now(),
        (json) => {
            if (Array.isArray(json) && json.length) return done(json)

            retry(done, attempt, 'пустой ответ')
        },
        (error) => retry(done, attempt, error),
        false,
        {dataType: 'json'}
    )
}

function retry(done, attempt, reason) {
    console.log('Manager', 'манифест не прочитан, попытка', attempt, 'из', TRIES, '—', reason)

    if (attempt >= TRIES) return

    setTimeout(() => loadManifest(done, attempt + 1), RETRY * attempt)
}

/**
 * Настройки собираются заново каждый раз: список плагинов приходит из сети,
 * а параметры регистрируются статически.
 */
function render(list) {
    Lampa.SettingsApi.removeParams(COMPONENT)

    Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {
            name: keys.KEYS.source,
            type: 'select',
            values: {github: 'GitHub', local: Lampa.Lang.translate('manager_source_local')},
            default: 'github'
        },
        field: {
            name: Lampa.Lang.translate('manager_source'),
            description: Lampa.Lang.translate('manager_source_descr')
        },
        onChange: () => {
            reinstallAll()

            // перерисовываем, чтобы адреса под плагинами показали новый источник
            render(catalog)

            // экран настроек может быть уже закрыт — обновление тогда не нужно
            try {
                Lampa.Settings.update()
            } catch {}
        }
    })

    Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {
            name: keys.KEYS.local_host,
            type: 'input',
            values: '',
            placeholder: '192.168.1.10:3000',
            default: ''
        },
        field: {
            name: Lampa.Lang.translate('manager_host'),
            description: Lampa.Lang.translate('manager_host_descr')
        },
        onChange: () => {
            reinstallAll()

            // адрес открывает неопубликованные плагины, список меняется
            render(catalog)

            try {
                Lampa.Settings.update()
            } catch {}
        }
    })

    Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {name: 'manager_list_title', type: 'title'},
        field: {name: Lampa.Lang.translate('manager_plugins') + ' — ' + list.filter(available).length}
    })

    list.filter(available).forEach((item) => {
        let name = keys.KEYS.plugin_on + item.file

        // Переключатель обязан показывать факт, а не то, что осталось в памяти
        // с прошлого запуска: плагин могли удалить или добавить мимо менеджера.
        Lampa.Storage.set(name, !!installed(item.file))

        Lampa.SettingsApi.addParam({
            component: COMPONENT,
            param: {
                name: name,
                type: 'trigger',
                default: !!installed(item.file)
            },
            field: {
                name: item.name || item.file,
                // Показываем фактический адрес: по нему сразу видно, откуда
                // приедет плагин — из репозитория или с локальной сборки
                description: (item.descr || '') + describeSource(item.file)
            },
            onChange: (value) => {
                if (value === true || value === 'true') install(item.file)
                else uninstall(item.file)

                Lampa.Noty.show(Lampa.Lang.translate('manager_need_reload'))
            }
        })
    })

    Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {name: 'manager_reload', type: 'button'},
        field: {
            name: Lampa.Lang.translate('manager_reload'),
            description: Lampa.Lang.translate('manager_reload_descr')
        },
        onChange: () => window.location.reload()
    })
}

/**
 * Строка с адресом под названием плагина. Для установленного показываем адрес,
 * по которому он реально загружается — включая случай, когда он остался
 * с прежнего источника и ещё не переустановлен.
 */
function describeSource(file) {
    let exist = installed(file)

    if (!exist) return ''

    let url = (exist.url + '').replace(/^https?:\/\//, '').replace(/\?.*$/, '')

    return '<div style="opacity:.5; margin-top:.3em">' + url + '</div>'
}

/** Откуда грузить плагины */
function base() {
    if (Lampa.Storage.field(keys.KEYS.source) !== 'local') return REPO

    return localBase() || REPO
}

/** Машина разработчика, если её адрес задан */
function localBase() {
    let host = (Lampa.Storage.get(keys.KEYS.local_host, '') + '').trim()

    if (!host) return ''

    if (!/^https?:\/\//.test(host)) host = 'http://' + host

    return host.replace(/\/+$/, '') + '/plugins/'
}

/**
 * Откуда грузить конкретный плагин.
 *
 * Неопубликованный плагин всегда едет с машины разработчика, независимо от
 * общего источника: иначе, чтобы включить отладку, пришлось бы переводить
 * на локальную сборку и все остальные плагины — и они бы отвалились,
 * как только компьютер выключен.
 */
function baseFor(file) {
    let item = catalog.find((p) => p.file === file)

    if (item && item.local) return localBase()

    return base()
}

function urlFor(file) {
    return baseFor(file) + file
}

/**
 * Плагин ищем по имени файла, а не по полному адресу: адрес меняется вместе
 * с источником, а плагин остаётся тем же.
 */
function installed(file) {
    return Lampa.Plugins.get().find((p) => (p.url + '').indexOf('/' + file) >= 0) || null
}

function install(file) {
    let exist = installed(file)

    if (exist && exist.url === urlFor(file)) return nameIt(exist)

    if (exist) Lampa.Plugins.remove(exist)

    Lampa.Plugins.add({url: urlFor(file), status: 1, name: titleOf(file)})
}

/**
 * Название в штатном списке расширений.
 *
 * Lampa показывает `data.name`, а плагин, добавленный по адресу, приходит без
 * него — отсюда список из одинаковых «Без названия», в котором ничего не найти.
 * Поле обычное: сама Lampa даёт задать его вручную через «Изменить название»,
 * так что мы просто заполняем его за человека.
 */
function titleOf(file) {
    if (file === 'manager.js') return Lampa.Lang.translate('manager_title')

    let item = catalog.find((p) => p.file === file)

    return (item && item.name) || file
}

function nameSelf() {
    let exist = installed('manager.js')

    if (exist) nameIt(exist)
}

/**
 * Дописать название уже установленному плагину.
 *
 * Переустанавливать ради этого нельзя: адрес верный, а лишнее удаление
 * и добавление заставило бы Lampa грузить плагин заново.
 */
function nameIt(plugin) {
    let title = titleOf(ourFile(plugin.url) || '')

    if (plugin.name === title) return

    plugin.name = title

    Lampa.Plugins.save(plugin)
}

function uninstall(file) {
    let exist = installed(file)

    if (exist) Lampa.Plugins.remove(exist)
}

/**
 * Смена источника: переставляем всё включённое на новые адреса.
 */
function reinstallAll() {
    // Недоступное на новом источнике отключаем по каталогу: адрес такого плагина
    // мог перестать опознаваться как наш — например, вместе с источником стёрли
    // и адрес компьютера, — и по списку установленных его было бы не найти.
    catalog.forEach((item) => {
        if (!available(item) && installed(item.file)) uninstall(item.file)
    })

    // А переставляем по списку установленного, а не по каталогу: манифест мог
    // ещё не приехать, и тогда каталог — это заглушка из одного плагина,
    // а всё остальное молча осталось бы на прежнем источнике.
    Lampa.Plugins.get()
        .slice()
        .forEach((plugin) => {
            let file = ourFile(plugin.url)

            // Менеджер остаётся там, откуда его поставили: уехав на выключенный
            // компьютер, он забрал бы с собой и возможность переключиться обратно.
            if (!file || file === 'manager.js') return

            install(file)
        })
}

Lampa.Lang.add({
    manager_title: {
        ru: 'Мои плагины',
        en: 'My plugins',
        uk: 'Мої плагіни'
    },
    manager_plugins: {
        ru: 'Плагины',
        en: 'Plugins',
        uk: 'Плагіни'
    },
    manager_source: {
        ru: 'Источник',
        en: 'Source',
        uk: 'Джерело'
    },
    manager_source_local: {
        ru: 'Локальный сервер',
        en: 'Local server',
        uk: 'Локальний сервер'
    },
    manager_source_descr: {
        ru: 'Откуда загружать плагины. Локальный сервер нужен для проверки свежей сборки без публикации',
        en: 'Where to load plugins from. Local server is for testing a fresh build without publishing',
        uk: 'Звідки завантажувати плагіни. Локальний сервер — для перевірки свіжої збірки без публікації'
    },
    manager_host: {
        ru: 'Адрес локального сервера',
        en: 'Local server address',
        uk: 'Адреса локального сервера'
    },
    manager_host_descr: {
        ru: 'Например 192.168.1.10:3000 — компьютер, где запущена сборка. Открывает плагины, которых нет в репозитории',
        en: 'For example 192.168.1.10:3000 — the machine running the build. Unlocks plugins that are not published',
        uk: 'Наприклад 192.168.1.10:3000 — комп’ютер зі складанням. Відкриває плагіни, яких немає в репозиторії'
    },
    manager_reload: {
        ru: 'Перезагрузить приложение',
        en: 'Restart the app',
        uk: 'Перезавантажити застосунок'
    },
    manager_reload_descr: {
        ru: 'Изменения вступают в силу после перезапуска',
        en: 'Changes take effect after a restart',
        uk: 'Зміни набувають чинності після перезапуску'
    },
    manager_need_reload: {
        ru: 'Готово. Перезагрузите приложение',
        en: 'Done. Restart the app',
        uk: 'Готово. Перезавантажте застосунок'
    },
    manager_installed: {
        ru: 'Установлен плагин',
        en: 'Plugin installed',
        uk: 'Встановлено плагін'
    }
})

if (window.appready) startPlugin()
else {
    Lampa.Listener.follow('app', (e) => {
        if (e.type === 'ready') startPlugin()
    })
}

// доступ для отладки из консоли
window.__manager = {
    catalog: () => catalog,
    reconcile: () => reconcile(catalog),
    titleOf,
    ourFile,
    installed,
    base,
    localBase
}

export default {}

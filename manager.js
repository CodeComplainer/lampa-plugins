(function () {
    'use strict';

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
    var REPO = 'https://codecomplainer.github.io/lampa-plugins/';
    var COMPONENT = 'manager';
    var MANIFEST = REPO + 'plugins.json';

    /**
     * Запасной список на случай, если манифест недоступен: без сети менеджер
     * всё равно должен показывать хоть что-то.
     */
    var FALLBACK = [{
      file: 'continue.js',
      name: 'Смотреть одной кнопкой',
      descr: 'Запуск нужной серии без выбора раздачи'
    }];
    var ICON = "<svg width=\"38\" height=\"38\" viewBox=\"0 0 38 38\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <rect x=\"2\" y=\"2\" width=\"14\" height=\"14\" rx=\"3\" stroke=\"white\" stroke-width=\"2.5\"/>\n    <rect x=\"22\" y=\"2\" width=\"14\" height=\"14\" rx=\"3\" stroke=\"white\" stroke-width=\"2.5\"/>\n    <rect x=\"2\" y=\"22\" width=\"14\" height=\"14\" rx=\"3\" stroke=\"white\" stroke-width=\"2.5\"/>\n    <path d=\"M29 22V36M22 29H36\" stroke=\"white\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n</svg>";
    var catalog = FALLBACK;
    function startPlugin() {
      if (window.plugin_manager_ready) return;
      window.plugin_manager_ready = true;
      Lampa.SettingsApi.addComponent({
        component: COMPONENT,
        icon: ICON,
        name: Lampa.Lang.translate('manager_title')
      });
      render(catalog);
      loadManifest(function (list) {
        catalog = list;

        // Сначала приводим список плагинов в соответствие манифесту, потом
        // рисуем настройки: иначе переключатель запомнит состояние «выключен»,
        // которое было до установки.
        reconcile(catalog);
        render(catalog);
      });

      // Список плагинов обновляется при каждом заходе в настройки: иначе новый
      // плагин появится на телевизоре только после перезапуска приложения.
      //
      // Момент — открытие главного экрана настроек, а не нашего раздела: наши
      // параметры собираются при создании раздела, и перерисовывать их, когда он
      // уже на экране, поздно. В свой раздел человек всё равно заходит отсюда.
      Lampa.Settings.listener.follow('open', function (e) {
        if (e.name !== 'main') return;
        loadManifest(function (list) {
          catalog = list;
          reconcile(catalog);
          render(catalog);
        });
      });
    }

    /**
     * Привести список плагинов в соответствие манифесту.
     *
     * Три вещи, которые человек не должен делать руками на телевизоре:
     * поставить появившийся плагин, переехать на переименованный и убрать
     * исчезнувший. Пультом это мучительно, а знаний, что плагин переименовали,
     * у человека вообще нет.
     *
     * Ключ `manager_seen` помнит, какие плагины менеджер уже предлагал. Без него
     * пришлось бы выбирать между «новые плагины не появляются» и «выключенные
     * возвращаются при каждом запуске».
     */
    function reconcile(list) {
      var seen = known();
      var added = [];
      list.forEach(function (item) {
        // Переименование: плагин тот же, файл другой. Старый убираем всегда,
        // а новый ставим, только если старый стоял — иначе это была бы
        // установка без спроса.
        var inherited = false;
        toArray(item.replaces).forEach(function (old) {
          var exist = installed(old);
          if (!exist) return;
          Lampa.Plugins.remove(exist);
          inherited = true;
        });
        var first = seen.indexOf(item.file) === -1;
        if (first) seen.push(item.file);
        if (available(item) && !installed(item.file) && (inherited || first && item["default"] !== false)) {
          install(item.file);
          added.push(item.name || item.file);
        }
      });

      // Плагин пропал из манифеста — убираем и у себя. Трогаем только свои
      // адреса: плагины, добавленные мимо менеджера, не наше дело.
      Lampa.Plugins.get().slice().forEach(function (plugin) {
        var file = ourFile(plugin.url);
        if (!file || file === 'manager.js') return;
        if (list.some(function (item) {
          return item.file === file;
        })) return;
        Lampa.Plugins.remove(plugin);
      });
      Lampa.Storage.set('manager_seen', seen);
      if (added.length) {
        Lampa.Noty.show(Lampa.Lang.translate('manager_installed') + ': ' + added.join(', '));
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
      var seen = Lampa.Storage.get('manager_seen', '');
      if (Array.isArray(seen)) return seen;
      return Lampa.Plugins.get().map(function (plugin) {
        return ourFile(plugin.url);
      }).filter(Boolean);
    }

    /**
     * Имя файла, если адрес наш. Чужие плагины остаются нетронутыми.
     */
    function ourFile(url) {
      var clean = (url + '').replace(/\?.*$/, '');
      if (clean.indexOf(REPO) !== 0 && clean.indexOf(base()) !== 0) return null;
      return clean.split('/').pop() || null;
    }

    /**
     * Плагин, помеченный `local`, живёт только на машине разработчика и в
     * репозиторий не публикуется — предлагать его при загрузке с GitHub нельзя,
     * там его просто нет.
     */
    function available(item) {
      return !item.local || Lampa.Storage.field('manager_source') === 'local';
    }
    function toArray(value) {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }
    function loadManifest(done) {
      var network = new Lampa.Reguest();
      network.silent(MANIFEST + '?ts=' + Date.now(), function (json) {
        if (Array.isArray(json) && json.length) done(json);
      }, function () {}, false, {
        dataType: 'json'
      });
    }

    /**
     * Настройки собираются заново каждый раз: список плагинов приходит из сети,
     * а параметры регистрируются статически.
     */
    function render(list) {
      Lampa.SettingsApi.removeParams(COMPONENT);
      Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {
          name: 'manager_source',
          type: 'select',
          values: {
            github: 'GitHub',
            local: Lampa.Lang.translate('manager_source_local')
          },
          "default": 'github'
        },
        field: {
          name: Lampa.Lang.translate('manager_source'),
          description: Lampa.Lang.translate('manager_source_descr')
        },
        onChange: function onChange() {
          reinstallAll();

          // перерисовываем, чтобы адреса под плагинами показали новый источник
          render(catalog);

          // экран настроек может быть уже закрыт — обновление тогда не нужно
          try {
            Lampa.Settings.update();
          } catch (_unused) {}
        }
      });
      Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {
          name: 'manager_local_host',
          type: 'input',
          values: '',
          placeholder: '192.168.1.10:3000',
          "default": ''
        },
        field: {
          name: Lampa.Lang.translate('manager_host'),
          description: Lampa.Lang.translate('manager_host_descr')
        },
        onChange: function onChange() {
          return reinstallAll();
        }
      });
      Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {
          name: 'manager_list_title',
          type: 'title'
        },
        field: {
          name: Lampa.Lang.translate('manager_plugins') + ' — ' + list.filter(available).length
        }
      });
      list.filter(available).forEach(function (item) {
        var name = 'manager_on_' + item.file;

        // Переключатель обязан показывать факт, а не то, что осталось в памяти
        // с прошлого запуска: плагин могли удалить или добавить мимо менеджера.
        Lampa.Storage.set(name, !!installed(item.file));
        Lampa.SettingsApi.addParam({
          component: COMPONENT,
          param: {
            name: name,
            type: 'trigger',
            "default": !!installed(item.file)
          },
          field: {
            name: item.name || item.file,
            // Показываем фактический адрес: по нему сразу видно, откуда
            // приедет плагин — из репозитория или с локальной сборки
            description: (item.descr || '') + describeSource(item.file)
          },
          onChange: function onChange(value) {
            if (value === true || value === 'true') install(item.file);else uninstall(item.file);
            Lampa.Noty.show(Lampa.Lang.translate('manager_need_reload'));
          }
        });
      });
      Lampa.SettingsApi.addParam({
        component: COMPONENT,
        param: {
          name: 'manager_reload',
          type: 'button'
        },
        field: {
          name: Lampa.Lang.translate('manager_reload'),
          description: Lampa.Lang.translate('manager_reload_descr')
        },
        onChange: function onChange() {
          return window.location.reload();
        }
      });
    }

    /**
     * Строка с адресом под названием плагина. Для установленного показываем адрес,
     * по которому он реально загружается — включая случай, когда он остался
     * с прежнего источника и ещё не переустановлен.
     */
    function describeSource(file) {
      var exist = installed(file);
      if (!exist) return '';
      var url = (exist.url + '').replace(/^https?:\/\//, '').replace(/\?.*$/, '');
      return '<div style="opacity:.5; margin-top:.3em">' + url + '</div>';
    }

    /** Откуда грузить плагины */
    function base() {
      if (Lampa.Storage.field('manager_source') !== 'local') return REPO;
      var host = (Lampa.Storage.get('manager_local_host', '') + '').trim();
      if (!host) return REPO;
      if (!/^https?:\/\//.test(host)) host = 'http://' + host;
      return host.replace(/\/+$/, '') + '/plugins/';
    }
    function urlFor(file) {
      return base() + file;
    }

    /**
     * Плагин ищем по имени файла, а не по полному адресу: адрес меняется вместе
     * с источником, а плагин остаётся тем же.
     */
    function installed(file) {
      return Lampa.Plugins.get().find(function (p) {
        return (p.url + '').indexOf('/' + file) >= 0;
      }) || null;
    }
    function install(file) {
      var exist = installed(file);
      if (exist && exist.url === urlFor(file)) return;
      if (exist) Lampa.Plugins.remove(exist);
      Lampa.Plugins.add({
        url: urlFor(file),
        status: 1
      });
    }
    function uninstall(file) {
      var exist = installed(file);
      if (exist) Lampa.Plugins.remove(exist);
    }

    /**
     * Смена источника: переставляем всё включённое на новые адреса.
     *
     * Плагины, которых в репозитории нет, при уходе с локального сервера
     * отключаются — иначе после переключения они остались бы в списке
     * с заведомо мёртвым адресом.
     */
    function reinstallAll() {
      catalog.forEach(function (item) {
        if (!installed(item.file)) return;
        if (available(item)) install(item.file);else uninstall(item.file);
      });
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
        ru: 'Например 192.168.1.10:3000 — компьютер, где запущена сборка',
        en: 'For example 192.168.1.10:3000 — the machine running the build',
        uk: 'Наприклад 192.168.1.10:3000 — комп’ютер зі складанням'
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
    });
    if (window.appready) startPlugin();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
      });
    }
    var manager = {};

    return manager;

})();

(function () {
    'use strict';

    /**
     * Имена ключей в localStorage — единственное место, где они записаны.
     *
     * Пространство у Lampa плоское: ни префиксов, ни namespace, ни разделения по
     * профилям. В нём живут ~155 ключей ядра и все ключи всех установленных
     * плагинов сразу. Поэтому наши имена начинаются с `cc_`: `continue` и `manager`
     * — обычные английские слова, и чужой плагин, взявший их же, молча испортил бы
     * данные. Заодно всё наше находится и чистится одним грепом.
     *
     * Схема: `cc_<плагин>_<что>`, общие для нескольких плагинов данные — `cc_watch_*`.
     *
     * Чего в именах быть не должно: подстрок `online_`, `file_view_` и `storage_`.
     * Штатная «Очистка кэша» стирает ключ, если такая подстрока встречается где
     * угодно внутри имени, а не только в начале
     * ([storage.js:288](src/core/storage/storage.js:288)).
     */

    var KEYS = {
      /** Память по тайтлу, общая: memory пишет, continue и subpeek читают */
      watch: 'cc_watch_memory',
      /**
       * Язык субтитров, выбранный последним — на всех тайтлах сразу.
       *
       * Нужен там, где по карточке ничего не известно: новый фильм, а человек
       * субтитры в нём ни разу не открывал. Язык меняют куда реже, чем тайтлы,
       * поэтому одно значение на всех — не упрощение, а точное описание привычки.
       */
      subs_lang: 'cc_watch_subs_lang',
      /**
       * Счётчик запусков раздач по студиям, с затуханием. Личный ключ continue:
       * толковать студии и подбирать раздачу — его работа.
       *
       * Выбор дорожки в плеере сюда не пишется. Его наблюдает memory и кладёт
       * в свою запись по карточке, а continue домешивает при чтении — так ни
       * один плагин не работает на другого.
       */
      voices: 'cc_continue_voices',
      /** Уже проверенные раздачи, чтобы не опрашивать их повторно */
      probe: 'cc_continue_probe',
      /** Отсекать ли экранки. Скрытый параметр, своего экрана настроек нет */
      no_cam: 'cc_continue_no_cam',
      /** Какие плагины менеджер уже предлагал */
      seen: 'cc_manager_seen',
      /** Источник плагинов: GitHub или локальный сервер */
      source: 'cc_manager_source',
      /** Адрес машины разработчика для локального режима */
      local_host: 'cc_manager_local_host',
      /** Префикс переключателя плагина, дальше идёт имя файла */
      plugin_on: 'cc_manager_on_'
    };
    var keys = {
      KEYS: KEYS
    };

    /**
     * Сопоставление аудиодорожек между раздачами.
     *
     * Индекс дорожки для этого не годится: в одной раздаче русская дорожка первая,
     * в другой третья. Поэтому запоминаем язык и название озвучки, а при следующем
     * запуске ищем максимально близкую.
     */

    /**
     * Приметы дорожки, по которым её можно узнать в другой раздаче.
     *
     * @param {Object} track - дорожка плеера
     * @returns {{lang: string, label: string}|null}
     */
    function describe(track) {
      if (!track) return null;
      var lang = language$1(track.language || track.lang || '');
      var label = clean(track.label || track.name || '');
      if (!lang && !label) return null;
      return {
        lang: lang,
        label: label
      };
    }

    /**
     * Приметы всего списка: языки в том же порядке.
     *
     * Нужны, чтобы понять, та ли это раздача. Названия дорожек приходят не от
     * плеера, а от стороннего плагина `tracks`, который дописывает `label`
     * в объекты дорожек. Он может отвалиться — у нас так и вышло, когда умер
     * домен `cub.red`, — и тогда от дорожки остаётся один язык, а двух русских
     * озвучек это не различает.
     *
     * Зато если список тот же, то и файл тот же, и номер дорожки в нём осмыслен.
     * Проверка дешёвая и честная: разошёлся порядок или число дорожек — значит
     * раздача другая, и номеру верить нельзя.
     *
     * @param {Array} tracks
     * @returns {string} например `ru,ru,en`
     */
    function shape(tracks) {
      return (tracks || []).filter(Boolean).map(function (track) {
        return language$1(track.language || track.lang || '');
      }).join(',');
    }

    /**
     * Код языка приходит в разном виде: в браузере двухбуквенный (`ru`),
     * на webOS трёхбуквенный (`rus`). Без приведения запись, сделанная на одном
     * устройстве, не совпала бы с дорожками на другом.
     */
    var LANGS = {
      rus: 'ru',
      ukr: 'uk',
      eng: 'en',
      kor: 'ko',
      jpn: 'ja',
      chi: 'zh',
      zho: 'zh',
      ger: 'de',
      deu: 'de',
      fre: 'fr',
      fra: 'fr',
      spa: 'es',
      ita: 'it',
      pol: 'pl',
      tur: 'tr'
    };
    function language$1(value) {
      var lang = clean(value);
      return LANGS[lang] || lang;
    }

    /**
     * Найти дорожку, наиболее похожую на запомненную.
     *
     * Совпадение по названию озвучки важнее языка: «Дубляж» и «LostFilm» — обе
     * русские, но человек выбирал конкретную.
     *
     * @param {Array} tracks - дорожки текущего файла
     * @param {Object} saved - результат describe() с прошлого раза
     * @returns {Object|null}
     */
    function match(tracks, saved) {
      var list = (tracks || []).filter(Boolean);
      if (!list.length || !saved) return null;
      var described = list.map(function (track) {
        return {
          track: track,
          about: describe(track)
        };
      });
      var best = null;
      var best_score = 0;
      described.forEach(function (item) {
        var score = compare(item.about, saved);
        if (score > best_score) {
          best_score = score;
          best = item.track;
        }
      });

      // По названию ничего не нашлось — 3 балла и выше даёт только совпадение
      // имени, всё что ниже держится на одном языке. Если список дорожек тот же,
      // что и в прошлый раз, значит это та же раздача, и номер точнее языка:
      // русских озвучек бывает две, и без номера берётся первая попавшаяся.
      if (best_score < 3 && byIndex(list, saved)) return byIndex(list, saved);
      return best;
    }

    /** Дорожка по запомненному номеру — только если список не изменился */
    function byIndex(list, saved) {
      if (typeof saved.index !== 'number' || !saved.shape) return null;
      if (saved.shape !== shape(list)) return null;
      return list[saved.index] || null;
    }

    /**
     * Насколько дорожка похожа на запомненную. Ноль означает «не подходит»:
     * лучше оставить выбор плеера, чем включить заведомо чужую озвучку.
     */
    function compare(about, saved) {
      if (!about) return 0;
      var same_lang = !!about.lang && about.lang === saved.lang;
      var same_label = !!about.label && about.label === saved.label;
      if (same_label && same_lang) return 4;
      if (same_label) return 3;

      // название могло записаться иначе, но одна строка входит в другую
      if (about.label && saved.label && (about.label.includes(saved.label) || saved.label.includes(about.label))) {
        return same_lang ? 3 : 2;
      }

      // язык тот же, а озвучку в прошлый раз не удалось опознать
      if (same_lang && !saved.label) return 2;
      if (same_lang) return 1;
      return 0;
    }

    /** Выбранная сейчас дорожка */
    function selected(tracks) {
      var list = (tracks || []).filter(Boolean);
      return list.find(function (track) {
        return track.selected;
      }) || list.find(function (track) {
        return track.enabled;
      }) || null;
    }

    /**
     * Переключение — та же последовательность, что делает штатная панель плеера:
     * снять признаки со всех, поставить выбранной и позвать её onSelect.
     */
    function apply(tracks, track) {
      if (!track) return false;
      var list = (tracks || []).filter(Boolean);
      list.forEach(function (item) {
        item.enabled = false;
        item.selected = false;
      });
      track.enabled = true;
      track.selected = true;
      if (typeof track.onSelect === 'function') track.onSelect(track);
      return true;
    }

    /* -------------------------------------------------------------- субтитры */

    /**
     * Дорожки субтитров живут по своим правилам: включённость обозначается полем
     * `mode`, а в списке может лежать псевдострока «Отключено» с индексом -1,
     * которую панель добавляет при первом открытии.
     */
    function realSubs(subs) {
      return (subs || []).filter(function (item) {
        return item && item.index !== -1;
      });
    }

    /**
     * Что выбрано сейчас. `null` — субтитры выключены, и это полноценный ответ:
     * человек мог отключить их намеренно.
     */
    function selectedSub(subs) {
      return realSubs(subs).find(function (item) {
        return item.selected || item.mode === 'showing';
      }) || null;
    }

    /**
     * Переключение повторяет последовательность штатной панели плеера
     * ([panel.js:427](src/interaction/player/panel.js:427)): снять режим со всех,
     * поставить выбранной и позвать её onSelect.
     *
     * Видимость переключает вызывающий: за неё отвечает Video.subsview.
     *
     * Выключение — отдельный случай. На webOS `mode` это не поле, а сеттер, и
     * реагирует он только на `showing` ([webos.js:76](src/interaction/player/webos.js:76)),
     * поэтому «выключить всё» там не выключает ничего. Выключением служит
     * псевдострока «Отключено» с индексом -1: её и выбираем.
     */
    function applySub(subs, track) {
      var list = subs || [];
      var target = track || list.find(function (item) {
        return item && item.index === -1;
      }) || null;
      list.forEach(function (item) {
        item.selected = false;
        if (item !== target) item.mode = 'disabled';
      });
      if (!target) return false;
      target.mode = 'showing';
      target.selected = true;
      if (typeof target.onSelect === 'function') target.onSelect(target);
      return !!track;
    }
    function matchSub(subs, saved) {
      return match(realSubs(subs), saved);
    }
    function clean(value) {
      return ((value || '') + '').toLowerCase().trim();
    }
    var match$1 = {
      describe: describe,
      shape: shape,
      match: match,
      compare: compare,
      selected: selected,
      apply: apply,
      selectedSub: selectedSub,
      applySub: applySub,
      matchSub: matchSub,
      realSubs: realSubs
    };

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

    var KEY = keys.KEYS.watch;

    /**
     * Сколько тайтлов помним.
     *
     * Хранить всё незачем: смысл памяти в том, чтобы человек, вернувшийся
     * к сериалу, попал в привычные настройки. Запись — около сотни байт,
     * так что потолок упирается в разумные ~20 КБ и дальше не растёт.
     */
    var LIMIT = 200;

    /** Сколько запросов на карточку оставляем в штатном списке уточнения */
    var CLARIFY_KEEP = 5;

    /**
     * Ключ — карточка целиком, а не отдельная серия: и озвучку, и название
     * для поиска выбирают на сериал, а не на каждый эпизод.
     */
    function cardID(card) {
      if (!card || !card.id) return null;
      var tv = card.number_of_seasons || card.original_name || card.first_air_date;
      return card.id + ':' + (tv ? 'tv' : 'movie');
    }

    /**
     * @param {Object} storage - Lampa.Storage или его подмена в тестах
     */
    function create$1(storage) {
      function all() {
        return storage.cache(KEY, LIMIT, {});
      }

      /**
       * Storage.cache вытесняет по порядку вставки, а не по обращению, поэтому
       * запись перекладывается в конец при каждом использовании — иначе давно
       * заведённый, но активно смотримый сериал вытеснился бы первым.
       */
      function touch(map, key) {
        var keys = Object.keys(map);

        // уже последняя — переписывать хранилище незачем
        if (keys[keys.length - 1] === key) return;
        var rec = map[key];
        delete map[key];
        map[key] = rec;
        storage.set(KEY, map);
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
        var key = cardID(card);
        if (!key) return null;
        var map = all();
        var rec = map[key];
        if (!rec) return null;
        touch(map, key);
        return rec;
      }
      function set(card, patch) {
        var key = cardID(card);
        if (!key || !patch) return null;
        var map = all();
        var rec = map[key] || {};
        Object.keys(patch).forEach(function (name) {
          if (patch[name] !== undefined && patch[name] !== null) rec[name] = patch[name];
        });
        rec.t = patch.t || Date.now();
        delete map[key];
        map[key] = rec;
        storage.set(KEY, map);
        return rec;
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
        if (!card || !card.id || !query) return;
        var all = storage.get('user_clarifys', '{}') || {};
        var list = (all[card.id] || []).filter(function (item) {
          return item !== query;
        });
        list.push(query);
        all[card.id] = list.slice(-(keep || CLARIFY_KEEP));
        storage.set('user_clarifys', all);
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
        if (!card || !card.id) return null;
        var list = (storage.get('user_clarifys', '{}') || {})[card.id] || [];
        return list[list.length - 1] || null;
      }
      return {
        get: get,
        set: set,
        clarify: clarify,
        lastClarify: lastClarify,
        cardID: cardID,
        KEY: KEY,
        LIMIT: LIMIT
      };
    }
    var store = {
      create: create$1,
      cardID: cardID,
      KEY: KEY,
      LIMIT: LIMIT
    };

    /**
     * Отличить серию одиночных нажатий от удержания кнопки.
     *
     * Отдельного режима «удержание» в Lampa нет. Удержание — это поток `keydown`
     * от автоповтора ОС, который keypad троттлит до десяти в секунду
     * ([keypad.js:51](src/core/keypad.js:51)); каждое срабатывание зовёт
     * `Video.rewind`, шаг копится с ускорением, а настоящий seek случается один раз
     * через секунду после отпускания ([video.js:1349](src/interaction/player/video.js:1349)).
     *
     * Различие ровно одно: между двумя соседними перемотками кнопку либо отпускали,
     * либо нет. Считать нажатия бесполезно — три быстрых тычка дают тот же счёт,
     * что треть секунды удержания.
     *
     * Важно, что вопрос задаётся **между тиками**, а не «был ли автоповтор вообще».
     * Глобальный признак копился бы с обычной навигации по меню: к моменту, когда
     * человек дойдёт до плеера и нажмёт «влево», он давно взведён, и вспышки не
     * будет никогда. Проверено на телевизоре — именно так и получилось.
     */

    /**
     * Промежуток, ниже которого тик считается автоповтором, если отпускания не было.
     *
     * Подстраховка для кнопок панели и мыши: там `keyup` не приходит вовсе, и одного
     * признака отпускания не хватило бы. Автоповтор идёт не чаще чем раз в 100 мс
     * (троттл keypad), человек столько между тычками не выдаёт.
     */
    var REPEAT_GAP = 180;
    function create() {
      /** Кнопку отпускали с прошлой перемотки */
      var released = true;

      /** В текущей серии был автоповтор */
      var repeated = false;

      /** Сколько раз перематывали */
      var ticks = 0;

      /** Когда была прошлая перемотка */
      var last = 0;
      return {
        /**
         * Отпускание кнопки. Само нажатие не интересует: важно не то, сколько
         * раз нажали, а было ли отпускание между перемотками.
         */
        up: function up() {
          released = true;
        },
        /**
         * Перемотка. Время передаётся снаружи, чтобы модуль оставался чистым
         * и проверялся тестами без часов.
         *
         * @param {number} now - метка времени, обычно Date.now()
         */
        tick: function tick(now) {
          if (ticks && !released && now - last < REPEAT_GAP) repeated = true;
          released = false;
          last = now;
          ticks++;
        },
        /**
         * Серия закончилась: снаружи это таймер, который сбрасывается на каждом
         * тике. Всё, что копилось внутри серии, обнуляется.
         *
         * @returns {{hold: boolean, ticks: number}}
         */
        end: function end() {
          var result = {
            hold: repeated,
            ticks: ticks
          };
          released = true;
          repeated = false;
          ticks = 0;
          return result;
        },
        /** Новый файл или закрытый плеер: прошлые нажатия к делу не относятся */reset: function reset() {
          released = true;
          repeated = false;
          ticks = 0;
          last = 0;
        },
        state: function state() {
          return {
            released: released,
            repeated: repeated,
            ticks: ticks
          };
        }
      };
    }
    var burst = {
      create: create,
      REPEAT_GAP: REPEAT_GAP
    };

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
      if (!match$1.realSubs(subs).length) return null;
      var known = from || {};

      // Включал руками прямо сейчас — сомнений нет
      if (known.chosen) return match$1.matchSub(subs, known.chosen);

      // Запомнено по этой карточке. Неважно, включены ли субтитры сейчас:
      // «какие» и «включены ли» — разные вопросы, и нас интересует первый.
      if (known.remembered) {
        return match$1.matchSub(subs, {
          lang: known.remembered.l || '',
          label: known.remembered.n || ''
        });
      }

      // Остался только язык — тогда годится любая дорожка на нём. Пустое название
      // в запросе именно это и означает: совпадение по языку достаточно.
      if (!known.language) return null;
      return match$1.matchSub(subs, {
        lang: known.language,
        label: ''
      });
    }
    var choose$1 = {
      choose: choose
    };

    /**
     * Субтитры на время перемотки назад.
     *
     * Не расслышал реплику — отмотал — прочитал. Как на Apple TV: короткая перемотка
     * назад показывает субтитры ровно на тот же срок, на который отмотали, и гасит
     * их сама. Лезть в меню субтитров пультом ради одной фразы несоизмеримо дороже.
     *
     * Целевая платформа — LG webOS, где субтитры рисует прошивка, а не Lampa.
     *
     * Чего плагин не делает: не трогает шаг перемотки (это штатная настройка
     * `player_rewind`, от неё же берётся длительность) и не угадывает язык.
     * Включить не ту дорожку хуже, чем не включить ничего.
     */

    /**
     * Через сколько после последней перемотки считать серию законченной.
     *
     * Штатный seek происходит через 1000 мс после последнего нажатия
     * ([video.js:1361](src/interaction/player/video.js:1361)) — ждём чуть дольше,
     * чтобы прочитать уже новую позицию, а не старую.
     */
    var SERIES_END = 1200;

    /** Если штатная настройка почему-то пуста */
    var DEFAULT_SECONDS = 10;

    /** Меньший сдвиг считаем дрожанием, а не перемоткой назад */
    var MIN_BACK = 0.5;

    /** Список дорожек субтитров текущего файла */
    var subs = null;

    /**
     * Файл идёт через нативный плеер webOS.
     *
     * Определяется по факту прихода `webos_subs`, а не по `Lampa.Platform`: на том
     * же телевизоре нативная ветка не включается, если источник отдал `voiceovers`
     * ([video.js:979](src/interaction/player/video.js:979)).
     */
    var _native = false;

    /** Дорожка, которую человек включал сам за это воспроизведение */
    var chosen = null;

    /** Текущая серия перемоток: {timer, from} */
    var series = null;

    /** Идущая вспышка: {timer} */
    var flash = null;
    var taps = burst.create();
    function startPlugin() {
      if (window.plugin_subpeek_ready) return;
      window.plugin_subpeek_ready = true;
      follow();
    }
    function follow() {
      // Новая серия приходит без `destroy`, поэтому гасим и здесь: иначе таймер
      // вспышки сработал бы уже поверх следующего файла.
      Lampa.Player.listener.follow('start', function () {
        guard('start', function () {
          stop();
          forget();
        });
      });
      Lampa.Player.listener.follow('destroy', function () {
        guard('destroy', function () {
          stop();
          forget();
        });
      });

      // Списки приходят разными событиями и на разных платформах — разными
      // по смыслу: в браузере это дорожки, которые рисует Lampa, на телевизоре —
      // те, что рисует прошивка.
      Lampa.PlayerVideo.listener.follow('subs', function (e) {
        guard('subs', function () {
          if (!_native) subs = e.subs;
        });
      });
      Lampa.PlayerVideo.listener.follow('webos_subs', function (e) {
        guard('webos subs', function () {
          subs = e.subs;
          _native = true;
        });
      });

      // Каждый вызов перемотки, включая кнопки панели. Клик и свайп по таймлайну
      // идут мимо — они зовут `Video.to`, который этого события не шлёт, и
      // большие прыжки мышью отсекаются сами.
      Lampa.PlayerVideo.listener.follow('rewind', function () {
        guard('rewind', tick);
      });

      // Отсчёт до гашения ведём по таймлайну, а не по часам, поэтому нужен тик
      // самого воспроизведения: на паузе он не приходит — и правильно, субтитры
      // должны дождаться, пока фильм пойдёт дальше.
      Lampa.PlayerVideo.listener.follow('timeupdate', function () {
        guard('timeupdate', watchFlash);
      });

      // Нажатие не отслеживаем: важно не сколько раз нажали, а отпускали ли
      // кнопку между двумя перемотками.
      Lampa.Keypad.listener.follow('keyup', function () {
        taps.up();
      });

      // Гасим до того, как плеер закроется: канал `back` уходит в шину раньше,
      // чем keypad зовёт `Controller.back()` ([keypad.js:178](src/core/keypad.js:178)).
      // Иначе memory успела бы записать нашу вспышку как выбор человека.
      Lampa.Keypad.listener.follow('back', function () {
        guard('back', stop);
      });

      // Человек сам выбрал дорожку в панели. `selected` там выставляется до
      // отправки события ([panel.js:436](src/interaction/player/panel.js:436)),
      // так что читать можно сразу.
      Lampa.PlayerPanel.listener.follow('subsview', function (e) {
        guard('subsview', function () {
          // Человек взялся за субтитры сам — наш таймер больше не при делах.
          // Именно отпустить, а не погасить: он мог их только что включить.
          release();
          if (!e.status) return;
          var about = match$1.describe(match$1.selectedSub(subs));
          if (!about) return;
          chosen = about;

          // Плагин обязан работать и без memory, поэтому общий язык
          // записывает тоже: кто увидел выбор, тот и запомнил.
          if (about.lang) Lampa.Storage.set(keys.KEYS.subs_lang, about.lang);
        });
      });
    }

    /* ------------------------------------------------------------------ серия */

    function tick() {
      taps.tick(Date.now());
      if (!series) series = {
        timer: null,
        from: position()
      };
      clearTimeout(series.timer);
      series.timer = setTimeout(function () {
        guard('series', finish);
      }, SERIES_END);
    }

    /**
     * Серия закончилась — решаем, была ли это короткая перемотка назад.
     *
     * Направление и величину берём по факту, из позиции до и после: сложить их
     * из числа нажатий нельзя — штатный шаг растёт с ускорением, а вперёд можно
     * ещё и перепрыгнуть рекламный сегмент.
     */
    function finish() {
      var info = taps.end();
      var from = series.from;
      series = null;
      if (info.hold) return;
      var back = from - position();
      if (back < MIN_BACK) return;

      // перемотали ещё раз, пока субтитры были на экране — просто продлеваем
      if (flash) return show();
      if (match$1.selectedSub(subs)) return;
      var wanted = pick();
      if (!wanted) return;
      match$1.applySub(subs, wanted);

      // На webOS видимостью управляет прошивка, и `subsview` до неё не доходит:
      // он прячет DOM-слой Lampa, а субтитры рисуются поверх видеоплоскости.
      if (!_native) Lampa.PlayerVideo.subsview(true);
      show();
    }

    /**
     * Завести или продлить показ.
     *
     * Отсчёт идёт по таймлайну плеера, а не по часам: субтитры держатся, пока
     * воспроизведение не пройдёт положенные секунды **с текущего места**. Часы
     * тут врут — на паузе они идут, а фильм стоит, и субтитры погасли бы у
     * человека, который отмотал и задумался. Замедление и прыжок вперёд ломали
     * бы отсчёт так же.
     *
     * Новая перемотка не продлевает старый отрезок, а назначает новый: точка
     * отсчёта — то место, куда попали сейчас.
     */
    function show() {
      flash = {
        until: position() + seconds()
      };
    }

    /** Пора ли гасить: проверяется на каждом `timeupdate` */
    function watchFlash() {
      if (!flash || position() < flash.until) return;
      stop();
    }

    /**
     * Погасить и вернуть всё как было.
     *
     * Именно вернуть, а не оставить дорожку выбранной «на потом»: memory на закрытии
     * плеера считает дорожку выбранной в том числе по `mode === 'showing'`
     * (match.js: selectedSub) и запомнила бы, что человек смотрит с субтитрами.
     */
    function stop() {
      if (!release()) return;
      match$1.applySub(subs, null);
      if (!_native) Lampa.PlayerVideo.subsview(false);
    }

    /**
     * Перестать следить за вспышкой, ничего не переключая.
     *
     * @returns {boolean} вспышка была
     */
    function release() {
      if (!flash) return false;
      flash = null;
      return true;
    }

    /* ---------------------------------------------------------------- дорожка */

    /**
     * Что показывать. Сам отбор — в choose.js, здесь только сбор того, что о
     * человеке известно: за этими тремя источниками стоит хранилище и активность,
     * а решение должно проверяться тестами без запущенного приложения.
     */
    function pick() {
      return choose$1.choose(subs, {
        chosen: chosen,
        remembered: remembered(),
        language: language()
      });
    }

    /**
     * Дорожка, запомненная memory по текущей карточке.
     *
     * Читаем общий ключ напрямую, а не через `store.create`: тот при чтении
     * перекладывает запись в конец и пишет хранилище, а нам нужно только взглянуть.
     * Поле `s` отвечает на вопрос «какие субтитры», а не «включены ли» — на второй
     * отвечает `so`, и нас он не касается: мы включаем на время, а не насовсем.
     */
    function remembered() {
      var card = cardOf();
      if (!card) return null;
      var key = store.cardID(card);
      if (!key) return null;
      var rec = Lampa.Storage.cache(store.KEY, store.LIMIT, {})[key];
      if (!rec || !rec.s) return null;
      return rec.s.l || rec.s.n ? rec.s : null;
    }

    /** Последний язык субтитров — общий на все тайтлы */
    function language() {
      var saved = Lampa.Storage.get(keys.KEYS.subs_lang, '');
      return saved ? saved + '' : '';
    }
    function cardOf() {
      var active = Lampa.Activity.active() || {};
      return active.movie || active.card || null;
    }

    /* ------------------------------------------------------------------ общее */

    /** Сколько секунд держать субтитры: столько же, на сколько отматывают */
    function seconds() {
      var value = parseInt(Lampa.Storage.field('player_rewind'), 10);
      return value > 0 ? value : DEFAULT_SECONDS;
    }
    function position() {
      var video = Lampa.PlayerVideo.video();
      return video && video.currentTime || 0;
    }

    /** Новый файл: чужие нажатия и чужие дорожки к нему отношения не имеют */
    function forget() {
      if (series) clearTimeout(series.timer);
      subs = null;
      _native = false;
      chosen = null;
      series = null;
      taps.reset();
    }

    /** Исключение в подписчике не должно ронять плеер */
    function guard(where, run) {
      try {
        run();
      } catch (err) {
        console.error('Subpeek', where + ' error:', err);
      }
    }

    // Плагин работает молча и своих строк не имеет: он показывает субтитры,
    // которые человек и так выбирал сам, и объявлять об этом незачем.

    if (window.appready) startPlugin();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
      });
    }

    // доступ для отладки из консоли
    window.__subpeek = {
      burst: taps,
      choose: choose$1,
      pick: pick,
      state: function state() {
        return {
          subs: subs,
          "native": _native,
          chosen: chosen,
          flash: !!flash,
          series: !!series
        };
      }
    };
    var subpeek = {
      burst: burst
    };

    return subpeek;

})();

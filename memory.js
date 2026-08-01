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
      var lang = language(track.language || track.lang || '');
      var label = clean$1(track.label || track.name || '');
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
        return language(track.language || track.lang || '');
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
    function language(value) {
      var lang = clean$1(value);
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
    function clean$1(value) {
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
     * Заметить, что выбор дорожки или субтитров сменился.
     *
     * Ждать закрытия плеера нельзя: события `destroy` не будет, если телевизор
     * выключили кнопкой, приложение сняли или устройство ушло в сон, — и выбор,
     * сделанный за весь вечер, пропадал.
     *
     * **Объекты плеера при этом не трогаем.** Была попытка подменять у них
     * `onSelect` — панель зовёт его после выбора, и поле выглядит как оставленная
     * для плагинов зацепка. На телевизоре это дважды подвесило список дорожек:
     * он схлопывался, а фокус оставался на нём, и из плеера было не выйти.
     * Причину поймать не удалось, но менять чужие структуры ради удобства —
     * плохой размен: цена ошибки тут не «фича не сработала», а «телевизор завис».
     *
     * Поэтому наблюдаем со стороны: раз в несколько секунд смотрим, что выбрано,
     * и реагируем только на смену. Заодно ловится и выбор, сделанный самим плеером,
     * — через `onSelect` он не проходил вовсе.
     */

    function create$1() {
      /** Приметы того, что было выбрано в прошлый раз */
      var last = '';

      /** Первое наблюдение уже было */
      var primed = false;
      return {
        /**
         * @param {Object|null} about - результат describe() по выбранному
         * @returns {Object|null} то же самое, если выбор сменился, иначе null
         */
        check: function check(about) {
          var sign = about ? (about.lang || '') + '|' + (about.label || '') : '';

          // Первое наблюдение — точка отсчёта, а не решение. Дорожку в начале
          // файла ставит плеер, и засчитывать её как выбор человека нельзя:
          // рейтинг студий раздувался бы просто от того, что кино включили.
          if (!primed) {
            primed = true;
            last = sign;
            return null;
          }

          // Пустой выбор — тоже не решение: на webOS плеер не помечает
          // дорожку, которую поставил сам, и отличить «ничего не выбрано»
          // от «выбрали и не сказали» невозможно.
          if (!sign || sign === last) return null;
          last = sign;
          return about;
        },
        /** Новый файл: прошлый выбор к нему отношения не имеет */reset: function reset() {
          last = '';
          primed = false;
        },
        state: function state() {
          return {
            last: last,
            primed: primed
          };
        }
      };
    }
    var watch = {
      create: create$1
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
    function create(storage) {
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
      create: create,
      cardID: cardID,
      KEY: KEY,
      LIMIT: LIMIT
    };

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
      opts = opts || {};
      var out = [];
      var seen = {};
      function push(query, clarification) {
        query = clean(query);
        if (!query) return;
        var low = query.toLowerCase();
        if (seen[low]) return;
        seen[low] = true;
        out.push({
          query: query,
          clarification: !!clarification
        });
      }

      // Название, которым раздача нашлась в прошлый раз, — самое надёжное:
      // человек уже смотрел этот тайтл именно по нему.
      push(opts.remembered, true);
      push(primary(card, opts.parse_lang), false);
      push(title(card), false);
      push(original(card), false);
      alternatives(card, opts.lang).forEach(function (name) {
        push(name, true);
      });
      return out;
    }

    /**
     * Запрос, который строит штатная кнопка торрентов
     * ([full/start/torrents.js:14](src/components/full/start/torrents.js:14)).
     *
     * Повторяем её точь-в-точь: если человек привык, что обычный список раздач
     * что-то находит, кнопка «Смотреть» обязана находить то же самое.
     */
    function primary(card, parse_lang) {
      var lg = title(card);
      var df = original(card);
      var year = yearOf(card);
      var combinations = {
        df: df,
        df_year: df + ' ' + year,
        df_lg: df + ' ' + lg,
        df_lg_year: df + ' ' + lg + ' ' + year,
        lg: lg,
        lg_year: lg + ' ' + year,
        lg_df: lg + ' ' + df,
        lg_df_year: lg + ' ' + df + ' ' + year
      };
      return combinations[parse_lang || 'df'] || df || lg;
    }

    /**
     * Стоит ли запоминать название.
     *
     * То, что и так строится из карточки, хранить незачем: место в памяти
     * ограничено, и занимать его очевидным — значит вытеснять полезное.
     */
    function worth(card, query, parse_lang) {
      return !!clean(query) && clean(query) !== primary(card, parse_lang);
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
      var block = card && card.alternative_titles;
      if (!block) return [];
      var list = block.results || block.titles || [];
      var own = [];
      var english = [];
      list.forEach(function (item) {
        var code = ((item.iso_3166_1 || '') + '').toLowerCase();
        if (lang && code === lang) own.push(item.title);else if (code === 'us') english.push(item.title);
      });
      return own.concat(english);
    }
    function title(card) {
      return clean(card && (card.title || card.name) || '');
    }
    function original(card) {
      return clean(card && (card.original_title || card.original_name) || '');
    }
    function yearOf(card) {
      return ((card && (card.first_air_date || card.release_date) || '0000') + '').slice(0, 4);
    }
    function clean(value) {
      return ((value || '') + '').trim();
    }
    var titles = {
      candidates: candidates,
      primary: primary,
      alternatives: alternatives,
      worth: worth
    };

    /**
     * «Память просмотра» — тайтл включается так же, как в прошлый раз.
     *
     * Помнит по каждой карточке название, которым реально нашлись раздачи,
     * и аудиодорожку, которую в итоге слушали. Работает при любом запуске плеера
     * и на обычном экране торрентов, а не только через кнопку «Смотреть»:
     * поэтому это отдельный плагин, а не часть continue.
     *
     * Данными плагины делятся через общее хранилище, кодом — нет.
     */

    /** Что сейчас играет: карточка и список дорожек текущего файла */
    var current = null;
    var memory = null;
    function startPlugin() {
      if (window.plugin_memory_ready) return;
      window.plugin_memory_ready = true;
      memory = store.create(Lampa.Storage);
      followAudio();
      followSearch();
    }

    /* ---------------------------------------------------------------- дорожки */

    function followAudio() {
      Lampa.Player.listener.follow('start', function (data) {
        current = {
          card: cardOf(data),
          tracks: null,
          subs: null
        };
        seen.reset();
      });

      // Списки дорожек известны только после открытия файла, поэтому переключаем
      // здесь, а не параметрами запуска: там нужны индексы, а они между раздачами
      // разъезжаются.
      Lampa.PlayerVideo.listener.follow('tracks', function (e) {
        try {
          onTracks(e.tracks);
        } catch (err) {
          console.error('Memory', 'tracks error:', err);
        }
      });
      Lampa.PlayerVideo.listener.follow('subs', function (e) {
        try {
          onSubs(e.subs);
        } catch (err) {
          console.error('Memory', 'subs error:', err);
        }
      });

      // На webOS событий tracks и subs не бывает вовсе: плеер обнуляет список
      // и уходит в нативную ветку ([video.js:649](src/interaction/player/video.js:649)),
      // а дорожки приезжают отдельными событиями и попадают сразу в панель.
      // Без этих подписок на телевизоре плагин молчал бы, ничего не восстанавливая.
      Lampa.PlayerVideo.listener.follow('webos_tracks', function (e) {
        try {
          onWebosTracks(e.tracks);
        } catch (err) {
          console.error('Memory', 'webos tracks error:', err);
        }
      });
      Lampa.PlayerVideo.listener.follow('webos_subs', function (e) {
        try {
          onWebosSubs(e.subs);
        } catch (err) {
          console.error('Memory', 'webos subs error:', err);
        }
      });
      Lampa.PlayerVideo.listener.follow('timeupdate', function () {
        try {
          lookAtTracks();
        } catch (err) {
          console.error('Memory', 'track watch error:', err);
        }
      });

      // Субтитры панель объявляет сама, отдельной зацепки не нужно. Событие
      // приходит уже после того, как выставлен `selected` ([panel.js:436]).
      Lampa.PlayerPanel.listener.follow('subsview', function () {
        try {
          rememberSubs();
        } catch (err) {
          console.error('Memory', 'subs save error:', err);
        }
      });
      Lampa.Player.listener.follow('destroy', function () {
        try {
          rememberTrack();
          rememberSubs();
        } catch (err) {
          console.error('Memory', 'save error:', err);
        }
        current = null;
      });
    }

    /**
     * Записать выбор дорожки сразу, а не только на закрытии плеера.
     *
     * Едем на том же событии, на котором Lampa обновляет позицию просмотра
     * ([player.js:137](src/interaction/player.js:137)): `timeupdate` приходит
     * примерно раз в секунду. Своего таймера заводить незачем — этот уже тикает
     * ровно тогда, когда идёт воспроизведение, и замолкает на паузе.
     */
    var WATCH_EVERY = 3000;
    var seen = watch.create();
    var looked = 0;
    function lookAtTracks() {
      if (!current || !current.tracks || current.tracks.length < 2) return;
      var now = Date.now();
      if (now - looked < WATCH_EVERY) return;
      looked = now;
      if (!seen.check(match$1.describe(match$1.selected(current.tracks)))) return;
      rememberTrack();
    }
    function onTracks(tracks) {
      if (!current) current = {
        card: cardOf(null),
        tracks: null
      };
      current.tracks = tracks;

      // выбирать не из чего
      if (!tracks || tracks.length < 2) return;
      var rec = current.card && memory.get(current.card);
      if (!rec || !rec.a) return;
      var wanted = match$1.match(tracks, savedTrack(rec.a));
      if (!wanted || wanted === match$1.selected(tracks)) return;

      // Молча: плагин восстанавливает то, что человек сам и выбрал в прошлый раз,
      // сообщать тут не о чем — а всплывающая плашка в начале каждой серии мешает.
      match$1.apply(tracks, wanted);
    }

    /**
     * Сохраняем то, что реально осталось выбранным к концу просмотра — неважно,
     * переключил человек дорожку сам или её выбрал плеер.
     */
    function rememberTrack() {
      if (!current || !current.card || !current.tracks || current.tracks.length < 2) return;
      var chosen = match$1.selected(current.tracks);
      var about = match$1.describe(chosen);
      if (!about) return;
      memory.set(current.card, {
        a: {
          l: about.lang,
          n: about.label,
          // Номер дорожки и приметы списка. Названия приходят от стороннего
          // плагина `tracks`, а он может быть не установлен — тогда от двух
          // русских озвучек остаётся один язык, и различить их нечем. Но если
          // список тот же, то и раздача та же, и номер точен.
          i: current.tracks.indexOf(chosen),
          k: match$1.shape(current.tracks)
        }
      });
    }

    /** Запомненное о дорожке в том виде, в каком его ждёт сопоставление */
    function savedTrack(a) {
      return {
        lang: a.l || '',
        label: a.n || '',
        index: a.i,
        shape: a.k || ''
      };
    }

    /**
     * Субтитры.
     *
     * Выключенные субтитры — такое же осознанное решение, как выбранные, поэтому
     * «выключено» хранится явно. Иначе при следующем запуске сработала бы штатная
     * настройка «включать субтитры сразу», и их пришлось бы выключать каждую серию.
     *
     * Хранятся два разных факта: `so` — включены ли субтитры, `s` — какие именно
     * выбирали. Второе живёт дольше первого. Выключив субтитры, человек не
     * забывает, какие они были, и это знание нужно другим плагинам — subpeek
     * показывает ту же дорожку на время перемотки назад.
     */
    function onSubs(subs) {
      if (!current) current = {
        card: cardOf(null),
        tracks: null,
        subs: null
      };
      current.subs = subs;
      var rec = current.card && memory.get(current.card);
      if (!rec || rec.so === undefined) return;
      applySubs(subs, rec);
    }
    function applySubs(subs, rec) {
      // Выключено. Проверять текущее состояние нельзя: в этот момент плеер ещё
      // не показал своё, а через мгновение покажет.
      if (!rec.so) {
        match$1.applySub(subs, null);
        Lampa.PlayerVideo.subsview(false);
        return;
      }
      var wanted = rec.s && match$1.matchSub(subs, {
        lang: rec.s.l || '',
        label: rec.s.n || ''
      });
      if (!wanted || wanted === match$1.selectedSub(subs)) return;
      match$1.applySub(subs, wanted);
      Lampa.PlayerVideo.subsview(true);
    }

    /* ------------------------------------------------------------------ webOS */

    /**
     * На телевизоре выбор не применяется руками, а кладётся в `params` плеера.
     *
     * У Lampa для этого есть свой механизм: `saveParams` запоминает выбранные
     * дорожку и субтитры, а `webosLoadTracks`/`webosLoadSubs` применяют их при
     * следующем запуске — и только если там пусто, включают субтитры по штатной
     * настройке ([video.js:189](src/interaction/player/video.js:189)).
     *
     * Мы просто заполняем `params` до того, как плеер до него дойдёт: списки
     * приезжают отдельными событиями раньше, чем плеер их применяет. Так выбор
     * ставит сам плеер, одним движением — без гонки и без двух галочек разом,
     * которые получались, когда две стороны правили список независимо.
     */
    function params() {
      return Lampa.PlayerVideo.saveParams();
    }
    function onWebosTracks(tracks) {
      if (!current) current = {
        card: cardOf(null),
        tracks: null,
        subs: null
      };
      current.tracks = tracks;
      if (!tracks || tracks.length < 2) return;
      var rec = current.card && memory.get(current.card);
      if (!rec || !rec.a) return;
      var wanted = match$1.match(tracks, savedTrack(rec.a));
      if (!wanted) return;

      // здесь ждут порядковый номер в списке
      params().track = tracks.indexOf(wanted);
    }
    function onWebosSubs(subs) {
      if (!current) current = {
        card: cardOf(null),
        tracks: null,
        subs: null
      };
      current.subs = subs;
      if (!subs || !subs.length) return;
      var rec = current.card && memory.get(current.card);
      if (!rec || rec.so === undefined) return;
      var wanted = rec.so && rec.s ? match$1.matchSub(subs, {
        lang: rec.s.l || '',
        label: rec.s.n || ''
      }) : null;

      // а здесь — поле index, где -1 означает «Отключено»
      params().sub = wanted ? wanted.index : -1;
    }
    function rememberSubs() {
      if (!current || !current.card || !current.subs) return;

      // выбирать было не из чего — решения человека тут нет
      if (!match$1.realSubs(current.subs).length) return;
      var chosen = match$1.selectedSub(current.subs);
      var about = chosen && match$1.describe(chosen);

      // Выключение записывает только `so`: поле `s` остаётся нетронутым, и память
      // о выбранной когда-то дорожке переживает выключение.
      memory.set(current.card, about ? {
        so: true,
        s: {
          l: about.lang,
          n: about.label
        }
      } : {
        so: false
      });

      // Язык субтитров человек меняет куда реже, чем тайтлы, поэтому последний
      // выбранный держим ещё и общим — он выручает на карточке, где своей записи
      // ещё нет.
      if (about && about.lang) Lampa.Storage.set(keys.KEYS.subs_lang, about.lang);
    }

    /* --------------------------------------------------------------- название */

    function followSearch() {
      // Подставляем запомненное название до того, как компонент начнёт поиск:
      // событие init приходит после создания компонента, но до его initialize.
      Lampa.Listener.follow('activity', function (e) {
        if (e.component !== 'torrents' || e.type !== 'init') return;
        try {
          applyQuery(e.object);
        } catch (err) {
          console.error('Memory', 'query error:', err);
        }
      });

      // Запоминаем название не по факту поиска, а по факту запуска файла:
      // «нашлось» и «это то, что нужно» — разные вещи.
      Lampa.Listener.follow('torrent_file', function (e) {
        if (e.type !== 'onenter') return;
        try {
          var active = Lampa.Activity.active() || {};
          if (active.component === 'torrents') rememberQuery(active.movie, active.search);
        } catch (err) {
          console.error('Memory', 'remember error:', err);
        }
      });
    }
    function applyQuery(object) {
      // человек уточняет название прямо сейчас — его выбор важнее запомненного
      if (!object || !object.movie || object.clarification) return;
      var rec = memory.get(object.movie);
      var query = rec && rec.q || memory.lastClarify(object.movie);
      if (!query || query === object.search) return;
      object.search = query;
      object.clarification = true;
    }
    function rememberQuery(card, query) {
      if (!card || !titles.worth(card, query, Lampa.Storage.field('parse_lang'))) return;
      memory.set(card, {
        q: query
      });
      memory.clarify(card, query);
    }

    /* ------------------------------------------------------------------ общее */

    function cardOf(data) {
      if (data && data.card) return data.card;
      var active = Lampa.Activity.active() || {};
      return active.movie || active.card || null;
    }

    // Плагин работает молча и своих строк не имеет: он лишь возвращает то,
    // что человек выбрал сам, и рассказывать об этом каждую серию незачем.

    if (window.appready) startPlugin();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
      });
    }

    // доступ для отладки из консоли
    window.__memory = {
      match: match$1,
      store: store,
      titles: titles,
      get: function get() {
        return memory;
      }
    };
    var memory$1 = {
      match: match$1,
      store: store,
      titles: titles
    };

    return memory$1;

})();

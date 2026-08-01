(function () {
    'use strict';

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
      return best;
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

    var KEY = 'watch_memory';

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
       * Перенос из ключей, которыми пользовались отдельные плагины до объединения.
       *
       * Разбирается один раз: после переноса старые ключи удаляются, и повторный
       * вызов уже ничего не находит.
       *
       * Внимание на `q` у continue_last — там лежало разрешение, а не название.
       */
      function migrate() {
        var map = all();
        var moved = 0;
        var last = storage.cache('continue_last', 150, {});
        Object.keys(last).forEach(function (key) {
          var rec = map[key] = map[key] || {};
          if (last[key].v && !rec.v) rec.v = last[key].v;
          if (last[key].q && !rec.r) rec.r = last[key].q;
          if (!rec.t) rec.t = last[key].t || 0;
          moved++;
        });
        var audio = storage.cache('audio_tracks', 200, {});
        Object.keys(audio).forEach(function (key) {
          var rec = map[key] = map[key] || {};
          if (!rec.a && (audio[key].l || audio[key].n)) rec.a = {
            l: audio[key].l,
            n: audio[key].n
          };
          if (!rec.t) rec.t = audio[key].t || 0;
          moved++;
        });
        if (!moved) return 0;
        storage.set(KEY, map);
        storage.set('continue_last', {});
        storage.set('audio_tracks', {});
        return moved;
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
        migrate: migrate,
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
      try {
        memory.migrate();
      } catch (err) {
        console.error('Memory', 'migrate error:', err);
      }
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
      // Без этой подписки на телевизоре плагин молчал бы, ничего не восстанавливая.
      Lampa.PlayerVideo.listener.follow('webos_tracks', function (e) {
        try {
          onTracks(e.tracks);
        } catch (err) {
          console.error('Memory', 'webos tracks error:', err);
        }
      });
      Lampa.PlayerVideo.listener.follow('webos_subs', function (e) {
        try {
          onSubs(e.subs);
        } catch (err) {
          console.error('Memory', 'webos subs error:', err);
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
      var wanted = match$1.match(tracks, {
        lang: rec.a.l || '',
        label: rec.a.n || ''
      });
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
      var about = match$1.describe(match$1.selected(current.tracks));
      if (!about) return;
      memory.set(current.card, {
        a: {
          l: about.lang,
          n: about.label
        }
      });
    }

    /**
     * Субтитры.
     *
     * Выключенные субтитры — такое же осознанное решение, как выбранные, поэтому
     * «выключено» хранится явно. Иначе при следующем запуске сработала бы штатная
     * настройка «включать субтитры сразу», и их пришлось бы выключать каждую серию.
     */
    function onSubs(subs) {
      if (!current) current = {
        card: cardOf(null),
        tracks: null,
        subs: null
      };
      current.subs = subs;
      var rec = current.card && memory.get(current.card);
      if (!rec || rec.s === undefined) return;
      applySubs(subs, rec);

      // Второй заход — из-за порядка на webOS. Список субтитров приезжает раньше,
      // чем плеер применяет штатную настройку «включать субтитры сразу»
      // ([video.js:653](src/interaction/player/video.js:653)), и она перебивает
      // наш выбор: проверено на телевизоре — субтитры включались, хотя человек
      // их выключил. Повтор кладёт предпочтение последним.
      setTimeout(function () {
        return applySubs(subs, rec);
      }, SETTLE);
    }

    /** Сколько ждём, пока плеер закончит со своими умолчаниями */
    var SETTLE = 1500;
    function applySubs(subs, rec) {
      // Выключено. Проверять текущее состояние нельзя: в этот момент плеер ещё
      // не показал своё, а через мгновение покажет.
      if (!rec.s) {
        match$1.applySub(subs, null);
        Lampa.PlayerVideo.subsview(false);
        return;
      }
      var wanted = match$1.matchSub(subs, {
        lang: rec.s.l || '',
        label: rec.s.n || ''
      });
      if (!wanted || wanted === match$1.selectedSub(subs)) return;
      match$1.applySub(subs, wanted);
      Lampa.PlayerVideo.subsview(true);
    }
    function rememberSubs() {
      if (!current || !current.card || !current.subs) return;

      // выбирать было не из чего — решения человека тут нет
      if (!match$1.realSubs(current.subs).length) return;
      var chosen = match$1.selectedSub(current.subs);
      var about = chosen && match$1.describe(chosen);
      memory.set(current.card, {
        s: about ? {
          l: about.lang,
          n: about.label
        } : false
      });
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

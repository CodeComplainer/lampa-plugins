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
      var lang = clean(track.language || track.lang || '');
      var label = clean(track.label || track.name || '');
      if (!lang && !label) return null;
      return {
        lang: lang,
        label: label
      };
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
    function clean(value) {
      return ((value || '') + '').toLowerCase().trim();
    }
    var match$1 = {
      describe: describe,
      match: match,
      compare: compare,
      selected: selected,
      apply: apply
    };

    /**
     * Запоминает выбранную аудиодорожку для каждого сериала и фильма
     * и включает её же при следующем запуске — в том числе из другой раздачи.
     *
     * Плагин самостоятельный: работает при любом запуске плеера, а не только
     * через кнопку «Смотреть».
     */

    /** Сколько тайтлов помним. Запись крошечная, но расти бесконечно ей незачем */
    var LIMIT = 200;

    /** Что сейчас играет: карточка и список дорожек текущего файла */
    var current = null;
    function startPlugin() {
      if (window.plugin_audio_ready) return;
      window.plugin_audio_ready = true;
      Lampa.Player.listener.follow('start', function (data) {
        current = {
          card: cardOf(data),
          tracks: null
        };
      });

      // Список дорожек известен только после открытия файла, поэтому переключаем
      // здесь, а не через параметр track при запуске: там нужен индекс, а он
      // между раздачами разъезжается.
      Lampa.PlayerVideo.listener.follow('tracks', function (e) {
        try {
          onTracks(e.tracks);
        } catch (err) {
          console.error('Audio', 'tracks error:', err);
        }
      });
      Lampa.Player.listener.follow('destroy', function () {
        try {
          remember();
        } catch (err) {
          console.error('Audio', 'save error:', err);
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
      var saved = load(current.card);
      if (!saved) return;
      var wanted = match$1.match(tracks, saved);
      if (!wanted || wanted === match$1.selected(tracks)) return;
      match$1.apply(tracks, wanted);
      Lampa.Noty.show(Lampa.Lang.translate('audio_switched') + ': ' + name(wanted));
    }

    /**
     * Сохраняем то, что реально осталось выбранным к концу просмотра — неважно,
     * переключил человек дорожку сам или её выбрал плеер.
     */
    function remember() {
      if (!current || !current.tracks || current.tracks.length < 2) return;
      var about = match$1.describe(match$1.selected(current.tracks));
      if (!about || !current.card) return;
      var all = Lampa.Storage.cache('audio_tracks', LIMIT, {});
      var key = keyOf(current.card);
      if (!key) return;

      // перекладываем в конец: Storage.cache вытесняет по порядку вставки
      delete all[key];
      all[key] = {
        l: about.lang,
        n: about.label,
        t: Date.now()
      };
      Lampa.Storage.set('audio_tracks', all);
    }
    function load(card) {
      var key = keyOf(card);
      if (!key) return null;
      var all = Lampa.Storage.cache('audio_tracks', LIMIT, {});
      var rec = all[key];
      if (!rec) return null;
      return {
        lang: rec.l || '',
        label: rec.n || ''
      };
    }

    /**
     * Ключ — карточка целиком, а не отдельная серия: озвучку выбирают на сериал,
     * а не на каждый эпизод.
     */
    function keyOf(card) {
      if (!card || !card.id) return null;
      return card.id + ':' + (card.number_of_seasons || card.original_name || card.first_air_date ? 'tv' : 'movie');
    }
    function cardOf(data) {
      if (data && data.card) return data.card;
      var active = Lampa.Activity.active() || {};
      return active.movie || active.card || null;
    }

    /** Название дорожки в том же виде, в каком его показывает панель плеера */
    function name(track) {
      var about = match$1.describe(track);
      if (!about) return Lampa.Lang.translate('player_unknown');
      return [about.label, about.lang].filter(Boolean).join(' / ');
    }
    Lampa.Lang.add({
      audio_switched: {
        ru: 'Дорожка',
        en: 'Audio track',
        uk: 'Доріжка'
      }
    });
    if (window.appready) startPlugin();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
      });
    }

    // доступ для отладки из консоли
    window.__audio = {
      match: match$1
    };
    var audio = {
      match: match$1
    };

    return audio;

})();

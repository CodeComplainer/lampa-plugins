# События Lampa

Собрано автоматически: `npm run index:events`. **Руками не править — перезапишется.**

Источник — `lampa-source` на коммите `3896f4b3` от 2026-07-21.
Каналов: 190, мест отправки: 311, шин: 36.

Реестр построен по местам **отправки** (`.send()`) — то есть описывает то, что
приложение действительно шлёт, а не то, что задумывалось.

Как читать запись:

```
`Lampa.Шина.listener` `канал`
  e: поле, поле               ← поля объекта, который придёт в обработчик
  2 подписки в ядре · путь/файл.js ×2   ← сколько раз ядро само слушает
```                                      и откуда шлётся, ×N — сколько раз

Если канал шлётся с разным `type`, поля расписаны по каждому отдельно: наборы
у них не совпадают, и объединять их нельзя.

```
`Lampa.Шина.listener` `канал`
  type=первый   e: поле, поле · путь/файл.js
  type=второй   e: поле · путь/файл.js ×2
  1 подписка в ядре
```

- **Шина важнее канала.** `Lampa.Listener` и `Lampa.Player.listener` — разные шины,
  одноимённых каналов на них может не быть.
- **`e.type`** — фактическое имя события: подписчик почти всегда фильтрует по нему,
  а не по каналу: `Lampa.Listener.follow('app', (e) => { if(e.type === 'ready') … })`.
- **«подписок в ядре: 0»** — канал существует, но самой Lampa не нужен: как правило,
  он и заведён для внешнего кода.
- Разделы **«не экспортируется»** — внутренние шины, из плагина недоступны.

Это указатель, а не замена исходникам: условия отправки и точный смысл полей —
только в коде. Пути даны от `src/`, а до самого вызова доводит имя канала: оно
стоит литералом внутри `.send(…)` во всех 311 местах отправки без исключения.

```bash
grep -n "send('канал'" ../lampa-source/src/путь/файл.js
```

Число найденных строк совпадёт с `×N` (у каналов с несколькими `type` — с суммой
по вариантам). Кавычки в шаблоне обязательны: без них `rewind` поймает ещё и
CSS-класс.

Номеров строк здесь нет намеренно. Они устаревали при каждом обновлении апстрима
и давали дифф на полсотни строк, где не менялось ничего: ни канал, ни поля, ни
файл. Теперь дифф этого файла означает, что событийная поверхность Lampa
действительно изменилась.

## Шины

- `Lampa.Listener` — 17 каналов
- `Lampa.Activity.listener` — 2 канала
- `Lampa.Controller.listener` — 1 канал
- `Lampa.Extensions.listener` — 2 канала
- `Lampa.Favorite.listener` — 3 канала
- `Lampa.Keypad.listener` — 12 каналов
- `Lampa.Modal.listener` — 5 каналов
- `Lampa.Notice.listener` — 2 канала
- `Lampa.Params.listener` — 3 канала
- `Lampa.Player.listener` — 6 каналов
- `Lampa.PlayerFooter.listener` — 2 канала
- `Lampa.PlayerInfo.listener` — 1 канал
- `Lampa.PlayerIPTV.listener` — 3 канала
- `Lampa.PlayerPanel.listener` — 19 каналов
- `Lampa.PlayerPlaylist.listener` — 2 канала
- `Lampa.PlayerVideo.listener` — 17 каналов
- `Lampa.Reguest.listener` — 7 каналов
- `Lampa.Screensaver.listener` — 3 канала
- `Lampa.Search.listener` — 3 канала
- `Lampa.Select.listener` — 5 каналов
- `Lampa.Settings.listener` — 2 канала
- `Lampa.Socket.listener` — 3 канала
- `Lampa.Storage.listener` — 3 канала
- `Lampa.Timeline.listener` — 3 канала
- `src/components/torrents/listener.js (не экспортируется)` — 1 канал
- `src/interaction/advert/preroll/v2.js (не экспортируется)` — 3 канала
- `src/interaction/advert/preroll/v3.js (не экспортируется)` — 3 канала
- `src/interaction/keyboard/keyboard.js (не экспортируется)` — 10 каналов
- `src/interaction/player/orsay.js (не экспортируется)` — 9 каналов
- `src/interaction/player/segments.js (не экспортируется)` — 2 канала
- `src/interaction/player/subs.js (не экспортируется)` — 4 канала
- `src/interaction/player/tizen.js (не экспортируется)` — 9 каналов
- `src/interaction/player/youtube.js (не экспортируется)` — 6 каналов
- `src/interaction/search/history.js (не экспортируется)` — 4 канала
- `src/interaction/search/results.js (не экспортируется)` — 7 каналов
- `src/interaction/search/sources.js (не экспортируется)` — 6 каналов

## Lampa.Listener

`Lampa.Listener` `activity`
  type=archive  e: component, object · interaction/activity/activity.js
  type=create   e: component, object · interaction/activity/activity.js
  type=destroy  e: component, object · interaction/activity/activity.js ×3
  type=init     e: component, object · interaction/activity/activity.js
  type=start    e: component, object · interaction/activity/activity.js
  1 подписка в ядре

`Lampa.Listener` `app`
  type=ready  без payload · app.js
  type=start  без payload · app.js
  3 подписки в ядре

`Lampa.Listener` `full`
  type=build     e: body, data, item, link, name, props · components/full.js
  type=complite  e: body, data, link, object, props · components/full.js
  type=options   e: link, options, props · components/full/start/options.js
  type=start     e: body, data, link, object, props · components/full.js
  1 подписка в ядре

`Lampa.Listener` `line`
  e: active, body, data, items, line, params, scroll
  0 подписок в ядре · interaction/items/old/line.js · interaction/items/line/module/event.js

`Lampa.Listener` `menu`
  type=action  e: abort, action, target · interaction/menu/menu.js
  type=end     без payload · interaction/menu/menu.js
  type=start   e: body · interaction/menu/menu.js
  type=toggle  без payload · interaction/menu/menu.js
  0 подписок в ядре

`Lampa.Listener` `mytorrents`
  type=onlong  e: menu, object · components/mytorrents.js
  0 подписок в ядре

`Lampa.Listener` `profile_check`
  e: profile
  1 подписка в ядре · core/account/profile.js

`Lampa.Listener` `profile_select`
  e: profile
  1 подписка в ядре · core/account/profile.js

`Lampa.Listener` `request_before`
  e: params
  0 подписок в ядре · utils/reguest.js ×2

`Lampa.Listener` `request_error`
  e: error, exception, params
  1 подписка в ядре · utils/reguest.js ×2

`Lampa.Listener` `request_secuses`
  e: abort, data, params
  1 подписка в ядре · utils/reguest.js ×2

`Lampa.Listener` `resize_end`
  без payload
  3 подписки в ядре · core/layer.js

`Lampa.Listener` `resize_start`
  без payload
  1 подписка в ядре · core/layer.js

`Lampa.Listener` `state:changed`
  e: card, data, id, method, reason, target, viewed
  7 подписок в ядре · core/favorite.js ×3 · core/timetable.js · interaction/timeline.js ×2 · +1 файл.

`Lampa.Listener` `torrent`
  type=onenter  e: element, item · components/torrents.js
  type=onlong   e: element, item, menu · components/torrents.js
  type=render   e: element, item · components/torrents.js
  0 подписок в ядре

`Lampa.Listener` `torrent_file`
  type=list_close  без payload · interaction/torrent.js
  type=list_open   e: items, params · interaction/torrent.js
  type=onenter     e: element, item, items, params · interaction/torrent.js
  type=onfocus     e: element, item, items, params · interaction/torrent.js
  type=onlong      e: element, item, items, menu, params · interaction/torrent.js
  type=render      e: element, item, items, params · interaction/torrent.js
  2 подписки в ядре

`Lampa.Listener` `worker_storage`
  type=insert  e: from, name, to · core/storage/workers.js
  1 подписка в ядре

## Lampa.Activity.listener

`Lampa.Activity.listener` `backward`
  e: count
  1 подписка в ядре · interaction/activity/activity.js

`Lampa.Activity.listener` `popstate`
  e: count
  0 подписок в ядре · interaction/activity/activity.js ×2

## Lampa.Controller.listener

`Lampa.Controller.listener` `toggle`
  e: name
  0 подписок в ядре · core/controller.js

## Lampa.Extensions.listener

`Lampa.Extensions.listener` `close`
  без payload
  0 подписок в ядре · interaction/extensions/extensions.js

`Lampa.Extensions.listener` `open`
  e: extensions
  0 подписок в ядре · interaction/extensions/extensions.js

## Lampa.Favorite.listener

`Lampa.Favorite.listener` `add`
  e: card, where
  0 подписок в ядре · core/favorite.js ×2

`Lampa.Favorite.listener` `added`
  e: card, where
  0 подписок в ядре · core/favorite.js

`Lampa.Favorite.listener` `remove`
  e: card, method, where
  2 подписки в ядре · core/favorite.js ×3

## Lampa.Keypad.listener

`Lampa.Keypad.listener` `back`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `down`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `enter`
  e: code, enabled, event
  1 подписка в ядре · core/keypad.js

`Lampa.Keypad.listener` `keydown`
  e: code, enabled, event
  10 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `keyup`
  e: code, enabled, event
  1 подписка в ядре · core/keypad.js

`Lampa.Keypad.listener` `left`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `longdown`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `right`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `todown`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `toggle`
  e: status
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `toup`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

`Lampa.Keypad.listener` `up`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js

## Lampa.Modal.listener

`Lampa.Modal.listener` `close`
  e: active
  0 подписок в ядре · interaction/modal.js

`Lampa.Modal.listener` `fullshow`
  e: active, html
  0 подписок в ядре · interaction/modal.js

`Lampa.Modal.listener` `preshow`
  e: active
  0 подписок в ядре · interaction/modal.js

`Lampa.Modal.listener` `toggle`
  e: active, html
  1 подписка в ядре · interaction/modal.js

`Lampa.Modal.listener` `update`
  e: active, html, new_html
  0 подписок в ядре · interaction/modal.js

## Lampa.Notice.listener

`Lampa.Notice.listener` `select`
  e: display, element
  0 подписок в ядре · interaction/notice/notice.js

`Lampa.Notice.listener` `viewed`
  e: display
  0 подписок в ядре · interaction/notice/notice.js

## Lampa.Params.listener

`Lampa.Params.listener` `button`
  e: name
  0 подписок в ядре · interaction/settings/params.js

`Lampa.Params.listener` `update_scroll`
  без payload
  1 подписка в ядре · interaction/parental_control.js · interaction/settings/params.js ×2

`Lampa.Params.listener` `update_scroll_position`
  без payload
  1 подписка в ядре · interaction/settings/params.js

## Lampa.Player.listener

`Lampa.Player.listener` `create`
  e: abort, data
  0 подписок в ядре · interaction/player.js

`Lampa.Player.listener` `destroy`
  без payload
  1 подписка в ядре · interaction/player.js ×2

`Lampa.Player.listener` `external`
  e: data
  1 подписка в ядре · interaction/player.js ×4

`Lampa.Player.listener` `infuse_build_url`
  e: callbacks, data, setUrl
  0 подписок в ядре · interaction/player.js

`Lampa.Player.listener` `ready`
  e: data
  1 подписка в ядре · interaction/player.js ×2

`Lampa.Player.listener` `start`
  e: data
  1 подписка в ядре · interaction/player.js ×2

## Lampa.PlayerFooter.listener

`Lampa.PlayerFooter.listener` `close`
  без payload
  2 подписки в ядре · interaction/player/footer.js

`Lampa.PlayerFooter.listener` `open`
  без payload
  2 подписки в ядре · interaction/player/footer.js

## Lampa.PlayerInfo.listener

`Lampa.PlayerInfo.listener` `stat`
  e: cache, data
  1 подписка в ядре · interaction/player/info.js ×3

## Lampa.PlayerIPTV.listener

`Lampa.PlayerIPTV.listener` `channel`
  e: channel, dir, position
  1 подписка в ядре · interaction/player/iptv.js ×2

`Lampa.PlayerIPTV.listener` `draw-program`
  e: dir
  1 подписка в ядре · interaction/player/iptv.js ×2

`Lampa.PlayerIPTV.listener` `play`
  e: channel, position
  1 подписка в ядре · interaction/player/iptv.js ×2

## Lampa.PlayerPanel.listener

`Lampa.PlayerPanel.listener` `change_volume`
  e: volume
  0 подписок в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `flow`
  e: url
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `fullscreen`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `mouse_rewind`
  e: method, percent, time
  1 подписка в ядре · interaction/player/panel.js ×3

`Lampa.PlayerPanel.listener` `next`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `pip`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `playlist`
  без payload
  1 подписка в ядре · interaction/player/panel.js ×2

`Lampa.PlayerPanel.listener` `playpause`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `prev`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `quality`
  e: name, url
  1 подписка в ядре · interaction/player/panel.js ×2

`Lampa.PlayerPanel.listener` `rnext`
  без payload
  1 подписка в ядре · interaction/player/panel.js ×2

`Lampa.PlayerPanel.listener` `rprev`
  без payload
  1 подписка в ядре · interaction/player/panel.js ×2

`Lampa.PlayerPanel.listener` `share`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `size`
  e: size
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `speed`
  e: speed
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `subsview`
  e: status
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `to_end`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `to_start`
  без payload
  1 подписка в ядре · interaction/player/panel.js

`Lampa.PlayerPanel.listener` `visible`
  e: status
  2 подписки в ядре · interaction/player/panel.js

## Lampa.PlayerPlaylist.listener

`Lampa.PlayerPlaylist.listener` `select`
  e: item, playlist, position
  1 подписка в ядре · interaction/player/playlist.js ×3

`Lampa.PlayerPlaylist.listener` `set`
  e: playlist, position
  2 подписки в ядре · interaction/player/playlist.js

## Lampa.PlayerVideo.listener

`Lampa.PlayerVideo.listener` `canplay`
  без payload
  1 подписка в ядре · interaction/player/video.js

`Lampa.PlayerVideo.listener` `ended`
  без payload
  1 подписка в ядре · interaction/player/video.js

`Lampa.PlayerVideo.listener` `error`
  e: error, fatal
  1 подписка в ядре · interaction/player/video.js ×5

`Lampa.PlayerVideo.listener` `levels`
  e: current, levels
  1 подписка в ядре · interaction/player/video.js ×3

`Lampa.PlayerVideo.listener` `loadeddata`
  без payload
  2 подписки в ядре · interaction/player/video.js

`Lampa.PlayerVideo.listener` `pause`
  без payload
  1 подписка в ядре · interaction/player/video.js ×2

`Lampa.PlayerVideo.listener` `play`
  без payload
  1 подписка в ядре · interaction/player/video.js ×2

`Lampa.PlayerVideo.listener` `progress`
  e: down
  1 подписка в ядре · interaction/player/video.js ×2

`Lampa.PlayerVideo.listener` `reset_continue`
  без payload
  1 подписка в ядре · interaction/player/video.js

`Lampa.PlayerVideo.listener` `rewind`
  без payload
  1 подписка в ядре · interaction/player/video.js

`Lampa.PlayerVideo.listener` `subs`
  e: subs
  1 подписка в ядре · interaction/player/video.js ×3

`Lampa.PlayerVideo.listener` `timeupdate`
  e: current, duration
  2 подписки в ядре · interaction/player/video.js ×2

`Lampa.PlayerVideo.listener` `tracks`
  e: tracks
  1 подписка в ядре · interaction/player/video.js

`Lampa.PlayerVideo.listener` `translate`
  e: translate, where
  1 подписка в ядре · interaction/player/video.js ×2

`Lampa.PlayerVideo.listener` `videosize`
  e: height, width
  1 подписка в ядре · interaction/player/video.js ×2

`Lampa.PlayerVideo.listener` `webos_subs`
  e: subs
  1 подписка в ядре · interaction/player/webos.js ×2

`Lampa.PlayerVideo.listener` `webos_tracks`
  e: tracks
  1 подписка в ядре · interaction/player/webos.js ×2

## Lampa.Reguest.listener

`Lampa.Reguest.listener` `after_complite`
  без payload
  0 подписок в ядре · utils/reguest.js

`Lampa.Reguest.listener` `after_error`
  без payload
  0 подписок в ядре · utils/reguest.js

`Lampa.Reguest.listener` `before_complite`
  без payload
  0 подписок в ядре · utils/reguest.js

`Lampa.Reguest.listener` `before_error`
  без payload
  0 подписок в ядре · utils/reguest.js

`Lampa.Reguest.listener` `end`
  без payload
  0 подписок в ядре · utils/reguest.js ×3

`Lampa.Reguest.listener` `go`
  без payload
  0 подписок в ядре · utils/reguest.js ×2

`Lampa.Reguest.listener` `start`
  без payload
  0 подписок в ядре · utils/reguest.js

## Lampa.Screensaver.listener

`Lampa.Screensaver.listener` `start`
  без payload
  0 подписок в ядре · interaction/screensaver.js

`Lampa.Screensaver.listener` `stop`
  без payload
  0 подписок в ядре · interaction/screensaver.js

`Lampa.Screensaver.listener` `toggle`
  e: status
  0 подписок в ядре · interaction/screensaver.js

## Lampa.Search.listener

`Lampa.Search.listener` `close`
  без payload
  0 подписок в ядре · interaction/search/global.js

`Lampa.Search.listener` `open`
  без payload
  0 подписок в ядре · interaction/search/global.js

`Lampa.Search.listener` `sources`
  e: sources
  0 подписок в ядре · interaction/search/global.js

## Lampa.Select.listener

`Lampa.Select.listener` `close`
  e: active
  0 подписок в ядре · interaction/select.js

`Lampa.Select.listener` `fullshow`
  e: active, html
  0 подписок в ядре · interaction/select.js

`Lampa.Select.listener` `hide`
  e: active
  0 подписок в ядре · interaction/select.js

`Lampa.Select.listener` `preshow`
  e: active
  0 подписок в ядре · interaction/select.js

`Lampa.Select.listener` `toggle`
  e: active, html
  0 подписок в ядре · interaction/select.js

## Lampa.Settings.listener

`Lampa.Settings.listener` `close`
  без payload
  0 подписок в ядре · interaction/settings/settings.js

`Lampa.Settings.listener` `open`
  e: body, name, params
  14 подписок в ядре · interaction/settings/settings.js ×2

## Lampa.Socket.listener

`Lampa.Socket.listener` `close`
  без payload
  0 подписок в ядре · core/socket.js

`Lampa.Socket.listener` `message`
  e: result
  4 подписки в ядре · core/socket.js

`Lampa.Socket.listener` `open`
  без payload
  3 подписки в ядре · core/socket.js

## Lampa.Storage.listener

`Lampa.Storage.listener` `add`
  e: name, value
  0 подписок в ядре · core/storage/storage.js

`Lampa.Storage.listener` `change`
  e: name, value
  16 подписок в ядре · core/storage/storage.js

`Lampa.Storage.listener` `clear`
  e: full
  1 подписка в ядре · core/storage/storage.js

## Lampa.Timeline.listener

`Lampa.Timeline.listener` `read`
  e: data
  0 подписок в ядре · interaction/timeline.js

`Lampa.Timeline.listener` `update`
  e: data
  0 подписок в ядре · interaction/timeline.js

`Lampa.Timeline.listener` `view`
  e: data
  0 подписок в ядре · interaction/timeline.js

## src/components/torrents/listener.js (не экспортируется)

`src/components/torrents/listener.js (не экспортируется)` `open`
  e: e
  0 подписок в ядре · components/torrents/listener.js

## src/interaction/advert/preroll/v2.js (не экспортируется)

`src/interaction/advert/preroll/v2.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v2.js

`src/interaction/advert/preroll/v2.js (не экспортируется)` `error`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v2.js

`src/interaction/advert/preroll/v2.js (не экспортируется)` `launch`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v2.js

## src/interaction/advert/preroll/v3.js (не экспортируется)

`src/interaction/advert/preroll/v3.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v3.js

`src/interaction/advert/preroll/v3.js (не экспортируется)` `error`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v3.js

`src/interaction/advert/preroll/v3.js (не экспортируется)` `launch`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v3.js

## src/interaction/keyboard/keyboard.js (не экспортируется)

`src/interaction/keyboard/keyboard.js (не экспортируется)` `back`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js

`src/interaction/keyboard/keyboard.js (не экспортируется)` `blur`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js

`src/interaction/keyboard/keyboard.js (не экспортируется)` `change`
  e: value
  0 подписок в ядре · interaction/keyboard/keyboard.js ×4

`src/interaction/keyboard/keyboard.js (не экспортируется)` `down`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js ×2

`src/interaction/keyboard/keyboard.js (не экспортируется)` `enter`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js ×4

`src/interaction/keyboard/keyboard.js (не экспортируется)` `focus`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js

`src/interaction/keyboard/keyboard.js (не экспортируется)` `hover`
  e: button
  0 подписок в ядре · interaction/keyboard/keyboard.js

`src/interaction/keyboard/keyboard.js (не экспортируется)` `left`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js ×2

`src/interaction/keyboard/keyboard.js (не экспортируется)` `right`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js ×2

`src/interaction/keyboard/keyboard.js (не экспортируется)` `up`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js ×2

## src/interaction/player/orsay.js (не экспортируется)

`src/interaction/player/orsay.js (не экспортируется)` `canplay`
  без payload
  0 подписок в ядре · interaction/player/orsay.js

`src/interaction/player/orsay.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/player/orsay.js

`src/interaction/player/orsay.js (не экспортируется)` `error`
  e: error
  0 подписок в ядре · interaction/player/orsay.js ×18

`src/interaction/player/orsay.js (не экспортируется)` `loadeddata`
  без payload
  0 подписок в ядре · interaction/player/orsay.js

`src/interaction/player/orsay.js (не экспортируется)` `playing`
  без payload
  0 подписок в ядре · interaction/player/orsay.js

`src/interaction/player/orsay.js (не экспортируется)` `progress`
  e: percent
  0 подписок в ядре · interaction/player/orsay.js

`src/interaction/player/orsay.js (не экспортируется)` `subtitle`
  e: text
  0 подписок в ядре · interaction/player/orsay.js

`src/interaction/player/orsay.js (не экспортируется)` `timeupdate`
  без payload
  0 подписок в ядре · interaction/player/orsay.js

`src/interaction/player/orsay.js (не экспортируется)` `waiting`
  без payload
  0 подписок в ядре · interaction/player/orsay.js

## src/interaction/player/segments.js (не экспортируется)

`src/interaction/player/segments.js (не экспортируется)` `set`
  e: segments
  1 подписка в ядре · interaction/player/segments.js ×3

`src/interaction/player/segments.js (не экспортируется)` `skip`
  e: skip
  1 подписка в ядре · interaction/player/segments.js

## src/interaction/player/subs.js (не экспортируется)

`src/interaction/player/subs.js (не экспортируется)` `advanced`
  e: advanced
  0 подписок в ядре · interaction/player/subs.js

`src/interaction/player/subs.js (не экспортируется)` `advanced-frame`
  e: cue, pseudo
  0 подписок в ядре · interaction/player/subs.js ×2

`src/interaction/player/subs.js (не экспортируется)` `ready`
  e: hasAdvanced
  0 подписок в ядре · interaction/player/subs.js

`src/interaction/player/subs.js (не экспортируется)` `subtitle`
  e: payload
  0 подписок в ядре · interaction/player/subs.js

## src/interaction/player/tizen.js (не экспортируется)

`src/interaction/player/tizen.js (не экспортируется)` `canplay`
  без payload
  0 подписок в ядре · interaction/player/tizen.js

`src/interaction/player/tizen.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/player/tizen.js

`src/interaction/player/tizen.js (не экспортируется)` `error`
  e: error
  0 подписок в ядре · interaction/player/tizen.js ×3

`src/interaction/player/tizen.js (не экспортируется)` `loadeddata`
  без payload
  0 подписок в ядре · interaction/player/tizen.js

`src/interaction/player/tizen.js (не экспортируется)` `playing`
  без payload
  0 подписок в ядре · interaction/player/tizen.js ×2

`src/interaction/player/tizen.js (не экспортируется)` `progress`
  e: percent
  0 подписок в ядре · interaction/player/tizen.js ×3

`src/interaction/player/tizen.js (не экспортируется)` `subtitle`
  e: text
  0 подписок в ядре · interaction/player/tizen.js

`src/interaction/player/tizen.js (не экспортируется)` `timeupdate`
  без payload
  0 подписок в ядре · interaction/player/tizen.js

`src/interaction/player/tizen.js (не экспортируется)` `waiting`
  без payload
  0 подписок в ядре · interaction/player/tizen.js

## src/interaction/player/youtube.js (не экспортируется)

`src/interaction/player/youtube.js (не экспортируется)` `canplay`
  без payload
  0 подписок в ядре · interaction/player/youtube.js

`src/interaction/player/youtube.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/player/youtube.js

`src/interaction/player/youtube.js (не экспортируется)` `loadeddata`
  без payload
  0 подписок в ядре · interaction/player/youtube.js

`src/interaction/player/youtube.js (не экспортируется)` `playing`
  без payload
  0 подписок в ядре · interaction/player/youtube.js ×2

`src/interaction/player/youtube.js (не экспортируется)` `timeupdate`
  без payload
  0 подписок в ядре · interaction/player/youtube.js

`src/interaction/player/youtube.js (не экспортируется)` `waiting`
  без payload
  0 подписок в ядре · interaction/player/youtube.js

## src/interaction/search/history.js (не экспортируется)

`src/interaction/search/history.js (не экспортируется)` `back`
  без payload
  0 подписок в ядре · interaction/search/history.js

`src/interaction/search/history.js (не экспортируется)` `down`
  без payload
  0 подписок в ядре · interaction/search/history.js

`src/interaction/search/history.js (не экспортируется)` `enter`
  e: value
  0 подписок в ядре · interaction/search/history.js

`src/interaction/search/history.js (не экспортируется)` `up`
  без payload
  0 подписок в ядре · interaction/search/history.js

## src/interaction/search/results.js (не экспортируется)

`src/interaction/search/results.js (не экспортируется)` `back`
  без payload
  0 подписок в ядре · interaction/search/results.js ×2

`src/interaction/search/results.js (не экспортируется)` `clear`
  без payload
  0 подписок в ядре · interaction/search/results.js

`src/interaction/search/results.js (не экспортируется)` `finded`
  e: count, data
  0 подписок в ядре · interaction/search/results.js ×2

`src/interaction/search/results.js (не экспортируется)` `select`
  без payload
  0 подписок в ядре · interaction/search/results.js ×3

`src/interaction/search/results.js (не экспортируется)` `start`
  без payload
  0 подписок в ядре · interaction/search/results.js

`src/interaction/search/results.js (не экспортируется)` `toggle`
  e: element
  0 подписок в ядре · interaction/search/results.js ×3

`src/interaction/search/results.js (не экспортируется)` `up`
  без payload
  0 подписок в ядре · interaction/search/results.js

## src/interaction/search/sources.js (не экспортируется)

`src/interaction/search/sources.js (не экспортируется)` `back`
  без payload
  1 подписка в ядре · interaction/search/sources.js

`src/interaction/search/sources.js (не экспортируется)` `create`
  e: result, source
  0 подписок в ядре · interaction/search/sources.js

`src/interaction/search/sources.js (не экспортируется)` `finded`
  e: count, data, result, source
  1 подписка в ядре · interaction/search/sources.js

`src/interaction/search/sources.js (не экспортируется)` `search`
  e: immediately, query
  0 подписок в ядре · interaction/search/sources.js

`src/interaction/search/sources.js (не экспортируется)` `toggle`
  e: element, result, source
  1 подписка в ядре · interaction/search/sources.js

`src/interaction/search/sources.js (не экспортируется)` `up`
  без payload
  1 подписка в ядре · interaction/search/sources.js ×2


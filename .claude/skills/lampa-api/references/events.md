# События Lampa

Собрано автоматически: `npm run index:events`. **Руками не править — перезапишется.**

Источник — `lampa-source` на коммите `3896f4b` от 2026-07-21.
Каналов: 190, мест отправки: 311, шин: 36.

Реестр построен по местам **отправки** (`.send()`) — то есть описывает то, что
приложение действительно шлёт, а не то, что задумывалось.

Как читать запись:

```
`Lampa.Шина.listener` `канал`
  e: поле, поле               ← поля объекта, который придёт в обработчик
  2 подписки в ядре · путь/файл.js:304, 1381   ← сколько раз ядро само слушает
```                                             и откуда шлётся

Если канал шлётся с разным `type`, поля расписаны по каждому отдельно: наборы
у них не совпадают, и объединять их нельзя.

```
`Lampa.Шина.listener` `канал`
  type=первый   e: поле, поле · путь/файл.js:96
  type=второй   e: поле · путь/файл.js:215, 270
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
только в коде, по ссылкам `файл:строка` (пути даны от `src/`).

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
  type=archive  e: component, object · interaction/activity/activity.js:428
  type=create   e: component, object · interaction/activity/activity.js:331
  type=destroy  e: component, object · interaction/activity/activity.js:245, 412, 603
  type=init     e: component, object · interaction/activity/activity.js:327
  type=start    e: component, object · interaction/activity/activity.js:488
  1 подписка в ядре

`Lampa.Listener` `app`
  type=ready  без payload · app.js:727
  type=start  без payload · app.js:502
  3 подписки в ядре

`Lampa.Listener` `full`
  type=build     e: body, data, item, link, name, props · components/full.js:270
  type=complite  e: body, data, link, object, props · components/full.js:215
  type=options   e: link, options, props · components/full/start/options.js:11
  type=start     e: body, data, link, object, props · components/full.js:96
  1 подписка в ядре

`Lampa.Listener` `line`
  e: active, body, data, items, line, params, scroll
  0 подписок в ядре · interaction/items/old/line.js:49 · interaction/items/line/module/event.js:3

`Lampa.Listener` `menu`
  type=action  e: abort, action, target · interaction/menu/menu.js:199
  type=end     без payload · interaction/menu/menu.js:130
  type=start   e: body · interaction/menu/menu.js:71
  type=toggle  без payload · interaction/menu/menu.js:393
  0 подписок в ядре

`Lampa.Listener` `mytorrents`
  type=onlong  e: menu, object · components/mytorrents.js:94
  0 подписок в ядре

`Lampa.Listener` `profile_check`
  e: profile
  1 подписка в ядре · core/account/profile.js:83

`Lampa.Listener` `profile_select`
  e: profile
  1 подписка в ядре · core/account/profile.js:185

`Lampa.Listener` `request_before`
  e: params
  0 подписок в ядре · utils/reguest.js:436, 592

`Lampa.Listener` `request_error`
  e: error, exception, params
  1 подписка в ядре · utils/reguest.js:462, 597

`Lampa.Listener` `request_secuses`
  e: abort, data, params
  1 подписка в ядре · utils/reguest.js:516, 622

`Lampa.Listener` `resize_end`
  без payload
  3 подписки в ядре · core/layer.js:30

`Lampa.Listener` `resize_start`
  без payload
  1 подписка в ядре · core/layer.js:15

`Lampa.Listener` `state:changed`
  e: card, data, id, method, reason, target, viewed
  7 подписок в ядре · core/favorite.js:138, 174, 345 · core/timetable.js:264 · interaction/timeline.js:31, 103 · +1 файл.

`Lampa.Listener` `torrent`
  type=onenter  e: element, item · components/torrents.js:918
  type=onlong   e: element, item, menu · components/torrents.js:938
  type=render   e: element, item · components/torrents.js:962
  0 подписок в ядре

`Lampa.Listener` `torrent_file`
  type=list_close  без payload · interaction/torrent.js:631
  type=list_open   e: items, params · interaction/torrent.js:312
  type=onenter     e: element, item, items, params · interaction/torrent.js:443
  type=onfocus     e: element, item, items, params · interaction/torrent.js:532
  type=onlong      e: element, item, items, menu, params · interaction/torrent.js:485
  type=render      e: element, item, items, params · interaction/torrent.js:553
  2 подписки в ядре

`Lampa.Listener` `worker_storage`
  type=insert  e: from, name, to · core/storage/workers.js:102
  1 подписка в ядре

## Lampa.Activity.listener

`Lampa.Activity.listener` `backward`
  e: count
  1 подписка в ядре · interaction/activity/activity.js:400

`Lampa.Activity.listener` `popstate`
  e: count
  0 подписок в ядре · interaction/activity/activity.js:97, 339

## Lampa.Controller.listener

`Lampa.Controller.listener` `toggle`
  e: name
  0 подписок в ядре · core/controller.js:149

## Lampa.Extensions.listener

`Lampa.Extensions.listener` `close`
  без payload
  0 подписок в ядре · interaction/extensions/extensions.js:34

`Lampa.Extensions.listener` `open`
  e: extensions
  0 подписок в ядре · interaction/extensions/extensions.js:45

## Lampa.Favorite.listener

`Lampa.Favorite.listener` `add`
  e: card, where
  0 подписок в ядре · core/favorite.js:107, 115

`Lampa.Favorite.listener` `added`
  e: card, where
  0 подписок в ядре · core/favorite.js:135

`Lampa.Favorite.listener` `remove`
  e: card, method, where
  2 подписки в ядре · core/favorite.js:155, 160, 168

## Lampa.Keypad.listener

`Lampa.Keypad.listener` `back`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:178

`Lampa.Keypad.listener` `down`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:95

`Lampa.Keypad.listener` `enter`
  e: code, enabled, event
  1 подписка в ядре · core/keypad.js:229

`Lampa.Keypad.listener` `keydown`
  e: code, enabled, event
  10 подписок в ядре · core/keypad.js:58

`Lampa.Keypad.listener` `keyup`
  e: code, enabled, event
  1 подписка в ядре · core/keypad.js:223

`Lampa.Keypad.listener` `left`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:70

`Lampa.Keypad.listener` `longdown`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:208

`Lampa.Keypad.listener` `right`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:86

`Lampa.Keypad.listener` `todown`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:111

`Lampa.Keypad.listener` `toggle`
  e: status
  0 подписок в ядре · core/keypad.js:24

`Lampa.Keypad.listener` `toup`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:103

`Lampa.Keypad.listener` `up`
  e: code, enabled, event
  0 подписок в ядре · core/keypad.js:78

## Lampa.Modal.listener

`Lampa.Modal.listener` `close`
  e: active
  0 подписок в ядре · interaction/modal.js:255

`Lampa.Modal.listener` `fullshow`
  e: active, html
  0 подписок в ядре · interaction/modal.js:90

`Lampa.Modal.listener` `preshow`
  e: active
  0 подписок в ядре · interaction/modal.js:39

`Lampa.Modal.listener` `toggle`
  e: active, html
  1 подписка в ядре · interaction/modal.js:193

`Lampa.Modal.listener` `update`
  e: active, html, new_html
  0 подписок в ядре · interaction/modal.js:237

## Lampa.Notice.listener

`Lampa.Notice.listener` `select`
  e: display, element
  0 подписок в ядре · interaction/notice/notice.js:140

`Lampa.Notice.listener` `viewed`
  e: display
  0 подписок в ядре · interaction/notice/notice.js:193

## Lampa.Params.listener

`Lampa.Params.listener` `button`
  e: name
  0 подписок в ядре · interaction/settings/params.js:341

`Lampa.Params.listener` `update_scroll`
  без payload
  1 подписка в ядре · interaction/parental_control.js:111 · interaction/settings/params.js:355, 436

`Lampa.Params.listener` `update_scroll_position`
  без payload
  1 подписка в ядре · interaction/settings/params.js:486

## Lampa.Player.listener

`Lampa.Player.listener` `create`
  e: abort, data
  0 подписок в ядре · interaction/player.js:1193

`Lampa.Player.listener` `destroy`
  без payload
  1 подписка в ядре · interaction/player.js:718, 1024

`Lampa.Player.listener` `external`
  e: data
  1 подписка в ядре · interaction/player.js:1015, 1089, 1110, 1134

`Lampa.Player.listener` `infuse_build_url`
  e: callbacks, data, setUrl
  0 подписок в ядре · interaction/player.js:887

`Lampa.Player.listener` `ready`
  e: data
  1 подписка в ядре · interaction/player.js:1274, 1315

`Lampa.Player.listener` `start`
  e: data
  1 подписка в ядре · interaction/player.js:1221, 1297

## Lampa.PlayerFooter.listener

`Lampa.PlayerFooter.listener` `close`
  без payload
  2 подписки в ядре · interaction/player/footer.js:57

`Lampa.PlayerFooter.listener` `open`
  без payload
  2 подписки в ядре · interaction/player/footer.js:51

## Lampa.PlayerInfo.listener

`Lampa.PlayerInfo.listener` `stat`
  e: cache, data
  1 подписка в ядре · interaction/player/info.js:130, 132, 136

## Lampa.PlayerIPTV.listener

`Lampa.PlayerIPTV.listener` `channel`
  e: channel, dir, position
  1 подписка в ядре · interaction/player/iptv.js:66, 126

`Lampa.PlayerIPTV.listener` `draw-program`
  e: dir
  1 подписка в ядре · interaction/player/iptv.js:114, 165

`Lampa.PlayerIPTV.listener` `play`
  e: channel, position
  1 подписка в ядре · interaction/player/iptv.js:70, 91

## Lampa.PlayerPanel.listener

`Lampa.PlayerPanel.listener` `change_volume`
  e: volume
  0 подписок в ядре · interaction/player/panel.js:192

`Lampa.PlayerPanel.listener` `flow`
  e: url
  1 подписка в ядре · interaction/player/panel.js:266

`Lampa.PlayerPanel.listener` `fullscreen`
  без payload
  1 подписка в ядре · interaction/player/panel.js:167

`Lampa.PlayerPanel.listener` `mouse_rewind`
  e: method, percent, time
  1 подписка в ядре · interaction/player/panel.js:183, 187, 205

`Lampa.PlayerPanel.listener` `next`
  без payload
  1 подписка в ядре · interaction/player/panel.js:139

`Lampa.PlayerPanel.listener` `pip`
  без payload
  1 подписка в ядре · interaction/player/panel.js:175

`Lampa.PlayerPanel.listener` `playlist`
  без payload
  1 подписка в ядре · interaction/player/panel.js:155, 1203

`Lampa.PlayerPanel.listener` `playpause`
  без payload
  1 подписка в ядре · interaction/player/panel.js:135

`Lampa.PlayerPanel.listener` `prev`
  без payload
  1 подписка в ядре · interaction/player/panel.js:143

`Lampa.PlayerPanel.listener` `quality`
  e: name, url
  1 подписка в ядре · interaction/player/panel.js:321, 334

`Lampa.PlayerPanel.listener` `rnext`
  без payload
  1 подписка в ядре · interaction/player/panel.js:151, 1170

`Lampa.PlayerPanel.listener` `rprev`
  без payload
  1 подписка в ядре · interaction/player/panel.js:147, 1173

`Lampa.PlayerPanel.listener` `share`
  без payload
  1 подписка в ядре · interaction/player/panel.js:711

`Lampa.PlayerPanel.listener` `size`
  e: size
  1 подписка в ядре · interaction/player/panel.js:1008

`Lampa.PlayerPanel.listener` `speed`
  e: speed
  1 подписка в ядре · interaction/player/panel.js:1091

`Lampa.PlayerPanel.listener` `subsview`
  e: status
  1 подписка в ядре · interaction/player/panel.js:435

`Lampa.PlayerPanel.listener` `to_end`
  без payload
  1 подписка в ядре · interaction/player/panel.js:163

`Lampa.PlayerPanel.listener` `to_start`
  без payload
  1 подписка в ядре · interaction/player/panel.js:159

`Lampa.PlayerPanel.listener` `visible`
  e: status
  2 подписки в ядре · interaction/player/panel.js:1268

## Lampa.PlayerPlaylist.listener

`Lampa.PlayerPlaylist.listener` `select`
  e: item, playlist, position
  1 подписка в ядре · interaction/player/playlist.js:27, 57, 72

`Lampa.PlayerPlaylist.listener` `set`
  e: playlist, position
  2 подписки в ядре · interaction/player/playlist.js:101

## Lampa.PlayerVideo.listener

`Lampa.PlayerVideo.listener` `canplay`
  без payload
  1 подписка в ядре · interaction/player/video.js:299

`Lampa.PlayerVideo.listener` `ended`
  без payload
  1 подписка в ядре · interaction/player/video.js:242

`Lampa.PlayerVideo.listener` `error`
  e: error, fatal
  1 подписка в ядре · interaction/player/video.js:256, 259, 262, 1131 +1

`Lampa.PlayerVideo.listener` `levels`
  e: current, levels
  1 подписка в ядре · interaction/player/video.js:738, 772, 1232

`Lampa.PlayerVideo.listener` `loadeddata`
  без payload
  2 подписки в ядре · interaction/player/video.js:353

`Lampa.PlayerVideo.listener` `pause`
  без payload
  1 подписка в ядре · interaction/player/video.js:1324, 1341

`Lampa.PlayerVideo.listener` `play`
  без payload
  1 подписка в ядре · interaction/player/video.js:1293, 1336

`Lampa.PlayerVideo.listener` `progress`
  e: down
  1 подписка в ядре · interaction/player/video.js:270, 284

`Lampa.PlayerVideo.listener` `reset_continue`
  без payload
  1 подписка в ядре · interaction/player/video.js:997

`Lampa.PlayerVideo.listener` `rewind`
  без payload
  1 подписка в ядре · interaction/player/video.js:1382

`Lampa.PlayerVideo.listener` `subs`
  e: subs
  1 подписка в ядре · interaction/player/video.js:697, 894, 1178

`Lampa.PlayerVideo.listener` `timeupdate`
  e: current, duration
  2 подписки в ядре · interaction/player/video.js:304, 1381

`Lampa.PlayerVideo.listener` `tracks`
  e: tracks
  1 подписка в ядре · interaction/player/video.js:668

`Lampa.PlayerVideo.listener` `translate`
  e: translate, where
  1 подписка в ядре · interaction/player/video.js:1211, 1212

`Lampa.PlayerVideo.listener` `videosize`
  e: height, width
  1 подписка в ядре · interaction/player/video.js:306, 352

`Lampa.PlayerVideo.listener` `webos_subs`
  e: subs
  1 подписка в ядре · interaction/player/webos.js:112, 258

`Lampa.PlayerVideo.listener` `webos_tracks`
  e: tracks
  1 подписка в ядре · interaction/player/webos.js:170, 253

## Lampa.Reguest.listener

`Lampa.Reguest.listener` `after_complite`
  без payload
  0 подписок в ядре · utils/reguest.js:75

`Lampa.Reguest.listener` `after_error`
  без payload
  0 подписок в ядре · utils/reguest.js:84

`Lampa.Reguest.listener` `before_complite`
  без payload
  0 подписок в ядре · utils/reguest.js:69

`Lampa.Reguest.listener` `before_error`
  без payload
  0 подписок в ядре · utils/reguest.js:78

`Lampa.Reguest.listener` `end`
  без payload
  0 подписок в ядре · utils/reguest.js:88, 163, 234

`Lampa.Reguest.listener` `go`
  без payload
  0 подписок в ядре · utils/reguest.js:484, 615

`Lampa.Reguest.listener` `start`
  без payload
  0 подписок в ядре · utils/reguest.js:66

## Lampa.Screensaver.listener

`Lampa.Screensaver.listener` `start`
  без payload
  0 подписок в ядре · interaction/screensaver.js:93

`Lampa.Screensaver.listener` `stop`
  без payload
  0 подписок в ядре · interaction/screensaver.js:143

`Lampa.Screensaver.listener` `toggle`
  e: status
  0 подписок в ядре · interaction/screensaver.js:71

## Lampa.Search.listener

`Lampa.Search.listener` `close`
  без payload
  0 подписок в ядре · interaction/search/global.js:211

`Lampa.Search.listener` `open`
  без payload
  0 подписок в ядре · interaction/search/global.js:45

`Lampa.Search.listener` `sources`
  e: sources
  0 подписок в ядре · interaction/search/global.js:96

## Lampa.Select.listener

`Lampa.Select.listener` `close`
  e: active
  0 подписок в ядре · interaction/select.js:219

`Lampa.Select.listener` `fullshow`
  e: active, html
  0 подписок в ядре · interaction/select.js:164

`Lampa.Select.listener` `hide`
  e: active
  0 подписок в ядре · interaction/select.js:205

`Lampa.Select.listener` `preshow`
  e: active
  0 подписок в ядре · interaction/select.js:152

`Lampa.Select.listener` `toggle`
  e: active, html
  0 подписок в ядре · interaction/select.js:181

## Lampa.Settings.listener

`Lampa.Settings.listener` `close`
  без payload
  0 подписок в ядре · interaction/settings/settings.js:80

`Lampa.Settings.listener` `open`
  e: body, name, params
  14 подписок в ядре · interaction/settings/settings.js:40, 113

## Lampa.Socket.listener

`Lampa.Socket.listener` `close`
  без payload
  0 подписок в ядре · core/socket.js:83

`Lampa.Socket.listener` `message`
  e: result
  4 подписки в ядре · core/socket.js:233

`Lampa.Socket.listener` `open`
  без payload
  3 подписки в ядре · core/socket.js:73

## Lampa.Storage.listener

`Lampa.Storage.listener` `add`
  e: name, value
  0 подписок в ядре · core/storage/storage.js:173

`Lampa.Storage.listener` `change`
  e: name, value
  16 подписок в ядре · core/storage/storage.js:151

`Lampa.Storage.listener` `clear`
  e: full
  1 подписка в ядре · core/storage/storage.js:278

## Lampa.Timeline.listener

`Lampa.Timeline.listener` `read`
  e: data
  0 подписок в ядре · interaction/timeline.js:27

`Lampa.Timeline.listener` `update`
  e: data
  0 подписок в ядре · interaction/timeline.js:101

`Lampa.Timeline.listener` `view`
  e: data
  0 подписок в ядре · interaction/timeline.js:139

## src/components/torrents/listener.js (не экспортируется)

`src/components/torrents/listener.js (не экспортируется)` `open`
  e: e
  0 подписок в ядре · components/torrents/listener.js:20

## src/interaction/advert/preroll/v2.js (не экспортируется)

`src/interaction/advert/preroll/v2.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v2.js:262

`src/interaction/advert/preroll/v2.js (не экспортируется)` `error`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v2.js:310

`src/interaction/advert/preroll/v2.js (не экспортируется)` `launch`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v2.js:106

## src/interaction/advert/preroll/v3.js (не экспортируется)

`src/interaction/advert/preroll/v3.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v3.js:323

`src/interaction/advert/preroll/v3.js (не экспортируется)` `error`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v3.js:341

`src/interaction/advert/preroll/v3.js (не экспортируется)` `launch`
  без payload
  0 подписок в ядре · interaction/advert/preroll/v3.js:74

## src/interaction/keyboard/keyboard.js (не экспортируется)

`src/interaction/keyboard/keyboard.js (не экспортируется)` `back`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:572

`src/interaction/keyboard/keyboard.js (не экспортируется)` `blur`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:123

`src/interaction/keyboard/keyboard.js (не экспортируется)` `change`
  e: value
  0 подписок в ядре · interaction/keyboard/keyboard.js:99, 112, 272, 463

`src/interaction/keyboard/keyboard.js (не экспортируется)` `down`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:166, 555

`src/interaction/keyboard/keyboard.js (не экспортируется)` `enter`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:87, 149, 230, 362

`src/interaction/keyboard/keyboard.js (не экспортируется)` `focus`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:131

`src/interaction/keyboard/keyboard.js (не экспортируется)` `hover`
  e: button
  0 подписок в ядре · interaction/keyboard/keyboard.js:480

`src/interaction/keyboard/keyboard.js (не экспортируется)` `left`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:152, 561

`src/interaction/keyboard/keyboard.js (не экспортируется)` `right`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:159, 567

`src/interaction/keyboard/keyboard.js (не экспортируется)` `up`
  без payload
  0 подписок в ядре · interaction/keyboard/keyboard.js:170, 549

## src/interaction/player/orsay.js (не экспортируется)

`src/interaction/player/orsay.js (не экспортируется)` `canplay`
  без payload
  0 подписок в ядре · interaction/player/orsay.js:459

`src/interaction/player/orsay.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/player/orsay.js:384

`src/interaction/player/orsay.js (не экспортируется)` `error`
  e: error
  0 подписок в ядре · interaction/player/orsay.js:44, 294, 296, 330 +14

`src/interaction/player/orsay.js (не экспортируется)` `loadeddata`
  без payload
  0 подписок в ядре · interaction/player/orsay.js:396

`src/interaction/player/orsay.js (не экспортируется)` `playing`
  без payload
  0 подписок в ядре · interaction/player/orsay.js:409

`src/interaction/player/orsay.js (не экспортируется)` `progress`
  e: percent
  0 подписок в ядре · interaction/player/orsay.js:413

`src/interaction/player/orsay.js (не экспортируется)` `subtitle`
  e: text
  0 подписок в ядре · interaction/player/orsay.js:447

`src/interaction/player/orsay.js (не экспортируется)` `timeupdate`
  без payload
  0 подписок в ядре · interaction/player/orsay.js:418

`src/interaction/player/orsay.js (не экспортируется)` `waiting`
  без payload
  0 подписок в ядре · interaction/player/orsay.js:404

## src/interaction/player/segments.js (не экспортируется)

`src/interaction/player/segments.js (не экспортируется)` `set`
  e: segments
  1 подписка в ядре · interaction/player/segments.js:60, 315, 339

`src/interaction/player/segments.js (не экспортируется)` `skip`
  e: skip
  1 подписка в ядре · interaction/player/segments.js:22

## src/interaction/player/subs.js (не экспортируется)

`src/interaction/player/subs.js (не экспортируется)` `advanced`
  e: advanced
  0 подписок в ядре · interaction/player/subs.js:150

`src/interaction/player/subs.js (не экспортируется)` `advanced-frame`
  e: cue, pseudo
  0 подписок в ядре · interaction/player/subs.js:176, 180

`src/interaction/player/subs.js (не экспортируется)` `ready`
  e: hasAdvanced
  0 подписок в ядре · interaction/player/subs.js:153

`src/interaction/player/subs.js (не экспортируется)` `subtitle`
  e: payload
  0 подписок в ядре · interaction/player/subs.js:196

## src/interaction/player/tizen.js (не экспортируется)

`src/interaction/player/tizen.js (не экспортируется)` `canplay`
  без payload
  0 подписок в ядре · interaction/player/tizen.js:362

`src/interaction/player/tizen.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/player/tizen.js:312

`src/interaction/player/tizen.js (не экспортируется)` `error`
  e: error
  0 подписок в ядре · interaction/player/tizen.js:34, 332, 368

`src/interaction/player/tizen.js (не экспортируется)` `loadeddata`
  без payload
  0 подписок в ядре · interaction/player/tizen.js:366

`src/interaction/player/tizen.js (не экспортируется)` `playing`
  без payload
  0 подписок в ядре · interaction/player/tizen.js:307, 364

`src/interaction/player/tizen.js (не экспортируется)` `progress`
  e: percent
  0 подписок в ядре · interaction/player/tizen.js:295, 301, 305

`src/interaction/player/tizen.js (не экспортируется)` `subtitle`
  e: text
  0 подписок в ядре · interaction/player/tizen.js:340

`src/interaction/player/tizen.js (не экспортируется)` `timeupdate`
  без payload
  0 подписок в ядре · interaction/player/tizen.js:316

`src/interaction/player/tizen.js (не экспортируется)` `waiting`
  без payload
  0 подписок в ядре · interaction/player/tizen.js:297

## src/interaction/player/youtube.js (не экспортируется)

`src/interaction/player/youtube.js (не экспортируется)` `canplay`
  без payload
  0 подписок в ядре · interaction/player/youtube.js:120

`src/interaction/player/youtube.js (не экспортируется)` `ended`
  без payload
  0 подписок в ядре · interaction/player/youtube.js:159

`src/interaction/player/youtube.js (не экспортируется)` `loadeddata`
  без payload
  0 подписок в ядре · interaction/player/youtube.js:121

`src/interaction/player/youtube.js (не экспортируется)` `playing`
  без payload
  0 подписок в ядре · interaction/player/youtube.js:128, 144

`src/interaction/player/youtube.js (не экспортируется)` `timeupdate`
  без payload
  0 подписок в ядре · interaction/player/youtube.js:125

`src/interaction/player/youtube.js (не экспортируется)` `waiting`
  без payload
  0 подписок в ядре · interaction/player/youtube.js:163

## src/interaction/search/history.js (не экспортируется)

`src/interaction/search/history.js (не экспортируется)` `back`
  без payload
  0 подписок в ядре · interaction/search/history.js:104

`src/interaction/search/history.js (не экспортируется)` `down`
  без payload
  0 подписок в ядре · interaction/search/history.js:98

`src/interaction/search/history.js (не экспортируется)` `enter`
  e: value
  0 подписок в ядре · interaction/search/history.js:43

`src/interaction/search/history.js (не экспортируется)` `up`
  без payload
  0 подписок в ядре · interaction/search/history.js:95

## src/interaction/search/results.js (не экспортируется)

`src/interaction/search/results.js (не экспортируется)` `back`
  без payload
  0 подписок в ядре · interaction/search/results.js:180, 233

`src/interaction/search/results.js (не экспортируется)` `clear`
  без payload
  0 подписок в ядре · interaction/search/results.js:217

`src/interaction/search/results.js (не экспортируется)` `finded`
  e: count, data
  0 подписок в ядре · interaction/search/results.js:40, 90

`src/interaction/search/results.js (не экспортируется)` `select`
  без payload
  0 подписок в ядре · interaction/search/results.js:145, 153, 157

`src/interaction/search/results.js (не экспортируется)` `start`
  без payload
  0 подписок в ядре · interaction/search/results.js:49

`src/interaction/search/results.js (не экспортируется)` `toggle`
  e: element
  0 подписок в ядре · interaction/search/results.js:190, 204, 229

`src/interaction/search/results.js (не экспортируется)` `up`
  без payload
  0 подписок в ядре · interaction/search/results.js:196

## src/interaction/search/sources.js (не экспортируется)

`src/interaction/search/sources.js (не экспортируется)` `back`
  без payload
  1 подписка в ядре · interaction/search/sources.js:175

`src/interaction/search/sources.js (не экспортируется)` `create`
  e: result, source
  0 подписок в ядре · interaction/search/sources.js:149

`src/interaction/search/sources.js (не экспортируется)` `finded`
  e: count, data, result, source
  1 подписка в ядре · interaction/search/sources.js:122

`src/interaction/search/sources.js (не экспортируется)` `search`
  e: immediately, query
  0 подписок в ядре · interaction/search/sources.js:188

`src/interaction/search/sources.js (не экспортируется)` `toggle`
  e: element, result, source
  1 подписка в ядре · interaction/search/sources.js:134

`src/interaction/search/sources.js (не экспортируется)` `up`
  без payload
  1 подписка в ядре · interaction/search/sources.js:126, 163


(function () {
    'use strict';

    var Voices = ["Анастасия Гайдаржи + Андрей Юрченко", "Студии Суверенного Лепрозория", "Студия Пиратского Дубляжа", "IgVin &amp; Solncekleshka", "Gremlin Creative Studio", "Alternative Production", "HelloMickey Production", "Bubble Dubbing Company", "Н.Севастьянов seva1988", "XDUB Dorama + Колобок", "Мобильное телевидение", "СПД - Сладкая парочка", "Selena International", "Black Street Records", "Intra Communications", "BBC Saint-Petersburg", "Melodic Voice Studio", "Voice Project Studio", "Несмертельное оружие", "Петербургский дубляж", "Studio Victory Аsia", "Asian Miracle Group", "True Dubbing Studio", "Lizard Cinema Trade", "National Geographic", "Позитив-Мультимедиа", "Премьер Мультимедиа", "Уолт Дисней Компани", "Parovoz Production", "Shadow Dub Project", "Zone Vision Studio", "Анастасия Гайдаржи", "The Kitchen Russia", "Малиновский Сергей", "Family Fan Edition", "Paramount Pictures", "Иванова и П. Пашут", "Так Треба Продакшн", "Хихикающий доктор", "Четыре в квадрате", "Project Web Mania", "Paramount Channel", "Back Board Cinema", "Zoomvision Studio", "Universal Channel", "RedDiamond Studio", "НеЗупиняйПродакшн", "Селена Интернешнл", "Студия «Стартрек»", "Колодій Трейлерів", "Universal Russia", "Paramount Comedy", "Андрей Питерский", "Реальный перевод", "MC Entertainment", "Екатеринбург Арт", "Lucky Production", "Cowabunga Studio", "Анатолий Ашмарин", "Васька Куролесов", "Brain Production", "Квадрат Малевича", "Первый канал ОРТ", "Русский Репортаж", "Сolumbia Service", "Sunshine Studio", "GreenРай Studio", "New Dream Media", "DeadLine Studio", "Воробьев Сергей", "DeeAFilm Studio", "Николай Дроздов", "Денис Шадинский", "Cartoon Network", "Amazing Dubbing", "Volume-6 Studio", "Антонов Николай", "Ульпаней Эльром", "Cinema Prestige", "AnimeSpace Team", "CinemaSET GROUP", "XvidClub Studio", "З Ранку До Ночі", "Максим Логинофф", "Студия Горького", "Ушастая озвучка", "Hamster Studio", "Agatha Studdio", "SunshineStudio", "Kulzvuk Studio", "Вартан Дохалов", "Viasat History", "DIVA Universal", "KosharaSerials", "Julia Prosenuk", "SovetRomantica", "Mallorn Studio", "TUMBLER Studio", "CrazyCatStudio", "Syfy Universal", "Horizon Studio", "Анатолий Гусев", "Максим Жолобов", "RedRussian1337", "Creative Sound", "Garsu Pasaulis", "visanti-vasaer", "GoodTime Media", "Кирдин | Stalk", "Anything-group", "Goodtime Media", "Jakob Bellmann", "Витя «говорун»", "Л. Володарский", "Леша Прапорщик", "Медиа-Комплекс", "Прайд Продакшн", "Русский дубляж", "Союзмультфильм", "Студия Колобок", "Red Head Sound", "LE-Production", "ViruseProject", "Victory-Films", "Jetvis Studio", "Greb&Creative", "5-й канал СПб", "Dream Records", "Filiza Studio", "SHIZA Project", "Bars MacAdams", "Nazel & Freya", "Vulpes Vulpes", "Храм Дорам ТВ", "АРК-ТВ Studio", "Film Prestige", "Rainbow World", "Banyan Studio", "Bonsai Studio", "Мадлен Дюваль", "VO-Production", "Voice Project", "Flarrow Films", "Видеопродакшн", "Хоррор Мэйкер", "Lizard Cinema", "Фортуна-Фильм", "VIP Serial HD", "Старый Бильбо", "Семыкина Юлия", "Штамп Дмитрий", "Arasi project", "ARRU Workshop", "Byako Records", "FiliZa Studio", "Gezell Studio", "HamsterStudio", "PCB Translate", "Renegade Team", "Sci-Fi Russia", "The Mike Rec.", "VO-production", "Мика Бондарик", "Наталья Гурзо", "Премьер Видео", "Трамвай-фильм", "Кубик в Кубе", "Кураж-Бамбей", "Первый канал", "Trdlo.studio", "Студия Райдо", "AniLibria.TV", "RG.Paravozik", "Profix Media", "AlphaProject", "AnimeReactor", "Кармен Видео", "Korean Craze", "Sony Channel", "Train Studio", "Фильмэкспорт", "Кирилл Сагач", "ViP Premiere", "Деваль Видео", "RussianGuy27", "HaseRiLLoPaW", "Сергей Дидок", "Mystery Film", "Psychotronic", "КонтентикOFF", "Говинда Рага", "Horror Maker", "Альтера Парс", "Видеоимпульс", "Мьюзик-трейд", "Тоникс Медиа", "Элегия фильм", "Oneinchnales", "Кинопремьера", "A. Lazarchuk", "Animereactor", "BadCatStudio", "DreamRecords", "General Film", "Ivnet Cinema", "RG Paravozik", "sweet couple", "VictoryFilms", "VulpesVulpes", "Wayland team", "Гей Кино Гид", "Нурмухаметов", "Е. Хрусталёв", "К. Поздняков", "Н. Золотухин", "Новый Дубляж", "Р. Янкелевич", "С. Кузьмичёв", "С. Щегольков", "Синема Трейд", "Синта Рурони", "Точка Zрения", "КОМНАТА ДИДИ", "FocusStudio", "Gears Media", "GladiolusTV", "RecentFilms", "NEON Studio", "Володарский", "Мастер Тэйп", "XDUB Dorama", "Sound-Group", "Sony Sci-Fi", "Good People", "JWA Project", "Nika Lenina", "RiZZ_fisher", "New Records", "КураСгречей", "Неоклассика", "CrezaStudio", "Видеосервис", "BTI Studios", "Eurochannel", "Варус-Видео", "HiWay Grope", "Эй Би Видео", "Nickelodeon", "StudioFilms", "Paul Bunyan", "Inter Video", "Franek Monk", "Другое кино", "Севастьянов", "Lazer Video", "Max Nabokov", "Завгородний", "SnowRecords", "Crunchyroll", "Gold Cinema", "Прямостанов", "Огородников", "Кенс Матвей", "1001 cinema", "Cactus Team", "Description", "DVD Classic", "Gala Voices", "hungry_inri", "Neoclassica", "Oghra-Brown", "Rebel Voice", "Saint Sound", "SakuraNight", "TF-AniGroup", "TrainStudio", "Zone Studio", "Zone Vision", "Варус Видео", "Г. Либергал", "Г. Румянцев", "Е. Гаевский", "И. Сафронов", "И. Степанов", "Лазер Видео", "Малиновский", "Новый Канал", "Петербуржец", "С. Визгунов", "С. Кузнецов", "Студия Трёх", "Цікава Ідея", "Я. Беллманн", "Studio Band", "ApofysTeam", "Карповский", "LevshaFilm", "1001cinema", "CP Digital", "Интерфильм", "Комедия ТВ", "Ох! Студия", "SilverSnow", "NewStation", "StudioBand", "Rain Death", "Первый ТВЧ", "HiWayGrope", "Animegroup", "Shachiburi", "CactusTeam", "Sony Turbo", "AXN Sci-Fi", "Т.О Друзей", "West Video", "East Dream", "Sound Film", "MaxMeister", "VoicePower", "CoralMedia", "VSI Moscow", "VGM Studio", "Студия NLS", "Хуан Рохас", "TatamiFilm", "диктор CDV", "Pazl Voice", "Саня Белый", "Мост-Видео", "AimaksaLTV", "Contentica", "Инфо-фильм", "Электричка", "Бусов Глеб", "AvePremier", "BraveSound", "CinemaTone", "DniproFilm", "ELEKTRI4KA", "eraserhead", "Fox Russia", "Mega-Anime", "MifSnaiper", "Nice-Media", "PiratVoice", "Postmodern", "Reanimedia", "Sky Voices", "SkyeFilmTV", "Костюкевич", "Толстобров", "Б. Федоров", "Ващенко С.", "Глуховский", "Держиморда", "Е. Гранкин", "И. Еремеев", "К. Филонов", "Мост Видео", "Н. Антонов", "Н. Дроздов", "Новый диск", "Переводман", "С. Казаков", "С. Лебедев", "С. Макашов", "Союз Видео", "ТВ XXI век", "Ю. Немахов", "Dream Cast", "Причудики", "NewStudio", "Red Media", "Синема УС", "SDI Media", "CasStudio", "turok1990", "HighHopes", "AniLibria", "FanStudio", "Sedorelli", "Flux-Team", "Kobayashi", "KinoGolos", "Fox Crime", "Discovery", "GREEN TEA", "Persona99", "3df voice", "ShinkaDan", "АрхиТеатр", "СВ-Студия", "FilmsClub", "fiendover", "Воротилин", "LakeFilms", "Кириллица", "AniPLague", "JoyStudio", "Формат AB", "AveBrasil", "Невафильм", "OnisFilms", "Neo-Sound", "Муравский", "BeniAffet", "Янкелевич", "AveDorama", "Киномания", "CBS Drama", "Novamedia", "NewComers", "Ghostface", "Sephiroth", "Andre1288", "DoubleRec", "Astana TV", "Останкино", "Видеобаза", "CLS Media", "Seoul Bay", "Хрусталев", "Золотухин", "Videogram", "AAA-Sound", "Epic Team", "GoodVideo", "Gramalant", "INTERFILM", "Kinomania", "No-Future", "RainDeath", "RATTLEBOX", "Sawyer888", "SmallFilm", "SOLDLUCK2", "SpaceDust", "Timecraft", "Total DVD", "Video-BIZ", "VIZ Media", "Васильцев", "Григорьев", "ААА-sound", "Амальгама", "Весельчак", "Деньщиков", "Шадинский", "ЕА Синема", "Зереницын", "И. Клушин", "Имидж-Арт", "Карапетян", "Машинский", "Мительман", "Рыжий пес", "С. Дьяков", "Самарский", "СВ Студия", "Советский", "Солодухин", "ТО Друзей", "Ю. Сербин", "Ю. Товбин", "AnimeVost", "Omskbird", "LostFilm", "AlexFilm", "IdeaFilm", "ColdFilm", "KinoView", "Jimmy J.", "Дольский", "Гаврилов", "Алексеев", "Визгунов", "Либергал", "Кузнецов", "Горчаков", "Gravi-TV", "Murzilka", "STEPonee", "NovaFilm", "Kerems13", "Fox Life", "AzOnFilm", "SorzTeam", "Гаевский", "СВ-Дубль", "GoldTeam", "DexterTV", "AniMedia", "ANIvoice", "JeFerSon", "RealFake", "AniMaunt", "TurkStar", "Медведев", "FilmGate", "Логинофф", "Loginoff", "Animedub", "GostFilm", "ClubFATE", "Hallmark", "Тимофеев", "Дьяконов", "Лексикон", "Superbit", "VideoBIZ", "WestFilm", "kubik&ko", "Марченко", "Журавлев", "Карусель", "Barin101", "Amalgama", "Кинолюкс", "AB-Video", "Пирамида", "Нарышкин", "Дубровин", "Махонько", "Хлопушка", "АрхиАзия", "Ultradox", "Мельница", "Бессонов", "Бахурани", "Индия ТВ", "AdiSound", "ALEKS KV", "AuraFilm", "DeadLine", "Extrabit", "Foxlight", "GetSmart", "ImageArt", "Marclail", "metalrus", "Milirina", "MiraiDub", "MOYGOLOS", "OMSKBIRD", "Radamant", "RoxMarty", "st.Elrom", "VashMax2", "VendettA", "XL Media", "Артемьев", "Васильев", "Савченко", "Воронцов", "Войсовер", "Домашний", "Е. Лурье", "Е. Рудой", "Ист-Вест", "ЛанселаП", "Ленфильм", "Заугаров", "Мосфильм", "Оверлорд", "С. Рябов", "Супербит", "Толмачев", "Ю. Живов", "Paradox", "BaibaKo", "Jaskier", "Колобок", "Михалев", "Дохалов", "SoftBox", "MUZOBOZ", "ZM-Show", "Levelin", "Немахов", "Яроцкий", "BadBajo", "СВ-Кадр", "Позитив", "RusFilm", "Назаров", "Сыендук", "Яковлев", "Lord32x", "Onibaku", "Trina_D", "Hamster", "AniFilm", "HDrezka", "ShowJet", "BukeDub", "SomeWax", "Anifilm", "TVShows", "РуФилмс", "Пифагор", "AniStar", "Netflix", "Octopus", "MixFilm", "Рутилов", "Elysium", "FireDub", "AveTurk", "Багичев", "Дасевич", "Twister", "Морозов", "Sam2007", "SesDizi", "AnyFilm", "Urasiko", "Wakanim", "Латышев", "Ващенко", "Сонотек", "Никитин", "Сонькин", "Кипарис", "Королёв", "RUSCICO", "Филонов", "Ошурков", "Герусов", "Пятница", "5 канал", "Amalgam", "Anistar", "AniWayt", "datynet", "DeadSno", "Eladiel", "ELYSIUM", "F-TRAIN", "FoxLife", "Janetta", "Kолобок", "LeDoyen", "Liga HQ", "lord666", "Macross", "McElroy", "NemFilm", "OpenDub", "PashaUp", "SOFTBOX", "To4kaTV", "TV 1000", "VicTeam", "ZM-SHOW", "Клюквин", "Матвеев", "Смирнов", "Бибиков", "Абдулов", "Данилов", "sf@irat", "Королев", "Люсьена", "Омикрон", "Парадиз", "Пепелац", "Синхрон", "Сокуров", "Хихидок", "AniBaza", "Ozz.tv", "Сербин", "Кравец", "SNK-TV", "Amedia", "Гоблин", "Kiitos", "Есарев", "Санаев", "Шварко", "Карцев", "Кашкин", "Мудров", "Иванов", "Котова", "Kansai", "ZEE TV", "AniDUB", "Ancord", "Berial", "Cuba77", "OSLIKt", "Tycoon", "Курдов", "Кошкин", "Stevie", "Лагута", "Кондор", "Киреев", "FocusX", "Пронин", "neko64", "Shaman", "GalVid", "D.I.M.", "Н-Кино", "Товбин", "binjak", "Акцент", "Козлов", "Нева-1", "Milvus", "Готлиб", "Zerzia", "Дьяков", "Вольга", "Строев", "Alezan", "ДиоНиК", "Стасюк", "TV1000", "NewDub", "Набиев", "Светла", "Nastia", "Emslie", "100 ТВ", "4u2ges", "Azazel", "BD CEE", "Boльгa", "den904", "Elegia", "Gemini", "Jetvis", "JimmyJ", "KANSAI", "kiitos", "L0cDoG", "LeXiKC", "Lisitz", "madrid", "Mikail", "MrRose", "Ozz TV", "Prolix", "RedDog", "Rumble", "Satkur", "Selena", "Suzaku", "WiaDUB", "WVoice", "Zendos", "Агапов", "Акопян", "Шуваев", "АБыГДе", "Акалит", "Альянс", "Анубис", "Anubis", "Арк-ТВ", "Бойков", "Вихров", "Векшин", "Гризли", "Гундос", "Пучков", "Живаго", "Жучков", "Зебуро", "Килька", "Лапшин", "Лизард", "Миняев", "НЕВА 1", "НЛО-TV", "Ракурс", "Россия", "С.Р.И.", "KOleso", "Гуртом", "ТВ СПб", "Швецов", "OnWave", "DZUSKI", "Kerob", "To4ka", "Чадов", "Живов", "ВГТРК", "Elrom", "Игмар", "Котов", "РенТВ", "Рыбин", "Ozeon", "Cmert", "Штейн", "zamez", "Гланц", "Белов", "Anika", "Lupin", "Ryc99", "ko136", "Рябов", "Amber", "Arisu", "DeMon", "Велес", "Акира", "Ворон", "Рудой", "С.Р.И", "Лайко", "D2Lab", "Jetix", "Попов", "Хабар", "Интер", "AniUA", "D2lab", "erogg", "IНТЕР", "JetiX", "PaDet", "RinGo", "seqw0", "SHIZA", "Solod", "ssvss", "Мишин", "АнВад", "Бигыч", "Рукин", "Штамп", "Новий", "Перец", "Райдо", "ТВЧ 1", "Laci", "ETV+", "Vano", "Jade", "RAIM", "Andy", "Нота", "Твин", "ИДДК", "Voiz", "CPIG", "Dice", "Gits", "ICTV", "jept", "KIHO", "Line", "SGEV", "Tori", "Troy", "Twix", "Чуев", "Инис", "Ирэн", "ТВ-3", "ТВИН", "ДТВ", "FOX", "НТВ", "СТС", "ICG", "ТВЦ", "2x2", "MTV", "Oni", "JAM", "AMS", "DDV", "AMC", "НСТ", "IVI", "КТК", "Че!", "MGM", "МИР", "ТНТ", "FDV", "ТВ3", "LDV", "1+1", "2+2", "2х2", "AOS", "CDV", "MCA", "QTV", "TB5", "VHS", "АМС", "ГКГ", "ИГМ", "НТН", "РТР", "ТВ6", "ТРК", "UKR", "D1", "R5", "К9"];

    /**
     * Разбор названия торрент-раздачи.
     *
     * Свой, а не штатный Lampa.TitleParser: у того три дыры, которые нам критичны —
     * CAMRip/TSRip не распознаются (шаблон 'CAM(?![a-zA-Z])' ломается о 'Rip'),
     * кириллическая 'х' в '03х01' даёт первый сезон вместо третьего,
     * а 'HDR10+' не считается за HDR. Починить в апстриме мы не можем.
     *
     * @param {string} title - название раздачи
     * @returns {{source: string, is_cam: boolean, source_rank: number, resolution: number|null,
     *            hdr: boolean, dv: boolean, season: number|null, seasons: number[],
     *            episodes: number[]|null, year: number|null, voices: string[], langs: string[]}}
     */
    function parse(title) {
      var raw = (title || '') + '';
      var norm = normalize(raw);
      var source = detectSource(norm);
      return {
        source: source,
        is_cam: CAM_SOURCES.indexOf(source) >= 0,
        source_rank: SOURCE_RANK[source] || 0,
        resolution: detectResolution(norm),
        hdr: detectHdr(norm),
        dv: detectDolbyVision(norm),
        season: detectSeason(norm),
        seasons: detectSeasons(norm),
        episodes: detectEpisodes(norm),
        year: detectYear(norm),
        voices: detectVoices(raw),
        langs: detectLangs(norm)
      };
    }

    /**
     * Приводим к нижнему регистру и чиним кириллицу в номерах.
     * В русских раздачах пишут '03х01' и '1080р' кириллическими буквами.
     */
    function normalize(title) {
      return (title + '').toLowerCase().replace(/(\d)\s*х\s*(\d)/g, '$1x$2') // 03х01 -> 03x01
      .replace(/(\d{3,4})\s*р\b/g, '$1p'); // 1080р -> 1080p
    }

    /** Экранки — их мы никогда не предлагаем по умолчанию */
    var CAM_SOURCES = ['cam', 'ts', 'tc', 'screener'];

    /**
     * Чем выше ранг, тем лучше источник записи.
     * Экранки получают ноль, неопознанный источник — середину: отсутствие тега
     * в названии не повод считать раздачу плохой.
     */
    var SOURCE_RANK = {
      bluray: 100,
      webdl: 90,
      bdrip: 80,
      webrip: 70,
      webdlrip: 65,
      hdrip: 60,
      hdtv: 50,
      dvdrip: 40,
      dvd: 30,
      unknown: 20,
      screener: 0,
      tc: 0,
      ts: 0,
      cam: 0
    };

    /**
     * Порядок проверок важен: сначала экранки, затем более длинные теги.
     * 'web-dlrip' обязан проверяться раньше 'web-dl', иначе поглотится.
     */
    var SOURCE_PATTERNS = [['cam', /\b(cam-?rip|hd-?cam|\bcam\b|экранка)/], ['ts', /\b(ts-?rip|tele-?sync|\bts\b)/], ['tc', /\b(tc-?rip|tele-?cine|\btc\b)/], ['screener', /\b(screener|dvd-?scr|\bscr\b)/], ['bluray', /\b(blu-?ray|bd-?remux|remux|bdmv)/], ['bdrip', /\bbd-?rip/], ['webdlrip', /\bweb-?dl-?rip/], ['webdl', /\bweb-?dl/], ['webrip', /\bweb-?rip/], ['hdrip', /\bhd-?rip/], ['hdtv', /\bhd-?tv/], ['dvdrip', /\bdvd-?rip/], ['dvd', /\bdvd/]];
    function detectSource(norm) {
      for (var i = 0; i < SOURCE_PATTERNS.length; i++) {
        if (SOURCE_PATTERNS[i][1].test(norm)) return SOURCE_PATTERNS[i][0];
      }
      return 'unknown';
    }

    /**
     * Разрешение из названия. Возвращаем null, если его нет — это НЕ признак экранки:
     * на живой выдаче четверть нормальных BDRip и WEB-DL идут без указания разрешения.
     */
    function detectResolution(norm) {
      if (/\b(2160p?|4k|uhd|ultra-?hd)\b/.test(norm)) return 2160;
      if (/\b(1080p?|full-?hd|fhd)\b/.test(norm)) return 1080;
      if (/\b720p?\b/.test(norm)) return 720;
      if (/\b480p?\b/.test(norm)) return 480;
      return null;
    }

    /**
     * После 'hdr' не должно идти букв, иначе за HDR принимаются 'HDRip'
     * и студия 'HDRezka' — оба случая пойманы на живой выдаче.
     */
    function detectHdr(norm) {
      return /\bhdr(?![a-zа-яё])\d*\+?/.test(norm);
    }
    function detectDolbyVision(norm) {
      return /dolby\s*vision|\bdv\b/.test(norm);
    }

    /**
     * Сезон. Порядок паттернов от специфичного к общему.
     */
    function detectSeason(norm) {
      var m;
      if (m = norm.match(/\b(\d{1,2})x\d{1,3}/)) return parseInt(m[1]);
      if (m = norm.match(/\bs(\d{1,2})e\d{1,3}/)) return parseInt(m[1]);
      if (m = norm.match(/(\d{1,2})\s*сезон/)) return parseInt(m[1]);
      if (m = norm.match(/сезон[:\s]*(\d{1,2})/)) return parseInt(m[1]);
      // аниме пишут номер сезона как [ТВ-4] или [TV-2].
      // Границу \b использовать нельзя: кириллица не входит в \w
      if (m = norm.match(/(?:^|[^a-zа-яё])(?:тв|tv)\s*-\s*(\d{1,2})\b/)) return parseInt(m[1]);
      if (m = norm.match(/\bs(\d{1,2})\b/)) return parseInt(m[1]);
      return null;
    }

    /** Диапазон сезонов: [s01-02] -> [1,2]. Для обычной раздачи — один сезон. */
    function detectSeasons(norm) {
      var range = norm.match(/\bs(\d{1,2})\s*-\s*s?(\d{1,2})\b/);
      if (range) {
        var from = parseInt(range[1]);
        var to = parseInt(range[2]);
        var list = [];
        for (var i = from; i <= to; i++) list.push(i);
        return list;
      }
      var season = detectSeason(norm);
      return season === null ? [] : [season];
    }

    /**
     * Серии. Возвращаем [от, до] — одиночная серия становится [5,5].
     */
    function detectEpisodes(norm) {
      var m;
      if (m = norm.match(/\b\d{1,2}x(\d{1,3})(?:\s*-\s*(\d{1,3}))?/)) {
        return [parseInt(m[1]), parseInt(m[2] || m[1])];
      }
      if (m = norm.match(/\bs\d{1,2}e(\d{1,3})(?:\s*-\s*(?:e)?(\d{1,3}))?/)) {
        return [parseInt(m[1]), parseInt(m[2] || m[1])];
      }

      // 'E1-12' без сезона — так подписывают аниме и дорамы
      if (m = norm.match(/(?:^|[^a-zа-яё0-9])e(\d{1,3})\s*-\s*(?:e)?(\d{1,3})\b/)) {
        return [parseInt(m[1]), parseInt(m[2])];
      }

      // одиночная серия; диапазон уже разобран шаблоном выше
      if (m = norm.match(/(?:^|[^a-zа-яё0-9])e(\d{1,3})\b/)) {
        return [parseInt(m[1]), parseInt(m[1])];
      }
      if (m = norm.match(/(\d{1,3})\s*-\s*(\d{1,3})\s*(?:сери|эп|из|of)/)) {
        return [parseInt(m[1]), parseInt(m[2])];
      }
      if (m = norm.match(/(\d{1,3})\s*сери/)) {
        return [parseInt(m[1]), parseInt(m[1])];
      }

      // «5 из 13 эп.», «12 of 24», «4 из ?» — сколько серий уже вышло
      if (m = norm.match(/(\d{1,3})\s*(?:из|of)\s*(?:\d{1,3}|\?)/)) {
        return [1, parseInt(m[1])];
      }
      return null;
    }

    /**
     * Год. Разрешения (2160, 1080) под шаблон не попадают — он ждёт 19xx или 20xx.
     */
    function detectYear(norm) {
      var m;
      if (m = norm.match(/\(((?:19|20)\d{2})\s*[-–]\s*(?:19|20)\d{2}\)/)) return parseInt(m[1]);
      if (m = norm.match(/\(((?:19|20)\d{2})\)/)) return parseInt(m[1]);
      if (m = norm.match(/\b((?:19|20)\d{2})\b/)) return parseInt(m[1]);
      return null;
    }

    /**
     * В словаре Lampa есть языковые и типовые пометки — их нельзя считать студиями.
     * Поймано на живой выдаче: 'Ukr/Eng' превращалось в озвучку «UKR».
     */
    var NOT_A_STUDIO = ['ukr', 'eng', 'rus', 'sub', 'dub', 'mvo', 'dvo', 'avo', 'lmo', 'orig'];

    /**
     * Студии озвучки по словарю. Сортировка по длине нужна, чтобы длинное название
     * находилось раньше короткого, входящего в него как подстрока.
     */
    var voices_sorted = null;
    function detectVoices(title) {
      if (!title) return [];
      if (!voices_sorted) {
        voices_sorted = Voices.filter(function (v) {
          return NOT_A_STUDIO.indexOf(v.toLowerCase()) === -1;
        }).sort(function (a, b) {
          return b.length - a.length;
        });
      }
      var lower = (title + '').toLowerCase();
      var found = [];
      voices_sorted.forEach(function (voice) {
        var name = voice.toLowerCase();

        // короткие названия ищем только как отдельное слово, иначе ловим мусор
        if (name.length <= 4) {
          if (!new RegExp('(^|[^a-zа-яё0-9])' + escapeRegExp(name) + '([^a-zа-яё0-9]|$)', 'i').test(lower)) return;
        } else if (lower.indexOf(name) === -1) return;

        // пропускаем студию, если она уже вошла в найденное более длинное название
        if (found.some(function (f) {
          return f.toLowerCase().indexOf(name) >= 0;
        })) return;
        found.push(voice);
      });
      return found;
    }
    function escapeRegExp(str) {
      return (str + '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Языки раздачи. Двухбуквенные коды по названию не ищем — 'ru' и 'en'
     * слишком часто встречаются внутри обычных слов.
     *
     * 'укр' обязано стоять отдельным словом: иначе украинским становится любое
     * «Укрытие» — поймано на живой выдаче.
     */
    var LANG_PATTERNS = [
    // 'ukr' может быть склеено с количеством дорожек ('3xUkr'), поэтому слева границу
    // не требуем — важно лишь, чтобы справа не продолжалось слово
    ['uk', /ukr(?![a-zа-яё])|\bukrainian\b|українськ|укр(?![а-яё])/], ['ru', /\brus\b|\brussian\b|русск|дубляж|\bdub\b|многоголос|двухголос|\bmvo\b|\bdvo\b|\bavo\b|(^|[^а-яё])пм([^а-яё]|$)/], ['en', /\beng\b|\benglish\b|original/]];
    function detectLangs(norm) {
      var found = [];
      LANG_PATTERNS.forEach(function (pair) {
        if (pair[1].test(norm)) found.push(pair[0]);
      });
      return found;
    }

    /**
     * «Продолжить» — кнопка на карточке, запускающая нужную серию из торрента
     * без ручного выбора раздачи и файла.
     */

    var BUTTON_ICON = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <path d=\"M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z\" stroke=\"currentColor\" stroke-width=\"2.5\"/>\n    <path d=\"M10 8.5L15.5 12L10 15.5V8.5Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n</svg>";
    function startPlugin() {
      if (window.plugin_continue_ready) return;
      window.plugin_continue_ready = true;
      Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        try {
          addButton(e);
        } catch (err) {
          console.error('Continue', 'button error:', err);
        }
      });
    }

    /**
     * Кнопка вставляется первой в ряд, чтобы стать и визуально первой,
     * и сфокусированной по умолчанию: Controller берёт первый .selector.
     */
    function addButton(e) {
      var card = e.data.movie;
      var root = e.object.activity.render();
      var row = root.find('.full-start-new__buttons');
      if (!row.length || row.find('.button--continue').length) return;
      var button = $("<div class=\"full-start__button selector button--continue\" data-subtitle=\"\">\n        ".concat(BUTTON_ICON, "\n        <span>").concat(Lampa.Lang.translate('continue_button'), "</span>\n    </div>"));
      button.on('hover:enter', function () {
        onEnter(card, e.object);
      });
      row.prepend(button);
    }

    /**
     * Пока заглушка: показываем, что плагин видит карточку.
     * Логика подбора раздачи появится следующим шагом.
     */
    function onEnter(card) {
      var is_tv = !!(card.number_of_seasons || card.first_air_date);
      Lampa.Noty.show((is_tv ? 'Сериал' : 'Фильм') + ': ' + (card.title || card.name) + ' / ' + (card.original_title || card.original_name) + ' (' + ((card.release_date || card.first_air_date || '----') + '').slice(0, 4) + ')');
    }
    Lampa.Lang.add({
      continue_button: {
        ru: 'Продолжить',
        en: 'Continue',
        uk: 'Продовжити'
      }
    });
    if (window.appready) startPlugin();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
      });
    }

    // доступ для отладки: позволяет прогонять парсер на живой выдаче из консоли
    window.__continue = {
      parse: parse
    };
    var _continue = {
      parse: parse
    };

    return _continue;

})();

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
      var norm = normalize$1(raw);
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
    function normalize$1(title) {
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
     * Выбор раздачи: жёсткие отсечки, затем скоринг.
     *
     * Задача — не «найти лучшее качество», а «не запустить не то».
     * На живой выдаче ловушек больше, чем кажется: по запросу «Moana» приходят
     * три разных фильма, у сериала в топе по сидерам стоят чужие сезоны,
     * а самая качественная 4K-раздача бывает с нулём раздающих.
     */

    /** Разрешение в ранг. Неизвестное разрешение — не повод считать раздачу плохой. */
    var RESOLUTION_TIER = {
      2160: 4,
      1080: 3,
      720: 2,
      480: 1
    };

    /** Порядок ослабления фильтров, когда после отсечек не осталось никого */
    var RELAX_ORDER = ['voice', 'dv', 'hdr', 'sub', 'quality'];

    /** Разрешения фильтра Lampa в числа */
    var FILTER_QUALITY = {
      '4k': 2160,
      '1080p': 1080,
      '720p': 720
    };

    /**
     * Результат поиска к единому виду.
     * У JacRed есть готовый info, у настоящего Jackett — только заголовок,
     * поэтому опираемся на разбор названия, а info используем как уточнение.
     */
    function normalize(result) {
      var info = result.info || {};
      var parsed = parse(result.Title);

      // info.quality — это разрешение, а не тип источника: CAMRip [1080p] придёт
      // с quality 1080. Поэтому источник берём только из названия.
      if (parsed.resolution === null && info.quality) parsed.resolution = info.quality;
      if (!parsed.seasons.length && info.seasons && info.seasons.length) parsed.seasons = info.seasons;
      if (!parsed.voices.length && info.voices && info.voices.length) parsed.voices = info.voices;
      return {
        raw: result,
        title: result.Title,
        seeders: parseInt(result.Seeders) || 0,
        size: parseInt(result.Size) || 0,
        viewed: !!result.viewed,
        parsed: parsed
      };
    }

    /**
     * Убираем всё, что мешает сравнению названий: пунктуацию, латиницу вперемешку
     * с кириллицей не трогаем — сравниваем как есть, в нижнем регистре.
     */
    function simplify(str) {
      return ((str || '') + '').toLowerCase().replace(/[^a-zа-яё0-9]+/g, ' ').trim();
    }

    /**
     * Тот ли это фильм. Первая и главная проверка.
     *
     * Поиск ищет по строке, поэтому по «Moana» приходят и «Moana 2», и «Moana» 2016.
     * Отличить их можно только по году: название сиквела содержит название оригинала.
     *
     * Для сериала год не работает: в карточке стоит дата премьеры сериала, а раздача
     * несёт год своего сезона — у трёхлетнего сериала это расхождение в несколько лет.
     * Там отсекаем по номеру сезона.
     */
    function isSameTitle(cand, ctx) {
      var card_year = ctx.is_tv ? null : ctx.year;
      var year = cand.parsed.year;

      // Год известен с обеих сторон — сравниваем. Допуск в год: дата релиза
      // и дата раздачи расходятся на границе года.
      if (card_year && year && Math.abs(year - card_year) > 1) return false;
      var title = simplify(cand.title);
      var names = ctx.names.map(simplify).filter(function (n) {
        return n.length > 1;
      });
      if (!names.length) return true;
      return names.some(function (name) {
        return title.indexOf(name) >= 0;
      });
    }

    /**
     * Жёсткие отсечки. relax — множество ослабленных ограничений.
     */
    function hardFilter(list, ctx, relax) {
      return list.filter(function (cand) {
        var p = cand.parsed;

        // мёртвая раздача бесполезна, каким бы ни было качество
        if (!cand.seeders) return false;
        if (!isSameTitle(cand, ctx)) return false;
        if (ctx.no_cam && p.is_cam) return false;

        // нужный сезон обязан быть в раздаче
        if (ctx.season && p.seasons.length && p.seasons.indexOf(ctx.season) === -1) return false;

        // Как и нужная серия. Раздача «серии 1-2», когда нужна четвёртая,
        // бесполезна — предлагать её незачем.
        if (ctx.episode && p.episodes && !hasEpisode(cand, ctx)) return false;
        if (relax.indexOf('quality') === -1 && ctx.max_resolution && p.resolution) {
          if (p.resolution > ctx.max_resolution) return false;
        }
        if (relax.indexOf('hdr') === -1 && ctx.no_hdr && p.hdr) return false;
        if (relax.indexOf('dv') === -1 && ctx.no_dv && p.dv) return false;
        if (relax.indexOf('voice') === -1 && ctx.voice) {
          if (p.voices.indexOf(ctx.voice) === -1) return false;
        }

        // Язык проверяем только когда он в названии указан: у большинства раздач
        // языковых пометок нет вовсе, и отсекать их было бы неверно.
        if (ctx.langs.length && p.langs.length) {
          if (!p.langs.some(function (l) {
            return ctx.langs.indexOf(l) >= 0;
          })) return false;
        }
        return true;
      });
    }

    /**
     * Оценка кандидата. Веса подобраны так, чтобы количество раздающих
     * не могло перебить качество источника: 500 сидеров не делают экранку лучше рипа.
     */
    function score(cand, ctx) {
      var p = cand.parsed;
      var s = 0;
      s += (RESOLUTION_TIER[p.resolution] || 0) * 100;
      s += p.source_rank;

      // Продолжение из той же раздачи. Самый сильный сигнал: следующая серия
      // почти всегда лежит там же, где предыдущая, и переключать релиз посреди
      // сезона незачем.
      if (hasEpisode(cand, ctx)) s += 400;
      if (cand.viewed) s += 300;

      // Раздача, похожая на прошлую. Привычное качество важнее максимального:
      // если сериал смотрели в 1080p, незачем посреди сезона переходить на 4K.
      // Поэтому бонус заведомо больше разницы между соседними ступенями качества.
      if (ctx.last) {
        if (ctx.last.voice && p.voices.indexOf(ctx.last.voice) >= 0) s += 250;
        if (ctx.last.resolution && p.resolution === ctx.last.resolution) s += 250;
      }
      if (ctx.voice && p.voices.indexOf(ctx.voice) >= 0) s += 200;

      // студия, которую обычно смотрит пользователь
      if (ctx.voice_rating) {
        p.voices.forEach(function (v) {
          if (ctx.voice_rating[v]) s += 80;
        });
      }
      s += Math.min(cand.seeders, 100) * 0.5;
      return s;
    }

    /** Раздача содержит нужную серию */
    function hasEpisode(cand, ctx) {
      if (!ctx.episode || !cand.parsed.episodes) return false;
      return ctx.episode >= cand.parsed.episodes[0] && ctx.episode <= cand.parsed.episodes[1];
    }

    /**
     * Знакомая раздача, в которой лежит нужная серия. Если такая есть — спрашивать
     * не о чем: продолжаем ровно там, где остановились.
     */
    function sameRelease(list, ctx) {
      return list.find(function (cand) {
        return cand.viewed && hasEpisode(cand, ctx);
      }) || null;
    }

    /**
     * Основная точка входа.
     *
     * @param {Array} results - результаты Lampa.Parser.get
     * @param {Object} ctx - {names, year, season, episode, voice, lang, max_resolution,
     *                        no_hdr, no_dv, no_cam, voice_rating}
     * @returns {{list: Array, relaxed: string[], confident: boolean, reason: string}}
     */
    function pick(results, ctx) {
      var all = (results || []).map(normalize);
      var relax = [];
      var list = hardFilter(all, ctx, relax);

      // Ослабляем по одному, пока кто-нибудь не найдётся.
      // Иначе кнопка «умирает» на сериале, который выбранная студия не озвучивает.
      for (var i = 0; i < RELAX_ORDER.length && !list.length; i++) {
        relax = RELAX_ORDER.slice(0, i + 1);
        list = hardFilter(all, ctx, relax);
      }
      if (!list.length) {
        return {
          list: [],
          relaxed: relax,
          confident: false,
          continues: false,
          voices: [],
          reason: emptyReason(all, ctx)
        };
      }
      list.forEach(function (cand) {
        cand.score = score(cand, ctx);
      });
      list.sort(function (a, b) {
        return b.score - a.score;
      });
      var same = sameRelease(list, ctx);
      return {
        list: list,
        relaxed: relax,
        // продолжение из знакомой раздачи не требует подтверждения
        confident: !!same || isConfident(list, relax),
        continues: !!same,
        voices: voiceOptions(list, 5),
        reason: ''
      };
    }

    /**
     * Почему не осталось ни одного кандидата. Пользователю нужно понимать разницу
     * между «ничего нет», «есть только экранки» и «серия ещё не появилась в раздачах».
     */
    function emptyReason(all, ctx) {
      var same = all.filter(function (cand) {
        return cand.seeders && isSameTitle(cand, ctx);
      });
      if (!same.length) return 'not_found';
      if (same.every(function (cand) {
        return cand.parsed.is_cam;
      })) return 'only_cam';

      // раздачи нужного сезона есть, но ни в одной нет нужной серии
      if (ctx.episode) {
        var season = same.filter(function (cand) {
          var p = cand.parsed;
          return !ctx.season || !p.seasons.length || p.seasons.indexOf(ctx.season) >= 0;
        });
        if (season.length && !season.some(function (cand) {
          return hasEpisode(cand, ctx);
        })) return 'no_episode_yet';
      }
      return 'not_found';
    }

    /**
     * Уверенность в выборе.
     *
     * Близкие очки у лидеров — НЕ повод спрашивать: если оба варианта хороши,
     * пользователю всё равно, каким именно смотреть, а лишний вопрос ломает
     * весь смысл кнопки. Спрашиваем только когда пришлось нарушить то, что
     * пользователь задал сам: перевод или качество.
     */
    function isConfident(list, relax) {
      return relax.indexOf('voice') === -1 && relax.indexOf('quality') === -1;
    }

    /**
     * Разные студии в верхушке списка. Нужно, чтобы понять, есть ли вообще
     * из чего выбирать, когда предпочтение по озвучке ещё не задано.
     */
    function voiceOptions(list, limit) {
      var out = [];
      list.slice(0, limit || 5).forEach(function (cand) {
        cand.parsed.voices.forEach(function (v) {
          if (out.indexOf(v) === -1) out.push(v);
        });
      });
      return out;
    }

    /**
     * Контекст из карточки и фильтров Lampa.
     *
     * Фильтры берём те же, что у штатного экрана торрентов: они уже хранятся
     * отдельно для каждой карточки и синхронизируются через аккаунт.
     */
    function context(card, filter, params) {
      filter = filter || {};
      params = params || {};
      var names = [card.original_title, card.original_name, card.title, card.name].filter(Boolean);
      var year = ((card.release_date || card.first_air_date || '') + '').slice(0, 4);
      var quality = toArray(filter.quality).map(function (q) {
        return FILTER_QUALITY[q];
      }).filter(Boolean);
      return {
        names: names,
        year: parseInt(year) || null,
        is_tv: !!(card.number_of_seasons || card.original_name || card.first_air_date),
        season: params.season || null,
        episode: params.episode || null,
        voice: toArray(filter.voice)[0] || null,
        langs: langCodes(filter.lang),
        max_resolution: quality.length ? Math.max.apply(null, quality) : null,
        no_hdr: filter.hdr === 'no',
        no_dv: filter.dv === 'no',
        no_cam: params.no_cam !== false,
        voice_rating: params.voice_rating || null,
        last: params.last || null
      };
    }
    function toArray(value) {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }

    /** Языки, которые вообще умеет различать разбор названия */
    var KNOWN_LANGS = ['ru', 'uk', 'en'];

    /**
     * Фильтр Lampa хранит язык переведённым названием — «Русский», «Английский».
     * Приводим к кодам; заодно принимаем и сами коды, чтобы функцию можно было
     * вызывать вне приложения.
     */
    function langCodes(values) {
      var out = [];
      toArray(values).forEach(function (value) {
        var low = ((value || '') + '').toLowerCase();
        if (KNOWN_LANGS.indexOf(low) >= 0) {
          if (out.indexOf(low) === -1) out.push(low);
          return;
        }
        if (typeof Lampa === 'undefined' || !Lampa.Lang) return;
        KNOWN_LANGS.forEach(function (code) {
          var name = (Lampa.Lang.translate('filter_lang_' + code) + '').toLowerCase();
          if (name && name === low && out.indexOf(code) === -1) out.push(code);
        });
      });
      return out;
    }
    var pick$1 = {
      pick: pick,
      context: context,
      normalize: normalize,
      score: score
    };

    /**
     * Что именно запускать: продолжить начатую серию, включить следующую
     * или начать сериал с начала.
     *
     * Логика вынесена в чистую функцию: список серий и прогресс приходят снаружи,
     * поэтому её можно проверять тестами без запущенного приложения.
     */

    /**
     * Порог «досмотрено». Тот же, что в самой Lampa: плеер предлагает продолжить
     * только если просмотрено меньше 90%.
     */
    var WATCHED = 90;

    /**
     * @param {Array} episodes - [{season_number, episode_number}], по порядку выхода
     * @param {Function} viewOf - (season, episode) => {percent} прогресс по серии
     * @returns {{mode: string, season: number|null, episode: number|null, percent: number}}
     *
     * mode:
     *   resume — серия начата, но не досмотрена
     *   next   — предыдущая досмотрена, включаем следующую
     *   first  — ничего не смотрели
     *   done   — досмотрены все вышедшие серии
     */
    function decideSeries(episodes, viewOf) {
      var list = (episodes || []).filter(function (ep) {
        return ep && ep.episode_number;
      });
      if (!list.length) return {
        mode: 'first',
        season: null,
        episode: null,
        percent: 0
      };
      var last_index = -1;
      var last_view = null;

      // Идём с конца: интересует самая поздняя серия, к которой прикасались.
      // Перебор с начала дал бы неверный ответ, если сериал начали пересматривать.
      for (var i = list.length - 1; i >= 0; i--) {
        var view = viewOf(list[i].season_number, list[i].episode_number) || {};
        if (view.percent) {
          last_index = i;
          last_view = view;
          break;
        }
      }
      if (last_index === -1) {
        return {
          mode: 'first',
          season: list[0].season_number,
          episode: list[0].episode_number,
          percent: 0
        };
      }

      // начатую, но не досмотренную серию просто продолжаем
      if (last_view.percent < WATCHED) {
        return {
          mode: 'resume',
          season: list[last_index].season_number,
          episode: list[last_index].episode_number,
          percent: last_view.percent
        };
      }
      var next = list[last_index + 1];
      if (!next) {
        return {
          mode: 'done',
          season: list[last_index].season_number,
          episode: list[last_index].episode_number,
          percent: last_view.percent
        };
      }
      return {
        mode: 'next',
        season: next.season_number,
        episode: next.episode_number,
        percent: 0
      };
    }

    /**
     * Фильм: серий нет, решается только тем, начат он или нет.
     */
    function decideMovie(view) {
      var percent = (view || {}).percent || 0;
      if (!percent) return {
        mode: 'first',
        season: null,
        episode: null,
        percent: 0
      };
      if (percent < WATCHED) return {
        mode: 'resume',
        season: null,
        episode: null,
        percent: percent
      };
      return {
        mode: 'done',
        season: null,
        episode: null,
        percent: percent
      };
    }

    /**
     * Подпись под кнопкой. Показывает, что произойдёт по нажатию,
     * чтобы решение плагина не было неожиданным.
     */
    function label(decision, translate) {
      var t = translate || function (key) {
        return key;
      };
      if (decision.season && decision.episode) {
        var where = 'S' + decision.season + ' · ' + t('continue_episode') + ' ' + decision.episode;
        if (decision.mode === 'resume') return where + ' · ' + decision.percent + '%';
        return where;
      }
      if (decision.mode === 'resume') return decision.percent + '%';
      return '';
    }
    var resume = {
      decideSeries: decideSeries,
      decideMovie: decideMovie,
      label: label,
      WATCHED: WATCHED
    };

    /**
     * Запуск выбранной раздачи.
     *
     * Своей цепочки TorrServer здесь нет и не должно быть: Lampa.Torrent.start уже
     * умеет добавить торрент, дождаться файлов, разобрать серии, привязать прогресс
     * и собрать плейлист для перехода к следующей серии. Нам остаётся дождаться
     * списка файлов и нажать нужный за пользователя.
     */

    /** Сколько ждём тишины после последнего отрисованного файла */
    var SETTLE = 200;

    /** Сколько ждём сам список файлов: торрент может подниматься долго */
    var TIMEOUT = 90000;

    /**
     * @param {Object} candidate - выбранная раздача (из pick)
     * @param {Object} movie - карточка
     * @param {Object} want - {season, episode} или null для фильма
     * @param {Object} handlers - {onStart, onError}
     */
    function run(candidate, movie, want, handlers) {
      handlers = handlers || {};
      if (!Lampa.Torserver.url()) return fail(handlers, 'no_server');
      var files = [];
      var finished = false;
      var settle = null;
      var timeout = null;
      function listener(e) {
        if (e.type === 'render') {
          files.push(e);
          clearTimeout(settle);
          settle = setTimeout(choose, SETTLE);
        }

        // пользователь закрыл список сам — больше не вмешиваемся
        if (e.type === 'list_close') stop();
      }
      function choose() {
        if (finished) return;
        var target = want ? findEpisode(files, want) : findBiggest(files);

        // Нужной серии в раздаче нет. Список уже открыт — пусть выбирает сам,
        // это честнее, чем запустить наугад другую серию.
        if (!target) {
          stop();
          return fail(handlers, want ? 'no_episode' : 'no_file');
        }
        finished = true;
        stop();
        if (handlers.onStart) handlers.onStart(target.element);
        target.item.trigger('hover:enter');
      }
      function stop() {
        clearTimeout(settle);
        clearTimeout(timeout);
        Lampa.Listener.remove('torrent_file', listener);
      }
      Lampa.Listener.follow('torrent_file', listener);
      timeout = setTimeout(function () {
        if (finished) return;
        stop();
        fail(handlers, 'timeout');
      }, TIMEOUT);

      // poster нужен, чтобы торрент в TorrServer выглядел как карточка
      candidate.raw.poster = movie.img;
      Lampa.Torrent.start(candidate.raw, movie);
    }

    /** Файл нужной серии */
    function findEpisode(files, want) {
      return files.find(function (e) {
        return e.element && e.element.season === want.season && e.element.episode === want.episode;
      });
    }

    /**
     * Для фильма берём самый большой файл: в раздачах рядом лежат трейлеры и семплы.
     */
    function findBiggest(files) {
      var best = null;
      files.forEach(function (e) {
        if (!e.element) return;
        if (!best || (e.element.length || 0) > (best.element.length || 0)) best = e;
      });
      return best;
    }
    function fail(handlers, reason) {
      if (handlers.onError) handlers.onError(reason);
    }
    var run$1 = {
      run: run
    };

    /**
     * «Продолжить» — кнопка на карточке, запускающая нужную серию из торрента
     * без ручного выбора раздачи и файла.
     */

    /**
     * Круговая стрелка с треугольником внутри — «продолжить просмотр».
     * Стиль штатных кнопок: контур currentColor, толщина 2.5, высота 30.
     */
    var BUTTON_ICON = "<svg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <path d=\"M26.5 15C26.5 21.3513 21.3513 26.5 15 26.5C8.64873 26.5 3.5 21.3513 3.5 15C3.5 8.64873 8.64873 3.5 15 3.5C18.7014 3.5 21.9946 5.24784 24.1 7.96\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>\n    <path d=\"M25.2 2.8V9H19\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n    <path d=\"M12.8 10.7L19.4 15L12.8 19.3V10.7Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n</svg>";

    /**
     * Подпись рисуем сами: штатный data-subtitle виден только в выпадающем списке
     * кнопки «Смотреть», а нам нужно показать серию прямо на кнопке.
     */
    var BUTTON_STYLE = "<style id=\"continue-style\">\n    .full-start-new__buttons .full-start__button span.button--continue__hint{\n        display: inline-block !important;\n        margin-left: .7em;\n        font-size: 1.1em;\n        white-space: nowrap;\n    }\n</style>";
    function startPlugin() {
      if (window.plugin_continue_ready) return;
      window.plugin_continue_ready = true;
      if (!document.getElementById('continue-style')) $('body').append(BUTTON_STYLE);
      Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'complite') return;
        try {
          addButton(e);
        } catch (err) {
          console.error('Continue', 'button error:', err);
        }
      });

      // Возврат на карточку после просмотра: событие 'full' повторно не приходит,
      // а серия уже другая — подпись надо пересчитать, иначе она врёт.
      Lampa.Listener.follow('activity', function (e) {
        if (e.type !== 'start' || e.component !== 'full') return;
        try {
          var object = e.object;
          var card = object.activity && object.activity.card || object.card || object.movie;
          if (card && object.activity) hint(card, object.activity.render());
        } catch (err) {
          console.error('Continue', 'refresh error:', err);
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
        return onEnter(card);
      });
      row.prepend(button);
      hint(card, root);
    }

    /**
     * Подпись на кнопке: какая серия включится.
     *
     * Ищем кнопку в актуальном DOM, а не держим ссылку: за время запроса за сериями
     * карточка могла перерисоваться, и старый объект остался бы вне документа.
     */
    function hint(card, root) {
      describe(card, function (decision) {
        var live = root.find('.button--continue');
        if (!live.length) return;
        var text = resume.label(decision, Lampa.Lang.translate);
        live.find('.button--continue__hint').remove();
        if (!text) return;
        live.attr('data-subtitle', text);
        live.append("<span class=\"button--continue__hint\">".concat(text, "</span>"));
      });
    }

    /**
     * Что произойдёт по нажатию. Нужно и для подписи, и для самого запуска.
     */
    function describe(card, done) {
      if (!isSeries(card)) {
        return done(resume.decideMovie(Lampa.Timeline.view(Lampa.Utils.hash(card.original_title))));
      }
      episodes(card, function (list) {
        done(resume.decideSeries(list, function (season, episode) {
          return Lampa.Timeline.watchedEpisode(card, season, episode, true);
        }));
      });
    }
    function isSeries(card) {
      return !!(card.number_of_seasons || card.original_name || card.first_air_date);
    }

    /**
     * Вышедшие серии по порядку. Невышедшие отбрасываем: предлагать серию,
     * которой ещё нет, бессмысленно.
     */
    function episodes(card, done) {
      var numbers = [];
      for (var i = 1; i <= (card.number_of_seasons || 1); i++) numbers.push(i);
      Lampa.Api.seasons(card, numbers, function (data) {
        var out = [];
        var now = Date.now();
        numbers.forEach(function (number) {
          var season = data[number];
          if (!season || !season.episodes) return;
          season.episodes.forEach(function (ep) {
            var air = ep.air_date ? new Date(ep.air_date).getTime() : 0;
            if (air && air > now) return;
            out.push({
              season_number: ep.season_number || number,
              episode_number: ep.episode_number
            });
          });
        });
        done(out);
      });
    }

    /**
     * Нажатие: решаем что смотреть, ищем раздачу, запускаем.
     */
    function onEnter(card) {
      if (!Lampa.Storage.field('parser_use')) return notice('continue_error_noparser');
      Lampa.Loading.start(function () {
        Lampa.Loading.stop();
      });
      describe(card, function (decision) {
        search(card, function (results) {
          var filter = cardFilter(card);
          var params = {
            season: decision.season,
            episode: decision.episode,
            no_cam: Lampa.Storage.field('continue_no_cam') !== false,
            last: lastRelease(card),
            voice_rating: Lampa.Storage.get('continue_voices', '{}') || null
          };
          var out = pick$1.pick(results, pick$1.context(card, filter, params));
          Lampa.Loading.stop();
          if (!out.list.length) return nothingFound(card, out);
          if (needAsk(card, out)) return choose(card, out, decision);
          launch(card, out.list[0], decision);
        }, function () {
          Lampa.Loading.stop();
          notice('continue_error_search');
        });
      });
    }

    /**
     * Поиск раздач. Комбинация запроса собирается так же, как это делает
     * штатная кнопка торрентов, чтобы результаты совпадали с привычными.
     */
    function search(card, done, fail) {
      var year = ((card.first_air_date || card.release_date || '0000') + '').slice(0, 4);
      var combinations = {
        'df': card.original_title,
        'df_year': card.original_title + ' ' + year,
        'df_lg': card.original_title + ' ' + card.title,
        'df_lg_year': card.original_title + ' ' + card.title + ' ' + year,
        'lg': card.title,
        'lg_year': card.title + ' ' + year,
        'lg_df': card.title + ' ' + card.original_title,
        'lg_df_year': card.title + ' ' + card.original_title + ' ' + year
      };
      var title = card.title || card.name;
      var original = card.original_title || card.original_name;
      Lampa.Parser.get({
        movie: card,
        search: combinations[Lampa.Storage.field('parse_lang')] || original || title,
        search_one: title,
        search_two: original,
        page: 1
      }, function (data) {
        return done(data && data.Results || []);
      }, fail);
    }

    /**
     * Спрашивать ли пользователя.
     *
     * Смысл кнопки в том, чтобы не спрашивать. Вопрос уместен ровно в двух случаях:
     * пришлось нарушить заданные фильтры, либо это первое знакомство с тайтлом
     * и вариантов озвучки действительно несколько.
     */
    function needAsk(card, out) {
      if (!out.confident) return true;

      // продолжаем ту же раздачу, из которой смотрели прошлую серию
      if (out.continues) return false;

      // уже запускали этот тайтл — предпочтение известно
      if (lastRelease(card)) return false;
      return out.voices.length > 1;
    }

    /** Ключ карточки, общий для фильтров и нашего хранилища */
    function cardID(card) {
      return card.id + ':' + (isSeries(card) ? 'tv' : 'movie');
    }

    /**
     * Чем смотрели прошлый раз: студия и качество.
     *
     * Нужно на случай, когда прежней раздачи в выдаче уже нет — тогда берём
     * максимально похожую, а не начинаем выбор заново.
     */
    function lastRelease(card) {
      var all = Lampa.Storage.cache('continue_last', 150, {});
      var rec = all[cardID(card)];
      if (!rec) return null;
      return {
        voice: rec.v || null,
        resolution: rec.q || null
      };
    }

    /**
     * Пометить раздачу как открытую — тем же способом, что и штатный экран торрентов.
     *
     * Метку ставит сам компонент торрентов при запуске файла, но мы запускаем в обход
     * него, поэтому раздача оставалась непомеченной: следующая серия не опознавалась
     * как продолжение, и плагин каждый раз спрашивал заново. Заодно раздача получает
     * привычную галочку в обычном списке.
     */
    function markViewed(cand) {
      var viewed = Lampa.Storage.cache('torrents_view', 5000, []);
      var hash = cand.raw.hash || Lampa.Utils.hash(cand.title);
      if (viewed.indexOf(hash) >= 0) return;
      viewed.push(hash);
      Lampa.Storage.set('torrents_view', viewed);
    }
    function rememberRelease(card, cand) {
      var all = Lampa.Storage.cache('continue_last', 150, {});
      var cid = cardID(card);

      // перекладываем в конец: Storage.cache вытесняет по порядку вставки
      delete all[cid];
      all[cid] = {
        v: cand.parsed.voices[0] || null,
        q: cand.parsed.resolution || null,
        t: Date.now()
      };
      Lampa.Storage.set('continue_last', all);
      countVoice(cand);
    }

    /**
     * Рейтинг студий по всем просмотренным тайтлам.
     *
     * Нужен для первого запуска незнакомого сериала: предпочтение по нему ещё
     * не задано, но привычная студия обычно та же, что и в остальных.
     */
    function countVoice(cand) {
      var voice = cand.parsed.voices[0];
      if (!voice) return;
      var rating = Lampa.Storage.get('continue_voices', '{}') || {};
      rating[voice] = (rating[voice] || 0) + 1;
      var names = Object.keys(rating);

      // Затухание: свежие предпочтения должны весить больше давних, иначе
      // студия, которую смотрели три года назад, останется лидером навсегда.
      var total = names.reduce(function (sum, name) {
        return sum + rating[name];
      }, 0);
      if (total > 40) {
        names.forEach(function (name) {
          rating[name] = rating[name] / 2;
          if (rating[name] < 1) delete rating[name];
        });
      }

      // держим только заметные студии, чтобы ключ не разрастался
      names = Object.keys(rating).sort(function (a, b) {
        return rating[b] - rating[a];
      });
      if (names.length > 30) {
        names.slice(30).forEach(function (name) {
          return delete rating[name];
        });
      }
      Lampa.Storage.set('continue_voices', rating);
    }

    /**
     * Фильтры именно этой карточки — те же, что показывает штатный экран торрентов.
     */
    function cardFilter(card) {
      var all = Lampa.Storage.cache('torrents_filter_data', 500, {});
      var cid = card.id + ':' + (isSeries(card) ? 'tv' : 'movie');
      return all[cid] || Lampa.Storage.get('torrents_filter', '{}') || {};
    }

    /**
     * Ничего не подошло. Молчать нельзя — объясняем причину и даём выход
     * на обычный список раздач.
     */
    function nothingFound(card, out) {
      var keys = {
        only_cam: 'continue_only_cam',
        no_episode_yet: 'continue_no_episode_yet'
      };
      var text = Lampa.Lang.translate(keys[out.reason] || 'continue_not_found');
      Lampa.Select.show({
        title: Lampa.Lang.translate('continue_button'),
        items: [{
          title: text,
          subtitle: Lampa.Lang.translate('continue_open_torrents'),
          open_torrents: true
        }, {
          title: Lampa.Lang.translate('continue_cancel')
        }],
        onSelect: function onSelect(item) {
          Lampa.Controller.toggle('full_start');
          if (item.open_torrents) openTorrents(card);
        },
        onBack: function onBack() {
          return Lampa.Controller.toggle('full_start');
        }
      });
    }

    /**
     * Уверенности нет — короткий список лучших вариантов.
     * Пять строк на пульте пролистываются быстрее, чем сотня раздач с фильтрами.
     */
    function choose(card, out, decision) {
      var top = out.list.slice(0, 5);
      var items = top.map(function (cand) {
        return {
          title: candidateTitle(cand),
          subtitle: candidateSubtitle(cand),
          cand: cand
        };
      });

      // Одинаковые заголовки выбирать невозможно — различаем их трекером
      items.forEach(function (item, i) {
        var same = items.some(function (other, j) {
          return j !== i && other.title === item.title;
        });
        if (same && top[i].raw.Tracker) item.subtitle = top[i].raw.Tracker + ' · ' + item.subtitle;
      });
      items.push({
        title: Lampa.Lang.translate('continue_open_torrents'),
        open_torrents: true
      });
      Lampa.Select.show({
        title: Lampa.Lang.translate('continue_choose'),
        items: items,
        onSelect: function onSelect(item) {
          Lampa.Controller.toggle('full_start');
          if (item.open_torrents) return openTorrents(card);
          rememberVoice(card, item.cand);
          launch(card, item.cand, decision);
        },
        onBack: function onBack() {
          return Lampa.Controller.toggle('full_start');
        }
      });
    }
    function quality(cand) {
      var res = cand.parsed.resolution;
      var name = res === 2160 ? '4K' : res ? res + 'p' : Lampa.Lang.translate('continue_quality_unknown');
      if (cand.parsed.hdr) name += ' HDR';
      if (cand.parsed.dv) name += ' DV';
      return name;
    }

    /** Человекочитаемые названия источников */
    var SOURCE_NAMES = {
      bluray: 'Blu-ray',
      webdl: 'WEB-DL',
      bdrip: 'BDRip',
      webrip: 'WEBRip',
      webdlrip: 'WEB-DLRip',
      hdrip: 'HDRip',
      hdtv: 'HDTV',
      dvdrip: 'DVDRip',
      dvd: 'DVD',
      cam: 'CAMRip',
      ts: 'TS',
      tc: 'TC',
      screener: 'Screener'
    };

    /**
     * Заголовок строки: качество и озвучка — то, по чему реально выбирают.
     * Если студий в названии нет, показываем язык или источник, иначе строки
     * получаются одинаковыми и выбирать не из чего.
     */
    function candidateTitle(cand) {
      var parts = [quality(cand)];
      var voices = cand.parsed.voices;
      if (voices.length) parts.push(voices.slice(0, 3).join(', '));else {
        var langs = cand.parsed.langs.map(function (l) {
          return Lampa.Lang.translate('continue_lang_' + l);
        }).filter(Boolean);
        if (langs.length) parts.push(langs.join(', '));else if (SOURCE_NAMES[cand.parsed.source]) parts.push(SOURCE_NAMES[cand.parsed.source]);
      }
      return parts.join(' · ');
    }

    /**
     * Подзаголовок: скорость, размер, источник и предупреждения.
     */
    function candidateSubtitle(cand, decision) {
      var parts = [Lampa.Lang.translate('continue_seeds') + ': ' + cand.seeders];
      if (cand.raw.size) parts.push(cand.raw.size);

      // источник дублируем в подзаголовок, только если он не ушёл в заголовок
      if (cand.parsed.voices.length && SOURCE_NAMES[cand.parsed.source]) parts.push(SOURCE_NAMES[cand.parsed.source]);
      if (cand.viewed) parts.push(Lampa.Lang.translate('continue_seen'));
      return parts.join(' · ');
    }

    /**
     * Выбор пользователя сохраняем в тот же фильтр карточки, которым пользуется
     * штатный экран: тогда плагин и обычный список не расходятся, а выбор
     * уезжает в облако вместе с остальными настройками.
     */
    function rememberVoice(card, cand) {
      if (!cand.parsed.voices.length) return;
      var all = Lampa.Storage.cache('torrents_filter_data', 500, {});
      var cid = card.id + ':' + (isSeries(card) ? 'tv' : 'movie');
      var filter = all[cid] || {};
      filter.voice = [cand.parsed.voices[0]];
      delete all[cid];
      all[cid] = filter;
      Lampa.Storage.set('torrents_filter_data', all);
    }
    function launch(card, cand, decision) {
      if (decision.mode === 'done') notice('continue_all_watched');
      rememberRelease(card, cand);
      var want = decision.season && decision.episode ? {
        season: decision.season,
        episode: decision.episode
      } : null;
      run$1.run(cand, card, want, {
        onStart: function onStart() {
          return markViewed(cand);
        },
        onError: function onError(reason) {
          var keys = {
            no_server: 'continue_error_noserver',
            no_episode: 'continue_error_noepisode',
            no_file: 'continue_error_nofile',
            timeout: 'continue_error_timeout'
          };
          notice(keys[reason] || 'continue_not_found');
        }
      });
    }
    function openTorrents(card) {
      Lampa.Activity.push({
        url: '',
        title: Lampa.Lang.translate('title_torrents'),
        component: 'torrents',
        search: card.title || card.name,
        search_one: card.title || card.name,
        search_two: card.original_title || card.original_name,
        movie: card,
        page: 1
      });
    }
    function notice(key) {
      Lampa.Noty.show(Lampa.Lang.translate(key));
    }
    Lampa.Lang.add({
      continue_button: {
        ru: 'Смотреть',
        en: 'Watch',
        uk: 'Дивитися'
      },
      continue_episode: {
        ru: 'серия',
        en: 'episode',
        uk: 'серія'
      },
      continue_choose: {
        ru: 'Выберите раздачу',
        en: 'Choose a release',
        uk: 'Оберіть роздачу'
      },
      continue_not_found: {
        ru: 'Подходящих раздач не найдено',
        en: 'No suitable releases found',
        uk: 'Відповідних роздач не знайдено'
      },
      continue_only_cam: {
        ru: 'Есть только экранки',
        en: 'Only cam rips available',
        uk: 'Є лише екранки'
      },
      continue_open_torrents: {
        ru: 'Открыть список раздач',
        en: 'Open torrent list',
        uk: 'Відкрити список роздач'
      },
      continue_cancel: {
        ru: 'Отмена',
        en: 'Cancel',
        uk: 'Скасувати'
      },
      continue_seeds: {
        ru: 'Раздают',
        en: 'Seeds',
        uk: 'Роздають'
      },
      continue_quality_unknown: {
        ru: 'Качество не указано',
        en: 'Quality unknown',
        uk: 'Якість не вказана'
      },
      continue_seen: {
        ru: 'уже смотрели',
        en: 'watched before',
        uk: 'вже дивилися'
      },
      continue_no_episode_yet: {
        ru: 'Этой серии пока нет в раздачах',
        en: 'This episode is not in any release yet',
        uk: 'Цієї серії ще немає в роздачах'
      },
      continue_lang_ru: {
        ru: 'Русский',
        en: 'Russian',
        uk: 'Російська'
      },
      continue_lang_uk: {
        ru: 'Украинский',
        en: 'Ukrainian',
        uk: 'Українська'
      },
      continue_lang_en: {
        ru: 'Английский',
        en: 'English',
        uk: 'Англійська'
      },
      continue_all_watched: {
        ru: 'Все вышедшие серии просмотрены, включаю последнюю',
        en: 'All aired episodes watched, playing the last one',
        uk: 'Усі серії переглянуті, вмикаю останню'
      },
      continue_error_noserver: {
        ru: 'Не настроен TorrServer',
        en: 'TorrServer is not configured',
        uk: 'Не налаштовано TorrServer'
      },
      continue_error_noparser: {
        ru: 'Не включён поиск торрентов',
        en: 'Torrent search is disabled',
        uk: 'Не увімкнено пошук торентів'
      },
      continue_error_search: {
        ru: 'Поиск раздач не отвечает',
        en: 'Torrent search failed',
        uk: 'Пошук роздач не відповідає'
      },
      continue_error_noepisode: {
        ru: 'В раздаче нет нужной серии, выберите файл вручную',
        en: 'The release has no such episode, pick a file manually',
        uk: 'У роздачі немає потрібної серії, оберіть файл вручну'
      },
      continue_error_nofile: {
        ru: 'В раздаче не нашлось видеофайла',
        en: 'No video file in the release',
        uk: 'У роздачі не знайдено відеофайл'
      },
      continue_error_timeout: {
        ru: 'Раздача не отвечает, попробуйте другую',
        en: 'The release is not responding, try another',
        uk: 'Роздача не відповідає, спробуйте іншу'
      }
    });
    if (window.appready) startPlugin();else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') startPlugin();
      });
    }

    // доступ для отладки: позволяет прогонять парсер и отбор на живой выдаче из консоли
    window.__continue = {
      parse: parse,
      pick: pick$1,
      resume: resume,
      run: run$1
    };
    var _continue = {
      parse: parse,
      pick: pick$1,
      resume: resume,
      run: run$1
    };

    return _continue;

})();

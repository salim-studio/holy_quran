/**
 * Quran App - Main Logic
 * Implements State Management, API Layer, and UI Controller
 */

// --- Configuration & Constants ---
const API_BASE = 'https://api.quran.com/api/v4';
const DEFAULT_RECITER = 7; // Mishary Rashid Alafasy
const DEFAULT_TRANSLATION = 131; // Dr. Mustafa Khattab (English)
const DEFAULT_TAFSIR = 16; // Tafsir Muyassar

// Manual list of popular reciters to ensure they appear even if API pagination/filtering excludes them
const POPULAR_RECITERS = [
    { id: 7, reciter_name: "Mishary Rashid Alafasy" },
    { id: 13, reciter_name: "Saad Al-Ghamdi" },
    { id: 19, reciter_name: "Ahmed Al-Ajamy" },
    { id: 52, reciter_name: "Maher Al-Muaiqly" },
    { id: 3, reciter_name: "Abdur-Rahman as-Sudais" },
    { id: 10, reciter_name: "Sa`ud ash-Shuraym" },
    { id: 2, reciter_name: "AbdulBaset AbdulSamad (Murattal)" },
    { id: 1, reciter_name: "AbdulBaset AbdulSamad (Mujawwad)" },
    { id: 6, reciter_name: "Mahmoud Khalil Al-Husary" },
    { id: 22, reciter_name: "Muhammad Ayyub" },
    { id: 32, reciter_name: "Muhammad Jibreel" },
    { id: 18, reciter_name: "Salah Bukhatir" },
    { id: 43, reciter_name: "Salah Al-Budair" },
    { id: 4, reciter_name: "Abu Bakr al-Shatri" },
    { id: 5, reciter_name: "Hani ar-Rifai" },
    { id: 11, reciter_name: "Mohamed al-Tablawi" },
    { id: 54, reciter_name: "AbdulBaset AbdulSamad (Warsh)" }
];

const SECTION_TITLES_AR = {
    'ara-bukhari': {
        '1': 'بدء الوحي',
        '2': 'الإيمان',
        '3': 'العلم',
        '4': 'الوضوء',
        '5': 'الغسل',
        '6': 'الحيض'
        ,'15': 'الحج'
        ,'16': 'النكاح'
        ,'17': 'الرضاع'
        ,'18': 'الطلاق'
        ,'19': 'اللعان'
        ,'20': 'العتق'
    },
    'ara-muslim': {
        '1': 'كتاب الإيمان'
    }
};

function translateSectionName(name, bookId, id) {
    const specific = SECTION_TITLES_AR[bookId]?.[String(id)];
    if (specific) return specific;
    const rules = [
        { re: /Revelation/i, ar: 'بدء الوحي' },
        { re: /Belief|Faith/i, ar: 'الإيمان' },
        { re: /Knowledge/i, ar: 'العلم' },
        { re: /Ablutions|Wudu/i, ar: 'الوضوء' },
        { re: /Bathing|Ghusl/i, ar: 'الغسل' },
        { re: /Menstrual/i, ar: 'الحيض' },
        { re: /Purification/i, ar: 'الطهارة' },
        { re: /Prayer/i, ar: 'الصلاة' },
        { re: /Actions while Praying|Actions during Prayer|Acts of Prayer/i, ar: 'أفعال الصلاة' },
        { re: /Prostration|Sujood|Sujud/i, ar: 'السجود' },
        { re: /Bowings?|Ruku/i, ar: 'الركوع' },
        { re: /Tashahhud|At-Tahiyyat/i, ar: 'التشهد' },
        { re: /Recitation|Reading in Prayer|Qira?a/i, ar: 'القراءة في الصلاة' },
        { re: /Forgetfulness.*Prayer|Sujud.*Sahw|Mistakes.*Prayer/i, ar: 'سهو الصلاة' },
        { re: /Latecomer|Masbuq/i, ar: 'المسبوق' },
        { re: /Imam|Leading.*Prayer/i, ar: 'الإمام' },
        { re: /Zakat|Alms/i, ar: 'الزكاة' },
        { re: /Fasting|Sawm|Ramadan/i, ar: 'الصيام' },
        { re: /Pilgrimage|Hajj/i, ar: 'الحج' },
        { re: /(Two Festivals|Eids)/i, ar: 'العيدين' },
        { re: /Istisqa|Invoking.*Rain/i, ar: 'الاستسقاء' },
        { re: /Eclipses?|Kusuf/i, ar: 'الكسوف' },
        { re: /Adhan|Call to Prayer/i, ar: 'الأذان' },
        { re: /Friday|Jumu[’'‘]?a/i, ar: 'الجمعة' },
        { re: /Witr/i, ar: 'الوتر' },
        { re: /Tahajjud|Night Prayer/i, ar: 'التهجد' },
        { re: /Fear Prayer/i, ar: 'صلاة الخوف' },
        { re: /Shorten.*Prayer|Qasr/i, ar: 'قصر الصلاة' },
        { re: /Travel.*Prayer|Traveler/i, ar: 'صلاة المسافر' },
        { re: /Mosques/i, ar: 'المساجد' },
        { re: /Times? of Prayer/i, ar: 'مواقيت الصلاة' },
        { re: /Qibla|Direction of Prayer/i, ar: 'القبلة' },
        { re: /Sutrah/i, ar: 'سترة المصلي' },
        { re: /Congregation|Jama'?ah|Group Prayer/i, ar: 'الجماعة' },
        { re: /Supplications?|Du[’'‘]?a/i, ar: 'الدعاء' },
        { re: /Istikhara/i, ar: 'الاستخارة' },
        { re: /Tayammum/i, ar: 'التيمم' },
        { re: /Combining.*Prayers|Jam[’'‘]?a between/i, ar: 'جمع الصلوات' },
        { re: /Raising.*Hands|Raf[‘’'"]? al-yadayn/i, ar: 'رفع اليدين' },
        { re: /Sujud.*Tilawah|Prostration.*Recitation/i, ar: 'سجود التلاوة' },
        { re: /Prostration.*Gratitude|Sujud.*Shukr/i, ar: 'سجود الشكر' },
        { re: /Qunut/i, ar: 'القنوت' },
        { re: /Taslim|Salutation.*Prayer/i, ar: 'التسليم' },
        { re: /Description.*Prayer|Sifat.*Salat/i, ar: 'صفة الصلاة' },
        { re: /Sitting.*Prayer|Julus.*Salat/i, ar: 'الجلوس في الصلاة' },
        { re: /Istinja|Cleaning.*Impurities/i, ar: 'الاستنجاء' },
        { re: /Nullifiers? of Wudu|Breaks.*Ablution/i, ar: 'نواقض الوضوء' },
        { re: /Siwak|Miswak/i, ar: 'السواك' },
        { re: /Adab|Manners|Etiquette/i, ar: 'الأدب والأخلاق' },
        { re: /Zakat.*Fitr/i, ar: 'زكاة الفطر' },
        { re: /I'?tikaf|Seclusion/i, ar: 'الاعتكاف' },
        { re: /Tarawih/i, ar: 'التراويح' },
        { re: /Suckling|Breastfeeding|Rada[ai]/i, ar: 'الرضاع' },
        { re: /Invoking.*Curses|Li[’'‘]?an/i, ar: 'اللعان' },
        { re: /Emancipat.*Slaves|Manumission|Itq/i, ar: 'العتق' },
        { re: /Gifts?|Hibah?/i, ar: 'الهبة' },
        { re: /Witness(es)?|Shahada/i, ar: 'الشهادات' },
        { re: /Blood Money|Diyya/i, ar: 'الديات' },
        { re: /Hudud|Punishments?/i, ar: 'الحدود' },
        { re: /Military Expeditions|Maghazi/i, ar: 'المغازي' },
        { re: /Beginning.*Creation/i, ar: 'بدء الخلق' },
        { re: /Prophets?/i, ar: 'الأنبياء' },
        { re: /Virtues.*Qur'?an/i, ar: 'فضائل القرآن' },
        { re: /Tafsir/i, ar: 'التفسير' },
        { re: /Softening.*Hearts|Ar-?Riqaq/i, ar: 'الرقاق' },
        { re: /Trials?|Fitan/i, ar: 'الفتن' },
        { re: /Oppression|Mazalim/i, ar: 'المظالم' },
        { re: /Agriculture|Farming/i, ar: 'الزراعة' },
        { re: /Partnership|Company|Sharikah/i, ar: 'الشركة' },
        { re: /Endowments?|Waqf|Habs/i, ar: 'الوقف' },
        { re: /Lost.*Property|Luqata/i, ar: 'اللقطة' },
        { re: /Hiring|Ijara/i, ar: 'الإجارة' },
        { re: /Funerals?|Janazah/i, ar: 'الجنائز' },
        { re: /Hajj|Umra|Umrah/i, ar: 'الحج والعمرة' },
        { re: /Sacrifice|Udhiyah|Slaughter/i, ar: 'الضحايا والذبائح' },
        { re: /Oaths|Vows|Nadhr/i, ar: 'الأيمان والنذور' },
        { re: /Medicine|Healing|Tibb/i, ar: 'الطب' },
        { re: /Drinks/i, ar: 'الأشربة' },
        { re: /Foods?/i, ar: 'الأطعمة' },
        { re: /Dress|Clothing/i, ar: 'اللباس' },
        { re: /Sales|Trade|Business/i, ar: 'البيوع' },
        { re: /Marriage|Nikah/i, ar: 'النكاح' },
        { re: /Divorce|Talaq/i, ar: 'الطلاق' },
        { re: /Jihad|Fighting/i, ar: 'الجهاد' },
        { re: /Judgement|Rulings|Court/i, ar: 'الأحكام' }
    ];
    for (const r of rules) {
        if (r.re.test(name)) return r.ar;
    }
    return name;
}

// --- State Management ---
const state = {
    mode: 'quran', // 'quran' or 'sunnah'
    currentSurah: 1,
    currentReciter: DEFAULT_RECITER,
    currentTranslation: DEFAULT_TRANSLATION,
    currentTafsir: DEFAULT_TAFSIR,
    chapters: [],
    verses: [],
    audioState: {
        isPlaying: false,
        currentAyahIndex: 0,
        audioUrl: null
    },
    settings: {
        fontSize: 24,
        debugEnabled: false
    },
    debugLogs: [],
    debugMaxLogs: 200,
    // Sunnah State
    hadithBooks: [
        { id: 'ara-bukhari', name: 'صحيح البخاري', author: 'الإمام البخاري' },
        { id: 'ara-muslim', name: 'صحيح مسلم', author: 'الإمام مسلم' },
        { id: 'ara-abudawud', name: 'سنن أبي داود', author: 'أبو داود' },
        { id: 'ara-ibnmajah', name: 'سنن ابن ماجه', author: 'ابن ماجه' },
        { id: 'ara-nasai', name: 'سنن النسائي', author: 'النسائي' },
        { id: 'ara-tirmidhi', name: 'جامع الترمذي', author: 'الترمذي' },
        { id: 'ara-musnadahmad', name: 'مسند أحمد', author: 'الإمام أحمد' },
        { id: 'ara-malik', name: 'موطأ مالك', author: 'الإمام مالك' }
    ],
    currentHadithBook: null,
    currentHadithSection: null,
    hadithByNumber: {},
    hadithCommentarySource: 'auto'
};

const HADITH_COMMENTARIES = {
    'ara-bukhari': {
        1: 'قال ابن حجر في فتح الباري: قوله «إنما الأعمال بالنيات» أصلٌ عظيمٌ في أبواب الدين، تُعتبر به الأعمال الظاهرة، فصلاحها وفسادها بحسب القصد، والمراد بالنية تمييز العبادات عن العادات، وتعيين المقصود من الفعل، وفيه الإخلاص لله وترك الرياء.',
        2: 'فتح الباري: بيّن البخاري ابتداء الوحي وأنه تدرّج، وذكر صلصلة الجرس وتمثُّل الملك، وفيه إثبات أن الوحي أنواع، وبيان شدته على النبي صلى الله عليه وسلم، وفي الحديث إثبات حقيقة الوحي والملك.',
        3: 'فتح الباري: فيه أن بداية الوحي كانت بالرؤيا الصالحة، ثم حُبِّب إليه الخلوة فكان يتحنّث في غار حراء، وفيه مشروعية التفكّر والاعتزال عن الباطل قبل البعثة، وذكر أول ما نزل من القرآن.',
        4: 'فتح الباري: أحكام الوضوء مستفادة من النصوص، والباب يجمع مسائل النية والتسمية ومسح الرأس وتقديم الأعضاء، وبيان فضل إسباغ الوضوء على المكاره.',
        5: 'فتح الباري: باب الغسل يشتمل على فروضه وسننه، وفيه كفاية التعميم بالماء مع النية، وذكر كيفية غسل النبي صلى الله عليه وسلم.',
        6: 'فتح الباري: باب الحيض يتناول أمده وأحكامه، وما يصح من الصلاة والصوم معه، وفيه بيان الطهر والتمييز بين دم الحيض والاستحاضة.'
    },
    'ara-muslim': {
        93: 'النووي: حديث جبريل أصل عظيم يجمع مراتب الدين: الإسلام والإيمان والإحسان، وتفسيرها كما في الحديث، وفيه أن الإيمان يشمل الاعتقاد بأصول ستة، والإحسان أعلى المراتب وهو مراقبة الله، وأن علم الساعة عند الله مع ذكر أشراطها.',
        100: 'النووي: في حديث الأعرابي بيان أركان الإسلام العملية ووجوبها، وأن الاقتصار على الفرائض كافٍ في دخول الجنة لمن صدق ووفّى بها، وفيه الرفق بالسائل وحسن التعليم.',
        101: 'النووي: زيادة «وأبيه» في اللفظ ليست على ظاهرها، بل هي جارية مجرى الكلام المعتاد عند العرب لا يقصد بها الحلف، وقد اختلف في توجيهها، والأصح أنها ليست يميناً.',
        102: 'النووي: النهي عن كثرة السؤال المذموم، ومشروعية السؤال النافع، وحرص الصحابة على التعلم، وفيه آدابُ السؤال وطلب العلم.'
    }
};

const HADITH_SECTION_SUMMARIES = {
    'ara-bukhari': {
        '1': 'فتح الباري: بدء الوحي بأنواعه، وبيان شدة الوحي، وابتداء الرؤيا الصالحة ثم نزول اقرأ، وإشارات إلى الحكمة من تمهيد النبوة.',
        '4': 'فتح الباري: باب الوضوء، أهم مسائله النية والتسمية ومسح الرأس والموالاة، وفضيلة إسباغ الوضوء على المكاره.',
        '5': 'فتح الباري: باب الغسل، فروضه التعميم بالماء والنية، وسننه كيفية غسل النبي صلى الله عليه وسلم وترتيبه.',
        '6': 'فتح الباري: باب الحيض، أحكامه ومدته والتمييز بين دم الحيض والاستحاضة، وما يصح من العبادات معه.'
    },
    'ara-muslim': {
        '1': 'شرح النووي: كتاب الإيمان، يبيّن حقيقة الإيمان وأصوله الستة، ويذكر مراتب الدين وفضائلها.'
    }
};

// --- API Layer ---

const api = {
    async fetchChapters() {
        try {
            const response = await fetch(`${API_BASE}/chapters?language=ar`);
            const data = await response.json();
            return data.chapters;
        } catch (error) {
            console.error('Error fetching chapters:', error);
            return [];
        }
    },

    async fetchVerses(chapterId) {
        try {
            // Fetch verses with Uthmani text and Translation
            const response = await fetch(`${API_BASE}/verses/by_chapter/${chapterId}?language=en&words=false&translations=${state.currentTranslation}&fields=text_uthmani&per_page=300`);
            const data = await response.json();
            return data.verses;
        } catch (error) {
            console.error('Error fetching verses:', error);
            return [];
        }
    },

    async fetchRecitations() {
        try {
            const response = await fetch(`${API_BASE}/resources/recitations?language=ar`);
            const data = await response.json();
            
            // Merge API results with POPULAR_RECITERS, avoiding duplicates
            const apiReciters = data.recitations || [];
            const mergedReciters = [...POPULAR_RECITERS];
            
            apiReciters.forEach(apiReciter => {
                if (!mergedReciters.some(r => r.id === apiReciter.id)) {
                    mergedReciters.push(apiReciter);
                }
            });

            // Sort by name for better UX
            return mergedReciters.sort((a, b) => a.reciter_name.localeCompare(b.reciter_name, 'ar'));
        } catch (error) {
            console.error('Error fetching recitations:', error);
            // Fallback to local list if API fails
            return POPULAR_RECITERS;
        }
    },

    async fetchTranslations() {
        try {
            const response = await fetch(`${API_BASE}/resources/translations?language=en`); // Fetch available translations
            const data = await response.json();
            return data.translations;
        } catch (error) {
            console.error('Error fetching translations:', error);
            return [];
        }
    },
    
    async fetchTafsirs() {
        try {
            const response = await fetch(`${API_BASE}/resources/tafsirs?language=ar`);
            const data = await response.json();
            return data.tafsirs;
        } catch (error) {
            console.error('Error fetching tafsirs:', error);
            try {
                const response = await fetch('tafsirs.json');
                const data = await response.json();
                return data.tafsirs;
            } catch (localError) {
                console.error('Error fetching local tafsirs:', localError);
                return [];
            }
        }
    },
    
    async fetchTafsir(verseKey) {
        try {
            const response = await fetch(`${API_BASE}/tafsirs/${state.currentTafsir}/by_ayah/${verseKey}`);
            const data = await response.json();
            return data.tafsir;
        } catch (error) {
            console.error('Error fetching tafsir:', error);
            return null;
        }
    },

    async getChapterAudio(chapterId, reciterId) {
        try {
            const response = await fetch(`${API_BASE}/chapter_recitations/${reciterId}/${chapterId}`);
            const data = await response.json();
            return data.audio_file;
        } catch (error) {
            console.error('Error fetching audio:', error);
            return null;
        }
    },

    async fetchHadithSections(bookId) {
        const sources = [
            `https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/${bookId}/sections.json`,
            `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${bookId}/sections.json`,
            `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${bookId}/sections.min.json`
        ];
        for (const url of sources) {
            try {
                const resp = await fetch(url);
                if (!resp.ok) continue;
                const data = await resp.json();
                if (data && typeof data === 'object') {
                    return Object.entries(data)
                        .map(([id, name]) => ({ id, name: translateSectionName(name, bookId, id) }))
                        .sort((a, b) => parseInt(a.id) - parseInt(b.id));
                }
            } catch (_) {
            }
        }
        try {
            const maxProbe = 120;
            const sections = [];
            let consecutiveFails = 0;
            for (let i = 1; i <= maxProbe; i++) {
                try {
                    const resp = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${bookId}/sections/${i}.json`);
                    if (!resp.ok) {
                        consecutiveFails++;
                        if (consecutiveFails >= 5) break;
                        continue;
                    }
                    const sdata = await resp.json();
                    const nameSource = sdata?.metadata?.section?.[String(i)] || `القسم ${i}`;
                    const name = translateSectionName(nameSource, bookId, i);
                    sections.push({ id: String(i), name });
                    consecutiveFails = 0;
                    if (sections.length >= 30) break;
                } catch {
                    consecutiveFails++;
                    if (consecutiveFails >= 5) break;
                }
            }
            return sections;
        } catch (error) {
            console.error('Error fetching hadith sections (fallback):', error);
            return [];
        }
    },

    async fetchHadiths(bookId, sectionId) {
        try {
            const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${bookId}/sections/${sectionId}.json`);
            if (!response.ok) throw new Error('Failed to load hadiths');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching hadiths:', error);
            return null;
        }
    }
};

// --- UI Controller ---

window.ui = {
    elements: {
        sidebar: document.getElementById('sidebar'),
        surahList: document.getElementById('surahList'),
        sunnahList: document.getElementById('sunnahList'),
        searchInput: document.getElementById('searchInput'),
        currentSurahName: document.getElementById('currentSurahName'),
        currentSurahInfo: document.getElementById('currentSurahInfo'),
        versesList: document.getElementById('versesList'),
        quranContainer: document.getElementById('quranContainer'),
        sunnahContainer: document.getElementById('sunnahContainer'),
        hadithHeader: document.getElementById('hadithHeader'),
        currentBookName: document.getElementById('currentBookName'),
        currentSectionName: document.getElementById('currentSectionName'),
        hadithList: document.getElementById('hadithList'),
        hadithLoader: document.getElementById('hadithLoader'),
        loader: document.getElementById('loader'),
        bismillah: document.getElementById('bismillah'),
        audioPlayer: document.getElementById('audioPlayer'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        progressBar: document.getElementById('progressBar'),
        audioElement: document.getElementById('audioElement'),
        settingsModal: document.getElementById('settingsModal'),
        tafsirModal: document.getElementById('tafsirModal'),
        tafsirContent: document.getElementById('tafsirContent'),
        hadithCommentaryModal: document.getElementById('hadithCommentaryModal'),
        hadithCommentaryContent: document.getElementById('hadithCommentaryContent'),
        reciterSelect: document.getElementById('reciterSelect'),
        tafsirSelect: document.getElementById('tafsirSelect'),
        translationSelect: document.getElementById('translationSelect'),
        fontSizeRange: document.getElementById('fontSizeRange'),
        tabQuran: document.getElementById('tabQuran'),
        tabSunnah: document.getElementById('tabSunnah'),
        debugPanel: document.getElementById('debugPanel'),
        debugList: document.getElementById('debugList')
    },

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.log('تهيئة الواجهة');
    },

    bindEvents() {
        // Sidebar Toggles
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            this.elements.sidebar.classList.toggle('-translate-x-full');
            this.elements.sidebar.classList.toggle('translate-x-0');
        });
        
        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.elements.sidebar.classList.add('translate-x-full'); // Mobile hidden
            this.elements.sidebar.classList.remove('translate-x-0');
        });

        // Mode Switching
        this.elements.tabQuran.addEventListener('click', () => this.switchMode('quran'));
        this.elements.tabSunnah.addEventListener('click', () => this.switchMode('sunnah'));

        this.elements.translationSelect.addEventListener('change', (e) => {
            state.currentTranslation = e.target.value;
            this.loadSurah(state.currentSurah);
        });

        // Tafsir Change
        this.elements.tafsirSelect.addEventListener('change', (e) => {
            state.currentTafsir = e.target.value;
        });

        // Search
        this.elements.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (state.mode === 'quran') {
                this.renderSurahList(state.chapters.filter(c => c.name_arabic.includes(query) || c.name_simple.toLowerCase().includes(query.toLowerCase())));
            } else {
                 if (state.currentHadithBook && !state.currentHadithSection) {
                     // Searching sections
                     if (state.hadithSections) {
                        this.renderHadithSections(state.hadithSections.filter(s => s.name.includes(query)));
                     }
                 } else if (!state.currentHadithBook) {
                     // Searching books
                     this.renderHadithBooks(state.hadithBooks.filter(b => b.name.includes(query) || b.author.includes(query)));
                 }
            }
        });

        // Settings Modal
        document.getElementById('openSettings').addEventListener('click', () => {
            this.elements.settingsModal.classList.remove('hidden');
        });
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.elements.settingsModal.classList.add('hidden');
        });
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
            this.elements.settingsModal.classList.add('hidden');
        });

        // Tafsir Modal
        document.getElementById('closeTafsir').addEventListener('click', () => {
            this.elements.tafsirModal.classList.add('hidden');
        });
        document.getElementById('closeHadithCommentary').addEventListener('click', () => {
            this.elements.hadithCommentaryModal.classList.add('hidden');
        });

        const dbgToggle = document.getElementById('debugToggle');
        if (dbgToggle) {
            dbgToggle.addEventListener('change', (e) => {
                state.settings.debugEnabled = e.target.checked;
                if (e.target.checked) {
                    this.elements.debugPanel.classList.remove('hidden');
                    this.renderDebugLogs();
                    this.log('تم تفعيل وضع التصحيح');
                } else {
                    this.elements.debugPanel.classList.add('hidden');
                    this.log('تم إيقاف وضع التصحيح');
                }
            });
        }
        const closeDbg = document.getElementById('closeDebug');
        if (closeDbg) {
            closeDbg.addEventListener('click', () => {
                this.elements.debugPanel.classList.add('hidden');
                state.settings.debugEnabled = false;
                const chk = document.getElementById('debugToggle');
                if (chk) chk.checked = false;
            });
        }
        const clearDbg = document.getElementById('clearDebug');
        if (clearDbg) {
            clearDbg.addEventListener('click', () => {
                state.debugLogs = [];
                this.renderDebugLogs();
            });
        }
        // Audio Controls
        this.elements.playPauseBtn.addEventListener('click', () => this.toggleAudio());
        this.elements.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.elements.audioElement.addEventListener('ended', () => this.resetAudioUI());
        
        // Font Size
        this.elements.fontSizeRange.addEventListener('input', (e) => {
            state.settings.fontSize = e.target.value;
            document.documentElement.style.setProperty('--font-size', `${e.target.value}px`);
            // Update existing verses and hadiths
            document.querySelectorAll('.verse-text, .hadith-text').forEach(el => el.style.fontSize = `${e.target.value}px`);
        });
    },

    switchMode(mode) {
        state.mode = mode;
        this.log(`تبديل الوضع إلى ${mode === 'quran' ? 'القرآن' : 'السنة'}`);
        if (mode === 'quran') {
            this.elements.tabQuran.classList.remove('text-gray-300', 'hover:text-white', 'hover:bg-white/10');
            this.elements.tabQuran.classList.add('bg-white', 'text-secondary', 'shadow-sm');
            
            this.elements.tabSunnah.classList.add('text-gray-300', 'hover:text-white', 'hover:bg-white/10');
            this.elements.tabSunnah.classList.remove('bg-white', 'text-secondary', 'shadow-sm');
            
            this.elements.surahList.classList.remove('opacity-0', 'pointer-events-none');
            this.elements.sunnahList.classList.add('opacity-0', 'pointer-events-none');
            
            this.elements.quranContainer.classList.remove('hidden');
            this.elements.sunnahContainer.classList.add('hidden');
            this.elements.audioPlayer.classList.remove('hidden'); 
        } else {
            this.elements.tabSunnah.classList.remove('text-gray-300', 'hover:text-white', 'hover:bg-white/10');
            this.elements.tabSunnah.classList.add('bg-white', 'text-secondary', 'shadow-sm');
            
            this.elements.tabQuran.classList.add('text-gray-300', 'hover:text-white', 'hover:bg-white/10');
            this.elements.tabQuran.classList.remove('bg-white', 'text-secondary', 'shadow-sm');
            
            this.elements.sunnahList.classList.remove('opacity-0', 'pointer-events-none');
            this.elements.surahList.classList.add('opacity-0', 'pointer-events-none');
            
            this.elements.sunnahContainer.classList.remove('hidden');
            this.elements.quranContainer.classList.add('hidden');
            this.elements.audioPlayer.classList.add('hidden');
            
            if (!state.currentHadithBook) {
                this.renderHadithBooks(state.hadithBooks);
            }
        }
    },
    
    log(message) {
        const ts = new Date().toLocaleTimeString('ar-EG');
        const entry = `${ts} • ${message}`;
        state.debugLogs.push(entry);
        if (state.debugLogs.length > state.debugMaxLogs) state.debugLogs.shift();
        if (state.settings.debugEnabled) this.renderDebugLogs();
        try { console.log('[DEBUG]', message); } catch (_) {}
    },

    renderDebugLogs() {
        if (!this.elements.debugList) return;
        const items = state.debugLogs.slice(-100);
        this.elements.debugList.innerHTML = items.map(l => `<div class="truncate">${l}</div>`).join('');
    },

    renderHadithBooks(books) {
        this.elements.sunnahList.innerHTML = books.map(book => `
            <div onclick="ui.loadHadithBook('${book.id}')" 
                 class="p-3 hover:bg-gray-100 cursor-pointer rounded-lg flex justify-between items-center transition ${state.currentHadithBook?.id === book.id ? 'bg-green-50 border-r-4 border-primary' : ''}">
                <div>
                    <h4 class="font-bold text-gray-800">${book.name}</h4>
                    <span class="text-xs text-gray-500">${book.author}</span>
                </div>
                <i class="fas fa-chevron-left text-xs text-gray-400"></i>
            </div>
        `).join('');
    },

    async loadHadithBook(bookId) {
        state.currentHadithBook = state.hadithBooks.find(b => b.id === bookId);
        state.currentHadithSection = null;
        this.renderHadithBooks(state.hadithBooks); 
        this.log(`تحميل كتاب ${state.currentHadithBook.name}`);
        
        this.elements.sunnahList.innerHTML = '<div class="text-center p-4 text-gray-400"><i class="fas fa-spinner fa-spin"></i> جاري تحميل الأقسام...</div>';
        
        const sections = await api.fetchHadithSections(bookId);
        state.hadithSections = sections; 
        
        this.renderHadithSections(sections);
        this.log(`الأقسام المحمّلة: ${sections.length}`);
    },

    renderHadithSections(sections) {
        const backBtn = `
            <div onclick="ui.renderHadithBooks(state.hadithBooks); state.currentHadithBook = null;" 
                 class="p-3 mb-2 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-lg flex items-center gap-2 text-gray-700 font-bold sticky top-0 bg-white z-10 border-b">
                <i class="fas fa-arrow-right"></i> الكتب
            </div>
        `;
        
        if (sections.length === 0) {
            this.elements.sunnahList.innerHTML = backBtn + '<div class="text-center p-4 text-red-500">فشل تحميل الأقسام</div>';
            return;
        }

        this.elements.sunnahList.innerHTML = backBtn + sections.map(section => `
            <div onclick="ui.loadHadithSection('${section.id}')" 
                 class="p-3 hover:bg-gray-100 cursor-pointer rounded-lg flex justify-between items-center transition ${state.currentHadithSection?.id === section.id ? 'bg-green-50 border-r-4 border-primary' : ''}">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">${section.id}</span>
                    <h4 class="font-bold text-gray-800 text-sm">${section.name}</h4>
                </div>
            </div>
        `).join('');
    },

    async loadHadithSection(sectionId) {
        state.currentHadithSection = state.hadithSections.find(s => s.id === sectionId);
        this.renderHadithSections(state.hadithSections); 
        
        this.elements.hadithHeader.classList.remove('hidden');
        this.elements.currentBookName.textContent = state.currentHadithBook.name;
        this.elements.currentSectionName.textContent = state.currentHadithSection.name;
        this.log(`تحميل قسم ${state.currentHadithSection.name}`);
        
        this.elements.hadithList.innerHTML = '';
        this.elements.hadithLoader.classList.remove('hidden');
        
        const data = await api.fetchHadiths(state.currentHadithBook.id, sectionId);
        this.elements.hadithLoader.classList.add('hidden');
        
        if (data && data.hadiths) {
            this.renderHadiths(data.hadiths);
            this.log(`عدد الأحاديث: ${data.hadiths.length}`);
        } else {
            this.elements.hadithList.innerHTML = '<div class="text-center p-4 text-red-500">فشل تحميل الأحاديث</div>';
            this.log('فشل تحميل الأحاديث');
        }
    },

    renderHadiths(hadiths) {
        state.hadithByNumber = {};
        hadiths.forEach(h => { state.hadithByNumber[h.hadithnumber] = h; });
        this.elements.hadithList.innerHTML = hadiths.map(hadith => `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div class="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                    <span class="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center font-bold font-quran text-lg">
                        ${hadith.hadithnumber}
                    </span>
                    <div class="flex gap-2">
                        <button onclick="navigator.clipboard.writeText('${hadith.text.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '')}')" class="text-gray-400 hover:text-primary transition" title="نسخ">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="ui.openHadithCommentaryByNumber(${hadith.hadithnumber})" class="text-gray-400 hover:text-accent transition" title="شرح">
                            <i class="fas fa-scroll"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right font-quran text-2xl leading-loose text-gray-800 mb-6 hadith-text" style="font-size: ${state.settings.fontSize}px">
                    ${hadith.text}
                </div>
                ${hadith.grades.length > 0 ? `
                <div class="mt-4 pt-4 border-t border-gray-50 text-sm text-gray-500">
                    <span class="font-bold">الحكــم:</span> ${hadith.grades.map(g => `<span class="${g.grade.toLowerCase().includes('sahih') ? 'text-green-600' : 'text-gray-600'}">${g.grade}</span>`).join(' - ')}
                </div>
                ` : ''}
            </div>
        `).join('');
    },
    
    openHadithCommentaryByNumber(n) {
        const h = state.hadithByNumber[n];
        if (!h) return;
        let content;
        const bookId = state.currentHadithBook?.id;
        const sectionId = h?.reference?.book ? String(h.reference.book) : undefined;
        const ref = h.reference ? `الكتاب: ${h.reference.book} • الحديث: ${h.reference.hadith}` : '';
        const label = bookId === 'ara-bukhari' ? 'فتح الباري' : (bookId === 'ara-muslim' ? 'شرح النووي' : 'شرح الحديث');
        const sectionSummary = sectionId ? HADITH_SECTION_SUMMARIES[bookId]?.[sectionId] : undefined;
        const specific = HADITH_COMMENTARIES[bookId]?.[n];
        const parts = [];
        parts.push(`<div class="mb-4 text-sm text-gray-500">${ref}</div>`);
        if (sectionSummary) {
            parts.push(`<h4 class="font-bold mb-2">${label}</h4><div class="leading-relaxed">${sectionSummary}</div>`);
        }
        if (specific) {
            parts.push(`<div class="mt-4 text-sm text-gray-700"><span class="font-bold">فائدة حديثية:</span> ${specific}</div>`);
        }
        if (!sectionSummary && !specific) {
            parts.push(this.generateAutoCommentary(h));
        }
        content = parts.join('');
        this.elements.hadithCommentaryContent.innerHTML = content;
        this.elements.hadithCommentaryModal.classList.remove('hidden');
    },
    
    generateAutoCommentary(hadith) {
        const defs = [
            { re: /وُضُوء|يتوضأ|وضوء/i, text: 'الوضوء: طهارة مخصوصة بغسل الأعضاء الأربعة وفق السنّة.' },
            { re: /غسل|اغتسل/i, text: 'الغسل: تعميم البدن بالماء بنية رفع الحدث الأكبر.' },
            { re: /تَيَمُّم|تيمم/i, text: 'التيمم: طهارة ترابية بلمس الصعيد ومسح الوجه واليدين عند فقد الماء أو العجز عنه.' },
            { re: /سجود|سجد/i, text: 'السجود: وضع الجبهة على الأرض مع بقية الأعضاء على هيئة الخضوع.' },
            { re: /ركوع|يركع/i, text: 'الركوع: انحناء البدن بعد القراءة مع تمكين اليدين من الركبتين.' },
            { re: /قنوت/i, text: 'القنوت: دعاء وخشوع في الصلاة في محلّه المخصوص عند النوازل.' },
            { re: /زكاة|صدقة/i, text: 'الزكاة: حقٌ مالي واجب في الأموال المحددة لصالح المستحقين.' },
            { re: /صوم|صيام|رمضان/i, text: 'الصيام: الإمساك عن المفطرات من الفجر إلى المغرب بنية التقرب.' },
            { re: /حج|عمرة/i, text: 'الحج والعمرة: نسكٌ مخصوص بأفعال وأركان في مكة والمشاعر.' },
            { re: /استسقاء/i, text: 'الاستسقاء: طلب السقيا من الله بصلاة أو دعاء عند القحط.' },
            { re: /عيد/i, text: 'العيد: شعيرة تتضمن صلاة وخطبة وأحكاماً في الفطر والأضحى.' },
            { re: /جنائز|جنازة|ميت/i, text: 'الجنائز: أحكام تجهيز الميت والصلاة عليه ودفنه والعزاء.' },
            { re: /طلاق|يطلق/i, text: 'الطلاق: إنهاء عقد النكاح بضوابط شرعية وقيود معتبرة.' },
            { re: /رضاع|يرضع/i, text: 'الرضاع: مصّ اللبن بما يثبت به التحريم وفق الضوابط.' },
            { re: /لعان/i, text: 'اللعان: مشاحة بين الزوجين بأيمان مخصوصة عند الاتهام بالزنا.' },
            { re: /عتق|اعتق/i, text: 'العتق: تحرير الرقبة من الرق وهو من مكارم الشريعة.' }
        ];
        const termNotes = defs.filter(d => d.re.test(hadith.text)).map(d => `• ${d.text}`).join('<br>');
        const grades = hadith.grades?.length ? hadith.grades.map(g => g.grade).join(' - ') : 'لا يوجد حكم مرفق';
        const ref = hadith.reference ? `الكتاب: ${hadith.reference.book} • الحديث: ${hadith.reference.hadith}` : '';
        const header = `<div class="mb-4 text-sm text-gray-500">${ref}</div>`;
        const sectionName = state.currentHadithSection?.name || '';
        const themeMap = [
            { re: /بدء الوحي/, text: 'يتناول بدايات نزول الوحي وأنواعه وتهيئة النبوة وابتداء الرؤيا الصالحة.' },
            { re: /الإيمان/, text: 'يبين حقيقة الإيمان وأصوله ومراتبه وعلاقته بالعمل والنية.' },
            { re: /العلم/, text: 'يقرر فضل العلم وآدابه وطرق تحصيله ومسؤولية التعليم والتعلم.' },
            { re: /الوضوء/, text: 'يشرح شروط الوضوء وفرائضه وسننه وفضيلة إسباغه.' },
            { re: /الغسل/, text: 'يبين فروض الغسل وكيفيته وما يتعلق بالطهارة الكبرى.' },
            { re: /الحيض/, text: 'يعرض أحكام الحيض ومدته والتمييز بينه وبين الاستحاضة.' },
            { re: /الصلاة/, text: 'يذكر صفة الصلاة وأركانها وآدابها وأحكام الجماعة.' },
            { re: /الصيام/, text: 'يبين أحكام الصيام وفضائله وما يتعلق بزمانه وآدابه.' },
            { re: /الحج|العمرة/, text: 'يتناول مناسك الحج والعمرة وأركانهما وواجباتهما.' },
            { re: /الجنائز/, text: 'يبين أحكام تجهيز الميت والصلاة عليه والدفن وآداب العزاء.' }
        ];
        const theme = (themeMap.find(t => t.re.test(sectionName))?.text) || 'يقدم هذا الباب معانيه العامة وأحكامه إجمالاً وفق ما تضمنته النصوص.';
        const isnadDetected = /حدثنا|أخبرنا|قال|عن/i.test(hadith.text);
        const isnadLine = isnadDetected ? '• يظهر في النص إسناد رواية بسلسلة من الرواة، وهو من سمات الصحيح.' : '• لا تظهر صيغة الإسناد كاملة في هذا اللفظ.';
        const notesBlock = `
            <h4 class="font-bold mb-2">مدخل إلى الباب</h4>
            <div class="leading-relaxed">${theme}</div>
            <h4 class="font-bold mt-4 mb-2">ملاحظات وشرح المصطلحات</h4>
            <div class="space-y-2">${isnadLine}${termNotes ? '<br>' + termNotes : ''}</div>
        `;
        return header + notesBlock + `<div class="mt-4 text-sm text-gray-500"><span class="font-bold">الحكم:</span> ${grades}</div>`;
    },

    async loadInitialData() {
        state.chapters = await api.fetchChapters();
        this.renderSurahList(state.chapters);
        this.log(`تحميل الفصول: ${state.chapters.length}`);
        
        // Load Settings Data
        const reciters = await api.fetchRecitations();
        this.renderReciterOptions(reciters);
        this.log(`القراء: ${reciters.length}`);

        const tafsirs = await api.fetchTafsirs();
        this.renderTafsirOptions(tafsirs);
        this.log(`التفاسير: ${tafsirs.length}`);

        const translations = await api.fetchTranslations();
        this.renderTranslationOptions(translations);
        this.log(`الترجمات: ${translations.length}`);

        // Load First Surah
        this.loadSurah(1);
        this.log('اكتملت التهيئة');
    },

    renderSurahList(chapters) {
        this.elements.surahList.innerHTML = chapters.map(chapter => `
            <div onclick="ui.loadSurah(${chapter.id})" 
                 class="p-3 hover:bg-gray-100 cursor-pointer rounded-lg flex justify-between items-center transition ${state.currentSurah === chapter.id ? 'bg-green-50 border-r-4 border-primary' : ''}">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">${chapter.id}</span>
                    <div>
                        <h4 class="font-bold text-gray-800">${chapter.name_arabic}</h4>
                        <span class="text-xs text-gray-500">${chapter.translated_name.name}</span>
                    </div>
                </div>
                <span class="text-xs text-gray-400">${chapter.verses_count} آية</span>
            </div>
        `).join('');
    },

    async loadSurah(id) {
        state.currentSurah = id;
        localStorage.setItem('quran_last_surah', id);
        this.elements.loader.classList.remove('hidden');
        this.elements.versesList.innerHTML = '';
        this.elements.bismillah.classList.add('hidden');
        
        // Highlight active surah in list (simple re-render or class toggle)
        this.renderSurahList(state.chapters); // Re-render to update active state
        
        // Update Header
        const chapter = state.chapters.find(c => c.id === id);
        if (chapter) {
            this.elements.currentSurahName.textContent = `سورة ${chapter.name_arabic}`;
            this.elements.currentSurahInfo.textContent = `${chapter.revelation_place === 'makkah' ? 'مكية' : 'مدنية'} • ${chapter.verses_count} آيات`;
        }

        // Fetch Verses
        const verses = await api.fetchVerses(id);
        state.verses = verses;
        
        this.renderVerses(verses);
        this.elements.loader.classList.add('hidden');
        if (id !== 1 && id !== 9) this.elements.bismillah.classList.remove('hidden'); // Show Bismillah except for Fatiha (part of it) and Tawbah

        // Setup Audio for this chapter
        this.setupAudio(id);
    },

    renderVerses(verses) {
        this.elements.versesList.innerHTML = verses.map(verse => `
            <div class="verse-container bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md" id="verse-${verse.verse_key}">
                <div class="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                    <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-mono">${verse.verse_key}</span>
                    <div class="flex gap-2">
                        <button onclick="ui.playAudioFrom('${verse.verse_key}')" class="text-gray-400 hover:text-primary transition" title="تشغيل"><i class="fas fa-play-circle"></i></button>
                        <button onclick="ui.showTafsir('${verse.verse_key}')" class="text-gray-400 hover:text-primary transition" title="تفسير"><i class="fas fa-book-open"></i></button>
                        <button class="text-gray-400 hover:text-accent transition" title="حفظ"><i class="far fa-bookmark"></i></button>
                    </div>
                </div>
                
                <p class="verse-text text-right font-uthmani text-3xl leading-loose text-gray-800 mb-6" style="font-size: ${state.settings.fontSize}px">
                    ${verse.text_uthmani}
                </p>
                
                <p class="text-gray-600 text-lg leading-relaxed border-t border-gray-50 pt-4">
                    ${verse.translations && verse.translations[0] ? verse.translations[0].text.replace(/<sup.*?<\/sup>/g, '') : ''}
                </p>
            </div>
        `).join('');
    },

    renderReciterOptions(reciters) {
        this.elements.reciterSelect.innerHTML = reciters
            .map(r => `<option value="${r.id}" ${r.id === state.currentReciter ? 'selected' : ''}>${r.reciter_name}</option>`)
            .join('');
    },

    renderTafsirOptions(tafsirs) {
        // Sort tafsirs alphabetically
        tafsirs.sort((a, b) => (a.translated_name.name || a.name).localeCompare(b.translated_name.name || b.name, 'ar'));
        
        this.elements.tafsirSelect.innerHTML = tafsirs
            .map(t => `<option value="${t.id}" ${t.id === state.currentTafsir ? 'selected' : ''}>${t.translated_name.name || t.name} - ${t.author_name}</option>`)
            .join('');
    },

    renderTranslationOptions(translations) {
        // Sort by language name, then by translation name
        translations.sort((a, b) => {
            const langCompare = a.language_name.localeCompare(b.language_name);
            if (langCompare !== 0) return langCompare;
            return a.name.localeCompare(b.name);
        });

        // Group by language
        const grouped = translations.reduce((acc, t) => {
            const lang = t.language_name; // Use language_name for grouping
            if (!acc[lang]) acc[lang] = [];
            acc[lang].push(t);
            return acc;
        }, {});

        this.elements.translationSelect.innerHTML = Object.keys(grouped).map(lang => `
            <optgroup label="${lang}">
                ${grouped[lang].map(t => `<option value="${t.id}" ${t.id === state.currentTranslation ? 'selected' : ''}>${t.name}</option>`).join('')}
            </optgroup>
        `).join('');
    },

    // Audio Logic
    async setupAudio(chapterId) {
        const audioData = await api.getChapterAudio(chapterId, state.currentReciter);
        if (audioData) {
            this.elements.audioElement.src = audioData.audio_url;
            state.audioState.audioUrl = audioData.audio_url;
        }
    },

    toggleAudio() {
        if (this.elements.audioElement.paused) {
            this.elements.audioElement.play();
            this.elements.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            this.elements.audioElement.pause();
            this.elements.playPauseBtn.innerHTML = '<i class="fas fa-play ml-1"></i>';
        }
    },

    updateProgress() {
        const { currentTime, duration } = this.elements.audioElement;
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            this.elements.progressBar.style.width = `${progressPercent}%`;
            
            // Format time
            const mins = Math.floor(currentTime / 60);
            const secs = Math.floor(currentTime % 60);
            document.getElementById('currentTime').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
    },

    resetAudioUI() {
        this.elements.playPauseBtn.innerHTML = '<i class="fas fa-play ml-1"></i>';
        this.elements.progressBar.style.width = '0%';
    },

    // Tafsir
    async showTafsir(verseKey) {
        this.elements.tafsirModal.classList.remove('hidden');
        this.elements.tafsirContent.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin text-2xl text-primary"></i></div>';
        
        const tafsir = await api.fetchTafsir(verseKey);
        if (tafsir) {
            this.elements.tafsirContent.innerHTML = `
                <h4 class="font-bold text-xl mb-4 text-secondary">تفسير الآية ${verseKey}</h4>
                <p>${tafsir.text}</p>
            `;
        } else {
            this.elements.tafsirContent.innerHTML = '<p class="text-red-500">تعذر تحميل التفسير</p>';
        }
    },
    
    saveSettings() {
        const newReciter = parseInt(this.elements.reciterSelect.value);
        const newTranslation = parseInt(this.elements.translationSelect.value);
        
        let reloadNeeded = false;
        if (newReciter !== state.currentReciter) {
            state.currentReciter = newReciter;
            this.setupAudio(state.currentSurah); // Reload audio
        }
        
        if (newTranslation !== state.currentTranslation) {
            state.currentTranslation = newTranslation;
            reloadNeeded = true;
        }
        
        if (reloadNeeded) {
            this.loadSurah(state.currentSurah);
        }
    },
    
    playAudioFrom(verseKey) {
        // Advanced: Seek to timestamp. For now, just play the chapter audio.
        // To do this properly, we need verse timings (segments) from the API.
        // For MVP, we'll just toggle play on the main player.
        this.toggleAudio();
        // User feedback
        const btn = document.querySelector(`button[onclick="ui.playAudioFrom('${verseKey}')"]`);
        if (btn) {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-volume-up text-primary"></i>';
            setTimeout(() => btn.innerHTML = originalIcon, 2000);
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.ui.init();
});

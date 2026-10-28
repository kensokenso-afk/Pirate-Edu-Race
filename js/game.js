/* =====================================================================
   30 SOAL LENGKAP
   ===================================================================== */
const QUESTION_DATABASE = [
    // --- MATEMATIKA (10) ---
    { id: "MATH-01", subject: "Matematika", level: "easy",   question: "Diketahui fungsi f(x) = 2x + 4. Tentukan nilai f(2)...?", options: ["6","8","7","5"], answer: 1 },
    { id: "MATH-02", subject: "Matematika", level: "easy",   question: "Diketahui dua buah fungsi f(x) = 2x + 3 dan g(x) = x² - 1. Nilai dari (f ∘ g)(2) adalah ...", options: ["5","7","9","11"], answer: 2 },
    { id: "MATH-03", subject: "Matematika", level: "medium", question: "Diketahui fungsi f(x) = ax + 3. Jika f(2) = 15, nilai a adalah ...", options: ["9","4","5","6"], answer: 3 },
    { id: "MATH-04", subject: "Matematika", level: "medium", question: "Diketahui fungsi f(x) = 2x + 3. Jika f(a) = 15, maka nilai a adalah ......", options: ["6","5","7","8"], answer: 0 },
    { id: "MATH-05", subject: "Matematika", level: "medium", question: "Diketahui f(x) = 2x - 5 dan (f ∘ g)(x) = 4x² - 6x + 1. Rumus fungsi g(x) adalah ........", options: ["2x² - 3x + 3","2x² - 3x - 2","4x² - 6x + 6","x² - 3x + 3"], answer: 0 },
    { id: "MATH-06", subject: "Matematika", level: "hard",   question: "Diketahui fungsi f(x) = 2x - 2 dan g(x) = 2x + 2. Tentukan (f ∘ g)(x)!", options: ["2x - 2","6x + 1","4x + 2","5x - 1"], answer: 2 },
    { id: "MATH-07", subject: "Matematika", level: "hard",   question: "Diketahui f(x) = 3x + 2 dan g(x) = x - 2. Tentukan (g ∘ f)(5)!", options: ["16","15","20","17"], answer: 1 },
    { id: "MATH-08", subject: "Matematika", level: "hard",   question: "Tentukan fungsi invers f⁻¹(x) dari f(x) = 5x - 2!", options: ["5x - 2","5x + 2","(x - 2) / 5","(x + 2) / 5"], answer: 3 },
    { id: "MATH-09", subject: "Matematika", level: "hard",   question: "Sebuah pabrik menggunakan dua mesin bertahap:\nMesin 1: m = f(x) = x² - 3x + 2\nMesin 2: y = g(m) = 2m + 1\nJika hasil akhir berupa 25 ton kertas jadi, berapa ton bahan baku kayu x yang harus disediakan?", options: ["3 ton","4 ton","5 ton","6 ton"], answer: 2 },
    { id: "MATH-10", subject: "Matematika", level: "hard",   question: "Diketahui fungsi f(x) = 2x - 3 dan g(x) = x² + 1. Tentukan nilai (f ∘ g)(3)!", options: ["13","15","17","19"], answer: 2 },

    // --- FIQIH (10) ---
    { id: "FQH-01", subject: "Fiqih", level: "easy",   question: "Apa yang dimaksud dengan mencuri (sariqah)?", options: ["Mengambil barang milik orang lain dengan izin pemilik","Mengambil barang milik orang lain tanpa seizin pemiliknya","Meminjam barang milik orang lain dengan seizin pemilik","Menjual barang milik sendiri"], answer: 1 },
    { id: "FQH-02", subject: "Fiqih", level: "easy",   question: "Perampokan yang dilakukan dengan ancaman atau kekerasan disebut …", options: ["Sariqah","Ghasab","Hirabah","Riba"], answer: 2 },
    { id: "FQH-03", subject: "Fiqih", level: "medium", question: "Apa syarat agar perbuatan mencuri dapat dihukum menurut hukum hudud?", options: ["Pengakuan pelaku dan dua saksi laki-laki","Kesaksian dari dua orang saksi laki-laki yang adil dan merdeka, pengakuan pelaku, dan sumpah dari orang yang mengadukan","Pengakuan pelaku saja sudah cukup","Hanya bukti barang bukti yang ditemukan"], answer: 1 },
    { id: "FQH-04", subject: "Fiqih", level: "medium", question: "Salah satu syarat hukuman had bagi pencurian adalah …", options: ["Barang milik sendiri","Barang mencapai nisab","Barang dipinjam","Pelaku masih anak-anak"], answer: 1 },
    { id: "FQH-05", subject: "Fiqih", level: "medium", question: "Perbedaan sariqah dan hirabah yang tepat adalah …", options: ["Sariqah sembunyi-sembunyi, hirabah menggunakan ancaman atau kekerasan","Sariqah selalu dilakukan di jalan","Hirabah tidak berkaitan dengan harta","Keduanya tidak memiliki perbedaan"], answer: 0 },
    { id: "FQH-06", subject: "Fiqih", level: "hard",   question: "Dalam hukum hudud, berapakah nilai minimal barang yang dicuri agar pelaku dapat dikenakan hukuman potong tangan?", options: ["Setara dengan seperempat dinar (sekitar 1,06 gram emas murni) atau lebih","Kurang dari seperempat dinar (di bawah 1,06 gram emas murni)","Berapa pun nilainya, asalkan diambil secara sembunyi-sembunyi","Setara dengan sepuluh dinar atau lebih"], answer: 0 },
    { id: "FQH-07", subject: "Fiqih", level: "hard",   question: "Jika seseorang mengambil barang milik orang lain tanpa izin, tetapi nilai barang tersebut di bawah nisab, bagaimana hukumannya?", options: ["Tetap dihukum potong tangan","Dihukum cambuk 40 kali","Tidak dikenakan hukuman hudud, tetapi bisa dikenakan hukuman ta’zir","Dihukum mati"], answer: 2 },
    { id: "FQH-08", subject: "Fiqih", level: "hard",   question: "Apa syarat yang harus dipenuhi oleh saksi agar kesaksiannya diterima dalam kasus pencurian menurut hukum hudud?", options: ["Saksi harus laki-laki, adil, merdeka, dan mengetahui kejadian secara langsung","Saksi boleh laki-laki atau perempuan, asal mengetahui kejadian","Saksi harus keluarga pelaku","Saksi hanya perlu mengenal pelaku"], answer: 0 },
    { id: "FQH-09", subject: "Fiqih", level: "hard",   question: "Seseorang mencuri barang secara sembunyi-sembunyi, tetapi nilainya belum mencapai nisab. Hukuman yang tepat adalah …", options: ["Had potong tangan","Hukuman hirabah","Takzir sesuai ketentuan","Tidak berdosa"], answer: 2 },
    { id: "FQH-10", subject: "Fiqih", level: "hard",   question: "Sekelompok orang menghadang kendaraan dan merampas harta penumpang dengan ancaman. Perbuatan tersebut termasuk …", options: ["Sariqah","Hirabah","Ghasab","Riba"], answer: 1 },

    // --- OLAHRAGA (10) ---
    { id: "OR-01", subject: "Olahraga", level: "easy",   question: "Kemampuan tubuh melakukan aktivitas sehari-hari tanpa mengalami kelelahan berlebihan disebut …", options: ["Kebugaran jasmani","Kekuatan","Kelentukan","Kecepatan"], answer: 0 },
    { id: "OR-02", subject: "Olahraga", level: "easy",   question: "Bentuk latihan dasar yang bertujuan melatih kekuatan otot perut adalah...", options: ["Push-up","Sit-up","Back-up","Pull-up"], answer: 1 },
    { id: "OR-03", subject: "Olahraga", level: "easy",   question: "Latihan yang paling tepat untuk meningkatkan kekuatan otot lengan adalah …", options: ["Sit-up","Push-up","Squat","Jogging"], answer: 1 },
    { id: "OR-04", subject: "Olahraga", level: "medium", question: "Kemampuan tubuh untuk melakukan gerakan dalam waktu yang relatif singkat disebut …", options: ["Daya tahan","Kelentukan","Kecepatan","Keseimbangan"], answer: 2 },
    { id: "OR-05", subject: "Olahraga", level: "medium", question: "Lari santai (jogging) bertujuan utama untuk melatih...", options: ["Kelentukan","Daya tahan jantung","Kekuatan otot perut","Keseimbangan"], answer: 1 },
    { id: "OR-06", subject: "Olahraga", level: "medium", question: "Latihan push-up berguna untuk melatih kekuatan otot...", options: ["Perut","Lengan dan dada","Paha","Leher"], answer: 1 },
    { id: "OR-07", subject: "Olahraga", level: "medium", question: "Kemampuan tubuh dan sendi untuk bergerak leluasa tanpa kaku disebut...", options: ["Kelentukan","Kelincahan","Kecepatan","Keseimbangan"], answer: 0 },
    { id: "OR-08", subject: "Olahraga", level: "hard",   question: "Seorang siswa mampu berlari dalam waktu cukup lama tanpa cepat merasa lelah. Komponen kebugaran jasmani yang paling dominan dilatih adalah…", options: ["Kekuatan","Daya tahan","Kelentukan","Koordinasi"], answer: 1 },
    { id: "OR-09", subject: "Olahraga", level: "hard",   question: "Latihan shuttle run dilakukan dengan berlari bolak-balik pada jarak tertentu. Latihan tersebut terutama bertujuan meningkatkan …", options: ["Kelentukan dan keseimbangan","Kekuatan dan daya tahan","Kecepatan dan kelincahan","Daya tahan dan kelentukan"], answer: 2 },
    { id: "OR-10", subject: "Olahraga", level: "hard",   question: "Kemampuan tubuh untuk mengubah arah dan posisi dengan cepat tanpa kehilangan keseimbangan dinamakan...", options: ["Kecepatan (Speed)","Kelincahan (Agility)","Kelentukan (Flexibility)","Daya Tahan (Endurance)"], answer: 1 }
];

/* =====================================================================
   SHOP ITEMS
   ===================================================================== */
const SHOP_ITEMS = [
    { id: 'ship-1',  name: 'Kapal Kayu',     category: 'ship',        price: 100, icon: '⛵' },
    { id: 'ship-2',  name: 'Kapal Emas',     category: 'ship',        price: 500, icon: '🚢' },
    { id: 'ship-3',  name: 'Kapal Hantu',    category: 'ship',        price: 800, icon: '🏴‍☠️' },
    { id: 'ship-4',  name: 'Kano Dayung',    category: 'ship',        price: 120, icon: '🛶' },
    { id: 'ship-5',  name: 'Speedboat',      category: 'ship',        price: 350, icon: '🚤' },
    { id: 'ship-6',  name: 'Kapal Feri',     category: 'ship',        price: 450, icon: '⛴️' },
    { id: 'outfit-1',name: 'Baju Pelaut',    category: 'outfit',      price: 150, icon: '👕' },
    { id: 'outfit-2',name: 'Jubah Kapten',   category: 'outfit',      price: 300, icon: '🧥' },
    { id: 'hat-1',   name: 'Topi Bajak Laut', category: 'hat',         price: 200, icon: '🎩' },
    { id: 'hat-2',   name: 'Bandana',        category: 'hat',         price: 80,  icon: '🧢' },
    { id: 'shoes-1', name: 'Sepatu Boots',   category: 'shoes',       price: 120, icon: '👢' },
    { id: 'shoes-2', name: 'Sandal Kayu',    category: 'shoes',       price: 60,  icon: '🩴' },
    { id: 'pet-1',   name: 'Burung Beo',     category: 'pet',         price: 250, icon: '🦜' },
    { id: 'pet-2',   name: 'Monyet Nakal',   category: 'pet',         price: 300, icon: '🐒' },
    { id: 'acc-1',   name: 'Kacamata',       category: 'accessories', price: 90,  icon: '🕶️' },
    { id: 'acc-2',   name: 'Kompas Antik',   category: 'accessories', price: 180, icon: '🧭' },
    { id: 'furn-1',  name: 'Peti Harta',     category: 'furniture',   price: 400, icon: '📦' },
    { id: 'furn-2',  name: 'Meriam Kapal',   category: 'furniture',   price: 600, icon: '💣' }
];

/* =====================================================================
   GAME STATE
   ===================================================================== */
const DEFAULT_PLAYER_NAME = 'player';
const MAX_NAME_LENGTH = 12;

/* Membersihkan nama: buang karakter kontrol/tak terlihat, rapikan spasi,
   potong per KARAKTER (bukan per code unit, supaya emoji tidak terbelah),
   dan kembali ke 'player' jika hasilnya kosong. */
function sanitizePlayerName(raw) {
    const cleaned = String(raw == null ? '' : raw)
        .replace(/\s+/g, ' ')
        .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\uFEFF]/g, '')
        .trim();
    const limited = Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('').trim();
    return limited || DEFAULT_PLAYER_NAME;
}

let GameState = {
    playerName: DEFAULT_PLAYER_NAME, nameConfirmed: false, playerAvatar: '🤓', playerTitle: 'Pelaut Pemula',
    coins: 0, xp: 0, level: 1, matches: 0, wins: 0,
    correctCount: 0, wrongCount: 0, hp: 5,
    inventory: [], equipped: {}, leaderboard: [],
    musicOn: true, sfxOn: true
};

function loadGameState() {
    // FIX #2: localStorage bisa melempar error (mode private, iframe sandbox, storage diblokir).
    // Jika gagal, game tetap berjalan memakai nilai default di memori.
    try {
    const savedName = localStorage.getItem('pirate_name');
    GameState.playerName    = sanitizePlayerName(savedName);
    // Nama dianggap sudah dipilih jika flag tersimpan, atau (data lama) ada nama tersimpan.
    GameState.nameConfirmed = localStorage.getItem('pirate_name_set') === 'true' || !!(savedName && savedName.trim());
    GameState.playerAvatar  = localStorage.getItem('pirate_avatar') || '🤓';
    GameState.playerTitle   = localStorage.getItem('pirate_title') || 'Pelaut Pemula';
    GameState.coins         = parseInt(localStorage.getItem('pirate_coins')) || 0;
    GameState.xp            = parseInt(localStorage.getItem('pirate_xp')) || 0;
    GameState.level         = parseInt(localStorage.getItem('pirate_level')) || 1;
    GameState.matches       = parseInt(localStorage.getItem('pirate_matches')) || 0;
    GameState.wins          = parseInt(localStorage.getItem('pirate_wins')) || 0;
    GameState.correctCount  = parseInt(localStorage.getItem('pirate_correct')) || 0;
    GameState.wrongCount    = parseInt(localStorage.getItem('pirate_wrong')) || 0;
    try { GameState.inventory = JSON.parse(localStorage.getItem('pirate_inv') || '[]'); } catch(e){ GameState.inventory = []; }
    try { GameState.equipped  = JSON.parse(localStorage.getItem('pirate_equipped') || '{}'); } catch(e){ GameState.equipped = {}; }
    try { GameState.leaderboard = JSON.parse(localStorage.getItem('pirate_lb') || '[]'); } catch(e){ GameState.leaderboard = []; }
    // Hasil JSON.parse bisa bertipe lain (null, angka, objek) jika data tersimpan rusak/diubah -> kembalikan ke bentuk yang benar
    if (!Array.isArray(GameState.inventory)) GameState.inventory = [];
    GameState.inventory = GameState.inventory.filter(function (id) { return typeof id === 'string'; });
    if (!GameState.equipped || typeof GameState.equipped !== 'object' || Array.isArray(GameState.equipped)) GameState.equipped = {};
    if (!Array.isArray(GameState.leaderboard)) GameState.leaderboard = [];
    GameState.leaderboard = GameState.leaderboard.filter(function (l) { return l && typeof l.name === 'string' && isFinite(l.score); });
    GameState.musicOn = localStorage.getItem('pirate_music') !== 'false';
    GameState.sfxOn   = localStorage.getItem('pirate_sfx') !== 'false';
    } catch (e) { console.warn('localStorage tidak tersedia, memakai data sementara:', e); }
}

function saveGameState() {
    // FIX #2: gagal menyimpan (storage penuh/diblokir) tidak boleh menghentikan alur game
    // (mis. showVictory/showGameOver yang memanggil switchScreen setelah menyimpan).
    try {
    localStorage.setItem('pirate_name', GameState.playerName);
    localStorage.setItem('pirate_name_set', GameState.nameConfirmed);
    localStorage.setItem('pirate_avatar', GameState.playerAvatar);
    localStorage.setItem('pirate_title', GameState.playerTitle);
    localStorage.setItem('pirate_coins', GameState.coins);
    localStorage.setItem('pirate_xp', GameState.xp);
    localStorage.setItem('pirate_level', GameState.level);
    localStorage.setItem('pirate_matches', GameState.matches);
    localStorage.setItem('pirate_wins', GameState.wins);
    localStorage.setItem('pirate_correct', GameState.correctCount);
    localStorage.setItem('pirate_wrong', GameState.wrongCount);
    localStorage.setItem('pirate_inv', JSON.stringify(GameState.inventory));
    localStorage.setItem('pirate_equipped', JSON.stringify(GameState.equipped));
    localStorage.setItem('pirate_lb', JSON.stringify(GameState.leaderboard));
    localStorage.setItem('pirate_music', GameState.musicOn);
    localStorage.setItem('pirate_sfx', GameState.sfxOn);
    } catch (e) { console.warn('Gagal menyimpan ke localStorage:', e); }
}

/* =====================================================================
   RACE STATE (declared to avoid implicit globals)
   ===================================================================== */
let matchQuestions = [];
let playerSteps = 0;
let botSteps = [0, 0, 0];
let currentQuestionIdx = 0;
let streakCount = 0;
let bestStreak = 0;
let currentMatchCorrect = 0;
let currentMatchWrong = 0;
let isAnsweringLocked = false;
let raceTimer = null;
let timeLeft = 0;
let matchEnded = false;
let matchStartCoins = 0;
// PERBAIKAN bug 5: nomor sesi balapan. Dinaikkan saat balapan dimulai/ditinggalkan agar setTimeout
// milik balapan lama (pindah soal / layar menang / game over) tidak jalan di balapan baru atau di menu.
let raceSession = 0;
// PERBAIKAN bug 6: level terakhir yang sudah diumumkan lewat popup LEVEL UP pada balapan ini
let lastNotifiedLevel = 1;
let currentShopFilter = 'all';

// PERBAIKAN-2 (bug 7): bonus kemenangan mengikuti peringkat (juara 1 tetap +350 XP / +250 koin seperti sebelumnya)
const VICTORY_BONUS = {
    1: { xp: 350, coins: 250 },
    2: { xp: 250, coins: 175 },
    3: { xp: 150, coins: 100 },
    4: { xp: 100, coins: 50 }
};

/* =====================================================================
   AUDIO
   ===================================================================== */
let audioCtx = null;
let bgmInterval = null;
let bgmStep = 0;

const BGM_MELODY = [
    220,0,261.63,293.66,329.63,329.63,329.63,0,
    349.23,349.23,329.63,293.66,329.63,0,220,0,
    293.66,293.66,293.66,0,261.63,261.63,261.63,0,
    246.94,246.94,220,207.65,220,0,0,0
];
const BGM_BASS = [
    110,0,110,0,110,0,110,0,
    130.81,0,130.81,0,110,0,110,0,
    146.83,0,146.83,0,130.81,0,130.81,0,
    123.47,0,123.47,0,110,0,110,0
];

function initAudio() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function startBGM() {
    if (!GameState.musicOn) return;
    if (bgmInterval) return;
    initAudio();
    if (!audioCtx) return;
    bgmStep = 0;
    bgmInterval = setInterval(() => {
        if (!GameState.musicOn || !audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        // Jangan jadwalkan nada saat context belum running (currentTime beku -> nada menumpuk)
        if (audioCtx.state !== 'running') return;
        const mFreq = BGM_MELODY[bgmStep % BGM_MELODY.length];
        const bFreq = BGM_BASS[bgmStep % BGM_BASS.length];
        const now = audioCtx.currentTime;
        try {
            if (mFreq > 0) {
                const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(mFreq, now);
                gain.gain.setValueAtTime(0.025, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(now); osc.stop(now + 0.13);
            }
            if (bFreq > 0) {
                const bOsc = audioCtx.createOscillator(), bGain = audioCtx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.035, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                bOsc.connect(bGain); bGain.connect(audioCtx.destination);
                bOsc.start(now); bOsc.stop(now + 0.15);
            }
        } catch(e){}
        bgmStep++;
    }, 160);
}

function stopBGM() {
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
}

function playSound(type) {
    if (!GameState.sfxOn) return;
    initAudio();
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        if (type === 'victory') {
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                setTimeout(() => {
                    if (!audioCtx) return;
                    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                    o.type = 'triangle';
                    o.connect(g); g.connect(audioCtx.destination);
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
                    g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    o.start(); o.stop(audioCtx.currentTime + 0.2);
                }, i * 130);
            });
            return;
        }
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.1);
            osc.frequency.setValueAtTime(783.99, now + 0.2);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.start(now); osc.stop(now + 0.35);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(110, now + 0.25);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
        }
    } catch(e){}
}

/* =====================================================================
   UI / NAVIGATION
   ===================================================================== */
function switchScreen(screenId) {
    playSound('click');
    if (GameState.musicOn && screenId !== 'screen-victory' && screenId !== 'screen-gameover') startBGM();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    if (screenId === 'screen-main-menu') updateMainMenuUI();
    if (screenId === 'screen-storwin') renderShopItems(currentShopFilter);
    if (screenId === 'screen-profile') renderProfileData();
    if (screenId === 'screen-leaderboard') renderLeaderboard();
    if (screenId === 'screen-collection') renderCollection();
    if (screenId === 'screen-settings') refreshPlayerNameUI();
}

function showAlert(title, text) {
    pauseQuestionTimer(); // FIX bug 1: timer soal berhenti selama popup terbuka
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-text').textContent = text;
    document.getElementById('modal-alert').classList.add('active');
}
function closeModal() {
    playSound('click');
    document.getElementById('modal-alert').classList.remove('active');
    resumeQuestionTimer(); // FIX bug 1: lanjutkan sisa waktu soal setelah popup ditutup
}

function showConfirm(title, text, onYes) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-text').textContent = text;
    const yes = document.getElementById('confirm-yes');
    // Replace listener with fresh one
    const newYes = yes.cloneNode(true);
    yes.parentNode.replaceChild(newYes, yes);
    newYes.addEventListener('click', () => {
        closeConfirm();
        if (typeof onYes === 'function') onYes();
    });
    document.getElementById('modal-confirm').classList.add('active');
}
function closeConfirm() {
    playSound('click');
    document.getElementById('modal-confirm').classList.remove('active');
    resumeQuestionTimer(); // PERBAIKAN bug 5: lanjutkan sisa waktu soal jika konfirmasi dibatalkan (no-op jika tidak sedang dijeda)
}

/* =====================================================================
   INIT
   ===================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    loadGameState();

    // Validate DB
    if (QUESTION_DATABASE.length !== 30) {
        document.getElementById('loading-text').textContent =
            `⚠️ PERHATIAN: Soal terdeteksi ${QUESTION_DATABASE.length}/30`;
    }

    syncSettingsUI();

    let progress = 0;
    const bar = document.getElementById('loading-bar');
    const interval = setInterval(() => {
        progress += 15;
        bar.style.width = Math.min(progress, 100) + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                if (!GameState.nameConfirmed) {
                    document.getElementById('input-player-name').value = GameState.playerName; // 'player'
                    switchScreen('screen-player-name');
                } else {
                    switchScreen('screen-main-menu');
                }
            }, 300);
        }
    }, 100);

    // Auto-start BGM on first interaction
    const handleFirstInteraction = () => {
        initAudio();
        if (GameState.musicOn) startBGM();
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    // Enter submit nama
    const nameInput = document.getElementById('input-player-name');
    if (nameInput) {
        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') submitPlayerName();
        });
    }
});

/* =====================================================================
   PLAYER
   ===================================================================== */
function getPlayerName() {
    return GameState.playerName || DEFAULT_PLAYER_NAME;
}

// Satu tempat untuk menyegarkan semua tampilan nama pemain
function refreshPlayerNameUI() {
    const name = getPlayerName();
    const ids = ['display-player-name', 'profile-name', 'ship-player-label', 'settings-player-name'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = name; });
}

// Jika nama diganti, entri leaderboard lama ikut diganti (tidak jadi dobel)
function renameLeaderboardEntry(oldName, newName) {
    const lb = GameState.leaderboard;
    const mine = lb.find(l => l.name === oldName);
    if (!mine) return;
    const other = lb.find(l => l !== mine && l.name === newName);
    if (other) {
        other.score = Math.max(other.score, mine.score);
        lb.splice(lb.indexOf(mine), 1);
    } else {
        mine.name = newName;
    }
    lb.sort((a, b) => b.score - a.score);
}

// Layar awal: kosong/tidak diubah = tetap "player"
function submitPlayerName() {
    GameState.playerName = sanitizePlayerName(document.getElementById('input-player-name').value);
    GameState.nameConfirmed = true;
    saveGameState();
    switchScreen('screen-main-menu');
}

// Bisa dipanggil kapan saja dari Menu, Profil, atau Pengaturan
function editPlayerName() {
    playSound('click');
    const input = document.getElementById('input-edit-name');
    input.value = getPlayerName();
    document.getElementById('modal-edit-name').classList.add('active');
    input.focus();
    input.select();
}

function closeEditName() {
    playSound('click');
    document.getElementById('modal-edit-name').classList.remove('active');
}

function submitEditName() {
    const oldName = getPlayerName();
    const newName = sanitizePlayerName(document.getElementById('input-edit-name').value);
    if (newName !== oldName) { renameLeaderboardEntry(oldName, newName); lbRenameRemote(newName); }
    GameState.playerName = newName;
    GameState.nameConfirmed = true;
    saveGameState();
    refreshPlayerNameUI();
    updateMainMenuUI();
    renderProfileData();
    closeEditName();
}

function renderAvatarHTML() {
    const cats = ['hat', 'accessories', 'outfit', 'shoes', 'pet'];
    const icons = cats.map(c => {
        const it = SHOP_ITEMS.find(s => s.id === GameState.equipped[c]);
        return it ? it.icon : '';
    }).join('');
    return GameState.playerAvatar + (icons ? `<div class="text-[10px] leading-none mt-0.5">${icons}</div>` : '');
}

function updateMainMenuUI() {
    document.getElementById('menu-coins').textContent = GameState.coins;
    refreshPlayerNameUI();
    document.getElementById('display-avatar').innerHTML = renderAvatarHTML();
    document.getElementById('display-player-title').textContent = GameState.playerTitle;
    // PERBAIKAN-2 (bug 8): XP bersifat kumulatif (naik level saat XP >= level*100), jadi bar & teks
    // menampilkan progres DI DALAM level ini (0–100), bukan XP total yang membuat bar mulai di 50%.
    const XP_PER_LEVEL = 100;
    const xpInLevel = Math.max(0, Math.min(XP_PER_LEVEL, GameState.xp - (GameState.level - 1) * XP_PER_LEVEL));
    const xpPercent = (xpInLevel / XP_PER_LEVEL) * 100;
    document.getElementById('display-xp-bar').style.width = xpPercent + '%';
    document.getElementById('display-level-text').textContent =
        `Level ${GameState.level} (${xpInLevel}/${XP_PER_LEVEL} XP)`;
}

function openAvatarSelector() { document.getElementById('modal-avatar').classList.add('active'); }
function closeAvatarSelector() { document.getElementById('modal-avatar').classList.remove('active'); }
function selectAvatar(emoji, title) {
    GameState.playerAvatar = emoji;
    if (title) GameState.playerTitle = title;
    saveGameState();
    updateMainMenuUI();
    renderProfileData();
    closeAvatarSelector();
}

/* =====================================================================
   SHUFFLE
   ===================================================================== */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* =====================================================================
   RACE GAME
   ===================================================================== */
function launchRaceGame() {
    switchScreen('screen-gameplay');

    GameState.hp = 5;
    playerSteps = 0;
    botSteps = [0, 0, 0];
    currentQuestionIdx = 0;
    streakCount = 0;
    bestStreak = 0;
    currentMatchCorrect = 0;
    currentMatchWrong = 0;
    isAnsweringLocked = false;
    matchEnded = false;
    matchStartCoins = GameState.coins;
    raceSession++;                          // PERBAIKAN bug 5
    lastNotifiedLevel = GameState.level;    // PERBAIKAN bug 6
    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }

    const mathQ  = shuffleArray(QUESTION_DATABASE.filter(q => q.subject === 'Matematika'));
    const fiqihQ = shuffleArray(QUESTION_DATABASE.filter(q => q.subject === 'Fiqih'));
    const sportQ = shuffleArray(QUESTION_DATABASE.filter(q => q.subject === 'Olahraga'));

    matchQuestions = shuffleArray([...mathQ, ...fiqihQ, ...sportQ]);

    const equippedShip = SHOP_ITEMS.find(s => s.id === GameState.equipped['ship']);
    document.getElementById('ship-player').textContent = equippedShip ? equippedShip.icon : '⛵';
    refreshPlayerNameUI();

    updateRaceHUD();
    updateShipPositions();
    loadNextQuestion();
}

function updateRaceHUD() {
    document.getElementById('race-coins').textContent = GameState.coins;
    document.getElementById('race-question-counter').textContent =
        `Soal ${Math.min(currentQuestionIdx + 1, matchQuestions.length)} / ${matchQuestions.length}`;

    let lap = "LAP 1/3";
    if (currentQuestionIdx >= 20) lap = "LAP 3/3";
    else if (currentQuestionIdx >= 10) lap = "LAP 2/3";
    document.getElementById('race-lap-indicator').textContent = lap;

    let hearts = "";
    for (let i = 0; i < GameState.hp; i++) hearts += "❤️ ";
    document.getElementById('race-hp-container').textContent = hearts.trim() || "💀";

    const streakBadge = document.getElementById('streak-badge');
    if (streakCount >= 3) {
        streakBadge.textContent = `🔥 Streak x${streakCount}`;
        streakBadge.classList.remove('hidden');
    } else {
        streakBadge.classList.add('hidden');
    }
}

/* ---------------------------------------------------------------------
   TIMER SOAL (berbasis timestamp, bisa dijeda)
   FIX bug 2: sisa waktu dihitung dari selisih Date.now() terhadap deadline,
   bukan dari timeLeft-- per tick, sehingga tidak molor saat tab di background.
   FIX bug 1: timer bisa dijeda saat popup terbuka dan dilanjutkan saat ditutup.
   --------------------------------------------------------------------- */
let questionDeadline = 0;       // waktu (ms) kapan soal habis waktu
let pausedRemainingMs = null;   // sisa waktu (ms) saat dijeda; null = tidak dijeda

function isAlertOpen() {
    // PERBAIKAN bug 5: modal konfirmasi (mis. "Keluar dari balapan?") juga menahan timer soal
    return document.getElementById('modal-alert').classList.contains('active')
        || document.getElementById('modal-confirm').classList.contains('active');
}

function startQuestionTimer(durationMs) {
    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }
    pausedRemainingMs = null;
    questionDeadline = Date.now() + durationMs;
    timeLeft = Math.max(0, Math.ceil(durationMs / 1000));
    document.getElementById('quiz-timer').textContent = `⏱ ${timeLeft}s`;
    raceTimer = setInterval(tickQuestionTimer, 250);
}

function tickQuestionTimer() {
    timeLeft = Math.max(0, Math.ceil((questionDeadline - Date.now()) / 1000));
    document.getElementById('quiz-timer').textContent = `⏱ ${timeLeft}s`;
    if (Date.now() >= questionDeadline) handleQuestionTimeout();
}

function handleQuestionTimeout() {
    clearInterval(raceTimer);
    raceTimer = null;
    if (isAnsweringLocked || matchEnded) return;
    // ✅ Fix: lock & disable tombol sebelum handleAnswer dipanggil
    isAnsweringLocked = true;
    document.querySelectorAll('#quiz-options-container button').forEach(b => b.disabled = true);
    const correctBtn = document.querySelector('#quiz-options-container button[data-correct="1"]');
    if (correctBtn) {
        correctBtn.style.backgroundColor = '#c8e6c9';
        correctBtn.style.borderColor = '#2e7d32';
    }
    handleAnswer(false, true);
}

function pauseQuestionTimer() {
    // Hanya jeda jika ada soal yang sedang berjalan (belum dijawab)
    if (!raceTimer || isAnsweringLocked || matchEnded) return;
    clearInterval(raceTimer);
    raceTimer = null;
    pausedRemainingMs = Math.max(0, questionDeadline - Date.now());
}

function resumeQuestionTimer() {
    if (pausedRemainingMs === null) return;
    const gameplayActive = document.getElementById('screen-gameplay').classList.contains('active');
    if (!gameplayActive || isAnsweringLocked || matchEnded) { pausedRemainingMs = null; return; }
    startQuestionTimer(pausedRemainingMs);
}

function loadNextQuestion() {
    if (currentQuestionIdx >= matchQuestions.length || GameState.hp <= 0) {
        endRaceCheck();
        return;
    }

    isAnsweringLocked = false;
    updateRaceHUD();
    const qData = matchQuestions[currentQuestionIdx];
    // Layar balapan bisa digulir: tiap soal baru, kembali ke atas agar track & awal soal langsung terlihat
    const gpScreen = document.getElementById('screen-gameplay');
    if (gpScreen) gpScreen.scrollTop = 0;

    document.getElementById('quiz-category').textContent = `📖 ${qData.subject.toUpperCase()}`;

    const badge = document.getElementById('quiz-level-badge');
    badge.textContent = qData.level.toUpperCase();
    badge.style.backgroundColor = qData.level === 'easy' ? '#2e7d32'
        : qData.level === 'medium' ? '#f57f17' : '#c62828';

    document.getElementById('quiz-question-text').textContent = qData.question;

    timeLeft = qData.level === 'easy' ? 30 : qData.level === 'medium' ? 60 : 120;
    document.getElementById('quiz-timer').textContent = `⏱ ${timeLeft}s`;

    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }
    // FIX bug 1: jika popup (mis. LEVEL UP) masih terbuka, jangan mulai hitung mundur dulu.
    // Waktu ditahan penuh dan baru berjalan saat popup ditutup (lihat closeModal).
    if (isAlertOpen()) {
        pausedRemainingMs = timeLeft * 1000;
    } else {
        startQuestionTimer(timeLeft * 1000);
    }

    const optsContainer = document.getElementById('quiz-options-container');
    optsContainer.innerHTML = "";

    const indexedOpts = qData.options.map((optText, originalIndex) => ({
        text: optText,
        isCorrect: originalIndex === qData.answer
    }));
    const shuffledOpts = shuffleArray(indexedOpts);

    shuffledOpts.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "pixel-btn text-[7.5px] py-1.5 w-full text-left pl-2 hover:bg-[#fff3e0] transition-colors";
        btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt.text}`;
        btn.dataset.correct = opt.isCorrect ? '1' : '0';
        btn.onclick = () => {
            if (isAnsweringLocked) return;
            isAnsweringLocked = true;
            clearInterval(raceTimer);
            document.querySelectorAll('#quiz-options-container button').forEach(b => b.disabled = true);

            if (opt.isCorrect) {
                btn.style.backgroundColor = '#c8e6c9';
                btn.style.borderColor = '#2e7d32';
            } else {
                btn.style.backgroundColor = '#ffcdd2';
                btn.style.borderColor = '#c62828';
                const correctBtn = document.querySelector('#quiz-options-container button[data-correct="1"]');
                if (correctBtn) {
                    correctBtn.style.backgroundColor = '#c8e6c9';
                    correctBtn.style.borderColor = '#2e7d32';
                }
            }
            handleAnswer(opt.isCorrect, false);
        };
        optsContainer.appendChild(btn);
    });
}

function handleAnswer(isCorrect, isTimeout) {
    // Double-answer sudah dijaga di handler tombol (isAnsweringLocked) dan jalur timeout
    if (matchEnded) return;
    const session = raceSession; // PERBAIKAN bug 5: timeout di bawah hanya jalan jika balapan ini masih aktif

    const qData = matchQuestions[currentQuestionIdx];
    if (!qData) return;
    const xpGain = qData.level === 'easy' ? 10 : qData.level === 'medium' ? 20 : 30;

    if (Math.random() < 0.70) botSteps[0]++;
    if (Math.random() < 0.65) botSteps[1]++;
    if (Math.random() < 0.60) botSteps[2]++;

    if (isCorrect) {
        playSound('correct');
        streakCount++;
        if (streakCount > bestStreak) bestStreak = streakCount;
        currentMatchCorrect++;
        GameState.correctCount++;
        GameState.coins += 5 + (streakCount >= 5 ? 5 : 0);
        GameState.xp += xpGain;
        playerSteps++;
        if (GameState.xp >= GameState.level * 100) {
            while (GameState.xp >= GameState.level * 100) GameState.level++;
            // PERBAIKAN bug 6: di soal TERAKHIR popup LEVEL UP ditunda ke showVictory, supaya pemain
            // hanya melihat SATU popup berisi level akhir (jawaban terakhir + bonus kemenangan digabung).
            if (currentQuestionIdx + 1 < matchQuestions.length) {
                showAlert("LEVEL UP!", `Selamat! Kapten naik ke Level ${GameState.level}!`);
                lastNotifiedLevel = GameState.level;
            }
        }
    } else {
        playSound('wrong');
        streakCount = 0;
        currentMatchWrong++;
        GameState.wrongCount++;
        GameState.hp--;
        const panel = document.getElementById('quiz-panel-box');
        panel.classList.add('animate-shake');
        setTimeout(() => panel.classList.remove('animate-shake'), 400);
    }

    // FIX #1: simpan progres (koin, XP, level, benar/salah) di setiap jawaban,
    // agar tidak hilang jika tab ditutup / di-refresh di tengah balapan.
    try { saveGameState(); } catch (e) { /* gagal simpan tidak boleh menghentikan game */ }

    updateShipPositions();
    updateRaceHUD(); // PERBAIKAN-2 (bug 5): koin/HP/streak langsung diperbarui (sebelumnya baru 1 detik kemudian, dan tak pernah di soal terakhir)

    if (GameState.hp <= 0) {
        setTimeout(() => { if (session === raceSession) showGameOver(); }, 800);
        return;
    }

    currentQuestionIdx++;

    if (currentQuestionIdx >= matchQuestions.length) {
        setTimeout(() => { if (session === raceSession) showVictory(); }, 800);
        return;
    }

    setTimeout(() => { if (session === raceSession) loadNextQuestion(); }, 1000);
}

/* PERBAIKAN bug 5: keluar dari balapan di tengah jalan.
   Koin/XP/level yang sudah didapat sudah tersimpan di setiap jawaban (saveGameState di handleAnswer),
   jadi keluar tidak menghilangkan progres; balapan yang ditinggalkan tidak dihitung sebagai tanding. */
function confirmQuitRace() {
    if (matchEnded) return;
    playSound('click');
    pauseQuestionTimer(); // timer soal berhenti selama konfirmasi terbuka (dilanjutkan oleh closeConfirm bila BATAL)
    showConfirm("KELUAR BALAPAN?", "Balapan ini akan dihentikan. Koin & XP yang sudah kamu dapat tetap tersimpan.", quitRace);
}

function quitRace() {
    if (matchEnded) return;
    matchEnded = true;
    raceSession++;               // batalkan semua setTimeout milik balapan ini
    isAnsweringLocked = true;
    pausedRemainingMs = null;
    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }
    try { saveGameState(); } catch (e) {}
    switchScreen('screen-main-menu');
}

/* PERBAIKAN bug 1 & 2: posisi kapal sebelumnya = persen murni dari tinggi arena, sehingga
   (1) di garis start kapal (bottom:0) menimpa label nama (tinggi ~12px), dan
   (2) di posisi 85% bagian atas ikon (tinggi 32px) keluar dari arena dan terpotong overflow-hidden.
   Sekarang jalur kapal dibatasi: batas bawah = tinggi label (14px), batas atas = ikon kapal (32px)
   + ruang untuk label "Treasure Island (Finish)" (24px). Progres 0..1 dipetakan ke jalur itu. */
const SHIP_LABEL_H = 14, SHIP_ICON_H = 32, SHIP_FINISH_H = 24;
function shipBottomCss(steps, total) {
    const frac = Math.max(0, Math.min(1, steps / total));
    return `calc(${SHIP_LABEL_H}px + (100% - ${SHIP_LABEL_H + SHIP_ICON_H + SHIP_FINISH_H}px) * ${frac})`;
}
function updateShipPositions() {
    const total = matchQuestions.length || 30;
    document.getElementById('ship-player').style.bottom = shipBottomCss(playerSteps, total);
    for (let i = 0; i < 3; i++) {
        document.getElementById('ship-bot' + (i + 1)).style.bottom = shipBottomCss(botSteps[i], total);
    }
}

function endRaceCheck() {
    if (GameState.hp <= 0) showGameOver();
    else showVictory();
}

function showVictory() {
    if (matchEnded) return;
    matchEnded = true;
    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }

    // PERBAIKAN-2 (bug 6): peringkat = 1 + jumlah bot yang LEBIH JAUH dari pemain. Saat seri, pemain dan bot
    // berbagi peringkat yang sama (sebelumnya sort stabil selalu menaruh pemain di atas bot).
    const rank = 1 + botSteps.filter(b => b > playerSteps).length;
    const isTied = botSteps.some(b => b === playerSteps);
    const bonus = VICTORY_BONUS[Math.min(rank, 4)];

    stopBGM();
    playSound('victory');
    GameState.matches++;
    GameState.coins += bonus.coins;
    GameState.xp += bonus.xp;
    let leveledUp = false;
    while (GameState.xp >= GameState.level * 100) {
        GameState.level++;
        leveledUp = true;
    }

    if (rank === 1) GameState.wins++;

    document.getElementById('vic-player-title').textContent =
        `${getPlayerName()}, ${matchQuestions.length} Soal Tuntas!`;
    document.getElementById('vic-pos').textContent =
        `#${rank} ${rank === 1 ? 'Juara 1' : rank === 2 ? 'Juara 2' : 'Peserta'}${isTied ? ' (Seri)' : ''}`;
    document.getElementById('vic-correct').textContent =
        `${currentMatchCorrect}/${matchQuestions.length}`;

    const totalAnswered = Math.max(1, currentMatchCorrect + currentMatchWrong);
    const acc = ((currentMatchCorrect / totalAnswered) * 100).toFixed(1);
    document.getElementById('vic-acc').textContent = `${acc}%`;
    document.getElementById('vic-streak').textContent = bestStreak;
    document.getElementById('vic-xp').textContent = `+${bonus.xp}`;
    document.getElementById('vic-coins').textContent = `+${bonus.coins} 🪙`;

    // Update leaderboard
    const matchScore = GameState.coins - matchStartCoins;
    const existing = GameState.leaderboard.find(l => l.name === getPlayerName());
    if (existing) {
        if (matchScore > existing.score) existing.score = matchScore;
    } else {
        GameState.leaderboard.push({ name: getPlayerName(), score: matchScore });
    }
    GameState.leaderboard.sort((a, b) => b.score - a.score);
    GameState.leaderboard = GameState.leaderboard.slice(0, 5);
    submitGlobalScore('single', matchScore);   // papan peringkat GLOBAL (single player)

    saveGameState();
    switchScreen('screen-victory');
    // PERBAIKAN bug 6: tampilkan popup hanya jika ada level yang BELUM diumumkan (termasuk level-up dari
    // jawaban terakhir yang ditunda di handleAnswer) -> maksimal satu popup, berisi level akhir.
    if (GameState.level > lastNotifiedLevel) {
        lastNotifiedLevel = GameState.level;
        showAlert("LEVEL UP!", `Selamat! Kapten naik ke Level ${GameState.level}!`);
    }
}

function showGameOver() {
    if (matchEnded) return;
    matchEnded = true;
    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }

    stopBGM();
    GameState.matches++;
    GameState.coins += 50;
    saveGameState();

    document.getElementById('go-correct').textContent = `${currentMatchCorrect}/${matchQuestions.length}`;
    document.getElementById('go-wrong').textContent = currentMatchWrong;
    document.getElementById('go-coins').textContent = "+50 🪙";

    switchScreen('screen-gameover');
}

/* =====================================================================
   SHOP
   ===================================================================== */
function renderShopItems(filter = 'all') {
    currentShopFilter = filter;
    document.getElementById('storwin-coins').textContent = GameState.coins;
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = "";

    const filtered = filter === 'all'
        ? SHOP_ITEMS
        : SHOP_ITEMS.filter(item => item.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-2 text-center text-[7px] p-3">Belum ada item di kategori ini.</div>';
        return;
    }

    filtered.forEach(item => {
        const isOwned    = GameState.inventory.includes(item.id);
        const isEquipped = GameState.equipped[item.category] === item.id;
        let btnLabel, btnAttr;
        if (isEquipped) {
            btnLabel = "Lepas";
            btnAttr = `onclick="unequipItem('${item.id}')"`;
        } else if (isOwned) {
            btnLabel = "Pakai";
            btnAttr = `onclick="equipItem('${item.id}')"`;
        } else {
            btnLabel = "Beli";
            btnAttr = `onclick="buyItem('${item.id}')"`;
        }

        const card = document.createElement('div');
        card.className = "pixel-box-parchment p-2 flex flex-col justify-between items-center text-center" + (isEquipped ? " is-equipped" : "");
        card.innerHTML = `
            <span class="text-2xl my-0.5">${item.icon}</span>
            <span class="text-[7px] font-bold leading-tight">${item.name}</span>
            <span class="text-[6.5px] text-yellow-700 font-bold mt-1">🪙 ${item.price}</span>
            <button class="pixel-btn text-[6.5px] py-1 px-2 mt-1.5 w-full" ${btnAttr}>${btnLabel}</button>
        `;
        grid.appendChild(card);
    });
}

function filterShop(cat) {
    playSound('click');
    renderShopItems(cat);
}

function buyItem(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    if (GameState.inventory.includes(id)) return;
    if (GameState.coins < item.price) {
        showAlert("KOIN KURANG", `Kamu butuh 🪙 ${item.price - GameState.coins} koin lagi untuk beli ${item.name}.`);
        return;
    }
    GameState.coins -= item.price;
    GameState.inventory.push(id);
    saveGameState();
    playSound('correct');
    renderShopItems(currentShopFilter);
}

function equipItem(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item || !GameState.inventory.includes(id)) return;
    GameState.equipped[item.category] = id;
    saveGameState();
    playSound('click');
    renderShopItems(currentShopFilter);
}

// Melepas item yang sedang dipakai (item tetap dimiliki dan bisa dipakai lagi kapan saja)
function unequipItem(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item || GameState.equipped[item.category] !== id) return;
    delete GameState.equipped[item.category];
    saveGameState();
    playSound('click');
    renderShopItems(currentShopFilter);
}

/* =====================================================================
   PROFILE / LEADERBOARD / COLLECTION
   ===================================================================== */
function renderProfileData() {
    refreshPlayerNameUI();
    document.getElementById('profile-avatar').innerHTML = renderAvatarHTML();
    document.getElementById('profile-title').textContent = GameState.playerTitle;
    document.getElementById('profile-level').textContent = `Level ${GameState.level}`;
    document.getElementById('profile-coins').textContent = `🪙 ${GameState.coins}`;
    document.getElementById('profile-xp').textContent = `⭐ ${GameState.xp}`;
    document.getElementById('profile-matches').textContent = GameState.matches;
    const winRate = GameState.matches > 0 ? ((GameState.wins / GameState.matches) * 100).toFixed(1) : 0;
    document.getElementById('profile-winrate').textContent = winRate + '%';
    document.getElementById('profile-correct').textContent = GameState.correctCount;
    document.getElementById('profile-wrong').textContent = GameState.wrongCount;
}

/* =====================================================================
   LEADERBOARD GLOBAL — dua papan (single & multiplayer), tiap papan maks. 20 pemain berbeda.
   Data disimpan di server bersama (bukan lagi di localStorage perangkat), jadi semua pemain
   di perangkat mana pun melihat peringkat yang sama. Aturan Top 20 dijalankan oleh server.
   ===================================================================== */
const LB_API_BASE = 'https://cmrtjrabwvonrhbkbgdz.supabase.co/functions/v1/leaderboard';   // alamat backend leaderboard (tanpa "/" di akhir)
const LB_LIMIT = 20;
const LB_TIMEOUT_MS = 10000;
const LB_MAX_TRIES = 10;                          // bug #6: batas percobaan kirim ulang satu skor
const LB_MAX_AGE_MS = 14 * 24 * 3600 * 1000;      // bug #6: skor yang menunggu lebih dari 14 hari dibuang
let lbTab = 'single';
let lbReqSeq = 0;
let lbFlushing = false;

function lbStoreGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function lbStoreSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
// ID acak per perangkat = pengenal pemain di server (tetap sama walau nama diganti; tidak pernah ditampilkan).
const LB_PID_RE = /^[A-Za-z0-9_-]{8,64}$/;
let lbPidMem = null;
function lbPid() {
    let id = null;
    try { id = localStorage.getItem('pirate_pid'); } catch (e) {}
    if (id && LB_PID_RE.test(id)) return id;
    if (lbPidMem) { try { localStorage.setItem('pirate_pid', lbPidMem); } catch (e) {} return lbPidMem; }
    try {
        if (window.crypto && crypto.randomUUID) id = crypto.randomUUID().replace(/-/g, '');
        else { const a = new Uint8Array(16); crypto.getRandomValues(a); id = Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); }
    } catch (e) { id = ''; }
    if (!LB_PID_RE.test(id || '')) id = (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'xxxxxxxx').replace(/[^A-Za-z0-9]/g, '').slice(0, 32);
    lbPidMem = id;
    try { localStorage.setItem('pirate_pid', id); } catch (e) {}
    return id;
}
// Beri tahu server bahwa nama pemain diganti (satu slot yang sama, bukan slot baru). Gagal = diam; nama ikut diperbarui saat kirim skor berikutnya.
function lbRenameRemote(newName) {
    lbFetchJson('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ pid: lbPid(), name: newName })
    }).catch(function () {});
}
function lbCacheGet(mode) { const c = lbStoreGet('pirate_lb_cache', {}); return Array.isArray(c[mode]) ? c[mode] : null; }
function lbCacheSet(mode, entries) { const c = lbStoreGet('pirate_lb_cache', {}); c[mode] = entries; lbStoreSet('pirate_lb_cache', c); }

async function lbFetchJson(path, options) {
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), LB_TIMEOUT_MS) : null;
    try {
        const res = await fetch(LB_API_BASE + path, Object.assign({ cache: 'no-store', signal: ctrl ? ctrl.signal : undefined }, options || {}));
        let data = null;
        try { data = await res.json(); } catch (e) {}
        return { ok: res.ok, status: res.status, data: data };
    } finally { if (timer) clearTimeout(timer); }
}

// Skor dikirim di latar belakang. Jika sedang offline / server sibuk, skor disimpan di antrean
// dan dikirim ulang otomatis nanti (saat game dibuka lagi, koneksi kembali, atau papan dibuka).
function submitGlobalScore(mode, score) {
    score = Math.floor(Number(score));
    if ((mode !== 'single' && mode !== 'multi') || !isFinite(score) || score < 1) return;
    const name = getPlayerName();
    const queue = lbStoreGet('pirate_lb_pending', []).filter(q => !(q.mode === mode && q.name === name && q.score <= score));
    queue.push({ mode: mode, name: name, score: score, at: Date.now() });
    lbStoreSet('pirate_lb_pending', queue.slice(-20));
    lbFlushPending();
}

// PERBAIKAN bug #6: pembantu antrean skor. Pencocokan memakai mode+nama+skor (bukan objek) karena antrean dibaca ulang dari localStorage.
function lbSameItem(a, b) { return a.mode === b.mode && a.name === b.name && a.score === b.score; }
function lbDropItem(item) {
    const q = lbStoreGet('pirate_lb_pending', []).filter(function (x) { return !lbSameItem(x, item); });
    lbStoreSet('pirate_lb_pending', q);
    return q;
}
function lbBumpTries(item) {
    const q = lbStoreGet('pirate_lb_pending', []);
    let tries = 1;
    q.forEach(function (x) { if (lbSameItem(x, item)) { x.tries = (x.tries || 0) + 1; tries = x.tries; } });
    lbStoreSet('pirate_lb_pending', q);
    return tries;
}

// Mengembalikan jumlah skor yang berhasil terkirim.
// Hasil kirim (sesuai backend): DITERIMA = 2xx + JSON berisi `entries`; DITOLAK PERMANEN = 400/413/422 (data tidak valid / terlalu besar).
// Selebihnya dianggap SEMENTARA dan skor disimpan untuk dicoba lagi: jaringan putus, 429, 5xx, 401/403/404/408, atau 2xx tanpa JSON
// yang benar (mis. halaman login Wi-Fi). Sebelumnya semua itu membuat skor dibuang diam-diam.
async function lbFlushPending() {
    if (lbFlushing) return 0;
    lbFlushing = true;
    let sent = 0;
    try {
        let queue = lbStoreGet('pirate_lb_pending', []);
        for (let i = 0; i < 25 && queue.length; i++) {
            const item = queue[0];
            if (item.at && Date.now() - item.at > LB_MAX_AGE_MS) { queue = lbDropItem(item); continue; }   // terlalu lama menunggu
            let r;
            try {
                // text/plain = "simple request" sehingga browser tidak perlu preflight CORS
                r = await lbFetchJson('/api/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body: JSON.stringify(Object.assign({ pid: lbPid() }, item))
                });
            } catch (e) { break; }                                  // jaringan bermasalah -> coba lagi nanti
            if (r.status >= 500 || r.status === 429) break;         // server sibuk -> coba lagi nanti
            const accepted = !!(r.ok && r.data && Array.isArray(r.data.entries));
            const rejected = r.status === 400 || r.status === 413 || r.status === 422;
            if (!accepted && !rejected) {
                if (lbBumpTries(item) < LB_MAX_TRIES) break;        // kemungkinan sementara -> simpan, coba lagi nanti
                queue = lbDropItem(item); continue;                 // gagal terlalu sering: menyerah agar tidak menahan skor di belakangnya
            }
            if (accepted) { lbCacheSet(item.mode, r.data.entries); sent++; }
            queue = lbDropItem(item);
        }
    } finally { lbFlushing = false; }
    return sent;
}

function setLeaderboardTab(mode) {
    if (mode !== 'single' && mode !== 'multi') return;
    playSound('click');
    lbTab = mode;
    renderLeaderboard();
}

function lbMessage(list, text) {
    const d = document.createElement('div');
    d.className = 'text-center text-[7px] p-2 leading-relaxed';
    d.textContent = text;
    list.appendChild(d);
}

function lbDrawEntries(list, entries) {
    list.innerHTML = '';
    if (!entries.length) { lbMessage(list, 'Belum ada data. Menangkan balapan untuk masuk papan peringkat!'); return; }
    const me = String(getPlayerName()).trim().toLowerCase();
    entries.slice(0, LB_LIMIT).forEach((entry, idx) => {
        const isPlayer = (typeof entry.me === 'boolean') ? entry.me : String(entry.name).trim().toLowerCase() === me;
        const row = document.createElement('div');
        row.className = `flex justify-between items-center p-2 border border-[#3e2723] ${isPlayer ? 'bg-yellow-100 font-bold' : 'bg-white/90'}`;
        // Nama berasal dari input pemain lain -> wajib lewat textContent (bukan innerHTML) agar aman dari HTML injection.
        const nameSpan = document.createElement('span');
        const medal = ['🥇', '🥈', '🥉'][idx];
        nameSpan.textContent = `${medal || (idx + 1) + '.'} ${entry.name}${isPlayer ? ' (Kamu)' : ''}`;
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'text-yellow-600 font-bold';
        scoreSpan.textContent = `🪙 ${entry.score}`;
        row.appendChild(nameSpan);
        row.appendChild(scoreSpan);
        list.appendChild(row);
    });
}

function lbDrawError(list) {
    list.innerHTML = '';
    lbMessage(list, 'Tidak bisa terhubung ke server papan peringkat. Periksa koneksi internetmu.');
    const btn = document.createElement('button');
    btn.className = 'pixel-btn text-[7px] px-2 py-2 mt-2';
    btn.textContent = '↻ COBA LAGI';
    btn.onclick = function () { playSound('click'); renderLeaderboard(); };
    list.appendChild(btn);
}

async function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    const status = document.getElementById('leaderboard-status');
    if (!list) return;
    const mode = lbTab;
    const seq = ++lbReqSeq;                      // abaikan respons lama jika pemain pindah tab / layar
    ['single', 'multi'].forEach(m => {
        const b = document.getElementById('lb-tab-' + m);
        if (b) b.classList.toggle('pixel-btn-action', m === mode);
    });

    // Tampilkan data terakhir yang tersimpan (jika ada) sambil menunggu data terbaru dari server.
    const cached = lbCacheGet(mode);
    if (cached) lbDrawEntries(list, cached);
    else { list.innerHTML = ''; lbMessage(list, 'Memuat papan peringkat...'); }
    if (status) status.textContent = 'Memuat data terbaru...';

    const flushed = lbFlushPending();            // kirim skor tertunda (jika ada) tanpa menahan tampilan
    try {
        const r = await lbFetchJson('/api/leaderboard/' + mode + '?pid=' + encodeURIComponent(lbPid()));
        if (seq !== lbReqSeq) return;
        if (!r.ok || !r.data || !Array.isArray(r.data.entries)) throw new Error('respons tidak valid');
        lbCacheSet(mode, r.data.entries);
        lbDrawEntries(list, r.data.entries);
        if (status) status.textContent = `Top ${LB_LIMIT} pemain terbaik • skor = koin per balapan`;
    } catch (e) {
        if (seq !== lbReqSeq) return;
        if (cached) { if (status) status.textContent = 'Server tidak terjangkau. Menampilkan data terakhir yang tersimpan.'; }
        else { if (status) status.textContent = ''; lbDrawError(list); }
    }
    // Jika ada skor tertunda yang baru berhasil terkirim, muat ulang sekali agar ikut tampil.
    flushed.then(n => { if (n > 0 && seq === lbReqSeq && lbTab === mode) renderLeaderboard(); });
}

window.addEventListener('online', () => { lbFlushPending(); });
window.addEventListener('load', () => { setTimeout(lbFlushPending, 2500); });

function renderCollection() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = "";
    if (GameState.inventory.length === 0) {
        grid.innerHTML = '<div class="col-span-2 text-center text-[7px] p-3">Belum ada item. Kunjungi Storwin untuk belanja!</div>';
        return;
    }
    GameState.inventory.forEach(itemId => {
        const item = SHOP_ITEMS.find(s => s.id === itemId);
        if (!item) return;
        const isEquipped = GameState.equipped[item.category] === item.id;
        const card = document.createElement('div');
        card.className = "pixel-box-parchment p-2 flex flex-col items-center text-center";
        card.innerHTML = `
            <span class="text-2xl my-0.5">${item.icon}</span>
            <span class="text-[7px] font-bold leading-tight">${item.name}</span>
            <span class="text-[6px] ${isEquipped ? 'text-blue-700' : 'text-green-700'} mt-0.5 font-bold">
                ${isEquipped ? '✅ Dipakai' : 'Terbeli'}
            </span>
        `;
        grid.appendChild(card);
    });
}

/* =====================================================================
   SETTINGS
   ===================================================================== */
function toggleMusic() {
    GameState.musicOn = !GameState.musicOn;
    if (GameState.musicOn) startBGM();
    else stopBGM();
    saveGameState();
    syncSettingsUI();
}

function toggleSFX() {
    GameState.sfxOn = !GameState.sfxOn;
    saveGameState();
    syncSettingsUI();
}

function syncSettingsUI() {
    document.getElementById('btn-toggle-music').textContent = GameState.musicOn ? "ON" : "OFF";
    document.getElementById('btn-toggle-sfx').textContent = GameState.sfxOn ? "ON" : "OFF";
}

function confirmResetData() {
    showConfirm("RESET DATA", "Apakah kamu yakin ingin mereset seluruh data permainan? Tindakan ini tidak bisa dibatalkan.", () => {
        // FIX #3: jangan pakai localStorage.clear() karena menghapus data app lain di origin yang sama.
        // Hapus hanya key milik game ini (berawalan "pirate_").
        try {
            const keysToRemove = [];
            // PERBAIKAN bug #5: 'pirate_pid' = pengenal pemain di papan peringkat global. Bila dihapus, server menganggap kita pemain baru
            // dan entri lama tertinggal sebagai duplikat (backend tidak punya fitur hapus), jadi key ini dipertahankan.
            const KEEP = { 'pirate_pid': true };
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('pirate_') && !KEEP[k]) keysToRemove.push(k);
            }
            keysToRemove.push('pirate-edurace-kickban');   // data multiplayer: berawalan "pirate-" (bukan "pirate_") sehingga tadinya terlewat
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) { console.warn('Gagal mereset localStorage:', e); }
        location.reload();
    });
}

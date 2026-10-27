/* js/pixel-fx.js (efek item Storwin) — bagian dari upgrade grafis pixel (milik Claude; lihat docs/PEMBAGIAN-TUGAS-PIXEL.md).
   Dimuat SETELAH game.js dan multiplayer.js. Logika game tidak diubah; bila skrip ini gagal, game tetap jalan tanpa efek. */
try {
/* EFEK ITEM STORWIN
   Aturan:
   - Kapal: efek HANYA berlaku di balapan MULTIPLAYER. Kapal Kayu (ship-1) adalah item awal, jadi tanpa efek.
   - Item lain (baju, topi, sepatu, peliharaan, aksesori, furnitur): efek HANYA berlaku di SINGLE PLAYER.
   - Satu item per kategori dipakai pada satu waktu, jadi efek antar kategori boleh bertumpuk.
   - Bonus koin tidak masuk skor papan peringkat: di single player bonus menggeser matchStartCoins,
     di multiplayer bonus dibayar sesudah hadiah peringkat dan skor sudah terkirim.
   Efek tiap item (teks yang sama ada di FX_DESC pada js/pixel-avatar.js):
     MULTIPLAYER
       ship-2 Kapal Emas   : +40 koin di akhir balapan (bila balapan tuntas)
       ship-3 Kapal Hantu  : bangkit 1x; jawaban salah yang akan menghabiskan nyawa terakhir -> pulih 2 nyawa
       ship-4 Kano Dayung  : +5 detik waktu tiap soal
       ship-5 Speedboat    : jawaban benar dalam 10 detik pertama = +2 koin (dibayar di akhir, bila tuntas)
       ship-6 Kapal Feri   : tameng 1x; jawaban salah pertama tidak mengurangi nyawa
     SINGLE PLAYER
       outfit-1 Baju Pelaut: +5 XP tiap jawaban benar          outfit-2 Jubah Kapten: +10 XP
       hat-1 Topi Bajak    : +10 detik tiap soal               hat-2 Bandana: +5 detik
       shoes-1 Sepatu Boots: +2 koin tiap jawaban benar        shoes-2 Sandal Kayu: +1 koin
       pet-1 Burung Beo    : 1 pilihan salah dicoret di soal sulit
       pet-2 Monyet Nakal  : tiap 3 jawaban benar beruntun, +8 koin
       acc-1 Kacamata      : +10 XP tambahan tiap jawaban benar di soal sulit
       acc-2 Kompas Antik  : waktu soal habis -> +15 detik (1x per balapan)
       furn-1 Peti Harta   : +25 koin setiap balapan tuntas
       furn-2 Meriam Kapal : tameng 1x per balapan; jawaban salah pertama tidak mengurangi nyawa
   Fungsi game dibungkus (pola yang sama dengan modul multiplayer); logika asli tidak diubah. */
(function () {
    'use strict';

    // ---- angka efek (ubah di sini bila ingin menyeimbangkan) ----
    var CHEST_BONUS = 25;                                   // Peti Harta
    var XP_SOLO = { 'outfit-1': 5, 'outfit-2': 10 };        // XP per jawaban benar
    var XP_HARD = 10;                                       // Kacamata: tambahan XP di soal sulit
    var TIME_SOLO = { 'hat-1': 10, 'hat-2': 5 };            // detik tambahan per soal
    var COIN_SOLO = { 'shoes-1': 2, 'shoes-2': 1 };         // koin per jawaban benar
    var STREAK_EVERY = 3, STREAK_COINS = 8;                 // Monyet Nakal
    var COMPASS_SEC = 15;                                   // Kompas Antik
    var TIME_MULTI = { 'ship-4': 5 };                       // Kano Dayung
    var GOLD_COINS = 40;                                    // Kapal Emas
    var FAST_MS = 10000, FAST_COINS = 2;                    // Speedboat
    var GHOST_HEAL = 2;                                     // Kapal Hantu

    // ---- bantuan ----
    function worn(cat, id) {
        try { return GameState.equipped[cat] === id && GameState.inventory.indexOf(id) >= 0; } catch (e) { return false; }
    }
    function wornId(cat) {
        try {
            var id = GameState.equipped[cat];
            return id && GameState.inventory.indexOf(id) >= 0 ? id : '';
        } catch (e) { return ''; }
    }
    function mpRace() { try { return (window.MP && window.MP._state && window.MP._state.race) || null; } catch (e) { return null; } }
    function inMultiplayer() { return !!mpRace(); }

    var toastEl = null, toastTimer = 0;
    function toast(text) {
        try {
            if (!toastEl) toastEl = document.getElementById('fx-toast');
            if (!toastEl) {
                toastEl = document.createElement('div'); toastEl.id = 'fx-toast';
                (document.getElementById('game-container') || document.body).appendChild(toastEl);
            }
            toastEl.textContent = text; toastEl.classList.add('show');
            clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
        } catch (e) { }
    }

    // status per balapan (di-reset setiap balapan dimulai, single maupun multiplayer)
    var shield = true;          // Meriam Kapal (single)
    var shipShield = true;      // Kapal Feri (multiplayer)
    var revive = true;          // Kapal Hantu (multiplayer)
    var compass = true;         // Kompas Antik (single)
    var fastCount = 0;          // jumlah jawaban benar cepat (Speedboat, multiplayer)
    var qStart = 0;             // waktu soal ditampilkan (ms)
    var soloXp = 0, soloCoins = 0;  // total bonus single player pada balapan ini (untuk ditampilkan di layar akhir)

    function answerable() {
        try { return !matchEnded && !!matchQuestions[currentQuestionIdx]; } catch (e) { return false; }
    }

    // tambah waktu pada soal yang sedang berjalan (juga saat timer dijeda oleh popup)
    function addTime(sec) {
        try {
            var ms = sec * 1000, left;
            if (pausedRemainingMs !== null) { pausedRemainingMs += ms; left = pausedRemainingMs; }
            else if (raceTimer) { questionDeadline += ms; left = Math.max(0, questionDeadline - Date.now()); }
            else return;
            var el = document.getElementById('quiz-timer');
            if (el) el.textContent = '⏱ ' + Math.ceil(left / 1000) + 's';
        } catch (e) { }
    }

    // Burung Beo: coret satu pilihan salah secara acak
    function strikeWrongOption() {
        var btns = Array.prototype.slice.call(document.querySelectorAll('#quiz-options-container button[data-correct="0"]'));
        if (!btns.length) return;
        var b = btns[Math.floor(Math.random() * btns.length)];
        b.disabled = true; b.style.opacity = '.4'; b.style.textDecoration = 'line-through';
    }

    // ---- reset saat balapan dimulai ----
    var origLaunch = window.launchRaceGame;
    if (typeof origLaunch === 'function') {
        window.launchRaceGame = function () {
            shield = true; shipShield = true; revive = true; compass = true;
            fastCount = 0; soloXp = 0; soloCoins = 0;
            try { var old = document.getElementById('fx-mp-bonus'); if (old) old.remove(); } catch (e) { }   // baris bonus balapan sebelumnya
            return origLaunch.apply(this, arguments);
        };
    }

    // ---- efek yang aktif saat soal baru ditampilkan: waktu tambahan & Burung Beo ----
    var origLoad = window.loadNextQuestion;
    if (typeof origLoad === 'function') {
        window.loadNextQuestion = function () {
            var out = origLoad.apply(this, arguments);
            try {
                if (answerable()) {
                    qStart = Date.now();
                    var R = mpRace();
                    if (R) {
                        if (R.started && R.active && !R.screenDone) {
                            var tm = TIME_MULTI[wornId('ship')];
                            if (tm) addTime(tm);
                        }
                    } else {
                        var ts = TIME_SOLO[wornId('hat')];
                        if (ts) addTime(ts);
                        if (worn('pet', 'pet-1') && matchQuestions[currentQuestionIdx].level === 'hard') strikeWrongOption();
                    }
                }
            } catch (e) { }
            return out;
        };
    }

    // ---- Kompas Antik: waktu habis -> tambahan waktu sekali per balapan (single) ----
    var origTimeout = window.handleQuestionTimeout;
    if (typeof origTimeout === 'function') {
        window.handleQuestionTimeout = function () {
            try {
                if (compass && worn('accessories', 'acc-2') && !inMultiplayer() && answerable() && !isAnsweringLocked) {
                    compass = false;
                    startQuestionTimer(COMPASS_SEC * 1000);
                    toast('Kompas menunjukkan arah! +' + COMPASS_SEC + ' detik');
                    return;
                }
            } catch (e) { }
            return origTimeout.apply(this, arguments);
        };
    }

    // ---- efek saat menjawab: dihitung SEBELUM logika asli supaya koin/XP/nyawa ikut terproses (level-up, HUD, simpan) ----
    function beforeAnswer(ok) {
        var notes = [];
        if (!answerable()) return notes;
        var R = mpRace();

        if (R) {                                            // ===== MULTIPLAYER: efek kapal =====
            if (!(R.started && R.active && !R.myDone && !R.screenDone)) return notes;
            var ship = wornId('ship');
            if (!ok) {
                if (ship === 'ship-6' && shipShield) {
                    shipShield = false; GameState.hp++;     // impas dengan pengurangan 1 nyawa oleh game asli
                    notes.push('Tameng Feri menahan serangan! Nyawa aman');
                } else if (ship === 'ship-3' && revive && GameState.hp <= 1) {
                    revive = false; GameState.hp += GHOST_HEAL;
                    notes.push('Kapal Hantu bangkit! Nyawa pulih ' + (GHOST_HEAL - 1));
                }
            } else if (ship === 'ship-5' && Date.now() - qStart <= FAST_MS) {
                fastCount++;
                notes.push('Speedboat ngebut! +' + FAST_COINS + ' koin di akhir');
            }
            return notes;
        }

        // ===== SINGLE PLAYER: efek item lain =====
        if (!ok) {
            if (shield && worn('furniture', 'furn-2')) {
                shield = false; GameState.hp++;
                notes.push('Meriam menahan serangan! Nyawa aman');
            }
            return notes;
        }
        var xp = (XP_SOLO[wornId('outfit')] || 0);
        if (worn('accessories', 'acc-1') && matchQuestions[currentQuestionIdx].level === 'hard') xp += XP_HARD;
        var coins = (COIN_SOLO[wornId('shoes')] || 0);
        if (worn('pet', 'pet-2') && (streakCount + 1) % STREAK_EVERY === 0) coins += STREAK_COINS;
        if (xp > 0) { GameState.xp += xp; soloXp += xp; notes.push('+' + xp + ' XP'); }
        if (coins > 0) {
            GameState.coins += coins; soloCoins += coins;
            matchStartCoins += coins;                       // bonus tidak ikut dihitung sebagai skor papan peringkat
            notes.push('+' + coins + ' koin');
        }
        return notes;
    }

    var origAnswer = window.handleAnswer;
    if (typeof origAnswer === 'function') {
        window.handleAnswer = function (isCorrect) {
            var notes = [];
            try { notes = beforeAnswer(!!isCorrect); } catch (e) { }
            var out = origAnswer.apply(this, arguments);
            try { if (notes.length) toast(notes.join(' • ')); } catch (e) { }
            return out;
        };
    }

    // ---- layar akhir single player: Peti Harta + ringkasan bonus item ----
    function appendText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent += text;
    }
    var origVictory = window.showVictory;
    if (typeof origVictory === 'function') {
        window.showVictory = function () {
            var was = false;
            try { was = !!matchEnded; } catch (e) { }
            var out = origVictory.apply(this, arguments);
            try {
                if (!was && matchEnded && !inMultiplayer()) {
                    if (worn('furniture', 'furn-1')) {
                        GameState.coins += CHEST_BONUS;
                        saveGameState();
                        appendText('vic-coins', ' (+' + CHEST_BONUS + ' Peti)');
                    }
                    if (soloCoins > 0) appendText('vic-coins', ' (+' + soloCoins + ' item)');
                    if (soloXp > 0) appendText('vic-xp', ' (+' + soloXp + ' item)');
                }
            } catch (e) { }
            return out;
        };
    }
    var origGameOver = window.showGameOver;
    if (typeof origGameOver === 'function') {
        window.showGameOver = function () {
            var was = false;
            try { was = !!matchEnded; } catch (e) { }
            var out = origGameOver.apply(this, arguments);
            try {
                if (!was && matchEnded && !inMultiplayer() && soloCoins > 0) appendText('go-coins', ' (+' + soloCoins + ' item)');
            } catch (e) { }
            return out;
        };
    }

    // ---- akhir balapan MULTIPLAYER: bonus koin kapal dibayar setelah hadiah peringkat (tidak masuk papan peringkat) ----
    window.addEventListener('mp:final', function (ev) {
        try {
            var d = (ev && ev.detail) || {};
            var fast = fastCount; fastCount = 0;
            if (d.why !== 'complete') return;               // keluar / nyawa habis: tanpa bonus kapal
            var ship = wornId('ship'), bonus = 0, label = '';
            if (ship === 'ship-2') { bonus = GOLD_COINS; label = 'Kapal Emas'; }
            else if (ship === 'ship-5' && fast > 0) { bonus = fast * FAST_COINS; label = 'Speedboat'; }
            if (bonus <= 0) return;
            GameState.coins += bonus;
            saveGameState();
            var rw = document.getElementById('mp-res-reward');
            if (rw) {
                var line = document.getElementById('fx-mp-bonus');
                if (!line) {
                    line = document.createElement('div'); line.id = 'fx-mp-bonus'; line.className = 'mp-reward';
                    rw.insertAdjacentElement('afterend', line);
                }
                line.textContent = 'Bonus ' + label + ': +' + bonus + ' koin';
            }
        } catch (e) { }
    });
})();

} catch (e) { console.warn('Efek item dimatikan:', e); }

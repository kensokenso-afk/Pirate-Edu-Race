/* js/pixel-fx.js (efek item Storwin) — bagian dari upgrade grafis pixel (milik Claude; lihat docs/PEMBAGIAN-TUGAS-PIXEL.md).
   Dimuat SETELAH game.js dan multiplayer.js. Logika game tidak diubah; bila skrip ini gagal, game tetap jalan tanpa efek. */
try {
/* EFEK ITEM STORWIN
   Aturan:
   - Kapal: efek HANYA berlaku di balapan MULTIPLAYER. Kapal Kayu (ship-1) adalah item awal, jadi tanpa efek.
     PENGECUALIAN: ship-7, ship-8, ship-9 (kapal "dua mode") berlaku di SINGLE PLAYER dan MULTIPLAYER.
   - Item lain (baju, topi, sepatu, peliharaan, aksesori, furnitur): efek HANYA berlaku di SINGLE PLAYER.
     PENGECUALIAN: tiga baju baru (outfit-3/4/5) dan Topi Navigator (hat-5) berlaku di SINGLE dan MULTIPLAYER;
     Topi Koki (hat-3) dan Topi Wakil Kapten (hat-4) berlaku HANYA di MULTIPLAYER.
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
       hat-3 Topi Koki         : +3 XP tiap jawaban benar
       hat-4 Topi Wakil Kapten : finis peringkat 1-2 -> +40 koin (dibayar di akhir, bila balapan tuntas)
     SINGLE PLAYER DAN MULTIPLAYER (tiga kapal "dua mode")
       ship-7 Kapal Lumba-Lumba: sonar; di soal sedang & sulit, 1 pilihan salah dicoret otomatis
       ship-8 Kapal Hiu        : +2 koin tiap jawaban benar (single: langsung, tidak masuk skor; multiplayer: dibayar di akhir bila tuntas)
       ship-9 Kapal Gurita     : waktu soal habis -> +10 detik, maks. 2x per balapan
     Ketiga kapal ini tidak menambah nyawa, tidak mengubah streak, dan tidak melewati soal (server membatasi salah <= 6).
     SINGLE PLAYER
       outfit-1 Baju Pelaut: +5 XP tiap jawaban benar          outfit-2 Jubah Kapten: +10 XP
       hat-1 Topi Bajak Laut: +10 detik tiap soal               hat-2 Bandana: +5 detik
       shoes-1 Sepatu Boots: +2 koin tiap jawaban benar        shoes-2 Sandal Kayu: +1 koin
       pet-1 Burung Beo    : 1 pilihan salah dicoret di soal sulit
       pet-2 Monyet Nakal  : tiap 3 jawaban benar beruntun, +8 koin
       acc-1 Kacamata      : +10 XP tambahan tiap jawaban benar di soal sulit
       acc-2 Kompas Antik  : waktu soal habis -> +15 detik (1x per balapan)
       furn-1 Peti Harta   : +25 koin setiap balapan tuntas
       furn-2 Meriam Kapal : tameng 1x per balapan; jawaban salah pertama tidak mengurangi nyawa
       pants-1 Celana Pelaut     : +3 XP tiap jawaban benar
       pants-2 Celana Kargo      : +4 koin tiap jawaban benar di soal sulit
       pants-3 Celana Layar      : +10 detik tiap soal sulit
       pants-4 Celana Tahan Badai: nyawa <= 2 -> +8 XP tiap jawaban benar
       pants-5 Celana Kapten Emas: balapan tuntas tanpa satu pun jawaban salah -> +40 koin (dibayar sesudah skor terkirim)
     SINGLE PLAYER DAN MULTIPLAYER (tiga baju baru + Topi Navigator; satu-satunya item non-kapal yang aktif di multiplayer,
     selain Topi Koki & Topi Wakil Kapten di atas)
       outfit-3 Baju Koki            : tiap 4 jawaban benar -> +3 koin, dibayar di akhir balapan tuntas
       outfit-4 Seragam Wakil Kapten : jawaban benar saat streak 3+ -> +4 XP
       outfit-5 Baju Navigator       : soal sulit -> 1 pilihan salah dicoret (maks. 3x per balapan)
       hat-5 Topi Navigator          : +3 koin tiap jawaban benar di soal sulit (single: langsung, tidak masuk skor;
                                       multiplayer: dibayar di akhir bila tuntas)
     Keempatnya (dan hat-3, hat-4) tidak mengubah nyawa, waktu soal, streak, atau jumlah benar (server membatasi salah <= 6).
     Koinnya tidak ikut skor papan peringkat: dibayar SESUDAH skor terkirim (atau menggeser matchStartCoins di single).
     XP memang tidak masuk skor.
   Fungsi game dibungkus (pola yang sama dengan modul multiplayer); logika asli tidak diubah. */
(function () {
    'use strict';

    // ---- angka efek (ubah di sini bila ingin menyeimbangkan) ----
    var CHEST_BONUS = 25;                                   // Peti Harta
    var XP_SOLO = { 'outfit-1': 5, 'outfit-2': 10 };        // XP per jawaban benar
    var XP_HARD = 10;                                       // Kacamata: tambahan XP di soal sulit
    var TIME_SOLO = { 'hat-1': 10, 'hat-2': 5 };            // detik tambahan per soal
    var COIN_SOLO = { 'shoes-1': 2, 'shoes-2': 1 };         // koin per jawaban benar
    var PANTS_XP = 3;                                       // Celana Pelaut: XP per jawaban benar
    var CARGO_COINS = 4;                                    // Celana Kargo: koin per jawaban benar di soal sulit
    var SAIL_SEC = 10;                                      // Celana Layar: detik tambahan di soal sulit
    var STORM_HP = 2, STORM_XP = 8;                         // Celana Tahan Badai: nyawa <= 2 -> XP tambahan
    var GOLD_CLEAN = 40;                                    // Celana Kapten Emas: bonus tuntas tanpa salah
    var STREAK_EVERY = 3, STREAK_COINS = 8;                 // Monyet Nakal
    var COMPASS_SEC = 15;                                   // Kompas Antik
    var TIME_MULTI = { 'ship-4': 5 };                       // Kano Dayung
    var GOLD_COINS = 40;                                    // Kapal Emas
    var FAST_MS = 10000, FAST_COINS = 2;                    // Speedboat
    var GHOST_HEAL = 2;                                     // Kapal Hantu
    var SHARK_COINS = 2;                                    // Kapal Hiu (single & multiplayer)
    var INK_SEC = 10, INK_USES = 2;                         // Kapal Gurita (single & multiplayer)
    var COOK_EVERY = 4, COOK_COINS = 3;                     // Baju Koki: tiap 4 jawaban benar -> +3 koin di akhir
    var CMD_STREAK = 3, CMD_XP = 4;                         // Seragam Wakil Kapten: streak 3+ -> +4 XP per jawaban benar
    var NAV_MAX = 3;                                        // Baju Navigator: maks. soal sulit yang dibantu per balapan
    var HAT_XP = 3;                                         // Topi Koki (multiplayer): XP per jawaban benar
    var HAT_RANK_COINS = 40;                                // Topi Wakil Kapten (multiplayer): bonus koin bila finis peringkat 1-2
    var HAT_HARD_COINS = 3;                                 // Topi Navigator (single & multiplayer): koin per jawaban benar di soal sulit

    // ---- KATALOG & TAMPILAN KAPAL "DUA MODE" (ship-7, ship-8, ship-9) ----
    // Definisi tiga kapal ini sengaja disatukan di berkas ini (tanpa menyentuh game.js / pixel-avatar.js yang besar):
    // item didaftarkan ke SHOP_ITEMS tepat sesudah ship-6, lalu kartu Storwin / Koleksi dan panel "Tampilanmu" diberi
    // ikon pixel + teks efek. Pindahkan ke SHOP_ITEMS (game.js), FX_DESC dan ICONS (pixel-avatar.js) bila ingin seragam.
    var SHIP_PAL = { o: '#2c1a0e', w: '#ffffff', b: '#2f78d6', k: '#1b1b26', a: '#e8742a', A: '#b4521a', g: '#8d94a3', G: '#5d6372',
                     l: '#c6ecff', c: '#44d7e8', t: '#25a39a', T: '#167069', m: '#a56a34', M: '#6b4220', z: '#2a2f44' };
    var NEW_SHIPS = [
        { id: 'ship-7', name: 'Kapal Lumba-Lumba', price: 400, icon: '🐬',
          desc: 'Efek: sonar, 1 pilihan salah dicoret di soal sedang & sulit (single & multiplayer)', art: [
            '....................',
            '.........cc.........',
            '.........M.c........',
            '.........Mlll.......',
            '.........Mllll......',
            '.........Mlllll.....',
            '.........Mllllll....',
            '.........Mlllllll...',
            '.........Mcccccccb..',
            '.........M..........',
            '.........M..........',
            '.........M..........',
            '.........M..........',
            '.........M..........',
            '...MMMMMMMMMMMMMM...',
            '...MttttttttttttM...',
            '....MTTTTTTTTTTM....',
            '.bbbbbbbbbbbbbbbbbb.',
            '....................',
            '....................'
        ] },
        { id: 'ship-8', name: 'Kapal Hiu', price: 650, icon: '🦈',
          desc: 'Efek: +2 koin tiap jawaban benar (single & multiplayer)', art: [
            '....................',
            '.........G..........',
            '.........GG.........',
            '.........GGG........',
            '.........GgGG.......',
            '.........GggGG......',
            '.........GgggGG.....',
            '.........GgggggG....',
            '.........GgggggggGG.',
            '.........M..........',
            '.........M..........',
            '.........M..........',
            '.........M..........',
            '.........M..........',
            '...zzzzzzzzzzzzzz...',
            '...zGwGwGwGwGwGwz...',
            '....zGGGGGGGGGGz....',
            '.bbbbbbbbbbbbbbbbbb.',
            '....................',
            '....................'
        ] },
        { id: 'ship-9', name: 'Kapal Gurita', price: 500, icon: '🐙',
          desc: 'Efek: waktu habis, +10 detik, maks. 2x per balapan (single & multiplayer)', art: [
            '....................',
            '....................',
            '.......oooooo.......',
            '......oaaaaaao......',
            '.....oaaaaaaaao.....',
            '....oaaaaaaaaaao....',
            '....oawkaaaakwao....',
            '....oaaaaaaaaaao....',
            '....oAAAAAAAAAAo....',
            '....oa.a.MM.a.ao....',
            '....a..a.MM.a..a....',
            '....A..A.MM.A..A....',
            '.........MM.........',
            '.........MM.........',
            '...MMMMMMMMMMMMMM...',
            '...MmmmkmmkmmkmmM...',
            '....MmmmmmmmmmmM....',
            '.bbbbbbbbbbbbbbbbbb.',
            '....................',
            '....................'
        ] }
    ];
    try {
        var shipAt = -1;
        for (var si = 0; si < SHOP_ITEMS.length; si++) if (SHOP_ITEMS[si].id === 'ship-6') shipAt = si;
        NEW_SHIPS.slice().reverse().forEach(function (n) {
            if (SHOP_ITEMS.some(function (x) { return x.id === n.id; })) return;
            SHOP_ITEMS.splice(shipAt >= 0 ? shipAt + 1 : SHOP_ITEMS.length, 0, { id: n.id, name: n.name, category: 'ship', price: n.price, icon: n.icon });
        });
    } catch (e) { }
    var shipUrls = {};
    function shipUrl(n) {
        if (shipUrls[n.id]) return shipUrls[n.id];
        var cv = document.createElement('canvas'); cv.width = 20; cv.height = 20;
        var cx = cv.getContext('2d');
        for (var y = 0; y < n.art.length; y++) for (var x = 0; x < 20; x++) {
            var col = SHIP_PAL[n.art[y].charAt(x)];
            if (col) { cx.fillStyle = col; cx.fillRect(x, y, 1, 1); }
        }
        return (shipUrls[n.id] = cv.toDataURL('image/png'));
    }
    function newShipBy(key, val) {
        for (var i = 0; i < NEW_SHIPS.length; i++) if (NEW_SHIPS[i][key] === val) return NEW_SHIPS[i];
        return null;
    }
    function decorateShips() {
        try {
            var cells = document.querySelectorAll('#shop-items-grid .text-2xl, #collection-grid .text-2xl');
            Array.prototype.forEach.call(cells, function (el) {
                if (el.querySelector('img')) return;
                var n = newShipBy('icon', el.textContent.trim());
                if (!n) return;
                el.textContent = '';
                var img = document.createElement('img');
                img.className = 'pxit'; img.src = shipUrl(n); img.alt = n.icon; img.title = n.name;
                img.width = 20; img.height = 20; img.draggable = false;
                el.appendChild(img);
                if (el.parentElement && !el.parentElement.querySelector('.fx-desc')) {
                    var d = document.createElement('span'); d.className = 'fx-desc'; d.textContent = n.desc;
                    var nameEl = el.nextElementSibling;
                    if (nameEl) nameEl.insertAdjacentElement('afterend', d); else el.insertAdjacentElement('afterend', d);
                }
            });
            // panel "Tampilanmu": pixel-avatar.js memakai ikon Kapal Kayu bila kapal terpasang tidak punya sprite di berkasnya
            var eqShip = (GameState.equipped || {}).ship, pn = newShipBy('id', eqShip), pim = document.querySelector('#sw-pship img');
            if (pn && pim && pim.getAttribute('data-px-ship') !== pn.id) { pim.src = shipUrl(pn); pim.setAttribute('data-px-ship', pn.id); }
        } catch (e) { }
    }
    var decoTimer = 0;
    function scheduleDecorate(records) {
        try {
            if (records && !records.some(function (r) {
                return r.target && r.target.closest && r.target.closest('#shop-items-grid, #collection-grid, #sw-preview, #screen-storwin, #screen-collection');
            })) return;
        } catch (e) { }
        if (decoTimer) return;
        decoTimer = setTimeout(function () { decoTimer = 0; decorateShips(); }, 0);
    }
    try { new MutationObserver(scheduleDecorate).observe(document.body, { childList: true, subtree: true }); scheduleDecorate(); } catch (e) { }

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
    var sharkCount = 0;         // jumlah jawaban benar saat Kapal Hiu dipakai (multiplayer: dibayar di akhir)
    var inkLeft = INK_USES;     // sisa tambahan waktu Kapal Gurita
    var qStart = 0;             // waktu soal ditampilkan (ms)
    var soloXp = 0, soloCoins = 0;  // total bonus single player pada balapan ini (untuk ditampilkan di layar akhir)
    var cookCorrect = 0;            // Baju Koki: jumlah jawaban benar pada balapan ini (single & multiplayer)
    var cmdXp = 0;                  // Seragam Wakil Kapten: total XP bonus pada balapan ini
    var navUsed = 0, navKey = '';   // Baju Navigator: soal yang sudah dibantu, penanda soal terakhir
    var hatXp = 0;                  // Topi Koki: total XP bonus pada balapan multiplayer ini
    var hatHard = 0;                // Topi Navigator (multiplayer): jawaban benar di soal sulit, dibayar di akhir

    function answerable() {
        try { return !matchEnded && !!matchQuestions[currentQuestionIdx]; } catch (e) { return false; }
    }

    // Khusus tiga baju baru (berlaku di single DAN multiplayer): true bila ada soal yang benar-benar sedang dikerjakan.
    // Di multiplayer, beginRace() memanggil launchRaceGame() (memuat soal acak sementara) sebelum memasang urutan soal host,
    // jadi soal baru dianggap sah hanya bila id-nya sama dengan urutan host.
    function raceLive() {
        try {
            if (!answerable()) return false;
            var R = mpRace();
            if (!R) return true;
            if (!(R.started && R.active && !R.myDone && !R.screenDone)) return false;
            return !!R.order && R.order[currentQuestionIdx] === matchQuestions[currentQuestionIdx].id;
        } catch (e) { return false; }
    }
    function cookBonus() { return Math.floor(cookCorrect / COOK_EVERY) * COOK_COINS; }

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

    // Baju Navigator: coret satu pilihan salah yang masih aktif; selalu sisakan minimal satu pilihan salah
    function strikeActiveWrong() {
        var btns = Array.prototype.slice.call(document.querySelectorAll('#quiz-options-container button[data-correct="0"]'))
            .filter(function (b) { return !b.disabled; });
        if (btns.length < 2) return false;
        var b = btns[Math.floor(Math.random() * btns.length)];
        b.disabled = true; b.style.opacity = '.4'; b.style.textDecoration = 'line-through';
        return true;
    }

    // ---- reset saat balapan dimulai ----
    var origLaunch = window.launchRaceGame;
    if (typeof origLaunch === 'function') {
        window.launchRaceGame = function () {
            shield = true; shipShield = true; revive = true; compass = true;
            fastCount = 0; sharkCount = 0; inkLeft = INK_USES; soloXp = 0; soloCoins = 0; cookCorrect = 0; cmdXp = 0; navUsed = 0; navKey = '';
            hatXp = 0; hatHard = 0;
            try { var old = document.getElementById('fx-mp-bonus'); if (old) old.remove(); } catch (e) { }   // baris bonus balapan sebelumnya
            try { var old2 = document.getElementById('fx-mp-outfit'); if (old2) old2.remove(); } catch (e) { }
            try { var old3 = document.getElementById('fx-mp-hat'); if (old3) old3.remove(); } catch (e) { }
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
                        if (worn('pants', 'pants-3') && matchQuestions[currentQuestionIdx].level === 'hard') addTime(SAIL_SEC);
                        if (worn('pet', 'pet-1') && matchQuestions[currentQuestionIdx].level === 'hard') strikeWrongOption();
                    }
                }
                // Baju Navigator (single & multiplayer). Soal yang sama bisa dimuat dua kali (mis. awal multiplayer):
                // pada pemuatan ulang, coretan dipasang lagi tanpa menghitung jatah baru.
                if (raceLive() && wornId('outfit') === 'outfit-5') {
                    var nq = matchQuestions[currentQuestionIdx], nk = currentQuestionIdx + ':' + nq.id;
                    if (nq.level === 'hard') {
                        if (navKey === nk) strikeActiveWrong();
                        else if (navUsed < NAV_MAX && strikeActiveWrong()) {
                            navUsed++; navKey = nk;
                            toast('Baju Navigator mencoret 1 pilihan salah (' + navUsed + '/' + NAV_MAX + ')');
                        }
                    }
                }
                // Kapal Lumba-Lumba (sonar; single & multiplayer): soal sedang & sulit -> 1 pilihan salah dicoret.
                // Tombol dibuat ulang tiap soal dimuat, jadi tidak perlu jatah; selalu menyisakan minimal satu pilihan salah.
                if (wornId('ship') === 'ship-7' && raceLive()) {
                    var sl = matchQuestions[currentQuestionIdx].level;
                    if (sl === 'medium' || sl === 'hard') strikeActiveWrong();
                }
            } catch (e) { }
            return out;
        };
    }

    // ---- Kompas Antik (single) & Kapal Gurita (single + multiplayer): waktu habis -> tambahan waktu ----
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
                if (inkLeft > 0 && wornId('ship') === 'ship-9' && raceLive() && !isAnsweringLocked) {
                    inkLeft--;
                    startQuestionTimer(INK_SEC * 1000);
                    toast('Tinta Gurita! +' + INK_SEC + ' detik (sisa ' + inkLeft + 'x)');
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
            } else if (ship === 'ship-8') {
                sharkCount++;                               // dibayar di akhir (mp:final) supaya tidak masuk skor papan peringkat
                notes.push('Hiu lapar! +' + SHARK_COINS + ' koin di akhir');
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
        var pw = wornId('pants');
        if (pw === 'pants-1') xp += PANTS_XP;
        if (pw === 'pants-4' && GameState.hp <= STORM_HP) xp += STORM_XP;
        var coins = (COIN_SOLO[wornId('shoes')] || 0);
        if (pw === 'pants-2' && matchQuestions[currentQuestionIdx].level === 'hard') coins += CARGO_COINS;
        if (worn('pet', 'pet-2') && (streakCount + 1) % STREAK_EVERY === 0) coins += STREAK_COINS;
        if (wornId('ship') === 'ship-8') coins += SHARK_COINS;   // Kapal Hiu (kapal dua mode)
        if (xp > 0) { GameState.xp += xp; soloXp += xp; notes.push('+' + xp + ' XP'); }
        if (coins > 0) {
            GameState.coins += coins; soloCoins += coins;
            matchStartCoins += coins;                       // bonus tidak ikut dihitung sebagai skor papan peringkat
            notes.push('+' + coins + ' koin');
        }
        return notes;
    }

    // Baju Koki & Seragam Wakil Kapten (single & multiplayer). Dihitung sebelum logika asli, jadi streakCount masih nilai SEBELUM jawaban ini.
    function outfitAnswer(ok) {
        var notes = [];
        if (!ok || !raceLive()) return notes;
        var o = wornId('outfit');
        if (o === 'outfit-3') {
            cookCorrect++;
            if (cookCorrect % COOK_EVERY === 0) notes.push('Bekal Koki siap! +' + COOK_COINS + ' koin di akhir');
        } else if (o === 'outfit-4' && (streakCount + 1) >= CMD_STREAK) {
            GameState.xp += CMD_XP; cmdXp += CMD_XP;
            notes.push('Komando! +' + CMD_XP + ' XP');
        }
        return notes;
    }

    // Tiga topi baru. Dihitung sebelum logika asli (seperti outfitAnswer); raceLive() menjamin ada soal yang benar-benar dikerjakan.
    //   hat-3 Topi Koki      : HANYA multiplayer, +3 XP tiap jawaban benar (XP tidak masuk skor).
    //   hat-5 Topi Navigator : single & multiplayer, +3 koin tiap jawaban benar di soal sulit.
    //                          Single: langsung + menggeser matchStartCoins (seperti Kapal Hiu). Multiplayer: dibayar di mp:final.
    //   hat-4 Topi Wakil Kapten tidak butuh hitungan per jawaban: bonus peringkat dibayar di mp:final.
    function hatAnswer(ok) {
        var notes = [];
        if (!ok || !raceLive()) return notes;
        var h = wornId('hat'), R = mpRace();
        if (h === 'hat-3' && R) {
            GameState.xp += HAT_XP; hatXp += HAT_XP;
            notes.push('Sup Bergizi! +' + HAT_XP + ' XP');
        } else if (h === 'hat-5' && matchQuestions[currentQuestionIdx].level === 'hard') {
            if (R) {
                hatHard++;                                  // dibayar di akhir supaya tidak masuk skor papan peringkat
                notes.push('Peta Bintang! +' + HAT_HARD_COINS + ' koin di akhir');
            } else {
                GameState.coins += HAT_HARD_COINS; soloCoins += HAT_HARD_COINS;
                matchStartCoins += HAT_HARD_COINS;          // bonus tidak ikut dihitung sebagai skor papan peringkat
                notes.push('Peta Bintang! +' + HAT_HARD_COINS + ' koin');
            }
        }
        return notes;
    }

    var origAnswer = window.handleAnswer;
    if (typeof origAnswer === 'function') {
        window.handleAnswer = function (isCorrect) {
            var notes = [];
            try { notes = beforeAnswer(!!isCorrect); } catch (e) { }
            try { notes = notes.concat(outfitAnswer(!!isCorrect)); } catch (e) { }
            try { notes = notes.concat(hatAnswer(!!isCorrect)); } catch (e) { }
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
                    if (wornId('pants') === 'pants-5' && currentMatchWrong === 0) {   // Celana Kapten Emas: dibayar sesudah skor terkirim
                        GameState.coins += GOLD_CLEAN;
                        saveGameState();
                        appendText('vic-coins', ' (+' + GOLD_CLEAN + ' Celana)');
                    }
                    if (wornId('outfit') === 'outfit-3') {          // Baju Koki: dibayar sesudah skor terkirim di showVictory asli
                        var cb = cookBonus();
                        if (cb > 0) {
                            GameState.coins += cb;
                            saveGameState();
                            appendText('vic-coins', ' (+' + cb + ' Koki)');
                        }
                    }
                    if (soloCoins > 0) appendText('vic-coins', ' (+' + soloCoins + ' item)');
                    if (soloXp > 0) appendText('vic-xp', ' (+' + soloXp + ' item)');
                    if (cmdXp > 0) appendText('vic-xp', ' (+' + cmdXp + ' Komando)');
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
            var shark = sharkCount; sharkCount = 0;
            if (d.why !== 'complete') return;               // keluar / nyawa habis: tanpa bonus kapal
            var ship = wornId('ship'), bonus = 0, label = '';
            if (ship === 'ship-2') { bonus = GOLD_COINS; label = 'Kapal Emas'; }
            else if (ship === 'ship-5' && fast > 0) { bonus = fast * FAST_COINS; label = 'Speedboat'; }
            else if (ship === 'ship-8' && shark > 0) { bonus = shark * SHARK_COINS; label = 'Kapal Hiu'; }
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

    // ---- akhir balapan MULTIPLAYER: Seragam Wakil Kapten & Baju Koki (listener terpisah; berjalan sesudah listener kapal di atas) ----
    window.addEventListener('mp:final', function (ev) {
        try {
            var d = (ev && ev.detail) || {};
            var xp = cmdXp; cmdXp = 0;
            var lines = [];
            if (xp > 0) lines.push('Komando Wakil Kapten: +' + xp + ' XP');
            if (d.why === 'complete' && wornId('outfit') === 'outfit-3') {   // keluar / nyawa habis: tanpa bonus koin
                var b = cookBonus();
                if (b > 0) {
                    GameState.coins += b;
                    saveGameState();
                    lines.push('Bekal Koki: +' + b + ' koin');
                }
            }
            if (!lines.length) return;
            var rw = document.getElementById('mp-res-reward');
            if (!rw) return;
            var old = document.getElementById('fx-mp-outfit'); if (old) old.remove();
            var line = document.createElement('div'); line.id = 'fx-mp-outfit'; line.className = 'mp-reward';
            line.textContent = lines.join(' • ');
            (document.getElementById('fx-mp-bonus') || rw).insertAdjacentElement('afterend', line);
        } catch (e) { }
    });

    // ---- akhir balapan MULTIPLAYER: tiga topi baru (listener terpisah; berjalan sesudah listener kapal & baju di atas) ----
    // Bonus koin dibayar sesudah hadiah peringkat dan skor papan peringkat terkirim, jadi tidak ikut skor.
    window.addEventListener('mp:final', function (ev) {
        try {
            var d = (ev && ev.detail) || {};
            var xp = hatXp; hatXp = 0;
            var hard = hatHard; hatHard = 0;
            var lines = [];
            if (xp > 0) lines.push('Sup Bergizi Topi Koki: +' + xp + ' XP');
            if (d.why === 'complete') {                     // keluar / nyawa habis: tanpa bonus koin
                var hat = wornId('hat'), coins = 0;
                if (hat === 'hat-4' && d.rank >= 1 && d.rank <= 2) {
                    coins += HAT_RANK_COINS;
                    lines.push('Wibawa Wakil Kapten: +' + HAT_RANK_COINS + ' koin');
                }
                if (hat === 'hat-5' && hard > 0) {
                    coins += hard * HAT_HARD_COINS;
                    lines.push('Peta Bintang Navigator: +' + (hard * HAT_HARD_COINS) + ' koin');
                }
                if (coins > 0) { GameState.coins += coins; saveGameState(); }
            }
            if (!lines.length) return;
            var rw = document.getElementById('mp-res-reward');
            if (!rw) return;
            var old = document.getElementById('fx-mp-hat'); if (old) old.remove();
            var line = document.createElement('div'); line.id = 'fx-mp-hat'; line.className = 'mp-reward';
            line.textContent = lines.join(' • ');
            (document.getElementById('fx-mp-outfit') || document.getElementById('fx-mp-bonus') || rw).insertAdjacentElement('afterend', line);
        } catch (e) { }
    });
})();

} catch (e) { console.warn('Efek item dimatikan:', e); }

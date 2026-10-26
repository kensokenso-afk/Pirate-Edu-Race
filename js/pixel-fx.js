/* js/pixel-fx.js (efek Peti Harta & Meriam Kapal) — bagian dari upgrade grafis pixel (milik Claude; lihat docs/PEMBAGIAN-TUGAS-PIXEL.md).
   Dimuat SETELAH game.js dan multiplayer.js. Logika game tidak diubah; bila skrip ini gagal, tampilan emoji lama tetap jalan. */
try {
/* EFEK ITEM FURNITURE (hanya mode single player; hanya satu furniture dipakai pada satu waktu)
   - Peti Harta  (furn-1): +25 koin bonus setiap menang. Ditambahkan SETELAH skor papan peringkat dikirim,
                           jadi tidak menaikkan skor leaderboard.
   - Meriam Kapal (furn-2): tameng 1x per balapan; jawaban salah pertama tidak mengurangi nyawa.
   Fungsi game dibungkus (pola yang sama dengan modul multiplayer); logika asli tidak diubah. */
(function () {
    'use strict';
    var CHEST_BONUS = 25;
    var shield = true;

    function equipped() { try { return GameState.equipped && GameState.equipped['furniture']; } catch (e) { return null; } }
    function inMultiplayer() { try { return !!(window.MP && window.MP._state && window.MP._state.race); } catch (e) { return false; } }

    var toastEl = null, toastTimer = 0;
    function toast(text) {
        try {
            if (!toastEl) {
                toastEl = document.createElement('div'); toastEl.id = 'fx-toast';
                (document.getElementById('game-container') || document.body).appendChild(toastEl);
            }
            toastEl.textContent = text; toastEl.classList.add('show');
            clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
        } catch (e) { }
    }

    // reset tameng setiap balapan dimulai
    var origLaunch = window.launchRaceGame;
    if (typeof origLaunch === 'function') {
        window.launchRaceGame = function () {
            shield = true;
            return origLaunch.apply(this, arguments);
        };
    }

    // Meriam: nyawa ditambah 1 SEBELUM jawaban salah diproses, sehingga pengurangan 1 nyawa oleh game asli impas
    var origAnswer = window.handleAnswer;
    if (typeof origAnswer === 'function') {
        window.handleAnswer = function (isCorrect) {
            try {
                if (!isCorrect && shield && equipped() === 'furn-2' && !inMultiplayer() && !matchEnded && matchQuestions[currentQuestionIdx]) {
                    shield = false;
                    GameState.hp++;
                    toast('Meriam menahan serangan! Nyawa aman');
                }
            } catch (e) { }
            return origAnswer.apply(this, arguments);
        };
    }

    // Peti: bonus koin setelah kemenangan single player
    var origVictory = window.showVictory;
    if (typeof origVictory === 'function') {
        window.showVictory = function () {
            var was = false;
            try { was = !!matchEnded; } catch (e) { }
            var out = origVictory.apply(this, arguments);
            try {
                if (!was && matchEnded && !inMultiplayer() && equipped() === 'furn-1') {
                    GameState.coins += CHEST_BONUS;
                    saveGameState();
                    var el = document.getElementById('vic-coins');
                    if (el) el.textContent += ' (+' + CHEST_BONUS + ' Peti)';
                }
            } catch (e) { }
            return out;
        };
    }
})();

} catch (e) { console.warn('Efek furniture dimatikan:', e); }

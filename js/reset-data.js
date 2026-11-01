/* js/reset-data.js — tombol "RESET SEMUA DATA" di layar Pengaturan.
   Menghapus semua progres permainan di perangkat ini, tetapi akun login TETAP masuk.
   Dimuat SETELAH game.js (lihat <script> di index.html). Isi game.js tidak diubah: skrip ini hanya mengganti
   confirmResetData. Bila skrip ini gagal, tombol reset bawaan di game.js tetap jalan.
   Yang dihapus  : semua kunci localStorage berawalan "pirate_" dan "pirate-edurace" (progres, item, pengaturan,
                   antrean skor yang belum terkirim, catatan larangan multiplayer).
   Yang dipertahankan: token login (pirate-edurace-acct), penanda klaim skor lama (pirate-edurace-lbclaim-*),
                   dan pengenal papan global (pirate_pid; backend belum punya fitur hapus, jadi dihapus = entri ganda).
   Tidak menyentuh data aplikasi lain di origin yang sama. */
try {
(function () {
    'use strict';

    var ACCT_KEY = 'pirate-edurace-acct';          // token login (js/account.js)
    var PID_KEY = 'pirate_pid';                    // pengenal pemain di papan global
    var CLAIM_PREFIX = 'pirate-edurace-lbclaim-';  // penanda skor lama sudah dipindah ke akun

    function isGameKey(k) { return k.indexOf('pirate_') === 0 || k.indexOf('pirate-edurace') === 0; }
    function keepOnReset(k) { return k === PID_KEY || k === ACCT_KEY || k.indexOf(CLAIM_PREFIX) === 0; }

    function confirmReset() {
        try { if (typeof playSound === 'function') playSound('click'); } catch (e) { }
        showConfirm('RESET SEMUA DATA',
            'Semua progres (koin, XP, level, item, statistik) di perangkat ini akan dihapus. Akunmu tetap masuk. Tindakan ini tidak bisa dibatalkan.',
            function () {
                try {
                    var rm = [];
                    for (var i = 0; i < localStorage.length; i++) {
                        var k = localStorage.key(i);
                        if (k && isGameKey(k) && !keepOnReset(k)) rm.push(k);
                    }
                    rm.forEach(function (k) { localStorage.removeItem(k); });
                } catch (e) { console.warn('Gagal mereset localStorage:', e); }
                location.reload();
            });
    }

    // Keterangan singkat di bawah tombol agar jelas bahwa akun tidak ikut terhapus
    function addHint() {
        var btn = document.querySelector('#screen-settings button[onclick="confirmResetData()"]');
        if (!btn || document.getElementById('reset-hint')) return;
        var p = document.createElement('p');
        p.id = 'reset-hint';
        p.className = 'text-[8px] leading-relaxed text-gray-700';
        p.textContent = 'Hapus semua progres game di perangkat ini. Akun tetap masuk.';
        btn.insertAdjacentElement('afterend', p);
    }

    window.confirmResetData = confirmReset;   // tombol lama (onclick="confirmResetData()") kini memakai perilaku baru
    addHint();
})();
} catch (e) { console.warn('Reset data baru dimatikan, memakai reset bawaan:', e); }

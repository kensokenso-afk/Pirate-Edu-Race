/* js/reset-data.js — tombol "RESET SEMUA DATA" dan "HAPUS AKUN" di layar Pengaturan. */
try {
(function () {
    'use strict';

    var ACCT_KEY = 'pirate-edurace-acct';          // token login (js/account.js)
    var PID_KEY = 'pirate_pid';                    // pengenal pemain di papan global
    var CLAIM_PREFIX = 'pirate-edurace-lbclaim-';  // penanda skor lama sudah dipindah ke akun
    var busy = false;

    function click() { try { if (typeof playSound === 'function') playSound('click'); } catch (e) { } }
    function el(id) { return document.getElementById(id); }
    function isGameKey(k) { return k.indexOf('pirate_') === 0 || k.indexOf('pirate-edurace') === 0; }
    function keepOnReset(k) { return k === PID_KEY || k === ACCT_KEY || k.indexOf(CLAIM_PREFIX) === 0; }

    // Hapus kunci milik game ini kecuali yang dibolehkan keep(k). Tidak menyentuh data aplikasi lain.
    function wipe(keep) {
        try {
            var rm = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && isGameKey(k) && !keep(k)) rm.push(k);
            }
            rm.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) { console.warn('Gagal menghapus data lokal:', e); }
    }

    /* ---------- RESET SEMUA DATA (akun tetap masuk) ---------- */
    function confirmReset() {
        click();
        showConfirm('RESET SEMUA DATA',
            'Semua progres (koin, XP, level, item, statistik) di perangkat ini akan dihapus. Akunmu tetap masuk. Tindakan ini tidak bisa dibatalkan.',
            function () {
                wipe(keepOnReset);
                location.reload();
            });
    }

    /* ---------- HAPUS AKUN (akun + skor di server + semua data lokal) ---------- */
    function loggedIn() { return !!(window.PirateAcct && typeof PirateAcct.valid === 'function' && PirateAcct.valid()); }
    function accountToken() { try { return localStorage.getItem(ACCT_KEY); } catch (e) { return null; } }
    function deleteUrl() {
        try {
            if (typeof LB_API_BASE === 'string') return LB_API_BASE.replace(/\/leaderboard\/?$/, '/account') + '/api/account/delete';
        } catch (e) { }
        return null;
    }
    // Hasil: { ok, status }. status 0 = jaringan bermasalah. Server: 200 ok | 401 sesi tidak sah | 403 kata sandi salah | 429 terlalu sering.
    function postDelete(tok, password) {
        var url = deleteUrl();
        if (!url) return Promise.resolve({ ok: false, status: 0 });
        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
        return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tok: tok, password: password }), cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
            .then(function (res) {
                return res.json().catch(function () { return null; }).then(function (d) {
                    return { ok: !!(res.ok && d && d.ok), status: res.status };
                });
            })
            .catch(function () { return { ok: false, status: 0 }; })
            .then(function (r) { clearTimeout(timer); return r; });
    }

    function setMsg(text) { var m = el('del-acct-msg'); if (m) m.textContent = text || ''; }
    function setBusy(on) {
        busy = on;
        var b = el('del-acct-yes');
        if (b) { b.disabled = on; b.textContent = on ? 'MENGHAPUS...' : 'HAPUS'; }
    }
    function closeDelete() {
        if (busy) return;
        click();
        var m = el('modal-delete-account');
        if (m) m.classList.remove('active');
        var p = el('del-acct-pass'); if (p) p.value = '';
        setMsg('');
    }
    function openDelete() {
        click();
        if (!loggedIn()) {
            showAlert('TIDAK ADA AKUN', 'Kamu belum masuk akun. Untuk menghapus progres di perangkat ini, pakai RESET SEMUA DATA.');
            return;
        }
        var name = '';
        try { name = PirateAcct.username() || ''; } catch (e) { }
        el('del-acct-text').textContent = 'Akun' + (name ? ' "' + name + '"' : '') +
            ', skornya di papan global, dan semua data di perangkat ini akan dihapus. Tidak bisa dikembalikan. Isi kata sandi akunmu untuk melanjutkan.';
        el('del-acct-pass').value = '';
        setMsg('');
        el('modal-delete-account').classList.add('active');
        setTimeout(function () { try { el('del-acct-pass').focus(); } catch (e) { } }, 60);
    }
    function submitDelete() {
        if (busy) return;
        var pw = el('del-acct-pass').value;
        if (!pw) { setMsg('Isi kata sandi akunmu.'); return; }
        var tok = accountToken();
        if (!tok || !loggedIn()) { setMsg('Sesi akun habis. Masuk lagi, lalu coba hapus akun lagi.'); return; }
        click();
        setBusy(true); setMsg('');
        postDelete(tok, pw).then(function (r) {
            setBusy(false);
            if (r.ok) {
                wipe(function () { return false; });   // hapus SEMUA, termasuk token login dan pengenal papan global
                location.reload();
                return;
            }
            el('del-acct-pass').value = '';
            if (r.status === 403) setMsg('Kata sandi salah.');
            else if (r.status === 429) setMsg('Terlalu banyak percobaan. Coba lagi beberapa menit lagi.');
            else if (r.status === 401) setMsg('Sesi akun habis. Masuk lagi, lalu coba hapus akun lagi.');
            else if (r.status === 0) setMsg('Tidak bisa terhubung ke server. Periksa koneksi internetmu. Datamu belum dihapus.');
            else setMsg('Gagal menghapus akun (kode ' + r.status + '). Datamu belum dihapus.');
        });
    }

    /* ---------- tampilan ---------- */
    function hint(text, id) {
        var p = document.createElement('p');
        if (id) p.id = id;
        p.className = 'text-[8px] leading-relaxed text-gray-700';
        p.textContent = text;
        return p;
    }
    function buildModal() {
        if (el('modal-delete-account')) return;
        var m = document.createElement('div');
        m.id = 'modal-delete-account';
        m.className = 'modal-overlay';
        m.innerHTML =
            '<div class="pixel-box-parchment p-4 max-w-xs w-full flex flex-col gap-3 text-center">' +
            '<h3 class="text-xs font-bold text-red-600">HAPUS AKUN?</h3>' +
            '<p id="del-acct-text" class="text-[8px] leading-relaxed"></p>' +
            '<input id="del-acct-pass" type="password" class="pixel-input text-[10px]" maxlength="64" placeholder="Kata sandi" autocomplete="current-password" style="text-align:left" />' +
            '<div id="del-acct-msg" class="text-[8px] leading-relaxed text-red-600" style="min-height:22px"></div>' +
            '<div class="flex gap-2 w-full">' +
            '<button id="del-acct-yes" type="button" class="pixel-btn bg-red-600 text-white text-[8px] py-1.5 flex-grow">HAPUS</button>' +
            '<button id="del-acct-no" type="button" class="pixel-btn text-[8px] py-1.5 flex-grow">BATAL</button>' +
            '</div></div>';
        (el('game-container') || document.body).appendChild(m);
        el('del-acct-yes').addEventListener('click', submitDelete);
        el('del-acct-no').addEventListener('click', closeDelete);
        el('del-acct-pass').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submitDelete(); });
    }
    function addUi() {
        var resetBtn = document.querySelector('#screen-settings button[onclick="confirmResetData()"]');
        if (!resetBtn || el('reset-hint')) return;
        var h1 = hint('Hapus semua progres game di perangkat ini. Akun tetap masuk.', 'reset-hint');
        var del = document.createElement('button');
        del.id = 'btn-delete-account'; del.type = 'button';
        del.className = 'pixel-btn bg-red-600 text-white py-2 text-[8px] mt-2';
        del.textContent = 'HAPUS AKUN';
        del.addEventListener('click', openDelete);
        var h2 = hint('Hapus akun, skornya di papan global, dan semua data. Tidak bisa dikembalikan.');
        resetBtn.insertAdjacentElement('afterend', h1);
        h1.insertAdjacentElement('afterend', del);
        del.insertAdjacentElement('afterend', h2);
        buildModal();
    }

    window.confirmResetData = confirmReset;   // tombol lama (onclick="confirmResetData()") kini memakai perilaku baru
    addUi();
})();
} catch (e) { console.warn('Reset data baru dimatikan, memakai reset bawaan:', e); }

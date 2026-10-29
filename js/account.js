/* =====================================================================
   PIRATE EDU-RACE — js/account.js
   Sistem akun + leaderboard terikat akun (berkas baru; tidak mengubah logika game yang ada)
   ---------------------------------------------------------------------
   Dimuat otomatis oleh js/multiplayer.js (bagian "AKUN") setelah game.js & multiplayer.js siap.
   Kalau berkas ini gagal dimuat, game tetap jalan seperti sebelumnya (tanpa akun).

   1) AKUN
      • Daftar / masuk dengan nama akun + kata sandi lewat Edge Function "account" (Supabase).
      • Server memberi TOKEN SESI bertanda tangan ECDSA (berlaku 30 hari). Token ini RAHASIA:
        hanya dikirim ke server lewat HTTPS, tidak pernah ke topik room multiplayer yang publik.
      • Untuk bergabung ke room, token ditukar dengan TIKET MASUK ROOM (5 menit, terikat ke ID sesi game
        dan kode room). Host memeriksa tanda tangannya dengan kunci publik di bawah (verifyPass).

   2) LEADERBOARD TERIKAT AKUN
      • Setiap pertandingan yang dimulai saat sudah masuk akun meminta TIKET ke server (sekali pakai).
      • Skor dikirim bersama tiket + statistik; server menolak skor yang tidak cocok dengan aturan koin,
        tiket orang lain / yang sudah dipakai, dan pertandingan yang terlalu singkat.
      • Antrean skor menyimpan pemilik tiap skor; akun hanya mengirim skornya sendiri.
      • Skor lama atas ID perangkat (pirate_pid) dipindahkan ke akun satu kali setelah login (/api/claim).

   Cara kerja: dibuat sebagai pembungkus fungsi global game.js (lbPid, lbFetchJson, renderLeaderboard,
   launchRaceGame, submitGlobalScore, lbFlushPending) — isi fungsi aslinya tidak diubah.
   ===================================================================== */
(function () {
    'use strict';

    // Kunci publik penanda tangan token (JWK, bukan rahasia). Kalau kunci server diganti, ganti nilai ini.
    var ACCT_PUB = { kty: 'EC', crv: 'P-256', x: 'WiSXpf8lvTDBWzsiLJwAfuToNhLR8JVNzePdreEv4g0', y: 'kkAvv42937TBUmP8ihI2R52dDYrpZ6GRyUPUVnR4cGY' };
    var ACCT_LS = 'pirate-edurace-acct';          // token sesi
    var SQ_LS = 'pirate-edurace-scoreq';          // antrean skor milik akun
    var ID_RE = /^[a-z0-9]{8}$/;
    var ROOM_RE = /^[A-Z2-9]{5}$/;

    var ACCT = { tok: null, pid: null, usr: null, exp: 0, mode: 'login', busy: false, after: null, key: null };
    var LBW = null;                                // fungsi asli game.js yang dibungkus

    function $(id) { return document.getElementById(id); }
    function now() { return Date.now(); }
    function el(tag, attrs, html) {
        var e = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        if (html != null) e.innerHTML = html;
        return e;
    }
    function api() {
        try { if (typeof LB_API_BASE === 'string') return LB_API_BASE.replace(/\/leaderboard\/?$/, '/account'); } catch (e) {}
        return null;
    }

    /* ---------- token ---------- */
    function b64uToBytes(s) {
        s = String(s).replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        var bin = atob(s), out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }
    function parseToken(tok) {                     // membaca isi token (TIDAK memeriksa tanda tangan)
        try {
            var p = JSON.parse(new TextDecoder().decode(b64uToBytes(String(tok).split('.')[0])));
            if (p && typeof p.pid === 'string' && ID_RE.test(p.pid) && typeof p.usr === 'string' && isFinite(p.exp)) return p;
        } catch (e) {}
        return null;
    }
    function valid() { return !!(ACCT.tok && ACCT.pid && ACCT.exp * 1000 > now() + 60000); }
    function store(tok) {
        var p = parseToken(tok);
        if (!p || p.t !== undefined) return false;
        ACCT.tok = tok; ACCT.pid = p.pid; ACCT.usr = p.usr; ACCT.exp = Number(p.exp);
        try { localStorage.setItem(ACCT_LS, tok); } catch (e) {}
        return true;
    }
    function clear() {
        ACCT.tok = null; ACCT.pid = null; ACCT.usr = null; ACCT.exp = 0;
        try { localStorage.removeItem(ACCT_LS); } catch (e) {}
    }
    function load() {
        try { var tok = localStorage.getItem(ACCT_LS); if (tok && (!store(tok) || !valid())) clear(); } catch (e) {}
    }
    function importKey() {
        if (!ACCT.key) ACCT.key = crypto.subtle.importKey('jwk', ACCT_PUB, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
        return ACCT.key;
    }
    // Memeriksa tanda tangan + isi sebuah token. Mengembalikan payload atau null.
    function verifySigned(tok) {
        if (typeof tok !== 'string' || tok.length > 700 || !window.crypto || !crypto.subtle) return Promise.resolve(null);
        var parts = tok.split('.');
        if (parts.length !== 2) return Promise.resolve(null);
        return importKey().then(function (key) {
            return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uToBytes(parts[1]), new TextEncoder().encode(parts[0]));
        }).then(function (ok) { return ok ? parseToken(tok) : null; }).catch(function () { return null; });
    }
    // HOST: periksa tiket masuk room. Mengembalikan ID akun (pid) atau null.
    function verifyPass(pass, sid, code) {
        return verifySigned(pass).then(function (p) {
            if (!p || p.t !== 'room' || p.sid !== sid || p.rc !== code || !(p.exp * 1000 > now())) return null;
            return p.pid;
        });
    }
    // PEMAIN: tukar token sesi dengan tiket masuk room. Mengembalikan {pass} atau {error:'login'|'network'|'server'}.
    function roomPass(sid, code) {
        if (!valid() || !ROOM_RE.test(String(code)) || !ID_RE.test(String(sid))) return Promise.resolve({ error: 'login' });
        return post('/api/account/pass', { tok: ACCT.tok, sid: sid, rc: code }).then(function (r) {
            if (r.status === 401) { clear(); return { error: 'login' }; }
            if (r.ok && r.data && typeof r.data.pass === 'string') return { pass: r.data.pass };
            return { error: r.data && r.data.error === 'network' ? 'network' : 'server' };
        });
    }

    function post(path, body) {
        var base = api();
        if (!base) return Promise.resolve({ ok: false, status: 0, data: { error: 'network' } });
        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
        return fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                                    cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
            .then(function (res) {
                return res.json().catch(function () { return null; }).then(function (data) {
                    return { ok: !!(res.ok && data && data.ok), status: res.status, data: data || {} };
                });
            })
            .catch(function () { return { ok: false, status: 0, data: { error: 'network' } }; })
            .then(function (r) { clearTimeout(timer); return r; });
    }

    /* ---------- antarmuka (disisipkan lewat JS; index.html tidak diubah) ---------- */
    var CSS = '' +
        '.mp-acct-strip{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:5px 6px;font-size:8px;color:#3e2723;background:#fff8d6;border:2px solid #8d6e00;margin-bottom:6px}' +
        '.mp-acct-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:bold}' +
        '.acct-msg{min-height:26px;font-size:8px;line-height:1.6;text-align:center;color:#c62828}' +
        '.acct-msg.ok{color:#2e7d32}' +
        '#modal-account .pixel-input{text-align:left;font-size:10px;padding:8px}';
    var MODAL_HTML = '' +
        '<div class="pixel-box-parchment p-4 max-w-xs w-full flex flex-col gap-3">' +
        '<h3 class="text-xs font-bold text-center" style="color:#3e2723;">⚓ AKUN PEMAIN</h3>' +
        '<div class="flex gap-2">' +
        '<button id="acct-tab-login" type="button" class="pixel-btn pixel-btn-action text-[8px] py-1.5 flex-grow">MASUK</button>' +
        '<button id="acct-tab-register" type="button" class="pixel-btn text-[8px] py-1.5 flex-grow">DAFTAR</button></div>' +
        '<input id="acct-user" type="text" class="pixel-input" maxlength="16" placeholder="Nama akun" autocomplete="username" autocapitalize="none" spellcheck="false" />' +
        '<input id="acct-pass" type="password" class="pixel-input" maxlength="64" placeholder="Kata sandi" autocomplete="current-password" />' +
        '<div id="acct-msg" class="acct-msg"></div>' +
        '<div class="flex gap-2 w-full">' +
        '<button id="acct-submit" type="button" class="pixel-btn pixel-btn-action text-[8px] py-1.5 flex-grow">MASUK</button>' +
        '<button id="acct-cancel" type="button" class="pixel-btn text-[8px] py-1.5 flex-grow">BATAL</button></div></div>';

    function buildUi() {
        if ($('modal-account')) return;
        var st = el('style', { id: 'account-css' }); st.textContent = CSS; document.head.appendChild(st);

        var modal = el('div', { id: 'modal-account', 'class': 'modal-overlay' }, MODAL_HTML);
        var anchor = $('modal-confirm') || $('modal-alert');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(modal, anchor.nextSibling); else document.body.appendChild(modal);
        $('acct-tab-login').addEventListener('click', function () { tab('login'); });
        $('acct-tab-register').addEventListener('click', function () { tab('register'); });
        $('acct-submit').addEventListener('click', submit);
        $('acct-cancel').addEventListener('click', cancel);
        ['acct-user', 'acct-pass'].forEach(function (id) {
            $(id).addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submit(); });
        });

        // Strip akun di lobi multiplayer
        var lobby = document.querySelector('#screen-mp-lobby .mp-panel');
        if (lobby) {
            var s1 = el('div', { id: 'mp-acct-strip', 'class': 'mp-acct-strip' },
                '<span id="mp-acct-name" class="mp-acct-name"></span><button id="mp-acct-logout" type="button" class="pixel-btn mp-btn-xs">KELUAR AKUN</button>');
            lobby.insertBefore(s1, lobby.firstChild);
            $('mp-acct-logout').addEventListener('click', logout);
        }
        // Strip akun di layar leaderboard
        var status = $('leaderboard-status');
        if (status && status.parentNode) {
            var s2 = el('div', { id: 'lb-acct-strip', 'class': 'mp-acct-strip' },
                '<span id="lb-acct-text" class="mp-acct-name" style="white-space:normal;line-height:1.5;"></span><button id="lb-acct-btn" type="button" class="pixel-btn mp-btn-xs">MASUK</button>');
            status.parentNode.insertBefore(s2, status);
            $('lb-acct-btn').addEventListener('click', function () { if (typeof playSound === 'function') playSound('click'); open(null, null); });
        }
        // Catatan status pengiriman skor di layar kemenangan
        var vbtn = document.querySelector('#screen-victory button[onclick*="launchRaceGame"]');
        if (vbtn && vbtn.parentNode && vbtn.parentNode.parentNode) {
            var note = el('div', { id: 'vic-lb-note', 'class': 'text-[7px] text-center leading-relaxed' });
            note.style.minHeight = '10px';
            vbtn.parentNode.parentNode.insertBefore(note, vbtn.parentNode);
        }
    }

    function msg(text, ok) { var e = $('acct-msg'); if (!e) return; e.textContent = text || ''; e.className = 'acct-msg' + (ok ? ' ok' : ''); }
    function tab(mode) {
        ACCT.mode = mode === 'register' ? 'register' : 'login';
        var reg = ACCT.mode === 'register';
        $('acct-tab-login').className = 'pixel-btn text-[8px] py-1.5 flex-grow' + (reg ? '' : ' pixel-btn-action');
        $('acct-tab-register').className = 'pixel-btn text-[8px] py-1.5 flex-grow' + (reg ? ' pixel-btn-action' : '');
        $('acct-submit').textContent = reg ? 'DAFTAR' : 'MASUK';
        $('acct-pass').setAttribute('autocomplete', reg ? 'new-password' : 'current-password');
        $('acct-pass').placeholder = reg ? 'Kata sandi (min. 6 karakter)' : 'Kata sandi';
        msg('');
    }
    function open(after, text) {
        buildUi();
        ACCT.after = typeof after === 'function' ? after : null;
        tab('login');
        $('acct-pass').value = '';
        if (text) msg(text, true);
        $('modal-account').classList.add('active');
        setTimeout(function () { try { $('acct-user').focus(); } catch (e) {} }, 60);
    }
    function closeModal() { var m = $('modal-account'); if (m) m.classList.remove('active'); }
    function cancel() { if (typeof playSound === 'function') playSound('click'); ACCT.after = null; closeModal(); }
    function submit() {
        if (ACCT.busy) return;
        var reg = ACCT.mode === 'register';
        var u = $('acct-user').value.trim(), pw = $('acct-pass').value;
        if (!/^[A-Za-z0-9_]{3,16}$/.test(u)) { msg('Nama akun harus 3-16 karakter: huruf, angka, atau garis bawah (_).'); return; }
        if (reg ? pw.length < 6 : pw.length < 1) { msg(reg ? 'Kata sandi minimal 6 karakter.' : 'Isi kata sandi.'); return; }
        if (typeof playSound === 'function') playSound('click');
        ACCT.busy = true; $('acct-submit').disabled = true; $('acct-submit').textContent = 'MEMPROSES...'; msg('');
        post(reg ? '/api/account/register' : '/api/account/login', { username: u, password: pw }).then(function (r) {
            ACCT.busy = false; $('acct-submit').disabled = false; $('acct-submit').textContent = reg ? 'DAFTAR' : 'MASUK';
            if (!r.ok || typeof r.data.token !== 'string') {
                msg(r.data.error === 'network' ? 'Tidak bisa terhubung ke server akun. Periksa koneksi internetmu.' : (r.data.message || 'Gagal memproses akun. Coba lagi.'));
                return;
            }
            return verifySigned(r.data.token).then(function (p) {
                if (!p || p.t !== undefined || p.pid !== r.data.pid || !store(r.data.token)) {
                    msg('Akun tidak bisa diverifikasi. Muat ulang game lalu coba lagi.');
                    return;
                }
                $('acct-pass').value = '';
                closeModal();
                afterLogin();                       // pindahkan skor lama ke akun & kirim skor yang menunggu
                var cb = ACCT.after; ACCT.after = null;
                if (cb) cb();
            });
        });
    }
    function renderLobbyStrip() { var e = $('mp-acct-name'); if (e) e.textContent = '👤 ' + (ACCT.usr || ''); }
    function logout() {
        if (typeof playSound === 'function') playSound('click');
        showConfirm('KELUAR AKUN?', 'Kamu harus masuk lagi untuk bermain multiplayer.', function () {
            clear();
            if (window.MP && typeof MP.backFromLobby === 'function') MP.backFromLobby();
        });
    }

    /* ---------- leaderboard terikat akun ---------- */
    var MATCH = { ticket: Promise.resolve(null) };         // janji berisi {id, mode, owner} atau null

    function sqLoad() { try { var a = JSON.parse(localStorage.getItem(SQ_LS) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
    function sqSave(a) { try { localStorage.setItem(SQ_LS, JSON.stringify(a.slice(-10))); } catch (e) {} }
    function lbPost(path, body) {                          // ke API leaderboard memakai lbFetchJson asli game.js
        return LBW.lbFetchJson(path, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(body) });
    }
    function lbNote(text) { var e = $('vic-lb-note'); if (e) e.textContent = text || ''; }
    function mpState() { return (window.MP && MP._state) || null; }
    function matchMode() {
        var S = mpState();
        return (S && S.room && S.race && S.view === 'race') ? 'multi' : 'single';
    }
    function matchRank(mode) {
        if (mode === 'multi') { var S = mpState(); return Math.min(Math.max(1, Number(S && S.race && S.race.rank) || 4), 4); }
        return Math.min(1 + botSteps.filter(function (b) { return b > playerSteps; }).length, 4);
    }

    var claiming = false;
    function claimLegacy() {
        if (!valid() || claiming) return Promise.resolve();
        var flag = 'pirate-edurace-lbclaim-' + ACCT.pid, done = false, lp = null;
        try { done = !!localStorage.getItem(flag); lp = localStorage.getItem('pirate_pid'); } catch (e) {}
        if (done) return Promise.resolve();
        if (!lp || !LB_PID_RE.test(lp) || lp === ACCT.pid) { try { localStorage.setItem(flag, '1'); } catch (e) {} return Promise.resolve(); }
        claiming = true;
        return lbPost('/api/claim', { tok: ACCT.tok, lpid: lp }).then(function (r) {
            r = r || { status: 0 };
            if (r.status === 200 || r.status === 400) { try { localStorage.setItem(flag, '1'); } catch (e) {} }   // gangguan jaringan/server: coba lagi nanti
            if (r.status === 401) clear();
        }).catch(function () {}).then(function () { claiming = false; });
    }
    function afterLogin() {
        return claimLegacy().then(function () { return window.lbFlushPending(); }).catch(function () {}).then(function () {
            var scr = $('screen-leaderboard');
            if (scr && scr.classList.contains('active') && typeof renderLeaderboard === 'function') renderLeaderboard();
        });
    }

    var flushing = false;
    function scoreFlush() {                                // kirim skor milik akun yang sedang masuk; hasilnya jumlah yang diterima
        if (flushing || !valid()) return Promise.resolve(0);
        flushing = true;
        var sent = 0;
        function step(guard) {
            if (guard >= 12) return Promise.resolve();
            var mine = ACCT.pid;
            var item = sqLoad().filter(function (x) { return x.owner === mine; })[0];
            if (!item) return Promise.resolve();
            return lbPost('/api/score', { tok: ACCT.tok, ticket: item.ticket, mode: item.mode, name: item.name, score: item.score, stats: item.stats })
                .then(function (r) {
                    r = r || { status: 0, data: {} };
                    if (r.status === 401) { clear(); lbNote('Sesi akun habis. Masuk lagi untuk mengirim skormu.'); return; }
                    if (!r.status || r.status >= 500 || r.status === 429) { lbNote('Skor akan dikirim saat koneksi kembali.'); return; }   // tanpa status = jaringan putus
                    sqSave(sqLoad().filter(function (x) { return x.ticket !== item.ticket; }));      // diterima atau ditolak aturan: jangan diulang
                    if (r.ok && r.data && Array.isArray(r.data.entries)) {
                        if (typeof lbCacheSet === 'function') lbCacheSet(item.mode, r.data.entries);
                        lbNote('🏆 Skor terkirim ke papan global.'); sent++;
                    } else {
                        lbNote('Skor tidak diterima server' + (r.data && r.data.error === 'too_fast' ? ' (pertandingan terlalu singkat).' : '.'));
                    }
                    return step(guard + 1);
                }, function () { lbNote('Skor akan dikirim saat koneksi kembali.'); });
        }
        return step(0).catch(function () {}).then(function () { flushing = false; return sent; });
    }

    function renderLbStrip() {
        var txt = $('lb-acct-text'), btn = $('lb-acct-btn'); if (!txt || !btn) return;
        if (valid()) { txt.textContent = '👤 ' + ACCT.usr + ' • skormu tercatat di papan global'; btn.style.display = 'none'; return; }
        txt.textContent = 'Masuk akun sebelum bermain agar skormu tercatat di papan global.';
        btn.style.display = '';
    }

    function installLeaderboardWrappers() {
        LBW = { lbPid: window.lbPid, lbFetchJson: window.lbFetchJson, renderLeaderboard: window.renderLeaderboard, launchRaceGame: window.launchRaceGame };
        if (typeof LBW.lbFetchJson !== 'function' || typeof LBW.launchRaceGame !== 'function') return false;   // game.js tidak cocok: jangan ubah apa pun

        window.lbPid = function () {                       // pemilik skor = ID akun; tamu memakai ID perangkat lama (hanya untuk penanda "Kamu")
            return valid() ? ACCT.pid : LBW.lbPid.apply(this, arguments);
        };
        window.lbFetchJson = function (path, options) {    // ganti nama selalu membawa token akun
            if (path === '/api/rename') {
                if (!valid()) return Promise.resolve({ ok: false, status: 503, data: { error: 'login' } });
                var body = {};
                try { body = JSON.parse((options && options.body) || '{}'); } catch (e) {}
                delete body.pid; body.tok = ACCT.tok;
                return LBW.lbFetchJson(path, Object.assign({}, options, { body: JSON.stringify(body) })).then(function (r) {
                    if (r.status === 401) { clear(); return { ok: false, status: 503, data: { error: 'login' } }; }
                    return r;
                });
            }
            return LBW.lbFetchJson.apply(this, arguments);
        };
        window.renderLeaderboard = function () { renderLbStrip(); return LBW.renderLeaderboard.apply(this, arguments); };

        window.launchRaceGame = function () {              // pertandingan baru (single, "main lagi", balapan multiplayer) -> minta tiket
            var out = LBW.launchRaceGame.apply(this, arguments);
            lbNote('');
            var mode = matchMode();
            if (!valid()) { MATCH.ticket = Promise.resolve(null); return out; }
            var owner = ACCT.pid, tok = ACCT.tok;
            MATCH.ticket = lbPost('/api/match/start', { mode: mode, tok: tok }).then(function (r) {
                if (r.status === 401) clear();
                return r && r.status === 200 && r.data && typeof r.data.ticket === 'string' ? { id: r.data.ticket, mode: mode, owner: owner } : null;
            }).catch(function () { return null; });
            return out;
        };

        window.submitGlobalScore = function (mode, score) {
            score = Math.floor(Number(score));
            if ((mode !== 'single' && mode !== 'multi') || !isFinite(score) || score < 1) return;
            if (!valid()) { lbNote('Masuk akun sebelum bermain agar skor tercatat di papan global.'); return; }
            var stats;
            try { stats = { c: currentMatchCorrect, w: currentMatchWrong, r: matchRank(mode), k: bestStreak }; }
            catch (e) { lbNote('Skor belum tercatat: statistik pertandingan tidak tersedia.'); return; }
            var name = getPlayerName();
            lbNote('Mengirim skor ke papan global...');
            Promise.resolve(MATCH.ticket).then(function (tk) {
                if (!tk || tk.mode !== mode || tk.owner !== ACCT.pid) { lbNote('Skor belum tercatat: tiket pertandingan tidak tersedia. Periksa koneksi lalu main lagi.'); return; }
                MATCH.ticket = Promise.resolve(null);       // satu tiket = satu pengiriman
                var q = sqLoad();
                q.push({ owner: tk.owner, mode: mode, name: name, score: score, ticket: tk.id, stats: stats });
                sqSave(q);
                return scoreFlush();
            });
        };
        window.lbFlushPending = scoreFlush;                 // dipanggil game saat online / game dibuka / papan dibuka
        try { localStorage.removeItem('pirate_lb_pending'); } catch (e) {}   // antrean versi lama (tanpa pemilik & tiket) tidak bisa dipercaya lagi
        return true;
    }

    /* ---------- init ---------- */
    load();
    var wrapped = installLeaderboardWrappers();
    function ready() { buildUi(); renderLbStrip(); renderLobbyStrip(); if (valid() && wrapped) setTimeout(afterLogin, 3000); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

    window.PirateAcct = {
        valid: valid,
        pid: function () { return ACCT.pid; },
        username: function () { return ACCT.usr; },
        open: open,
        verifyPass: verifyPass,
        roomPass: roomPass,
        renderLobbyStrip: renderLobbyStrip,
        leaderboardEnabled: wrapped
    };
})();

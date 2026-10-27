/* =====================================================================
   MULTIPLAYER (TAMBAHAN BARU) — room terbuka 2–4 pemain, slot kosong diisi bot
   ---------------------------------------------------------------------
   Cara kerja singkat
   • Transport : MQTT lewat WebSocket (broker publik gratis; tidak perlu server sendiri).
                 Library mqtt.js dimuat dari CDN hanya saat menu MULTIPLAYER dibuka.
   • Lobby     : host mengumumkan room-nya tiap beberapa detik -> muncul di daftar room terbuka.
                 Pemain lain bisa menekan GABUNG, atau mengetik kode room.
   • Room      : maks. 4 pemain manusia. Balapan baru bisa dimulai host saat >= 2 pemain.
                 Slot kosong otomatis diisi bot, jadi selalu ada 4 kapal di lintasan.
   • Balapan   : urutan 30 soal SAMA untuk semua (dikirim host). Tiap pemain menjawab dengan
                 kecepatannya sendiri; posisi kapal dikirim setiap kali menjawab. Bot dihitung
                 deterministik dari seed yang sama di semua perangkat (tanpa lalu lintas jaringan),
                 sehingga hasil akhir identik di semua pemain. Balapan tidak bergantung pada host.
   • Kode lama : TIDAK diubah. Fungsi lama hanya "dibungkus" (wrapper) saat balapan multiplayer
                 sedang berjalan; di luar itu semuanya bekerja persis seperti semula.
   ===================================================================== */
(function () {
'use strict';

/* ---------- Konfigurasi ---------- */
const CFG = {
    topicRoot: 'pirate-edurace/v1',
    // Broker publik gratis (WebSocket aman). Dicoba berurutan sampai ada yang berhasil.
    // Pemain terhubung ke SEMUA broker ini sekaligus (bukan hanya satu). Dua perangkat cukup punya
    // minimal satu broker yang sama untuk saling bertemu, sehingga tidak "terbelah" di server berbeda.
    brokers: [
        'wss://broker.emqx.io:8084/mqtt',
        'wss://broker.hivemq.com:8884/mqtt',
        'wss://broker-cn.emqx.io:8084/mqtt',   // pengganti mqtt.eclipseprojects.io (selalu timeout)
        'wss://test.mosquitto.org:8081'
    ],
    libUrls: [
        'https://cdn.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js',
        'https://unpkg.com/mqtt@5/dist/mqtt.min.js',
        'https://fastly.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js',
        'https://gcore.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js',
        'https://cdn.jsdelivr.net/npm/mqtt@4.3.7/dist/mqtt.min.js'
    ],
    retryBaseMs: 2000,       // jeda awal sambung ulang per broker (naik bertahap)
    retryMaxMs: 15000,
    libTimeoutMs: 6000,
    maxPlayers: 4,
    minPlayers: 2,
    connectTimeoutMs: 8000,
    lobbyAnnounceMs: 4000,   // host mengumumkan room
    roomStaleMs: 13000,      // room hilang dari daftar jika tak ada kabar
    hbMs: 4000,              // denyut jantung tiap pemain
    rosterMs: 3000,          // host menyiarkan daftar pemain
    // PERBAIKAN bug #1: ambang dinaikkan agar pemain yang hanya pindah aplikasi sebentar (mis. membagikan kode room
    // lewat WhatsApp) tidak langsung dianggap hilang. Ponsel membekukan halaman di background, jadi 15-20 dtk terlalu pendek.
    waitLostMs: 45000,       // pemain di ruang tunggu dianggap hilang
    hostLostMs: 45000,       // host dianggap hilang
    raceLostMs: 45000,       // pemain saat balapan dianggap terputus
    resumeGapMs: 2500,       // jeda tick lebih lama dari ini = halaman baru saja dibekukan/dilanjutkan
    signMessages: true,      // PERBAIKAN bug #4: tanda tangan digital di setiap pesan (false = mode lama tanpa tanda tangan)
    joinTimeoutMs: 10000,
    countdownSec: 3,
    // Bot: akurasi sama dengan mode lama (70% / 65% / 60%) + kecepatan menjawab per tingkat soal (detik)
    botAccuracy: [0.70, 0.65, 0.60],
    botIcons: ['⛴️', '🚤', '🛶'],
    botTimes: { easy: [5, 11], medium: [8, 16], hard: [12, 26] },
    botTimeScale: 1
};

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ID_RE = /^[a-z0-9]{8}$/;
const CODE_RE = /^[A-Z2-9]{5}$/;
const AVATARS = ['🤓', '👧', '🧑‍✈️', '🏴‍☠️'];

/* ---------- Status modul ---------- */
const S = {
    me: { id: '' },
    view: 'none',          // none | lobby | room | race | result
    net: { links: [], status: 'idle', intentional: true, libPromise: null, seq: 0, seen: new Map() },
    subs: {},              // topic -> qos
    rooms: {},             // daftar room dari lobby
    room: null,            // room yang sedang dimasuki
    joining: null,         // proses masuk ke room
    race: null,            // balapan multiplayer yang sedang berjalan
    lastSeed: null,
    tickTimer: null,
    lastHb: 0, lastRoster: 0, lastAnn: 0,
    laneOrig: null
};

/* ---------- Utilitas ---------- */
function $(id) { return document.getElementById(id); }
function nowMs() { return Date.now(); }
function randBytes(n) {
    const a = new Uint32Array(n);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
    else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
    return a;
}
function randFrom(alphabet, len) {
    const r = randBytes(len); let s = '';
    for (let i = 0; i < len; i++) s += alphabet.charAt(r[i] % alphabet.length);
    return s;
}
function randId(len) { return randFrom('abcdefghijklmnopqrstuvwxyz0123456789', len); }
function randSeed() { return randBytes(1)[0] >>> 0; }
function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function clampInt(v, lo, hi) { v = Math.floor(Number(v)); if (!isFinite(v)) v = lo; return Math.max(lo, Math.min(hi, v)); }
function clampNum(v, lo, hi) { v = Number(v); if (!isFinite(v)) v = lo; return Math.max(lo, Math.min(hi, v)); }
function cleanRoomName(raw) {
    const cleaned = String(raw == null ? '' : raw)
        .replace(/\s+/g, ' ')
        .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\uFEFF]/g, '')
        .trim();
    return Array.from(cleaned).slice(0, 20).join('').trim();
}
function normCode(raw) { return String(raw == null ? '' : raw).toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 5); }
function myShip() {
    const it = SHOP_ITEMS.find(function (s) { return s.id === GameState.equipped['ship']; });
    return it ? it.icon : '⛵';
}
function shipIcons() { return ['⛵'].concat(SHOP_ITEMS.filter(function (s) { return s.category === 'ship'; }).map(function (s) { return s.icon; })); }
function cleanShip(s) { return shipIcons().indexOf(s) >= 0 ? s : '⛵'; }
function cleanAvatar(a) { return AVATARS.indexOf(a) >= 0 ? a : '🤓'; }
function mePlayer() { return { id: S.me.id, name: getPlayerName(), avatar: cleanAvatar(GameState.playerAvatar), ship: myShip() }; }
function cleanPlayer(p) {
    if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !ID_RE.test(p.id)) return null;
    return { id: p.id, name: sanitizePlayerName(p.name), avatar: cleanAvatar(p.avatar), ship: cleanShip(p.ship) };
}
function lobbyTopic() { return CFG.topicRoot + '/lobby'; }
function roomTopic(code) { return CFG.topicRoot + '/room/' + code; }
function questionById() { const o = {}; QUESTION_DATABASE.forEach(function (q) { o[q.id] = q; }); return o; }

let noteTimer = null;
function note(text) {
    ['mp-room-note', 'mp-res-note', 'mp-lobby-note'].forEach(function (id) { const el = $(id); if (el) el.textContent = text || ''; });
    clearTimeout(noteTimer);
    if (text) noteTimer = setTimeout(function () { note(''); }, 6000);
}

/* Fungsi asli yang akan "dibungkus" (disimpan dulu sebelum diganti) */
const O = {
    handleAnswer: handleAnswer,
    showVictory: showVictory,
    showGameOver: showGameOver,
    confirmQuitRace: confirmQuitRace,
    quitRace: quitRace,
    showAlert: showAlert
};

/* =====================================================================
   JARINGAN (MQTT)
   ===================================================================== */
/* =====================================================================
   KEAMANAN PESAN  (perbaikan bug #4: pesan MQTT bisa dipalsukan)
   - Setiap pemain membuat pasangan kunci ECDSA P-256 (WebCrypto) saat halaman dimuat.
     Kunci publik (k) dan tanda tangan (s) ikut di setiap pesan. Tanda tangan dihitung atas
     "topik + \n + isi pesan" (teks persis seperti yang dikirim), jadi isi pesan tidak bisa diubah di tengah jalan.
   - Penerima mengikat id pemain -> kunci publiknya (pertama-menang). Pengikatan HANYA dari:
       'join' (diterima host) dan 'roster' (diumumkan host). Pesan lain wajib dari id yang kuncinya sudah terikat.
   - Pesan tanpa tanda tangan, tanda tangan salah, atau kunci tidak cocok dibuang SEBELUM diproses/didedupe.
   - Batas: ini mencegah peniruan identitas, bukan klien curang yang berbohong tentang dirinya sendiri.
   ===================================================================== */
/* @@SEC-BEGIN */
const K_RE = /^[A-Za-z0-9+\/]{87}=$/;                          // kunci publik mentah P-256 (65 byte) dalam base64
const SIG_TAIL = /,"s":"([A-Za-z0-9+\/]{86}==)"\}$/;           // tanda tangan 64 byte dalam base64, selalu field terakhir
const SEC = {
    supported: !!(window.crypto && window.crypto.subtle && typeof TextEncoder === 'function'),
    on: false, priv: null, pubB64: '', initP: null,
    keys: new Map(), keyCache: new Map(),
    txQ: Promise.resolve(), rxQ: Promise.resolve(), pending: 0, netGen: 0,
    leavePkt: null, leavePrep: false                              // bug #7: paket 'leave' yang sudah ditandatangani lebih dulu
};
function b64enc(buf) {
    const a = new Uint8Array(buf); let s = '';
    for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
}
function b64dec(str) {
    const s = atob(str), a = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
}
function secResetKeys() {
    SEC.keys.clear();
    SEC.leavePkt = null;
    if (SEC.pubB64) SEC.keys.set(S.me.id, SEC.pubB64);
}
/* Menyiapkan kunci. Resolve true bila siap (atau fitur dimatikan lewat CFG.signMessages = false). */
function secReady() {
    if (!CFG.signMessages) { SEC.on = false; return Promise.resolve(true); }
    if (!SEC.supported) return Promise.resolve(false);
    if (!SEC.initP) {
        SEC.initP = crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify'])
            .then(function (kp) { SEC.priv = kp.privateKey; return crypto.subtle.exportKey('raw', kp.publicKey); })
            .then(function (raw) { SEC.pubB64 = b64enc(raw); SEC.on = true; SEC.keys.set(S.me.id, SEC.pubB64); return true; })
            .catch(function () { SEC.initP = null; return false; });
    }
    return SEC.initP;
}
function secSign(topic, base) {
    return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, SEC.priv, new TextEncoder().encode(topic + '\n' + base)).then(b64enc);
}
function secKeyFor(k) {
    if (SEC.keyCache.has(k)) return Promise.resolve(SEC.keyCache.get(k));
    return Promise.resolve().then(function () {
        return crypto.subtle.importKey('raw', b64dec(k), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    }).then(function (key) {
        if (SEC.keyCache.size > 64) SEC.keyCache.clear();
        SEC.keyCache.set(k, key);
        return key;
    }).catch(function () { return null; });
}
function secVerifyRaw(k, sigB64, topic, base) {
    return secKeyFor(k).then(function (key) {
        if (!key) return false;
        return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64dec(sigB64), new TextEncoder().encode(topic + '\n' + base));
    }).catch(function () { return false; });
}
/* Roster hanya sah bila: dikirim pemain pertama (host) dengan kunci yang sama dengan yang tercantum, tidak bertabrakan
   dengan kunci yang sudah terikat, dan (a) saat bergabung memuat kita, atau (b) saat sudah di room berasal dari host
   sekarang / calon pengganti sah (pemain urutan ke-2). Kunci anggota yang belum terikat diikat di sini. */
function secAcceptRoster(m, from) {
    const list = Array.isArray(m.players) ? m.players : null;
    if (!list || !list.length || list.length > CFG.maxPlayers) return false;
    const head = list[0];
    if (!head || head.id !== from || head.k !== m.k) return false;
    const R = S.room;
    if (R) {
        if (from !== R.hostId && !(R.players.length > 1 && R.players[1].id === from)) return false;
    } else if (!(S.joining && list.some(function (p) { return p && p.id === S.me.id; }))) {
        return false;
    }
    for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (!p || typeof p.id !== 'string' || !ID_RE.test(p.id)) return false;
        if (p.k !== undefined) {
            if (typeof p.k !== 'string' || !K_RE.test(p.k)) return false;
            const b = SEC.keys.get(p.id);
            if (b && b !== p.k) return false;
        }
    }
    list.forEach(function (p) { if (typeof p.k === 'string' && !SEC.keys.has(p.id)) SEC.keys.set(p.id, p.k); });
    return true;
}
/* Resolve dengan teks pesan asli bila sah, atau null bila harus dibuang. */
function secVerify(topic, payload) {
    const NO = Promise.resolve(null);
    let P;
    try { P = typeof payload === 'string' ? payload : new TextDecoder().decode(payload); } catch (e) { return NO; }
    if (P.length > 32768) return NO;
    const mt = SIG_TAIL.exec(P);
    if (!mt) return NO;
    let m;
    try { m = JSON.parse(P); } catch (e) { return NO; }
    if (!m || typeof m !== 'object' || m.v !== 1 || typeof m.t !== 'string') return NO;
    if (m.s !== mt[1] || typeof m.k !== 'string' || !K_RE.test(m.k)) return NO;
    if (typeof m.i === 'string' && S.net.seen.has(m.i)) return NO;        // salinan dari broker lain yang sudah diproses
    const base = P.slice(0, mt.index) + '}';
    const isLobby = topic === lobbyTopic();
    let from = null, bound = null;
    if (!isLobby) {
        const prefix = CFG.topicRoot + '/room/';
        if (topic.indexOf(prefix) !== 0) return NO;
        const code = topic.slice(prefix.length);
        if (!CODE_RE.test(code)) return NO;
        from = (typeof m.from === 'string' && ID_RE.test(m.from)) ? m.from : null;
        if (!from || from === S.me.id) return NO;                          // tanpa pengirim / pesan sendiri
        const inRoom = !!(S.room && S.room.code === code);
        const joining = !!(S.joining && S.joining.code === code && !S.room);
        if (!inRoom && !joining) return NO;
        bound = SEC.keys.get(from) || null;
        if (bound) {
            if (bound !== m.k) return NO;                                  // kunci tidak cocok = pemalsuan
        } else {
            const iAmHost = inRoom && S.room.hostId === S.me.id;
            const allowed = (m.t === 'join' && iAmHost) || (m.t === 'roster' && joining) ||
                            (m.t === 'deny' && joining && m.to === S.me.id);
            if (!allowed) return NO;                                       // id belum dikenal hanya boleh memulai lewat jalur resmi
        }
    }
    return secVerifyRaw(m.k, mt[1], topic, base).then(function (ok) {
        if (!ok) return null;
        if (isLobby) return P;                                             // lobi terbuka: cukup tanda tangan sah
        if (m.t === 'roster') return secAcceptRoster(m, from) ? P : null;
        if (!bound && m.t === 'join') SEC.keys.set(from, m.k);             // host mengikat kunci pemain baru
        return P;
    });
}
function rawSend(topic, payload, qos) {
    let ok = false;
    S.net.links.forEach(function (l) {
        if (!l.connected || !l.client) return;
        try { l.client.publish(topic, payload, { qos: qos || 0 }, function () {}); ok = true; } catch (e) {}
    });
    return ok;
}
/* Pesan dikirim lewat SEMUA link yang aktif; penerima membuang duplikat memakai id unik pesan (m.i).
   Penandatanganan WebCrypto bersifat asinkron, jadi pengiriman diantrekan (urutan pesan tetap terjaga). */
function pub(topic, obj, qos) {
    if (!ready()) return false;
    obj.v = 1;
    obj.i = S.me.id + '.' + (++S.net.seq).toString(36);
    if (!SEC.on) return rawSend(topic, JSON.stringify(obj), qos);
    obj.k = SEC.pubB64;
    const base = JSON.stringify(obj);                                      // isi pesan dikunci sekarang
    SEC.pending++;
    SEC.txQ = SEC.txQ
        .then(function () { return secSign(topic, base); })
        .then(function (sig) { rawSend(topic, base.slice(0, -1) + ',"s":"' + sig + '"}', qos); })
        .catch(function () {})
        .then(function () { SEC.pending--; });
    return true;
}
function onMessage(topic, payload) {
    if (!SEC.on) { handleMessage(topic, payload); return; }
    SEC.rxQ = SEC.rxQ
        .then(function () { return secVerify(topic, payload); })
        .then(function (raw) { if (raw !== null) handleMessage(topic, raw); })
        .catch(function (e) { try { console.error('MP rx:', e); } catch (x) {} });
}
/* mqtt.js membuang publish() setelah end(); jadi tutup koneksi hanya setelah antrean kirim kosong. */
function exitNetAfterFlush() {
    if (!SEC.pending) { exitNet(); return; }
    const g = SEC.netGen;
    SEC.txQ.then(function () { if (g === SEC.netGen) exitNet(); });
}
/* PERBAIKAN bug #7: saat tab ditutup (pagehide) tidak ada waktu menunggu penandatanganan WebCrypto yang asinkron, sehingga pesan 'leave'
   tidak pernah terkirim. Solusi: paket 'leave' untuk room yang sedang diikuti ditandatangani lebih dulu (dipanggil dari tick) dan
   dikirim sinkron saat tab ditutup. Pengiriman saat halaman ditutup tetap upaya terbaik (tidak dijamin oleh browser). */
function secPrepareLeave() {
    const R = S.room;
    if (!SEC.on || !R || SEC.leavePrep) return;
    if (SEC.leavePkt && SEC.leavePkt.code === R.code) return;
    SEC.leavePrep = true;
    const code = R.code, topic = roomTopic(code);
    const obj = { t: 'leave', from: S.me.id, v: 1, i: S.me.id + '.' + (++S.net.seq).toString(36), k: SEC.pubB64 };
    const base = JSON.stringify(obj);
    secSign(topic, base).then(function (sig) {
        SEC.leavePkt = { code: code, topic: topic, payload: base.slice(0, -1) + ',"s":"' + sig + '"}' };
    }).catch(function () {}).then(function () { SEC.leavePrep = false; });
}
function secFinalLeave(code) {                     // sinkron; sekali pakai
    const pk = SEC.leavePkt;
    SEC.leavePkt = null;
    if (!pk || !code || pk.code !== code) return false;
    return rawSend(pk.topic, pk.payload, 0);
}
/* @@SEC-END */
function ready() { return S.net.links.some(function (l) { return l.connected; }); }
function linkCount() { let n = 0; S.net.links.forEach(function (l) { if (l.connected) n++; }); return n; }

function setNetStatus(status, msg) {
    S.net.status = status;
    const el = $('mp-net-status'), dot = $('mp-net-dot'), retry = $('mp-btn-retry');
    if (el) {
        el.textContent = msg || '...';
        el.className = 'mp-status' + (status === 'online' ? ' ok' : (status === 'failed' ? ' bad' : ''));
    }
    if (dot) dot.className = 'mp-dot ' + (status === 'online' ? 'ok' : (status === 'failed' ? 'bad' : 'wait'));
    if (retry) retry.style.display = status === 'failed' ? '' : 'none';
    refreshLobbyControls();
}

function updateNetStatus() {
    const n = linkCount(), total = S.net.links.length;
    if (!total) return;
    if (n > 0) setNetStatus('online', '✅ Terhubung ke server (' + n + '/' + total + ')');
    else if (S.net.links.some(function (l) { return l.state === 'connecting' || l.state === 'idle'; })) setNetStatus('connecting', 'Menghubungkan ke server...');
    else setNetStatus('failed', 'Tidak bisa terhubung ke server mana pun. Periksa internet lalu coba lagi.');
}

function loadMqttLib() {
    if (window.mqtt && typeof window.mqtt.connect === 'function') return Promise.resolve(true);
    if (S.net.libPromise) return S.net.libPromise;
    S.net.libPromise = new Promise(function (resolve) {
        let i = 0;
        const next = function () {
            if (window.mqtt && typeof window.mqtt.connect === 'function') { resolve(true); return; }
            if (i >= CFG.libUrls.length) { resolve(false); return; }
            const s = document.createElement('script');
            let done = false;
            const finish = function () {
                if (done) return; done = true; clearTimeout(to);
                if (window.mqtt && typeof window.mqtt.connect === 'function') resolve(true);
                else { try { s.remove(); } catch (e) {} next(); }
            };
            const to = setTimeout(finish, CFG.libTimeoutMs);
            s.src = CFG.libUrls[i++]; s.async = true;
            s.onload = finish; s.onerror = finish;
            document.head.appendChild(s);
        };
        next();
    }).then(function (ok) { if (!ok) S.net.libPromise = null; return ok; });
    return S.net.libPromise;
}

function connect() {
    SEC.netGen++;                                                   // PERBAIKAN bug #4: batalkan penutupan tertunda (exitNetAfterFlush)
    S.net.intentional = false;
    if (S.net.links.length) { updateNetStatus(); return; }          // koneksi sudah berjalan
    setNetStatus('connecting', 'Memuat library koneksi...');
    Promise.all([loadMqttLib(), secReady()]).then(function (r) {
        if (S.net.intentional) return;
        if (!r[0]) { setNetStatus('failed', 'Gagal memuat library koneksi. Periksa internet lalu coba lagi.'); return; }
        if (!r[1]) { setNetStatus('failed', 'Multiplayer aman membutuhkan koneksi HTTPS. Buka game lewat alamat https:// lalu coba lagi.'); return; }
        if (S.net.links.length) return;
        S.net.links = CFG.brokers.map(function (url, idx) {
            return { idx: idx, url: url, client: null, connected: false, state: 'idle', gen: 0, tries: 0, timer: null };
        });
        S.net.links.forEach(openLink);
        updateNetStatus();
    });
}

/* Satu "link" = satu koneksi ke satu broker. Semua link dibuka bersamaan dan masing-masing menyambung ulang sendiri. */
function openLink(link) {
    if (S.net.intentional) return;
    clearTimeout(link.timer);
    if (link.client) { try { link.client.end(true); } catch (e) {} link.client = null; }
    link.connected = false; link.state = 'connecting';
    const gen = ++link.gen;
    const st = { settled: false, dead: false };
    let client = null, failTimer = null;
    const fail = function () {
        if (st.settled || st.dead) return;
        st.dead = true; clearTimeout(failTimer);
        try { if (client) client.end(true); } catch (e) {}
        if (gen !== link.gen) return;
        link.client = null; link.connected = false; link.state = 'failed';
        scheduleLinkRetry(link); updateNetStatus();
    };
    try {
        client = window.mqtt.connect(link.url, {
            clientId: 'edu' + S.me.id + randId(4),
            clean: true, keepalive: 30, protocolVersion: 4,
            connectTimeout: CFG.connectTimeoutMs, reconnectPeriod: 0   // sambung ulang diatur sendiri (scheduleLinkRetry)
        });
    } catch (e) { fail(); return; }
    failTimer = setTimeout(fail, CFG.connectTimeoutMs + 1500);
    client.on('connect', function () {
        if (st.dead) return;
        if (gen !== link.gen) { st.dead = true; try { client.end(true); } catch (e) {} return; }
        if (st.settled) return;
        st.settled = true; clearTimeout(failTimer);
        link.client = client; link.connected = true; link.state = 'online'; link.tries = 0;
        onLinkOnline(link);
    });
    client.on('message', function (topic, payload) { if (!st.dead && gen === link.gen) onMessage(String(topic), payload); });
    client.on('error', function () { if (!st.settled) fail(); });
    client.on('close', function () {
        if (st.dead) return;
        if (!st.settled) { fail(); return; }
        if (gen !== link.gen) return;
        st.dead = true;
        link.connected = false; link.client = null; link.state = 'failed';
        if (!S.net.intentional) scheduleLinkRetry(link);
        updateNetStatus();
    });
}

function scheduleLinkRetry(link) {
    if (S.net.intentional) return;
    clearTimeout(link.timer);
    const wait = Math.min(CFG.retryMaxMs, CFG.retryBaseMs * Math.pow(2, Math.min(link.tries++, 4)));
    link.timer = setTimeout(function () { openLink(link); }, wait);
}

/* Dipanggil setiap kali SATU link berhasil tersambung (pertama kali maupun sesudah putus). */
function onLinkOnline(link) {
    updateNetStatus();
    presenceReset();   // beri waktu tenang sebelum menilai pemain lain "hilang" (kini termasuk saat balapan - bug #1)
    Object.keys(S.subs).forEach(function (tp) { linkSub(link, tp, S.subs[tp]); });
    syncLobbySub();
    if (S.view === 'lobby') pub(lobbyTopic(), { t: 'who', from: S.me.id }, 0);
    if (S.joining) sendJoin();
    if (S.room) {
        pub(roomTopic(S.room.code), { t: 'hb', from: S.me.id }, 0);
        if (S.room.hostId === S.me.id) { broadcastRoster(); announce(); }
        else if (S.room.ph === 'waiting' && !(S.race && S.race.active)) {
            pub(roomTopic(S.room.code), { t: 'join', from: S.me.id, name: getPlayerName(), avatar: cleanAvatar(GameState.playerAvatar), ship: myShip() }, 1);
        }
    }
    refreshLobbyControls();
}

function linkSub(link, topic, qos) { try { link.client.subscribe(topic, { qos: qos || 0 }, function () {}); } catch (e) {} }
function linkUnsub(link, topic) { try { link.client.unsubscribe(topic, function () {}); } catch (e) {} }
function sub(topic, qos) {
    S.subs[topic] = qos || 0;
    S.net.links.forEach(function (l) { if (l.connected && l.client) linkSub(l, topic, qos); });
}
function unsub(topic) {
    if (!Object.prototype.hasOwnProperty.call(S.subs, topic)) return;
    delete S.subs[topic];
    S.net.links.forEach(function (l) { if (l.connected && l.client) linkUnsub(l, topic); });
}
/* pub() kini ada di blok KEAMANAN PESAN (di atas jaringan). */
function syncLobbySub() {
    const want = S.view === 'lobby' || !!(S.room && S.room.hostId === S.me.id && S.room.ph === 'waiting');
    const has = Object.prototype.hasOwnProperty.call(S.subs, lobbyTopic());
    if (want && !has) sub(lobbyTopic(), 0);
    else if (!want && has) unsub(lobbyTopic());
}
function setView(v) { S.view = v; syncLobbySub(); }

function handleMessage(topic, payload) {   // dipanggil setelah pesan lolos verifikasi (lihat onMessage di blok KEAMANAN PESAN)
    let m;
    try { m = JSON.parse(typeof payload === 'string' ? payload : new TextDecoder().decode(payload)); } catch (e) { return; }
    if (!m || typeof m !== 'object' || m.v !== 1 || typeof m.t !== 'string') return;
    if (typeof m.i === 'string' && m.i.length <= 40) {            // buang duplikat (pesan yang sama datang dari beberapa broker)
        if (S.net.seen.has(m.i)) return;
        S.net.seen.set(m.i, nowMs());
        if (S.net.seen.size > 800) {
            let n = 0;
            S.net.seen.forEach(function (v, k) { if (n++ < 300) S.net.seen.delete(k); });
        }
    }
    if (topic === lobbyTopic()) { onLobbyMsg(m); return; }
    const prefix = CFG.topicRoot + '/room/';
    if (topic.indexOf(prefix) !== 0) return;
    const code = topic.slice(prefix.length);
    if (!CODE_RE.test(code)) return;
    if ((S.room && S.room.code === code) || (S.joining && S.joining.code === code)) onRoomMsg(code, m);
}

/* =====================================================================
   LOBBY
   ===================================================================== */
function onLobbyMsg(m) {
    if (m.t === 'ann') {
        if (typeof m.id !== 'string' || !CODE_RE.test(m.id)) return;
        if (S.room && S.room.code === m.id) return;
        S.rooms[m.id] = {
            code: m.id,
            name: cleanRoomName(m.name) || ('Room ' + m.id),
            host: sanitizePlayerName(m.host),
            n: clampInt(m.n, 1, CFG.maxPlayers),
            ph: m.ph === 'racing' ? 'racing' : 'waiting',
            seen: nowMs()
        };
        if (S.view === 'lobby') renderLobbyList();
    } else if (m.t === 'bye') {
        if (typeof m.id === 'string' && S.rooms[m.id]) { delete S.rooms[m.id]; if (S.view === 'lobby') renderLobbyList(); }
    } else if (m.t === 'who') {
        if (S.room && S.room.hostId === S.me.id) setTimeout(announce, Math.floor(Math.random() * 400));
    }
}

function announce() {
    const R = S.room;
    if (!R || R.hostId !== S.me.id || !ready()) return;
    S.lastAnn = nowMs();
    pub(lobbyTopic(), { t: 'ann', id: R.code, name: R.name, host: getPlayerName(), hostId: S.me.id, n: R.players.length, max: CFG.maxPlayers, ph: R.ph }, 0);
}

function pruneRooms(t) {
    let changed = false;
    Object.keys(S.rooms).forEach(function (k) { if (t - S.rooms[k].seen > CFG.roomStaleMs) { delete S.rooms[k]; changed = true; } });
    return changed;
}

function refreshLobbyControls() {
    const on = ready() && !S.joining && !S.room;
    ['mp-btn-create', 'mp-btn-joincode'].forEach(function (id) { const b = $(id); if (b) b.disabled = !on; });
    if (S.view === 'lobby') renderLobbyList();
}

function renderLobbyList() {
    const box = $('mp-room-list'); if (!box) return;
    const arr = Object.keys(S.rooms).map(function (k) { return S.rooms[k]; });
    arr.sort(function (a, b) {
        return ((a.ph === 'waiting' ? 0 : 1) - (b.ph === 'waiting' ? 0 : 1)) || (b.n - a.n) || (a.code < b.code ? -1 : 1);
    });
    box.innerHTML = '';
    if (!arr.length) {
        const e = document.createElement('div'); e.className = 'mp-empty';
        e.textContent = ready() ? 'Belum ada room terbuka. Jadilah yang pertama: tekan BUAT ROOM!' : 'Menunggu koneksi ke server...';
        box.appendChild(e); return;
    }
    arr.forEach(function (rm) {
        const joinable = rm.ph === 'waiting' && rm.n < CFG.maxPlayers;
        const row = document.createElement('div'); row.className = 'mp-room-row';
        const main = document.createElement('div'); main.className = 'mp-room-main';
        const nm = document.createElement('div'); nm.className = 'mp-room-name'; nm.textContent = rm.name;
        const sb = document.createElement('div'); sb.className = 'mp-room-sub'; sb.textContent = 'Host: ' + rm.host + ' • ' + rm.code + ' • 👥 ' + rm.n + '/' + CFG.maxPlayers;
        main.appendChild(nm); main.appendChild(sb);
        const badge = document.createElement('span');
        badge.className = 'mp-badge' + (joinable ? '' : ' busy');
        badge.textContent = rm.ph !== 'waiting' ? 'MAIN' : (rm.n >= CFG.maxPlayers ? 'PENUH' : 'BUKA');
        const btn = document.createElement('button'); btn.className = 'pixel-btn mp-btn-xs'; btn.textContent = 'GABUNG';
        btn.disabled = !joinable || !ready() || !!S.joining || !!S.room;
        btn.addEventListener('click', function () { joinRoom(rm.code); });
        row.appendChild(main); row.appendChild(badge); row.appendChild(btn);
        box.appendChild(row);
    });
}

function openLobby() {
    setView('lobby');
    switchScreen('screen-mp-lobby');
    startTick();
    renderLobbyList();
    refreshLobbyControls();
    if (ready()) { updateNetStatus(); pub(lobbyTopic(), { t: 'who', from: S.me.id }, 0); }
    else connect();
}

function backFromLobby() { exitMultiplayer(); switchScreen('screen-main-menu'); }

function refresh() {
    playSound('click');
    S.rooms = {}; renderLobbyList();
    if (ready()) pub(lobbyTopic(), { t: 'who', from: S.me.id }, 0);
    else connect();
}

function retryConnect() {
    playSound('click');
    if (!S.net.links.length) { connect(); return; }
    S.net.intentional = false;
    S.net.links.forEach(function (l) { if (!l.connected) { l.tries = 0; openLink(l); } });
    updateNetStatus();
}

/* =====================================================================
   ROOM
   ===================================================================== */
function openCreate() {
    if (!ready()) { note('Belum terhubung ke server.'); return; }
    playSound('click');
    $('mp-input-roomname').value = '';
    $('modal-mp-create').classList.add('active');
    try { $('mp-input-roomname').focus(); } catch (e) {}
}
function closeCreate() { playSound('click'); $('modal-mp-create').classList.remove('active'); }
function doCreate() {
    const name = $('mp-input-roomname').value;
    $('modal-mp-create').classList.remove('active');
    createRoom(name);
}

function createRoom(name) {
    if (!ready()) { note('Belum terhubung ke server.'); return; }
    if (S.room || S.joining) return;
    let code; let guard = 0;
    do { code = randFrom(ROOM_ALPHABET, 5); } while (S.rooms[code] && ++guard < 20);
    const t = nowMs();
    S.room = { code: code, name: cleanRoomName(name) || cleanRoomName('Room ' + getPlayerName()), hostId: S.me.id, players: [mePlayer()], ph: 'waiting', lastSeen: {}, hostSeen: t, rev: 0, rosterRev: 0, absent: 0 };
    S.room.lastSeen[S.me.id] = t;
    sub(roomTopic(code), 1);
    setView('room');
    switchScreen('screen-mp-room');
    renderRoom();
    S.lastRoster = 0; S.lastAnn = 0;
    broadcastRoster(); announce();
    refreshLobbyControls();
    note('Room dibuat! Bagikan kode ' + code + ' atau tunggu pemain lain bergabung.');
}

function joinByCode() {
    const code = normCode($('mp-input-code').value);
    if (code.length !== 5) { note('Kode room terdiri dari 5 karakter (huruf A–Z dan angka 2–9).'); return; }
    joinRoom(code);
}

function sendJoin() {
    if (!S.joining) return;
    pub(roomTopic(S.joining.code), { t: 'join', from: S.me.id, name: getPlayerName(), avatar: cleanAvatar(GameState.playerAvatar), ship: myShip() }, 1);
}

function joinRoom(code) {
    code = normCode(code);
    if (code.length !== 5) return;
    if (!ready()) { note('Belum terhubung ke server.'); return; }
    if (S.room || S.joining) return;
    // Sengaja TIDAK menolak berdasarkan daftar room lokal (bisa basi beberapa detik): host yang memutuskan
    // dan membalas 'deny' dengan alasan yang akurat (penuh / sedang balapan).
    playSound('click');
    S.joining = { code: code, startedAt: nowMs(), timer: null };
    sub(roomTopic(code), 1);
    sendJoin();
    S.joining.timer = setInterval(joinTick, 1500);
    note('Masuk ke room ' + code + '...');
    refreshLobbyControls();
}

function joinTick() {
    const J = S.joining; if (!J) return;
    if (nowMs() - J.startedAt > CFG.joinTimeoutMs) {
        const code = J.code;
        cancelJoin();
        showAlert('ROOM TIDAK DITEMUKAN', 'Room ' + code + ' tidak merespons. Cek kode room, pastikan host masih berada di ruang tunggu, dan kedua perangkat terhubung internet (server aktif: ' + linkCount() + '/' + S.net.links.length + ').');
        return;
    }
    sendJoin();
}

function cancelJoin() {
    const J = S.joining; if (!J) return;
    clearInterval(J.timer);
    S.joining = null;
    if (!S.room || S.room.code !== J.code) unsub(roomTopic(J.code));
    refreshLobbyControls();
}

function acceptJoin(code, m, list, hostId, ph, rev) {
    clearInterval(S.joining.timer);
    S.joining = null;
    const t = nowMs();
    S.room = { code: code, name: cleanRoomName(m.name) || ('Room ' + code), hostId: hostId, players: list, ph: ph, lastSeen: {}, hostSeen: t, rev: 0, rosterRev: rev || 0, absent: 0 };
    list.forEach(function (p) { S.room.lastSeen[p.id] = t; });
    setView('room');
    switchScreen('screen-mp-room');
    renderRoom();
    note('Berhasil masuk ke room ' + code + '. Tunggu host memulai balapan.');
    refreshLobbyControls();
}

function touch(id) {
    const R = S.room; if (!R) return;
    const t = nowMs();
    R.lastSeen[id] = t;
    if (id === R.hostId) R.hostSeen = t;
    if (S.race) { const r = S.race.racers.filter(function (x) { return !x.bot && x.id === id; })[0]; if (r) r.lastSeen = t; }
}

function onRoomMsg(code, m) {
    const from = (typeof m.from === 'string' && ID_RE.test(m.from)) ? m.from : null;
    if (!from || from === S.me.id) return;                       // abaikan pesan dari diri sendiri
    const R = S.room;
    if (R && R.code === code) touch(from);                       // setiap pesan = tanda pemain itu masih hadir
    switch (m.t) {
        case 'join': hostOnJoin(code, m); break;
        case 'roster': onRoster(code, m, from); break;
        case 'deny': onDeny(code, m); break;
        case 'leave': if (R && R.code === code) dropMember(from, 'left'); break;
        case 'start': onStart(code, m, from); break;
        case 'prog': onProg(code, m, from); break;
        case 'chat': case 'chatreq': case 'chathist': chatOnMsg(code, m, from); break;   // CHAT ROOM (baru)
        default: break;                                          // 'hb' dll: cukup memperbarui kehadiran
    }
}

function hostOnJoin(code, m) {
    const R = S.room;
    if (!R || R.code !== code || R.hostId !== S.me.id) return;
    const p = cleanPlayer({ id: m.from, name: m.name, avatar: m.avatar, ship: m.ship });
    if (!p) return;
    const idx = R.players.findIndex(function (x) { return x.id === p.id; });
    if (idx >= 0) { R.players[idx] = p; broadcastRoster(); renderRoom(); return; }
    if (R.ph !== 'waiting' || (S.race && S.race.active && !S.race.final)) { pub(roomTopic(code), { t: 'deny', from: S.me.id, to: p.id, why: 'started' }, 1); return; }
    if (R.players.length >= CFG.maxPlayers) { pub(roomTopic(code), { t: 'deny', from: S.me.id, to: p.id, why: 'full' }, 1); return; }
    R.players.push(p);
    R.lastSeen[p.id] = nowMs();
    broadcastRoster(); announce(); renderRoom();
    playSound('correct');
    note(p.name + ' bergabung ke room.');
}

function broadcastRoster() {
    const R = S.room;
    if (!R || R.hostId !== S.me.id || !ready()) return;
    S.lastRoster = nowMs();
    R.rev = (R.rev || 0) + 1;
    pub(roomTopic(R.code), { t: 'roster', from: S.me.id, host: S.me.id, rev: R.rev, name: R.name, ph: R.ph, players: R.players.map(function (p) { return { id: p.id, name: p.name, avatar: p.avatar, ship: p.ship, k: SEC.keys.get(p.id) }; }) }, 1);
}

function onRoster(code, m, from) {
    const list = Array.isArray(m.players) ? m.players.map(cleanPlayer).filter(Boolean).slice(0, CFG.maxPlayers) : null;
    if (!list || !list.length) return;
    if (list[0].id !== from || (typeof m.host === 'string' && m.host !== from)) return;   // roster sah hanya dari host (pemain pertama)
    const ph = m.ph === 'racing' ? 'racing' : 'waiting';
    const rev = clampInt(m.rev, 0, 1000000000);
    if (S.joining && S.joining.code === code && !S.room) {
        if (!list.some(function (p) { return p.id === S.me.id; })) return;   // belum diterima
        acceptJoin(code, m, list, from, ph, rev);
        return;
    }
    const R = S.room;
    if (!R || R.code !== code || R.hostId === S.me.id) return;
    if (from === R.hostId) {
        if (rev && R.rosterRev && rev <= R.rosterRev) return;                 // roster basi / duplikat (datang terlambat dari broker lain)
    } else {
        // pergantian host: terima hanya jika host lama sudah tidak ada di daftar baru dan pengirim memang anggota room
        const known = R.players.some(function (p) { return p.id === from; });
        if (!known || list.some(function (p) { return p.id === R.hostId; })) return;
    }
    const inRace = !!(S.race && S.race.active);
    if (!list.some(function (p) { return p.id === S.me.id; })) {
        R.absent = (R.absent || 0) + 1;                                       // butuh 2 roster berturut-turut sebelum dianggap dikeluarkan
        if (R.absent >= 2 && R.ph === 'waiting' && !inRace) kicked();
        return;
    }
    R.absent = 0;
    if (rev) R.rosterRev = rev;
    const t = nowMs();
    R.hostId = from; R.hostSeen = t;
    R.name = cleanRoomName(m.name) || R.name;
    R.players = list;
    list.forEach(function (p) { if (!R.lastSeen[p.id]) R.lastSeen[p.id] = t; });
    // jangan mundur dari 'racing' ke 'waiting' selagi saya masih berlayar
    if (!(inRace && !S.race.final && ph === 'waiting')) R.ph = ph;
    syncLobbySub();
    renderRoom();
}

function onDeny(code, m) {
    if (m.to !== S.me.id) return;
    if (!S.joining || S.joining.code !== code) return;
    cancelJoin();
    showAlert('GAGAL MASUK', m.why === 'full' ? 'Room sudah penuh (maks. 4 pemain).' : 'Balapan di room itu sedang berjalan. Coba lagi nanti.');
}

function kicked() {
    leaveRoomCore(false);
    setView('lobby'); switchScreen('screen-mp-lobby');
    S.rooms = {}; renderLobbyList();
    if (ready()) pub(lobbyTopic(), { t: 'who', from: S.me.id }, 0);
    note('Kamu keluar dari room karena koneksi terputus terlalu lama.');
}

function electHost() {
    const R = S.room; if (!R || !R.players.length) return;
    const next = R.players[0];
    R.hostId = next.id; R.hostSeen = nowMs();
    if (next.id === S.me.id) {
        R.rev = Math.max(R.rev || 0, R.rosterRev || 0);
        S.lastRoster = 0; S.lastAnn = 0;
        syncLobbySub();
        note('Host sebelumnya keluar. Sekarang kamu menjadi host room.');
    }
}

function dropMember(id, why) {
    const R = S.room; if (!R || id === S.me.id) return;
    const idx = R.players.findIndex(function (p) { return p.id === id; });
    const wasHost = id === R.hostId;
    const name = idx >= 0 ? R.players[idx].name : '';
    if (idx >= 0) R.players.splice(idx, 1);
    delete R.lastSeen[id];
    if (S.race && S.race.active) racerGone(id, why);
    if (wasHost) electHost();
    if (R.hostId === S.me.id) { broadcastRoster(); announce(); }
    if (name && why === 'left') note(name + ' keluar dari room.');
    renderRoom();
    if (S.race && S.race.active) { syncLanes(); renderStrip(); if (S.view === 'result') renderResults(); checkFinalize(); }
}

function renderRoom() {
    const R = S.room; if (!R) return;
    const t = $('mp-room-title'); if (t) t.textContent = R.name;
    const c = $('mp-room-code'); if (c) c.textContent = R.code;
    const box = $('mp-seats'); if (!box) return;
    box.innerHTML = '';
    for (let i = 0; i < CFG.maxPlayers; i++) {
        const p = R.players[i];
        const row = document.createElement('div');
        const av = document.createElement('span'); av.className = 'mp-avatar';
        const nm = document.createElement('span'); nm.className = 'mp-seat-name';
        if (p) {
            row.className = 'mp-seat' + (p.id === S.me.id ? ' me' : '');
            av.textContent = p.avatar;
            nm.textContent = p.name + (p.id === S.me.id ? ' (Kamu)' : '');
            row.appendChild(av); row.appendChild(nm);
            if (p.id === R.hostId) { const h = document.createElement('span'); h.className = 'mp-badge host'; h.textContent = '👑 HOST'; row.appendChild(h); }
        } else {
            row.className = 'mp-seat empty';
            av.textContent = '🤖';
            nm.textContent = 'Slot kosong → diisi Bot';
            row.appendChild(av); row.appendChild(nm);
        }
        box.appendChild(row);
    }
    const n = R.players.length, isHost = R.hostId === S.me.id;
    const info = $('mp-room-info');
    if (info) info.textContent = 'Pemain: ' + n + '/' + CFG.maxPlayers + ' • ' + (n < CFG.minPlayers ? 'butuh minimal ' + CFG.minPlayers + ' pemain untuk mulai' : 'siap berlayar!') + ' • ' + (CFG.maxPlayers - n) + ' bot';
    const btn = $('mp-btn-start');
    if (btn) { btn.style.display = isHost ? '' : 'none'; btn.disabled = n < CFG.minPlayers || R.ph !== 'waiting' || !!(S.race && S.race.active && !S.race.final); }
    const w = $('mp-room-wait'); if (w) w.style.display = isHost ? 'none' : '';
    chatSync();   // CHAT ROOM (baru)
}

function copyCode() {
    const R = S.room; if (!R) return;
    playSound('click');
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(R.code).then(function () { note('Kode ' + R.code + ' disalin. Bagikan ke temanmu!'); }, function () { note('Kode room: ' + R.code); });
            return;
        }
    } catch (e) {}
    note('Kode room: ' + R.code);
}

function leaveRoomUI() {
    playSound('click');
    leaveRoomCore(true);
    backToLobbyView();
}

function backToLobbyView() {
    setView('lobby'); switchScreen('screen-mp-lobby');
    S.rooms = {}; renderLobbyList(); refreshLobbyControls();
    if (ready()) pub(lobbyTopic(), { t: 'who', from: S.me.id }, 0);
}

/* Keluar dari room (dan balapan bila ada). send=true -> beri tahu pemain lain. */
function leaveRoomCore(send) {
    cancelJoin();
    const R = S.room;
    if (R) {
        if (send && ready()) {
            const RC = S.race;
            if (RC && RC.active && !RC.myDone) { RC.me.steps = RC.me.steps || 0; RC.myDone = true; sendProg(true, 'quit'); }
            pub(roomTopic(R.code), { t: 'leave', from: S.me.id }, 1);
            if (R.hostId === S.me.id && R.players.length <= 1) pub(lobbyTopic(), { t: 'bye', id: R.code, from: S.me.id }, 0);
        }
        unsub(roomTopic(R.code));
    }
    S.room = null;
    secResetKeys();   // bug #4: lupakan kunci pemain room lama
    chatReset();   // CHAT ROOM (baru): hapus seluruh chat saat meninggalkan room
    teardownRace();
    if (S.view === 'room' || S.view === 'race' || S.view === 'result') setView('lobby'); else syncLobbySub();
    refreshLobbyControls();
}

function exitNet() {
    S.net.intentional = true;
    S.net.links.forEach(function (l) {
        clearTimeout(l.timer); l.gen++;
        const c = l.client; l.client = null; l.connected = false; l.state = 'idle';
        if (c) { try { c.end(false); } catch (e) { try { c.end(true); } catch (e2) {} } }
    });
    S.net.links = []; S.net.status = 'idle'; S.subs = {}; S.rooms = {}; S.net.seen = new Map();
    secResetKeys();
    stopTick();
}

function exitMultiplayer() {
    leaveRoomCore(true);
    exitNetAfterFlush();   // bug #4: tunggu pesan 'leave' selesai ditandatangani & terkirim
    setView('none');
}

/* =====================================================================
   BALAPAN
   ===================================================================== */
function makePlan(seed, bi, order) {
    const rng = mulberry32(((seed >>> 0) ^ Math.imul(0x9E3779B1, bi + 1)) >>> 0);
    const acc = CFG.botAccuracy[bi % CFG.botAccuracy.length];
    const byId = questionById();
    const times = [], right = [];
    let t = 0, ok = 0;
    for (let i = 0; i < order.length; i++) {
        const rg = CFG.botTimes[byId[order[i]].level] || CFG.botTimes.medium;
        t += (rg[0] + rng() * (rg[1] - rg[0])) * 1000 * CFG.botTimeScale;
        const good = rng() < acc;
        times.push(t); right.push(good); if (good) ok++;
    }
    return { times: times, right: right, total: t, finalSteps: ok };
}
function planStepsAt(plan, el) {
    let s = 0;
    for (let i = 0; i < plan.times.length && plan.times[i] <= el; i++) if (plan.right[i]) s++;
    return s;
}

function parseStart(m) {
    if (!Array.isArray(m.order) || m.order.length !== QUESTION_DATABASE.length) return null;
    const known = questionById(), seen = {}, order = [];
    for (let i = 0; i < m.order.length; i++) {
        const id = m.order[i];
        if (typeof id !== 'string' || !known[id] || seen[id]) return null;
        seen[id] = 1; order.push(id);
    }
    if (!Array.isArray(m.seats) || m.seats.length !== CFG.maxPlayers) return null;
    const seats = [], ids = {}; let bi = 0, humans = 0;
    for (let i = 0; i < CFG.maxPlayers; i++) {
        const s = m.seats[i];
        if (s && s.bot === true) {
            seats.push({ seat: i, id: null, bot: true, bi: bi, name: 'Bot ' + (bi + 1), avatar: '🤖', ship: CFG.botIcons[bi % CFG.botIcons.length] });
            bi++;
        } else {
            const p = cleanPlayer(s);
            if (!p || ids[p.id]) return null;
            ids[p.id] = 1; humans++;
            seats.push({ seat: i, id: p.id, bot: false, bi: -1, name: p.name, avatar: p.avatar, ship: p.ship });
        }
    }
    if (humans < CFG.minPlayers) return null;
    return { seed: Number(m.seed) >>> 0, order: order, seats: seats };
}

function buildRace(parsed) {
    const t = nowMs();
    const R = {
        seed: parsed.seed, order: parsed.order, seats: parsed.seats,
        racers: [], me: null, lanes: [], t0: 0,
        started: false, active: true, myDone: false, screenDone: false, final: false, rewarded: false, rewards: null,
        rank: 0, lastAnswerAt: 0, levelAtStart: 0, startCoins: 0, cdTimer: null
    };
    R.racers = parsed.seats.map(function (s) {
        return {
            seat: s.seat, id: s.id, name: s.name, avatar: s.avatar, ship: s.ship, bot: s.bot, bi: s.bi,
            plan: s.bot ? makePlan(parsed.seed, s.bi, parsed.order) : null,
            steps: 0, hp: 5, qi: 0, done: false, why: '', ms: Infinity, lastSeen: t
        };
    });
    R.me = R.racers.filter(function (r) { return !r.bot && r.id === S.me.id; })[0];
    return R;
}

function onStart(code, m, from) {
    const R = S.room;
    if (!R || R.code !== code || from !== R.hostId) return;
    const parsed = parseStart(m); if (!parsed) return;
    if (parsed.seed === S.lastSeed || (S.race && S.race.seed === parsed.seed)) return;      // duplikat / siaran ulang
    if (!parsed.seats.some(function (s) { return !s.bot && s.id === S.me.id; })) return;    // saya tidak ikut balapan ini
    if (S.race) {
        if (S.race.active && !S.race.screenDone) return;                                    // saya masih berlayar
        if (S.race.screenDone && !S.race.final) {                                           // balapan lama sudah berakhir bagi semua
            S.race.racers.forEach(function (r) { if (!r.bot && !r.done) { r.done = true; r.why = 'lost'; r.ms = Infinity; } });
            finalize();
        }
        teardownRace();
    }
    S.lastSeed = parsed.seed;
    R.ph = 'racing';
    S.race = buildRace(parsed);
    renderRoom();
    startCountdown();
}

function startRace() {
    const R = S.room;
    if (!R || R.hostId !== S.me.id) return;
    if (R.ph !== 'waiting' || (S.race && S.race.active && !S.race.final)) return;
    if (!ready()) { note('Belum terhubung ke server.'); return; }
    if (R.players.length < CFG.minPlayers) { note('Butuh minimal ' + CFG.minPlayers + ' pemain untuk memulai.'); return; }
    playSound('click');
    const seats = R.players.slice(0, CFG.maxPlayers).map(function (p) { return { id: p.id, name: p.name, avatar: p.avatar, ship: p.ship }; });
    while (seats.length < CFG.maxPlayers) seats.push({ bot: true });
    const msg = { t: 'start', from: S.me.id, seed: randSeed(), order: shuffleArray(QUESTION_DATABASE.map(function (q) { return q.id; })), seats: seats };
    R.ph = 'racing';
    pub(roomTopic(R.code), msg, 1);
    broadcastRoster(); announce();
    onStart(R.code, msg, S.me.id);
    [700, 1500].forEach(function (d) {
        setTimeout(function () {
            if (S.room === R && S.race && S.race.seed === (msg.seed >>> 0) && !S.race.started) pub(roomTopic(R.code), msg, 1);
        }, d);
    });
}

function startCountdown() {
    const R = S.race; if (!R) return;
    let n = CFG.countdownSec;
    setView('room');
    switchScreen('screen-mp-room');
    renderRoom();
    const box = $('mp-countdown'), num = $('mp-countdown-num');
    if (box) box.classList.add('active');
    const step = function () {
        if (S.race !== R || R.started) return;
        if (n > 0) { if (num) num.textContent = String(n); playSound('click'); n--; R.cdTimer = setTimeout(step, 1000); }
        else { if (num) num.textContent = '⛵'; R.cdTimer = setTimeout(function () { if (S.race === R) beginRace(); }, 600); }
    };
    step();
}

function beginRace() {
    const R = S.race; if (!R || R.started) return;
    const box = $('mp-countdown'); if (box) box.classList.remove('active');
    R.started = true; R.t0 = nowMs();
    R.racers.forEach(function (r) { r.lastSeen = R.t0; });
    setView('race');
    launchRaceGame();                                   // 1) fungsi asli: reset HP/skor & tampilkan layar balapan
    const byId = questionById();
    matchQuestions = R.order.map(function (id) { return byId[id]; });   // 2) paksa urutan soal yang sama dengan host
    currentQuestionIdx = 0;
    loadNextQuestion();
    R.levelAtStart = GameState.level;
    R.startCoins = matchStartCoins;
    setupLanes();
    syncLanes();
    renderStrip();
}

/* ---------- Lintasan: 3 kapal lain memakai slot "Bot 1/2/3" milik layar balapan ---------- */
function laneEls() { return [1, 2, 3].map(function (i) { return $('ship-bot' + i); }); }
function laneLabel(r) {
    return r.name + (r.bot ? '' : (r.why === 'dead' ? ' 💀' : (r.why === 'quit' ? ' ✖' : (r.why === 'lost' ? ' ⚠' : (r.done ? ' 🏁' : '')))));
}
function setupLanes() {
    const R = S.race; const els = laneEls();
    if (!S.laneOrig) S.laneOrig = els.map(function (el) { return { icon: el.textContent, label: el.nextElementSibling ? el.nextElementSibling.textContent : '' }; });
    R.lanes = R.racers.filter(function (r) { return r !== R.me; });
    R.lanes.forEach(function (r, k) {
        const el = els[k]; el.textContent = r.ship;
        const lab = el.nextElementSibling;
        if (lab) {
            lab.textContent = laneLabel(r);
            lab.style.maxWidth = '100%'; lab.style.overflow = 'hidden'; lab.style.whiteSpace = 'nowrap'; lab.style.textOverflow = 'ellipsis';
            lab.style.color = r.bot ? '' : '#ffd54f';
        }
    });
}
function restoreLanes() {
    if (S.laneOrig) {
        laneEls().forEach(function (el, k) {
            el.textContent = S.laneOrig[k].icon;
            const lab = el.nextElementSibling;
            if (lab) { lab.textContent = S.laneOrig[k].label; ['maxWidth', 'overflow', 'whiteSpace', 'textOverflow', 'color'].forEach(function (p) { lab.style[p] = ''; }); }
        });
        S.laneOrig = null;
    }
    const strip = $('mp-race-strip'); if (strip) strip.style.display = 'none';
}
function syncLanes() {
    const R = S.race; if (!R || !R.lanes.length) return;
    const els = laneEls();
    R.lanes.forEach(function (r, k) {
        botSteps[k] = r.steps;
        const lab = els[k].nextElementSibling;
        if (lab) { const t = laneLabel(r); if (lab.textContent !== t) lab.textContent = t; }
    });
    updateShipPositions();
}
function ensureStrip() {
    let el = $('mp-race-strip');
    if (!el) {
        el = document.createElement('div'); el.id = 'mp-race-strip';
        const panel = $('quiz-panel-box');
        if (panel && panel.parentNode) panel.parentNode.insertBefore(el, panel);
    }
    return el;
}
function renderStrip() {
    const R = S.race; const el = ensureStrip();
    if (!R || !R.started || R.final || S.view !== 'race') { el.style.display = 'none'; return; }
    el.style.display = 'flex'; el.innerHTML = '';
    ranking(R).forEach(function (x, i) {
        const c = document.createElement('div');
        c.className = 'mp-strip-cell' + (x.r === R.me ? ' me' : '');
        c.textContent = (i + 1) + '. ' + x.r.name + ' ' + x.steps;
        el.appendChild(c);
    });
}

/* ---------- Peringkat ---------- */
function msOf(r) {
    if (r.bot) return r.done ? r.plan.total : Infinity;
    return r.done && isFinite(r.ms) ? r.ms : Infinity;
}
function cmpMs(a, b) { if (a === b) return 0; if (a === Infinity) return 1; if (b === Infinity) return -1; return a - b; }
function ranking(R) {
    const arr = R.racers.map(function (r) { return { r: r, steps: r.steps, ms: msOf(r) }; });
    arr.sort(function (a, b) { return (b.steps - a.steps) || cmpMs(a.ms, b.ms) || (a.r.seat - b.r.seat); });
    return arr;
}
function myRank(R) { const a = ranking(R); for (let i = 0; i < a.length; i++) if (a[i].r === R.me) return i + 1; return 4; }

/* ---------- Kemajuan pemain ---------- */
function sendProg(done, why) {
    const R = S.race; if (!R || !S.room) return;
    const me = R.me;
    if (done) {
        if (me.done) return;
        me.done = true; me.why = why;
        me.ms = Math.max(0, (why === 'quit' ? nowMs() : (R.lastAnswerAt || nowMs())) - R.t0);
    }
    const msg = { t: 'prog', from: S.me.id, steps: me.steps, hp: me.hp, qi: me.qi, done: !!done };
    if (done) { msg.why = why; msg.ms = Math.round(me.ms); }
    pub(roomTopic(S.room.code), msg, 1);
}

function onMyAnswered() {
    const R = S.race, me = R.me;
    me.qi++; me.steps = playerSteps; me.hp = GameState.hp; R.lastAnswerAt = nowMs();
    const dead = GameState.hp <= 0;
    const complete = !dead && currentQuestionIdx >= matchQuestions.length;
    if (dead || complete) { R.myDone = true; sendProg(true, dead ? 'dead' : 'complete'); }
    else sendProg(false);
    renderStrip();
}

function onProg(code, m, from) {
    const R = S.race;
    if (!R || !S.room || S.room.code !== code) return;
    const r = R.racers.filter(function (x) { return !x.bot && x.id === from; })[0];
    if (!r || r === R.me) return;
    r.lastSeen = nowMs();
    const qi = clampInt(m.qi, 0, R.order.length);
    const steps = Math.min(clampInt(m.steps, 0, R.order.length), qi);
    if (qi < r.qi) return;                          // pesan basi
    if (r.done && r.why === 'lost' && !R.final) { r.done = false; r.why = ''; r.ms = Infinity; }   // bug #1: ternyata masih hidup (mis. baru kembali dari background)
    if (!r.done) {
        r.qi = qi; r.steps = Math.max(r.steps, steps); r.hp = clampInt(m.hp, 0, 5);
        if (m.done === true) {
            r.done = true;
            r.why = (m.why === 'dead' || m.why === 'quit') ? m.why : 'complete';
            r.ms = clampNum(m.ms, 0, 7200000);
        }
    }
    syncLanes(); renderStrip();
    if (S.view === 'result') renderResults();
    checkFinalize();
}

function racerGone(id, why) {
    const R = S.race; if (!R) return;
    const r = R.racers.filter(function (x) { return !x.bot && x.id === id; })[0];
    if (!r || r === R.me) return;
    if (!r.done) { r.done = true; r.why = why === 'lost' ? 'lost' : 'quit'; r.ms = Infinity; }
}

/* =====================================================================
   PEMULIHAN SETELAH APLIKASI DI BACKGROUND  (perbaikan bug #1)
   Di ponsel, halaman yang pindah ke background dibekukan (timer berhenti) dan WebSocket bisa mati tanpa event 'close'
   (terutama iOS Safari). Tanpa penanganan ini, saat kembali ke game SEMUA pemain lain tampak "diam" selama itu dan
   langsung dianggap hilang. Solusi: setiap kali halaman dilanjutkan, mulai ulang hitungan kehadiran dan sambung ulang link.
   ===================================================================== */
function presenceReset() {
    const t = nowMs();
    const R = S.room;
    if (R) {
        R.hostSeen = t;
        Object.keys(R.lastSeen).forEach(function (k) { R.lastSeen[k] = t; });
    }
    if (S.race) S.race.racers.forEach(function (r) { if (!r.bot) r.lastSeen = t; });
}
function resumeGrace(reconnect) {
    presenceReset();
    S.lastTickAt = nowMs();
    S.lastHb = 0;                                                   // kirim denyut segera
    if (reconnect && !S.net.intentional) S.net.links.forEach(function (l) { l.tries = 0; openLink(l); });
}

/* ---------- Tick: bot, kehadiran, denyut ---------- */
function startTick() { if (!S.tickTimer) { S.lastTickAt = 0; S.tickTimer = setInterval(tick, 500); } }
function stopTick() { clearInterval(S.tickTimer); S.tickTimer = null; }

function tick() {
    const t = nowMs();
    const gap = t - (S.lastTickAt || t);
    S.lastTickAt = t;
    if (gap > CFG.resumeGapMs) resumeGrace(gap > 10000);          // bug #1: halaman baru dilanjutkan dari pembekuan
    secPrepareLeave();                                            // bug #7: siapkan paket 'leave' bertanda tangan
    const R = S.room;
    if (R && ready()) {
        if (t - S.lastHb >= CFG.hbMs) { S.lastHb = t; pub(roomTopic(R.code), { t: 'hb', from: S.me.id }, 0); }
        if (R.hostId === S.me.id) {
            if (t - S.lastRoster >= CFG.rosterMs) broadcastRoster();
            if (t - S.lastAnn >= CFG.lobbyAnnounceMs) announce();
        }
    }
    if (pruneRooms(t) && S.view === 'lobby') renderLobbyList();
    if (R && ready() && !(S.race && S.race.active)) {
        if (R.hostId === S.me.id) {
            R.players.slice().forEach(function (p) { if (p.id !== S.me.id && t - (R.lastSeen[p.id] || 0) > CFG.waitLostMs) dropMember(p.id, 'lost'); });
        } else if (t - R.hostSeen > CFG.hostLostMs) {
            dropMember(R.hostId, 'lost');
        }
    }
    raceTick(t);
    if (S.joining) refreshLobbyControls();
}

function raceTick(t) {
    const RC = S.race;
    if (!RC || !RC.started || RC.final) return;
    const el = t - RC.t0;
    RC.racers.forEach(function (r) {
        if (r.bot) { r.steps = planStepsAt(r.plan, el); if (!r.done && el >= r.plan.total) { r.done = true; } }
    });
    if (ready()) {
        RC.racers.forEach(function (r) {
            if (!r.bot && r !== RC.me && !r.done && t - r.lastSeen > CFG.raceLostMs) dropMember(r.id, 'lost');
        });
    }
    if (S.race !== RC) return;
    syncLanes(); renderStrip();
    if (S.view === 'result') renderResults();
    checkFinalize();
}

/* ---------- Selesai & hasil ---------- */
function mpFinishScreen(why) {
    const R = S.race; if (!R || R.screenDone) return;
    if (!R.myDone) { R.me.steps = playerSteps; R.me.hp = GameState.hp; R.lastAnswerAt = nowMs(); R.myDone = true; sendProg(true, why); }
    R.screenDone = true;
    // netralkan sisa alur mode lama (timer, soal berikutnya, tombol keluar)
    matchEnded = true; raceSession++; isAnsweringLocked = true;
    if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }
    setView('result');
    switchScreen('screen-mp-results');
    renderResults();
    checkFinalize();
}

function checkFinalize() {
    const R = S.race;
    if (!R || R.final || !R.screenDone) return;
    if (R.racers.some(function (r) { return !r.bot && !r.done; })) return;
    finalize();
}

function applyRewards(R) {
    if (R.rewarded) return; R.rewarded = true;
    const why = R.me.why;
    let xp = 0, coins = 0;
    GameState.matches++;
    if (why === 'dead') {
        coins = 50; GameState.coins += coins;                       // sama seperti layar GAME OVER mode lama
    } else {
        const b = VICTORY_BONUS[Math.min(R.rank, 4)];
        xp = b.xp; coins = b.coins;
        GameState.coins += coins; GameState.xp += xp;
        while (GameState.xp >= GameState.level * 100) GameState.level++;
        if (R.rank === 1) GameState.wins++;
        const score = GameState.coins - R.startCoins, mine = getPlayerName();
        const ex = GameState.leaderboard.find(function (l) { return l.name === mine; });
        if (ex) { if (score > ex.score) ex.score = score; } else GameState.leaderboard.push({ name: mine, score: score });
        GameState.leaderboard.sort(function (a, b) { return b.score - a.score; });
        GameState.leaderboard = GameState.leaderboard.slice(0, 5);
        submitGlobalScore('multi', score);   // papan peringkat GLOBAL (multiplayer)
    }
    try { saveGameState(); } catch (e) {}
    R.rewards = { xp: xp, coins: coins };
    if (GameState.level > R.levelAtStart) O.showAlert('LEVEL UP!', 'Selamat! Kapten naik ke Level ' + GameState.level + '!');
}

function finalize() {
    const R = S.race; if (!R || R.final) return;
    R.racers.forEach(function (r) { if (r.bot) { r.steps = r.plan.finalSteps; r.done = true; } });
    R.final = true;
    R.rank = myRank(R);
    applyRewards(R);
    // kabar untuk js/pixel-fx.js: bonus koin kapal dibayar sesudah hadiah peringkat (tidak ikut skor papan peringkat)
    try { window.dispatchEvent(new CustomEvent('mp:final', { detail: { why: R.me.why, rank: R.rank } })); } catch (e) {}
    syncLanes();
    const strip = $('mp-race-strip'); if (strip) strip.style.display = 'none';
    if (S.room && S.room.hostId === S.me.id) { S.room.ph = 'waiting'; broadcastRoster(); announce(); }
    renderRoom();
    if (S.view === 'result') { renderResults(); }
    if (R.me.why === 'complete') playSound('victory');
}

function statusText(r) {
    if (r.bot) return r.done ? '🤖 selesai' : '🤖 berlayar';
    if (r.why === 'dead') return '💀 tersingkir';
    if (r.why === 'quit') return '🚪 keluar';
    if (r.why === 'lost') return '📡 terputus';
    if (r.done) return '🏁 selesai';
    return '⛵ berlayar';
}

function renderResults() {
    const R = S.race; if (!R) return;
    const list = ranking(R), box = $('mp-res-list'); if (!box) return;
    box.innerHTML = '';
    list.forEach(function (x, i) {
        const r = x.r, row = document.createElement('div');
        row.className = 'mp-res-row' + (r === R.me ? ' me' : '');
        const rk = document.createElement('span'); rk.className = 'mp-res-rank'; rk.textContent = '#' + (i + 1);
        const av = document.createElement('span'); av.className = 'mp-avatar'; av.textContent = r.bot ? '🤖' : r.avatar;
        const nm = document.createElement('span'); nm.className = 'mp-res-name'; nm.textContent = r.name + (r === R.me ? ' (Kamu)' : '');
        const sc = document.createElement('span'); sc.className = 'mp-res-score'; sc.textContent = x.steps + '/' + R.order.length;
        const st = document.createElement('span'); st.className = 'mp-res-status'; st.textContent = statusText(r);
        row.appendChild(rk); row.appendChild(av); row.appendChild(nm); row.appendChild(sc); row.appendChild(st);
        box.appendChild(row);
    });
    const title = $('mp-res-title'), sub = $('mp-res-sub'), rw = $('mp-res-reward'), back = $('mp-res-back');
    if (!R.final) {
        const waiting = R.racers.filter(function (r) { return !r.bot && !r.done; }).length;
        if (title) title.textContent = '⏳ MENUNGGU PEMAIN LAIN';
        if (sub) sub.textContent = (R.me.why === 'dead' ? 'Nyawamu habis, tapi balapan masih berlanjut. ' : 'Kamu sudah selesai! ') + 'Menunggu ' + waiting + ' pemain... Peringkat di bawah masih sementara.';
        if (rw) rw.textContent = '';
        if (back) back.style.display = 'none';
    } else {
        const rank = R.rank;
        if (title) title.textContent = R.me.why === 'dead' ? '💀 GAME OVER — PERINGKAT #' + rank : (rank === 1 ? '🏆 JUARA 1!' : '🏁 PERINGKAT #' + rank);
        if (sub) sub.textContent = 'Balapan multiplayer selesai. Peringkat ditentukan dari jumlah jawaban benar, lalu waktu tercepat.';
        if (rw && R.rewards) rw.textContent = R.rewards.xp > 0 ? 'Bonus: +' + R.rewards.xp + ' XP • +' + R.rewards.coins + ' 🪙' : 'Bonus: +' + R.rewards.coins + ' 🪙';
        if (back) back.style.display = S.room ? '' : 'none';
    }
}

function resultsBackToRoom() {
    playSound('click');
    const R = S.race;
    if (R && !R.final) return;
    teardownRace();
    if (!S.room) { backToLobbyView(); return; }
    setView('room'); switchScreen('screen-mp-room'); renderRoom();
}

function resultsExit() {
    playSound('click');
    const R = S.race;
    if (R && !R.final) {
        showConfirm('KELUAR SEKARANG?', 'Hasil akhir belum lengkap. Jika keluar sekarang, kamu tidak mendapat hadiah peringkat.', function () {
            leaveRoomCore(true); backToLobbyView();
        });
        return;
    }
    leaveRoomCore(true);
    backToLobbyView();
}

function teardownRace() {
    const R = S.race;
    if (R) { clearTimeout(R.cdTimer); R.active = false; }
    S.race = null;
    const box = $('mp-countdown'); if (box) box.classList.remove('active');
    restoreLanes();
}

/* ---------- Keluar di tengah balapan (tombol ✖ di layar balapan) ---------- */
function mpQuitRace() {
    const R = S.race;
    if (R && !R.myDone) { R.me.steps = playerSteps; R.me.hp = GameState.hp; R.myDone = true; sendProg(true, 'quit'); }
    leaveRoomCore(true);
    exitNetAfterFlush();   // bug #4: tunggu pesan 'leave'/'quit' terkirim
    setView('none');
    O.quitRace();                         // bersihkan sisa balapan lama & kembali ke menu
    switchScreen('screen-main-menu');
}

/* =====================================================================
   WRAPPER FUNGSI LAMA (aktif hanya saat balapan multiplayer berjalan)
   ===================================================================== */
function inMpRace() { const R = S.race; return !!(R && R.started && R.active); }

handleAnswer = function (isCorrect, isTimeout) {
    const R = S.race;
    if (!(R && R.started && R.active && !R.myDone)) return O.handleAnswer.apply(this, arguments);
    const before = { idx: currentQuestionIdx, hp: GameState.hp };
    const keep = botSteps.slice();
    const out = O.handleAnswer.apply(this, arguments);
    for (let i = 0; i < keep.length; i++) botSteps[i] = keep[i];    // kemajuan bot acak milik mode lama dibatalkan
    if (currentQuestionIdx > before.idx || GameState.hp < before.hp) onMyAnswered();
    syncLanes();
    return out;
};

showVictory = function () {
    if (inMpRace()) { mpFinishScreen('complete'); return; }
    return O.showVictory.apply(this, arguments);
};

showGameOver = function () {
    if (inMpRace()) { mpFinishScreen('dead'); return; }
    return O.showGameOver.apply(this, arguments);
};

confirmQuitRace = function () {
    if (!inMpRace() || S.race.screenDone) return O.confirmQuitRace.apply(this, arguments);
    if (matchEnded) return;
    playSound('click');
    showConfirm('KELUAR DARI ROOM?', 'Kamu akan meninggalkan balapan multiplayer. Kapalmu berhenti di posisi sekarang. Koin & XP yang sudah didapat tetap tersimpan.', mpQuitRace);
};

quitRace = function () {
    if (inMpRace()) { mpQuitRace(); return; }
    return O.quitRace.apply(this, arguments);
};

showAlert = function (title, text) {
    // Popup LEVEL UP di tengah balapan multiplayer ditunda ke layar hasil (agar tidak menjeda timer soal)
    if (inMpRace() && !S.race.screenDone && title === 'LEVEL UP!') return;
    return O.showAlert.apply(this, arguments);
};

/* =====================================================================
   CHAT ROOM (TAMBAHAN BARU) — obrolan real-time di ruang tunggu
   ---------------------------------------------------------------------
   • Pesan dikirim lewat topik room yang sama (tipe 'chat'), tanpa flag "retain":
     broker publik TIDAK menyimpan pesan sama sekali.
   • Riwayat chat hanya ada di memori tiap pemain yang masih berada di room (tidak ada
     localStorage / server). Begitu pemain keluar (tombol keluar, dikeluarkan, putus, tutup
     tab), riwayatnya dihapus lewat chatReset(). Jika semua pemain sudah keluar, tidak ada
     lagi salinan chat di mana pun -> chat otomatis terhapus seluruhnya.
   • Pemain yang baru masuk meminta riwayat ke host ('chatreq' -> 'chathist'); jika host
     berganti, host baru sudah memegang riwayat yang sama.
   • Nama & avatar pengirim diambil dari daftar pemain room (bukan dari isi pesan), dan
     pesan dari non-anggota diabaikan. Isi pesan hanya dirender lewat textContent.
   ===================================================================== */
const CHAT = { code: null, msgs: [], lastSend: 0, asked: false, histDone: false };
const CHAT_MAX_LEN = 100, CHAT_KEEP = 60, CHAT_HIST = 30, CHAT_COOLDOWN_MS = 700;

function cleanChatText(raw) {
    const cleaned = String(raw == null ? '' : raw)
        .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\uFEFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return Array.from(cleaned).slice(0, CHAT_MAX_LEN).join('').trim();
}
function chatMember(id) {
    const R = S.room; if (!R) return null;
    return R.players.filter(function (p) { return p.id === id; })[0] || null;
}
function chatBuildRow(msg) {
    const row = document.createElement('div'); row.className = 'mp-chat-msg' + (msg.mine ? ' mine' : '');
    const who = document.createElement('span'); who.className = 'mp-chat-who'; who.textContent = msg.avatar + ' ' + (msg.mine ? 'Kamu' : msg.name);
    const tx = document.createElement('span'); tx.className = 'mp-chat-text'; tx.textContent = msg.text;
    row.appendChild(who); row.appendChild(tx);
    return row;
}
function chatRender() {
    const log = $('mp-chat-log'); if (!log) return;
    log.innerHTML = '';
    if (!CHAT.msgs.length) {
        const e = document.createElement('div'); e.className = 'mp-chat-empty';
        e.textContent = 'Belum ada pesan. Sapa pemain lain! 👋 Chat otomatis terhapus saat semua pemain sudah keluar dari room.';
        log.appendChild(e);
        return;
    }
    CHAT.msgs.forEach(function (m) { log.appendChild(chatBuildRow(m)); });
    log.scrollTop = log.scrollHeight;
}
function chatAdd(msg) {
    CHAT.msgs.push(msg);
    while (CHAT.msgs.length > CHAT_KEEP) CHAT.msgs.shift();
    const log = $('mp-chat-log'); if (!log) return;
    const empty = log.querySelector('.mp-chat-empty');
    if (empty) log.removeChild(empty);
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.appendChild(chatBuildRow(msg));
    while (log.children.length > CHAT_KEEP) log.removeChild(log.firstChild);
    if (nearBottom || msg.mine) log.scrollTop = log.scrollHeight;
}
/* Hapus seluruh chat milik saya (dipanggil setiap kali saya meninggalkan room). */
function chatReset() {
    CHAT.code = null; CHAT.msgs = []; CHAT.lastSend = 0; CHAT.asked = false; CHAT.histDone = false;
    const inp = $('mp-chat-input'); if (inp) inp.value = '';
    chatRender();
}
/* Dipanggil dari renderRoom(): pastikan chat sesuai room saat ini & minta riwayat bila baru masuk. */
function chatSync() {
    const R = S.room;
    if (!R) { if (CHAT.code !== null || CHAT.msgs.length) chatReset(); return; }
    if (CHAT.code !== R.code) { chatReset(); CHAT.code = R.code; }
    if (!CHAT.asked && R.hostId !== S.me.id && ready()) {
        CHAT.asked = true;
        pub(roomTopic(R.code), { t: 'chatreq', from: S.me.id }, 1);
    }
}
function chatOnMsg(code, m, from) {
    const R = S.room; if (!R || R.code !== code) return;
    if (CHAT.code !== R.code) { CHAT.code = R.code; CHAT.msgs = []; CHAT.histDone = false; chatRender(); }
    if (m.t === 'chat') {
        const p = chatMember(from); if (!p) return;                 // hanya anggota room
        const text = cleanChatText(m.text); if (!text) return;
        chatAdd({ from: from, name: p.name, avatar: p.avatar, text: text, mine: false });
    } else if (m.t === 'chatreq') {
        if (R.hostId !== S.me.id || !chatMember(from) || !CHAT.msgs.length) return;   // hanya host yang menjawab
        pub(roomTopic(R.code), { t: 'chathist', from: S.me.id, to: from, msgs: CHAT.msgs.slice(-CHAT_HIST).map(function (x) {
            return { f: x.from, n: x.name, a: x.avatar, x: x.text };
        }) }, 1);
    } else if (m.t === 'chathist') {
        if (m.to !== S.me.id || from !== R.hostId || !Array.isArray(m.msgs) || CHAT.histDone) return;
        CHAT.histDone = true;
        const old = [];
        m.msgs.slice(-CHAT_HIST).forEach(function (x) {
            if (!x || typeof x.f !== 'string' || !ID_RE.test(x.f)) return;
            const text = cleanChatText(x.x); if (!text) return;
            old.push({ from: x.f, name: sanitizePlayerName(x.n), avatar: cleanAvatar(x.a), text: text, mine: x.f === S.me.id });
        });
        CHAT.msgs = old.concat(CHAT.msgs).slice(-CHAT_KEEP);
        chatRender();
    }
}
function sendChat() {
    const R = S.room, inp = $('mp-chat-input'); if (!R || !inp) return;
    const text = cleanChatText(inp.value);
    if (!text) { inp.value = ''; return; }
    const t = nowMs();
    if (t - CHAT.lastSend < CHAT_COOLDOWN_MS) { note('Pelan-pelan, Kapten! Tunggu sebentar sebelum kirim pesan lagi.'); return; }
    if (!ready()) { note('Belum terhubung ke server, pesan belum terkirim.'); return; }
    CHAT.lastSend = t;
    pub(roomTopic(R.code), { t: 'chat', from: S.me.id, text: text }, 1);
    chatAdd({ from: S.me.id, name: getPlayerName(), avatar: cleanAvatar(GameState.playerAvatar), text: text, mine: true });
    inp.value = '';
    try { inp.focus(); } catch (e) {}
}

/* =====================================================================
   KELUARKAN PEMAIN (TAMBAHAN BARU) — host bisa mengeluarkan pemain dari ruang tunggu;
   pemain itu tidak bisa masuk lagi ke room tersebut selama 1 menit.
   ---------------------------------------------------------------------
   • Dibuat sebagai "wrapper" fungsi lama (tanpa mengubah isi fungsi lama):
     hostOnJoin, onRoomMsg, onDeny, joinRoom, renderRoom, leaveRoomCore.
   • Host mengirim pesan 'kick' ke seluruh room. Semua anggota mencatat larangan itu
     (jadi bila host berganti, host baru tetap menegakkan larangannya).
   • Penegakan utama ada di host: permintaan 'join' dari pemain yang dilarang ditolak
     dengan alasan 'banned'. Pemain yang dikeluarkan juga menyimpan larangan di perangkatnya
     (localStorage) supaya tidak bisa menembusnya hanya dengan memuat ulang halaman.
   ===================================================================== */
const KICK_BAN_MS = 60000, KICK_LS = 'pirate-edurace-kickban';
const KICK = { ids: {}, me: {} };    // ids: kode room -> {id pemain: waktu bebas}; me: kode room -> waktu bebas (untuk saya)

function kickLoad() {
    try {
        const o = JSON.parse(localStorage.getItem(KICK_LS) || '{}'), t = nowMs();
        Object.keys(o).forEach(function (c) {
            const u = Number(o[c]);
            if (CODE_RE.test(c) && isFinite(u) && u > t && u - t <= KICK_BAN_MS) KICK.me[c] = u;
        });
    } catch (e) {}
}
function kickSave() {
    try {
        const t = nowMs(), o = {};
        Object.keys(KICK.me).forEach(function (c) { if (KICK.me[c] > t) o[c] = KICK.me[c]; else delete KICK.me[c]; });
        if (Object.keys(o).length) localStorage.setItem(KICK_LS, JSON.stringify(o)); else localStorage.removeItem(KICK_LS);
    } catch (e) {}
}
function kickIdLeft(code, id) {            // sisa waktu larangan seorang pemain di room ini (ms), 0 jika tidak dilarang
    const b = KICK.ids[code]; if (!b || !b[id]) return 0;
    const left = b[id] - nowMs();
    if (left <= 0) { delete b[id]; return 0; }
    return left;
}
function kickMeLeft(code) {
    const u = KICK.me[code]; if (!u) return 0;
    const left = u - nowMs();
    if (left <= 0) { delete KICK.me[code]; kickSave(); return 0; }
    return left;
}
function kickSecs(ms) { return clampInt(Math.ceil(ms / 1000), 1, Math.round(KICK_BAN_MS / 1000)); }
function kickBanMe(code, ms) { KICK.me[code] = nowMs() + clampInt(ms, 1000, KICK_BAN_MS); kickSave(); }

/* -- sisi host: tombol & eksekusi -- */
function kickPlayer(id) {
    const R = S.room; if (!R || R.hostId !== S.me.id || id === S.me.id) return;
    const p = chatMember(id); if (!p) return;
    if (R.ph !== 'waiting' || (S.race && S.race.active)) { note('Pemain hanya bisa dikeluarkan saat di ruang tunggu.'); return; }
    playSound('click');
    showConfirm('KELUARKAN PEMAIN?', p.name + ' akan dikeluarkan dan tidak bisa masuk lagi ke room ini selama 1 menit.', function () { doKick(id); });
}
function doKick(id) {
    const R = S.room; if (!R || R.hostId !== S.me.id || id === S.me.id) return;
    const p = chatMember(id); if (!p) return;
    if (R.ph !== 'waiting' || (S.race && S.race.active)) return;
    KICK.ids[R.code] = KICK.ids[R.code] || {};
    KICK.ids[R.code][id] = nowMs() + KICK_BAN_MS;
    pub(roomTopic(R.code), { t: 'kick', from: S.me.id, to: id, ms: KICK_BAN_MS }, 1);
    dropMember(id, 'kicked');               // hapus dari daftar, siarkan roster baru, perbarui tampilan
    note(p.name + ' dikeluarkan. Ia tidak bisa masuk lagi selama 1 menit.');
}

/* -- sisi semua anggota: menerima pesan 'kick' -- */
function kickOnMsg(code, m) {
    const R = S.room; if (!R || R.code !== code) return;
    const from = (typeof m.from === 'string' && ID_RE.test(m.from)) ? m.from : null;
    if (!from || from === S.me.id || from !== R.hostId) return;                    // hanya host yang sah
    const to = (typeof m.to === 'string' && ID_RE.test(m.to)) ? m.to : null;
    if (!to) return;
    if (to === S.me.id) {                                                          // sayalah yang dikeluarkan
        kickBanMe(code, KICK_BAN_MS);
        leaveRoomCore(false);
        backToLobbyView();
        showAlert('KAMU DIKELUARKAN', 'Host mengeluarkanmu dari room ' + code + '. Kamu bisa mencoba masuk lagi setelah 1 menit.');
        return;
    }
    KICK.ids[code] = KICK.ids[code] || {};                                          // catat larangan agar host baru pun bisa menegakkannya
    KICK.ids[code][to] = nowMs() + KICK_BAN_MS;
}

/* -- Wrapper fungsi lama -- */
const KO = { hostOnJoin: hostOnJoin, onRoomMsg: onRoomMsg, onDeny: onDeny, joinRoom: joinRoom, renderRoom: renderRoom, leaveRoomCore: leaveRoomCore };

hostOnJoin = function (code, m) {              // host menolak permintaan masuk dari pemain yang masih dilarang
    const R = S.room;
    if (R && R.code === code && R.hostId === S.me.id && m && typeof m.from === 'string') {
        const left = kickIdLeft(code, m.from);
        if (left > 0) { pub(roomTopic(code), { t: 'deny', from: S.me.id, to: m.from, why: 'banned', ms: left }, 1); return; }
    }
    return KO.hostOnJoin.apply(this, arguments);
};

onRoomMsg = function (code, m) {
    if (m && m.t === 'kick') kickOnMsg(code, m);
    return KO.onRoomMsg.apply(this, arguments);
};

onDeny = function (code, m) {
    if (m && m.why === 'banned') {
        if (m.to !== S.me.id || !S.joining || S.joining.code !== code) return;
        const ms = clampInt(m.ms, 1000, KICK_BAN_MS);
        cancelJoin();
        kickBanMe(code, ms);
        showAlert('BELUM BISA MASUK', 'Kamu dikeluarkan oleh host room ' + code + '. Coba lagi dalam ' + kickSecs(ms) + ' detik.');
        return;
    }
    return KO.onDeny.apply(this, arguments);
};

joinRoom = function (code) {                   // cek lokal dulu agar tidak perlu menunggu jawaban host
    const c = normCode(code), left = c.length === 5 ? kickMeLeft(c) : 0;
    if (left > 0) {
        playSound('click');
        showAlert('BELUM BISA MASUK', 'Kamu baru dikeluarkan dari room ' + c + '. Coba lagi dalam ' + kickSecs(left) + ' detik.');
        return;
    }
    return KO.joinRoom.apply(this, arguments);
};

renderRoom = function () {                     // setelah daftar pemain digambar, host mendapat tombol KELUARKAN
    const out = KO.renderRoom.apply(this, arguments);
    const R = S.room, box = $('mp-seats');
    if (R && box && R.hostId === S.me.id && R.ph === 'waiting' && !(S.race && S.race.active)) {
        R.players.forEach(function (p, i) {
            const row = box.children[i];
            if (!row || p.id === S.me.id) return;
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'pixel-btn mp-btn-xs mp-kick-btn'; b.textContent = 'KELUARKAN';
            b.title = 'Keluarkan ' + p.name;
            b.addEventListener('click', function () { kickPlayer(p.id); });
            row.appendChild(b);
        });
    }
    return out;
};

leaveRoomCore = function () {                  // catatan larangan hanya berlaku selama saya ada di room itu
    const R = S.room;
    if (R) delete KICK.ids[R.code];
    return KO.leaveRoomCore.apply(this, arguments);
};

kickLoad();

/* =====================================================================
   INISIALISASI & API PUBLIK
   ===================================================================== */
S.me.id = randId(8);

/* bug #1: tanda kembali dari background. iOS memulihkan halaman dari bfcache lewat 'pageshow' tanpa 'visibilitychange'. */
document.addEventListener('visibilitychange', function () {
    const t = nowMs();
    if (document.visibilityState === 'hidden') { S.hiddenAt = t; return; }
    const away = S.hiddenAt ? t - S.hiddenAt : 0;
    S.hiddenAt = 0;
    if (S.room || S.joining || S.net.links.length) resumeGrace(away > 5000);
});
window.addEventListener('pageshow', function (e) {
    if (e && e.persisted && (S.room || S.joining || S.net.links.length)) resumeGrace(true);
});

window.addEventListener('pagehide', function (e) {
    if (e && e.persisted) return;
    try { if (S.room) secFinalLeave(S.room.code); } catch (err) {}   // bug #7: kirim 'leave' yang sudah ditandatangani (sinkron)
    try { if (S.room) leaveRoomCore(true); } catch (err) {}
    try { S.net.links.forEach(function (l) { if (l.client) l.client.end(true); }); } catch (err) {}
});

window.MP = {
    openLobby: openLobby, backFromLobby: backFromLobby, refresh: refresh, retryConnect: retryConnect,
    openCreate: openCreate, closeCreate: closeCreate, doCreate: doCreate,
    joinByCode: joinByCode, joinRoom: joinRoom,
    startRace: startRace, leaveRoomUI: leaveRoomUI, copyCode: copyCode, sendChat: sendChat,
    resultsBackToRoom: resultsBackToRoom, resultsExit: resultsExit,
    cfg: CFG, _state: S, _internals: { makePlan: makePlan, planStepsAt: planStepsAt, ranking: ranking, parseStart: parseStart }
};
})();

import hashlib, sys

# Diterapkan oleh GitHub Actions pada index.html di repo. Berhenti (exit 1) bila versi awal atau hasil akhir tidak sesuai.
SRC = 'index.html'
OUT = 'index.html'
SHA_AWAL = '8e34f41c4898bf70e3947dd9be8a40df85a46e4e'
SHA_AKHIR = 'fd3d02e4f58ebbbd084f9f0c375bf910bf6e514f'


def blob_sha(text):
    data = text.encode('utf-8')
    return hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest()


src = open(SRC, encoding='utf-8', newline='').read()
if blob_sha(src) != SHA_AWAL:
    print('GAGAL: index.html bukan versi awal yang diharapkan (%s)' % blob_sha(src))
    sys.exit(1)


def rep(old, new, label):
    global src
    n = src.count(old)
    if n != 1:
        print('GAGAL (%d kecocokan): %s' % (n, label))
        sys.exit(1)
    src = src.replace(old, new)
    print('ok:', label)


# ---------------------------------------------------------------- CFG
rep(r'''    waitLostMs: 20000,       // pemain di ruang tunggu dianggap hilang
    hostLostMs: 15000,       // host dianggap hilang
    raceLostMs: 30000,       // pemain saat balapan dianggap terputus
''', r'''    // PERBAIKAN bug #1: ambang dinaikkan agar pemain yang hanya pindah aplikasi sebentar (mis. membagikan kode room
    // lewat WhatsApp) tidak langsung dianggap hilang. Ponsel membekukan halaman di background, jadi 15-20 dtk terlalu pendek.
    waitLostMs: 45000,       // pemain di ruang tunggu dianggap hilang
    hostLostMs: 45000,       // host dianggap hilang
    raceLostMs: 45000,       // pemain saat balapan dianggap terputus
    resumeGapMs: 2500,       // jeda tick lebih lama dari ini = halaman baru saja dibekukan/dilanjutkan
    signMessages: true,      // PERBAIKAN bug #4: tanda tangan digital di setiap pesan (false = mode lama tanpa tanda tangan)
''', 'CFG')

# ---------------------------------------------------------------- blok keamanan (disisipkan sebelum ready())
SEC_BLOCK = r'''/* =====================================================================
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
    txQ: Promise.resolve(), rxQ: Promise.resolve(), pending: 0, netGen: 0
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
/* @@SEC-END */
'''
rep('function ready() { return S.net.links.some(function (l) { return l.connected; }); }\n',
    SEC_BLOCK + 'function ready() { return S.net.links.some(function (l) { return l.connected; }); }\n',
    'blok SEC')

# ---------------------------------------------------------------- connect()
rep(r'''function connect() {
    S.net.intentional = false;
    if (S.net.links.length) { updateNetStatus(); return; }          // koneksi sudah berjalan
    setNetStatus('connecting', 'Memuat library koneksi...');
    loadMqttLib().then(function (ok) {
        if (S.net.intentional) return;
        if (!ok) { setNetStatus('failed', 'Gagal memuat library koneksi. Periksa internet lalu coba lagi.'); return; }
        if (S.net.links.length) return;
''', r'''function connect() {
    SEC.netGen++;                                                   // PERBAIKAN bug #4: batalkan penutupan tertunda (exitNetAfterFlush)
    S.net.intentional = false;
    if (S.net.links.length) { updateNetStatus(); return; }          // koneksi sudah berjalan
    setNetStatus('connecting', 'Memuat library koneksi...');
    Promise.all([loadMqttLib(), secReady()]).then(function (r) {
        if (S.net.intentional) return;
        if (!r[0]) { setNetStatus('failed', 'Gagal memuat library koneksi. Periksa internet lalu coba lagi.'); return; }
        if (!r[1]) { setNetStatus('failed', 'Multiplayer aman membutuhkan koneksi HTTPS. Buka game lewat alamat https:// lalu coba lagi.'); return; }
        if (S.net.links.length) return;
''', 'connect()')

# ---------------------------------------------------------------- onLinkOnline
rep(r'''    const t = nowMs();
    if (S.room) {   // beri waktu tenang sebelum menilai pemain lain "hilang"
        S.room.hostSeen = t;
        Object.keys(S.room.lastSeen).forEach(function (k) { S.room.lastSeen[k] = t; });
    }
    Object.keys(S.subs).forEach''', r'''    presenceReset();   // beri waktu tenang sebelum menilai pemain lain "hilang" (kini termasuk saat balapan - bug #1)
    Object.keys(S.subs).forEach''', 'onLinkOnline')

# ---------------------------------------------------------------- pub lama -> pindah ke blok SEC
old_pub = src[src.index('/* Pesan dikirim lewat SEMUA link yang aktif; penerima membuang duplikat memakai id unik pesan (m.i). */\nfunction pub(topic, obj, qos) {\n    if (!ready()) return false;\n    obj.v = 1;'):]
old_pub = old_pub[:old_pub.index('function syncLobbySub()')]
rep(old_pub, '/* pub() kini ada di blok KEAMANAN PESAN (di atas jaringan). */\n', 'pub lama')

# ---------------------------------------------------------------- onMessage lama -> handleMessage
rep('function onMessage(topic, payload) {\n    let m;\n',
    'function handleMessage(topic, payload) {   // dipanggil setelah pesan lolos verifikasi (lihat onMessage di blok KEAMANAN PESAN)\n    let m;\n',
    'handleMessage')

# ---------------------------------------------------------------- roster membawa kunci anggota
rep("players: R.players.map(function (p) { return { id: p.id, name: p.name, avatar: p.avatar, ship: p.ship }; }) }, 1);",
    "players: R.players.map(function (p) { return { id: p.id, name: p.name, avatar: p.avatar, ship: p.ship, k: SEC.keys.get(p.id) }; }) }, 1);",
    'broadcastRoster')

# ---------------------------------------------------------------- bersihkan kunci saat keluar room / jaringan
rep("    S.room = null;\n    chatReset();   // CHAT ROOM (baru): hapus seluruh chat saat meninggalkan room",
    "    S.room = null;\n    secResetKeys();   // bug #4: lupakan kunci pemain room lama\n    chatReset();   // CHAT ROOM (baru): hapus seluruh chat saat meninggalkan room",
    'leaveRoomCore')
rep("S.rooms = {}; S.net.seen = new Map();\n    stopTick();",
    "S.rooms = {}; S.net.seen = new Map();\n    secResetKeys();\n    stopTick();",
    'exitNet')
rep("function exitMultiplayer() {\n    leaveRoomCore(true);\n    exitNet();\n    setView('none');\n}",
    "function exitMultiplayer() {\n    leaveRoomCore(true);\n    exitNetAfterFlush();   // bug #4: tunggu pesan 'leave' selesai ditandatangani & terkirim\n    setView('none');\n}",
    'exitMultiplayer')
rep("    leaveRoomCore(true);\n    exitNet();\n    setView('none');\n    O.quitRace();",
    "    leaveRoomCore(true);\n    exitNetAfterFlush();   // bug #4: tunggu pesan 'leave'/'quit' terkirim\n    setView('none');\n    O.quitRace();",
    'mpQuitRace')

# ---------------------------------------------------------------- onProg: hidupkan kembali pemain yang salah ditandai "lost"
rep("    if (qi < r.qi) return;                          // pesan basi\n    if (!r.done) {",
    "    if (qi < r.qi) return;                          // pesan basi\n"
    "    if (r.done && r.why === 'lost' && !R.final) { r.done = false; r.why = ''; r.ms = Infinity; }   // bug #1: ternyata masih hidup (mis. baru kembali dari background)\n"
    "    if (!r.done) {",
    'onProg')

# ---------------------------------------------------------------- tick
rep("function startTick() { if (!S.tickTimer) S.tickTimer = setInterval(tick, 500); }",
    "function startTick() { if (!S.tickTimer) { S.lastTickAt = 0; S.tickTimer = setInterval(tick, 500); } }",
    'startTick')

RESUME_BLOCK = r'''/* =====================================================================
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

'''
rep("/* ---------- Tick: bot, kehadiran, denyut ---------- */\n",
    RESUME_BLOCK + "/* ---------- Tick: bot, kehadiran, denyut ---------- */\n", 'blok resume')

rep("function tick() {\n    const t = nowMs();\n    const R = S.room;\n",
    "function tick() {\n    const t = nowMs();\n    const gap = t - (S.lastTickAt || t);\n    S.lastTickAt = t;\n"
    "    if (gap > CFG.resumeGapMs) resumeGrace(gap > 10000);          // bug #1: halaman baru dilanjutkan dari pembekuan\n"
    "    const R = S.room;\n",
    'tick')

# ---------------------------------------------------------------- INIT: pendengar visibilitas
rep("S.me.id = randId(8);\n",
    r'''S.me.id = randId(8);

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
''', 'INIT')

if blob_sha(src) != SHA_AKHIR:
    print('GAGAL: hasil akhir tidak cocok (%s)' % blob_sha(src))
    sys.exit(1)
open(OUT, 'w', encoding='utf-8', newline='').write(src)
print('selesai ->', OUT, len(src), blob_sha(src))

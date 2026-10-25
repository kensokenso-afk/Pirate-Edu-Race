import hashlib, sys

# Memperbaiki bug #5, #6, #7. Berhenti (exit 1) bila versi awal atau hasil akhir tidak sesuai (SHA_AKHIR kosong = hanya cetak).
SRC = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else SRC
SHA_AWAL = 'fd3d02e4f58ebbbd084f9f0c375bf910bf6e514f'
SHA_AKHIR = '9c2a3765b4cad0d9c3039fb2f34b20956a57cc59'


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


# ================================================================ BUG #6: skor leaderboard hilang diam-diam
rep('const LB_TIMEOUT_MS = 10000;\n',
    'const LB_TIMEOUT_MS = 10000;\n'
    'const LB_MAX_TRIES = 10;                          // bug #6: batas percobaan kirim ulang satu skor\n'
    'const LB_MAX_AGE_MS = 14 * 24 * 3600 * 1000;      // bug #6: skor yang menunggu lebih dari 14 hari dibuang\n',
    'konstanta LB')

rep('    queue.push({ mode: mode, name: name, score: score });\n',
    '    queue.push({ mode: mode, name: name, score: score, at: Date.now() });\n',
    'submitGlobalScore')

a = src.index('// Mengembalikan jumlah skor yang berhasil terkirim.\nasync function lbFlushPending() {')
b = src.index('    return sent;\n}\n', a) + len('    return sent;\n}\n')
NEW_FLUSH = r'''// PERBAIKAN bug #6: pembantu antrean skor. Pencocokan memakai mode+nama+skor (bukan objek) karena antrean dibaca ulang dari localStorage.
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
'''
src = src[:a] + NEW_FLUSH + src[b:]
print('ok: lbFlushPending')

# ================================================================ BUG #5: reset data tidak bersih
rep('''            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('pirate_')) keysToRemove.push(k);
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));''',
    '''            // PERBAIKAN bug #5: 'pirate_pid' = pengenal pemain di papan peringkat global. Bila dihapus, server menganggap kita pemain baru
            // dan entri lama tertinggal sebagai duplikat (backend tidak punya fitur hapus), jadi key ini dipertahankan.
            const KEEP = { 'pirate_pid': true };
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('pirate_') && !KEEP[k]) keysToRemove.push(k);
            }
            keysToRemove.push('pirate-edurace-kickban');   // data multiplayer: berawalan "pirate-" (bukan "pirate_") sehingga tadinya terlewat
            keysToRemove.forEach(k => localStorage.removeItem(k));''',
    'confirmResetData')

# ================================================================ BUG #7: pesan keluar tidak terkirim saat tab ditutup
rep('txQ: Promise.resolve(), rxQ: Promise.resolve(), pending: 0, netGen: 0\n};',
    'txQ: Promise.resolve(), rxQ: Promise.resolve(), pending: 0, netGen: 0,\n    leavePkt: null, leavePrep: false                              // bug #7: paket \'leave\' yang sudah ditandatangani lebih dulu\n};',
    'objek SEC')

rep('''function secResetKeys() {
    SEC.keys.clear();
    if (SEC.pubB64) SEC.keys.set(S.me.id, SEC.pubB64);
}''', '''function secResetKeys() {
    SEC.keys.clear();
    SEC.leavePkt = null;
    if (SEC.pubB64) SEC.keys.set(S.me.id, SEC.pubB64);
}''', 'secResetKeys')

rep('''    SEC.txQ.then(function () { if (g === SEC.netGen) exitNet(); });
}
/* @@SEC-END */''', r'''    SEC.txQ.then(function () { if (g === SEC.netGen) exitNet(); });
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
/* @@SEC-END */''', 'secPrepareLeave/secFinalLeave')

rep('// bug #1: halaman baru dilanjutkan dari pembekuan\n',
    '// bug #1: halaman baru dilanjutkan dari pembekuan\n    secPrepareLeave();                                            // bug #7: siapkan paket \'leave\' bertanda tangan\n',
    'tick')

rep("    try { if (S.room) leaveRoomCore(true); } catch (err) {}\n    try { S.net.links.forEach(function (l) { if (l.client) l.client.end(true); }); } catch (err) {}",
    "    try { if (S.room) secFinalLeave(S.room.code); } catch (err) {}   // bug #7: kirim 'leave' yang sudah ditandatangani (sinkron)\n"
    "    try { if (S.room) leaveRoomCore(true); } catch (err) {}\n    try { S.net.links.forEach(function (l) { if (l.client) l.client.end(true); }); } catch (err) {}",
    'pagehide')

akhir = blob_sha(src)
if SHA_AKHIR and akhir != SHA_AKHIR:
    print('GAGAL: hasil akhir tidak cocok (%s)' % akhir)
    sys.exit(1)
open(OUT, 'w', encoding='utf-8', newline='').write(src)
print('selesai ->', OUT, len(src), akhir)

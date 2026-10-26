/* js/pixel-scene.js (latar laut semua layar) — bagian dari upgrade grafis pixel (milik Claude; lihat docs/PEMBAGIAN-TUGAS-PIXEL.md).
   Dimuat SETELAH game.js dan multiplayer.js. Logika game tidak diubah; bila skrip ini gagal, tampilan emoji lama tetap jalan. */
try {
/* =====================================================================
   SEA SCENE — latar laut pixel art animasi untuk SEMUA layar
   Satu <canvas> beresolusi rendah berada di belakang semua layar (layar dibuat
   transparan lewat CSS). Isinya: laut berpita dither, ombak bergulir, bercak laut,
   awan + bayangannya, dan kapal bajak laut 32x32 (2 frame layar) dengan buih & jejak.
   - Kapal otomatis mencari celah kosong terbesar di layar yang aktif; jika layar
     terlalu penuh, kapal tidak ditampilkan agar tidak menutupi konten.
   - Piksel diperbesar dengan kelipatan bulat piksel perangkat -> selalu tajam.
   - Animasi berhenti saat tab tersembunyi dan dibekukan di layar balapan
     (agar tidak mengganggu menjawab soal & hemat baterai). "Kurangi gerakan" = gambar diam.
   ===================================================================== */
const SeaScene = (() => {
    const SPR = {
        pal: {"k": "#231510", "d": "#4a2d1c", "m": "#6e4429", "l": "#94603a", "e": "#c98f57", "w": "#f7f4ea", "s": "#d4d8df", "S": "#96a5be", "r": "#e0403f", "R": "#94202a", "b": "#5a3925", "z": "#1d1d2b", "g": "#f2c14e", "f": "#ffffff", "y": "#ffd86b", "c": "#55606e", "u": "#beebf5", "v": "#8cc8e1", "a": "#2b3345", "h": "#45516b", "i": "#6b7a9a", "n": "#1d2030", "N": "#3b4260", "x": "#9be8d8", "o": "#8a5a12", "p": "#d99a1f", "q": "#ffd35a", "B": "#3f7fd6", "C": "#2a56a8", "A": "#c23b33", "D": "#7c1f24", "T": "#f1d58a", "U": "#d0ac5e", "V": "#fff0b8", "P": "#1f7a3a", "G": "#49b653", "O": "#ff8a2a", "Y": "#c9a26a", "Z": "#8c6a3c", "W": "#eef6ff", "L": "#7fd0f0"},
        ship0: [
            '..........rrrr.......rrr........',
            '..........rfr........R..........',
            '..........R....zzzzbbb..........',
            '........bbbzzzz.....bz..........',
            '........zb.....bbbbbbbbbbbbbb...',
            '...bbbbbbbbbbbbSwwwwwwwwwwwS....',
            '...SwwwwwwwwwwwSwwwwwwwwswwS....',
            '...SwwwwwwwwswwSwwswwswwsswS....',
            '...SwwswwswwsswSwwswwswwwswwS...',
            '...SwwswwswwwswSwwswwswwwsswS...',
            '...SwwswwswwwssSwwswwswwwsswS...',
            '...SwwswwswwwssSwwswwswwwwswS...',
            '...SwwswwswwwwswSwwwwswwwwwSz..b',
            '...zSwwwwswwwwwSSssswwwssssS.zb.',
            '...zSssswwwssssSSwSSSSSSSSwS.bzk',
            '..z.SwSSSSSSSSwS.S..b.....S.bkkl',
            '.kkkkkkk.b....S.....b.......kllm',
            'keeeeeeekb..........b....kkklmlm',
            'kllllllmkkkkkkkkkkkkkkkkklllmmlm',
            'kllyyllmlllllllllllllllllmmmmlmk',
            'kllyyllmeegeeeegeeeegeeeegemmmmk',
            'kddddddddddddddddddddddddddddmk.',
            'kmmmmmmmmmzcmmmzcmmmzcmmmmmmmmk.',
            '.kmmmmmmmmccmmmccmmmccmmmmmmmk..',
            '.kmmmmmmmmmmmmmmmmmmmmmmmmmmk...',
            '..kddddddddddddddddddddddmmk....',
            '..kmmmmmmmmmmmmmmmmmmmmmmmk.....',
            '...kkkmmmmmmmmmmmmmmmmmmmk......',
            '......kkmmmmmmmmmmmmkkkkk.......',
            '........kkkkkkkkkkkk............',
            '................................',
            '................................'
        ],
        ship1: [
            '..........rrr........rr.........',
            '..........rfrr.......RRR........',
            '..........RR...zzzzbbb..........',
            '........bbbzzzz.....bz..........',
            '........zb.....bbbbbbbbbbbbbb...',
            '...bbbbbbbbbbbbSwwwwwwwwwwwS....',
            '...SwwwwwwwwwwwSwwwwwwwwswwS....',
            '...SwwwwwwwwswwSwwswwswwwswwS...',
            '...SwwswwswwwswSwwswwswwwsswS...',
            '...SwwswwswwwssSwwswwswwwwswwS..',
            '...SwwswwswwwwsSwwswwswwwwsswS..',
            '...SwwswwswwwwsSwwswwswwwwwsS...',
            '...SwwswwswwwwwsSwwwwswwwwwwS..b',
            '...zSwwwwswwwwwwSssswwwssssS.zb.',
            '...zSssswwwssssSSwSSSSSSSSwS.bzk',
            '..z.SwSSSSSSSSwS.S..b.....S.bkkl',
            '.kkkkkkk.b....S.....b.......kllm',
            'keeeeeeekb..........b....kkklmlm',
            'kllllllmkkkkkkkkkkkkkkkkklllmmlm',
            'kllyyllmlllllllllllllllllmmmmlmk',
            'kllyyllmeegeeeegeeeegeeeegemmmmk',
            'kddddddddddddddddddddddddddddmk.',
            'kmmmmmmmmmzcmmmzcmmmzcmmmmmmmmk.',
            '.kmmmmmmmmccmmmccmmmccmmmmmmmk..',
            '.kmmmmmmmmmmmmmmmmmmmmmmmmmmk...',
            '..kddddddddddddddddddddddmmk....',
            '..kmmmmmmmmmmmmmmmmmmmmmmmk.....',
            '...kkkmmmmmmmmmmmmmmmmmmmk......',
            '......kkmmmmmmmmmmmmkkkkk.......',
            '........kkkkkkkkkkkk............',
            '................................',
            '................................'
        ],
        cloud1: [
            '.............fffff..............',
            '............fffffff.............',
            '...........fffffffff............',
            '.......ffffffffffffff.fff.......',
            '.....ffffffffffffffffffffff.....',
            '.....ffffffffffffffffffffff.....',
            '....ffffffffffffffffffffffff....',
            '...uffffffffffffffffffffffffu...',
            '...uffffffffffffffffffffffffu...',
            '...uuffffffffffffffffffffffuu...',
            '...uuuuuuuuuuuuuuuuuuuuuuuuuu...',
            '...vvvvvvvvvvvvvvvvvvvvvvvvvv...',
            '................................',
            '................................'
        ],
        cloud2: [
            '...........fff........',
            '.....fff..fffff.......',
            '....ffffffffffff......',
            '...ffffffffffffffff...',
            '...fffffffffffffffff..',
            '..ufffffffffffffffff..',
            '..uuuuuuuuuuuuuuuuuuu.',
            '..vvvvvvvvvvvvvvvvvvv.',
            '......................',
            '......................'
        ],
        cloud3: [
            '...............fffff....................',
            '..............fffffff...................',
            '.............fffffffff...fffff..........',
            '............fffffffffff.fffffff.........',
            '......ffffffffffffffffffffffffff........',
            '.....ffffffffffffffffffffffffffffff.....',
            '....fffffffffffffffffffffffffffffffff...',
            '...ffffffffffffffffffffffffffffffffff...',
            '...fffffffffffffffffffffffffffffffffff..',
            '..ufffffffffffffffffffffffffffffffffffu.',
            '..ufffffffffffffffffffffffffffffffffffu.',
            '..uffffffffffffffffffffffffffffffffffuu.',
            '..uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu.',
            '..vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv.',
            '........................................',
            '........................................'
        ]
    };

    const WATER = ['#69dbe8', '#55cfe3', '#42c0dc', '#33acd5', '#2a9acb', '#2286bd', '#1b73ae'];
    const C = { foam1: '#ffffff', foam2: '#d9f7fb', foam3: '#a9e6f1', crest: '#bff1f6', patch: '#1a79b0', spark: '#ffffff' };
    const STATIC_SCREENS = ['screen-gameplay'];       // layar yang dibekukan (satu frame diam)

    const root = document.getElementById('game-container');
    const wrap = document.getElementById('scene-wrap');
    const cv   = document.getElementById('scene-canvas');
    if (!root || !wrap || !cv) return {};
    const ctx = cv.getContext('2d', { alpha: false });

    // ---- sprite -> canvas kecil ---------------------------------------
    function build(rows) {
        const c = document.createElement('canvas');
        c.width = rows[0].length; c.height = rows.length;
        const x = c.getContext('2d');
        for (let y = 0; y < rows.length; y++) for (let i = 0; i < rows[y].length; i++) {
            const k = rows[y][i];
            if (k !== '.') { x.fillStyle = SPR.pal[k]; x.fillRect(i, y, 1, 1); }
        }
        return c;
    }
    function shadowOf(src) {
        const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
        const x = c.getContext('2d'), d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
        x.fillStyle = C.patch;
        for (let y = 0; y < src.height; y++) for (let i = 0; i < src.width; i++)
            if (d[(y * src.width + i) * 4 + 3] > 0 && ((i + y) & 1) === 0) x.fillRect(i, y, 1, 1);
        return c;
    }
    function patchSprite(rx, ry) {
        const w = rx * 2 + 1, h = ry * 2 + 1;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.fillStyle = C.patch;
        for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
            const dx = (i - rx) / rx, dy = (y - ry) / ry, r = dx * dx + dy * dy;
            if (r < 0.42 || (r < 1 && ((i + y) & 1) === 0)) x.fillRect(i, y, 1, 1);
        }
        return c;
    }
    const IMG = {
        ship: [build(SPR.ship0), build(SPR.ship1)],
        clouds: [build(SPR.cloud3), build(SPR.cloud1), build(SPR.cloud2), build(SPR.cloud1)],
        patches: [patchSprite(16, 7), patchSprite(12, 5), patchSprite(20, 8)]
    };
    IMG.cloudShadows = IMG.clouds.map(shadowOf);

    // ---- state ----------------------------------------------------------
    let W = 0, H = 0, cssS = 4, lastCssW = 0, lastCssH = 0;
    let bg = null, crests = [], sparks = [], clouds = [], patches = [];
    let cur = null;                                   // layar aktif
    let shipX = 0, shipTarget = null, shipPos = null; // y kapal (satuan piksel logis)
    let wake = [], lastSpawn = 0, lastSlot = 0;
    let raf = 0, running = false, lastDraw = 0;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function rng(seed) {
        return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    }

    function layout() {
        const cssW = root.clientWidth, cssH = root.clientHeight;
        if (!cssW || !cssH) return false;
        lastCssW = cssW; lastCssH = cssH;
        const dpr = window.devicePixelRatio || 1;
        // skala global: kelipatan bulat piksel perangkat. Kapal harus muat di celah menu utama
        // (celah ~ (tinggi - 456) / 2), yang paling sempit di antara semua layar.
        const room = (cssH - 456) / 2 - 4, lo = Math.ceil(2 * dpr), hi = Math.floor(5 * dpr);
        let devS = Math.max(lo, Math.min(hi, Math.round(cssW / 72 * dpr)));
        while (devS > lo && 32 * devS / dpr > room) devS--;
        cssS = devS / dpr;
        W = Math.ceil(cssW / cssS); H = Math.ceil(cssH / cssS);
        cv.width = W; cv.height = H;
        cv.style.width = (W * cssS) + 'px'; cv.style.height = (H * cssS) + 'px';
        ctx.imageSmoothingEnabled = false;
        shipX = Math.round((W - 32) / 2);

        bg = document.createElement('canvas'); bg.width = W; bg.height = H;
        const b = bg.getContext('2d'), band = H / WATER.length;
        for (let y = 0; y < H; y++) {
            const f = y / band, i = Math.min(WATER.length - 1, Math.floor(f));
            b.fillStyle = WATER[i]; b.fillRect(0, y, W, 1);
            if (i < WATER.length - 1 && f - i > 0.82) {
                b.fillStyle = WATER[i + 1];
                for (let x = (y & 1); x < W; x += 2) b.fillRect(x, y, 1, 1);
            }
        }
        const R = rng(20241023);
        crests = []; const n = Math.floor(W * H / 190);
        for (let k = 0; k < n; k++) {
            const y = Math.floor(R() * H);
            crests.push({ x: R() * (W + 12) - 6, y, len: 3 + Math.floor(R() * 5), ph: R() * 6.28, sp: 5 + 10 * (y / H) + R() * 2 });
        }
        sparks = []; for (let k = 0; k < 16; k++) sparks.push({ x: Math.floor(R() * W), y: Math.floor(R() * H), ph: R() * 6.28 });
        patches = IMG.patches.map(im => ({ im, x: R() * W, y: H * (0.15 + 0.7 * R()), sp: 1.5 + R() * 1.5 }));
        const ys = [0.05, 0.17, 0.60, 0.86];
        clouds = IMG.clouds.map((im, k) => ({ i: k, x: R() * W, y: Math.round(H * ys[k]), sp: 2.2 + R() * 2.2 }));
        wake = [];
        return true;
    }

    // ---- mencari celah kosong untuk kapal -------------------------------
    function findSlot() {
        if (!cur) return null;
        const rr = root.getBoundingClientRect(), cssH = root.clientHeight, iv = [];
        for (const el of cur.children) {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed') continue;
            const r = el.getBoundingClientRect();
            if (r.height < 1) continue;
            iv.push([r.top - rr.top, r.bottom - rr.top]);
        }
        iv.sort((a, b) => a[0] - b[0]);
        const gaps = []; let end = 0;
        for (const [t, b] of iv) { if (t - end > 0) gaps.push([end, t]); end = Math.max(end, b); }
        if (cssH - end > 0) gaps.push([end, cssH]);
        const need = 31 * cssS;                       // baris kapal + buih yang terlihat
        let best = null, bestScore = 0;
        for (const [t, b] of gaps) {
            const g = b - t;
            if (g < need * 0.75) continue;            // boleh menyelip sedikit di balik konten
            const score = g * (1 + 0.15 * (1 - ((t + b) / 2) / cssH));   // condong ke celah atas
            if (score > bestScore) { bestScore = score; best = [t, b]; }
        }
        return best ? Math.round((best[0] + best[1]) / 2 / cssS - 15.5) : null;
    }
    function refreshSlot(snap) {
        const y = findSlot();
        if (y == null) { shipTarget = null; shipPos = null; return; }
        shipTarget = y;
        if (shipPos == null || snap || reduce || isStatic()) shipPos = y;
    }
    function isStatic() { return !!cur && STATIC_SCREENS.indexOf(cur.id) >= 0; }

    // ---- menggambar -------------------------------------------------------
    function crest(x, y, len, t, ph) {
        x = Math.round(x);
        const bob = Math.round(Math.sin(t * 1.3 + ph));
        const L = Math.sin(t * 0.9 + ph * 2) > 0.15 ? len : Math.max(2, len - 2), yy = y + bob;
        ctx.fillStyle = C.foam1; ctx.fillRect(x, yy, L, 1);
        if (L >= 4) { ctx.fillStyle = C.crest; ctx.fillRect(x - 1, yy + 1, 1, 1); ctx.fillRect(x + L, yy + 1, 1, 1); }
        ctx.fillStyle = C.foam3; ctx.fillRect(x + 1, yy + 1, Math.max(1, L - 2), 1);
    }

    function draw(t, dt) {
        ctx.drawImage(bg, 0, 0);
        for (const p of patches) {
            p.x -= p.sp * dt; if (p.x < -p.im.width) p.x += W + p.im.width * 2;
            ctx.globalAlpha = 0.30; ctx.drawImage(p.im, Math.round(p.x), Math.round(p.y)); ctx.globalAlpha = 1;
        }
        for (const c of clouds) {
            ctx.globalAlpha = 0.45; ctx.drawImage(IMG.cloudShadows[c.i], Math.round(c.x) + 9, c.y + 20); ctx.globalAlpha = 1;
        }
        for (const c of crests) { c.x -= c.sp * dt; if (c.x < -10) c.x += W + 20; crest(c.x, c.y, c.len, t, c.ph); }
        for (const s of sparks) {
            const v = Math.sin(t * 2.2 + s.ph);
            if (v > 0.9) { ctx.fillStyle = C.spark; ctx.fillRect(s.x, s.y, 1, 1); ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); }
            else if (v > 0.78) { ctx.fillStyle = C.foam2; ctx.fillRect(s.x, s.y, 1, 1); }
        }

        let sy = null;
        if (shipPos != null) {                                   // kapal meluncur halus ke celah baru
            const d = shipTarget - shipPos;
            if (d !== 0) shipPos += Math.sign(d) * Math.min(Math.abs(d), 90 * dt);
            sy = Math.round(shipPos);
        }
        if (sy != null) {
            const wl = sy + 27;
            if (t - lastSpawn > 0.09) {
                lastSpawn = t;
                wake.push({ x: shipX + 2 + Math.random() * 3, y: wl + Math.floor(Math.random() * 3) - 1, age: 0 });
            }
        }
        for (let i = wake.length - 1; i >= 0; i--) {
            const w = wake[i]; w.age += dt; w.x -= 12 * dt;
            if (w.age > 1.5 || w.x < -3) { wake.splice(i, 1); continue; }
            ctx.fillStyle = w.age < 0.5 ? C.foam1 : (w.age < 1.0 ? C.foam2 : C.foam3);
            ctx.fillRect(Math.round(w.x), Math.round(w.y), w.age < 0.5 ? 2 : 1, 1);
        }

        for (const c of clouds) {
            c.x += c.sp * dt; const im = IMG.clouds[c.i];
            if (c.x > W + 2) c.x = -im.width - 2;
            ctx.drawImage(im, Math.round(c.x), c.y);
        }

        if (sy != null) {
            const frame = Math.floor(t * 3) & 1, img = IMG.ship[frame], wl = sy + 27;
            const bob = Math.sin(t * 1.6), pitch = Math.sin(t * 1.1 + 1) * 1.1;
            for (let i = 0; i < 32; i++) {
                let dy = Math.round(-1 + bob * 0.8 + pitch * (i - 15.5) / 15.5);
                dy = Math.max(-2, Math.min(0, dy));
                ctx.drawImage(img, i, 0, 1, 29, shipX + i, sy + dy, 1, 29);   // 29 baris: garis tepi dasar tertutup air
            }
            const step = Math.floor(t * 7);
            for (let i = -1; i < 32; i++) {
                const x = shipX + i, ph = (i + step) % 5;
                ctx.fillStyle = ph < 2 ? C.foam1 : C.foam2; ctx.fillRect(x, wl, 1, 1);
                ctx.fillStyle = ph < 3 ? C.foam3 : C.foam2; ctx.fillRect(x, wl + 1, 1, 1);
                if ((i + step) % 3 === 0) { ctx.fillStyle = C.foam1; ctx.fillRect(x, wl + 2, 1, 1); }
            }
            const sp = Math.floor(t * 5) & 1;
            ctx.fillStyle = C.foam1; ctx.fillRect(shipX + 30, wl - 1 - sp, 2, 1); ctx.fillRect(shipX + 32, wl - sp, 1, 1);
            ctx.fillStyle = C.foam2; ctx.fillRect(shipX + 31, wl - 2 + sp, 1, 1);
        }
    }

    // ---- siklus hidup ----------------------------------------------------
    const FRAME_MS = 1000 / 24;
    function loop(now) {
        if (!running) return;
        raf = requestAnimationFrame(loop);
        if (now - lastDraw < FRAME_MS - 1) return;
        const dt = Math.min(0.1, (now - lastDraw) / 1000 || 0.04); lastDraw = now;
        if (now - lastSlot > 1000) { lastSlot = now; refreshSlot(false); }   // konten layar bisa berubah (daftar, popup)
        draw(now / 1000, dt);
    }
    function ensureLayout() {
        if (!W || root.clientWidth !== lastCssW || root.clientHeight !== lastCssH) return layout();
        return true;
    }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function still() { if (ensureLayout()) { refreshSlot(true); draw(performance.now() / 1000, 0); } }
    function sync() {
        stop();
        if (document.hidden || !cur) return;
        if (!ensureLayout()) return;
        if (reduce || isStatic()) { still(); return; }           // satu frame diam
        refreshSlot(false);
        running = true; lastDraw = performance.now(); lastSlot = lastDraw; raf = requestAnimationFrame(loop);
    }
    function onScreenChange() {
        const a = root.querySelector('.screen.active');
        if (a === cur) return;
        cur = a; sync();
        setTimeout(() => { if (cur === a) { refreshSlot(false); if (!running && !document.hidden) still(); } }, 300);   // setelah konten dirender
    }

    const mo = new MutationObserver(onScreenChange);
    root.querySelectorAll('.screen').forEach(s => mo.observe(s, { attributes: true, attributeFilter: ['class'] }));
    document.addEventListener('visibilitychange', sync);
    let rz = 0;
    function relayout() { clearTimeout(rz); rz = setTimeout(() => { W = 0; sync(); }, 120); }
    window.addEventListener('resize', relayout);
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(root);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    cur = root.querySelector('.screen.active'); sync();
    return { sync, stop };
})();

} catch (e) { console.warn('Latar laut dimatikan:', e); }

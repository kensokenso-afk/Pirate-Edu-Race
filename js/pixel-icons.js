try {
/* IKON PIXEL — mengganti TAMPILAN emoji dekorasi (koin, nyawa, medali, perahu, burung beo, bendera, pulau)
   dengan sprite pixel orisinal. Nilai emoji di data game (localStorage, multiplayer) TIDAK diubah; hanya
   teks tampilan di layar yang disebut di ROOTS yang digambar ulang. Bila skrip gagal, emoji lama tetap tampil.
   Container milik skrip pixel lain (avatar, item, arena, efek) sengaja dikecualikan di SKIP. */
(function () {
    'use strict';
    var DATA = {
        pal: {"A": "#6b4a00", "B": "#ffd700", "C": "#fff3a0", "D": "#b07800", "E": "#e0a800", "F": "#5a0f0f", "G": "#e53935", "H": "#ff8a80", "I": "#b71c1c", "J": "#2f6fd1", "K": "#c79100", "L": "#455a64", "M": "#ffffff", "N": "#cfd8dc", "O": "#90a4ae", "P": "#5a2f0e", "Q": "#f3b97a", "R": "#d9893f", "S": "#a85f1f", "T": "#3b2410", "U": "#5d4037", "V": "#e8f1f5", "W": "#dfeaf0", "X": "#8d5524", "Y": "#a86a35", "Z": "#6f3f17", "a": "#5a3010", "b": "#101010", "c": "#ffb300", "d": "#ff8f00", "e": "#43a047", "f": "#1e88e5", "g": "#66bb6a", "h": "#42a5f5", "i": "#0a0a0c", "j": "#2d2d33", "k": "#1b1b1f", "l": "#f4f1e8", "m": "#0f0f12", "n": "#2e9b3a", "o": "#3fb54b", "p": "#7a4a21", "q": "#8d5a2b", "r": "#f2d27a", "s": "#f6e0a0", "t": "#e0b85a"},
        icons: {
            'coin': [
                '.....AA.....',
                '...AABBAA...',
                '..ABBBBBBA..',
                '.ABCBDDBBBA.',
                '.ABCCDDBBBA.',
                'ABBBCDDBBBBA',
                'AEBBBDDBBBEA',
                'AEBBBDDBBEEA',
                '.AEBBDDBBEA.',
                '.AEEBBBEEEA.',
                '..AAEEEEAA..',
                '....AAAA....'
            ],
            'heart': [
                '...FF..FF...',
                '..FGGFFGGF..',
                '.FHHGGGGGGF.',
                'FGHGGGGGGGGF',
                'FGGGGGGGGIGF',
                '.FGGGGGGGIF.',
                '..FGGGGGIF..',
                '...FGGGIF...',
                '...FGGIGF...',
                '....FGGF....',
                '.....FF.....',
                '............'
            ],
            'medal1': [
                '.AGGGGJJJJA.',
                '..AGGGJJJA..',
                '...AGGJJA...',
                '....AGJA....',
                '...ACBBBA...',
                '..ACBKKBBA..',
                '.ABCBKKBBBA.',
                '.ABBBKKBBKA.',
                '.ABBBKKBBKA.',
                '..AKBBBBKA..',
                '...AKKKKKA..',
                '....AAAAA...'
            ],
            'medal2': [
                '.LGGGGJJJJL.',
                '..LGGGJJJL..',
                '...LGGJJL...',
                '....LGJL....',
                '...LMNNNL...',
                '..LMNOONNL..',
                '.LNMNOONNNL.',
                '.LNNNOONNOL.',
                '.LNNNOONNOL.',
                '..LONNNNOL..',
                '...LOOOOOL..',
                '....LLLLL...'
            ],
            'medal3': [
                '.PGGGGJJJJP.',
                '..PGGGJJJP..',
                '...PGGJJP...',
                '....PGJP....',
                '...PQRRRP...',
                '..PQRSSRRP..',
                '.PRQRSSRRRP.',
                '.PRRRSSRRSP.',
                '.PRRRSSRRSP.',
                '..PSRRRRSP..',
                '...PSSSSSP..',
                '....PPPPP...'
            ],
            'boat': [
                '......TTTT....',
                '.....TUGGGT...',
                '.....TUGGGT...',
                '.....TUMTT....',
                '....TVUNT.....',
                '....TVUNMT....',
                '...TVVUNWMT...',
                '..TVVVUNMWMT..',
                '.TVVVVUNMMWMT.',
                'TVVVVVUNMMMWMT',
                'TXYYXXXXBXBXXT',
                '.TZZZZZZZZZZT.',
                '..TaaaaaaaaT..',
                '...TTTTTTTT...'
            ],
            'parrot': [
                '......TT......',
                '.....TGGT.....',
                '....TGGGGT....',
                '...TGGGMbcTT..',
                '...TGGGGGccdT.',
                '...TGGGGGcdccT',
                '...TeGGGGcTTT.',
                '..TfffgggeT...',
                '..TfhfgggeeT..',
                '..TfGfgggeeT..',
                '..TGGfggeeT...',
                '.TGGGfgeeeT...',
                '..TcGccceT....',
                '...TTGTdT.....'
            ],
            'flag': [
                'iBiiiiiiiiiii.',
                'iUjjjjjjjjjjji',
                'iUkkklllllkkki',
                'iUkklllllllki.',
                'iUkllklllkllki',
                'iUkllklllkllki',
                'iUkklllklllkki',
                'iUkkklllllkki.',
                'iUkkklklklkkki',
                'iUklllllllllki',
                'iUmmmmmmmmmmmi',
                'iUiiiiiiiiiii.',
                'iUi...........',
                'iUi...........'
            ],
            'island': [
                '.......TnT....',
                '.......TnT....',
                '...TTTTTnTTTTT',
                '..Tnnnnooonnnn',
                '..TnTTnooopTnT',
                '...TTnTTpqTnT.',
                '...TnT.TpqTTnT',
                '....T..TpqT.T.',
                '......TpqT....',
                '...TTTTpqTTT..',
                '.TTrrrrpqrrrTT',
                'Trssssspqssssr',
                'Trsssssssssssr',
                'Tttttssssstttt'
            ]
        }
    };
    var PAL = DATA.pal, SPR = DATA.icons;
    var MAP = [
        { re: '🪙', key: 'coin', alt: 'Koin' },                                  // koin
        { re: '❤️?', key: 'heart', alt: 'Nyawa' },                                // hati
        { re: '🥇', key: 'medal1', alt: 'Juara 1' },
        { re: '🥈', key: 'medal2', alt: 'Juara 2' },
        { re: '🥉', key: 'medal3', alt: 'Juara 3' },
        { re: '🏴‍☠️?', key: 'flag', alt: 'Bendera bajak laut' },  // harus sebelum perahu/lainnya
        { re: '⛵️?', key: 'boat', alt: 'Perahu layar' },
        { re: '🦜', key: 'parrot', alt: 'Burung beo' },
        { re: '🏝️?', key: 'island', alt: 'Pulau' }
    ];
    var ANY = new RegExp(MAP.map(function (m) { return m.re; }).join('|'), 'g');
    var ROOTS = ['#screen-loading', '#screen-player-name', '#screen-main-menu', '#screen-adventure', '#screen-gameplay',
        '#screen-storwin', '#screen-profile', '#screen-leaderboard', '#screen-collection', '#screen-settings',
        '#screen-victory', '#screen-gameover'].join(',');
    var SKIP = ['#display-avatar', '#profile-avatar', '.mp-avatar', '#modal-avatar', '#shop-items-grid', '#collection-grid',
        '#sw-preview', '#race-track', '#scene-wrap', '#fx-toast', '#vic-coins', '#go-coins', 'script', 'style'].join(',');
    var urls = {};

    function toURL(key) {
        if (urls[key]) return urls[key];
        var rows = SPR[key], h = rows.length, w = rows[0].length;
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var cx = cv.getContext('2d');
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
            var c = rows[y].charAt(x);
            if (c === '.' || !PAL[c]) continue;
            cx.fillStyle = PAL[c]; cx.fillRect(x, y, 1, 1);
        }
        return (urls[key] = cv.toDataURL('image/png'));
    }
    function lookup(s) {
        for (var i = 0; i < MAP.length; i++) if (new RegExp('^(?:' + MAP[i].re + ')$').test(s)) return MAP[i];
        return null;
    }
    function mk(def, fs) {
        var rows = SPR[def.key], h = rows.length, w = rows[0].length;
        var s = Math.max(1, Math.round(fs / h));                       // skala bilangan bulat -> piksel selalu tajam
        var img = document.createElement('img');
        img.className = 'pxi'; img.src = toURL(def.key); img.alt = def.alt; img.draggable = false;
        img.width = w * s; img.height = h * s;
        return img;
    }
    function convertText(t) {
        var par = t.parentElement;
        if (!par || !par.closest(ROOTS) || par.closest(SKIP)) return;
        var s = t.nodeValue; ANY.lastIndex = 0; if (!ANY.test(s)) return;
        var fs = parseFloat(getComputedStyle(par).fontSize) || 12;
        var frag = document.createDocumentFragment(), last = 0, m; ANY.lastIndex = 0;
        while ((m = ANY.exec(s))) {
            var def = lookup(m[0]); if (!def || !SPR[def.key]) continue;
            if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
            frag.appendChild(mk(def, fs)); last = m.index + m[0].length;
        }
        if (last === 0) return;
        if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
        par.replaceChild(frag, t);
    }
    function scan(node) {
        if (!node) return;
        if (node.nodeType === 3) node = node.parentElement;
        if (!node || node.nodeType !== 1) return;
        if (node.closest(SKIP)) return;
        if (node.closest(ROOTS)) walk(node);
        else node.querySelectorAll(ROOTS).forEach(walk);                // mis. dipanggil dengan <body>
    }
    function walk(node) {
        var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null), n, list = [];
        while ((n = w.nextNode())) list.push(n);
        list.forEach(function (t) { try { convertText(t); } catch (e) { /* biarkan emoji */ } });
    }
    function run(records) {
        if (!records) { scan(document.body); return; }
        records.forEach(function (r) {
            if (r.type === 'characterData') scan(r.target);
            else { scan(r.target); r.addedNodes.forEach(scan); }
        });
    }
    run();
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true });
})();

} catch (e) { console.warn('Ikon pixel dimatikan:', e); }

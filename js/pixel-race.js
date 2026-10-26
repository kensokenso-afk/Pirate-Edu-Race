/* js/pixel-race.js (arena balapan tampak atas) — bagian dari upgrade grafis pixel (milik Claude; lihat docs/PEMBAGIAN-TUGAS-PIXEL.md).
   Dimuat SETELAH game.js dan multiplayer.js. Logika game tidak diubah; bila skrip ini gagal, tampilan emoji lama tetap jalan. */
try {
/* =====================================================================
   RACE SCENE — arena balapan pixel art (tampak atas) di layar permainan
   Kapal emoji lama tetap ada di DOM (disembunyikan) sehingga SELURUH logika game & multiplayer
   tidak berubah: skrip ini hanya MEMBACA posisi animasi elemen itu tiap frame, lalu menggambar
   kapal pixel tampak atas di <canvas> pada posisi yang sama.
   Isi arena: air mengalir ke bawah, buih haluan & jejak kapal, tong hanyut, garis start,
   dan pantai "Treasure Island" (palem + peti harta) sebagai garis finis.
   Jenis kapal dipetakan dari emoji: ⛵ kayu, 🚢 emas, 🏴‍☠️ hantu, ⛴️ feri, 🚤 speedboat, 🛶 kano.
   ===================================================================== */
const RaceScene = (() => {
    const SPR = {
        pal: {"k": "#231510", "d": "#4a2d1c", "m": "#6e4429", "l": "#94603a", "e": "#c98f57", "w": "#f7f4ea", "s": "#d4d8df", "S": "#96a5be", "r": "#e0403f", "R": "#94202a", "b": "#5a3925", "z": "#1d1d2b", "g": "#f2c14e", "f": "#ffffff", "y": "#ffd86b", "c": "#55606e", "u": "#beebf5", "v": "#8cc8e1", "a": "#2b3345", "h": "#45516b", "i": "#6b7a9a", "n": "#1d2030", "N": "#3b4260", "x": "#9be8d8", "o": "#8a5a12", "p": "#d99a1f", "q": "#ffd35a", "B": "#3f7fd6", "C": "#2a56a8", "A": "#c23b33", "D": "#7c1f24", "T": "#f1d58a", "U": "#d0ac5e", "V": "#fff0b8", "P": "#1f7a3a", "G": "#49b653", "O": "#ff8a2a", "Y": "#c9a26a", "Z": "#8c6a3c", "W": "#eef6ff", "L": "#7fd0f0"},
        race: {
            wood: [[
                '..........k...........',
                '.........kbkk.........',
                '........kdbldk........',
                '........kdbldk........',
                '.......kdleeldk.......',
                '......kdlllllldk......',
                '......SSSSSSSSSS......',
                '....SSffffffffffSS....',
                '...SffwwwwwwwwwwffS...',
                '..SbwwsssslbsssswwbS..',
                '...SssSSSSbbSSSSssS...',
                '...kSSllllllllllSSk...',
                '...kdleeeeeeeeeeldk...',
                '...kdSSSSSSSSSSSSdk...',
                '...SSffffffffffffSS...',
                '..SffwwwwwwwwwwwwffS..',
                '.SbwwssssslbssssswwbS.',
                '..SssSSSSSbbSSSSSssS..',
                '...SSleeeeeeeeeelSS...',
                '...kdleeeeeeeeeeldk...',
                '...kdlllllllllllldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdlllllllllllldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdlllllllllllldk...',
                '...kdleellyylleeldk...',
                '....kdlelllllleldk....',
                '....kdlllllbrlrldk....',
                '....kdleeeebereldk....',
                '.....kdleeebReldk.....'
        ], [
                '..........k...........',
                '.........kbkk.........',
                '........kdbldk........',
                '........kdbldk........',
                '.......kdleeldk.......',
                '......kSSSSSSSSk......',
                '.....SSffffffffSS.....',
                '....SffwwwwwwwwffS....',
                '...SfwwsssssssswwfS...',
                '..SbwssSSSlbSSSsswbS..',
                '...SsSSeeebbeeeSSsS...',
                '...kSllllllllllllSk...',
                '...kdleSSSSSSSSeldk...',
                '...kSSSffffffffSSSk...',
                '...SfffwwwwwwwwfffS...',
                '..SfwwwsssssssswwwfS..',
                '.SbwsssSSSlbSSSssswbS.',
                '..SsSSSlllbblllSSSsS..',
                '...SdleeeeeeeeeeldS...',
                '...kdleeeeeeeeeeldk...',
                '...kdlllllllllllldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdlllllllllllldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdleeeeeeeeeeldk...',
                '...kdlllllllllllldk...',
                '...kdleellyylleeldk...',
                '....kdlelllllleldk....',
                '....kdlllllblrlldk....',
                '....kdleeeebrerldk....',
                '.....kdleeebReldk.....'
        ]],
            gold: [[
                '...........k............',
                '..........kbkk..........',
                '.........kobpok.........',
                '........kopbppok........',
                '........kopqqpok........',
                '.......koppppppok.......',
                '......kSSSSSSSSSSk......',
                '.....SSffffffffffSS.....',
                '....SffwwwwwwwwwwffS....',
                '...SgwwsssslbsssswwgS...',
                '....SssSSSSbbSSSSssS....',
                '....kSSppppppppppSSk....',
                '...kopqqqqqqqqqqqqpok...',
                '...kopSSSSSSSSSSSSpok...',
                '...SSSffffffffffffSSS...',
                '..SfffwwwwwwwwwwwwfffS..',
                '.SgwwwssssslbssssswwwgS.',
                '..SsssSSSSSbbSSSSSsssS..',
                '...SSSqqqqqqqqqqqqSSS...',
                '...kopqqqqqqqqqqqqpok...',
                '...koppSSSSSSSSSSppok...',
                '...koSSffffffffffSSok...',
                '...kSffwwwwwwwwwwffSk...',
                '...SgwwsssslbsssswwgS...',
                '...kSssSSSSbbSSSSssSk...',
                '...koSSqqqqqqqqqqSSok...',
                '...koppppppppppppppok...',
                '...kopqqqqqqqqqqqqpok...',
                '...kopqqqqqqqqqqqqpok...',
                '...koppppppppppppppok...',
                '...kopqqpppyypppqqpok...',
                '....kopqppppppppqpok....',
                '....koppppppppppppok....',
                '....kopqqqqqggqgqpok....',
                '....kopqqqqqgqgqqpok....',
                '.....kopppppgppppok.....'
        ], [
                '...........k............',
                '..........kbkk..........',
                '.........kobpok.........',
                '........kopbppok........',
                '........kopqqpok........',
                '.......kSSSSSSSSk.......',
                '......SSffffffffSS......',
                '.....SffwwwwwwwwffS.....',
                '....SfwwsssssssswwfS....',
                '...SgwssSSSlbSSSsswgS...',
                '....SsSSqqqbbqqqSSsS....',
                '....kSppppppppppppSk....',
                '...kopqSSSSSSSSSSqpok...',
                '...kSSSffffffffffSSSk...',
                '...SfffwwwwwwwwwwfffS...',
                '..SfwwwsssssssssswwwfS..',
                '.SgwsssSSSSlbSSSSssswgS.',
                '..SsSSSppppbbppppSSSsS..',
                '...SopqqqqqqqqqqqqpoS...',
                '...kopqqSSSSSSSSqqpok...',
                '...kopSSffffffffSSpok...',
                '...koSffwwwwwwwwffSok...',
                '...kSfwwsssssssswwfSk...',
                '...SgwssSSSlbSSSsswgS...',
                '...kSsSSqqqbbqqqSSsSk...',
                '...koSqqqqqqqqqqqqSok...',
                '...koppppppppppppppok...',
                '...kopqqqqqqqqqqqqpok...',
                '...kopqqqqqqqqqqqqpok...',
                '...koppppppppppppppok...',
                '...kopqqpppyypppqqpok...',
                '....kopqppppppppqpok....',
                '....koppppppppppppok....',
                '....kopqqqqqgqgqqpok....',
                '....kopqqqqqggqgqpok....',
                '.....kopppppgppppok.....'
        ]],
            ghost: [[
                '..........a...........',
                '.........kakk.........',
                '........kaahak........',
                '........kaahak........',
                '.......kahiihak.......',
                '......kahhhhhhak......',
                '......kahiiiihak......',
                '.....kNNNNNNNNNNk.....',
                '....NNNNNNNNNNNNNN....',
                '...NNNnnnnnnnnnnNNN...',
                '..NannNNNNlbNNNNnnaN..',
                '...NNNNNNNbbNNNNNNN...',
                '...kNNNnNiiiNnNiNNk...',
                '...kahiNiiiiiNiihak...',
                '...kaxNNNNNNNNNNNak...',
                '...NNNNNNNNNNNNNNNN...',
                '..NNNnnnnfnnfnnnxNNN..',
                '.NannNNNNNlbNNNNNnnaN.',
                '..NNNNNNNNbbNNNNNNNN..',
                '...NNNnNiiiNnNiihNnN..',
                '...kahNhhhhhNhhhhaN...',
                '...kahiiiiiiiiiihak...',
                '...kahiiiiiiiiiihak...',
                '...kahhhhhhhhhhhhak...',
                '...kahiiiiiiiiiihak...',
                '...kahiihhhhhhiihak...',
                '...kahhhhhhhhhhhhak...',
                '...kahiihhxxhhiihak...',
                '....kahihhhhhhihak....',
                '....kahhhhhanhnhak....',
                '....kahiiiiainihak....',
                '.....kahiiiaNihak.....'
        ], [
                '..........a...........',
                '.........kakk.........',
                '........kaahak........',
                '........kaahak........',
                '.......kahiihak.......',
                '......kahhhhhhak......',
                '......kNNNNNNNNk......',
                '.....NNNNNNNNNNNN.....',
                '....NNNnnnnnnnnNNN....',
                '...NNnnNNNNNNNNnnNN...',
                '..NanNNNNNlbNNNNNnaN..',
                '...NNNNhhhbbhhhNNNN...',
                '...NnNiiiNnNiiiNnNk...',
                '...kNhiNNNNNNNNiNak...',
                '...kNxNNNNNNNNNNNNk...',
                '...NNNNnnnnnnnnNNNN...',
                '..NNnnnNNfNNfNNnxnNN..',
                '.NanNNNNNNlbNNNNNNnaN.',
                '..NNNNNiiNbbiiiNNNNN..',
                '..NnNhiiNnNiiiNnNaN...',
                '...NahhhhNhhhhhNhak...',
                '...kahiiiiiiiiiihak...',
                '...kahiiiiiiiiiihak...',
                '...kahhhhhhhhhhhhak...',
                '...kahiiiiiiiiiihak...',
                '...kahiihhhhhhiihak...',
                '...kahhhhhhhhhhhhak...',
                '...kahiihhxxhhiihak...',
                '....kahihhhhhhihak....',
                '....kahhhhhahnhhak....',
                '....kahiiiianinhak....',
                '.....kahiiiaNihak.....'
        ]],
            ferry: [[
                '.........kkkk.........',
                '........kDkADk........',
                '.......kDAkwADk.......',
                '......kDAwwwwADk......',
                '.....kDAwwwwwwADk.....',
                '....kDAwwwwwwwwADk....',
                '....kDAwwwwwwwwADk....',
                '...kDAwwwwwwwwwwADk...',
                '...kDAwwwwwwwwwwADk...',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwssssussssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwwwwwDDwwwwwADk..',
                '..kDAwwwwDkkDwwwwADk..',
                '..kDAwwwDkkkkDwwwADk..',
                '..kDAwwwDkkkkDwwwADk..',
                '...kDAwwwDkkDwwwADk...',
                '...kDAwwwwDDwwwwADk...',
                '....kDAwwwwwwwwADk....'
        ], [
                '.........kkkk.........',
                '........kDkADk........',
                '.......kDAkwADk.......',
                '......kDAwwwwADk......',
                '.....kDAwwwwwwADk.....',
                '....kDAwwwwwwwwADk....',
                '....kDAwwwwwwwwADk....',
                '...kDAwwwwwwwwwwADk...',
                '...kDAwwwwwwwwwwADk...',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwwwwwwwwwwwwADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsLLLLLLLLswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwsssssusssswADk..',
                '..kDAwsssssssssswADk..',
                '..kDAwwwwwDDwwwwwADk..',
                '..kDAwwwwDkkDwwwwADk..',
                '..kDAwwwDkkkkDwwwADk..',
                '..kDAwwwDkkkkDwwwADk..',
                '...kDAwwwDkkDwwwADk...',
                '...kDAwwwwDDwwwwADk...',
                '....kDAwwwwwwwwADk....'
        ]],
            speed: [[
                '......kk......',
                '.....kssk.....',
                '.....kssk.....',
                '....kswwsk....',
                '....kswwsk....',
                '....ksOOsk....',
                '...kswOOwsk...',
                '...kswOOwsk...',
                '...kswOOwsk...',
                '...kswOOwsk...',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswffffwsk..',
                '..kswLLLLwsk..',
                '..kswLLLLwsk..',
                '..kswLLLLwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswccccwsk..',
                '..kswccccwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwfwwwsk..',
                '..kswwwuwwsk..',
                '...kswwwwsk...'
        ], [
                '......kk......',
                '.....kssk.....',
                '.....kssk.....',
                '....kswwsk....',
                '....kswwsk....',
                '....ksOOsk....',
                '...kswOOwsk...',
                '...kswOOwsk...',
                '...kswOOwsk...',
                '...kswOOwsk...',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswffffwsk..',
                '..kswLLLLwsk..',
                '..kswLLLLwsk..',
                '..kswLLLLwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswccccwsk..',
                '..kswccccwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwOOwwsk..',
                '..kswwwwwwsk..',
                '..kswwfuwwsk..',
                '...kswwwwsk...'
        ]],
            canoe: [[
                '......kk......',
                '.....kZZk.....',
                '.....kZZk.....',
                '.....kZZk.....',
                '....kZYYZk....',
                '....kZYYZk....',
                '....kZYYZk....',
                '....kZYYZk....',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYggYZk...',
                '...kZYggYZk...',
                '...kZYrrYbb...',
                '.bbbbbrrYZk...',
                '.llkZYrrYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '....kZYYZk....',
                '....kZYYZk....'
        ], [
                '......kk......',
                '.....kZZk.....',
                '.....kZZk.....',
                '.....kZZk.....',
                '....kZYYZk....',
                '....kZYYZk....',
                '....kZYYZk....',
                '....kZYYZk....',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYggYZk...',
                '...kZYggYZk...',
                '...bbYrrYZk...',
                '...kZYrrbbbbb.',
                '...kZYrrYZk.ll',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '...kZYYYYZk...',
                '....kZYYZk....',
                '....kZYYZk....'
        ]]
        },
        props: {
            palm: [
                '.....k.....k......',
                '....kPk...kPk.....',
                '.....k...kPk......',
                '....kPk..kPk....k.',
                '.....kPk.kGPk..kPk',
                '.....kGPkkGPkkkPk.',
                '.k....kPkkGPkGPk..',
                'kPkkkkkGPGkPkPPk..',
                '.kPPGGGklmGkPkk...',
                '..kkPPPPmdPPkkkkk.',
                '....kkkkPPGPGGGPPk',
                '..k.kkkGPPPkPPPPkP',
                '.kPkPGGPGkPkkkkk.k',
                '..kPkPPkGPkPGk....',
                '...k.kkkGPkkPk....',
                '.......kPPkkPPk...',
                '.......kPPk.kk....',
                '......kPkk........'
        ],
            chest: [
                '..............',
                '.kkkkkkkkkkkk.',
                'kllgllllllgllk',
                'kllgllllllgllk',
                'kmmgmmggmmgmmk',
                'kmmgmmygmmgmmk',
                'kmmgmmggmmgmmk',
                'kmmgmmmmmmgmmk',
                'kddddddddddgdk',
                'gkkkkkkkkkkkgg'
        ],
            barrel: [
                '.kmmmmk.',
                'kmmllmmk',
                'mmlmmlmm',
                'mddddddm',
                'mddddddm',
                'mmlmmlmm',
                'kmmllmmk',
                '.kmmmmk.'
        ]
        }
    };

    const screen = document.getElementById('screen-gameplay');
    const pEl = document.getElementById('ship-player');
    const bEl = [1, 2, 3].map(i => document.getElementById('ship-bot' + i));
    if (!screen || !pEl || bEl.some(e => !e)) return {};
    const laneEls = [bEl[0].parentElement, bEl[1].parentElement, pEl.parentElement, bEl[2].parentElement];
    const shipEls = [bEl[0], bEl[1], pEl, bEl[2]];                    // urutan sama dengan lajur dari kiri ke kanan
    const track = pEl.parentElement.parentElement;
    track.id = 'race-track';
    const cv = document.createElement('canvas');
    cv.id = 'race-canvas'; cv.setAttribute('aria-hidden', 'true');
    track.insertBefore(cv, track.firstChild);
    const ctx = cv.getContext('2d', { alpha: false });
    const box = document.getElementById('game-container');

    const C = {
        w0: '#2b9fd2', w1: '#2796cb', wMe: '#37a9dd', crest: '#9fe4f5', crest2: '#d7f6fc', deep: '#1d7fb5',
        foam1: '#ffffff', foam2: '#d9f7fb', foam3: '#a9e6f1',
        sand: '#f1d58a', sand2: '#e2c070', sand3: '#fff0b8', speck: '#d0ac5e'
    };

    // ---- sprite ---------------------------------------------------------
    function build(rows) {
        const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
        const x = c.getContext('2d');
        for (let y = 0; y < rows.length; y++) for (let i = 0; i < rows[y].length; i++) {
            const k = rows[y][i]; if (k !== '.') { x.fillStyle = SPR.pal[k]; x.fillRect(i, y, 1, 1); }
        }
        return c;
    }
    const IMG = { ships: {} };
    Object.keys(SPR.race).forEach(k => { IMG.ships[k] = SPR.race[k].map(build); });
    function silhouette(src) {                                    // bayangan mengikuti bentuk kapal (bukan kotak)
        const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
        const x = c.getContext('2d'); x.drawImage(src, 0, 0);
        x.globalCompositeOperation = 'source-in'; x.fillStyle = '#0b3d66'; x.fillRect(0, 0, c.width, c.height);
        return c;
    }
    IMG.shadows = {}; Object.keys(IMG.ships).forEach(k => { IMG.shadows[k] = IMG.ships[k].map(silhouette); });
    IMG.palm = build(SPR.props.palm); IMG.chest = build(SPR.props.chest); IMG.barrel = build(SPR.props.barrel);

    function kindOf(el) {
        const t = el.textContent || '';
        if (t.indexOf('☠') >= 0 || t.indexOf('🏴') >= 0) return 'ghost';
        if (t.indexOf('🚢') >= 0) return 'gold';
        if (t.indexOf('⛴') >= 0) return 'ferry';
        if (t.indexOf('🚤') >= 0) return 'speed';
        if (t.indexOf('🛶') >= 0) return 'canoe';
        return 'wood';
    }

    // ---- layout ---------------------------------------------------------
    let W = 0, H = 0, cssS = 2, labelRoom = 8, finishRoom = 14;
    let crests = [], specks = [], barrels = [], wakes = [[], [], [], []], lastSpawn = [0, 0, 0, 0];
    let raf = 0, running = false, lastDraw = 0, lastCssW = 0, lastCssH = 0;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function rng(seed) {
        return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    }
    function fitHeight() {
        // arena lebih tinggi bila layar lega (panel soal butuh ~470px); minimum = tinggi asli 144px
        // tinggi arena di repo ini tetap (382px, css/style.css): tidak diubah dari sini
    }
    function layout() {
        fitHeight();
        const tw = track.clientWidth, th = track.clientHeight;
        if (!tw || !th) return false;
        lastCssW = tw; lastCssH = th;
        const dpr = window.devicePixelRatio || 1;
        const s = th >= 200 ? 2 : 1;
        cssS = Math.max(1, Math.round(s * dpr)) / dpr;
        W = Math.ceil(tw / cssS); H = Math.ceil(th / cssS);
        cv.width = W; cv.height = H;
        cv.style.width = (W * cssS) + 'px'; cv.style.height = (H * cssS) + 'px';
        ctx.imageSmoothingEnabled = false;
        labelRoom = Math.ceil(15 / cssS);
        finishRoom = Math.ceil((th >= 200 ? 34 : 24) / cssS);

        const R = rng(777);
        crests = []; const n = Math.floor(W * H / 150);
        for (let k = 0; k < n; k++) crests.push({ x: Math.floor(R() * W), y: R() * H, len: 3 + Math.floor(R() * 4), sp: 10 + R() * 8, ph: R() * 6.28 });
        specks = []; for (let k = 0; k < Math.floor(W * 1.2); k++) specks.push({ x: Math.floor(R() * W), y: Math.floor(R() * finishRoom * 0.7) });
        barrels = []; for (let k = 0; k < 3; k++) barrels.push({ x: R() * W, y: R() * H, sp: 5 + R() * 3 });
        wakes = [[], [], [], []];
        return true;
    }

    // ---- gambar ---------------------------------------------------------
    function drawWater(t, dt, lanes) {
        for (let k = 0; k < 4; k++) {
            const L = lanes[k];
            ctx.fillStyle = k === 2 ? C.wMe : (k & 1 ? C.w1 : C.w0);
            ctx.fillRect(L.x0, 0, L.x1 - L.x0, H);
        }
        for (const c of crests) {                                     // air mengalir ke bawah (kapal melaju ke atas)
            c.y += c.sp * dt; if (c.y > H + 2) { c.y -= H + 4; }
            const y = Math.round(c.y), x = c.x;
            const lg = Math.sin(t * 1.1 + c.ph) > -0.2 ? c.len : c.len - 2;
            ctx.fillStyle = C.crest; ctx.fillRect(x, y, lg, 1);
            ctx.fillStyle = C.deep; ctx.fillRect(x + 1, y + 1, Math.max(1, lg - 2), 1);
            if (lg >= 5) { ctx.fillStyle = C.crest2; ctx.fillRect(x + 1, y - 1, 1, 1); }
        }
        for (const b of barrels) {                                    // tong hanyut
            b.y += b.sp * dt; if (b.y > H + 8) { b.y = -10; b.x = Math.floor(Math.random() * (W - 8)); }
            ctx.drawImage(IMG.barrel, Math.round(b.x + Math.sin(t * 1.2 + b.x) * 1), Math.round(b.y));
        }
        // pelampung pembatas lajur
        for (let k = 1; k < 4; k++) {
            const x = lanes[k].x0;
            for (let y = labelRoom + 2; y < H - labelRoom; y += 14) {
                const yy = y + Math.round(Math.sin(t * 1.6 + y * 0.7 + k));
                ctx.fillStyle = C.foam1; ctx.fillRect(x - 1, yy, 2, 2);
                ctx.fillStyle = '#e0403f'; ctx.fillRect(x - 1, yy + 1, 2, 1);
            }
        }
        // garis start (putus-putus) tepat di atas label nama
        const sy = H - labelRoom;
        for (let x = 0; x < W; x += 6) { ctx.fillStyle = C.foam1; ctx.fillRect(x, sy, 4, 1); ctx.fillStyle = C.deep; ctx.fillRect(x, sy + 1, 4, 1); }
    }

    function drawShore(t) {
        const fr = finishRoom, step = Math.floor(t * 6);
        for (let x = 0; x < W; x++) {
            const e = Math.round(fr - 5 + 1.6 * Math.sin(x * 0.33) + 1.2 * Math.sin(x * 0.11 + 1.3));
            ctx.fillStyle = C.sand; ctx.fillRect(x, 0, 1, Math.max(0, e - 2));
            ctx.fillStyle = C.sand2; ctx.fillRect(x, Math.max(0, e - 3), 1, 2);
            ctx.fillStyle = C.sand3; ctx.fillRect(x, Math.max(0, e - 1), 1, 1);
            const ph = (x + step) & 3;
            ctx.fillStyle = ph < 2 ? C.foam1 : C.foam2; ctx.fillRect(x, e, 1, 1);
            if (ph === 0) { ctx.fillStyle = C.foam3; ctx.fillRect(x, e + 1, 1, 1); }
        }
        ctx.fillStyle = C.speck; for (const s of specks) ctx.fillRect(s.x, s.y, 1, 1);
        const sway = Math.round(Math.sin(t * 1.5));
        ctx.drawImage(IMG.palm, Math.round(W * 0.50) - 9 + sway, 0);
        ctx.drawImage(IMG.palm, Math.round(W * 0.80) - 9 - sway, Math.max(-6, fr - 20));
        ctx.drawImage(IMG.chest, Math.round(W * 0.66) - 7, Math.max(1, Math.round(fr * 0.28)));
        if (Math.floor(t * 2.5) & 1) { ctx.fillStyle = '#fff'; const cx = Math.round(W * 0.66) - 2, cy = Math.max(1, Math.round(fr * 0.28)) - 1; ctx.fillRect(cx, cy, 1, 1); ctx.fillRect(cx - 1, cy + 1, 3, 1); ctx.fillRect(cx, cy + 2, 1, 1); }
    }

    function draw(t, dt) {
        const tr = track.getBoundingClientRect();
        const ox = tr.left + track.clientLeft, oy = tr.top + track.clientTop;
        const laneRect = laneEls[0].getBoundingClientRect();
        const laneH = laneRect.height, laneBottom = laneRect.bottom;
        const lanes = laneEls.map((l, k) => {
            const r = l.getBoundingClientRect();
            return { x0: Math.round((r.left - ox) / cssS), x1: Math.round((r.right - ox) / cssS) };
        });
        lanes[0].x0 = 0; lanes[3].x1 = W;
        const tm = reduce ? 0 : t, d = reduce ? 0 : dt;

        drawWater(tm, d, lanes);
        drawShore(tm);

        // urut dari yang paling bawah agar tumpang tindih tampak wajar
        // bot yang kapalnya kembar dengan kapal pemain digambar sebagai kapal kayu agar tetap mudah dibedakan
        const playerKind = kindOf(pEl);
        const items = shipEls.map((el, k) => {
            let kind = kindOf(el);
            if (el !== pEl && kind === playerKind && playerKind !== 'wood') {
                const lab = el.nextElementSibling ? (el.nextElementSibling.textContent || '') : '';
                if (/^\s*Bot\b/i.test(lab)) kind = 'wood';
            }
            const frames = IMG.ships[kind] || IMG.ships.wood, im = frames[0];
            const r = el.getBoundingClientRect();
            const frac = Math.max(0, Math.min(1, (laneBottom - r.bottom - 14) / Math.max(1, laneH - 70)));
            const cx = (r.left + r.width / 2 - ox) / cssS;
            const travel = Math.max(0, H - labelRoom - finishRoom - im.height);
            const bottomY = (H - labelRoom - 1) - frac * travel;
            return { k, kind: IMG.ships[kind] ? kind : 'wood', frames, im, cx, top: Math.round(bottomY - im.height + 1), frac };
        });
        items.sort((a, b) => b.top - a.top);
        const fr = reduce ? 0 : (Math.floor(t * 3) & 1);

        for (const it of items) {
            const { k, im } = it;
            const sway = reduce ? 0 : Math.round(Math.sin(t * 1.3 + k * 1.7) * 0.7);
            const x = Math.round(it.cx - im.width / 2) + sway, y = it.top;
            // jejak buih di belakang kapal
            if (!reduce && t - lastSpawn[k] > 0.07) {
                lastSpawn[k] = t;
                const wk = wakes[k];
                wk.push({ x: x + im.width / 2 + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)), y: y + im.height - 1, age: 0 });
                if (wk.length > 18) wk.shift();
            }
            const wk = wakes[k];
            for (let i = wk.length - 1; i >= 0; i--) {
                const w = wk[i]; w.age += d; w.y += 16 * d;
                if (w.age > 1.1 || w.y > H) { wk.splice(i, 1); continue; }
                ctx.fillStyle = w.age < 0.35 ? C.foam1 : (w.age < 0.7 ? C.foam2 : C.foam3);
                ctx.fillRect(Math.round(w.x), Math.round(w.y), w.age < 0.35 ? 2 : 1, 1);
            }
            // bayangan di air + kapal
            ctx.globalAlpha = 0.32; ctx.drawImage(IMG.shadows[it.kind][fr % it.frames.length], x + 2, y + 2); ctx.globalAlpha = 1;
            ctx.drawImage(it.frames[fr % it.frames.length], x, y);
            // cipratan haluan
            if (!reduce) {
                const f2 = Math.floor(t * 6 + k) & 1;
                ctx.fillStyle = C.foam1; ctx.fillRect(x + Math.round(im.width / 2) - 3 - f2, y + 6, 1, 2); ctx.fillRect(x + Math.round(im.width / 2) + 2 + f2, y + 6, 1, 2);
            }
        }
    }

    // ---- siklus hidup ---------------------------------------------------
    const FRAME_MS = reduce ? 250 : 1000 / 20;
    function loop(now) {
        if (!running) return;
        raf = requestAnimationFrame(loop);
        if (now - lastDraw < FRAME_MS - 1) return;
        const dt = Math.min(0.1, (now - lastDraw) / 1000 || 0.05); lastDraw = now;
        if (track.clientWidth !== lastCssW || track.clientHeight !== lastCssH) layout();
        draw(now / 1000, dt);
    }
    function isActive() { return screen.classList.contains('active') && !document.hidden; }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function sync() {
        stop();
        if (!isActive()) return;
        if (!layout()) return;
        running = true; lastDraw = performance.now(); raf = requestAnimationFrame(loop);
    }
    new MutationObserver(sync).observe(screen, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', sync);
    let rz = 0;
    function relayout() { clearTimeout(rz); rz = setTimeout(sync, 120); }
    window.addEventListener('resize', relayout);
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(box);
    fitHeight(); sync();
    return { sync, stop };
})();

} catch (e) { console.warn('Arena balapan dimatikan:', e); }

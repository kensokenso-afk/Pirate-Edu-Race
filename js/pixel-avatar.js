/* js/pixel-avatar.js (avatar, item Storwin, pratinjau) — bagian dari upgrade grafis pixel (milik Claude; lihat docs/PEMBAGIAN-TUGAS-PIXEL.md).
   Dimuat SETELAH game.js dan multiplayer.js. Logika game tidak diubah; bila skrip ini gagal, tampilan emoji lama tetap jalan. */
try {
/* AVATAR & ITEM PIXEL ART — mengganti TAMPILAN emoji dengan sprite (orisinal).
   - Avatar karakter 20x24; item Storwin terpasang digambar di atas avatar (topi, baju, sepatu, kacamata, kompas, pet).
   - Ikon item 20x20 di kartu Storwin & Koleksi, serta panel pratinjau "Tampilanmu" di Storwin.
   Logika game (beli, pakai, localStorage, multiplayer, emoji sebagai nilai) TIDAK diubah. Bila gagal, emoji tetap tampil. */
(function () {
    'use strict';
    var DATA = {
        pal: {"o": "#2c1a0e", "s": "#f6c39a", "S": "#dc9a70", "p": "#ee8c7c", "k": "#1b1b26", "w": "#ffffff", "W": "#d5e3ee", "b": "#2f78d6", "B": "#1c4a98", "n": "#15296b", "r": "#d93a30", "R": "#8e1d17", "y": "#f7c948", "Y": "#b98a1b", "h": "#8a4b24", "H": "#5a2f14", "a": "#e8742a", "A": "#b4521a", "g": "#8d94a3", "G": "#5d6372", "l": "#c6ecff", "c": "#44d7e8", "t": "#25a39a", "T": "#167069", "e": "#f2f2f2", "m": "#a56a34", "M": "#6b4220", "q": "#39b84c", "Q": "#1f7a30", "u": "#7d8a9a", "x": "#cfd8e2", "v": "#3a8f86", "z": "#2a2f44"},
        av: {
            'sailor': [
            '....oooooooooooo....',
            '...oWWWwwwwwwWWWo...',
            '...owwwwwyywwwwwo...',
            '...oWWWWWWWWWWWWo...',
            '...nbbbbbbbbbbbbn...',
            '...ohhhhhhhhhhhho...',
            '...ohhhHHHHHHhhho...',
            '...ohGGGGssGGGGho...',
            '...ohGwkGGGGkwGho...',
            '...ohGlkGssGklGho...',
            '...ohGGGGssGGGGho...',
            '...oHppssRRssppHo...',
            '...oSSSSSSSSSSSSo...',
            '....oooooooooooo....',
            '.....obbbSSbbbo.....',
            '...ooobBBrrBBbooo...',
            '...owobbbrrbbbowo...',
            '...owowwwwwwwwowo...',
            '...osobbbbbbbboso...',
            '.....oooooooooo.....',
            '.....onnnoonnno.....',
            '.....onnnoonnno.....',
            '.....oHHHooHHHo.....',
            '....oHHHHooHHHHo....'
        ],
            'girl': [
            '....................',
            '....................',
            '....................',
            '...oRRRRRRRRRRRRo...',
            '...orrwrrrrwrwrroro.',
            '...orrrrrwwrrrrrorr.',
            '..ooaaaaaaaaaaaaorr.',
            '..oaaaaAaaaaAaaaarR.',
            '..oaaawkaAAakwaaao..',
            '..oaaakksssskkaaao..',
            '..oaassssssssssaao..',
            '..oaappssRRssppaao..',
            '..oyaSSSSSSSSSSaao..',
            '..oYaooooooooooaao..',
            '..oaAottSWWSttoAao..',
            '..oAootttWWtttooAo..',
            '...ototttrrtttoto...',
            '...ototttWWtttoto...',
            '...osotttrrtttoso...',
            '.....oooooooooo.....',
            '.....oHHHooHHHo.....',
            '.....oHHHooHHHo.....',
            '.....oHHHooHHHo.....',
            '....oHHHHooHHHHo....'
        ],
            'captain': [
            '....oooooooooooo....',
            '...owwwwwyywwwwwo...',
            '...oWWWWyYYyWWWWo...',
            '...onnnnnnnnnnnno...',
            '..onnnnnnnnnnnnnno..',
            '..kkkkkkkkkkkkkkkk..',
            '...oGGGGGGGGGGGGo...',
            '...ogGGGssssGGGgo...',
            '...ogswksssskwsgo...',
            '...ogskksssskksgo...',
            '...ogsswwwwwwssgo...',
            '...oGppsWWWWsppGo...',
            '...oSSSSSSSSSSSSo...',
            '....oooooooooooo....',
            '.....YyySWWSyyY.....',
            '...ooyyynyynyyyoo...',
            '...ononnnWWnnnono...',
            '...ononnyWWynnono...',
            '...osonnnWWnnnoso...',
            '.....YYYYYYYYYY.....',
            '.....onnnoonnno.....',
            '.....onnnoonnno.....',
            '.....oHHHooHHHo.....',
            '....oHHHHooHHHHo....'
        ],
            'king': [
            '....................',
            '.oooooowwwwwwoooooo.',
            '.ookkkkwkwwkwkkkkoo.',
            '..okkkkwwWWwwkkkko..',
            '..kkkkkkWWWWkkkkkk..',
            '..yYYYYYYYYYYYYYYk..',
            '...okkkkkkkkkkkko...',
            '..ookkkkkkkkkkkkoo..',
            '..okkkwksssskkkkko..',
            '..okkskksssskkkkko..',
            '..okksskkkkkkkkkko..',
            '..oykppssRRssppkyo..',
            '..oYkSSSkkkkSSSkko..',
            '..okkooooooooookko..',
            '..oo.RRRykkyRRR.oo..',
            '...ooRRRrkkrRRRoo...',
            '...orRRRryyrRRRro...',
            '...orRRRrkkrRRRro...',
            '...osRRRryyrRRRso...',
            '.....YYYYYYYYYY.....',
            '.....okkkookkko.....',
            '.....okkkookkko.....',
            '.....oHHHooHHHo.....',
            '....oHHHHooHHHHo....'
        ],
            'bot': [
            '........oyro........',
            '........orro........',
            '........oGGo........',
            '..oooooooooooooooo..',
            '..oeeeeeeeeeeeeeeo..',
            '..ogkkkkkkkkkkkkgo..',
            '..GgkwcckkkkccwkgG..',
            '.oGgkccckkkkccckgGo.',
            '.oGgkccckcckccckgGo.',
            '..GgkkkkkkkkkkkkgG..',
            '..oggggGGGGGGggggo..',
            '..oGGGGGGGGGGGGGGo..',
            '..oooooooooooooooo..',
            '........GGGG........',
            '.....oooGGGGooo.....',
            '...oooBBBBBBBBooo...',
            '...ogobbcGGrbbogo...',
            '...ogobbGGGGbbogo...',
            '...ooobbbbbbbbooo...',
            '.....GGGGGGGGGG.....',
            '.....oGGGooGGGo.....',
            '.....oGGGooGGGo.....',
            '.....oHHHooHHHo.....',
            '....oHHHHooHHHHo....'
        ]
        },
        icons: {
            'ship-1': [
            '....................',
            '.........rr.........',
            '.........M.r........',
            '.........Mwww.......',
            '.........Mwwww......',
            '.........Mwwwww.....',
            '.........Mwwwwww....',
            '.........Mwwwwwww...',
            '.........MWWWWWWWW..',
            '.........M..........',
            '.........W..........',
            '.........M..........',
            '.........M..........',
            '.........M..........',
            '...MMMMMMMMMMMMMM...',
            '...MmmmkmmkmmkmmM...',
            '....MmmmmmmmmmmM....',
            '.bbbbbbbbbbbbbbbbbb.',
            '....................',
            '....................'
        ],
            'ship-2': [
            '....................',
            '....................',
            '......yy............',
            '......Y.............',
            '......Yww....yy.....',
            '......Ywww...Y......',
            '......Ywwww..Yww....',
            '......Ywwwww.Ywww...',
            '......Ywwwww.Ywwww..',
            '......YWWWWW.Ywwww..',
            '......Y......YWWWW..',
            '......Y......Y......',
            '......Y......Y......',
            '..YYYYYYYYYYYYYYYY..',
            '..YyyyyyyyyyyyyyyY..',
            '...YyykyykyykyyyY...',
            '....YYYYYYYYYYYY....',
            '.bbbbbbbbbbbbbbbbbb.',
            '....................',
            '....................'
        ],
            'ship-3': [
            '.........kwk........',
            '.........wkk........',
            '.........G..........',
            '.........Gxxxxxxx...',
            '.........Gxxxuxxx...',
            '...xxxxxxGxxxxxxx...',
            '...xxuxxxGxxuxxxx...',
            '...xxxxxxGxxxxxxx...',
            '...xxxuxxGxxxxxux...',
            '...xx.xx.Gx.xx.xx...',
            '...x..x..G..x..x....',
            '.........G..........',
            '.........G..........',
            '.........G..........',
            '...zzzzzzzzzzzzzz...',
            '...zGGGcGGcGGcGGz...',
            '....zGGGGGGGGGGz....',
            '.vvvvvvvvvvvvvvvvvv.',
            '....................',
            '....................'
        ],
            'outfit-1': [
            '....................',
            '....................',
            '....................',
            '...ooo.bbbbo....ooo.',
            '...owwoobBoooooowwo.',
            '...owwwwwrrwwwwwwwo.',
            '...oWwwwwwwwwwwwwWo.',
            '...ooowwwwwwwwwwooo.',
            '.....owbbbbbbbbwo...',
            '.....owwwwwwwwwwo...',
            '.....owbbbbbbbbwo...',
            '.....owwwwwwwwwwo...',
            '.....owbbbbbbbbwo...',
            '.....owwwwwwwwwwo...',
            '.....oooooooooooo...',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'outfit-2': [
            '....................',
            '....................',
            '.....oooooooooooo...',
            '....oyyyyyyyyyyyyo..',
            '...orryyyyyyyyyyrro.',
            '..orrrRRRRooRRRRrrro',
            '..orrrRRRRyyRRRRrrro',
            '..orrrRRRRooRRRRrrro',
            '..orrrRRRRyyRRRRrrro',
            '..orrrRRRRooRRRRrrro',
            '..orrrRRRRyyRRRRrrro',
            '..orrrRRRRRRRRRRrrro',
            '..oRRrRRRRRRRRRRrRRo',
            '...oooooooooooooooo.',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'hat-1': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....oooooooooooo....',
            '..ooookkkkkkkkkoooo.',
            '.oookkkkwwwwkkkkkooo',
            '.okkkkkkwkkwkkkkkkko',
            '.okkkkkkkwwkkkkkkkko',
            '.oYyyyyyyyyyyyyyyyYo',
            '..ooooooooooooooooo.',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'hat-2': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '.....ooooooooooo....',
            '....orrrrrrrrrrro...',
            '...orrwrrrrrwrrrro..',
            '..orrrrrrrwrrrrrrro.',
            '..oRRRRRRRRRRRRRRRRo',
            '...ooooooooooooooRo.',
            '..............oRRo..',
            '...............oo...',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'shoes-1': [
            '....................',
            '....................',
            '.....oooooooo.......',
            '.....oyyyyyyo.......',
            '.....ohhhhhho.......',
            '.....yyhhhhho.......',
            '.....ohhhhhho.......',
            '.....oHhhhhho.......',
            '.....ohhhhhho.......',
            '.....ohhhhhhooooo...',
            '.....ohhhhhhhhhhoo..',
            '....oHhhhhhhhhhhhho.',
            '....oHHHHHHHHHHHHHo.',
            '....oooooooooooooo..',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'shoes-2': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '.....ssoo...........',
            '....ossmMo..........',
            '...oMmMMMMMMMo......',
            '...oMmoommmmmMoo....',
            '...oMmmmmmmmmmmMo...',
            '...oMmmmmmmmmmmmMo..',
            '....oMMMMMMMMMMMo...',
            '.....ooooooooooo....',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'pet-1': [
            '....................',
            '.........qqqq.......',
            '.........qqqq.......',
            '.......qqkkqqyy.....',
            '.......qqkkqqyy.....',
            '.......qqqqqqyy.....',
            '.......qqqqqqyy.....',
            '.....qqqqqqqq.......',
            '.....qqqqqqqq.......',
            '.....qqbbbbqq.......',
            '.....qqbbbbqq.......',
            '.....qqbbbbrr.......',
            '.....qqbbbbrr.......',
            '.......rrrr.........',
            '.......rrrr.........',
            '....................',
            '...mmmmmmmmmmmmmm...',
            '...MMMMMMMMMMMMMM...',
            '....................',
            '....................'
        ],
            'pet-2': [
            '....................',
            '.......HHHHHH.......',
            '.......HHHHHH.......',
            '.....HHkksskkHH.....',
            '.....HHkksskkHH.....',
            '.......ssSSss.......',
            '.......ssSSss.......',
            '.......hhhhhh.......',
            '.......hhhhhh.......',
            '.....hhhhhhhhHH.....',
            '.....hhhhhhhhHH.....',
            '.......hhhhHH.......',
            '.......hhhhHH.......',
            '.....hh..hh..hh.....',
            '.....hh..hh..hh.....',
            '....................',
            '...mmmmmmmmmmmmmm...',
            '...MMMMMMMMMMMMMM...',
            '....................',
            '....................'
        ],
            'acc-1': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '.ooooooo..ooooooo...',
            'ookkkkkoooookkkkkooo',
            '.okgkkkkoookkgkkko..',
            '.okkkkkko..okkkkko..',
            '..okkkko....okkkko..',
            '...oooo......oooo...',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'acc-2': [
            '.........yy.........',
            '.........yy.........',
            '.......oooooooo.....',
            '.....ooyyyyyyyyoo...',
            '....oyyYYYYYYYYyyo..',
            '....oyYwwwrwwwwYyo..',
            '...oyYwwwwrwwwwwYyo.',
            '...oyYwwwwrwwwwwYyo.',
            '...oyYwrrrrbbbbwYyo.',
            '...oyYwwwwbwwwwwYyo.',
            '...oyYwwwwbwwwwwYyo.',
            '....oyYwwwbwwwwYyo..',
            '....oyyYYYYYYYYyyo..',
            '.....ooyyyyyyyyoo...',
            '.......oooooooo.....',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'furn-1': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....oooooooooooooo..',
            '...oMMMMMMMMMMMMMMo.',
            '..oMmmmmmmmmmmmmmmMo',
            '..oYyyyyyyyyyyyyyyYo',
            '..oMmmmmyyyymmmmmMo.',
            '..oMmmmmykkymmmmmMo.',
            '..oMmmmmmmmmmmmmmMo.',
            '..oYyyyyyyyyyyyyyyYo',
            '..oMmmmmmmmmmmmmmMo.',
            '...oooooooooooooooo.',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'furn-2': [
            '....................',
            '....................',
            '....................',
            '....................',
            '.oooooooooooooooorr.',
            '.oGokkkkkkkkkkkkoy..',
            '.oGoGGGGGGGGGGGkooo.',
            '.oGokkkkkkkkkkkkoko.',
            '.oGokkkkkkkkkkkkooo.',
            '.oGokkkkkkkkkkkko...',
            '.oooooooooooooooo...',
            '.......oMMMMo.......',
            '......oMmmmmMo......',
            '......oMmooMMo......',
            '......oMmooMMo......',
            '......oMmmmmMo......',
            '.......oMMMMo.......',
            '........oooo........',
            '....................',
            '....................'
        ],
            'ship-4': [
            '....................',
            '....................',
            '....................',
            '....................',
            '..........HH........',
            '.........HHHH.......',
            '.........skks.......',
            '.........ssss.......',
            '........orrrro......',
            '........orrrrM......',
            '........oRRRRMM.....',
            'oo............MM..o.',
            'oMoMmmmmmmmmmmmmmmMo',
            '...oMMMMMMMMMMMMMMo.',
            '....oooooooooooooo..',
            '....................',
            '.bbbbbbbbbbbbbbbbbb.',
            '....................',
            '....................',
            '....................'
        ],
            'ship-5': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '........oo..........',
            '.......olo..........',
            '......ollo.ow.......',
            '......ollwoww.......',
            '....oooooooooooooo..',
            '..ooowwwwwwwwwwwwwoo',
            '.oGowwwwwwwwwwwwwwww',
            '.oGoaaaaaaaaaaaaaaao',
            '..ooowwwwwwwwwwwwwo.',
            '....oWWWWWWWWWWWo...',
            '.....oooooooooooo...',
            '.wwwwwbbbbbbbbbbbbb.',
            '..wwwbbbbbbbbbbbbbb.',
            '....................',
            '....................'
        ],
            'ship-6': [
            '....................',
            '....................',
            '..........okko......',
            '..........orro......',
            '..........orro......',
            '...oooooooooooooo...',
            '...owwwwwwwwwwwwo...',
            '...owlwlwlwlwlwwo...',
            '...owwwwwwwwwwwwo...',
            '.oooooooooooooooooo.',
            '.owwwwwwwwwwwwwwwwwo',
            '.owlwlwlwlwlwlwlwlwo',
            '.orrrrrrrrrrrrrrrrro',
            '..orrrrrrrrrrrrrrro.',
            '...oRRRRRRRRRRRRo...',
            '....ooooooooooooo...',
            '.bbbbbbbbbbbbbbbbbb.',
            '....................',
            '....................',
            '....................'
        ]
        },
        layers: {
            'hat-1': [
            '____________________',
            '_oooooowwwwwwoooooo_',
            '_ookkkkwkwwkwkkkkoo_',
            '__okkkkwwWWwwkkkko__',
            '__okkkkkWWWWkkkkko__',
            '__yYYYYYYYYYYYYYYy__',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'hat-2': [
            '____________________',
            '____________________',
            '____________________',
            '____oooooooooooo____',
            '___orrwrrrrrwrrroor_',
            '___oRRRRRwRRRRRRorr_',
            '................orr.',
            '................oRo.',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'outfit-1': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '......bbbwwbbb......',
            '....w.bBBrrBBb.w....',
            '....b.bbbrrbbb.b....',
            '....w.wwwwwwww.w....',
            '......bbbbbbbb......',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'outfit-2': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '...orryyyyyyyyrro...',
            '...oYYYYYYYYYYYYo...',
            '...orrRRRRRRRRrro...',
            '....rrRRRyyRRRrr....',
            '.....rRRRRRRRRr.....',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'shoes-1': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '.....oyyyooyyyo.....',
            '.....ohHhoohHho.....',
            '.....hhhhoohhhh.....',
            '...oHHHHHooHHHHHo...'
        ],
            'shoes-2': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '.....osssoossso.....',
            '.....oMMsoosMMo.....',
            '....MmmmmMMmmmmM....'
        ],
            'acc-1': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....kkgkkkkkkgkk....',
            '.....kkGk..kGkk.....',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'acc-2': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '........y..y........',
            '........y..y........',
            '.........yy.........',
            '........yrwy........',
            '........ywby........',
            '.........yy.........',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'pet-1': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '.................qq.',
            '................qkqy',
            '................qqqy',
            '...............qqqq.',
            '...............qbbq.',
            '...............qbbr.',
            '................rr..',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
            'pet-2': [
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................',
            '.HHH................',
            'HkskH...............',
            '.sSs................',
            '.hhh................',
            'hhhhH...............',
            '.hhH................',
            'h.h.h...............',
            '....................',
            '....................',
            '....................',
            '....................',
            '....................'
        ]
        }
    };
    var PAL = DATA.pal, AVS = DATA.av, ICONS = DATA.icons, LAYERS = DATA.layers;
    var W = 20, ORDER = ['outfit', 'shoes', 'acc', 'hat', 'pet'];
    var MAP = [
        { re: /🤓/, key: 'sailor',  alt: 'Pelaut Cerdas' },
        { re: /👧/, key: 'girl',    alt: 'Pirate Girl' },
        { re: /🧑‍✈️?/, key: 'captain', alt: 'Kapten Handal' },
        { re: /🏴‍☠️?/, key: 'king',    alt: 'Raja Bajak' },
        { re: /🤖/, key: 'bot',     alt: 'Bot' }
    ];
    var ANY = new RegExp(MAP.map(function (m) { return m.re.source; }).join('|'), 'g');
    var AV_SEL = '#display-avatar, #profile-avatar, .mp-avatar, #modal-avatar .text-2xl, .mp-chat-who';
    var HEAD_ROWS = 14;                       // baris 0-13 sprite = kepala saja (tanpa badan dan kaki); dipakai di nama pengirim chat room
    var DRESSED = '#display-avatar, #profile-avatar';
    var ITEM_SEL = '#shop-items-grid .text-2xl, #collection-grid .text-2xl';
    var ALL_SEL = AV_SEL + ', ' + ITEM_SEL;
    var urls = {};
    var FX_DESC = {
        'furn-1': 'Efek: +25 koin tiap menang (single player)',
        'furn-2': 'Efek: tameng 1x per balapan, jawaban salah pertama tak kurangi nyawa (single player)'
    };

    function toURL(cacheKey, rows) {
        if (urls[cacheKey]) return urls[cacheKey];
        var h = rows.length, cv = document.createElement('canvas'); cv.width = W; cv.height = h;
        var cx = cv.getContext('2d');
        for (var y = 0; y < h; y++) for (var x = 0; x < W; x++) {
            var ch = rows[y].charAt(x);
            if (ch === '.' || ch === '_' || !PAL[ch]) continue;
            cx.fillStyle = PAL[ch]; cx.fillRect(x, y, 1, 1);
        }
        return (urls[cacheKey] = cv.toDataURL('image/png'));
    }

    function equippedIds() {
        var out = [], eq = {};
        try { eq = GameState.equipped || {}; } catch (e) { eq = {}; }
        ORDER.forEach(function (cat) {
            var id = eq[cat === 'acc' ? 'accessories' : cat];
            if (id && LAYERS[id]) out.push(id);
        });
        return out;
    }

    function dressedURL(key, ids) {
        var ck = key + '|' + ids.join(',');
        if (urls[ck]) return urls[ck];
        var g = AVS[key].map(function (r) { return r.split(''); });
        ids.forEach(function (id) {
            var lg = LAYERS[id];
            for (var y = 0; y < lg.length && y < g.length; y++) for (var x = 0; x < W; x++) {
                var ch = lg[y].charAt(x);
                if (ch === '.') continue;
                g[y][x] = ch === '_' ? '.' : ch;
            }
        });
        return toURL(ck, g.map(function (r) { return r.join(''); }));
    }

    // Kepala saja: topi dan kacamata yang dipakai ikut tergambar; baju, sepatu, pet, dan kompas berada di bawah baris 13
    function headURL(key, ids) {
        var use = ids.filter(function (id) { return /^(hat|acc)-/.test(id); });
        var ck = 'head|' + key + '|' + use.join(',');
        if (urls[ck]) return urls[ck];
        var g = AVS[key].map(function (r) { return r.split(''); });
        use.forEach(function (id) {
            var lg = LAYERS[id];
            for (var y = 0; y < HEAD_ROWS && y < lg.length; y++) for (var x = 0; x < W; x++) {
                var ch = lg[y].charAt(x);
                if (ch === '.') continue;
                g[y][x] = ch === '_' ? '.' : ch;
            }
        });
        return toURL(ck, g.slice(0, HEAD_ROWS).map(function (r) { return r.join(''); }));
    }

    function lookup(str) {
        for (var i = 0; i < MAP.length; i++) if (MAP[i].re.test(str)) return MAP[i];
        return null;
    }

    function mkImg(url, cls, alt, title, h) {
        var img = document.createElement('img');
        img.className = cls; img.src = url; img.alt = alt || ''; if (title) img.title = title;
        img.width = W; img.height = h; img.draggable = false;
        return img;
    }

    function convertAvatar(el) {
        var head = el.matches('.mp-chat-who');                           // nama pengirim chat room -> kepala karakter saja
        var mine = head && !!el.closest('.mp-chat-msg.mine');            // pesan sendiri memakai topi/kacamata yang sedang dipakai
        var dress = el.matches(DRESSED) || mine, ids = dress ? equippedIds() : [];
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
        while ((n = walker.nextNode())) { ANY.lastIndex = 0; if (ANY.test(n.nodeValue)) nodes.push(n); }
        nodes.forEach(function (t) {
            var s = t.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
            ANY.lastIndex = 0;
            while ((m = ANY.exec(s))) {
                var def = lookup(m[0]); if (!def || !AVS[def.key]) continue;
                if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
                frag.appendChild(head ? mkImg(headURL(def.key, ids), 'pxav pxhead', m[0], def.alt, HEAD_ROWS)
                                      : mkImg(dressedURL(def.key, ids), 'pxav', m[0], def.alt, 24));
                last = m.index + m[0].length;
            }
            if (last === 0) return;
            if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
            t.parentNode.replaceChild(frag, t);
        });
    }

    function convertItem(el) {
        if (el.querySelector('img')) return;
        var txt = el.textContent.trim(), list = [];
        try { list = SHOP_ITEMS; } catch (e) { return; }
        var it = null;
        for (var i = 0; i < list.length; i++) if (list[i].icon === txt) { it = list[i]; break; }
        if (!it || !ICONS[it.id]) return;
        el.textContent = '';
        el.appendChild(mkImg(toURL('ic|' + it.id, ICONS[it.id]), 'pxit', txt, it.name, 20));
        var desc = FX_DESC[it.id];
        if (desc && el.parentElement && !el.parentElement.querySelector('.fx-desc')) {
            var d = document.createElement('span'); d.className = 'fx-desc'; d.textContent = desc;
            var nameEl = el.nextElementSibling;
            if (nameEl) nameEl.insertAdjacentElement('afterend', d); else el.insertAdjacentElement('afterend', d);
        }
    }

    /* ---- panel pratinjau di Storwin ---- */
    var prev = null;
    function buildPreview() {
        var anchor = document.querySelector('#screen-storwin .overflow-x-auto');
        if (!anchor || document.getElementById('sw-preview')) return;
        prev = document.createElement('div'); prev.id = 'sw-preview';
        prev.innerHTML = '<span id="sw-pav"></span><span id="sw-pship"></span><span id="sw-ptxt"></span>';
        anchor.parentNode.insertBefore(prev, anchor);
    }
    function avatarKey() {
        var a = ''; try { a = GameState.playerAvatar; } catch (e) { }
        var d = lookup(a); return d ? d.key : 'sailor';
    }
    function refreshPreview() {
        buildPreview(); if (!prev) prev = document.getElementById('sw-preview'); if (!prev) return;
        var ids = equippedIds(), eq = {}, names = [], list = [];
        try { eq = GameState.equipped || {}; list = SHOP_ITEMS; } catch (e) { return; }
        var pav = document.getElementById('sw-pav'), psh = document.getElementById('sw-pship'), ptx = document.getElementById('sw-ptxt');
        pav.textContent = ''; pav.appendChild(mkImg(dressedURL(avatarKey(), ids), 'pxav', '', 'Karaktermu', 24));
        var shipId = eq['ship'] && ICONS[eq['ship']] ? eq['ship'] : 'ship-1';
        psh.textContent = ''; psh.appendChild(mkImg(toURL('ic|' + shipId, ICONS[shipId]), 'pxit sm', '', 'Kapalmu', 20));
        Object.keys(eq).forEach(function (cat) {
            var it = list.filter(function (s) { return s.id === eq[cat]; })[0];
            if (it && cat !== 'ship') names.push(it.name);
        });
        ptx.textContent = names.length ? 'Dipakai: ' + names.join(', ') : 'Belum ada item dipakai. Beli lalu tekan "Pakai".';
    }

    function collect(set, node) {
        if (!node) return;
        if (node.nodeType === 3) node = node.parentElement;
        if (!node || node.nodeType !== 1) return;
        var c = node.closest ? node.closest(ALL_SEL) : null;
        if (c) set.add(c);
        if (node.querySelectorAll) node.querySelectorAll(ALL_SEL).forEach(function (e) { set.add(e); });
    }

    function inShop(node) {
        if (!node) return false;
        if (node.nodeType === 3) node = node.parentElement;
        return !!(node && node.closest && node.closest('#shop-items-grid'));
    }

    function run(records) {
        var set = new Set(), shop = false;
        if (!records) { collect(set, document.body); shop = true; }
        else records.forEach(function (r) {
            if (r.type === 'characterData') collect(set, r.target);
            else { collect(set, r.target); r.addedNodes.forEach(function (a) { collect(set, a); }); }
            if (inShop(r.target)) shop = true;
        });
        set.forEach(function (el) {
            try { if (el.matches(ITEM_SEL)) convertItem(el); else convertAvatar(el); } catch (e) { /* biarkan emoji */ }
        });
        if (shop) { try { refreshPreview(); } catch (e) { } }
    }

    document.documentElement.classList.add('px-items');
    run();
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true });
})();

} catch (e) { console.warn('Avatar & item pixel dimatikan:', e); }

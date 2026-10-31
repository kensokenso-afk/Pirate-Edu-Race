# Peta kode — PIRATE EDU-RACE

Tujuan: ringkasan struktur supaya sesi pengembangan baru (manusia atau Claude) tidak perlu membaca ulang semua file.
Dasar: branch `main` pada commit `14fecf9` (31 Okt 2026). Disusun dari pembacaan kode (analisis statis). Belum ada pengujian runtime.
Bila kode berubah, perbarui bagian yang terdampak saja dan ganti commit dasar di atas.

Catatan untuk Claude: baca file ini dulu, lalu buka hanya file yang relevan dengan tugas. Saat membaca lewat konektor GitHub, selalu isi `ref=refs/heads/main`. Pembacaan tanpa `ref` pernah mengembalikan salinan lama.

## 1. Berkas dan urutan pemuatan

| Berkas | Isi |
|---|---|
| `index.html` | Semua layar dan modal, Tailwind Browser CDN (v4.1.4, dimuat sinkron di `<head>`) + CSS cadangan |
| `js/game.js` | Inti: soal, toko, state, audio, navigasi, balapan single player, leaderboard global (klien) |
| `js/multiplayer.js` | Multiplayer MQTT, tanda tangan pesan, chat, keluarkan pemain, integrasi akun |
| `js/account.js` | Akun, token, tiket pertandingan, antrean skor. Dimuat dinamis oleh `multiplayer.js` |
| `js/pixel-scene.js` | Latar laut pixel (`#scene-canvas`) |
| `js/pixel-race.js` | Arena balapan tampak atas (`#race-canvas`) |
| `js/pixel-avatar.js` | Avatar, ikon item, panel "Tampilanmu", teks efek item (`FX_DESC`) |
| `js/pixel-fx.js` | Efek semua item Storwin |
| `js/pixel-icons.js` | Emoji dekorasi/tombol menjadi sprite (dimuat `defer` di `<head>`) |
| `css/` | `style.css`, `multiplayer.css`, `pixel.css`, `pixel-ui.css`, `pixel-icons.css` |
| `Badai_di_Samudra_widget.mp3` | Lagu latar (`BGM_SRC` di `game.js`, path relatif ke `index.html`) |
| `docs/` | `AKUN-LEADERBOARD.md`, `PEMBAGIAN-TUGAS-PIXEL.md` |

Urutan skrip: `game.js` → `multiplayer.js` → `pixel-scene.js` → `pixel-race.js` → `pixel-avatar.js` → `pixel-fx.js`. `pixel-icons.js` berjalan setelah dokumen selesai diurai. `account.js` dimuat belakangan secara asinkron.
Semua skrip pixel dibungkus `try/catch`: bila gagal, tampilan emoji lama tetap jalan.

## 2. Pembungkus fungsi global (rantai dari dalam ke luar)

Fungsi asli ada di `game.js`. Skrip lain menimpa fungsi global dan meneruskan ke versi sebelumnya. Jangan ganti nama fungsi-fungsi ini tanpa memeriksa semua pembungkusnya.

| Fungsi | Rantai |
|---|---|
| `handleAnswer` | asli → multiplayer (kemajuan MP) → pixel-fx (efek item) |
| `showVictory`, `showGameOver` | asli → multiplayer (layar hasil MP) → pixel-fx (bonus single player) |
| `confirmQuitRace`, `quitRace`, `showAlert` | asli → multiplayer |
| `launchRaceGame` | asli → pixel-fx (reset status efek) dan account.js (minta tiket pertandingan). Urutan dua pembungkus terakhir tidak dijamin |
| `loadNextQuestion`, `handleQuestionTimeout` | asli → pixel-fx |
| `submitGlobalScore`, `lbPid`, `lbFetchJson`, `renderLeaderboard`, `lbFlushPending` | asli → account.js |

Di dalam `multiplayer.js` (IIFE): `hostOnJoin`, `onRoomMsg`, `onDeny`, `joinRoom`, `renderRoom`, `leaveRoomCore` dibungkus bagian KELUARKAN PEMAIN; lalu `openLobby`, `joinRoom`, `pub`, `hostOnJoin`, `onDeny`, `onRoomMsg`, `kickOnMsg`, `leaveRoomCore` dibungkus bagian AKUN.
Event antarmodul: `mp:final` dikirim `finalize()` di `multiplayer.js`, didengar `pixel-fx.js` (bonus koin kapal).
Variabel `let` global di `game.js` (`GameState`, `matchQuestions`, `matchEnded`, `matchStartCoins`, `raceTimer`, dst.) dibaca langsung oleh skrip lain.

## 3. State dan penyimpanan

`GameState`: `playerName`, `playerAvatar`, `playerTitle`, `coins`, `xp`, `level`, `matches`, `wins`, `correctCount`, `wrongCount`, `hp`, `inventory`, `equipped`, `leaderboard` (lokal, tidak lagi ditampilkan), `musicOn`, `sfxOn`.
`loadGameState()` memvalidasi data (angka tidak negatif, avatar tanpa karakter HTML, inventaris/item terpasang hanya yang sah dan dimiliki).

Kunci `localStorage`:
- Game: `pirate_name`, `pirate_name_set`, `pirate_avatar`, `pirate_title`, `pirate_coins`, `pirate_xp`, `pirate_level`, `pirate_matches`, `pirate_wins`, `pirate_correct`, `pirate_wrong`, `pirate_inv`, `pirate_equipped`, `pirate_lb`, `pirate_music`, `pirate_sfx`
- Leaderboard: `pirate_pid` (ID perangkat, dipertahankan saat reset), `pirate_lb_cache`
- Multiplayer/akun: `pirate-edurace-kickban`, `pirate-edurace-acct` (token sesi), `pirate-edurace-scoreq` (antrean skor), `pirate-edurace-lbclaim-<pid>`

Nilai emoji dipakai sebagai data (disimpan dan dikirim lewat multiplayer). Skrip pixel hanya mengganti tampilannya.

## 4. Aturan game

- 30 soal: 10 Matematika, 10 Fiqih, 10 Olahraga (`QUESTION_DATABASE`; ada pemeriksaan jumlah 30 saat memuat). Waktu per soal: easy 30 dtk, medium 60, hard 120.
- Nyawa awal 5. Koin per jawaban benar: 5, ditambah 5 bila streak ≥ 5. XP per benar: easy 10, medium 20, hard 30. Naik level saat XP ≥ level × 100.
- Bonus kemenangan (`VICTORY_BONUS`): peringkat 1–4 = 250/175/100/50 koin dan 350/250/150/100 XP. Game over: +50 koin.
- Skor papan peringkat = koin yang didapat dalam satu balapan. Skor maksimum 530. Bonus item dibayar di luar skor.
- Single player: 3 bot acak (70%/65%/60%). Multiplayer: bot ditentukan seed yang sama di semua perangkat.
- Efek item: logika di `pixel-fx.js`, teks di `FX_DESC` (`pixel-avatar.js`). Ubah keduanya bersamaan.

## 5. Multiplayer

- Transport: MQTT lewat WebSocket ke 4 broker publik sekaligus, library `mqtt.js` dimuat dari CDN saat lobi dibuka. Topik: `pirate-edurace/v1/lobby` dan `pirate-edurace/v1/room/<KODE>`.
- Room 2–4 pemain, slot kosong diisi bot. Urutan soal dikirim host (pesan `start`).
- Pesan ditandatangani ECDSA P-256 (blok `@@SEC-BEGIN`/`@@SEC-END`). Pesan `roster`/`join` mengikat ID pemain ke kunci.
- Pesan: `ann`, `who`, `bye` (lobi); `join`, `roster`, `deny`, `leave`, `start`, `prog`, `hb`, `chat`, `chatreq`, `chathist`, `kick`, `acct` (room).
- Kapal lain digambar memakai slot `ship-bot1..3`. Emoji kapal disembunyikan lewat CSS (`visibility:hidden`) tetapi posisinya dibaca `pixel-race.js`.

## 6. Akun dan leaderboard

- Server: Supabase Edge Function `account` dan `leaderboard` (kode server tidak ada di repo). URL dari `LB_API_BASE` di `game.js`.
- Alur: masuk akun → token sesi (30 hari) → tiket pertandingan sekali pakai saat `launchRaceGame` → skor dikirim bersama statistik `{c, w, r, k}`.
- Masuk room memakai tiket 5 menit yang diperiksa host dengan kunci publik `ACCT_PUB` (di `account.js`).
- Aturan server dan operasional: lihat `docs/AKUN-LEADERBOARD.md`. Bila aturan skor/nyawa berubah, fungsi database `lb_submit_verified` harus ikut diubah.

## 7. ID penting

Layar: `screen-loading`, `screen-player-name`, `screen-main-menu`, `screen-adventure`, `screen-gameplay`, `screen-storwin`, `screen-profile`, `screen-leaderboard`, `screen-collection`, `screen-settings`, `screen-victory`, `screen-gameover`, `screen-mp-lobby`, `screen-mp-room`, `screen-mp-results`.
Modal: `modal-alert`, `modal-confirm`, `modal-avatar`, `modal-edit-name`, `modal-mp-create`, `modal-account` (dibuat oleh `account.js`).
Balapan: `race-track`, `ship-player`, `ship-bot1..3`, `quiz-panel-box`, `quiz-question-text`, `quiz-options-container`, `quiz-timer`, `race-hp-container`, `scene-canvas`, `race-canvas`.
Daftar ID yang tidak boleh disentuh skrip lain: lihat `docs/PEMBAGIAN-TUGAS-PIXEL.md`.

## 8. Sebelum mengubah kode (daftar periksa)

1. Fungsi yang mau diubah ada di tabel pembungkus? Periksa semua lapisan dan urutannya.
2. Mengubah koin/XP/nyawa/bonus? Periksa `lb_submit_verified` di server dan `pixel-fx.js`.
3. Mengubah item Storwin? Sinkronkan `SHOP_ITEMS`, `FX_DESC`, sprite di `pixel-avatar.js` dan `pixel-icons.js`.
4. Mengubah ID elemen? Cari semua referensinya di JS dan CSS (termasuk `ROOTS`/`SKIP` di `pixel-icons.js`).
5. Memakai `fetch` ke repo lewat alat: gunakan `ref=refs/heads/main`.

## 9. Temuan terbuka (audit statis, 31 Okt 2026)

Sudah diperbaiki: musik tidak dijeda di background (PR #13), avatar bisa disisipi HTML lewat `localStorage` (PR #14).

Masih terbuka:
- P2: urutan pembungkus `launchRaceGame` (pixel-fx vs account.js) tidak dijamin. Aman selama keduanya hanya meneruskan panggilan.
- P2: Tailwind CDN dimuat sinkron di `<head>`. Fallback hanya aktif saat error, bukan saat lambat.
- P3: ikon 📖 dipakai untuk semua kategori soal dan `pixel-icons.js` memberi teks alternatif "Fiqih".
- P3: `.fx-desc` (6px) dan `#sw-preview` (7px) di bawah batas 8px di `style.css`.
- P3: `#screen-mp-results` tidak ada di daftar `ROOTS` `pixel-icons.js`, jadi emoji di layar itu tidak diganti sprite.
- P3: reset data tidak menghapus `pirate-edurace-acct`, `pirate-edurace-scoreq`, `pirate-edurace-lbclaim-*` (tetap masuk akun setelah reset). Perlu keputusan apakah disengaja.
- P3: `GameState.leaderboard` (top 5 lokal) masih ditulis tetapi tidak ditampilkan.
- P3: soal hampir kembar: FQH-07 dan FQH-09, OR-03 dan OR-06.
- P3: `README.md` hampir kosong (belum ada cara menjalankan dan deploy).
- Tidak bisa diverifikasi dari repo: aturan server (`lb_submit_verified`), masa berlaku tiket pertandingan untuk balapan panjang.

## 10. Status pengujian

Semua NOT TESTED (runtime). Tes manual yang disarankan: masuk akun, buat/gabung room dua perangkat, keluarkan pemain, selesaikan balapan single dan multiplayer lalu cek skor di papan, pasang tiap item lalu cek efeknya, pindah aplikasi saat musik berjalan, muat halaman dengan jaringan lambat.

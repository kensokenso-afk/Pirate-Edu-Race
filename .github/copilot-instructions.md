# Aturan Proyek: Pirate-Edu-Race

Game balapan kapal bajak laut bertema pixel, dengan kuis pelajaran (bahasa Indonesia). Berjalan murni di browser (HTML, CSS, JavaScript biasa), tanpa proses build.

## Struktur
- `index.html`: kerangka halaman dan layar-layar game.
- `css/style.css`: gaya utama. `css/multiplayer.css`: gaya layar multiplayer.
- `js/game.js`: logika game, kuis, toko, progres lokal.
- `js/multiplayer.js`: multiplayer (MQTT) dan leaderboard (Supabase).
- Urutan `<script>` di `index.html` tidak boleh diubah: `game.js` dimuat sebelum `multiplayer.js`, dan keduanya memakai variabel global bersama (bukan ES module).

## Aturan kode
- Bahasa UI, teks soal, dan komentar: **bahasa Indonesia**.
- JavaScript biasa (`const`/`let`, fungsi), tanpa framework dan tanpa bundler.
- Jangan menambah library dari CDN baru tanpa persetujuan pemilik repo.
- Pertahankan gaya visual pixel: `image-rendering: pixelated`, palet kayu/laut yang sudah ada di variabel CSS `:root`.
- Jangan menyentuh logika penandatanganan pesan multiplayer atau kunci/URL Supabase kecuali diminta.
- Jangan menulis rahasia atau token baru ke dalam kode.

## Pembagian kerja (hindari bentrok)
- Satu file hanya diedit satu pihak dalam satu waktu.
- Copilot: animasi dan visual (latar pixel bergerak, ombak, kapal), item toko, bank soal, perbaikan UI kecil.
- Claude: arsitektur, multiplayer, leaderboard/keamanan, review PR.
- Setiap tugas dikerjakan di branch sendiri dan masuk lewat pull request. Jangan push langsung ke `main`.
- Commit kecil dengan pesan jelas, contoh: `feat: latar ombak beranimasi`.

## Data soal
- Setiap soal punya id (contoh `MATH-01`), mata pelajaran, tingkat kesulitan (easy/medium), dan batas waktu. Ikuti format soal yang sudah ada saat menambah soal, dan pastikan id tidak kembar.

## Sebelum membuka PR
- Buka `index.html` di browser, pastikan tidak ada error di konsol, dan layar utama, kuis, serta toko masih berjalan.

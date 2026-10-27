# Pembagian tugas: upgrade grafis pixel

Dokumen ini mengatur siapa mengerjakan apa pada upgrade grafis pixel, supaya Claude dan GitHub Copilot tidak mengedit file yang sama. Aturan umum tetap di `.github/copilot-instructions.md`.

## Prinsip pendekatan

Upgrade dilakukan sebagai **lapisan tambahan**. Logika game (`js/game.js`, `js/multiplayer.js`) tidak ditulis ulang. Setiap skrip pixel hanya menggambar ulang tampilan emoji menjadi sprite, dan bila skrip gagal, emoji lama tetap tampil. Nilai emoji tetap dipakai sebagai data oleh game (tersimpan di `localStorage` dan dikirim lewat multiplayer), jadi **jangan mengganti nilai emoji di data**, hanya tampilannya.

## Kepemilikan file

| File | Pemilik | Isi |
|---|---|---|
| `css/pixel.css` | Claude | gaya latar laut, arena balap, avatar, ikon item, toast efek |
| `js/pixel-scene.js` | Claude | latar laut pixel animasi di semua layar (kanvas `#scene-canvas`) |
| `js/pixel-race.js` | Claude | arena balapan tampak atas (kanvas `#race-canvas`) |
| `js/pixel-avatar.js` | Claude | avatar, ikon item Storwin dan Koleksi, panel "Tampilanmu" |
| `js/pixel-fx.js` | Claude | efek Peti Harta dan Meriam Kapal (single player) |
| `js/game.js` | Claude (hanya tiga kapal baru di `SHOP_ITEMS` dan soal `FQH-06`) | selebihnya tidak disentuh |
| `css/pixel-icons.css` | Claude (dikerjakan di PR #6; Copilot tidak sempat mengambilnya) | gaya ikon pixel kecil |
| `js/pixel-icons.js` | Claude (PR #6, diperluas di PR UI/UX) | emoji dekorasi, tombol, dan judul menjadi sprite pixel; ikon juga dibuka sebagai variabel CSS `--pxi-*` |
| `css/pixel-ui.css` | Claude | rapikan UI/UX menu utama, peta laut, lobi multiplayer, dan room (tombol, kartu, layar kosong) |
| `index.html` | Claude: tag `css/pixel.css` dan `css/pixel-ui.css`, `#scene-wrap`, empat `<script>` pixel, markup kartu pelajaran di layar peta laut. Dua baris ikon di `<head>` sudah masuk lewat PR #6 | |
| `js/multiplayer.js`, `css/style.css`, `css/multiplayer.css` | tidak diubah dalam pekerjaan ini | |

## Aturan agar tidak bentrok

1. Satu file, satu pemilik. Jangan edit file milik pihak lain, buka issue atau komentar di PR.
2. Copilot hanya boleh menambah **dua baris** di `index.html`, keduanya di `<head>` tepat setelah `<link>` Google Fonts `Press Start 2P`:
   `<link rel="stylesheet" href="css/pixel-icons.css">` dan `<script src="js/pixel-icons.js" defer></script>`.
   Baris milik Claude berada di bagian lain file, sehingga penggabungan tidak bentrok.
3. Skrip Copilot memakai `defer` agar berjalan setelah `game.js` dan `multiplayer.js`.
4. Selector yang sudah dipakai Claude tidak boleh disentuh Copilot: `#display-avatar`, `#profile-avatar`, `.mp-avatar`, `#modal-avatar`, `#shop-items-grid`, `#collection-grid`, `#sw-preview`, `#race-track`, `#scene-wrap`, `#fx-toast`, `#vic-coins`.
5. Satu tugas satu branch, masuk lewat pull request, tidak ada push langsung ke `main`.
6. Claude meninjau PR Copilot, dan Copilot meninjau PR Claude (permintaan review Copilot).

## Urutan penggabungan yang disarankan

1. PR `feat/pixel-grafis` (Claude): fondasi latar, arena, avatar, item, efek.
2. PR ikon pixel (Copilot): bisa digabung kapan saja karena file-nya terpisah.

## Pengujian sebelum PR

Buka `index.html` di browser (atau server statis) dan pastikan: tidak ada error di konsol (peringatan `AudioContext` sebelum ada sentuhan pengguna boleh diabaikan), layar menu, kuis, toko, profil, dan balapan jalan, serta emoji lama tetap muncul bila skrip pixel dimatikan.

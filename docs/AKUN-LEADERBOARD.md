# Akun pemain & leaderboard terikat akun

Dokumen ini menjelaskan dua fitur yang ditambahkan lewat `js/account.js` dan satu bagian "AKUN" di `js/multiplayer.js`.
Semuanya dibuat sebagai **pembungkus** fungsi yang sudah ada; isi fungsi lama tidak diubah.

## Ringkasan

| Fitur | Isi |
|---|---|
| Akun | Daftar / masuk (nama akun + kata sandi), token sesi bertanda tangan, klaim skor lama atas ID perangkat |
| Leaderboard terikat akun | Skor hanya diterima untuk pertandingan yang dimulai lewat akun (tiket sekali pakai); server memeriksa statistik, skor, dan lama bermain |
| Larangan keluarkan pemain per akun | Larangan 1 menit menempel pada akun, bukan ID sesi game (yang berganti tiap halaman dimuat ulang) |

## Berkas

- `js/account.js` (baru): layar masuk/daftar, token, pembungkus leaderboard (`lbPid`, `lbFetchJson`, `renderLeaderboard`, `launchRaceGame`, `submitGlobalScore`, `lbFlushPending`), strip akun di lobi/leaderboard, catatan status di layar kemenangan. Semua elemen UI disisipkan lewat JS, jadi `index.html` tidak berubah.
- `js/multiplayer.js`: satu bagian baru "AKUN — INTEGRASI MULTIPLAYER" (sebelum INISIALISASI) yang memuat `account.js` dan membungkus `openLobby`, `joinRoom`, `pub`, `hostOnJoin`, `onDeny`, `onRoomMsg`, `kickOnMsg`, `leaveRoomCore`. Logika tanda tangan pesan (`SEC`) tidak disentuh.
- Jika `account.js` gagal dimuat, semua pembungkus langsung meneruskan ke fungsi asli (perilaku lama, tanpa akun).

## Alur

**Masuk akun** -> server (`account`) mengembalikan **token sesi** ECDSA P-256 (30 hari, disimpan di `localStorage` kunci `pirate-edurace-acct`).
Token ini rahasia: hanya dikirim ke server lewat HTTPS dan **tidak pernah** ke topik room MQTT (topik room itu publik).

**Bergabung ke room** -> klien menukar token sesi dengan **tiket masuk room** (`/api/account/pass`, berlaku 5 menit, terikat ke ID sesi game `sid` dan kode room `rc`).
Tiket ikut di pesan `join` (ditandatangani oleh logika `SEC` seperti pesan lain). **Host** memeriksa tiket di browser (kunci publik di `account.js`) lalu memakai logika `join` yang lama.
Tiket yang bocor tidak berguna untuk sesi/room lain dan tidak diterima API leaderboard (payload tiket punya field `t`).

**Larangan keluarkan** -> host mencatat pemetaan sesi -> akun (`ACCTMAP`) dan menyiarkannya ke anggota (pesan `acct`). Pesan `kick` membawa ID akun yang dikeluarkan agar semua anggota (termasuk host pengganti) ikut mencatat larangannya. Penegakan utama ada di host: `join` dari akun yang dilarang ditolak (`why: 'banned'`).

**Leaderboard** -> saat pertandingan dimulai (`launchRaceGame`, termasuk balapan multiplayer) klien meminta **tiket pertandingan** (`/api/match/start`). Skor dikirim bersama tiket + statistik `{c: benar, w: salah, r: peringkat, k: streak terbaik}` ke `/api/score`.
Antrean skor (`pirate-edurace-scoreq`) menyimpan pemilik tiap skor; akun hanya mengirim skornya sendiri. Pertandingan tanpa akun tidak punya tiket, jadi tidak ada skor tamu yang menunggu.

## Backend (Supabase, proyek yang sama dengan leaderboard)

| Edge Function | Endpoint |
|---|---|
| `account` | `POST /api/account/register`, `/login`, `/pass`; `GET /api/account/pubkey` |
| `leaderboard` | `GET /api/leaderboard/{single\|multi}`; `POST /api/match/start`, `/score`, `/rename`, `/claim` |

Tabel (RLS aktif, tanpa policy; hanya bisa diakses lewat Edge Function): `game_accounts`, `game_account_keys`, `game_account_throttle`, `lb_matches`. Fungsi database: `acct_register`, `acct_login`, `lb_match_start`, `lb_submit_verified`, `lb_claim`.

## Aturan yang diperiksa server pada skor

- Tiket: milik akun itu, mode sama, belum dipakai, umur <= 24 jam.
- Statistik: benar + salah >= 30, salah <= 6 (5 nyawa + 1 perisai Feri/Meriam atau bangkit Kapal Hantu), peringkat 1-4, streak masuk akal.
- Skor = 5 x benar + 5 x (jawaban benar saat streak >= 5) + bonus peringkat (250/175/100/50). Bonus item (sepatu, hewan, peti, kapal) dibayar di luar skor papan peringkat.
- Lama bermain sejak tiket dikeluarkan >= 1,5 detik x jumlah soal.
- Batas pembuatan tiket: 1 per 5 detik, 40 per jam per akun. Batas pendaftaran: 5 per jam per IP. Batas gagal login: 8 per 10 menit per akun.

Jika aturan game berubah (nilai koin, bonus peringkat, jumlah nyawa maksimum), fungsi `lb_submit_verified` perlu disesuaikan, jika tidak skor yang sah akan ditolak.

## Operasional

- **Kunci penanda tangan**: dibuat otomatis oleh `account` saat pertama dipakai dan disimpan di `game_account_keys`. Kunci publiknya ada di `ACCT_PUB` (`js/account.js`). Mengganti kunci (hapus baris `game_account_keys`) membuat semua token lama tidak sah dan pemain harus masuk lagi; nilai `ACCT_PUB` harus ikut diperbarui dari `GET /api/account/pubkey`.
- **Menonaktifkan sementara**: hapus pemuat `loadAccountModule` di bagian AKUN `js/multiplayer.js`. Catatan: server leaderboard tetap mewajibkan token + tiket, jadi skor baru tidak masuk papan tanpa `account.js`.
- **URL server** diturunkan dari `LB_API_BASE` di `js/game.js` (`/leaderboard` diganti `/account`), jadi tidak ada URL Supabase baru di klien.

## Batasan yang diketahui

- Game berjalan di browser pemain: pemain yang membaca jawaban dari kode game atau memakai bot dengan jeda wajar tetap bisa mencapai skor sempurna (530). Server hanya membatasi skor ke yang mungkin secara aturan, tidak membuktikan pemain menjawab sendiri.
- Larangan keluarkan menempel pada akun; pemain bisa mendaftar akun baru (pendaftaran dibatasi per IP). Larangan hanya 1 menit sehingga ini dianggap wajar.
- Host pengganti hanya tahu akun anggota yang bergabung setelah ia mengenal pemetaan (pemetaan disiarkan setiap ada pemain baru bergabung).
- Belum ada fitur lupa kata sandi (akun memakai nama saja, tanpa email).

## Cek manual untuk peninjau

1. Buka MULTIPLAYER tanpa login -> layar akun muncul; daftar -> masuk ke lobi dengan strip nama akun.
2. Dua perangkat/akun: buat room, gabung dengan kode; host menekan KELUARKAN -> pemain itu muncul pesan dikeluarkan; muat ulang + hapus data browser + masuk lagi dengan akun yang sama -> masih ditolak selama 1 menit.
3. Main satu pertandingan single penuh saat login -> catatan "Skor terkirim ke papan global" dan baris akun tampil di LEADERBOARD.
4. Main sebagai tamu -> catatan ajakan masuk akun; tidak ada skor yang terkirim.
5. Pakai Kapal Hantu/Feri: selesaikan pertandingan dengan 5-6 jawaban salah -> skor tetap diterima.

# Enhanced WhiskeySockets Interactive Buttons

Library ini menunjukkan cara mengirim setiap jenis tombol interaktif / alur native WhatsApp yang saat ini diketahui menggunakan WhiskeySockets (fork Baileys) tanpa memodifikasi sumber inti. Fungsionalitas ini dikemas dan diterbitkan sebagai paket npm `baileys_helper` yang mereproduksi struktur node biner yang dipancarkan oleh klien resmi sehingga tombol dirender dengan benar untuk obrolan pribadi & grup.

## Pernyataan Masalah

Secara default, WhiskeySockets tidak dapat mengirim tombol interaktif sementara itsukichan dapat. Akar penyebabnya adalah WhiskeySockets tidak memiliki pembungkus node biner (`biz`, `interactive`, `native_flow`) yang diharapkan WhatsApp untuk pesan interaktif.

## Solusi

Fungsionalitas tambahan yang disediakan oleh paket `baileys_helper` menyediakan fungsionalitas yang hilang dengan:

1. **Mendeteksi pesan tombol** menggunakan logika yang sama dengan itsukichan
2. **Mengkonversi** format `interactiveButtons` WhiskeySockets ke struktur protobuf yang tepat
3. **Menambahkan node biner yang hilang** (`biz`, `interactive`, `native_flow`, `bot`) melalui `additionalNodes`
4. **Menangani secara otomatis** persyaratan obrolan pribadi vs grup

## Fitur Utama

- ✅ **Tanpa modifikasi** pada WhiskeySockets atau folder itsukichan
- ✅ **Fungsionalitas template dihapus** sesuai permintaan
- ✅ **Injeksi node biner otomatis** untuk pesan tombol
- ✅ **Dukungan obrolan pribadi** (menambahkan node `bot` dengan `biz_bot: '1'`)
- ✅ **Dukungan obrolan grup** (menambahkan hanya node `biz`)
- ✅ **Kompatibilitas mundur** (pesan reguler melewati tanpa perubahan)

## Mulai Cepat (Kasus Paling Umum)

```javascript
import { sendButtons } from 'baileys_helper';

await sendButtons(himmel, jid, {
  title: 'Judul Header',            // header opsional
  text: 'Pilih salah satu opsi di bawah',    // body
  footer: 'Teks Footer',            // footer opsional
  buttons: [
    { id: 'quick_1', text: 'balasan Cepat' },       // bentuk sederhana legacy otomatis dikonversi
    {
      name: 'cta_url',
      buttonParamsJson: JSON.stringify({
        display_text: 'Buka Situs',
        url: 'https://example.com'
      })
    }
  ]
});
```

Untuk kontrol penuh (beberapa jenis tombol tingkat lanjut dalam satu pesan) gunakan `sendInteractiveMessage` dengan `interactiveButtons` secara langsung.

```javascript
import { sendInteractiveMessage } from 'baileys_helper';

await sendInteractiveMessage(himmel, jid, {
  text: 'Demo alur native tingkat lanjut',
  footer: 'Semua fitur',
  interactiveButtons: [
    // balasan cepat (bentuk eksplisit)
    {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: 'Balas A', id: 'reply_a' })
    },
    // Pemilih tunggal (daftar di dalam tombol)
    {
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: 'Pilih Satu',
        sections: [{
          title: 'Pilihan',
          rows: [
            { header: 'H', title: 'Halo', description: 'Ucapkan hai', id: 'opt_hello' },
            { header: 'B', title: 'Sampai jumpa', description: 'Ucapkan bye', id: 'opt_bye' }
          ]
        }]
      })
    }
  ]
});
```

---
## Jenis Tombol yang Didukung (Nama Alur Native)

Di bawah ini adalah nilai `name` yang paling umum & diamati untuk `nativeFlowMessage.buttons[]` beserta kunci JSON yang diperlukan. Anda dapat mencampurkan beberapa dalam satu array `interactiveButtons` (WhatsApp akan memutuskan tata letak).

| Nama | Tujuan | buttonParamsJson (kunci yang diperlukan) |
|------|---------|----------------------------------|
| `quick_reply` | Balasan sederhana yang mengirim kembali `id`-nya | `{ display_text, id }` |
| `single_select` | Pemilih daftar di dalam tombol | `{ title, sections:[{ title?, rows:[{ id, title, description?, header? }] }] }` |
| `cta_url` | Buka URL | `{ display_text, url, merchant_url? }` |
| `cta_copy` | Salin teks ke clipboard | `{ display_text, copy_code }` |
| `cta_call` | Ketuk untuk menelepon | `{ display_text, phone_number }` |
| `cta_catalog` | Buka katalog bisnis | `{ display_text? }` (WA mungkin mengabaikan kunci tambahan) |
| `send_location` | Minta lokasi pengguna (alur khusus) | `{ display_text? }` |
| `review_and_pay` | Ringkasan pesanan / pembayaran (khusus) | Payload terstruktur pembayaran (divalidasi server) |
| `payment_info` | Alur info pembayaran | Payload terstruktur pembayaran |
| `mpm` | Pesan produk multi (katalog) | Struktur internal vendor |
| `wa_payment_transaction_details` | Tampilkan transaksi | Kunci referensi transaksi |
| `automated_greeting_message_view_catalog` | Salam -> katalog | (Minimal / internal) |

Tidak semua nama khusus dijamin untuk dirender di luar klien resmi / bisnis; yang tidak didukung hanya diabaikan oleh WhatsApp. Inti yang stabil untuk bot adalah: `quick_reply`, `single_select`, `cta_url`, `cta_copy`, `cta_call`.

### Contoh: URL, Salin & Panggilan Bersamaan
```javascript
await sendInteractiveMessage(himmel, jid, {
  text: 'Aksi kontak',
  interactiveButtons: [
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Dokumentasi', url: 'https://example.com' }) },
    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Salin Kode', copy_code: 'ABC-123' }) },
    { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: 'Panggil Dukungan', phone_number: '+1234567890' }) }
  ]
});
```

### Contoh: balasan Cepat Campuran + Katalog
```javascript
await sendInteractiveMessage(himmel, jid, {
  text: 'Jelajahi produk atau balas',
  interactiveButtons: [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Halo', id: 'hi' }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Harga', id: 'pricing' }) },
    { name: 'cta_catalog', buttonParamsJson: JSON.stringify({}) }
  ]
});
```

### Contoh: Permintaan Lokasi (Eksperimental)
```javascript
await sendInteractiveMessage(himmel, jid, {
  text: 'Silakan bagikan lokasi Anda',
  interactiveButtons: [
    { name: 'send_location', buttonParamsJson: JSON.stringify({ display_text: 'Bagikan Lokasi' }) }
  ]
});
```

### Contoh: Menu Pemilih Tunggal
```javascript
await sendInteractiveMessage(himmel, jid, {
  text: 'Pilih satu item',
  interactiveButtons: [
    { name: 'single_select', buttonParamsJson: JSON.stringify({
        title: 'Menu',
        sections: [{
          title: 'Utama',
          rows: [
            { id: 'it_1', title: 'Pertama', description: 'Pilihan pertama' },
            { id: 'it_2', title: 'Kedua', description: 'Pilihan kedua' }
          ]
        }]
    }) }
  ]
});
```

> Tip: Objek sederhana legacy seperti `{ id: 'x', text: 'Label' }` yang diteruskan ke `sendButtons` otomatis dikonversi ke `quick_reply`.

## Detail Teknis

### Struktur Node Biner (Apa yang Disuntikkan Wrapper)

Obrolan pribadi: menambahkan `biz` + `interactive/native_flow` + `bot (biz_bot=1)`.

Obrolan grup: menambahkan hanya `biz` + `interactive/native_flow`.

Ketika nama tombol pertama khusus (`review_and_pay`, `payment_info`, `mpm`, dll.) terdeteksi, atribut versi/nama berubah untuk mencocokkan lalu lintas klien resmi sehingga WhatsApp mengaktifkan alur tersebut.

### Deteksi Jenis Tombol

Wrapper mendeteksi jenis tombol menggunakan logika yang sama dengan itsukichan:

- `listMessage` → 'list'
- `buttonsMessage` → 'buttons'  
- `interactiveMessage.nativeFlowMessage` → 'native_flow'

### Alur Konversi Konten

Penulisan (Anda tulis):
```javascript
{ text, footer, interactiveButtons: [{ name, buttonParamsJson }, ...] }
```
Wrapper membangun (dikirim ke WA):
```javascript
{ interactiveMessage: { nativeFlowMessage: { buttons: [...] }, body:{ text }, footer:{ text } } }
```

## File yang Dimodifikasi

### Referensi API Terperinci: `sendInteractiveMessage`

Pembantu tingkat lanjut tingkat rendah yang digunakan oleh semua pembungkus tingkat tinggi. Gunakan ini ketika Anda perlu:
- Mencampur beberapa jenis tombol tingkat lanjut dalam satu pesan (misalnya `quick_reply` + `single_select` + `cta_url`).
- Memberikan konten `interactiveMessage` yang sudah dibuat (setelah transformasi internal) sambil tetap mendapat manfaat dari injeksi node biner otomatis.
- Melampirkan opsi relay kustom (`statusJidList`, `additionalAttributes`, bidang eksperimental) atau secara manual menambahkan `additionalNodes` ekstra.

#### Tanda Tangan
```js
async function sendInteractiveMessage(himmel, jid, content, options = {})
```

#### Parameter
- `himmel`: Socket WhiskeySockets/Baileys aktif (harus mengekspos `relayMessage`, `logger`, `authState` atau `user`).
- `jid`: JID WhatsApp tujuan (pengguna atau grup). Mendeteksi grup secara otomatis melalui `WABinary.isJidGroup`.
- `content`: Objek penulisan tingkat tinggi. Menerima bentuk pesan Baileys biasa atau bentuk penulisan yang disempurnakan:
  - `text` (string) Teks body (dipetakan ke `interactiveMessage.body.text`).
  - `footer` (string) Footer (dipetakan ke `interactiveMessage.footer.text`).
  - `title` / `subtitle` (string) Judul header opsional (dipetakan ke `interactiveMessage.header.title`).
  - `interactiveButtons` (Array) Array deskriptor tombol. Setiap item harus berupa:
    - `{ name: '<native_flow_name>', buttonParamsJson: JSON.stringify({...}) }` (sudah dinormalisasi), atau
    - Bentuk balasan cepat legacy `{ id, text }` / `{ buttonId, buttonText: { displayText } }` yang otomatis dinormalisasi ke `quick_reply`.
  - Kunci pesan Baileys lainnya (misalnya `contextInfo`) melewati tanpa perubahan.
- `options`: (Opsional) Opsi relay + generasi ekstra:
  - Semua bidang yang diterima oleh `generateWAMessageFromContent` (misalnya `timestamp` kustom).
  - `additionalNodes` (Array) Awali node biner Anda sendiri (fungsi menambahkan node interaktif yang diperlukan setelah deteksi).
  - `additionalAttributes` (Object) Atribut ekstra untuk stanza relay root.
  - `statusJidList`, `useCachedGroupMetadata` (opsi relay Baileys tingkat lanjut).

#### Apa yang Dilakukannya Secara Internal
1. Memanggil `convertToInteractiveMessage(content)` jika `interactiveButtons` ada, menghasilkan:
   ```js
   { interactiveMessage: { nativeFlowMessage: { buttons: [...] }, header?, body?, footer? } }
   ```
2. Mengimpor pembantu internal WhiskeySockets (`generateWAMessageFromContent`, `normalizeMessageContent`, `isJidGroup`, `generateMessageIDV2`). Melempar jika tidak tersedia.
3. Membangun `WAMessage` mentah melewati validasi pengiriman normal (memungkinkan jenis interaktif yang tidak didukung untuk melewati).
4. Menormalisasi dan menentukan jenis tombol melalui `getButtonType` kemudian menurunkan pohon node biner dengan `getButtonArgs`.
5. Menyuntikkan node biner yang diperlukan:
   - Selalu node `biz` (dengan `interactive/native_flow/...` bersarang untuk tombol dan daftar) saat interaktif.
   - Menambahkan `{ tag: 'bot', attrs: { biz_bot: '1' } }` secara otomatis untuk obrolan pribadi (1:1) yang memungkinkan rendering alur interaktif.
6. Meneruskan pesan menggunakan `relayMessage` dengan `additionalNodes`.
7. Secara opsional memancarkan pesan secara lokal (`himmel.upsertMessage`) untuk obrolan pribadi jika `himmel.config.emitOwnEvents` diatur (grup dilewati untuk menghindari duplikat).

#### Nilai Kembali
Mengembalikan objek `WAMessage` lengkap yang dibangun (`{ key, message, messageTimestamp, ... }`) sehingga Anda dapat mencatat/menyimpan/menunggu acks persis seperti panggilan `himmel.sendMessage` standar.

#### Penanganan Kesalahan
- Melempar `Socket diperlukan` jika `himmel` null/undefined.
- Melempar `Fungsi WhiskeySockets tidak tersedia` jika modul internal tidak dapat dimuat (misalnya perubahan jalur). Dalam kasus seperti itu, Anda mungkin kembali ke `himmel.sendMessage` biasa untuk pesan non-interaktif.

#### Memilih Antara Pembantu
- Gunakan `sendButtons` / `sendInteractiveButtonsBasic` untuk balasan cepat sederhana + kasus CTA umum.
- Gunakan `sendInteractiveMessage` untuk kombinasi apa pun termasuk `single_select`, nama alur native khusus, atau ketika Anda perlu melampirkan node kustom.

#### Contoh Tingkat Lanjut: Tombol Campuran + Daftar + Node Kustom
```js
import { sendInteractiveMessage } from 'baileys_helper';

await sendInteractiveMessage(himmel, jid, {
  text: 'Pilih atau jelajahi',
  footer: 'Demo tingkat lanjut',
  interactiveButtons: [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Hai', id: 'hi' }) },
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Dokumentasi', url: 'https://example.com' }) },
    { name: 'single_select', buttonParamsJson: JSON.stringify({
        title: 'Menu',
        sections: [{
          title: 'Opsi',
          rows: [
            { id: 'a', title: 'Alfa', description: 'Item pertama' },
            { id: 'b', title: 'Beta', description: 'Item kedua' }
          ]
        }]
    }) }
  ]
}, {
  additionalNodes: [ { tag: 'biz', attrs: { experimental_flag: '1' } } ] // akan digabungkan sebelum node interaktif otomatis
});
```

#### Nama Alur Native Khusus & Efek
| Nama Tombol Pertama | Varian Node yang Disuntikkan | Catatan |
|-------------------|-----------------------|-------|
| `review_and_pay`  | `biz` dengan `native_flow_name=order_details` | Alur pesanan/pembayaran |
| `payment_info`    | `biz` dengan `native_flow_name=payment_info`  | Alur info pembayaran |
| `mpm`, `cta_catalog`, `send_location`, `call_permission_request`, `wa_payment_transaction_details`, `automated_greeting_message_view_catalog` | `biz > interactive(native_flow v=1) > native_flow(v=2,name=<name>)` | Khusus (mungkin memerlukan klien resmi) |
| Apa pun / campuran | `biz > interactive(native_flow v=1) > native_flow(v=9,name=mixed)` | Jalur generik yang mencakup balasan cepat standar, daftar, CTA |

#### Performa / Throughput
Biaya kira-kira setara dengan panggilan `sendMessage` standar; overhead ekstra adalah transformasi sinkron kecil + injeksi node. Cocok untuk bot volume tinggi. Pertimbangkan batas konkurensi Baileys standar untuk skenario siaran besar.

#### Tips Debugging
- Log konsol sementara yang dipancarkan: `Interactive send: { type, nodes, private }` – hapus atau alihkan jika berisik.
- Jika tombol tidak dirender: pastikan node biner pertama yang disuntikkan adalah `biz` dan obrolan pribadi menyertakan node `bot`.
- Konfirmasi `buttonParamsJson` setiap tombol adalah string JSON yang valid (tangkap kesalahan JSON.stringify sejak dini).

#### Kesalahan Umum
- Lupa JSON.stringify payload `buttonParamsJson`.
- Menggunakan `sendInteractiveMessage` tanpa socket yang menyertakan `relayMessage` (misalnya, melewatkan objek yang sebagian dibangun).
- Menambahkan node `bot` Anda sendiri untuk obrolan pribadi (tidak diperlukan; otomatis ditambahkan).
- Mengharapkan alur khusus yang tidak didukung (pembayaran/katalog) untuk dirender di akun non-bisnis—WhatsApp mungkin mengabaikannya secara diam-diam.

#### Penggunaan Mentah Minimal
Jika Anda telah membangun objek `interactiveMessage` yang benar, Anda dapat memanggil:
```js
await sendInteractiveMessage(himmel, jid, {
  interactiveMessage: {
    nativeFlowMessage: {
      buttons: [ { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Hai', id: 'hi' }) } ]
    },
    body: { text: 'Alur native langsung' }
  }
});
```
Pembantu masih akan menyuntikkan node biner & node bot sesuai kebutuhan.

## Instalasi

```bash
npm install baileys_helper
```

## Penggunaan Dasar

```javascript
import { sendButtons, sendInteractiveMessage } from 'baileys_helper';
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import chalk from 'chalk';

// Inisialisasi socket
const { state, saveCreds } = await useMultiFileAuthState('auth_info');
const himmel = makeWASocket({
  auth: state,
  printQRInTerminal: true
});

// Event handler untuk koneksi
himmel.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
    console.log(chalk.red('Koneksi terputus karena '), lastDisconnect.error, ', reconnect ', shouldReconnect);
    if (shouldReconnect) {
      startBot();
    }
  } else if (connection === 'open') {
    console.log(chalk.green('Koneksi terbuka'));
  }
});

// Contoh pengiriman tombol interaktif
async function sendInteractiveExample() {
  try {
    await sendButtons(himmel, '6281234567890@s.whatsapp.net', {
      text: 'Silakan pilih menu di bawah ini:',
      footer: 'Dibuat dengan Baileys Helper',
      buttons: [
        { id: 'menu_1', text: 'Menu 1' },
        { id: 'menu_2', text: 'Menu 2' },
        { id: 'menu_3', text: 'Menu 3' }
      ]
    });
    console.log(chalk.green('Pesan tombol terkirim!'));
  } catch (error) {
    console.error(chalk.red('Gagal mengirim pesan:'), error);
  }
}
```

## Kompatibilitas

- ✅ WhiskeySockets 7.0.0-rc.2+
- ✅ Node.js 14+
- ✅ Semua jenis tombol yang didukung oleh itsukichan
- ✅ Obrolan pribadi dan grup
- ✅ Modul ES (ESM) dan CommonJS

## Hasil

Anda sekarang dapat mengirim semua varian tombol interaktif arus utama (balasan cepat, URL / salin / panggilan CTA, daftar pemilih tunggal) ditambah alur khusus eksperimental dari WhiskeySockets persis seperti klien resmi, dengan penanganan otomatis untuk grup vs obrolan pribadi dan tanpa mengedit sumber fork.
# Compliance Findings — SME Dashboard
**Divisi:** Business Banking Division (BBD)  
**Sistem:** SME Dashboard (prototype internal)  
**Tanggal:** 23 Juni 2026  
**Penyusun:** Rachman Ridwan (Intern BBD)  
**Status:** Prototype — belum melalui review IT Division / Divisi Kepatuhan

---

## 1. Gambaran Sistem

SME Dashboard adalah aplikasi web internal berbasis Next.js yang digunakan oleh Business Banking Division untuk memantau portofolio kredit dan kinerja debitur. Sistem ini saat ini di-deploy di platform Vercel (cloud provider berbasis AS) sebagai solusi sementara selama menunggu penyediaan server internal.

**Stack teknis:**
- Framework: Next.js 14 (App Router)
- Database: PostgreSQL via Prisma ORM (Vercel Postgres)
- File storage: Vercel Blob
- Auth: NextAuth.js + TOTP 2FA
- Deploy: Vercel (region: us-east-1 / global CDN)

**Fitur utama:**
- Credit Monitoring — upload dan visualisasi data IDAS per kanwil/cabang
- Business Monitoring — pencocokan IDAS dengan master data BPJS, SPBU, Indomaret
- Memo — pencatatan dan persetujuan memo internal
- Admin Portal — manajemen user, reset password, audit log

**Data yang diproses:** Nama debitur, nomor debitur, nomor rekening, baki debet, kolektibilitas (KOL), plafon, tanggal akad — keseluruhan merupakan data pribadi dan data nasabah yang dilindungi regulasi.

---

## 2. Kerangka Regulasi

| Regulasi | Pokok Ketentuan | Relevansi |
|---|---|---|
| **POJK 11/POJK.03/2022** | Penyelenggaraan Teknologi Informasi oleh Bank Umum — wajib mendapat persetujuan OJK untuk menempatkan sistem elektronik di luar Indonesia | Deployment Vercel berada di luar yurisdiksi Indonesia |
| **PADK OJK 1/2026** (berlaku 1 Mar 2026) | Pedoman teknis POJK 11 — due diligence PPJTI, penilaian materialitas, exit strategy | Vercel sebagai PPJTI memerlukan due diligence dan perjanjian formal |
| **SEOJK 29/SEOJK.03/2022** | Ketahanan siber bank — penetration testing berkala, incident response, manajemen kerentanan | Belum ada pentest dan incident response plan |
| **UU PDP No. 27/2022** | Perlindungan Data Pribadi — pembatasan transfer lintas batas, DPA wajib, notifikasi pelanggaran 3×24 jam | Data nasabah diproses di server AS tanpa perjanjian memadai |

---

## 3. Temuan Kepatuhan

Setiap temuan diklasifikasikan berdasarkan tingkat risiko:

- **KRITIS** — potensi pelanggaran regulasi langsung, data nasabah terekspos
- **TINGGI** — kelemahan signifikan yang dapat dieksploitasi atau menimbulkan sanksi
- **SEDANG** — kelemahan yang perlu diperbaiki sebelum go-production

---

### F-01 — Deployment Sistem di Infrastruktur Asing Tanpa Persetujuan OJK
**Tingkat Risiko:** KRITIS  
**Regulasi:** POJK 11/POJK.03/2022 Pasal 10, PADK OJK 1/2026

**Deskripsi:**  
Seluruh sistem SME Dashboard di-deploy di Vercel, cloud provider berbasis di Amerika Serikat. Data nasabah (PII) diproses dan disimpan di server di luar wilayah Indonesia. Berdasarkan POJK 11, bank wajib mendapatkan persetujuan OJK sebelum menempatkan sistem elektronik dan/atau data di luar Indonesia, kecuali untuk sistem yang dikecualikan secara eksplisit.

Vercel dikategorikan sebagai **PPJTI (Penyedia Jasa Teknologi Informasi)** di bawah POJK 11. Penggunaan PPJTI memerlukan:
- Perjanjian tertulis yang memuat klausul audit, keamanan, dan exit strategy
- Due diligence terhadap PPJTI sesuai PADK OJK 1/2026
- Notifikasi/persetujuan OJK tergantung hasil penilaian materialitas

**Bukti teknis:**
```
vercel.json / deployment target: Vercel platform (us-east-1)
src/lib/storage/vercel-blob-adapter.js — data disimpan ke Vercel Blob
prisma/schema.prisma + DATABASE_URL — database di Vercel Postgres
```

**Dampak potensial:** Sanksi administratif OJK, teguran tertulis, kewajiban segera migrasi.

---

### F-02 — Vercel Blob Dikonfigurasi Public Access
**Tingkat Risiko:** KRITIS  
**Regulasi:** UU PDP 27/2022 Pasal 16 (keamanan data pribadi), SEOJK 29

**Deskripsi:**  
Seluruh file yang disimpan ke Vercel Blob menggunakan flag `access: 'public'`, sehingga URL blob dapat diakses tanpa autentikasi oleh siapapun yang mengetahui URL-nya. Data yang disimpan dalam kondisi ini mencakup PII nasabah yang tidak ter-mask.

**Bukti teknis:**
```javascript
// src/lib/storage/vercel-blob-adapter.js
async put(key, value, opts = {}) {
  const blob = await put(fullKey, value, {
    access: 'public',   // <-- seluruh blob dapat diakses publik
    ...opts,
  })
  ...
}
```

File yang terekspos:
- `{type}_parsed.json` — data IDAS lengkap (nama, noRekening, bakiDebet, kol)
- `{type}_manual_parsed.json` — data master lengkap (nama, noDebitur)
- `history/{uploadId}_{type}.json` — riwayat upload, tidak pernah dihapus

---

### F-03 — Masking PII Hanya Dilakukan di Layer API, Bukan di Storage
**Tingkat Risiko:** KRITIS  
**Regulasi:** UU PDP 27/2022, prinsip data minimization

**Deskripsi:**  
Fungsi masking (`maskBusinessData`, `maskBusinessRow`) hanya dipanggil saat data dikembalikan melalui API response. Data yang tersimpan di Vercel Blob selalu dalam bentuk unmasked — nama lengkap, nomor debitur, nomor rekening aktual.

**Bukti teknis:**
```javascript
// src/app/api/data/[type]/[file]/route.js
const raw = await storage.get(key)
const data = JSON.parse(raw)
// masking dilakukan DI SINI, setelah data dibaca dari storage
return NextResponse.json(maskBusinessData(data, isUnlocked))
```

```javascript
// src/lib/business-upload-handler.js — tidak ada masking saat menyimpan
await storage.put(`${type}_parsed.json`, JSON.stringify(parsed))
```

Artinya: perlindungan masking **tidak berlaku** untuk akses langsung ke URL Vercel Blob (lihat F-02).

---

### F-04 — Riwayat Upload Menyimpan PII Tanpa Retensi Policy
**Tingkat Risiko:** TINGGI  
**Regulasi:** UU PDP 27/2022 Pasal 22 (batas waktu penyimpanan data)

**Deskripsi:**  
Setiap upload menghasilkan file riwayat di path `history/{uploadId}_{type}.json` yang berisi data PII tidak ter-mask. File-file ini tidak pernah dihapus secara otomatis dan terakumulasi tanpa batas.

**Bukti teknis:**
```javascript
// src/lib/business-upload-handler.js
const histKey = `history/${uploadId}_${type}.json`
await storage.put(histKey, JSON.stringify(parsed))
// tidak ada cleanup / TTL / deletion policy
```

---

### F-05 — TOTP Encryption Key Berada di Environment yang Sama dengan Data
**Tingkat Risiko:** TINGGI  
**Regulasi:** SEOJK 29 (prinsip key management)

**Deskripsi:**  
`TOTP_ENCRYPTION_KEY` yang digunakan untuk mengenkripsi `totpSecret` user disimpan sebagai Vercel environment variable — di environment yang sama dengan data yang dilindunginya. Jika lingkungan Vercel dikompromikan, kunci dan data dapat diakses bersama, menghilangkan manfaat enkripsi.

**Bukti teknis:**
```javascript
// src/lib/crypto.js
const KEY = Buffer.from(process.env.TOTP_ENCRYPTION_KEY, 'hex')
// Key dan data terenkripsi berada di infrastruktur yang sama
export function decryptSecret(enc) { ... }
```

Penilaian: enkripsi AES-256-GCM yang diimplementasikan sudah benar secara teknis, namun key management-nya tidak sesuai prinsip separation of concerns.

---

### F-06 — Password Sementara Dikembalikan dalam Plaintext via API Response
**Tingkat Risiko:** TINGGI  
**Regulasi:** SEOJK 29 (keamanan autentikasi), best practice OWASP

**Deskripsi:**  
Endpoint reset password admin mengembalikan password sementara dalam plaintext di body response JSON. Response ini tercatat di Vercel log (yang juga berada di infrastruktur asing), menciptakan risiko eksposur credential.

**Bukti teknis:**
```javascript
// src/app/api/admin/users/[id]/reset-password/route.js
return NextResponse.json({
  success: true,
  tempPassword: tempPassword,  // <-- plaintext dalam response dan Vercel logs
})
```

---

### F-07 — Tidak Ada Perjanjian Pemrosesan Data (DPA) dengan Vercel
**Tingkat Risiko:** TINGGI  
**Regulasi:** UU PDP 27/2022 Pasal 14 (transfer data lintas batas), POJK 11

**Deskripsi:**  
Transfer data pribadi nasabah ke Vercel (server AS) tanpa Data Processing Agreement (DPA) yang memenuhi ketentuan UU PDP. Ketentuan standar Vercel Terms of Service tidak mencukupi sebagai DPA yang sah di bawah UU PDP 27/2022.

Persyaratan minimum DPA berdasarkan UU PDP: tujuan pemrosesan, jenis data, kewajiban keamanan, hak subjek data, mekanisme audit, ketentuan penghentian layanan.

---

### F-08 — Tidak Ada Penetration Testing
**Tingkat Risiko:** SEDANG  
**Regulasi:** SEOJK 29/SEOJK.03/2022 Pasal 12

**Deskripsi:**  
Sistem belum pernah menjalani penetration testing. SEOJK 29 mewajibkan bank melakukan pentest berkala terhadap sistem elektronik yang memproses data nasabah.

---

### F-09 — Tidak Ada Incident Response Plan
**Tingkat Risiko:** SEDANG  
**Regulasi:** UU PDP 27/2022 Pasal 46 (notifikasi pelanggaran 3×24 jam)

**Deskripsi:**  
Tidak ada prosedur terdokumentasi untuk menangani insiden kebocoran data. UU PDP mewajibkan notifikasi kepada OJK dan subjek data dalam 3×24 jam setelah pelanggaran diketahui. Tanpa incident response plan, kewajiban ini tidak dapat dipenuhi.

---

### F-10 — Tidak Ada Exit Strategy dari PPJTI
**Tingkat Risiko:** SEDANG  
**Regulasi:** PADK OJK 1/2026

**Deskripsi:**  
PADK OJK 1/2026 mensyaratkan bank memiliki exit strategy yang terdokumentasi untuk setiap PPJTI, mencakup prosedur migrasi data, timeline, dan fallback system. Saat ini tidak ada dokumen exit strategy formal meskipun Dockerfile untuk self-hosted deployment sudah tersedia.

---

## 4. Penilaian Risiko per Fitur

| Fitur | Data yang Diproses | Tingkat Risiko | Status |
|---|---|---|---|
| Credit Monitoring | Nama, noRekening, bakiDebet, KOL per kanwil/cabang | TINGGI | Aktif di Vercel |
| Business Monitoring (Vercel) | Nama, noDebitur, noRekening, bakiDebet, KOL — unmasked di Blob publik | KRITIS | Perlu dinonaktifkan |
| Business Monitoring (HTML Tool) | Sama, namun diproses lokal di browser, tidak keluar dari mesin | RENDAH | Mitigasi tersedia |
| Memo | namaDebitur, plafond, jenisKredit dalam metadata JSON | SEDANG | Aktif di Vercel |
| Auth / TOTP | totpSecret terenkripsi, audit log | SEDANG | Aktif di Vercel |
| Admin — Reset Password | Credential plaintext dalam response | TINGGI | Belum diperbaiki |

---

## 5. Rencana Remediasi

### Jangka Pendek (segera — sebelum server tiba)

| Prioritas | Tindakan | File / Lokasi | Estimasi |
|---|---|---|---|
| 1 | Ubah `access: 'public'` → `access: 'private'` di Vercel Blob adapter | `src/lib/storage/vercel-blob-adapter.js` | 1 jam |
| 2 | Nonaktifkan / hapus route Business Monitoring dari Vercel deployment | `src/app/monitoring/business/` + upload API | 1 hari |
| 3 | Distribusikan `business-monitoring.html` sebagai pengganti lokal | File sudah tersedia di root project | Selesai |
| 4 | Perbaiki reset password — jangan kembalikan plaintext di response | `src/app/api/admin/users/[id]/reset-password/route.js` | 2 jam |
| 5 | Tambahkan TTL / cleanup untuk file history di Vercel Blob | `src/lib/business-upload-handler.js` | 1 hari |
| 6 | Susun risk memo / LRPTI untuk manajemen dan Divisi Kepatuhan | Dokumen governance | 1 minggu |
| 7 | Dokumentasikan exit strategy ke self-hosted deployment | Dokumen governance | 2 hari |

### Jangka Panjang (setelah server / mini PC tersedia)

| Prioritas | Tindakan | Keterangan |
|---|---|---|
| 1 | Migrasi ke self-hosted menggunakan Docker | `Dockerfile` dan `docker-compose.yml` sudah tersedia |
| 2 | Switch storage ke local filesystem | `STORAGE_PROVIDER=local`, `local-fs-adapter.js` sudah tersedia |
| 3 | Migrasi database ke SQLite lokal atau PostgreSQL internal | `DATABASE_URL=file:./dev.db` untuk mode lokal |
| 4 | Lakukan penetration testing | Koordinasi dengan Divisi IT / vendor pentest eksternal |
| 5 | Susun dan uji incident response plan | Termasuk simulasi notifikasi 3×24 jam ke OJK |
| 6 | Lakukan due diligence PPJTI sesuai PADK OJK 1/2026 | Untuk cloud provider yang mungkin tetap digunakan di masa depan |

---

## 6. Catatan Mitigasi yang Sudah Dilakukan

| Kontrol | Implementasi | Catatan |
|---|---|---|
| TOTP 2FA | NextAuth + TOTP per user, dengan audit log (`SecurityAuditLog`) | Baik, namun berada di infrastruktur asing |
| Data masking di API | `maskBusinessData` di API route — nama → inisial, nomor → `****1234` | Tidak melindungi data di storage |
| Role-based access | Scope nasional / kanwil / cabang di middleware | Sudah terimplementasi |
| Unlock flow | Signed cookie HMAC-SHA256, 15 menit, per dataType | Sudah terimplementasi |
| Enkripsi totpSecret | AES-256-GCM | Key management perlu diperbaiki (lihat F-05) |
| Business Monitoring lokal | `business-monitoring.html` — semua proses di browser, tidak ada data keluar | Mitigasi F-02/F-03 untuk fitur ini |

---

## 7. Referensi

- POJK No. 11/POJK.03/2022 tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum
- PADK OJK No. 1/2026 tentang Pedoman Teknis Penyelenggaraan TI Bank Umum (berlaku 1 Maret 2026)
- SEOJK No. 29/SEOJK.03/2022 tentang Ketahanan dan Keamanan Siber bagi Bank Umum
- UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi
- Vercel Terms of Service & Data Processing Addendum (https://vercel.com/legal/dpa)
- OWASP Top 10 2021 — A02 Cryptographic Failures, A05 Security Misconfiguration

// Seed contoh Memo & Izin Prinsip — diadaptasi dari dokumen referensi BBD/SMBD.
// Jalankan: npm run db:seed:memos
// Aman dijalankan berulang: memo dengan nomorMemo yang sama akan dilewati.

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Load env files (.env then .env.local, later wins)
for (const envFile of ['.env', '.env.local']) {
  try {
    const lines = readFileSync(resolve(process.cwd(), envFile), 'utf-8').split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch { /* file not found */ }
}

// ---- helpers ----
const hoursAgo = (h) => new Date(Date.now() - h * 3600000)
const iso = (h) => hoursAgo(h).toISOString()

// stepHistory builder: [[stepIndex, hoursAgo, note?, by?], ...]
const history = (entries) =>
  JSON.stringify(entries.map(([step, h, note = '', by = 'admin']) => ({
    step, date: iso(h), note, by,
  })))

const roles = (pic, kadept, sekretaris, kadiv) =>
  JSON.stringify({ pic, kadept, sekretaris, kadiv })

// ============================================================
// MEMO UMUM — diadaptasi dari ref/Memo/*.docx
// ============================================================
const generalMemos = [
  {
    nomorMemo: '2811/M/SMBD/CPD/XII/2025',
    category: 'general',
    perihal: 'Permohonan untuk Pengiriman Whatsapp Blast untuk Debitur Eksisting',
    dari: 'SME Banking Division',
    kepada: JSON.stringify([
      { division: 'Customer Experience Division', department: 'CXD' },
      { division: 'Marketing Communication Division', department: 'MCD' },
    ]),
    tanggalMemo: new Date('2025-12-08'),
    lampiranList: JSON.stringify(['Key Visual / Konten Broadcast', 'Redaksional / Caption yang telah disetujui MCD']),
    tembusan: JSON.stringify([]),
    metadata: JSON.stringify({
      pengirimDivision: 'SME Banking Division',
      pengirimSingkatan: 'SMBD',
      rujukanJenis: 'menunjuk',
      rujukanList: [
        { nomorMemo: '447/M/CXD/CC/VII/2024', tanggal: '2024-07-31', perihal: 'Penyampaian Refreshment Alur Permohonan WhatsApp dan Email Broadcast Tahun 2024' },
        { nomorMemo: '50/M/MCD/DM/VII/2024', tanggal: '2024-07-31', perihal: 'Penyampaian Refreshment Alur Permohonan WhatsApp dan Email Broadcast Tahun 2024' },
      ],
      kalimatPengantar: 'dimohon',
      picNama: 'Haryo Tetuko',
      picTeams: 'Haryo22286.Tetuko',
      picWA: '087786774186',
      kontenIsi: `<p>Kami mohon kepada Customer Experience Division (CXD) dan Marketing Communication Division (MCD) untuk melakukan WhatsApp/Email Broadcast dengan detil sebagai berikut:</p><table><tbody><tr><th>No.</th><th>Rincian</th><th>Keterangan</th></tr><tr><td>1.</td><td>Nama Program/Headline Broadcast</td><td>Penawaran Produk KPP Demand</td></tr><tr><td>2.</td><td>Periode Program</td><td>Desember 2025</td></tr><tr><td>3.</td><td>Jumlah Blast</td><td>&plusmn; 50.000 data</td></tr><tr><td>4.</td><td>Kontak PIC Program (Ext/No HP)</td><td>087786774186</td></tr><tr><td>5.</td><td>Mata Anggaran (COA)</td><td>CC 14100</td></tr></tbody></table>`,
      kontenTindakLanjut: '<p>Terkait dengan permohonan tersebut, terlampir key visual/konten beserta redaksional/caption yang telah disetujui oleh MCD.</p>',
    }),
    status: 'distributed',
    createdBy: 'admin',
    approvedBy: 'admin',
    approvedAt: hoursAgo(24 * 12),
    distributedBy: 'admin',
    distributedAt: hoursAgo(24 * 10),
    // tracking selesai
    trackingStartedAt: hoursAgo(24 * 14),
    trackingCompletedAt: hoursAgo(24 * 10),
    trackingStep: 6,
    slaHours: 8,
    trackingRoles: roles('Haryo Tetuko', 'Rudi Hartono', 'Dewi Lestari', 'Bambang Susanto'),
    stepHistory: history([
      [0, 24 * 14, 'Memo dibuat & dimulai'],
      [1, 24 * 13.8, 'Diserahkan ke Kadept'],
      [2, 24 * 13.5, ''],
      [3, 24 * 13, 'Disetujui Kadiv'],
      [4, 24 * 12, 'Dikembalikan ke PIC'],
      [5, 24 * 10.5, ''],
      [6, 24 * 10, 'Selesai diarsipkan'],
    ]),
  },
  {
    nomorMemo: '0214/M/BBD/CPD/II/2026',
    category: 'general',
    perihal: 'Permohonan Sharing Anggaran Kegiatan Acara Kumpul Keluarga TikTok Shop & Tokopedia',
    dari: 'Business Banking Division',
    kepada: JSON.stringify([
      { division: 'Digital Banking Sales Division', department: 'DBSD' },
    ]),
    tanggalMemo: new Date('2026-02-09'),
    lampiranList: JSON.stringify(['Rincian Anggaran Kegiatan']),
    tembusan: JSON.stringify(['Retail Funding Division (RFD)']),
    metadata: JSON.stringify({
      pengirimDivision: 'Business Banking Division',
      pengirimSingkatan: 'BBD',
      rujukanJenis: 'menunjuk',
      rujukanList: [
        { nomorMemo: '2639/M/SMBD/CP/XII/2025', tanggal: '2025-12-02', perihal: 'Undangan Tindak Lanjut Rencana Partnership Keluarga Tokopedia dan TikTok Shop' },
      ],
      kalimatPengantar: 'disampaikan',
      picNama: 'Haryo Tetuko',
      picTeams: 'Haryo22286.Tetuko',
      picWA: '087786774186',
      kontenIsi: `<ol><li>Sebelumnya melalui Memo SMBD No. 2639/M/SMBD/CP/XII/2025, telah dilaksanakan pertemuan internal dan eksternal yang dihadiri perwakilan divisi diantaranya RFD, DBSD dan perwakilan dari Keluarga Tokopedia dan TikTok Shop pada hari Rabu tanggal 02 Desember 2025 secara daring.</li><li>Akan diadakan Acara Kumpul Keluarga TikTok Shop &amp; Tokopedia yang bertujuan untuk akuisisi Kredit KUR, KPP Demand, peningkatan CASA SME, dan transaksi digital, dengan rincian sebagai berikut:<table><tbody><tr><td>Tempat</td><td>Kota Jakarta, Semarang, dan Malang</td></tr><tr><td>Agenda</td><td>Kumpul Keluarga Tokopedia &amp; TikTok Shop Jakarta BTN x AnterAja</td></tr><tr><td>Peserta</td><td>&plusmn; 600 seller TikTok Shop &amp; Tokopedia</td></tr></tbody></table></li></ol>`,
      kontenTindakLanjut: '<p>Berkaitan dengan poin dua di atas, mohon kepada setiap Divisi dapat berkontribusi pada acara tersebut dan sharing anggaran sesuai rincian terlampir.</p>',
    }),
    status: 'approved',
    createdBy: 'admin',
    approvedBy: 'admin',
    approvedAt: hoursAgo(24 * 3),
    // tracking berjalan: posisi PIC (terima hasil)
    trackingStartedAt: hoursAgo(24 * 5),
    trackingStep: 4,
    slaHours: 8,
    trackingRoles: roles('Haryo Tetuko', 'Rudi Hartono', 'Dewi Lestari', 'Bambang Susanto'),
    stepHistory: history([
      [0, 24 * 5, 'Memo dibuat & dimulai'],
      [1, 24 * 4.7, ''],
      [2, 24 * 4.2, 'Diteruskan ke Kadiv'],
      [3, 24 * 3.5, 'Disetujui Kadiv'],
      [4, 3, 'Dikembalikan ke PIC'],
    ]),
  },
  {
    nomorMemo: '1203/M/BBD/CPD/III/2026',
    category: 'general',
    perihal: 'Undangan Rapat – Tindak Lanjut Audit Pembahasan Penutupan Akses ke Modul iLoan Komersial sesuai dengan Akses Level User Petugas SME',
    dari: 'Business Banking Division',
    kepada: JSON.stringify([
      { division: 'Central Operation Division', department: 'CEOD' },
      { division: 'IT Planning Division', department: 'ITPD' },
      { division: 'IT Development Division', department: 'ITDD' },
    ]),
    tanggalMemo: new Date('2026-03-27'),
    lampiranList: JSON.stringify([]),
    tembusan: JSON.stringify([]),
    metadata: JSON.stringify({
      pengirimDivision: 'Business Banking Division',
      pengirimSingkatan: 'BBD',
      rujukanJenis: 'menunjuk',
      rujukanList: [
        { nomorMemo: 'T.AC.IL.01', tanggal: '', perihal: 'Temuan Audit Internal Application Control – iLoan Komersial & Small Medium Enterprise (SME)' },
      ],
      kalimatPengantar: 'diundang',
      picNama: '',
      picTeams: '',
      picWA: '',
      kontenIsi: `<table><tbody><tr><td>Hari/Tanggal</td><td>Selasa, 31 Maret 2026</td></tr><tr><td>Waktu</td><td>15.00 WIB – Selesai</td></tr><tr><td>Agenda</td><td>TL Audit Pembahasan Penutupan Akses ke Modul iLoan Komersial sesuai Akses Level User Petugas SME</td></tr><tr><td>Saluran</td><td>Teams Meeting<br/>Meeting ID: 421 167 672 619 03<br/>Passcode: Mz6Lu92m</td></tr></tbody></table>`,
      kontenTindakLanjut: '',
    }),
    status: 'review',
    createdBy: 'admin',
    // tracking berjalan & overdue: tertahan di Kadept 26 jam
    trackingStartedAt: hoursAgo(30),
    trackingStep: 1,
    slaHours: 8,
    trackingRoles: roles('Anita Permata', 'Rudi Hartono', 'Dewi Lestari', 'Bambang Susanto'),
    stepHistory: history([
      [0, 30, 'Memo dibuat, perlu segera (rapat 31 Maret)'],
      [1, 26, 'Di meja Kadept — menunggu review'],
    ]),
  },
  {
    nomorMemo: '',
    category: 'general',
    perihal: 'Penyampaian Usulan Penyesuaian Working Attire untuk Pegawai SCPU Kantor Cabang',
    dari: 'Business Banking Division',
    kepada: JSON.stringify([
      { division: 'Human Capital Strategy Division', department: 'HCSD' },
    ]),
    tanggalMemo: new Date('2026-03-30'),
    lampiranList: JSON.stringify(['Desain Seragam SME (Opsi 1 & Opsi 2)']),
    tembusan: JSON.stringify([]),
    metadata: JSON.stringify({
      pengirimDivision: 'Business Banking Division',
      pengirimSingkatan: 'BBD',
      rujukanJenis: 'menunjuk',
      rujukanList: [
        { nomorMemo: '', tanggal: '2026-03-25', perihal: 'Hasil Weekly Meeting Direktorat Commercial Banking' },
      ],
      kalimatPengantar: 'disampaikan',
      picNama: 'Haryo Tetuko',
      picTeams: 'Haryo22286.Tetuko',
      picWA: '087786774186',
      kontenIsi: `<ol><li><strong>Latar Belakang</strong><br/>Berdasarkan hasil Weekly Meeting Direktorat Commercial Banking, terdapat arahan dari Direktur Commercial Banking untuk BBD kembali melakukan pengadaan seragam Sales Kredit SME. Pengadaan ini bertujuan untuk memberikan identitas fisik perusahaan yang profesional, rapi, dan mudah dikenali oleh masyarakat luas.</li><li><strong>Pembahasan</strong><br/>Sebagai tindak lanjut rencana pengadaan seragam bagi petugas Sales Kredit SME, kami telah menyiapkan dua alternatif desain. Opsi pertama menonjolkan identitas BTN melalui dominasi warna biru dengan aksen merah, sedangkan opsi kedua menawarkan warna khaki sebagai alternatif. Model seragam dirancang dengan potongan lengan panjang, baik untuk pegawai pria maupun wanita.</li><li><strong>Usulan</strong><br/>Diberlakukan penyesuaian pakaian kerja khusus bagi pegawai unit SCPU di Kantor Cabang: Senin–Selasa sesuai ketentuan yang berlaku, Rabu SME Corporate Attire, Kamis–Jumat sesuai ketentuan yang berlaku.</li></ol>`,
      kontenTindakLanjut: '<p>Terkait pengadaan seragam tersebut, BBD akan bekerja sama dengan vendor pakaian terkait yang akan ditetapkan kemudian, untuk selanjutnya dimintakan persetujuan kepada Direktur Commercial Banking.</p>',
    }),
    status: 'draft',
    createdBy: 'admin',
    // belum dilacak (untracked)
  },
]

// ============================================================
// IZIN PRINSIP — diadaptasi dari ref/IP/*.pdf
// ============================================================
const ipMemos = [
  {
    nomorMemo: '1142/M/BBD/NCP/III/2026',
    category: 'izin_prinsip',
    perihal: 'Ijin Prinsip Keringanan Provisi Kredit Swadana an. PT Inti Sinar Pelangi',
    dari: 'Non Credit Program Department (NCP)',
    kepada: JSON.stringify([
      { division: 'Kepala Divisi Business Banking Division', department: 'BBD' },
    ]),
    tanggalMemo: new Date('2026-03-30'),
    lampiranList: JSON.stringify([]),
    tembusan: JSON.stringify([]),
    konten: `<p>Menunjuk dan menindaklanjuti:</p><ol style="list-style-type:lower-roman"><li>Memo SMBD No. 0016/M/SMBD/CPD/I/2021 tanggal 20 Januari 2021 perihal Kredit Swadana Lembaga untuk Segmentasi SME;</li><li>Komersial dan Petunjuk Teknis PT 1-B1 perihal Segmentasi Debitur Komersial;</li><li>Memo SMBD No. 2408/M/SMBD/NCP/XI/2022 tanggal 15 November 2022 perihal Penyampaian Perubahan Ketentuan Kebijakan Spread Rate dan LTV Khusus Kredit Swadana Kewenangan Divisi;</li><li>Memo KC Jakarta Melawai No. 450/M/JKM/SCPU/III/2026 tanggal 30 Maret 2026 perihal Permohonan fasilitas kredit keringanan simpanan (Kredit Swadana);</li></ol><p>dengan ini kami sampaikan hal-hal sbb:</p><ol><li>KC Jakarta Melawai melalui memo tersebut di atas menyampaikan bahwa saat ini sedang melakukan proses kredit Swadana dan bermohon kebijakan untuk keringanan provisi &amp; spread rate dengan keterangan sebagaimana tabel di atas.</li><li>Sehubungan dengan hal tersebut, atas permohonan Kredit Swadana an. <strong>PT Inti Sinar Pelangi</strong>, dengan pertimbangan merupakan nasabah existing BTN KC Melawai dengan AUM sebesar Rp 27.150.240.555,78, KC bermohon dapat diberikan keringanan.</li><li>KC bermohon dapat diberikan keringanan sebagai berikut:<ol style="list-style-type:lower-alpha"><li>Keringanan Spread Rate;</li><li>Keringanan Provisi;</li><li>Agunan Simpanan milik pengurus Tabungan Investa an. Ario Sunartedjo Prabowo (direktur) sebesar Rp 4.000.000.000,-.</li></ol></li></ol>`,
    metadata: JSON.stringify({
      tipeIP: 'permohonan',
      jenisIzinPrinsip: 'keringanan_provisi',
      namaDebitur: 'PT Inti Sinar Pelangi',
      jenisKredit: 'Kredit Swadana Lembaga',
      plafond: '3000',
      jangkaWaktu: '6',
      provisi: '0,125% dari plafond kredit',
      spreadRate: '1% diatas suku bunga agunan',
      ltv: '75%',
      jenisAgunan: 'Tabungan Investa an Ario Sunartedjo Prabowo (direktur)',
      nilaiAgunan: '4000',
      nomorMemoKC: '450/M/JKM/SCPU/III/2026',
      nomorMemoResponse: '',
      keputusan: 'disetujui',
    }),
    status: 'approved',
    createdBy: 'admin',
    approvedBy: 'admin',
    approvedAt: hoursAgo(20),
    // tracking berjalan: di Kadiv
    trackingStartedAt: hoursAgo(50),
    trackingStep: 3,
    slaHours: 8,
    trackingRoles: roles('Anita Permata', 'Rudi Hartono', 'Dewi Lestari', 'Bambang Susanto'),
    stepHistory: history([
      [0, 50, 'IP dibuat & dimulai'],
      [1, 46, ''],
      [2, 28, 'Diteruskan ke Kadiv'],
      [3, 5, 'Menunggu persetujuan Kadiv'],
    ]),
  },
  {
    nomorMemo: '0667/M/BBD/NCP/II/2026',
    category: 'izin_prinsip',
    perihal: 'Tanggapan Terhadap Permohonan Ijin Prinsip Terkait Riwayat Kredit Pengurus a.n PT Tekad Jaya Land',
    dari: 'Business Banking Division',
    kepada: JSON.stringify([
      { division: 'KC Jember', department: '' },
    ]),
    tanggalMemo: new Date('2026-02-26'),
    lampiranList: JSON.stringify([]),
    tembusan: JSON.stringify([]),
    konten: `<p>Menunjuk dan menindaklanjuti:</p><ol style="list-style-type:lower-roman"><li>Kebijakan Khusus No. KK.1-XV tentang Produk Kredit Usaha Small Medium Enterprise (SME) tanggal 29 Oktober 2024;</li><li>Kebijakan Khusus No. KK.1-XXI tanggal 15 Oktober 2025 tentang Produk Kredit Program Perumahan;</li><li>Petunjuk Teknis No. PT.1. XXI.1 tanggal 15 Oktober 2025 tentang Alur Proses Kredit Program Perumahan;</li><li>Memo KC Jember No. 321/M/JMB.III/SCPU/II/2026 tanggal 24 Februari 2026 perihal Ijin Prinsip Proses KPP Terkait SLIK OJK Pengurus Terdapat Riwayat Kolektibilitas 2 KC Jember;</li></ol><p>dengan ini kami sampaikan hal-hal sebagai berikut:</p><ol><li>KC Jember menyampaikan permohonan ijin prinsip terkait persyaratan kondisi kolektibilitas pengurus, dengan kondisi: pemohonan kredit PT TJL telah melewati proses analisa dan ditemukan pada SLIK OJK an. Vivin Fatmawati selaku Komisaris PT TJL tercatat kol 2 di beberapa fasilitas kredit (pinjaman fintech atau P2P dan mayoritas terjadi sejak awal kredit berjalan sebagai status awal sistem).</li><li>Berdasarkan hasil analisa dan pertimbangan tersebut di atas, permohonan ijin prinsip <strong>dapat diproses lebih lanjut</strong> dengan tetap memperhatikan ketentuan yang berlaku.</li></ol>`,
    metadata: JSON.stringify({
      tipeIP: 'tanggapan',
      jenisIzinPrinsip: 'riwayat_kredit_pengurus',
      namaDebitur: 'PT Tekad Jaya Land (PT TJL)',
      jenisKredit: 'KPP Supply – Developer',
      plafond: '5000',
      jangkaWaktu: '36',
      peruntukan: 'Pembiayaan Pembangunan Perumahan Griya Rowotamtu Indah beserta sarana dan prasarananya sebanyak 58 unit',
      nomorMemoKC: '321/M/JMB.III/SCPU/II/2026',
      nomorMemoResponse: '0667/M/BBD/NCP/II/2026',
      keputusan: 'disetujui',
    }),
    status: 'distributed',
    createdBy: 'admin',
    approvedBy: 'admin',
    approvedAt: hoursAgo(24 * 8),
    distributedBy: 'admin',
    distributedAt: hoursAgo(24 * 7),
    distributedTo: JSON.stringify(['Jabanus']),
    // tracking selesai
    trackingStartedAt: hoursAgo(24 * 9),
    trackingCompletedAt: hoursAgo(24 * 7),
    trackingStep: 6,
    slaHours: 8,
    trackingRoles: roles('Anita Permata', 'Rudi Hartono', 'Dewi Lestari', 'Bambang Susanto'),
    stepHistory: history([
      [0, 24 * 9, 'IP dibuat'],
      [1, 24 * 8.8, ''],
      [2, 24 * 8.5, ''],
      [3, 24 * 8, 'Disetujui Kadiv'],
      [4, 24 * 7.5, 'Dikembalikan ke PIC'],
      [5, 24 * 7.2, ''],
      [6, 24 * 7, 'Selesai diarsipkan'],
    ]),
  },
  {
    nomorMemo: '0690/M/BBD/NCP/II/2026',
    category: 'izin_prinsip',
    perihal: 'Tanggapan Terhadap Permohonan Ijin Prinsip terkait Pengikatan Agunan a.n PT Halida Meiga Land',
    dari: 'Business Banking Division',
    kepada: JSON.stringify([
      { division: 'KC Pekalongan', department: '' },
    ]),
    tanggalMemo: new Date('2026-02-27'),
    lampiranList: JSON.stringify([]),
    tembusan: JSON.stringify([]),
    konten: `<p>Menunjuk memo Kantor Cabang perihal permohonan ijin prinsip terkait pengikatan agunan atas permohonan kredit a.n PT Halida Meiga Land, dengan ini kami sampaikan hal-hal sebagai berikut:</p><ol><li>Kantor Cabang menyampaikan permohonan ijin prinsip terkait mekanisme pengikatan agunan atas fasilitas KPP Supply yang sedang dalam proses analisa.</li><li>Berdasarkan kajian terhadap kondisi agunan dan ketentuan yang berlaku, permohonan ijin prinsip terkait pengikatan agunan <strong>dapat diproses lebih lanjut</strong> dengan syarat pengikatan dilakukan sesuai ketentuan perundang-undangan dan dilengkapi sebelum akad kredit.</li></ol>`,
    metadata: JSON.stringify({
      tipeIP: 'tanggapan',
      jenisIzinPrinsip: 'pengikatan_agunan',
      namaDebitur: 'PT Halida Meiga Land',
      jenisKredit: 'KPP Supply – Developer',
      plafond: '4500',
      jangkaWaktu: '24',
      nomorMemoKC: '198/M/PKL/SCPU/II/2026',
      nomorMemoResponse: '0690/M/BBD/NCP/II/2026',
      keputusan: 'catatan',
    }),
    status: 'review',
    createdBy: 'admin',
    // tracking berjalan & overdue: tertahan di Sekretaris 14 jam
    trackingStartedAt: hoursAgo(40),
    trackingStep: 2,
    slaHours: 8,
    trackingRoles: roles('Anita Permata', 'Rudi Hartono', 'Dewi Lestari', 'Bambang Susanto'),
    stepHistory: history([
      [0, 40, 'IP dibuat'],
      [1, 36, ''],
      [2, 14, 'Menunggu penomoran & penerusan ke Kadiv'],
    ]),
  },
  {
    nomorMemo: '1184/M/BBD/NCP/III/2026',
    category: 'izin_prinsip',
    perihal: 'Tanggapan Terhadap Permohonan Izin Prinsip Kredit Swadana Lembaga an. PT Bintang Putra Mandiri',
    dari: 'Non Credit Program Department (NCP)',
    kepada: JSON.stringify([
      { division: 'Kepala Divisi Business Banking Division', department: 'BBD' },
    ]),
    tanggalMemo: new Date('2026-03-31'),
    lampiranList: JSON.stringify([]),
    tembusan: JSON.stringify([]),
    konten: `<p>Menunjuk memo Kantor Cabang perihal permohonan izin prinsip Kredit Swadana Lembaga an. PT Bintang Putra Mandiri, dengan ini kami sampaikan hal-hal sebagai berikut:</p><ol><li>Kantor Cabang menyampaikan permohonan fasilitas Kredit Swadana Lembaga dengan rincian sebagaimana tabel di atas.</li><li>Permohonan masih dalam proses kajian terkait kelengkapan dokumen agunan simpanan dan kesesuaian dengan ketentuan Spread Rate dan LTV Kredit Swadana kewenangan Divisi.</li></ol>`,
    metadata: JSON.stringify({
      tipeIP: 'permohonan',
      jenisIzinPrinsip: 'lainnya',
      namaDebitur: 'PT Bintang Putra Mandiri',
      jenisKredit: 'Kredit Swadana Lembaga',
      plafond: '2500',
      jangkaWaktu: '12',
      provisi: '0,25% dari plafond kredit',
      spreadRate: '1% diatas suku bunga agunan',
      ltv: '80%',
      jenisAgunan: 'Deposito an. PT Bintang Putra Mandiri',
      nilaiAgunan: '3200',
      nomorMemoKC: '512/M/JKT/SCPU/III/2026',
      nomorMemoResponse: '',
      keputusan: '',
    }),
    status: 'draft',
    createdBy: 'admin',
    // tracking baru dimulai: masih di PIC
    trackingStartedAt: hoursAgo(2),
    trackingStep: 0,
    slaHours: 8,
    trackingRoles: roles('Anita Permata', 'Rudi Hartono', 'Dewi Lestari', 'Bambang Susanto'),
    stepHistory: history([
      [0, 2, 'IP dibuat & dimulai'],
    ]),
  },
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const authToken = process.env.TURSO_AUTH_TOKEN
  const adapter = new PrismaLibSql({ url, authToken })
  const prisma = new PrismaClient({ adapter })

  try {
    let created = 0, skipped = 0
    for (const memo of [...generalMemos, ...ipMemos]) {
      // Lewati jika nomorMemo sudah ada (atau perihal sama untuk draft tanpa nomor)
      const exists = memo.nomorMemo
        ? await prisma.memo.findFirst({ where: { nomorMemo: memo.nomorMemo } })
        : await prisma.memo.findFirst({ where: { perihal: memo.perihal } })
      if (exists) { skipped++; continue }
      await prisma.memo.create({ data: memo })
      created++
      console.log(`+ ${memo.nomorMemo || '(draft)'} — ${memo.perihal.slice(0, 60)}...`)
    }
    console.log(`\nSelesai: ${created} memo dibuat, ${skipped} dilewati (sudah ada).`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

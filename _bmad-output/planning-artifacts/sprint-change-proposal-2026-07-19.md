# Sprint Change Proposal (Correct Course)

## Section 1: Issue Summary
- **Triggering Issue**: Pelanggaran alur BMad pada komit `b679ff7...` di mana pengembangan fitur *Worship Web Input Boundary*, *Split Family/Youth Photos*, dan sinkronisasi *Announcements List* diimplementasikan langsung (3.000+ baris kode) setelah pembaruan PRD dan Spec, tanpa membuat *Epic* dan *Story* terlebih dahulu.
- **Dampak Langsung**: Kesenjangan (*drift*) antara implementasi kode yang sudah selesai dan dokumen perencanaan BMad (*Epics* dan *Sprint Status*).
- **Bukti**: Perbandingan komit `e2ed0ce` dengan `b679ff7` menunjukkan file spesifikasi dibuat (`spec-worship-web-input/SPEC.md`), tetapi tidak ada *Epic* atau *Story* baru di `epics.md` atau `sprint-status.yaml`.

## Section 2: Impact Analysis
- **Epic Impact**: Fitur besar ini belum bernaung di bawah *Epic* mana pun. Dokumentasi terputus dari pelacakan status proyek.
- **Artifact Conflicts**: `epics.md` dan `sprint-status.yaml` tertinggal, sementara kode untuk form UI (`CreateForm.tsx`, `EditForm.tsx`) dan API (`api/services/route.ts`) sudah final.

## Section 3: Recommended Approach
**Rekomendasi**: **Direct Adjustment (Dokumentasi Retroaktif)**

Karena kode sudah sukses diimplementasikan dan telah direview di komit `b679ff7`, pendekatan *rollback* tidak rasional. Kita akan merekonsiliasi dokumentasi dengan status aktual kode.

**Rencana Aksi (*Action Plan*):**
1. **Epic Update**: Menambahkan **Epic 14: Worship Web Input Boundary** ke file `epics.md`.
2. **Story Creation**: Membuat *Story* **14.1: Worship Web Input Forms & API** di `stories/14-1-worship-web-input-boundary.md` yang memetakan kriteria penerimaan (AC) dari apa yang sudah dibangun.
3. **Status Update**: Menambahkan `epic-14` dan `14-1-worship-web-input-boundary` ke `sprint-status.yaml` dengan status `done`.

## Section 4: Handoff & Next Steps
- Setelah dokumen-dokumen ini diperbarui oleh Developer (saya), status proyek akan sinkron.
- Anda dapat segera menjalankan `bmad-spec` untuk memvalidasi *Spec* terhadap implementasi jika diperlukan.

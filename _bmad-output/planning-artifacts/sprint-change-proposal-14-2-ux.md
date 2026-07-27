# Sprint Change Proposal (Correct Course) - UX Refinements

## Section 1: Issue Summary
- **Triggering Issue**: Pembaruan kebutuhan UI/UX pada form input web (Epic 14). Pengguna menginginkan satu text area ("Raw Rundown Text") yang terpadu dengan tombol *Parse* eksplisit untuk mengekstrak data otomatis (termasuk *roles* atau peserta), serta kolom *hymn* yang dilengkapi dengan fitur *autocomplete*.
- **Konteks**: Modifikasi ini secara langsung mengubah model hibrida sebelumnya (di mana *participantsRaw* tidak diparsing) menjadi model terpadu di mana eksekusi *parsing* bersifat komprehensif, sesuai dengan kebutuhan operator untuk kemudahan penggunaan.
- **Bukti**: Perubahan draf lokal (*uncommitted code*) pada file `SPEC.md`, `form-fields.md`, penambahan *story* baru `14-2-worship-web-input-ux-refinements.md`, serta pembaruan pada `epics.md` dan `sprint-status.yaml`.

## Section 2: Impact Analysis
- **Epic Impact**: Berdampak pada **Epic 14: Worship Web Input Boundary**. Epic ini yang sebelumnya berstatus `done` kini bergeser menjadi `in-progress` karena adanya *story* baru.
- **Story Impact**: Mengharuskan penambahan **Story 14.2: Worship Web Input UX Refinements**.
- **Artifact Conflicts**: Perlu memperbarui `SPEC.md` dan `form-fields.md` untuk menghilangkan asumsi bahwa *participants* tidak diparsing oleh Web Hub, dan untuk mendefinisikan perilaku antarmuka (UI) baru (tombol *Parse*, pengelompokan UI, *autocomplete* lagu).
- **Technical Impact**: Pembaruan di sisi front-end (`CreateForm.tsx`, `EditForm.tsx`) untuk *state management* baru, pembuatan komponen *autocomplete*, serta ekstensi fungsi pada `parsed-fields.ts` untuk mengakomodasi ekstraksi *roles*.

## Section 3: Recommended Approach
**Pendekatan yang Direkomendasikan: Direct Adjustment**
- **Rasionalisasi**: Perubahan ini sudah terdefinisi secara jelas pada draf *uncommitted code* Anda. Karena ini merupakan peningkatan fungsionalitas (enhancement) dalam area yang sama (Web Input), kita cukup memperbarui artefak *planning* dan *spec* secara langsung tanpa *rollback*.
- **Estimasi Usaha**: Sedang (*Medium*).
- **Tingkat Risiko**: Sedang (*Medium*) - karena kita perlu memastikan bahwa perubahan fungsi *parsing* (ekstraksi peran) tidak merusak keluaran `ParsedRundown` standar.

## Section 4: Detailed Change Proposals
(Berdasarkan modifikasi yang sudah Anda draf):
1. **Stories**: Penambahan file `14-2-worship-web-input-ux-refinements.md`.
2. **PRD/Epics**: Menambahkan Story 14.2 ke dalam `epics.md` (Worship Web Input).
3. **Specs (`form-fields.md` & `SPEC.md`)**: 
   - *OLD*: Form beroperasi dengan model hibrida; *Roles/participants* tidak diparsing. *Song number* berupa *input text* biasa.
   - *NEW*: Form beroperasi dengan satu *input text* utama. Menekan tombol [Parse] akan mengekstrak Tanggal, Hymns, Sections, dan **Roles**. *Song number* menggunakan fitur *autocomplete*.
4. **Sprint Status**: Pembaruan `epic-14` menjadi `in-progress` dan menyertakan `14-2-worship-web-input-ux-refinements: backlog`.

## Section 5: Implementation Handoff
- **Kategori**: Minor / Menengah.
- **Penerima Handoff**: **Developer Agent** (Amelia / BMad Dev Story).
- **Tanggung Jawab**: Developer Agent akan mengambil tiket `14-2-worship-web-input-ux-refinements` yang sudah *ready-for-dev*, lalu mengimplementasikan perubahan UI dan *parsing logic* di dalam `CreateForm.tsx`, `EditForm.tsx`, dan `parsed-fields.ts` sesuai kontrak spesifikasi yang telah diperbarui.
- **Kriteria Keberhasilan**: File uncommitted Anda di-commit sebagai satu paket spesifikasi. Kemudian developer agent mengeksekusi Story 14.2 dan lolos *code review*.

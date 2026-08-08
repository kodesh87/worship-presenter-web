# Architecture Spine — Discussion

Catatan diskusi tentang [ARCHITECTURE-SPINE.md](./ARCHITECTURE-SPINE.md).

---

## 2026-08-08 — Noise historis di pembuka spine

### Konteks

Paragraf pembuka spine (sekitar baris 25) membahas:

- Epic 16 child spine yang di-*fold* (2026-07-30)
- Folder run yang dipindah ke `archived/` lalu dihapus (2026-08-01)
- Apa yang diekstrak ke `.memlog.md` vs apa yang sengaja tidak dibawa

### Pertanyaan

Untuk apa historis `archived/` dan child spine itu dibahas di spine utama?

### Kesimpulan

Itu **bukan** keputusan arsitektur teknis — itu **provenance** (asal-usul dokumen). Alasan aslinya ditulis:

| Alasan | Masih relevan? |
| --- | --- |
| Menegaskan *one spine per project* — ini satu-satunya spine hidup | Ya |
| Menjelaskan renumbering AD (epic-16 AD-n → AD-11..19) via AD map | Ya, selama sitasi lama masih ada |
| Mencegah orang mencari peer spine / folder yang sudah dihapus | Kurang — kebanyakan pembaca baru tidak akan menemukan folder itu |
| Mencatat apa yang diekstrak vs dibuang sebelum penghapusan | Tidak untuk implementasi — cukup di `.memlog.md` |
| Mencatat pengecualian aturan *never renumber AD-n* | Ya, tapi bisa satu kalimat |

### Insight

**Mempertahankan historis di spine utama menambah noise.** Pembaca yang ingin memahami arsitektur *sekarang* harus melewati narasi proses (fold-in, archived, deletion, apa yang tidak dibawa) sebelum sampai ke substansi.

Yang benar-benar operasional untuk coding:

- aturan *one spine per project*
- tabel **AD map** (selama dokumen lama masih disitasi)

Sisanya — archived → deleted, gate runs, konvensi sitasi lama, CASE-STUDY yang tidak dibawa — lebih cocok di sini (discussion) atau `.memlog.md`, bukan paragraf pembuka spine.

### Aksi terbuka (belum diputuskan)

- [ ] Ringkas paragraf pembuka spine jadi 1–2 kalimat + link ke AD map
- [ ] Pindahkan detail historis ke section terpisah di discussion / memlog, atau hapus dari spine sama sekali

---

## 2026-08-08 — Apa itu AST?

### Pertanyaan

Apa AST? (muncul di paragraf Design Paradigm, baris 32)

### Jawaban singkat

**AST = Abstract Syntax Tree** — pohon struktur data yang merepresentasikan sesuatu secara hierarkis, bukan sebagai teks mentah atau kode imperatif.

### Dalam konteks worship-presenter-web

Di spine, "JSON layout AST" berarti: **deskripsi layout slide sebagai pohon JSON**, bukan `switch (slideType)` di kode.

Alur:

1. **Registry** menyimpan template (posisi, font, placeholder) — diedit lewat canvas editor
2. **`buildSlidePlan`** meng-*hydrate* template + data ibadah minggu ini → **Fat Payload AST** (AD-12)
3. **Renderer** (web `SlideView` / `ArtifactSlide`, dan `pptx.ts`) hanya **menggambar** AST yang sudah jadi — tidak lookup registry lagi

Bentuk konkretnya ada di `src/lib/artifacts/runtime-contract.ts`:

- `ArtifactInstance` → punya `layout: ResolvedLayout`
- `ResolvedLayout` → `elements[]` (teks, gambar, shape) dengan koordinat, style, teks yang sudah ter-resolve

Contoh konseptual:

```json
{
  "layout": {
    "aspectRatio": "16:9",
    "backgroundColor": "#000",
    "elements": [
      { "type": "text", "x": 10, "y": 20, "text": "Minggu Paskah", "style": { "fontSize": 48 } }
    ]
  }
}
```

### Kenapa istilah AST dipakai?

Karena strukturnya seperti pohon parse — node induk (`layout`) punya anak (`elements`), tiap elemen punya properti. Renderer "menjalan" pohon itu, bukan mengeksekusi logika bisnis.

### Catatan

Di story/test lain, "AST assertion" punya arti berbeda — assertion yang memeriksa struktur kode sumber (bukan layout slide). Konteks menentukan maknanya.

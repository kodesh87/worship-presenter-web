# BMAD Automation

## BMAD memiliki 3 pemisahan kegiatan secara utama:
1. Help `/bmad-help`
2. Analysis/Solutioning/Planning, yang bekerja dengan dokumen
    1.  Analysis, meliputi namun tidak hanya: `/bmad-brainstorming`, `/bmad-forge-idea`, `/bmad-prd`
    2.  Solutioning, meliputi namun tidak hanya: `/bmad-spec`, `/bmad-spec update`, `/bmad-architecture`, `/bmad-architecture update`
    3.  Planning, meliputi namun tidak hanya: `/bmad-create-epics-and-stories`, `/bmad-create-story`, `/bmad-create-story validate`, `/bmad-correct-course`
3.  Development, yang bekerja dengan coding
    1.  Meliputi namun tidak hanya: `/bmad-dev-story`, `/bmad-code-review`

## Pain Point
1. Umumnya bmad skill disarankan dijalankan di context kosong
2. Banyak seremoni yang harusnya bisa diotomasi

## Customs Model / Effort
- bmad-help -> sonnet low
- bmad-brainstorming, bmad-forge-idea, bmad-prd -> opus high/xhigh (jika kompleks pindah ke xhigh)
- bmad-spec, bmad-architecture -> opus high/xhigh (jika kompleks pindah ke xhigh)
- bmad-create-epics-and-stories, bmad-create-story (+validate), bmad-correct-course -> sonnet high
- bmad-dev-story -> composer
- bmad-code-review -> sonnet xhigh

## Idea / Expected Outcome
- run bmad-help selalu berjalan di sub agent dengan sonnet low, sehingga gak perlu konteks baru, di print di sesi chat aktif. Keunggulan: hemat token, dan bisa dipanggil sewaktu2.
- run bmad-create-epics-and-stories, bmad-create-story (+validate), bmad-correct-course selalu berjalan di sub agent dengan sonnet high, sehingga gak perlu konteks baru, di print di sesi chat aktif, tapi diharapkan bisa ada interaktif, semisalnya agent meminta konfirmasi keputusan2. Keunggulan: biar gak sering clear chat, biar gak bingung, dan bisa dipanggil sewaktu2.
- jika bmad-create-story selesai tanpa kendala, otomatis menjalankan `bmad-create-story validate` secara otomatis
- jika `bmad-create-story validate` tidak ada kendala otomatis commit push dan create pr
- run `bmad-dev-story` selalu berjalan di sub agent dengan composer, coding wajib di composer, sehingga bisa hemat token, tapi diharapkan bisa ada interaktif siapa tahu butuh feedback misal konfirmasi keputusan2. Keunggulan: gak usah bekerja di beda cli, biar gak bingung.
- stelah `bmad-dev-story` selesai tanpa kendala, otomatis menjalankan `bmad-code-review` secara otomatis
- jika `bmad-code-review` selesai dan perlu koreksi otomatis menjalankan `bmad-dev-story`
- jika `bmad-code-review` selesai tanpa kendala otomatis commit push dan create pr
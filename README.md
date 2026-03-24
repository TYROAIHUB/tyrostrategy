# TYRO Strategy -- Stratejik Yonetim Platformu

> **v2.0.0** | Tiryaki Agro icin kurumsal hedef ve aksiyon yonetim platformu
>
> Canli Demo: [tyrostrategy.github.io](https://tyrostrategy.github.io)

---

## Proje Hakkinda

TYRO Strategy, Tiryaki Agro organizasyonunun stratejik hedeflerini ve aksiyonlarini tek bir platformda yonetmeyi saglayan kurumsal bir web uygulamasidir. **Hedef - Aksiyon** iki seviyeli hiyerarsi ile is kirilim yapisi olusturur, KPI takibi yapar ve ekip performansini olcer.

### Kimler Kullanir?

- **Ust Yonetim (Admin)** -- Tum hedefleri ve aksiyonlari goruntuler, olusturur, duzenler, siler
- **Proje Liderleri** -- Sorumlu olduklari hedeflerin aksiyonlarini yonetir
- **Kullanicilar** -- Kendilerine atanmis aksiyonlari takip eder ve gunceller

### Temel Ozellikler

- Hedef ve aksiyon CRUD islemleri (olusturma, okuma, guncelleme, silme)
- **Master-Detail gorunum** -- Sol panel hedef listesi + sag panel detay (Stratejik Karargah)
- **Hedef-Aksiyon Sihirbazi** -- Adim adim stratejik hedef ve aksiyon olusturma
- **Dual FAB** -- Hizli olusturma (+) ve islem (...) yüzen butonlari
- Tablo, Kanban, Gantt ve Strateji Haritasi (T-Map) gorunum modlari
- **Evrensel metin arama** -- Tum alanlarda (ad, aciklama, sahip, departman, etiket, tarih) Turkce locale-aware filtre
- **Parametrik etiket sistemi** -- Ayarlardan yonetilebilir, renkli etiketler (Jira/GitHub Labels benzeri)
- **Ilerleme-Durum otomatik hesaplama** -- %0=Baslanmadi, %100=Tamamlandi, %1-99 tarihe gore hesaplama
- **Tag Activity Gauge** -- KPI Dashboard'da Recharts RadialBarChart ile etiket dagilimi
- **macOS Dock tarzi** mobil bottom navigation (fisheye efekti)
- Rol bazli erisim kontrolu (RBAC) -- parametrik yetki yonetimi
- Kisisel calisma alani (workspace) ve organizasyon KPI dashboard'u
- Turkce ve Ingilizce dil destegi (~400+ ceviri anahtari)
- 16 farkli sidebar temasi + dark/light mod
- Responsive tasarim (mobil, tablet, masaustu)
- Command Palette ile hizli arama (Ctrl+K / Cmd+K)
- Azure AD / Microsoft Entra ID ile kimlik dogrulama (+ mock mod)
- Offline algilama ve hata yakalama (Error Boundary)
- **WCAG AA uyumlu** kontrast oranlari ve minimum font boyutlari
- **GitHub Pages** uzerinde otomatik deploy (GitHub Actions)

---

## Mimari & Teknoloji Yigini

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Framework** | React + TypeScript | 19.x / 5.x |
| **Build Tool** | Vite | 8.x |
| **UI Library** | HeroUI (NextUI fork) | 2.x |
| **State Management** | Zustand + localStorage persist | 5.x |
| **Server State** | TanStack React Query | 5.x |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Styling** | Tailwind CSS v4 + CSS Variables | 4.x |
| **Animation** | Framer Motion | 12.x |
| **Charts** | Recharts (BarChart, RadialBarChart, PieChart) | 3.x |
| **Gantt** | SVAR wx-react-gantt | 1.x |
| **Tree View** | react-arborist | 3.x |
| **Drag & Drop** | Atlassian Pragmatic DnD | 1.x |
| **Rich Text** | Tiptap | 3.x |
| **i18n** | i18next + react-i18next | 25.x / 16.x |
| **Routing** | React Router DOM (HashRouter) | 7.x |
| **Auth** | Azure MSAL (@azure/msal-browser) | 4.x |
| **Icons** | Lucide React | 0.5x |
| **Testing** | Vitest + Testing Library | 4.x |
| **Lint / Format** | ESLint 9 + Prettier 3 | 9.x / 3.x |
| **Deploy** | GitHub Pages + GitHub Actions | -- |

---

## Veri Modeli

### Hedef (Objective)

| Alan | Tip | Aciklama |
|------|-----|----------|
| `id` | `string` | Benzersiz tanimlayici |
| `name` | `string` | Hedef adi |
| `description` | `string?` | Aciklama |
| `source` | `Source` | Kaynak: Turkiye / Kurumsal / International |
| `status` | `EntityStatus` | On Track / Achieved / Behind / At Risk / Not Started / Cancelled / On Hold |
| `owner` | `string` | Hedef sahibi |
| `participants` | `string[]` | Katilimci listesi |
| `department` | `string` | Departman |
| `progress` | `number` | Ilerleme (0-100), aksiyonlardan otomatik hesaplanir |
| `startDate` | `string` | Baslangic tarihi (ISO) |
| `endDate` | `string` | Bitis tarihi (ISO) |
| `reviewDate` | `string` | Kontrol tarihi (zorunlu, varsayilan = startDate) |
| `tags` | `string[]` | Parametrik etiketler |
| `parentObjectiveId` | `string?` | Ust hedef baglantisi |
| `completedAt` | `string?` | Tamamlanma zamani (tum aksiyonlar tamamlaninca otomatik) |

### Aksiyon (Action)

| Alan | Tip | Aciklama |
|------|-----|----------|
| `id` | `string` | Benzersiz tanimlayici |
| `hedefId` | `string` | Bagli hedef ID (FK) |
| `name` | `string` | Aksiyon adi |
| `description` | `string?` | Aciklama |
| `owner` | `string` | Aksiyon sahibi |
| `status` | `EntityStatus` | Durum (ilerlemeye gore otomatik onerilir) |
| `progress` | `number` | Ilerleme (0-100), QuickProgress butonlari ile hizli guncelleme |
| `startDate` | `string` | Baslangic tarihi |
| `endDate` | `string` | Bitis tarihi |

### Iliski & Kurallar

```
Hedef (Stratejik Hedef)
  |
  +--1:N--> Aksiyon (Eylem)
               hedefId -> Hedef.id
```

- Hedef ilerlemesi = aksiyonlarin ortalama ilerlemesi (otomatik)
- Tum aksiyonlar %100 -> hedef otomatik "Tamamlandi"
- Alt aksiyonu olan hedef silinemez (cascade koruma)
- Ilerleme-durum otomasyonu: %0=Baslanmadi, %100=Tamamlandi, %1-99 tarihe gore Yolunda/Risk Altinda/Gecikmeli

---

## Sayfa Yapisi

| Route | Sayfa | Aciklama |
|-------|-------|----------|
| `/workspace` | Anasayfa | Kisisel dashboard, yaklasan tarihler, bireysel performans, etiket dagilimi |
| `/dashboard` | KPI | Organizasyon KPI kartlari, kaynak grafigi, **tag activity gauge**, durum kirilimi |
| `/stratejik-karargah` | Karargah | **Master-Detail** + Tablo + Kanban gorunum modlari, dual FAB |
| `/hedefler` | Hedefler | Hedef CRUD -- Tablo ve Kanban modlari |
| `/aksiyonlar` | Aksiyonlar | Aksiyon CRUD -- Tablo ve Kanban modlari |
| `/strategy-map` | T-Map | Stratejik harita (filtre ile eslesmeyenler gizlenir) |
| `/gantt` | Gantt | Zaman cizelgesi + metin arama |
| `/tree` | WBS | Is kirilim yapisi (react-arborist) |
| `/kullanicilar` | Kullanicilar | Kullanici ve departman yonetimi |
| `/ayarlar` | Ayarlar | Genel ayarlar + **Etiket Yonetimi** (sekmeli) |
| `/guvenlik` | Guvenlik | Rol bazli yetki yonetimi paneli |

---

## Yeni Ozellikler (v2.0.0)

### Master-Detail Gorunum (Stratejik Karargah)
- Sol panel: hedef kartlari listesi (arama, filtre, siralama, animated border)
- Sag panel: secili hedef detayi (hero, meta grid, expandable bilgi, aksiyonlar)
- QuickProgress butonlari ile hizli aksiyon ilerleme guncelleme
- Moving gradient border (secili kartta statü rengiyle animasyonlu cerceve)

### Hedef-Aksiyon Sihirbazi
- 4 adimli wizard: Hedef Bilgileri -> Hedef Detaylari -> Aksiyonlar -> Ozet & Onay
- Aksiyonlar adimi atlanabilir (hedef aksiyonsuz olusturulabilir)
- Sidebar temasina uyumlu header

### Parametrik Etiket Sistemi
- Ayarlar > Etiketler sekmesinden tag olusturma/duzenleme/silme
- 16 preset renk paleti + ColorPicker
- Hedef formlarda autocomplete oneri + aninda yeni tag olusturma
- Tum sayfalarda TagChip bileseni ile renkli gosterim

### Tag Activity Gauge (KPI Dashboard)
- Recharts RadialBarChart (Untitled UI activity gauge stili)
- Her tag icin farkli renkli ic ice halkalar
- Ortada toplam hedef sayisi, yanda legend

### Ilerleme-Durum Otomasyonu
- %0 -> Baslanmadi (otomatik, kilitli)
- %1-99 -> Tarihe gore Yolunda / Risk Altinda / Gecikmeli onerisi
- %100 -> Tamamlandi (otomatik, completedAt set edilir)
- Kullanici durumu override edebilir

### Evrensel Metin Arama
- Tum sayfalarda (Hedefler, Aksiyonlar, Karargah Tablo/Kanban/Master, T-Map, Gantt) tutarli full-text filtre
- Turkce locale-aware (`toLocaleLowerCase("tr")`)
- Tum alanlar: ad, aciklama, sahip, departman, kaynak, durum, etiketler, tarihler

### Iptal ve Askida Durumlari
- Hedef ve aksiyonlara "Iptal" (Cancelled) ve "Askida" (On Hold) durumlari
- StatusBadge tooltip aciklamalari

### macOS Dock Stili Mobil Navigasyon
- Fisheye efekti (yakin ikona dokunduğunda komsular buyur)
- Spring animasyonlu gecisler
- Glass blur arka plan

### Erisebilirlik & WCAG Uyumu
- `tyro-text-muted` rengi #6b7280'e koyulastirildi (WCAG AA 5.9:1)
- Minimum font boyutu 11px (10px -> 11px)
- Opacity katmanlamasi kaldirildi
- z-index token sistemi (base/dropdown/sticky/modal/toast/max)

---

## Tema Sistemi

16 sidebar temasi: light, arctic, navy, blue-gradient, black, emerald, violet, gold, jira, tiryaki, slate, rose, aurora, cyber, obsidian, liquid-glass

- CSS degisken bazli (`--tyro-*`) renk sistemi
- Tailwind siniflarinda `bg-tyro-*`, `text-tyro-*`, `border-tyro-*`
- Full app dark/light mod destegi

---

## Kurulum & Calistirma

### On Kosullar
- Node.js 18+
- npm 9+

### Komutlar

```bash
npm install --legacy-peer-deps   # Bagimliliklari yukle
npm run dev                      # Gelistirme sunucusu (port 5173)
npm run build                    # Production build
npm run preview                  # Build onizleme
npm run test                     # Testleri calistir
npm run lint                     # Lint kontrolu
npm run format                   # Kod formatlama
```

### Ortam Degiskenleri

| Degisken | Varsayilan | Aciklama |
|----------|-----------|----------|
| `VITE_AZURE_CLIENT_ID` | -- | Azure AD client ID |
| `VITE_AZURE_TENANT_ID` | -- | Azure AD tenant ID |
| `VITE_REDIRECT_URI` | `http://localhost:5173` | OAuth redirect URI |
| `VITE_MOCK_AUTH` | `true` | Demo mod (Azure AD atlanir) |

---

## Deploy

GitHub Pages uzerinde otomatik deploy:
- `.github/workflows/deploy.yml` ile `main` branch'e push'ta tetiklenir
- Vite build + GitHub Pages deploy (VITE_MOCK_AUTH=true)
- Canli: [tyrostrategy.github.io](https://tyrostrategy.github.io)

---

## Lisans

Telif hakki (c) 2025-2026 TTECH Business Solutions / Tiryaki Agro. Tum haklari saklidir.
Bu yazilim ozel mulkiyettir (proprietary). Izinsiz kopyalama, dagitma veya degistirme yasaktir.

Powered by **TTECH Business Solutions**

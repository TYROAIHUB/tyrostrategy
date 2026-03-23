# 🏢 TYRO Strategy — Stratejik Yonetim Platformu

> Tiryaki Agro icin kurumsal hedef ve aksiyon yonetim platformu

## 📋 Proje Hakkinda

TYRO Strategy, Tiryaki Agro organizasyonunun stratejik hedeflerini ve aksiyonlarini tek bir platformda yonetmeyi saglayan kurumsal bir web uygulamasidir. **Hedef → Aksiyon** iki seviyeli hiyerarsi ile is kirilim yapisi olusturur, KPI takibi yapar ve ekip performansini olcer.

### Kimler Kullanir?

- **Ust Yonetim (Admin)** — Tum hedefleri ve aksiyonlari goruntuler, olusturur, duzenler, siler
- **Proje Liderleri** — Sorumlu olduklari hedeflerin aksiyonlarini yonetir
- **Kullanicilar** — Kendilerine atanmis aksiyonlari takip eder ve gunceller

### Temel Ozellikler

- Hedef ve aksiyon CRUD islemleri (olusturma, okuma, guncelleme, silme)
- Tablo, Kanban, Gantt, WBS ve Strateji Haritasi gorunum modlari
- Rol bazli erisim kontrolu (RBAC) — parametrik yetki yonetimi
- Kisisel calisma alani (workspace) ve organizasyon KPI dashboard'u
- Turkce ve Ingilizce dil destegi
- 16 farkli sidebar temasi + dark/light mod
- Responsive tasarim (mobil, tablet, masaustu)
- Command Palette ile hizli arama (Ctrl+K / Cmd+K)
- Azure AD / Microsoft Entra ID ile kimlik dogrulama (+ mock mod)
- Offline algilama ve hata yakalama (Error Boundary)

---

## 🏗️ Mimari & Teknoloji Yigini

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Framework** | React + TypeScript | 19.2 / 5.9 |
| **Build Tool** | Vite | 8.0 |
| **UI Library** | HeroUI (NextUI fork) | 2.8 |
| **State Management** | Zustand + localStorage persist | 5.0 |
| **Server State** | TanStack React Query | 5.91 |
| **Forms** | React Hook Form + Zod | 7.71 / 4.3 |
| **Styling** | Tailwind CSS v4 + CSS Variables | 4.2 |
| **Animation** | Framer Motion | 12.38 |
| **Charts** | Recharts | 3.8 |
| **Gantt** | SVAR wx-react-gantt | 1.3 |
| **Tree View** | react-arborist | 3.4 |
| **Drag & Drop** | Atlassian Pragmatic DnD | 1.7 |
| **Rich Text** | Tiptap | 3.20 |
| **i18n** | i18next + react-i18next | 25.10 / 16.6 |
| **Routing** | React Router DOM (HashRouter) | 7.13 |
| **Auth** | Azure MSAL (@azure/msal-browser) | 4.30 |
| **Icons** | Lucide React | 0.577 |
| **Testing** | Vitest + Testing Library | 4.1 |
| **Lint / Format** | ESLint 9 + Prettier 3 | 9.39 / 3.8 |

---

## 📊 Veri Modeli

### Hedef (Objective)

| Alan | Tip | Aciklama |
|------|-----|----------|
| `id` | `string` | Benzersiz tanimlayici |
| `name` | `string` | Hedef adi |
| `description` | `string?` | Aciklama (opsiyonel) |
| `source` | `Source` | Kaynak: `"Turkiye"` \| `"Kurumsal"` \| `"International"` |
| `status` | `EntityStatus` | Durum: `"On Track"` \| `"Achieved"` \| `"Behind"` \| `"At Risk"` \| `"Not Started"` |
| `owner` | `string` | Hedef sahibi |
| `participants` | `string[]` | Katilimci listesi |
| `department` | `string` | Departman |
| `progress` | `number` | Ilerleme yuzdesi (0-100), aksiyonlardan otomatik hesaplanir |
| `startDate` | `string` | Baslangic tarihi (ISO) |
| `endDate` | `string` | Bitis tarihi (ISO) |
| `reviewDate` | `string?` | Gozden gecirme tarihi |
| `createdBy` | `string?` | Olusturan kullanici |
| `createdAt` | `string?` | Olusturulma zamani (ISO) |
| `updatedBy` | `string?` | Son guncelleyen |
| `updatedAt` | `string?` | Son guncelleme zamani |
| `completedAt` | `string?` | Tamamlanma zamani (status "Achieved" oldugunda otomatik set edilir) |

### Aksiyon (Action)

| Alan | Tip | Aciklama |
|------|-----|----------|
| `id` | `string` | Benzersiz tanimlayici |
| `hedefId` | `string` | Bagli oldugu hedefin ID'si (FK) |
| `name` | `string` | Aksiyon adi |
| `description` | `string?` | Aciklama (opsiyonel) |
| `owner` | `string` | Aksiyon sahibi |
| `status` | `EntityStatus` | Durum: `"On Track"` \| `"Achieved"` \| `"Behind"` \| `"At Risk"` \| `"Not Started"` |
| `progress` | `number` | Ilerleme yuzdesi (0-100) |
| `startDate` | `string` | Baslangic tarihi (ISO) |
| `endDate` | `string` | Bitis tarihi (ISO) |
| `sortOrder` | `number?` | Siralama numarasi |
| `createdBy` | `string?` | Olusturan kullanici |
| `createdAt` | `string?` | Olusturulma zamani (ISO) |
| `updatedBy` | `string?` | Son guncelleyen |
| `updatedAt` | `string?` | Son guncelleme zamani |
| `completedAt` | `string?` | Tamamlanma zamani |

### Iliski Diyagrami

```
Hedef (Stratejik Hedef)
  │
  └──1:N──► Aksiyon (Eylem)
              • hedefId → Hedef.id
```

**Onemli kurallar:**
- Bir hedefin ilerlemesi, altindaki aksiyonlarin ortalama ilerlemesinden **otomatik** hesaplanir
- Alt aksiyonu olan hedef **silinemez** (cascade koruma)
- Aksiyon statusu "Achieved" oldugunda `completedAt` otomatik set edilir

---

## 🔐 Yetkilendirme (RBAC)

Rol bazli erisim kontrolu `useRoleStore` ve `usePermissions` hook'u ile yonetilir. Yetkiler **Guvenlik** sayfasindan parametrik olarak degistirilebilir.

### Roller ve Yetki Matrisi

#### Sayfa Erisim Yetkileri

| Sayfa | Admin | Proje Lideri | Kullanici |
|-------|:-----:|:------------:|:---------:|
| Anasayfa (Workspace) | ✅ | ✅ | ✅ |
| KPI Dashboard | ✅ | ❌ | ❌ |
| Hedefler | ✅ | ✅ | ✅ |
| Aksiyonlar | ✅ | ✅ | ✅ |
| Gantt | ✅ | ✅ | ✅ |
| WBS | ✅ | ✅ | ✅ |
| Stratejik Karargah | ✅ | ❌ | ❌ |
| Kullanicilar | ✅ | ❌ | ❌ |
| Ayarlar | ✅ | ❌ | ❌ |
| Guvenlik | ✅ | ❌ | ❌ |

#### CRUD Yetkileri

| Islem | Admin | Proje Lideri | Kullanici |
|-------|:-----:|:------------:|:---------:|
| Hedef Olustur | ✅ | ❌ | ❌ |
| Hedef Duzenle | ✅ | ❌ | ❌ |
| Hedef Sil | ✅ | ❌ | ❌ |
| Aksiyon Olustur | ✅ | ✅ | ✅ |
| Aksiyon Duzenle | ✅ | ✅ (sadece kendi) | ✅ (sadece kendi) |
| Aksiyon Sil | ✅ | ❌ | ❌ |

#### Veri Goruntuleme Kapsami

| Kural | Admin | Proje Lideri | Kullanici |
|-------|:-----:|:------------:|:---------:|
| `editOnlyOwn` | ❌ | ✅ | ✅ |
| `viewOnlyOwn` | ❌ | ✅ | ✅ |

- **Admin**: Tum hedef ve aksiyonlari gorur/duzenler
- **Proje Lideri**: Owner veya participant oldugu hedefleri ve bu hedeflerin aksiyonlarini gorur
- **Kullanici**: Sadece owner oldugu aksiyonlari ve bu aksiyonlarin bagli hedeflerini gorur

### Cascade Silme Kurallari

- Alt aksiyonu olan hedef **silinemez** — once aksiyonlar silinmeli
- Silme denemesinde kullaniciya uyari mesaji gosterilir: _"Bu hedefin altinda N aksiyon var. Once aksiyonlari silin."_

---

## 🗺️ Sayfa Yapisi & Navigasyon

Navigasyon 4 bolume ayrilmistir: **Ana Menu**, **Veriler**, **Gorunumler** ve **Sistem**.

| Route | Sayfa | Aciklama | Erisim |
|-------|-------|----------|--------|
| `/workspace` | Anasayfa | Kisisel dashboard — projelerim, gorev durumu, yaklasan tarihler, ilerleme | Herkes |
| `/dashboard` | KPI | Organizasyon geneli KPI kartlari, kaynak grafigi, durum kirilimi, coklu halka widget | Admin |
| `/stratejik-karargah` | Stratejik Karargah | Tum hedef ve aksiyonlar — Tablo/Kanban/Gantt/WBS gorunum modlari | Admin |
| `/hedefler` | Hedefler | Hedef CRUD — Tablo ve Kanban gorunum modlari | Herkes* |
| `/aksiyonlar` | Aksiyonlar | Aksiyon CRUD — Tablo ve Kanban gorunum modlari | Herkes* |
| `/strategy-map` | T-Map | Stratejik harita gorunumu | Herkes* |
| `/gantt` | Gantt | Zaman cizelgesi gorunumu (wx-react-gantt) | Herkes* |
| `/tree` | WBS | Is kirilim yapisi agac gorunumu (react-arborist) | Herkes* |
| `/kullanicilar` | Kullanicilar | Kullanici listesi ve departman yonetimi | Admin |
| `/ayarlar` | Ayarlar | Uygulama ayarlari, tema secimi, dil | Admin |
| `/guvenlik` | Guvenlik | Rol bazli yetki yonetimi paneli | Admin |
| `/profil` | Profil | Kullanici profil sayfasi | Herkes |
| `/login` | Giris | Kimlik dogrulama / mock login ekrani | Herkese acik |

> \* Veri filtreleme rola gore uygulanir (viewOnlyOwn)

---

## 🎨 Tema Sistemi

### Sidebar Temalari (16 adet)

| # | Tema ID | Aciklama |
|---|---------|----------|
| 1 | `light` | Acik tema (varsayilan) |
| 2 | `arctic` | Buzul mavisi |
| 3 | `navy` | Koyu lacivert |
| 4 | `blue-gradient` | Mavi gradient |
| 5 | `black` | Siyah |
| 6 | `emerald` | Zumrut yesili |
| 7 | `violet` | Mor |
| 8 | `gold` | Altin |
| 9 | `jira` | Jira tarzi |
| 10 | `tiryaki` | Tiryaki kurumsal |
| 11 | `slate` | Arduvaz grisi |
| 12 | `rose` | Gul pembesi |
| 13 | `aurora` | Kuzey isigi |
| 14 | `cyber` | Siber/neon |
| 15 | `obsidian` | Obsidyen siyah |
| 16 | `liquid-glass` | Glassmorphism |

### Renk Sistemi

- CSS degisken bazli (`--tyro-*`) renk sistemi
- `AppThemeConfig` ile uygulama geneli tema degiskenleri (bg, surface, glassBg, text vs.)
- Tailwind siniflarinda `bg-tyro-*`, `text-tyro-*`, `border-tyro-*` olarak kullanilir
- Full app dark/light mod destegi

---

## 🌐 Coklu Dil (i18n)

| Dil | Kod | Dosya | Durum |
|-----|-----|-------|-------|
| Turkce | `tr` | `src/locales/tr.json` | Varsayilan (fallback) |
| Ingilizce | `en` | `src/locales/en.json` | Tam destek |

- **~350+ ceviri anahtari** (nav, form etiketleri, dogrulama mesajlari, durum metinleri vb.)
- Dil tercihi `localStorage` uzerinde saklanir (`tyro-locale`)
- Dil degistirme: Login ekrani ve profil/ayarlar sayfasi
- Yapilandirma: `i18next` + `react-i18next`, `initReactI18next` middleware

---

## 🧩 Bilesen Yapisi

### Layout Bileşenleri (`components/layout/`)

| Bilesen | Aciklama |
|---------|----------|
| `AppLayout` | Ana sayfa duzeni (Sidebar + icerik alani, Outlet) |
| `Sidebar` | Masaustu yan navigasyon — tema destekli, collapse/pin ozelligi |
| `BottomNav` | Mobil alt navigasyon cubugu |
| `MobileHeader` | Mobil ust baslik cubugu (hamburger menu + arama) |
| `PageHeader` | Sayfa basligi ve breadcrumb |

### Paylasilan Bilesenler (`components/shared/`)

| Bilesen | Aciklama |
|---------|----------|
| `SlidingPanel` | Yan panel (detay/form gorunumu, mobilde full-screen) |
| `CommandPalette` | Ctrl+K hizli arama — hedefler, aksiyonlar, kullanicilar, sayfalar |
| `ConfirmDialog` | Onay diyalogu (silme islemleri icin) |
| `CreateButton` | Yeni kayit olusturma butonu (yetki kontrollü) |
| `KanbanView` | Kanban gorunum bileseni (drag & drop destekli) |
| `DataGrid` | Yeniden kullanilabilir tablo bileseni (crud/) |
| `EmptyState` | Bos durum gosterge bileseni |
| `CardSkeleton` | Yukleme animasyonu (skeleton) |
| `ErrorBoundary` | React hata yakalama siniri |
| `OfflineBanner` | Cevrimdisi uyari banner'i |
| `ToastContainer` | Bildirim gosterim alani |

### Domain Bileşenleri

| Bilesen | Konum | Aciklama |
|---------|-------|----------|
| `HedefForm` | `components/hedefler/` | Hedef olusturma/duzenleme formu |
| `HedefDetail` | `components/hedefler/` | Hedef detay gorunumu |
| `AksiyonForm` | `components/aksiyonlar/` | Aksiyon olusturma/duzenleme formu |
| `AksiyonDetail` | `components/aksiyonlar/` | Aksiyon detay gorunumu |

### Dashboard Bilesenleri (`components/dashboard/`)

| Bilesen | Aciklama |
|---------|----------|
| `KPICard` | KPI metrik karti |
| `MultiRingWidget` | Cok katmanli ilerleme halkalari |
| `SourceChart` | Kaynak bazli dagilim grafigi |
| `ProjectStatusBreakdown` | Durum kirilim tablosu |
| `ActivityFeed` | Son aktiviteler akisi |
| `AdvancedFilterPanel` | Gelismis filtreleme paneli |

### Workspace Bilesenleri (`components/workspace/`)

| Bilesen | Aciklama |
|---------|----------|
| `BentoKPI` | Bento grid KPI ozet karti |
| `MyProjectsList` | Kullanicinin hedef/proje listesi |
| `WorkspaceTaskDonut` | Gorev durumu pasta grafik |
| `UpcomingDeadlines` | Yaklasan tarihler widget'i |
| `MyProgressWidget` | Bireysel ilerleme gostergesi |

### UI Bilesenleri (`components/ui/`)

| Bilesen | Aciklama |
|---------|----------|
| `GlassCard` | Glassmorphism tarzi kart bileseni |
| `StatusBadge` | Durum etiketi (renkli badge) |
| `RoleAvatar` | Rol bazli kullanici avatari |
| `TyroLogo` | TYRO logosu bileseni |
| `CircularProgress` | Dairesel ilerleme gostergesi |
| `AnimatedCounter` | Animasyonlu sayi sayaci |
| `HomeIcon` | Ozel anasayfa ikonu |

---

## 📁 Klasor Yapisi

```
src/
├── components/
│   ├── layout/           # AppLayout, Sidebar, BottomNav, MobileHeader, PageHeader
│   ├── hedefler/         # HedefForm, HedefDetail
│   ├── aksiyonlar/       # AksiyonForm, AksiyonDetail
│   ├── workspace/        # BentoKPI, MyProjectsList, TaskDonut, Deadlines, Progress
│   ├── dashboard/        # KPICard, MultiRing, SourceChart, StatusBreakdown, Filters
│   ├── shared/           # SlidingPanel, CommandPalette, ConfirmDialog, Kanban, Toast
│   ├── crud/             # DataGrid
│   ├── ui/               # GlassCard, StatusBadge, RoleAvatar, TyroLogo, CircularProgress
│   └── __tests__/        # Bilesen testleri
├── pages/                # 14 sayfa bileseni (lazy loaded)
│   └── __tests__/        # Sayfa testleri
├── stores/               # Zustand store'lari
│   ├── dataStore.ts      #   Hedef/Aksiyon CRUD + localStorage persist
│   ├── uiStore.ts        #   UI durumu (sidebar, tema, mock auth)
│   ├── roleStore.ts      #   RBAC yetki yonetimi
│   ├── filterStore.ts    #   Filtreleme durumu
│   ├── toastStore.ts     #   Bildirim durumu
│   └── __tests__/        #   Store testleri
├── hooks/                # Custom React hook'lari
│   ├── usePermissions.ts #   RBAC yetki kontrolleri + veri filtreleme
│   ├── useCurrentUser.ts #   Aktif kullanici bilgisi
│   ├── useHedefler.ts    #   Hedef islemleri hook'u
│   ├── useAksiyonlar.ts  #   Aksiyon islemleri hook'u
│   ├── useMyWorkspace.ts #   Kisisel workspace verileri
│   ├── useSidebarTheme.ts#   Sidebar tema hook'u
│   └── __tests__/        #   Hook testleri
├── lib/                  # Yardimci moduller
│   ├── auth/             #   AuthGuard, msalConfig (Azure MSAL)
│   ├── data/             #   Mock data adapter
│   ├── mock-data/        #   Demo verileri
│   ├── i18n.ts           #   i18next yapilandirmasi
│   ├── utils.ts          #   Genel yardimci fonksiyonlar
│   ├── colorUtils.ts     #   Renk yardimci fonksiyonlari
│   ├── dateUtils.ts      #   Tarih yardimci fonksiyonlari
│   ├── constants.ts      #   Sabit degerler
│   └── __tests__/        #   Lib testleri
├── config/               # Uygulama yapilandirmasi
│   ├── departments.ts    #   Departman ve kullanici tanimlari
│   └── sidebarThemes.ts  #   16 sidebar temasi + app tema config
├── locales/              # Ceviri dosyalari
│   ├── tr.json           #   Turkce (~350 anahtar)
│   └── en.json           #   Ingilizce (~350 anahtar)
├── styles/
│   └── globals.css       #   Global CSS + Tailwind + CSS degiskenleri
├── types/
│   └── index.ts          #   TypeScript tip tanimlari (Hedef, Aksiyon, RBAC vb.)
├── App.tsx               #   Router yapisi + lazy loading + ProtectedRoute
├── main.tsx              #   Uygulama giris noktasi
└── vite-env.d.ts         #   Vite ortam degiskeni tipleri
```

---

## 🚀 Kurulum & Calistirma

### On Kosullar

- Node.js 18+
- npm 9+

### Kurulum

```bash
# Bagimliliklari yukle
npm install --legacy-peer-deps

# Gelistirme sunucusu (port 5173)
npm run dev

# Production build
npm run build

# Build onizleme
npm run preview

# Testleri calistir
npm run test

# Lint kontrolu
npm run lint

# Kod formatlama
npm run format
```

---

## 🧪 Test

Proje **Vitest 4** + **React Testing Library** kullanir.

### Test Dosyalari (20 dosya)

| Kategori | Dosyalar |
|----------|----------|
| **Stores** | `dataStore.test.ts`, `roleStore.test.ts`, `uiStore.test.ts`, `cascade.test.ts` |
| **Hooks** | `usePermissions.test.ts`, `useCurrentUser.test.ts`, `useMyWorkspace.test.ts` |
| **Lib** | `colorUtils.test.ts`, `utils.test.ts`, `dateUtils.test.ts`, `i18n.test.ts`, `constants.test.ts`, `permissions-integration.test.ts` |
| **Components** | `ErrorBoundary.test.tsx`, `StatusBadge.test.tsx`, `CreateButton.test.tsx`, `ConfirmDialog.test.tsx`, `RoleAvatar.test.tsx` |
| **Pages** | `LoginPage.test.tsx`, `WorkspacePage.test.tsx` |

### Test Komutlari

```bash
npm run test          # Tek seferlik calistir
npm run test:watch    # Izleme modunda calistir (dosya degisikliklerinde tekrar calisir)
```

---

## 📦 Scripts

| Komut | Aciklama |
|-------|----------|
| `npm run dev` | Vite gelistirme sunucusu (HMR, port 5173) |
| `npm run build` | TypeScript derleme + Vite production build |
| `npm run preview` | Production build onizleme sunucusu |
| `npm run lint` | ESLint ile kod analizi |
| `npm run format` | Prettier ile kod formatlama (`src/**/*.{ts,tsx,css}`) |
| `npm run test` | Vitest ile testleri calistir |
| `npm run test:watch` | Vitest izleme modu |

---

## 🔧 Ortam Degiskenleri

`.env` veya `.env.local` dosyasinda tanimlanir:

| Degisken | Varsayilan | Aciklama |
|----------|-----------|----------|
| `VITE_AZURE_CLIENT_ID` | — | Azure AD uygulama (client) ID |
| `VITE_AZURE_TENANT_ID` | — | Azure AD tenant ID |
| `VITE_REDIRECT_URI` | `http://localhost:5173` | OAuth yonlendirme URI'si |
| `VITE_MOCK_AUTH` | `true` | `true` → Azure AD atlanir, demo kullanici secimi ile giris yapilir |

> **Not:** `VITE_MOCK_AUTH=true` ayarlandığında Azure AD kimlik dogrulamasi devre disi kalir ve login ekraninda 3 demo profil (Admin, Proje Lideri, Kullanici) ile giris yapilabilir.

---

## 🏢 Organizasyon Yapisi

| Departman | Kullanici Sayisi |
|-----------|:---------------:|
| Turkiye Operasyonlari | 4 |
| Uluslararasi Operasyonlar | 4 |
| Kurumsal | 5 |
| Finans | 2 |
| Insan Kaynaklari | 2 |
| IT | 3 |
| **Toplam** | **20** |

E-posta adresleri `ad.soyad@tiryaki.com.tr` formatinda otomatik olusturulur.

---

## 📄 Lisans

Telif hakki &copy; 2026 TTECH Business Solutions / Tiryaki Agro. Tum haklari saklidir.
Bu yazilim ozel mulkiyettir (proprietary). Izinsiz kopyalama, dagitma veya degistirme yasaktir.

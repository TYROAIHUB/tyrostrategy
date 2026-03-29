# Mobile UI Standards

TYRO Strategy mobil deneyimi için tüm standartlar bu dosyada. Mobil dokunduğun her şeyde önce bunu oku.

---

## 1. Breakpoints

| Breakpoint | px    | Kullanım |
|------------|-------|---------|
| (default)  | 0+    | Mobile-first base |
| `sm:`      | 640px | Geniş telefon / küçük tablet |
| `lg:`      | 1024px| Desktop — sidebar görünür, MobileHeader gizli |

Kural: **Mobile-first yaz.** Desktop için `lg:` prefix kullan.

---

## 2. MobileHeader

`src/components/layout/MobileHeader.tsx`

### Tasarım: iOS 26 Liquid Glass
- Yüzen, round pill header — `fixed top-2 left-3 right-3`, `borderRadius: 20`
- `lg:hidden` — sadece mobilde görünür
- Yükseklik: **56px**

### Tema Entegrasyonu
Header arka planı ve logo renkleri **aktif sidebar temasından** türetilir:
```tsx
const theme = useSidebarTheme();
// Tüm renkler theme.brandTyro, theme.brandStrategy, theme.accentColor, theme.bg'den gelir
```

- `theme.isDark` → dark/light cam rengi ayrımı
- `theme.brandTyro` / `theme.brandStrategy` → logo renkleri
- `theme.accentColor` → buton border/shadow tonu
- `theme.bg` → dark glass arka plan tabanı

### Liquid Glass CSS Efekti
```tsx
background: dark
  ? `linear-gradient(180deg, rgba(${bgRgb}, 0.78) 0%, rgba(${bgRgb}, 0.62) 100%)`
  : `linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(${bgRgb}, 0.18) 100%)`,
backdropFilter: "blur(32px) saturate(190%)",
WebkitBackdropFilter: "blur(32px) saturate(190%)",
```

### Buton Boyutları
- Tüm butonlar: `w-9 h-9` (36px) — eşit boyut
- İkon boyutu: `size={15-17}`
- `borderRadius: 12`, ayrı liquid glass efekti
- `transition: "all 0.3s ease"` — tema geçişinde yumuşak

### Padding Ayarı (AppLayout)
```tsx
// Mobile: pt-[78px] — floating header (8px top gap + 56px height + 14px spacing)
// Desktop: lg:pt-[36px]
"flex-1 overflow-y-auto px-4 sm:px-5 lg:px-8 pt-[78px] lg:pt-[36px]"
```

---

## 3. Bottom Navigation

`src/components/layout/BottomNav.tsx`

- `fixed bottom-0 left-0 right-0 lg:hidden`
- Safe area: `pb-safe` veya `pb-[env(safe-area-inset-bottom)]`
- Minimum 4, maksimum 5 nav item
- Aktif item: tema accent rengi, animasyonlu indicator
- Dokunma hedefi: min **44x44px**

---

## 4. Dokunma Hedefleri

Tüm tıklanabilir elementler mobilde:
- Min boyut: **44×44px** (Apple HIG standardı)
- Buton padding: `px-4 py-2.5` minimum
- `cursor-pointer` her zaman

---

## 5. Mobil Kart / Liste Düzeni

Masaüstünde tablo olan içerik mobilde kart listesine dönüşür:

```tsx
{/* Masaüstü: tablo */}
<div className="hidden sm:block">
  <Table ... />
</div>

{/* Mobil: kart listesi */}
<div className="sm:hidden space-y-3">
  {items.map(item => <MobileCard key={item.id} item={item} />)}
</div>
```

### Kart Standartları (mobil)
```tsx
<div className="rounded-2xl bg-white/60 dark:bg-tyro-surface/50
                backdrop-blur-sm border border-tyro-border/30
                px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
```

---

## 6. Özet / Bilgi Satırları (Summary Pills)

Birden fazla bilgi pill'i olduğunda:
- `flex flex-wrap` kullan — taşma durumunda alta düşer
- Satır başına gelen pill'de separator (•) **gösterme**
- `ResizeObserver` ile `offsetTop` karşılaştırması yapılır

```tsx
// SummaryPills bileşeni — WorkspacePage'deki örneği referans al
// i > 0 && !lineStarts[i] → bullet göster
```

---

## 7. Sliding Panel — Mobil Davranış

`src/components/shared/SlidingPanel.tsx`

- Masaüstü: sağdan kayar (drawer)
- Mobil: **full-screen** — `w-full h-full`
- Header sticky, footer sticky, içerik scroll
- Kapatma: swipe-down veya X butonu

---

## 8. Tipografi Ölçeği — Mobil

| Kullanım | Masaüstü | Mobil |
|----------|----------|-------|
| Sayfa başlığı | 20-24px | 17-18px |
| Kart başlık | 15-16px | 14-15px |
| Gövde metni | 13-14px | 12-13px |
| Yardımcı metin | 12px | 11px |
| **Minimum** | **11px** | **11px** |

**10px ve altı yasak.**

---

## 9. Sidebar → Drawer Geçişi

- `lg:hidden` → MobileHeader görünür
- `lg:flex` → Sidebar görünür
- Mobilde sidebar: `MobileDrawer` olarak açılır (UIStore `mobileDrawerOpen`)
- Drawer kapanması: overlay tıklama veya nav item seçimi

---

## 10. Renk ve Kontrast (Mobil)

- TYRO tokenları dışında hex kullanma
- Mobil ekranda güneş ışığı okunabilirliği için min **4.5:1** kontrast
- Glass efektlerde `rgba` opacity değerleri:
  - Light: `0.55-0.72` arka plan, `0.45-0.6` border
  - Dark: `0.62-0.78` arka plan, `0.08-0.12` border

---

## 11. Animasyon Performansı

- `transform` ve `opacity` dışındaki CSS property'leri animate etme (layout thrashing)
- `will-change: transform` — sadece gerçekten animasyonlu elementlerde
- Framer Motion `layoutId` — kart→detail geçişlerinde
- Disable animations if `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## 12. Test Checklist (Mobil)

Mobil bileşen yazarken şunları kontrol et:
- [ ] 375px (iPhone SE) genişliğinde bozulma yok
- [ ] Dokunma hedefleri ≥44px
- [ ] Liquid glass efekti `WebkitBackdropFilter` de var
- [ ] Tema değişiminde renkler güncelleniyor (dark/light)
- [ ] Safe area inset'ler uygulandı (bottom nav)
- [ ] Overflow yoksa `overflow-hidden` doğru yerde
- [ ] Font boyutu ≥11px

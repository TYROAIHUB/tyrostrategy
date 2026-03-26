# TYRO Strategy — UI Design Rules

Bu kurallar tüm bileşenlerde tutarlılık sağlamak için uygulanmalıdır.
Yeni bileşen, buton, form veya kart oluştururken bu kurallara uyulmalıdır.

---

## 1. Font Size Kuralları

| Kullanım | Minimum | Önerilen | Maksimum |
|---|---|---|---|
| **Tıklanabilir buton metni** | 12px | 12-13px | 14px |
| **Dropdown/menü öğeleri** | 12px | 12-13px | 14px |
| **Form label** | 12px | 12px | 13px |
| **Form input değeri** | 12px | 13px | 14px |
| **Tablo header** | 11px | 12px | 13px |
| **Tablo veri hücresi** | 12px | 12px | 13px |
| **Kart başlığı** | 13px | 14-16px | 20px |
| **Kart alt metin (secondary)** | 11px | 12px | 13px |
| **Badge/chip metni** | 11px | 11px | 12px |
| **Metadata (ID, tarih, oluşturan)** | 11px | 12px | 13px |
| **Sayfa başlığı (H1)** | 18px | 20-22px | 24px |
| **Sayfa alt başlığı** | 12px | 13px | 14px |
| **Footer/copyright** | 11px | 12px | 12px |

**KURAL: Hiçbir tıklanabilir eleman 12px'in altında font kullanmamalı.**
**KURAL: Hiçbir okunması gereken metin 11px'in altında olmamalı.**
**KURAL: 10px ve altı font boyutu YASAKLI — kullanılmamalı.**

---

## 2. Buton Stilleri

### Primary (ana aksiyon)
```
h-8 px-3 rounded-lg bg-tyro-navy text-white text-[12px] font-semibold
hover: scale-1.04, bg-tyro-navy-light
```

### Secondary (ikincil aksiyon)
```
h-8 px-3 rounded-lg border border-tyro-border bg-tyro-surface text-[12px] font-semibold text-tyro-text-primary
hover: bg-tyro-navy/5, border-tyro-navy/30
shadow-sm
```

### Danger (silme)
```
h-8 px-3 rounded-lg border border-red-200 text-[12px] font-semibold text-red-500
hover: bg-red-50
```

### Disabled
```
border-tyro-border/40 text-tyro-text-muted/40 cursor-default
```

**KURAL: Butonlar her zaman `h-8` (32px) minimum yükseklik.**
**KURAL: Buton metni `font-semibold` ve `text-[12px]` minimum.**
**KURAL: Butonlar `cursor-pointer` olmalı, hover efekti olmalı.**
**KURAL: İkon butonları minimum `w-8 h-8` (32x32px touch target).**

---

## 3. Renk ve Kontrast Kuralları

| Token | Değer | Kontrast | Kullanım |
|---|---|---|---|
| tyro-text-primary | #0f172a | 17.85:1 | Başlıklar, önemli değerler |
| tyro-text-secondary | #475569 | 7.31:1 | Alt bilgiler, tarihler, label'lar |
| tyro-text-muted | #6b7280 | 5.9:1 | Placeholder, devre dışı, metadata |

**KURAL: `text-tyro-text-muted` opaklık modifikatörü ile (`/70`, `/50`) KULLANILMAMALI.**
**KURAL: Minimum kontrast oranı 4.5:1 (WCAG AA).**
**KURAL: Tıklanabilir metinler `text-tyro-text-primary` veya `text-tyro-text-secondary` kullanmalı.**

---

## 4. Kart ve Panel Kuralları

### Glass Card
```
glass-card rounded-xl p-4 sm:p-5
shadow: tyro-sm (0 1px 3px + 0 8px 32px)
```

### SlidingPanel Header
```
Başlık: text-[14px] font-bold text-tyro-text-primary
İkon: w-7 h-7 rounded-lg bg-tyro-bg
Kapat butonu: w-7 h-7, görünür, hover efektli
```

### Info Grid (2 sütun)
```
rounded-xl bg-tyro-surface/60 border border-tyro-border/20
divide-y divide-tyro-border/20
Her hücre: px-3 py-2
Label: text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted
Değer: text-[12px] font-medium text-tyro-text-primary
```

---

## 5. Spacing ve Layout

| Eleman | gap |
|---|---|
| Kartlar arası | gap-3 sm:gap-4 |
| Kart içi bölümler | gap-3 |
| Form alanları arası | gap-3 |
| Butonlar arası | gap-1.5 - gap-2 |
| Label ↔ Input arası | mb-1 - mb-1.5 |

---

## 6. Durum Renkleri (Status Colors)

| Durum | Badge BG | Badge Text | Bar Color |
|---|---|---|---|
| Yolunda | emerald-50 | emerald-600 | #059669 |
| Risk Altında | amber-50 | amber-600 | #d97706 |
| Gecikmeli | red-50 | red-600 | #dc2626 |
| Tamamlandı | emerald-50 | emerald-600 | #059669 |
| Başlanmadı | slate-100 | slate-500 | #94a3b8 |
| Askıda | violet-50 | violet-600 | #7c3aed |
| İptal | slate-100 | slate-500 | #64748b |

**KURAL: StatusBadge her yerde aynı renk paleti kullanmalı.**
**KURAL: İlerleme çubuğu rengi statü rengiyle aynı olmalı.**

---

## 7. İkon Kuralları

| Bağlam | Boyut | strokeWidth |
|---|---|---|
| Buton içi ikon | 13-14px | 2 |
| Menü öğesi ikonu | 14px | 2 |
| Kart header ikonu | 16px | 2 |
| Tab ikonu | 16-18px | 1.8 |
| Badge/chip ikonu | 12px | 2 |

**KURAL: Her bileşen kendi bağlamına uygun ikon boyutu kullanmalı.**
**KURAL: Uygulama genelinde tutarlı ikonlar: Proje=Target/Crosshair, Aksiyon=CircleCheckBig, Sihirbaz=Wand2.**

---

## 8. Animasyon Kuralları

- Buton hover: `whileHover={{ scale: 1.04 }}`, `whileTap={{ scale: 0.96 }}`
- Panel geçişi: opacity 0→1, y: 8→0, duration: 0.2s
- Dropdown: opacity 0→1, y: -4→0, scale: 0.95→1, duration: 0.12s
- Progress bar: `transition-all duration-700`

---

## 9. Responsive Kuralları

- Mobil (< 640px): Tek sütun, tam genişlik kartlar
- Tablet (640-1024px): 2 sütun grid'ler
- Desktop (> 1024px): Tam layout, sidebar + main
- Bottom nav: Mobilde görünür (`lg:hidden`), dock efekti
- Sidebar: Desktop'ta görünür (`hidden lg:flex`)
- Touch target: Minimum 44x44px (mobil butonlar)

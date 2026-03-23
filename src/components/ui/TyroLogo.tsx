interface TyroLogoProps {
  size?: number;
  variant?: "login" | "sidebar";
  isDark?: boolean;
  accentColor?: string;
  themeId?: string;
  themeColors?: {
    gradientStart: string;
    gradientEnd: string;
    fillA: string;
    fillB: string;
    fillC: string;
  };
}

// Orijinal Tiryaki renkleri (light + blue-gradient + navy temalar)
const ORIGINAL = {
  gradStart: "#c8922a",
  gradEnd: "#8a6518",
  fillA: "#1e3a5f",   // sağ alt — koyu
  fillB: "#2a4f7f",   // ana üst — açık
  fillC: "#142842",    // gölge — en koyu
};

// Gold temalar için (black tema)
const ALL_GOLD = {
  gradStart: "#d4a23a",
  gradEnd: "#a07828",
  fillA: "#a07828",
  fillB: "#c8922a",
  fillC: "#8a6518",
};

// Gold sol parça + tema renginden sağ parçalar (blue-gradient, navy)
function goldLeftThemeRight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lighten = (v: number, amt: number) => Math.min(255, Math.round(v + (255 - v) * amt));
  const darken = (v: number, amt: number) => Math.max(0, Math.round(v * (1 - amt)));
  return {
    gradStart: "#d4a23a",
    gradEnd: "#a07828",
    fillA: `rgb(${darken(r, 0.05)}, ${darken(g, 0.05)}, ${darken(b, 0.05)})`,    // sağ alt — biraz koyu
    fillB: `rgb(${lighten(r, 0.25)}, ${lighten(g, 0.25)}, ${lighten(b, 0.25)})`,  // ana üst — açık
    fillC: `rgb(${darken(r, 0.2)}, ${darken(g, 0.2)}, ${darken(b, 0.2)})`,        // gölge — koyu
  };
}

// Temanın kendi renklerinden logo (violet, emerald, sakura vb.)
function themeColorLogo(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lighten = (v: number, amt: number) => Math.min(255, Math.round(v + (255 - v) * amt));
  const darken = (v: number, amt: number) => Math.max(0, Math.round(v * (1 - amt)));
  return {
    // Sol parça — temanın tek düz rengi
    gradStart: `rgb(${lighten(r, 0.15)}, ${lighten(g, 0.15)}, ${lighten(b, 0.15)})`,
    gradEnd: `rgb(${r}, ${g}, ${b})`,
    // Sağ üst parça — açık ton
    fillB: `rgb(${lighten(r, 0.35)}, ${lighten(g, 0.35)}, ${lighten(b, 0.35)})`,
    // Sağ alt parça — orta ton (üstten koyuya geçiş)
    fillA: `rgb(${darken(r, 0.05)}, ${darken(g, 0.05)}, ${darken(b, 0.05)})`,
    // Gölge — en koyu
    fillC: `rgb(${darken(r, 0.25)}, ${darken(g, 0.25)}, ${darken(b, 0.25)})`,
  };
}

// Gold sol parça kullanacak tema ID'leri
const GOLD_LEFT_THEMES = new Set([
  "light", "blue-gradient", "dark-navy", "navy",
]);

// Tamamen gold olacak tema ID'leri
const ALL_GOLD_THEMES = new Set([
  "dark-black", "black", "midnight",
]);

export function TyroLogo({ size = 36, variant = "sidebar", isDark = false, accentColor, themeId, themeColors }: TyroLogoProps) {
  const gradId = variant === "login" ? "tyro-lg" : "tyro-sg";
  const isLogin = variant === "login";

  let c = ORIGINAL;

  if (themeColors) {
    // Tema renkleri doğrudan verilmiş — en yüksek öncelik
    c = themeColors;
  } else if (isLogin) {
    c = { ...ORIGINAL, fillA: "#2a5580", fillB: "#3a6a9f", fillC: "#1e3a5f" };
  } else if (!isDark) {
    // Açık temalar → orijinal (gold sol + navy sağ)
    c = ORIGINAL;
  } else if (themeId && ALL_GOLD_THEMES.has(themeId)) {
    // Black temalar → tamamen gold
    c = ALL_GOLD;
  } else if (themeId && GOLD_LEFT_THEMES.has(themeId) && accentColor) {
    // Navy/blue temalar → gold sol + tema sağ
    c = goldLeftThemeRight(accentColor);
  } else if (accentColor) {
    // Diğer koyu temalar → temanın kendi 2-3 rengi
    c = themeColorLogo(accentColor);
  } else if (isDark) {
    // Fallback koyu tema
    c = { gradStart: "#d4a23a", gradEnd: "#a07828", fillA: "#3a6a9f", fillB: "#4a7fb5", fillC: "#2a4a72" };
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 150 150"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="61.29"
          y1="116.53"
          x2="14.04"
          y2="47.15"
          gradientTransform="translate(0 150.55) scale(1 -1)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={c.gradStart} />
          <stop offset="1" stopColor={c.gradEnd} />
        </linearGradient>
      </defs>
      {/* Sol parça */}
      <path
        d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z"
        fill={`url(#${gradId})`}
      />
      {/* Sağ alt parça — koyu */}
      <path
        d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z"
        fill={c.fillA}
      />
      {/* Ana üst büyük parça — açık */}
      <path
        d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z"
        fill={c.fillB}
      />
      {/* Gölge parça — en koyu */}
      <path
        d="M84.52,91.98s5.52-3.31,13.25-7.87v-8.28c-9.11,5.25-16.43,9.66-16.43,9.66,0,0-20.29,10.35-22.92,45.14v1.1c7.32-30.23,26.09-39.76,26.09-39.76Z"
        fill={c.fillC}
      />
    </svg>
  );
}

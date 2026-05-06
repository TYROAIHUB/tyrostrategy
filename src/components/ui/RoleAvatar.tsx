import { useTranslation } from "react-i18next";
import { getRoleLabel } from "@/lib/constants";
import type { UserRole } from "@/types";

interface RoleAvatarProps {
  name: string;
  role: UserRole;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  innerBg?: string;
  innerText?: string;
  accentColor?: string; // Theme accent — overrides ring gradient
}

const sizeMap = { sm: 32, md: 40, lg: 56 } as const;

const roleStyles: Record<
  UserRole,
  {
    gradient: string;
    borderWidth: number;
    glow: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  Admin: {
    gradient: "conic-gradient(from 0deg, #a07828, #c9a84c, #d4b65c, #a07828, #8b6914, #c9a84c, #a07828)",
    borderWidth: 3,
    glow: "0 0 6px rgba(160,120,40,0.35), 0 0 12px rgba(160,120,40,0.15)",
    badgeBg: "rgba(160,120,40,0.12)",
    badgeText: "#8b6914",
  },
  "Proje Lideri": {
    gradient: "linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa, #3b82f6, #1e40af)",
    borderWidth: 3,
    glow: "0 0 6px rgba(59,130,246,0.4), 0 0 12px rgba(59,130,246,0.15)",
    badgeBg: "rgba(59,130,246,0.12)",
    badgeText: "#2563eb",
  },
  Management: {
    gradient: "linear-gradient(135deg, #5b21b6, #8b5cf6, #a78bfa, #8b5cf6, #5b21b6)",
    borderWidth: 3,
    glow: "0 0 6px rgba(139,92,246,0.4), 0 0 12px rgba(139,92,246,0.15)",
    badgeBg: "rgba(139,92,246,0.12)",
    badgeText: "#7c3aed",
  },
};

// lightenHex/darkenHex helpers kaldırıldı — role-bağımsız accent override
// kaldırılınca artık kullanılmıyor.

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function RoleAvatar({ name, role, size = "md", showBadge = false, innerBg, innerText, accentColor }: RoleAvatarProps) {
  const { t } = useTranslation();
  const px = sizeMap[size];
  const baseStyle = roleStyles[role];

  // Halka HER ZAMAN role'a özgü gradient — Admin gold, Proje Lideri blue,
  // Management violet (kullanıcı raporu 2026-05-06: tyro Proje Lideri
  // sidebarda gold halka görünüyordu, profilde blue — tutarsızdı).
  // accentColor önceden gradient'ı override ediyordu (theme uyumu için)
  // ama bu role kimliğini siliyordu. Şimdi accentColor sadece glow'u
  // dengeleyebiliyor; ring rengi role'a sabit.
  const style = accentColor
    ? { ...baseStyle, glow: `${baseStyle.glow}, 0 0 14px ${accentColor}20` }
    : baseStyle;
  const initials = getInitials(name);
  const fontSize = size === "sm" ? 11 : size === "md" ? 13 : 18;
  const outerSize = px + style.borderWidth * 2;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Gradient ring */}
      <div
        className={role === "Admin" ? "role-ring-admin" : undefined}
        style={{
          width: outerSize,
          height: outerSize,
          borderRadius: "50%",
          padding: style.borderWidth,
          background: style.gradient,
          boxShadow: style.glow,
          flexShrink: 0,
        }}
      >
        {/* Inner circle */}
        <div
          className="flex items-center justify-center rounded-full font-bold select-none"
          style={{
            width: px,
            height: px,
            fontSize,
            backgroundColor: innerBg || "var(--tyro-navy)",
            color: innerText || "#ffffff",
          }}
        >
          {initials}
        </div>
      </div>

      {/* Badge */}
      {showBadge && (
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{
            background: style.badgeBg,
            color: style.badgeText,
          }}
        >
          {getRoleLabel(role, t)}
        </span>
      )}

      {/* Admin ring subtle animation */}
      {role === "Admin" && (
        <style>{`
          @keyframes admin-ring-glow {
            0%, 100% { box-shadow: 0 0 6px rgba(160,120,40,0.35), 0 0 12px rgba(160,120,40,0.15); }
            50% { box-shadow: 0 0 8px rgba(160,120,40,0.45), 0 0 16px rgba(160,120,40,0.2); }
          }
          .role-ring-admin {
            animation: admin-ring-glow 3s ease-in-out infinite;
          }
        `}</style>
      )}
    </div>
  );
}

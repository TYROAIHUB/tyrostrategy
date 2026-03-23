import { Menu, Search } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

export default function MobileHeader() {
  const toggleMobileDrawer = useUIStore((s) => s.toggleMobileDrawer);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-tyro-surface border-b border-tyro-border lg:hidden">
      {/* Hamburger */}
      <button
        type="button"
        onClick={toggleMobileDrawer}
        className="flex items-center justify-center w-11 h-11 -ml-1 rounded-button text-tyro-text-secondary hover:bg-tyro-bg transition-colors cursor-pointer"
        aria-label="Menüyü aç"
      >
        <Menu size={22} />
      </button>

      {/* Logo */}
      <span className="text-[17px] font-extrabold tracking-normal">
        <span className="text-tyro-navy">tyro</span>
        <span className="text-tyro-gold">strategy</span>
      </span>

      {/* Search */}
      <button
        type="button"
        onClick={openCommandPalette}
        className="flex items-center justify-center w-11 h-11 -mr-1 rounded-button text-tyro-text-secondary hover:bg-tyro-bg transition-colors cursor-pointer"
        aria-label="Ara"
      >
        <Search size={20} />
      </button>
    </header>
  );
}

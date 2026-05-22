import { useState, useMemo, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@heroui/react";
import {
  Search, ChevronDown, ChevronRight,
  Zap, Compass, MessageCircleQuestion, BookOpenText,
  Command, Gift, Headphones, Lock,
  LogIn, LayoutDashboard, FolderPlus, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import clsx from "clsx";

/* ── Glass token ─────────────────────────────────────────────── */
const glass = "bg-white/60 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border border-white/50 dark:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]";
const glassHover = "hover:shadow-[0_4px_28px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.6)]";
const glassInner = "bg-white/50 dark:bg-white/[0.04] border border-white/40 dark:border-white/[0.06]";

/* ── Animations ──────────────────────────────────────────────── */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};

/* ── Collapsible Section Card ────────────────────────────────── */
function HelpCard({
  id, icon: Icon, title, count, children, forceOpen, defaultOpen = false,
}: {
  id: string; icon: React.ElementType; title: string; count?: number;
  children: ReactNode; forceOpen?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen ?? open;
  const theme = useSidebarTheme();
  const accent = theme.accentColor ?? "#c8922a";

  return (
    <motion.div
      id={`help-${id}`}
      variants={fadeUp}
      className={clsx("rounded-2xl overflow-hidden transition-shadow", glass, glassHover)}
    >
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left transition-colors hover:bg-white/30 dark:hover:bg-white/[0.03]"
      >
        <Icon size={18} strokeWidth={1.8} style={{ color: accent }} className="shrink-0" />
        <span className="text-[14px] font-bold text-tyro-text-primary flex-1">{title}</span>
        {count !== undefined && count > 0 && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
            style={{ backgroundColor: `${accent}12`, color: accent }}
          >
            {count}
          </span>
        )}
        <ChevronDown
          size={16}
          className={clsx("text-tyro-text-muted transition-transform duration-300", isOpen && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── FAQ Accordion Item ──────────────────────────────────────── */
function FaqItem({ question, answer, accent }: { question: string; answer: string; accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/30 dark:border-white/[0.06] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-2.5 py-3 cursor-pointer text-left group"
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors"
          style={{ backgroundColor: open ? `${accent}15` : "transparent" }}
        >
          <ChevronRight
            size={12}
            className={clsx("transition-transform duration-200", open && "rotate-90")}
            style={{ color: open ? accent : "var(--tyro-text-muted)" }}
          />
        </div>
        <span className={clsx(
          "text-[13px] font-semibold transition-colors",
          open ? "text-tyro-text-primary" : "text-tyro-text-secondary group-hover:text-tyro-text-primary"
        )}>
          {question}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[13px] text-tyro-text-secondary leading-relaxed pl-[30px] pb-3.5">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Glossary Row ────────────────────────────────────────────── */
function GlossaryRow({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="py-2.5 border-b border-white/25 dark:border-white/[0.05] last:border-0">
      <dt className="text-[13px] font-bold text-tyro-text-primary">{term}</dt>
      <dd className="text-[12px] text-tyro-text-secondary leading-relaxed mt-0.5">{definition}</dd>
    </div>
  );
}

/* ── Shortcut Row ────────────────────────────────────────────── */
function ShortcutRow({ keys, description }: { keys: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/25 dark:border-white/[0.05] last:border-0">
      <span className="text-[13px] text-tyro-text-secondary">{description}</span>
      <kbd className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-tyro-text-primary",
        "bg-white/70 dark:bg-white/[0.08] border border-white/50 dark:border-white/[0.1] shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_-1px_0_rgba(0,0,0,0.04)]"
      )}>
        {keys}
      </kbd>
    </div>
  );
}

/* ── Step Card (numbered) ────────────────────────────────────── */
function StepCard({ step, icon: Icon, title, description, accent }: {
  step: number; icon: React.ElementType; title: string; description: string; accent: string;
}) {
  return (
    <div className={clsx("relative flex items-start gap-3.5 p-4 rounded-xl transition-colors", glassInner)}>
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md"
          style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}18` }}
        >
          <Icon size={18} strokeWidth={1.8} style={{ color: accent }} />
        </div>
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
          style={{ backgroundColor: accent, boxShadow: `0 2px 6px ${accent}40` }}
        >
          {step}
        </span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-[13px] font-bold text-tyro-text-primary">{title}</h4>
        <p className="text-[12px] text-tyro-text-secondary mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ── How-To Sub-section ──────────────────────────────────────── */
function HowToSection({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-[12px] font-bold text-tyro-text-primary uppercase tracking-wider mb-2">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-tyro-text-secondary leading-relaxed">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent, opacity: 0.5 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Contact Info Card ───────────────────────────────────────── */
function ContactCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={clsx("p-3.5 rounded-xl", glassInner)}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-tyro-text-muted block mb-1.5">{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: value === "—" ? "var(--tyro-text-muted)" : accent }}>
        {value}
      </span>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════ */
/* ── Main Page ───────────────────────────────────────────────── */
/* ═════════════════════════════════════════════════════════════ */
export default function YardimPage() {
  const { t } = useTranslation();
  const theme = useSidebarTheme();
  const accent = theme.accentColor ?? "#c8922a";
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => [
      { id: "gettingStarted", icon: Zap, label: t("help.gettingStarted.title") },
      { id: "howTo", icon: Compass, label: t("help.howTo.title") },
      { id: "rules", icon: Lock, label: t("help.rules.title") },
      { id: "faq", icon: MessageCircleQuestion, label: t("help.faq.title") },
      { id: "glossary", icon: BookOpenText, label: t("help.glossary.title") },
      { id: "shortcuts", icon: Command, label: t("help.shortcuts.title") },
      { id: "whatsNew", icon: Gift, label: t("help.whatsNew.title") },
      { id: "contact", icon: Headphones, label: t("help.contact.title") },
    ],
    [t]
  );

  // TYRO Kuralları — bugün (2026-05-22) eklenen iş kuralları. Her kural
  // başlık + açıklama. Arama bu listede de gezer.
  const rulesItems = useMemo(
    () => [
      { id: "status", title: t("help.rules.statusTitle"), desc: t("help.rules.statusDesc") },
      { id: "lifecycle", title: t("help.rules.lifecycleTitle"), desc: t("help.rules.lifecycleDesc") },
      { id: "aksiyonRisk", title: t("help.rules.aksiyonRiskTitle"), desc: t("help.rules.aksiyonRiskDesc") },
      { id: "lale", title: t("help.rules.laleTitle"), desc: t("help.rules.laleDesc") },
      { id: "reviewPending", title: t("help.rules.reviewPendingTitle"), desc: t("help.rules.reviewPendingDesc") },
      { id: "lastLogin", title: t("help.rules.lastLoginTitle"), desc: t("help.rules.lastLoginDesc") },
      { id: "department", title: t("help.rules.departmentTitle"), desc: t("help.rules.departmentDesc") },
    ],
    [t]
  );

  const faqItems = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({ q: t(`help.faq.q${i + 1}`), a: t(`help.faq.a${i + 1}`) })),
    [t]
  );
  const glossaryItems = useMemo(
    () =>
      (["project", "action", "kpi", "okr", "bsc", "gantt", "wbs", "sso", "rbac", "source", "reviewDate", "tag"] as const).map(
        (key) => ({ term: t(`help.glossary.${key}`), def: t(`help.glossary.${key}Def`) })
      ),
    [t]
  );
  const howToSections = useMemo(
    () => [
      { title: t("help.howTo.projects.title"), items: [t("help.howTo.projects.create"), t("help.howTo.projects.edit"), t("help.howTo.projects.delete"), t("help.howTo.projects.hierarchy")] },
      { title: t("help.howTo.actions.title"), items: [t("help.howTo.actions.create"), t("help.howTo.actions.progress"), t("help.howTo.actions.status")] },
      { title: t("help.howTo.views.title"), items: [t("help.howTo.views.kokpit"), t("help.howTo.views.kpi"), t("help.howTo.views.gantt"), t("help.howTo.views.tMap"), t("help.howTo.views.tAlign")] },
      { title: t("help.howTo.reports.title"), items: [t("help.howTo.reports.wizard"), t("help.howTo.reports.export"), t("help.howTo.reports.filters"), t("help.howTo.reports.templates")] },
    ],
    [t]
  );

  /* ── Filter logic ──────────────────────────────────────────── */
  const q = query.toLowerCase().trim();
  const match = useCallback((text: string) => !q || text.toLowerCase().includes(q), [q]);

  const filteredFaq = useMemo(() => faqItems.filter((f) => match(f.q) || match(f.a)), [q, faqItems, match]);
  const filteredGlossary = useMemo(() => glossaryItems.filter((g) => match(g.term) || match(g.def)), [q, glossaryItems, match]);
  const filteredHowTo = useMemo(
    () => howToSections.map((s) => ({ ...s, items: s.items.filter((i) => match(i) || match(s.title)) })).filter((s) => s.items.length > 0),
    [q, howToSections, match]
  );
  const filteredRules = useMemo(
    () => rulesItems.filter((r) => match(r.title) || match(r.desc) || match(t("help.rules.title")) || match(t("help.rules.intro"))),
    [q, rulesItems, match, t]
  );
  const gettingStartedMatch = useMemo(
    () =>
      match(t("help.gettingStarted.title")) ||
      match(t("help.gettingStarted.welcomeDesc")) ||
      [1, 2, 3, 4].some((n) => match(t(`help.gettingStarted.step${n}Title`)) || match(t(`help.gettingStarted.step${n}Desc`))),
    [q, t, match]
  );
  const shortcutsMatch = useMemo(() => match(t("help.shortcuts.title")) || match(t("help.shortcuts.search")), [q, t, match]);
  const whatsNewMatch = useMemo(() => match(t("help.whatsNew.title")) || match(t("help.whatsNew.v1_0_0_desc")), [q, t, match]);
  const contactMatch = useMemo(
    () => match(t("help.contact.title")) || match(t("help.contact.description")),
    [q, t, match]
  );
  const hasResults = !q || gettingStartedMatch || filteredHowTo.length > 0 || filteredRules.length > 0 || filteredFaq.length > 0 || filteredGlossary.length > 0 || shortcutsMatch || whatsNewMatch || contactMatch;

  const scrollTo = useCallback((id: string) => {
    document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-5">

      {/* ── Hero Header ── */}
      <div className={clsx("rounded-2xl overflow-hidden", glass)}>
        <div className="relative overflow-hidden px-6 py-6" style={{ background: theme.bg }}>
          {/* Decorations */}
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${accent} 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }} />
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ backgroundColor: accent }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl opacity-10" style={{ backgroundColor: accent }} />

          <div className="relative z-10">
            <h1 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight" style={{ color: theme.textPrimary ?? "#fff" }}>
              {t("help.title")}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: theme.textSecondary ?? "rgba(255,255,255,0.7)" }}>
              {t("help.subtitle")}
            </p>

            {/* Search */}
            <div className="mt-4 max-w-lg">
              <Input
                value={query}
                onValueChange={setQuery}
                placeholder={t("help.searchPlaceholder")}
                startContent={<Search size={16} className="text-tyro-text-muted" />}
                isClearable
                onClear={() => setQuery("")}
                variant="bordered"
                size="sm"
                classNames={{
                  inputWrapper: "border-white/30 bg-white/90 dark:bg-white/15 backdrop-blur-xl shadow-sm",
                  input: "text-[13px] font-medium text-tyro-text-primary placeholder:text-tyro-text-muted",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick-access grid (separate from hero) ── */}
      {!q && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollTo(cat.id)}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold text-tyro-text-secondary",
                "hover:text-tyro-text-primary transition-all cursor-pointer group",
                glass, glassHover,
              )}
            >
              <cat.icon size={15} strokeWidth={1.8} className="shrink-0 group-hover:scale-110 transition-transform" style={{ color: accent }} />
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {!hasResults && (
        <div className="text-center py-16">
          <div className={clsx("w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4", glassInner)}>
            <Search size={28} strokeWidth={1.5} style={{ color: accent, opacity: 0.4 }} />
          </div>
          <p className="text-[14px] font-semibold text-tyro-text-muted">{t("help.noResults")}</p>
        </div>
      )}

      {/* ── Sections ── */}
      <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="show">

        {/* 1. Getting Started */}
        {(!q || gettingStartedMatch) && (
          <HelpCard id="gettingStarted" icon={Zap} title={t("help.gettingStarted.title")} defaultOpen={!q} forceOpen={q ? true : undefined}>
            <p className="text-[14px] font-bold text-tyro-text-primary mb-1">{t("help.gettingStarted.welcome")}</p>
            <p className="text-[13px] text-tyro-text-secondary mb-4">{t("help.gettingStarted.welcomeDesc")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StepCard step={1} icon={LogIn} title={t("help.gettingStarted.step1Title")} description={t("help.gettingStarted.step1Desc")} accent={accent} />
              <StepCard step={2} icon={LayoutDashboard} title={t("help.gettingStarted.step2Title")} description={t("help.gettingStarted.step2Desc")} accent={accent} />
              <StepCard step={3} icon={FolderPlus} title={t("help.gettingStarted.step3Title")} description={t("help.gettingStarted.step3Desc")} accent={accent} />
              <StepCard step={4} icon={TrendingUp} title={t("help.gettingStarted.step4Title")} description={t("help.gettingStarted.step4Desc")} accent={accent} />
            </div>
          </HelpCard>
        )}

        {/* 2. How-To */}
        {(!q || filteredHowTo.length > 0) && (
          <HelpCard id="howTo" icon={Compass} title={t("help.howTo.title")} count={filteredHowTo.reduce((sum, s) => sum + s.items.length, 0)} forceOpen={q ? true : undefined}>
            {(q ? filteredHowTo : howToSections).map((sec) => (
              <HowToSection key={sec.title} title={sec.title} items={sec.items} accent={accent} />
            ))}
          </HelpCard>
        )}

        {/* 3. TYRO Kuralları — bugün (2026-05-22) eklenen iş kuralları */}
        {(!q || filteredRules.length > 0) && (
          <HelpCard id="rules" icon={Lock} title={t("help.rules.title")} count={filteredRules.length} forceOpen={q ? true : undefined}>
            <p className="text-[12px] text-tyro-text-secondary mb-3 leading-relaxed">
              {t("help.rules.intro")}
            </p>
            <dl className="space-y-3">
              {(q ? filteredRules : rulesItems).map((rule) => (
                <div key={rule.id} className="border-l-2 pl-3 py-1" style={{ borderColor: accent }}>
                  <dt className="text-[13px] font-bold text-tyro-text-primary mb-0.5">{rule.title}</dt>
                  <dd className="text-[12px] text-tyro-text-secondary leading-relaxed">{rule.desc}</dd>
                </div>
              ))}
            </dl>
          </HelpCard>
        )}

        {/* 4. FAQ */}
        {(!q || filteredFaq.length > 0) && (
          <HelpCard id="faq" icon={MessageCircleQuestion} title={t("help.faq.title")} count={filteredFaq.length} forceOpen={q ? true : undefined}>
            {filteredFaq.map((f, i) => (
              <FaqItem key={i} question={f.q} answer={f.a} accent={accent} />
            ))}
          </HelpCard>
        )}

        {/* 4. Glossary */}
        {(!q || filteredGlossary.length > 0) && (
          <HelpCard id="glossary" icon={BookOpenText} title={t("help.glossary.title")} count={filteredGlossary.length} forceOpen={q ? true : undefined}>
            <div>
              {filteredGlossary.map((g) => (
                <GlossaryRow key={g.term} term={g.term} definition={g.def} />
              ))}
            </div>
          </HelpCard>
        )}

        {/* 5. Keyboard Shortcuts */}
        {(!q || shortcutsMatch) && (
          <HelpCard id="shortcuts" icon={Command} title={t("help.shortcuts.title")} forceOpen={q ? true : undefined}>
            <ShortcutRow keys={t("help.shortcuts.searchKey")} description={t("help.shortcuts.search")} />
          </HelpCard>
        )}

        {/* 6. What's New */}
        {(!q || whatsNewMatch) && (
          <HelpCard id="whatsNew" icon={Gift} title={t("help.whatsNew.title")} forceOpen={q ? true : undefined}>
            <div className="flex items-center gap-2.5 mb-3">
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm"
                style={{ backgroundColor: accent, boxShadow: `0 2px 8px ${accent}30` }}
              >
                {t("help.whatsNew.currentVersion")}
              </span>
              <span className="text-[11px] font-medium text-tyro-text-muted">{new Date().toLocaleDateString()}</span>
            </div>
            <h4 className="text-[13px] font-bold text-tyro-text-primary">{t("help.whatsNew.v1_0_0")}</h4>
            <p className="text-[12px] text-tyro-text-secondary mt-1 leading-relaxed">{t("help.whatsNew.v1_0_0_desc")}</p>
          </HelpCard>
        )}

        {/* 7. Contact */}
        {(!q || contactMatch) && (
          <HelpCard id="contact" icon={Headphones} title={t("help.contact.title")} forceOpen={q ? true : undefined}>
            <p className="text-[13px] text-tyro-text-secondary mb-4">{t("help.contact.description")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ContactCard label={t("help.contact.email")} value={t("help.contact.emailValue") || "—"} accent={accent} />
              <ContactCard label={t("help.contact.developer")} value={t("help.contact.developerValue") || "—"} accent={accent} />
              <ContactCard label={t("help.contact.organization")} value={t("help.contact.organizationValue") || "—"} accent={accent} />
            </div>
          </HelpCard>
        )}
      </motion.div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Check, Target, Users, ListChecks, ClipboardCheck } from "lucide-react";

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
}

const STEP_ICONS = [Target, Users, ListChecks, ClipboardCheck];
const STEP_COLORS = [
  { bg: "bg-tyro-navy", glow: "border-tyro-navy/25", text: "text-tyro-navy" },
  { bg: "bg-emerald-500", glow: "border-emerald-500/25", text: "text-emerald-600" },
  { bg: "bg-violet-500", glow: "border-violet-500/25", text: "text-violet-600" },
  { bg: "bg-tyro-gold", glow: "border-tyro-gold/25", text: "text-tyro-gold" },
];

export default function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        const Icon = STEP_ICONS[i];
        const color = STEP_COLORS[i];

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Circle + Label */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {/* Pulse ring on active */}
                {isActive && (
                  <motion.div
                    className={`absolute -inset-2 rounded-full border-2 ${color.glow}`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                    isCompleted
                      ? "bg-gradient-to-br from-tyro-gold to-tyro-gold-light text-white shadow-tyro-gold/20"
                      : isActive
                        ? `${color.bg} text-white shadow-lg`
                        : "border-2 border-tyro-border text-tyro-text-muted bg-tyro-surface"
                  }`}
                  initial={false}
                  animate={
                    isCompleted
                      ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] }
                      : isActive
                        ? { scale: [0.9, 1], y: [4, 0] }
                        : {}
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                </motion.div>
              </div>
              <motion.span
                className={`text-[11px] font-bold hidden sm:block whitespace-nowrap tracking-wide ${
                  isActive ? color.text : isCompleted ? "text-tyro-gold" : "text-tyro-text-muted"
                }`}
                initial={false}
                animate={isActive ? { y: [4, 0], opacity: [0, 1] } : {}}
                transition={{ delay: 0.1 }}
              >
                {label}
              </motion.span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 sm:mx-3 rounded-full bg-tyro-border/50 relative overflow-hidden mt-[-18px] sm:mt-[-20px]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-tyro-gold to-tyro-gold-light"
                  initial={false}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

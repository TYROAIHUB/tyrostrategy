import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Home } from "lucide-react";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

interface WizardSuccessProps {
  hedefName: string;
  aksiyonCount: number;
  onClose: () => void;
  onGoToDetail?: () => void;
}

function ConfettiParticle({ index }: { index: number }) {
  const style = useMemo(() => {
    const colors = ["#c8922a", "#1e3a5f", "#e0ad3e", "#2a4f7f", "#10b981"];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const duration = 2 + Math.random() * 2;
    const size = 6 + Math.random() * 6;
    const rotation = Math.random() * 720;

    return {
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: colors[index % colors.length],
      borderRadius: index % 3 === 0 ? "50%" : index % 3 === 1 ? "2px" : "0",
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      transform: `rotate(${rotation}deg)`,
    };
  }, [index]);

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        ...style,
        animation: `confetti-fall ${style.animationDuration} ease-in forwards`,
        animationDelay: style.animationDelay,
      }}
    />
  );
}

export default function WizardSuccess({ hedefName, aksiyonCount, onClose, onGoToDetail }: WizardSuccessProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-tyro-surface/95 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Confetti */}
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiParticle key={i} index={i} />
      ))}

      {/* Checkmark */}
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-tyro-gold to-tyro-gold-light flex items-center justify-center shadow-lg shadow-tyro-gold/25"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
      >
        <Check size={36} className="text-white" strokeWidth={3} />
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-xl font-extrabold text-tyro-text-primary mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {t("wizard.successTitle")}
      </motion.h2>

      {/* Subtitle */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <p className="text-sm font-semibold text-tyro-navy">"{hedefName}"</p>
        <p className="text-xs text-tyro-text-secondary mt-1">
          {t("wizard.successActions", { count: aksiyonCount })}
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex items-center gap-3 mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          variant="bordered"
          onPress={onClose}
          startContent={<Home size={14} />}
          className="rounded-button font-semibold"
        >
          {t("wizard.goToWorkspace")}
        </Button>
        {onGoToDetail && (
          <Button
            color="primary"
            onPress={onGoToDetail}
            endContent={<ArrowRight size={14} />}
            className="rounded-button font-semibold"
          >
            {t("wizard.goToDetail")}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}

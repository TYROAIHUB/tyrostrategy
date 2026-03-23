import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", onClick }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(30,58,95,0.12)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

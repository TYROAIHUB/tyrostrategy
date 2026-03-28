import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const iconBg = variant === "danger" ? "bg-red-50" : "bg-amber-50";
  const iconColor = variant === "danger" ? "text-red-500" : "text-amber-500";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      placement="center"
      backdrop="blur"
      classNames={{
        wrapper: "z-[80]",
        backdrop: "bg-black/40 backdrop-blur-sm z-[80]",
        base: "border border-tyro-border shadow-xl",
        header: "border-b-0 pb-0",
        footer: "border-t-0 pt-0",
      }}
      motionProps={{
        variants: {
          enter: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
          exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } },
        },
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-center gap-3 pt-8 px-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
            className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center`}
          >
            <AlertTriangle size={28} className={iconColor} />
          </motion.div>
          <h3 className="text-[16px] font-bold text-tyro-text-primary text-center">
            {title ?? t("confirm.confirm")}
          </h3>
        </ModalHeader>
        <ModalBody className="px-8 py-3">
          <p className="text-[13px] text-tyro-text-secondary text-center leading-relaxed">
            {message}
          </p>
        </ModalBody>
        <ModalFooter className="flex gap-3 px-8 pb-7 pt-4">
          <Button
            variant="bordered"
            onPress={onClose}
            className="flex-1 rounded-button border-tyro-border text-tyro-text-primary font-semibold"
          >
            {cancelLabel ?? t("confirm.cancel")}
          </Button>
          <Button
            color="danger"
            onPress={() => { onConfirm(); onClose(); }}
            className="flex-1 rounded-button font-semibold"
          >
            {confirmLabel ?? t("common.delete")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

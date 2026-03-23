import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "../shared/ConfirmDialog";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe("ConfirmDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    message: "Are you sure you want to delete this?",
  };

  it("renders message text when isOpen is true", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Are you sure you want to delete this?")).toBeInTheDocument();
  });

  it("renders default title from translation", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("confirm.confirm")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(<ConfirmDialog {...defaultProps} title="Custom Title" />);
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("cancel button calls onClose", () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    // Cancel button has the translated label
    const cancelBtn = screen.getByText("confirm.cancel");
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("confirm button calls onConfirm and onClose", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
    // Confirm button has the translated delete label
    const confirmBtn = screen.getByText("common.delete");
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders custom confirm and cancel labels", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, Delete"
        cancelLabel="No, Cancel"
      />
    );
    expect(screen.getByText("Yes, Delete")).toBeInTheDocument();
    expect(screen.getByText("No, Cancel")).toBeInTheDocument();
  });

  it("does not render content when isOpen is false", () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Are you sure you want to delete this?")).not.toBeInTheDocument();
  });
});

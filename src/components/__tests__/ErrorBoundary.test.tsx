import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "../shared/ErrorBoundary";

// Component that throws on render
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test explosion");
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error from React and ErrorBoundary during expected errors
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders error UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Bir hata oluştu")).toBeInTheDocument();
    expect(screen.getByText("Test explosion")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
  });

  it("resets error state when 'Tekrar Dene' is clicked", async () => {
    const user = userEvent.setup();

    // We need a component whose throw behavior can change
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) throw new Error("Temporary error");
      return <div>Recovered content</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Bir hata oluştu")).toBeInTheDocument();

    // Fix the error condition, then click retry
    shouldThrow = false;
    await user.click(screen.getByText("Tekrar Dene"));

    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });
});

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";

export function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef(value);
  useEffect(() => {
    current.current = value;
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    return () => {
      current.current = "";
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  async function copy() {
    try {
      await copyText(value);
      if (current.current !== value) return;
      setStatus("copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), 2200);
    } catch {
      if (current.current === value) setStatus("error");
    }
  }

  return (
    <div className="copy-wrapper">
      <motion.button
        type="button"
        className={`copy-button ${status === "copied" ? "is-copied" : ""}`}
        whileTap={{ scale: 0.96 }}
        onClick={copy}
        disabled={!value}
        aria-label={status === "copied" ? "Password copied" : "Copy password"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={status}
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {status === "copied" ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Copy size={17} aria-hidden="true" />
            )}
            {status === "copied" ? "Copied!" : "Copy"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <span className="sr-only" role="status">
        {status === "copied" ? "Password copied to clipboard." : ""}
      </span>
      {status === "error" && (
        <p className="copy-error" role="alert">
          Clipboard access was blocked. Select the password and copy it
          manually.
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CircleHelp,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import {
  CHARACTER_TYPES,
  DEFAULT_OPTIONS,
  generatePassword,
  getCharacterGroups,
  getPasswordStrength,
  type CharacterType,
  type PasswordOptions,
} from "@/lib/password";
import { CopyButton } from "./CopyButton";
import { PasswordText } from "./PasswordText";

const characterLabels: Record<
  CharacterType,
  { label: string; sample: string }
> = {
  uppercase: { label: "Uppercase", sample: "A–Z" },
  lowercase: { label: "Lowercase", sample: "a–z" },
  numbers: { label: "Numbers", sample: "0–9" },
  symbols: { label: "Symbols", sample: "!@#" },
};

type Snapshot = {
  options: PasswordOptions;
  password: string;
  generation: number;
};
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

function validateToolOptions(input: unknown): PasswordOptions {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Provide password settings.");
  const candidate = input as Record<string, unknown>;
  const keys = ["length", ...CHARACTER_TYPES, "excludeSimilar"];
  if (
    Object.keys(candidate).some((key) => !keys.includes(key)) ||
    keys.some((key) => !(key in candidate))
  )
    throw new Error("Provide exactly the six supported settings.");
  const options = candidate as PasswordOptions;
  getCharacterGroups(options);
  return { ...options };
}

export function Generator() {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    options: DEFAULT_OPTIONS,
    password: "",
    generation: 0,
  });
  const [error, setError] = useState("");
  const current = useRef(snapshot);
  const reduced = useReducedMotion();
  const { options, password, generation } = snapshot;
  const strength = getPasswordStrength(options);
  const selectedCount = CHARACTER_TYPES.filter((key) => options[key]).length;

  function regenerate(nextOptions = current.current.options) {
    try {
      const next = {
        options: nextOptions,
        password: generatePassword(nextOptions),
        generation: current.current.generation + 1,
      };
      current.current = next;
      setSnapshot(next);
      setError("");
    } catch (error) {
      const next = { ...current.current, password: "" };
      current.current = next;
      setSnapshot(next);
      setError(
        error instanceof Error
          ? error.message
          : "Could not generate a secure password. Please try again.",
      );
    }
  }

  useEffect(() => {
    regenerate();
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "configure_and_generate_password",
            title: "Configure and generate a password",
            description:
              "Update the visible generator settings and create a fresh password locally. Returns settings and strength only; never returns or copies the password.",
            inputSchema: {
              type: "object",
              properties: {
                length: { type: "integer", minimum: 6, maximum: 64 },
                uppercase: { type: "boolean" },
                lowercase: { type: "boolean" },
                numbers: { type: "boolean" },
                symbols: { type: "boolean" },
                excludeSimilar: { type: "boolean" },
              },
              required: ["length", ...CHARACTER_TYPES, "excludeSimilar"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input: unknown) {
              const nextOptions = validateToolOptions(input);
              const next = {
                options: nextOptions,
                password: generatePassword(nextOptions),
                generation: current.current.generation + 1,
              };
              flushSync(() => {
                current.current = next;
                setSnapshot(next);
                setError("");
              });
              return {
                generated: true,
                settings: nextOptions,
                strength: getPasswordStrength(nextOptions).label,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional browser integration; the visible UI remains available. */
      });
    } catch {
      /* Older browsers may expose an incompatible experimental API. */
    }
    return () => lifecycle.abort();
  }, []);

  function toggleCharacter(key: CharacterType) {
    if (options[key] && selectedCount === 1) return;
    regenerate({ ...options, [key]: !options[key] });
  }

  return (
    <main id="main-content" className="shell workspace">
      <Link href="/" className="back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to overview
      </Link>
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">THE PASSWORD WORKSPACE</div>
          <h1>Your next password.</h1>
          <p>Make it strong. Make it yours. Keep it private.</p>
        </div>
        <span className="local-badge">
          <LockKeyhole size={14} aria-hidden="true" />
          Generated on your device
        </span>
      </div>

      <div className="workspace-grid">
        <section className="result-column" aria-labelledby="result-title">
          <div className="output-card">
            <div className="flex items-center justify-between gap-3">
              <h2 id="result-title" className="overline">
                YOUR PASSWORD
              </h2>
              <span className="output-length font-mono">
                {options.length} CHARACTERS
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={generation}
                className={`password-output ${options.length > 32 ? "long-password" : ""}`}
                initial={{ opacity: 0, y: reduced ? 0 : 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.13 }}
                tabIndex={0}
                aria-label="Generated password"
              >
                {password ? (
                  <PasswordText value={password} />
                ) : (
                  <span className="password-pending">
                    {error
                      ? "Generation unavailable"
                      : "Creating your password…"}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="output-bottom">
              <span className="flex items-center gap-2">
                <LockKeyhole size={14} aria-hidden="true" />
                For your eyes only
              </span>
              <CopyButton value={password} />
            </div>
          </div>

          <div className="strength-card">
            <div className="strength-heading">
              <span>Password strength</span>
              <motion.span
                key={password ? strength.label : "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="strength-label"
                style={{ color: strength.color }}
              >
                <ShieldCheck size={16} aria-hidden="true" />
                {password ? strength.label : "Waiting"}
              </motion.span>
            </div>
            <div
              className="strength-meter"
              role="meter"
              aria-label="Password strength"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={password ? Math.round(strength.percent) : 0}
              aria-valuetext={
                password
                  ? `${strength.label}, ${strength.bits} bits of entropy`
                  : "No password generated"
              }
            >
              <motion.div
                animate={{
                  width: `${password ? strength.percent : 0}%`,
                  backgroundColor: strength.color,
                }}
                transition={{ duration: reduced ? 0 : 0.45 }}
              />
            </div>
            <div className="strength-scale" aria-hidden="true">
              {["Weak", "Medium", "Strong", "Ultimate"].map((label) => (
                <span
                  key={label}
                  className={
                    label === strength.label && password ? "active" : ""
                  }
                >
                  {label}
                </span>
              ))}
            </div>
            <details className="strength-details">
              <summary>
                <CircleHelp size={14} aria-hidden="true" />
                {password
                  ? `${strength.bits} bits of randomness`
                  : "How strength is estimated"}
              </summary>
              <p>
                Estimated from the number of possible passwords with these
                settings, including the requirement to use every selected
                character type. This rating describes randomness, not a
                guarantee against every attack. Use a unique password for each
                account.
              </p>
            </details>
          </div>

          <motion.button
            type="button"
            className="button-primary generate-button"
            whileTap={{ scale: 0.985 }}
            onClick={() => regenerate()}
          >
            <motion.span
              animate={{ rotate: generation * 180 }}
              transition={{ duration: reduced ? 0 : 0.4 }}
            >
              <RefreshCw size={18} aria-hidden="true" />
            </motion.span>
            Generate new password
          </motion.button>
          <p className="regenerate-hint">
            A fresh password with the same preferences.
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {password
              ? `New ${options.length}-character password generated. ${strength.label} strength.`
              : ""}
          </p>
          {error && (
            <div role="alert" className="generator-error">
              {error}
            </div>
          )}
        </section>

        <section className="settings-card" aria-labelledby="settings-title">
          <div className="settings-heading">
            <SlidersHorizontal size={18} aria-hidden="true" />
            <h2 id="settings-title">Make it your own</h2>
            <span className="font-mono">01—04</span>
          </div>
          <div className="length-control">
            <div className="flex items-center justify-between">
              <label htmlFor="password-length">Password length</label>
              <output htmlFor="password-length" className="length-value">
                {options.length}
                <span>chars</span>
              </output>
            </div>
            <input
              id="password-length"
              className="length-slider"
              type="range"
              min={6}
              max={64}
              step={1}
              value={options.length}
              onChange={(event) =>
                regenerate({ ...options, length: Number(event.target.value) })
              }
              style={
                {
                  "--slider-fill": `${((options.length - 6) / 58) * 100}%`,
                } as CSSProperties
              }
              aria-valuetext={`${options.length} characters`}
            />
            <div className="range-labels">
              <span>6</span>
              <span>64</span>
            </div>
          </div>
          <fieldset className="character-fieldset">
            <legend>Characters to include</legend>
            <div className="character-grid">
              {CHARACTER_TYPES.map((key) => {
                const onlySelected = selectedCount === 1 && options[key];
                return (
                  <label
                    key={key}
                    className={`character-option ${options[key] ? "selected" : ""} ${onlySelected ? "last-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={options[key]}
                      disabled={onlySelected}
                      onChange={() => toggleCharacter(key)}
                      aria-describedby={
                        onlySelected ? "character-help" : undefined
                      }
                    />
                    <span className="character-sample">
                      {characterLabels[key].sample}
                    </span>
                    <span className="character-name">
                      {characterLabels[key].label}
                    </span>
                    <span className="checkbox-indicator" aria-hidden="true">
                      {options[key] && (
                        <motion.span
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </motion.span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <p id="character-help" className="control-help">
              Keep at least one character type selected.
            </p>
          </fieldset>
          <label className="similar-control">
            <div>
              <span className="similar-label">Exclude similar characters</span>
              <span className="control-help">
                Skip look-alikes such as{" "}
                <span className="font-mono">I, l, 1, O, 0</span>
              </span>
            </div>
            <span className="switch-control">
              <input
                type="checkbox"
                role="switch"
                checked={options.excludeSimilar}
                onChange={(event) =>
                  regenerate({
                    ...options,
                    excludeSimilar: event.target.checked,
                  })
                }
              />
              <span className="switch-track" aria-hidden="true">
                <motion.span
                  animate={{ x: options.excludeSimilar ? 18 : 0 }}
                  transition={{ type: "spring", stiffness: 550, damping: 35 }}
                />
              </span>
            </span>
          </label>
          <div className="settings-footnote">
            <Check size={14} aria-hidden="true" />
            Changes create a new password automatically.
          </div>
        </section>
      </div>
      <aside className="workspace-note">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <h2>Created here. Kept with you.</h2>
          <p>
            Passwords stay in this tab until you copy them. Save yours in a
            trusted password manager before leaving. Your device may retain
            copied text in its clipboard history.
          </p>
        </div>
        <span className="note-stamp font-mono">
          LOCAL
          <br />
          BY DESIGN
        </span>
      </aside>
    </main>
  );
}

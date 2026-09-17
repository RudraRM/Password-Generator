"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Fingerprint,
  GlobeLock,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  DEFAULT_OPTIONS,
  generatePassword,
  getPasswordStrength,
} from "@/lib/password";
import { PasswordText } from "./PasswordText";
import { CopyButton } from "./CopyButton";

const features = [
  {
    number: "01",
    icon: GlobeLock,
    title: "Your password stays yours.",
    text: "Generated in your browser. Never sent to a server, saved to a database, or added to a history.",
    tag: "Zero password tracking",
  },
  {
    number: "02",
    icon: Fingerprint,
    title: "Random. For a reason.",
    text: "Real cryptographic randomness, straight from your device. No predictable patterns or recycled passwords.",
    tag: "Powered by Web Crypto",
  },
  {
    number: "03",
    icon: SlidersHorizontal,
    title: "Made to fit the fine print.",
    text: "Choose your length and characters. Skip look-alikes. Meet the rules without compromising on strength.",
    tag: "Your rules, your password",
  },
];

export function Landing() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const reduced = useReducedMotion();
  const strength = getPasswordStrength(DEFAULT_OPTIONS);
  function regenerate() {
    try {
      setPassword(generatePassword(DEFAULT_OPTIONS));
      setGeneration((count) => count + 1);
      setError("");
    } catch (error) {
      setPassword("");
      setError(
        error instanceof Error
          ? error.message
          : "Could not generate a secure password.",
      );
    }
  }
  useEffect(() => {
    regenerate();
  }, []);
  return (
    <main id="main-content">
      <section className="shell hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" /> SMALL TOOL. STRONGER SECURITY.
          </div>
          <h1 id="hero-title">
            Good passwords.
            <br />
            <span>Zero guesswork.</span>
          </h1>
          <p className="hero-description">
            A stronger password is a fresh start.
            <br className="desktop-break" /> Make yours in seconds, right in
            your browser.
          </p>
          <motion.div
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <Link href="/generate/" className="button-primary">
              Create your password <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </motion.div>
          <div className="hero-assurances">
            <span>
              <Check size={14} />
              Always free
            </span>
            <span>
              <Check size={14} />
              No sign-up
            </span>
            <span>
              <Check size={14} />
              100% local
            </span>
          </div>
        </div>
        <motion.div
          className="specimen"
          initial={{ opacity: 0, y: reduced ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6 }}
        >
          <div className="specimen-caption">
            <span className="font-mono">A BETTER KIND OF RANDOM</span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </div>
          <div className="specimen-card">
            <div className="flex items-center justify-between gap-3">
              <span className="overline">YOUR NEXT PASSWORD</span>
              <ShieldCheck size={19} aria-hidden="true" />
            </div>
            <motion.div
              key={generation}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
              className="specimen-password"
              aria-label="Generated password"
              tabIndex={0}
            >
              {password ? (
                <PasswordText value={password} />
              ) : (
                <span className="password-pending">
                  {error ? "Unavailable" : "Generating…"}
                </span>
              )}
            </motion.div>
            <div className="specimen-strength">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} aria-hidden="true" />
                {password ? strength.label : "Ready when you are"}
              </span>
              <span>{DEFAULT_OPTIONS.length} characters</span>
            </div>
            <div className="specimen-meter" aria-hidden="true">
              <span />
            </div>
            <div className="specimen-actions">
              <motion.button
                className="button-quiet"
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={regenerate}
              >
                <motion.span
                  animate={{ rotate: generation * 180 }}
                  transition={{ duration: reduced ? 0 : 0.4 }}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                </motion.span>
                Try another
              </motion.button>
              <CopyButton value={password} />
            </div>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-200">
                {error}
              </p>
            )}
          </div>
          <div className="specimen-bottom">
            <span className="specimen-bracket" aria-hidden="true">
              ↳
            </span>
            <span>A fresh one. Every single time.</span>
            <span className="font-mono">20 / 64</span>
          </div>
        </motion.div>
      </section>

      <section
        className="shell features-section"
        id="features"
        aria-labelledby="features-title"
      >
        <div className="section-heading">
          <h2 id="features-title">Less friction. More peace of mind.</h2>
          <span className="eyebrow">THE BASICS, DONE RIGHT</span>
        </div>
        <motion.div
          className="feature-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: reduced ? 0 : 0.09 } },
          }}
        >
          {features.map((feature) => (
            <motion.article
              className="feature-card"
              key={feature.number}
              variants={{
                hidden: { opacity: 0, y: reduced ? 0 : 14 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex items-center justify-between">
                <span className="feature-icon">
                  <feature.icon
                    size={21}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                </span>
                <span className="feature-number">/{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <div className="feature-tag">
                <span aria-hidden="true">—</span>
                {feature.tag}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>
      <section className="shell privacy-note" aria-label="Privacy details">
        <ShieldCheck size={19} aria-hidden="true" />
        <p>
          No accounts. No analytics. No saved passwords.{" "}
          <span>
            Just a useful little tool you can trust with the next step.
          </span>
        </p>
      </section>
    </main>
  );
}

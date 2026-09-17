"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Github } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const inGenerator = pathname.startsWith("/generate");
  return (
    <header className="site-header">
      <div className="shell flex h-full items-center justify-between gap-5">
        <Link href="/" className="brand" aria-label="Keyform home">
          <span className="brand-mark" aria-hidden="true">
            k
          </span>
          keyform<span className="brand-period">.</span>
        </Link>
        <nav aria-label="Main navigation" className="nav-tabs">
          {[
            { href: "/", label: "Overview", active: !inGenerator },
            { href: "/generate/", label: "Generator", active: inGenerator },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-tab"
              aria-current={item.active ? "page" : undefined}
            >
              {item.active && (
                <motion.span
                  layoutId="navigation-indicator"
                  className="nav-active"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          ))}
        </nav>
        <a
          className="source-link"
          href="https://github.com/RudraRM/Password-Generator"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github size={17} aria-hidden="true" />
          <span>Source code</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}

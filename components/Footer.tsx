import { LockKeyhole } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer shell">
      <span className="flex items-center gap-2">
        <LockKeyhole size={14} aria-hidden="true" /> A little more peace of
        mind.
      </span>
      <span>Made for your browser. Built for your privacy.</span>
      <span className="font-mono">KEYFORM / 01</span>
    </footer>
  );
}

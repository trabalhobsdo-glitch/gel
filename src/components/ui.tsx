import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export const Container = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
);

export const Logo = ({ className = "h-11" }: { className?: string }) => (
  <Link to="/" className="flex items-center" aria-label="Orbigel — início">
    <img src="/images/logo.webp" alt="Orbigel" width={900} height={640} className={`${className} w-auto`} />
  </Link>
);

export const LockIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const CheckIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const base =
  "inline-flex items-center justify-center rounded-md px-6 py-3.5 text-center font-bold transition active:scale-[.99]";
const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  light: "bg-brand/10 text-brand-dark hover:bg-brand/20",
};

export function ButtonLink({
  to, href, variant = "primary", children, className = "",
}: { to?: string; href?: string; variant?: keyof typeof variants; children: ReactNode; className?: string }) {
  const cls = `${base} ${variants[variant]} ${className}`;
  return to ? <Link to={to} className={cls}>{children}</Link> : <a href={href} className={cls}>{children}</a>;
}

export const Heading = ({ title, sub }: { title: string; sub?: string }) => (
  <div>
    <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
    {sub && <p className="mt-1 text-sm text-ink/65">{sub}</p>}
  </div>
);

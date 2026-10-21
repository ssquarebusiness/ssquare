import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/** Clean Sage: charcoal primary, soft sage accent, quiet outlines. */
const variants = {
  primary: "bg-ink text-white hover:bg-ink-hover",
  accent: "bg-brand-100 text-ink hover:bg-brand-200",
  secondary: "bg-soft text-ink hover:bg-zinc-200",
  outline: "border border-line bg-white text-ink hover:bg-soft",
  ghost: "text-ink-2 hover:bg-soft",
  danger: "bg-booked-ink text-white hover:bg-[#9c4a46]",
  dangerOutline: "border border-booked bg-white text-booked-ink hover:bg-booked-soft",
  whatsapp: "border border-[#cde9d8] bg-[#eef8f2] text-[#1d7a46] hover:bg-[#e2f3e9]",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-[15px] rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl",
  xl: "h-14 px-6 text-lg rounded-2xl",
  icon: "h-10 w-10 rounded-full",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Class names for a button — also used to style <a>/<Link> as buttons. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, size, cn(block && "w-full", className))}
      {...rest}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

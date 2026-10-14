import { cn } from "@/lib/utils";

export function Empty({ icon, title, children, className }: { icon?: React.ReactNode; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center", className)}>
      {icon && <div className="text-zinc-400">{icon}</div>}
      <p className="font-semibold text-zinc-700">{title}</p>
      {children && <div className="text-sm text-zinc-500">{children}</div>}
    </div>
  );
}

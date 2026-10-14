import { requireStaff } from "@/lib/auth/server";
import { QueryProvider } from "@/components/providers/query-provider";
import { StaffProvider } from "@/features/staff/context";
import { RealtimeSync } from "@/features/common/realtime-sync";
import { AppShell } from "@/components/staff/app-shell";

export default async function StaffAppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  return (
    <QueryProvider userId={profile.id}>
      <StaffProvider profile={profile}>
        <RealtimeSync />
        <AppShell>{children}</AppShell>
      </StaffProvider>
    </QueryProvider>
  );
}

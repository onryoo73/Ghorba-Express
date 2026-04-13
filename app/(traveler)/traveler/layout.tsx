import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/guards/role-guard";

export default function TravelerLayout({
  children
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <AppShell>
      <RoleGuard allowRoles={["traveler", "both"]}>{children}</RoleGuard>
    </AppShell>
  );
}

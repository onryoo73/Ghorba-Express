import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/guards/role-guard";

export default function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <AppShell>
      <RoleGuard adminOnly>{children}</RoleGuard>
    </AppShell>
  );
}

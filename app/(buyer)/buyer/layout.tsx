import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/guards/role-guard";

export default function BuyerLayout({
  children
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <AppShell>
      <RoleGuard allowRoles={["buyer", "both"]}>{children}</RoleGuard>
    </AppShell>
  );
}

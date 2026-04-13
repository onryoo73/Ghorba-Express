"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export default function AdminUsersPage(): JSX.Element {
  const [users, setUsers] = useState<Profile[]>([]);

  const loadUsers = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,role,phone_e164,phone_verified,is_admin,kyc_status")
      .order("created_at", { ascending: false });
    setUsers((data as Profile[] | null) ?? []);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleKyc = async (profile: Profile) => {
    if (!supabase) return;
    await supabase
      .from("profiles")
      .update({ kyc_status: profile.kyc_status === "approved" ? "pending" : "approved" })
      .eq("id", profile.id);
    await loadUsers();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard - Users</h1>
      <p className="text-sm text-muted">Review phone verification and KYC status.</p>
      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{user.full_name ?? "Unnamed user"}</p>
              <p className="text-xs uppercase text-muted">{user.role}</p>
            </div>
            <p className="text-xs text-muted">{user.phone_e164 ?? "No phone"}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs">
                {user.phone_verified ? "Phone verified" : "Phone not verified"} - KYC: {user.kyc_status}
              </p>
              <Button variant="secondary" onClick={() => void toggleKyc(user)}>
                Toggle KYC
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

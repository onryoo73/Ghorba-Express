"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Star, 
  Package, 
  CheckCircle,
  Save,
  Loader2,
  Shield,
  Briefcase,
  Lock,
  LogOut,
  Edit3
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

interface ProfileData {
  full_name: string;
  phone: string;
  city: string;
  role: UserRole;
  avatar_url: string | null;
}

export default function ProfilePage(): JSX.Element {
  const { user, profile, signOut } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    phone: "",
    city: "",
    role: "buyer",
    avatar_url: null
  });

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        role: profile.role || "buyer",
        avatar_url: profile.avatar_url || null
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage(null);
    
try {
      if (!supabase) throw new Error("Supabase not configured");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          city: formData.city,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setEditMode(false);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile" });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !supabase) return;
    
    setLoading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: "success", text: "Avatar updated!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to upload avatar" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "buyer": return "bg-blue-500/20 text-blue-400";
      case "traveler": return "bg-emerald-500/20 text-emerald-400";
      case "both": return "bg-purple-500/20 text-purple-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "buyer": return "Buyer";
      case "traveler": return "Traveler";
      case "both": return "Buyer + Traveler";
      default: return role;
    }
  };

  return (
    <AppShell>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted">Manage your account and preferences</p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success" ? "bg-emerald/20 text-emerald" : "bg-rose-400/20 text-rose-300"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Quick Stats */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <Card className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-electricBlue to-purple-600 mx-auto">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt={formData.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                      {getInitials(formData.full_name || user?.email || "U")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-electricBlue rounded-full hover:bg-electricBlue/80 transition-colors"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </div>
              
              <h2 className="text-xl font-semibold mb-1">{formData.full_name || "User"}</h2>
              <p className="text-sm text-muted mb-3">{user?.email}</p>
              
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(formData.role)}`}>
                {getRoleLabel(formData.role)}
              </span>
            </Card>

            {/* Stats Card */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber" />
                Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber fill-current" />
                    <span className="font-medium">{profile?.rating || 5.0}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Deliveries</span>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-electricBlue" />
                    <span className="font-medium">{profile?.total_deliveries || 0}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Verified</span>
                  <div className="flex items-center gap-1">
                    {profile?.verified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald" />
                        <span className="text-emerald text-sm">Yes</span>
                      </>
                    ) : (
                      <span className="text-muted text-sm">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Info Card */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-electricBlue" />
                  Personal Information
                </h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover transition-colors text-sm"
                >
                  {editMode ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  {editMode ? "Done" : "Edit"}
                </button>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm text-muted mb-2">Full Name</label>
                  {editMode ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                      <User className="h-4 w-4 text-muted" />
                      <span>{formData.full_name || "Not set"}</span>
                    </div>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm text-muted mb-2">Email</label>
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-xl opacity-50">
                    <Mail className="h-4 w-4 text-muted" />
                    <span>{user?.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm text-muted mb-2">Phone Number</label>
                  {editMode ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+216 XX XXX XXX"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                      <Phone className="h-4 w-4 text-muted" />
                      <span>{formData.phone || "Not set"}</span>
                    </div>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm text-muted mb-2">City</label>
                  {editMode ? (
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Your city"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                      <MapPin className="h-4 w-4 text-muted" />
                      <span>{formData.city || "Not set"}</span>
                    </div>
                  )}
                </div>

                {/* Role Selection */}
                {editMode && (
                  <div>
                    <label className="block text-sm text-muted mb-2">Role</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["buyer", "traveler", "both"] as UserRole[]).map((role) => (
                        <button
                          key={role}
                          onClick={() => setFormData(prev => ({ ...prev, role }))}
                          className={`p-3 rounded-xl border transition-all ${
                            formData.role === role
                              ? "border-electricBlue bg-electricBlue/10"
                              : "border-border hover:border-surface-hover"
                          }`}
                        >
                          <Briefcase className={`h-5 w-5 mx-auto mb-2 ${
                            formData.role === role ? "text-electricBlue" : "text-muted"
                          }`} />
                          <span className="text-sm">{getRoleLabel(role)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {editMode && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-electricBlue gap-2"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setEditMode(false)}
                      variant="secondary"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Security Card */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-electricBlue" />
                Security
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-surface rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-electricBlue/20 rounded-lg">
                      <Lock className="h-4 w-4 text-electricBlue" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted">Update your account password</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-4 bg-rose-400/10 rounded-xl hover:bg-rose-400/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-400/20 rounded-lg">
                      <LogOut className="h-4 w-4 text-rose-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-rose-300">Sign Out</p>
                      <p className="text-sm text-rose-300/70">Log out from all devices</p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal 
          onClose={() => setShowPasswordModal(false)} 
        />
      )}
    </AppShell>
  );
}

// Password Change Modal Component
function PasswordChangeModal({ onClose }: { onClose: () => void }): JSX.Element {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Change Password</h3>
          
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-emerald mx-auto mb-3" />
              <p className="text-emerald">Password changed successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-400/20 text-rose-300 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm text-muted mb-2">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted mb-2">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-electricBlue gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update Password
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

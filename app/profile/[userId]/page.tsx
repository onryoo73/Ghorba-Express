"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Star, 
  Package, 
  MapPin, 
  Calendar,
  UserPlus,
  UserCheck,
  MessageCircle,
  Shield,
  Award
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/lib/use-auth-session";
import type { Post } from "@/lib/supabase/database.types";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role: "buyer" | "traveler" | "both";
  rating: number;
  total_deliveries: number;
  verified: boolean;
  created_at: string;
  bio: string | null;
  followers_count: number;
  following_count: number;
}

export default function UserProfilePage(): JSX.Element {
  const { userId } = useParams();
  const router = useRouter();
  const { user } = useAuthSession();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    
    const fetchProfile = async () => {
      if (!supabase) return;
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as UserProfile);
      }
      
      // Fetch user's posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      if (postsData) {
        setPosts(postsData as Post[]);
      }
      
      // Check if current user follows this profile
      if (user && !isOwnProfile) {
        const { data: followData } = await supabase
          .from("followers")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .single();
        
        setIsFollowing(!!followData);
      }
      
      setLoading(false);
    };
    
    fetchProfile();
  }, [userId, user, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || !supabase || isOwnProfile) return;
    
    if (isFollowing) {
      // Unfollow
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
      
      setIsFollowing(false);
      setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);
    } else {
      // Follow
      await supabase.from("followers").insert({
        follower_id: user.id,
        following_id: userId
      });
      
      setIsFollowing(true);
      setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "traveler":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald/20 text-emerald text-xs">
            <Award className="h-3 w-3" />
            Traveler
          </span>
        );
      case "buyer":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300 text-xs">
            <Package className="h-3 w-3" />
            Buyer
          </span>
        );
      case "both":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-electricBlue/20 text-electricBlue text-xs">
            <Shield className="h-3 w-3" />
            Buyer & Traveler
          </span>
        );
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electricBlue" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-muted">User not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          {/* Cover Image / Header Background */}
          <div className="h-32 bg-gradient-to-r from-electricBlue/20 to-emerald/20" />
          
          <div className="px-6 pb-6">
            {/* Avatar & Stats Row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-white/10">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10 text-3xl">
                      {profile.full_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                {profile.verified && (
                  <div className="absolute bottom-0 right-0 bg-electricBlue rounded-full p-1">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-xl font-bold">{posts.length}</p>
                  <p className="text-xs text-muted">Posts</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{profile.followers_count || 0}</p>
                  <p className="text-xs text-muted">Followers</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{profile.following_count || 0}</p>
                  <p className="text-xs text-muted">Following</p>
                </div>
              </div>
            </div>

            {/* Name & Role */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {profile.full_name || "Anonymous"}
                {getRoleBadge(profile.role)}
              </h1>
              
              {profile.city && (
                <p className="text-muted flex items-center gap-1 text-sm mt-1">
                  <MapPin className="h-4 w-4" />
                  {profile.city}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm mb-4">{profile.bio}</p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm mb-4">
              <div className="flex items-center gap-1 text-amber">
                <Star className="h-4 w-4 fill-amber" />
                <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                <span className="text-muted">rating</span>
              </div>
              <div className="flex items-center gap-1 text-emerald">
                <Package className="h-4 w-4" />
                <span className="font-semibold">{profile.total_deliveries}</span>
                <span className="text-muted">deliveries</span>
              </div>
              <div className="flex items-center gap-1 text-muted">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isOwnProfile ? (
                <>
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "secondary" : "primary"}
                    className="flex-1"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/messages?thread=${userId}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => router.push("/dashboard")} className="flex-1">
                  Go to Dashboard
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "posts"
                ? "border-electricBlue text-electricBlue"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "about"
                ? "border-electricBlue text-electricBlue"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            About
          </button>
        </div>

        {/* Content */}
        {activeTab === "posts" ? (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted">No posts yet</p>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || ""}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{profile.full_name?.charAt(0) || "?"}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{profile.full_name}</p>
                      <p className="text-xs text-muted mb-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm">{post.content}</p>
                      {post.images && post.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {post.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="Post image"
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">About</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted">Role</span>
                <span className="capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted">Location</span>
                <span>{profile.city || "Not set"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted">Rating</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber text-amber" />
                  {profile.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted">Deliveries</span>
                <span>{profile.total_deliveries}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-muted">Member Since</span>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted">Verified</span>
                <span>{profile.verified ? "Yes" : "No"}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

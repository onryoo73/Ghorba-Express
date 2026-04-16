"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Post, PostLike, PostComment, PostBookmark, Insertable } from "@/lib/supabase/database.types";

// Fetch all posts with author info
export function usePosts(options?: {
  type?: "request" | "trip";
  status?: "active" | "completed" | "cancelled";
  origin?: string;
  destination?: string;
  limit?: number;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ref to store options to prevent re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchPosts = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const opts = optionsRef.current;
      let query = supabase
        .from("posts")
        .select("*, author:profiles(full_name, rating, verified)")
        .order("created_at", { ascending: false });

      if (opts?.type) {
        query = query.eq("type", opts.type);
      }
      if (opts?.status) {
        query = query.eq("status", opts.status);
      }
      if (opts?.origin) {
        query = query.eq("origin", opts.origin);
      }
      if (opts?.destination) {
        query = query.eq("destination", opts.destination);
      }
      if (opts?.limit) {
        query = query.limit(opts.limit);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setPosts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch posts"));
    } finally {
      setLoading(false);
    }
  }, []); // No deps - uses ref

  // Initial fetch when options change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, options?.origin, options?.destination, options?.type, options?.status]); // Re-fetch when filters change

  // Subscribe to real-time changes - completely separate from fetch
  useEffect(() => {
    if (!supabase) return;

    const subscription = supabase
      .channel("posts_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          // Only add new posts, don't re-fetch
          setPosts((prev) => [payload.new as Post, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only subscribe once

  return { posts, loading, error, refresh: fetchPosts };
}

// Create a new post
export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPost = async (post: Insertable<"posts">) => {
    if (!supabase) {
      throw new Error("Supabase not configured");
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("posts")
        .insert(post)
        .select()
        .single();

      if (err) throw err;
      return data as Post;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create post"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading, error };
}

// Like/unlike a post
export function usePostLike(postId: string, userId: string | undefined) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user has liked this post
  useEffect(() => {
    if (!supabase || !userId) return;

    const checkLike = async () => {
      if (!supabase || !userId) return;
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      setLiked(!!data);
    };

    checkLike();
  }, [postId, userId]);

  const toggleLike = async () => {
    if (!supabase || !userId) return;

    setLoading(true);
    try {
      if (liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId });
      }
      setLiked((prev) => !prev);
    } finally {
      setLoading(false);
    }
  };

  return { liked, toggleLike, loading };
}

// Comments for a post
export function usePostComments(postId: string) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const postIdRef = useRef(postId);
  postIdRef.current = postId;

  const fetchComments = useCallback(async () => {
    if (!supabase || !postIdRef.current) return;

    const { data } = await supabase
      .from("post_comments")
      .select("*, author:profiles(full_name, rating, verified)")
      .eq("post_id", postIdRef.current)
      .order("created_at", { ascending: true });

    setComments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchComments();
  }, []); // Only fetch on mount

  const addComment = async (content: string, authorId: string, parentId?: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        author_id: authorId,
        content,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchComments();
    return data;
  };

  return { comments, loading, addComment, refresh: fetchComments };
}

// Bookmark a post
export function usePostBookmark(postId: string, userId: string | undefined) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase || !userId) return;

    const checkBookmark = async () => {
      if (!supabase || !userId) return;
      const { data } = await supabase
        .from("post_bookmarks")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      setBookmarked(!!data);
    };

    checkBookmark();
  }, [postId, userId]);

  const toggleBookmark = async () => {
    if (!supabase || !userId) return;

    setLoading(true);
    try {
      if (bookmarked) {
        await supabase
          .from("post_bookmarks")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("post_bookmarks")
          .insert({ post_id: postId, user_id: userId });
      }
      setBookmarked(!bookmarked);
    } finally {
      setLoading(false);
    }
  };

  return { bookmarked, toggleBookmark, loading };
}

// User's bookmarks
export function useUserBookmarks(userId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const fetchBookmarks = useCallback(async () => {
    if (!supabase || !userIdRef.current) return;

    const { data } = await supabase
      .from("post_bookmarks")
      .select("post_id")
      .eq("user_id", userIdRef.current);

    if (data && data.length > 0) {
      const { data: postsData } = await supabase
        .from("posts")
        .select("*, author:profiles(full_name, rating, verified)")
        .in("id", data.map((b) => b.post_id));

      setBookmarks(postsData || []);
    } else {
      setBookmarks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, []); // Only fetch on mount

  return { bookmarks, loading, refresh: fetchBookmarks };
}

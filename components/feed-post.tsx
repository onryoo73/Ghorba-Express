"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Calendar,
  Package,
  ShoppingBag,
  Plane,
  MoreHorizontal,
  Send,
  Star,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePostLike, usePostBookmark, usePostComments } from "@/lib/hooks/use-posts";
import { useAuthSession } from "@/lib/use-auth-session";
import { OfferModal } from "@/components/offer-modal";
import type { Post } from "@/lib/supabase/database.types";

interface FeedPostProps {
  post: Post;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now.getTime() - postDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return postDate.toLocaleDateString();
}

export function FeedPost({ post }: FeedPostProps): JSX.Element {
  const { user } = useAuthSession();
  const userId = user?.id;
  
  const { liked, toggleLike, loading: likeLoading } = usePostLike(post.id, userId);
  const { bookmarked, toggleBookmark, loading: bookmarkLoading } = usePostBookmark(post.id, userId);
  const { comments, addComment } = usePostComments(post.id);
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const isRequest = post.type === "request";
  const isOwnPost = post.author_id === userId;
  
  const author = post.author as { full_name: string; rating: number; verified: boolean } | undefined;
  const authorName = author?.full_name || "Unknown";
  const authorRating = author?.rating || 5;
  const authorVerified = author?.verified || false;
  
  const timestamp = formatTimeAgo(post.created_at);

  const handleAddComment = async () => {
    if (!userId || !commentText.trim()) return;
    
    setSubmitting(true);
    try {
      await addComment(commentText.trim(), userId);
      setCommentText("");
    } finally {
      setSubmitting(false);
    }
  };

  // Format values for display
  const from = post.origin;
  const to = post.destination;
  const date = post.departure_date ? new Date(post.departure_date).toLocaleDateString() : null;
  const reward = post.reward_tnd?.toString();
  const price = post.product_price_tnd?.toString();
  const kg = post.weight_available_kg;
  const images = post.images || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href={`/profile/${post.author_id}`}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-electricBlue/30 to-emerald/30 flex items-center justify-center text-lg font-semibold border border-white/10 hover:ring-2 hover:ring-electricBlue/50 transition-all"
            >
              {authorName.charAt(0)}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  href={`/profile/${post.author_id}`}
                  className="font-semibold hover:text-electricBlue transition-colors"
                >
                  {authorName}
                </Link>
                {authorVerified && (
                  <ShieldCheck className="h-4 w-4 text-emerald" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{timestamp}</span>
                <span>•</span>
                <Badge
                  className={`text-xs px-1.5 py-0 ${
                    isRequest
                      ? "bg-rose-400/20 text-rose-300 border-rose-400/30"
                      : "bg-emerald/20 text-emerald border-emerald/30"
                  }`}
                >
                  {isRequest ? (
                    <><ShoppingBag className="h-3 w-3 mr-1" /> Request</>
                  ) : (
                    <><Plane className="h-3 w-3 mr-1" /> Trip</>
                  )}
                </Badge>
              </div>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <MoreHorizontal className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed">{post.content}</p>
        </div>

        {/* Route & Details Card */}
        <div className="px-4 pb-3">
          <div className="p-3 rounded-xl bg-white/5 space-y-2">
            {(from || to) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-electricBlue" />
                <span className="font-medium">{from}</span>
                <span className="text-muted">→</span>
                <span className="font-medium text-emerald">{to}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {date && (
                <Badge className="text-xs bg-white/10">
                  <Calendar className="h-3 w-3 mr-1" />
                  {date}
                </Badge>
              )}
              {reward && (
                <Badge
                  className="text-xs bg-emerald/20 text-emerald border-emerald/30"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Reward: {reward} TND
                </Badge>
              )}
              {price && (
                <Badge
                  className="text-xs bg-rose-400/20 text-rose-300 border-rose-400/30"
                >
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  Item: {price} TND
                </Badge>
              )}
              {kg !== undefined && kg !== null && (
                <Badge
                  className="text-xs bg-electricBlue/20 text-electricBlue border-electricBlue/30"
                >
                  <Package className="h-3 w-3 mr-1" />
                  {kg} kg available
                </Badge>
              )}
              <Badge className="text-xs bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
                <Star className="h-3 w-3 mr-1" />
                {authorRating}
              </Badge>
            </div>
          </div>
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="px-4 pb-3">
            <div className="rounded-xl overflow-hidden aspect-video bg-white/5">
              <img
                src={images[0]}
                alt="Post"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={toggleLike}
                disabled={likeLoading}
                className={`flex items-center gap-1.5 transition-colors ${
                  liked ? "text-rose-400" : "text-muted hover:text-rose-400"
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                <span className="text-sm">{post.likes_count}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-muted hover:text-electricBlue transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">{post.comments_count}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted hover:text-emerald transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              className={`transition-colors ${
                bookmarked ? "text-electricBlue" : "text-muted hover:text-electricBlue"
              }`}
            >
              <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pb-4">
          {isOwnPost ? (
            // Own post - show disabled button
            <Button 
              className="w-full opacity-50 cursor-not-allowed" 
              variant="secondary"
              disabled
              title="This is your post"
            >
              {isRequest ? (
                <><Package className="h-4 w-4 mr-2" /> Your Request</>
              ) : (
                <><Plane className="h-4 w-4 mr-2" /> Your Trip</>
              )}
            </Button>
          ) : (
            // Other's post - allow offer
            <Button 
              className="w-full" 
              variant={isRequest ? "primary" : "secondary"}
              onClick={() => setShowOfferModal(true)}
            >
              {isRequest ? (
                <><Send className="h-4 w-4 mr-2" /> Make Offer</>
              ) : (
                <><ShoppingBag className="h-4 w-4 mr-2" /> Request Delivery</>
              )}
            </Button>
          )}
        </div>

        {/* Offer Modal */}
        <OfferModal
          post={post}
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => {
            // Could refresh or show toast
          }}
        />

        {/* Comments Section */}
        {showComments && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            className="border-t border-white/10 px-4 py-3"
          >
            {/* Existing comments */}
            {comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {comments.map((comment) => {
                  const commentAuthor = comment.author as { full_name: string } | undefined;
                  return (
                    <div key={comment.id} className="flex gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-electricBlue/30 to-emerald/30 flex items-center justify-center text-xs font-semibold shrink-0">
                        {(commentAuthor?.full_name || "U").charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{commentAuthor?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Add comment */}
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-electricBlue/30 to-emerald/30 flex items-center justify-center text-xs font-semibold shrink-0">
                You
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-electricBlue/50"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || submitting}
                  className="p-2 rounded-full bg-electricBlue/20 text-electricBlue disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

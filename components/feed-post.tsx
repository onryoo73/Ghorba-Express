"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeedPostProps {
  id: string;
  type: "request" | "trip";
  author: {
    name: string;
    avatar?: string;
    rating: number;
    verified?: boolean;
  };
  content: string;
  from?: string;
  to?: string;
  date?: string;
  reward?: string;
  kg?: number;
  price?: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export function FeedPost({
  type,
  author,
  content,
  from,
  to,
  date,
  reward,
  kg,
  price,
  image,
  likes: initialLikes,
  comments: initialComments,
  timestamp
}: FeedPostProps): JSX.Element {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const isRequest = type === "request";

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
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-electricBlue/30 to-emerald/30 flex items-center justify-center text-lg font-semibold border border-white/10">
              {author.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{author.name}</span>
                {author.verified && (
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
          <p className="text-sm leading-relaxed">{content}</p>
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
              {kg !== undefined && (
                <Badge
                  className="text-xs bg-electricBlue/20 text-electricBlue border-electricBlue/30"
                >
                  <Package className="h-3 w-3 mr-1" />
                  {kg} kg available
                </Badge>
              )}
              <Badge className="text-xs bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
                <Star className="h-3 w-3 mr-1" />
                {author.rating}
              </Badge>
            </div>
          </div>
        </div>

        {/* Image */}
        {image && (
          <div className="px-4 pb-3">
            <div className="rounded-xl overflow-hidden aspect-video bg-white/5">
              <img
                src={image}
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
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${
                  liked ? "text-rose-400" : "text-muted hover:text-rose-400"
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                <span className="text-sm">{likes}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-muted hover:text-electricBlue transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">{initialComments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted hover:text-emerald transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setBookmarked(!bookmarked)}
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
          <Button className="w-full" variant={isRequest ? "primary" : "secondary"}>
            {isRequest ? (
              <><Send className="h-4 w-4 mr-2" /> Make Offer</>
            ) : (
              <><ShoppingBag className="h-4 w-4 mr-2" /> Request Delivery</>
            )}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            className="border-t border-white/10 px-4 py-3"
          >
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
                />
                <button
                  disabled={!commentText.trim()}
                  className="p-2 rounded-full bg-electricBlue/20 text-electricBlue disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

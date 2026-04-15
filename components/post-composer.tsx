"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus,
  X,
  Send,
  Loader2,
  ShoppingBag,
  Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreatePost } from "@/lib/hooks/use-posts";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";

type PostType = "request" | "trip" | null;

interface PostComposerProps {
  onPostCreated?: () => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<PostType>(null);
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createPost, loading } = useCreatePost();
  const { user } = useAuthSession();

  const handleClose = () => {
    setIsExpanded(false);
    setPostType(null);
    setContent("");
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files].slice(0, 4)); // Max 4 images
      const newUrls = files.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newUrls].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!supabase || selectedImages.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const file of selectedImages) {
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);
      
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(data.path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!user || !content.trim() || !postType) return;

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      const postData = {
        author_id: user.id,
        type: postType,
        content: content.trim(),
        images: imageUrls,
      };

      await createPost(postData);
      handleClose();
      onPostCreated?.();
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  const placeholderText =
    postType === "request"
      ? "What do you need? Describe your item and where from..."
      : postType === "trip"
      ? "Where are you flying? How much space do you have?"
      : "What's on your mind?";

  return (
    <Card className="overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-electricBlue to-emerald flex items-center justify-center text-white font-semibold">
                {user?.user_metadata?.full_name?.charAt(0) || "Y"}
              </div>
              <button
                onClick={() => setIsExpanded(true)}
                className="flex-1 text-left px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-muted text-sm"
              >
                What's on your mind?
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setPostType("request");
                    setIsExpanded(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm text-rose-300"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">I need something</span>
                </button>
                <button
                  onClick={() => {
                    setPostType("trip");
                    setIsExpanded(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm text-emerald"
                >
                  <Plane className="h-4 w-4" />
                  <span className="hidden sm:inline">I'm traveling</span>
                </button>
              </div>
              <button 
                onClick={() => {
                  setIsExpanded(true);
                  fileInputRef.current?.click();
                }}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-electricBlue"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {postType === "request" && (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-400/20 text-rose-300 text-xs">
                    <ShoppingBag className="h-3 w-3" />
                    Request
                  </span>
                )}
                {postType === "trip" && (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald/20 text-emerald text-xs">
                    <Plane className="h-3 w-3" />
                    Trip
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!postType && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setPostType("request")}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-400/30 bg-rose-400/10 hover:bg-rose-400/20 transition-colors text-rose-300"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>I need something</span>
                </button>
                <button
                  onClick={() => setPostType("trip")}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald/30 bg-emerald/10 hover:bg-emerald/20 transition-colors text-emerald"
                >
                  <Plane className="h-5 w-5" />
                  <span>I'm traveling</span>
                </button>
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholderText}
              className="w-full bg-transparent resize-none outline-none min-h-[100px] text-sm mb-3"
              autoFocus
            />

            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex gap-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedImages.length >= 4}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-electricBlue disabled:opacity-50"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
                {selectedImages.length > 0 && (
                  <span className="text-xs text-muted self-center">
                    {selectedImages.length}/4 images
                  </span>
                )}
              </div>
              <Button
                disabled={!content.trim() || loading}
                onClick={handleSubmit}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

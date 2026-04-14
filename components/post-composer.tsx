"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus,
  MapPin,
  Package,
  Plane,
  ShoppingBag,
  X,
  Send,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PostType = "request" | "trip" | null;

export function PostComposer(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<PostType>(null);
  const [content, setContent] = useState("");

  const handleClose = () => {
    setIsExpanded(false);
    setPostType(null);
    setContent("");
  };

  const placeholderText =
    postType === "request"
      ? "What do you need? (e.g., 'iPhone charger from Paris')"
      : postType === "trip"
      ? "Where are you flying? (e.g., 'Paris to Tunis, 5kg free')"
      : "What do you need or where are you traveling?";

  return (
    <Card className="overflow-hidden">
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
                You
              </div>
              <button
                onClick={() => setIsExpanded(true)}
                className="flex-1 text-left px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-muted text-sm"
              >
                What do you need or where are you flying?
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
              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-electricBlue">
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
              <h3 className="font-semibold">
                {postType === "request" && "Post a Request"}
                {postType === "trip" && "Post Your Trip"}
                {!postType && "Create Post"}
              </h3>
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

            <div className="flex gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-electricBlue to-emerald flex items-center justify-center text-white font-semibold shrink-0">
                You
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 bg-transparent resize-none outline-none min-h-[80px] text-sm"
                autoFocus
              />
            </div>

            {postType && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mb-4 p-3 rounded-xl bg-white/5"
              >
                {postType === "request" ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                        <MapPin className="h-4 w-4 text-electricBlue" />
                        <Input
                          placeholder="From (city)"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                        <MapPin className="h-4 w-4 text-emerald" />
                        <Input
                          placeholder="To (city)"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                      <Package className="h-4 w-4 text-rose-300" />
                      <Input
                        placeholder="Product price + reward (TND)"
                        type="number"
                        className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                        <MapPin className="h-4 w-4 text-electricBlue" />
                        <Input
                          placeholder="From (city)"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                        <MapPin className="h-4 w-4 text-emerald" />
                        <Input
                          placeholder="To (city)"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                        <Calendar className="h-4 w-4 text-yellow-300" />
                        <Input
                          type="date"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                        <Package className="h-4 w-4 text-rose-300" />
                        <Input
                          placeholder="Kg available"
                          type="number"
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex gap-1">
                <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-electricBlue">
                  <ImagePlus className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-emerald">
                  <MapPin className="h-5 w-5" />
                </button>
              </div>
              <Button
                disabled={!content.trim()}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

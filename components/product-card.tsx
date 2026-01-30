"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTransition } from "@/lib/context/transition-context";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_percentage: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const router = useRouter();
  const { startTransition } = useTransition();

  // Calculate display price - prioritize discount if it exists, otherwise use variants
  const calculateDisplayPrice = () => {
    // If product has discount, always show discounted price
    if (product.discount_percentage > 0) {
      return product.price * (1 - product.discount_percentage / 100);
    }
    // Otherwise, use variants if available
    if (variants.length > 0 && minPrice && maxPrice) {
      return minPrice === maxPrice ? minPrice : { min: minPrice, max: maxPrice };
    }
    // Fallback to product price
    return product.price;
  };

  const displayPrice = calculateDisplayPrice();

  // Check if product is in wishlist and load variants
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("wishlists")
          .select("id")
          .eq("customer_id", user.id)
          .eq("product_id", product.id)
          .single();
        setIsInWishlist(!!data);
      }

      // Load variants
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true)
        .order("price");

      if (variantsData && variantsData.length > 0) {
        setVariants(variantsData);
        const prices = variantsData.map((v) => v.price);
        setMinPrice(Math.min(...prices));
        setMaxPrice(Math.max(...prices));
      }
    };

    loadData();
  }, [product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If variants exist, redirect to product page for selection
    if (variants.length > 0) {
      router.push(`/products/${product.id}`);
      return;
    }

    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      discount: product.discount_percentage,
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your wishlist.",
      });
      router.push("/customer/login");
      return;
    }

    setIsWishlistLoading(true);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("customer_id", user.id)
          .eq("product_id", product.id);

        if (error) throw error;

        setIsInWishlist(false);
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        });
      } else {
        // Add to wishlist
        const { error } = await supabase.from("wishlists").insert({
          customer_id: user.id,
          product_id: product.id,
        });

        if (error) throw error;

        setIsInWishlist(true);
        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update wishlist.",
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const clickX = e.clientX;
    const clickY = e.clientY;

    // Start transition animation
    startTransition(product.id, { x: clickX, y: clickY });

    // Delay navigation to let circle start expanding on current page first
    setTimeout(() => {
      router.push(`/products/${product.id}`);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative h-full"
    >
      <div
        onClick={handleCardClick}
        className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)] cursor-pointer group h-full flex flex-col hover:shadow-[0_8px_24px_0_rgba(0,0,0,0.12),0_2px_6px_0_rgba(0,0,0,0.08)] hover:border-gray-300/90 hover:-translate-y-0.5 transition-all duration-300 ease-out"
      >
        {/* Image Container - Perfect 1:1 Aspect Ratio */}
        <div
          className="relative w-full"
          style={{ aspectRatio: "1 / 1", cursor: "pointer" }}
        >
          <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50/60 to-gray-100/40 rounded-t-2xl border-b border-gray-200/50 group-hover:border-gray-300/70 transition-colors duration-300">
            <Image
              src={product.image_url || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={false}
              style={{ pointerEvents: "none" }}
            />

            {/* Discount Badge */}
            {product.discount_percentage > 0 && (
              <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xl">
                    {product.discount_percentage}% OFF
                  </div>
                </div>
              </div>
            )}

            {/* Out of Stock Overlay */}
            {product.stock_quantity === 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 pointer-events-none">
                <span className="text-white font-bold text-sm sm:text-base tracking-wide">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Quick Actions - Appear on Hover */}
            <div
              className="absolute bottom-2.5 left-2.5 right-2.5 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
              style={{ pointerEvents: "auto" }}
            >
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 bg-white/95 backdrop-blur-sm text-green-600 font-semibold py-2 px-3 rounded-lg shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                style={{
                  cursor:
                    product.stock_quantity === 0 ? "not-allowed" : "pointer",
                }}
              >
                <ShoppingCart className="h-3.5 w-3.5 inline mr-1.5" />
                Quick Add
              </button>
              <button
                onClick={handleWishlistToggle}
                disabled={isWishlistLoading}
                className={`bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg hover:bg-white hover:scale-110 hover:rotate-3 active:scale-90 transition-all ${
                  isInWishlist ? "text-red-500" : "text-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  cursor: isWishlistLoading ? "not-allowed" : "pointer",
                }}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    isInWishlist ? "fill-current" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section - Optimized for 1:1 Image Ratio */}
        <div
          className="relative flex flex-col flex-1 p-4 sm:p-5 bg-white/95"
          style={{ cursor: "pointer" }}
        >
          {/* Product Name */}
          <div className="flex-shrink-0 mb-2">
            <h3
              className="font-bold text-base sm:text-lg text-center text-[#1a5f3f] line-clamp-2 group-hover:text-[#15803d] transition-colors duration-300 leading-tight"
              style={{ 
                pointerEvents: "none",
                fontFamily: "inherit"
              }}
            >
              {product.name}
            </h3>
          </div>

          {/* Price Section */}
          <div className="flex-shrink-0 mb-2 text-center" style={{ pointerEvents: "none" }}>
            {product.discount_percentage > 0 ? (
              <div className="flex flex-col items-center gap-1">
                {/* Creative Discount Price Display */}
                <div className="relative inline-flex items-baseline gap-2">
                  {/* Original Price with Creative Strikethrough */}
                  <div className="relative">
                    <span className="text-sm sm:text-base text-gray-400 font-medium relative">
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-full h-3 text-red-400/60" viewBox="0 0 100 10" preserveAspectRatio="none">
                          <path d="M 0 5 Q 25 2, 50 5 T 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      </span>
                      <span className="relative">₹{product.price.toFixed(2)}</span>
                    </span>
                  </div>
                  
                  {/* Reduced Price with Highlight */}
                  <div className="relative">
                    <span className="text-xl sm:text-2xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300 leading-none relative z-10">
                      ₹{typeof displayPrice === "number" ? displayPrice.toFixed(2) : ""}
                    </span>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-green-500/10 blur-sm -z-0 rounded"></div>
                  </div>
                </div>
                
                {/* Savings Indicator */}
                <div className="flex items-center justify-center mt-0.5">
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    Save ₹{(product.price - (typeof displayPrice === "number" ? displayPrice : product.price)).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : variants.length > 0 && minPrice && maxPrice ? (
              <div className="flex flex-col gap-0.5 items-center">
                <span className="text-lg sm:text-xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300 leading-tight">
                  {minPrice === maxPrice
                    ? `₹${minPrice.toFixed(2)}`
                    : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`}
                </span>
                <span className="text-xs text-gray-500 font-normal">
                  {variants.length} size{variants.length > 1 ? "s" : ""}{" "}
                  available
                </span>
              </div>
            ) : (
              <span className="text-lg sm:text-xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300 inline-block leading-tight">
                ₹
                {typeof displayPrice === "number"
                  ? displayPrice.toFixed(2)
                  : product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Category Badge - At Bottom */}
          <div
            className="mt-auto flex-shrink-0 pt-2 border-t border-gray-200/50 group-hover:border-gray-300/70 group-hover:opacity-100 opacity-70 transition-all duration-300 text-center"
            style={{ pointerEvents: "none" }}
          >
            <span className="text-xs text-gray-500 uppercase tracking-wider font-normal">
              {product.category.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
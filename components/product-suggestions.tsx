"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

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

interface ProductSuggestionsProps {
  currentProductId: string;
  currentProductCategory: string;
}

export default function ProductSuggestions({ 
  currentProductId, 
  currentProductCategory 
}: ProductSuggestionsProps) {
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      setLoading(true);
      const suggestionScores = new Map<string, { product: Product; score: number }>();

      if (user) {
        // Get user's purchase history
        const { data: orders } = await supabase
          .from("orders")
          .select("id")
          .eq("customer_id", user.id)
          .in("order_status", ["confirmed", "processing", "shipped", "delivered"])
          .limit(10);

        if (orders && orders.length > 0) {
          const orderIds = orders.map(o => o.id);
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("product_id")
            .in("order_id", orderIds)
            .neq("product_id", currentProductId);

          if (orderItems && orderItems.length > 0) {
            const purchasedProductIds = Array.from(new Set(orderItems.map((oi: any) => oi.product_id)));
            
            // Get categories from purchased products
            const { data: purchasedProducts } = await supabase
              .from("products")
              .select("category")
              .in("id", purchasedProductIds);
            
            const purchasedCategories = Array.from(new Set((purchasedProducts || []).map((p: any) => p.category).filter(Boolean)));

            // Get products from same categories as purchased items (high priority - score 10)
            if (purchasedCategories.length > 0) {
              const { data: categoryProducts } = await supabase
                .from("products")
                .select(`
                  *,
                  product_variants (
                    id,
                    is_active
                  )
                `)
                .eq("is_active", true)
                .in("category", purchasedCategories)
                .neq("id", currentProductId)
                .limit(12);

              if (categoryProducts) {
                const withVariants = categoryProducts.filter((p: any) => 
                  p.product_variants?.some((v: any) => v.is_active)
                ).map((p: any) => {
                  const { product_variants, ...rest } = p;
                  return rest;
                });
                
                withVariants.forEach((product: Product) => {
                  const existing = suggestionScores.get(product.id);
                  suggestionScores.set(product.id, {
                    product,
                    score: (existing?.score || 0) + 10 // High priority for purchase-based
                  });
                });
              }
            }
          }
        }

        // Get user's wishlist products (medium priority - score 8)
        const { data: wishlistItems } = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("customer_id", user.id)
          .neq("product_id", currentProductId)
          .limit(8);

        if (wishlistItems && wishlistItems.length > 0) {
          const wishlistProductIds = wishlistItems.map(w => w.product_id);
          const { data: wishlistProducts } = await supabase
            .from("products")
            .select(`
              *,
              product_variants (
                id,
                is_active
              )
            `)
            .eq("is_active", true)
            .in("id", wishlistProductIds);

          if (wishlistProducts) {
            const withVariants = wishlistProducts.filter((p: any) => 
              p.product_variants?.some((v: any) => v.is_active)
            ).map((p: any) => {
              const { product_variants, ...rest } = p;
              return rest;
            });
            
            withVariants.forEach((product: Product) => {
              const existing = suggestionScores.get(product.id);
              suggestionScores.set(product.id, {
                product,
                score: (existing?.score || 0) + 8 // Medium priority for wishlist
              });
            });
          }
        }

        // Get user's cart products (medium-low priority - score 5)
        const { data: cartItems } = await supabase
          .from("shopping_carts")
          .select("product_id")
          .eq("customer_id", user.id)
          .neq("product_id", currentProductId)
          .limit(8);

        if (cartItems && cartItems.length > 0) {
          const cartProductIds = cartItems.map(c => c.product_id);
          const { data: cartProducts } = await supabase
            .from("products")
            .select(`
              *,
              product_variants (
                id,
                is_active
              )
            `)
            .eq("is_active", true)
            .in("id", cartProductIds);

          if (cartProducts) {
            const withVariants = cartProducts.filter((p: any) => 
              p.product_variants?.some((v: any) => v.is_active)
            ).map((p: any) => {
              const { product_variants, ...rest } = p;
              return rest;
            });
            
            withVariants.forEach((product: Product) => {
              const existing = suggestionScores.get(product.id);
              suggestionScores.set(product.id, {
                product,
                score: (existing?.score || 0) + 5 // Medium-low priority for cart
              });
            });
          }
        }
      }

      // Fallback: Get products from same category (low priority - score 3)
      if (suggestionScores.size < 4) {
        const { data: categoryProducts } = await supabase
          .from("products")
          .select(`
            *,
            product_variants (
              id,
              is_active
            )
          `)
          .eq("is_active", true)
          .eq("category", currentProductCategory)
          .neq("id", currentProductId)
          .limit(8);

        if (categoryProducts) {
          const withVariants = categoryProducts.filter((p: any) => 
            p.product_variants?.some((v: any) => v.is_active)
          ).map((p: any) => {
            const { product_variants, ...rest } = p;
            return rest;
          });
          
          withVariants.forEach((product: Product) => {
            // Only add if not already in suggestions (to avoid overriding higher scores)
            if (!suggestionScores.has(product.id)) {
              suggestionScores.set(product.id, {
                product,
                score: 3 // Low priority for category fallback
              });
            }
          });
        }
      }

      // Sort by score (highest first) and limit to 8 products
      const sortedSuggestions = Array.from(suggestionScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => item.product);

      setSuggestedProducts(sortedSuggestions);
      setLoading(false);
    };

    loadSuggestions();
  }, [currentProductId, currentProductCategory]);

  if (loading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (suggestedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">You May Also Like</h2>
          </div>
          <p className="text-gray-600 text-lg">
            Based on your shopping history and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {suggestedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


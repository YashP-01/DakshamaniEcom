"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  discount_percentage: number;
}

export default function CustomerWishlist() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/customer/login");
        return;
      }

      const { data } = await supabase
        .from("wishlists")
        .select("*, products(*)")
        .eq("customer_id", user.id);

      setWishlistItems(data || []);
      setLoading(false);
    };

    loadWishlist();
  }, [router]);

  const handleRemove = async (productId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Removed from wishlist" });
      setWishlistItems(wishlistItems.filter((item) => item.product_id !== productId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-32 pb-16 md:pt-40 md:pb-20 lg:pt-44 lg:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          <Link href="/customer/dashboard">
            <Button variant="outline" size="sm" className="mb-6 md:mb-8 text-xs sm:text-sm">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">My Wishlist</h1>

          {wishlistItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 md:p-16 text-center">
                <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4 sm:mb-6" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3">Your wishlist is empty</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Add products you love to your wishlist
                </p>
                <Link href="/products">
                  <Button>Browse Products</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlistItems.map((item) => {
                const product = item.products;
                if (!product) return null;

                const finalPrice =
                  product.discount_percentage > 0
                    ? product.price * (1 - product.discount_percentage / 100)
                    : product.price;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card>
                      <CardContent className="p-0">
                        <Link href={`/products/${product.id}`}>
                          <div className="relative h-48">
                            <Image
                              src={product.image_url || "/placeholder-product.jpg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                        <div className="p-3 sm:p-4">
                          <Link href={`/products/${product.id}`}>
                            <h3 className="font-semibold text-sm sm:text-base mb-2 hover:text-green-600">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            {product.discount_percentage > 0 ? (
                              <>
                                <span className="text-base sm:text-lg font-bold text-green-600">
                                  ₹{finalPrice.toFixed(2)}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-500 line-through">
                                  ₹{product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-base sm:text-lg font-bold text-green-600">
                                ₹{product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 text-xs sm:text-sm"
                              onClick={() => handleRemove(product.id)}
                            >
                              Remove
                            </Button>
                            <Link href={`/products/${product.id}`}>
                              <Button className="flex-1 text-xs sm:text-sm">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}


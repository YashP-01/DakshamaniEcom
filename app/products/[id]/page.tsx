"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useCartStore } from "@/lib/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTransition } from "@/lib/context/transition-context";
import ProductSuggestions from "@/components/product-suggestions";
import ProductReviews from "@/components/product-reviews";

interface Product {
  id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number;
  discount_percentage: number;
  image_url: string;
  gallery_images: string[];
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  stock_quantity: number;
  weight_grams: number;
  weight_unit: string;
  shelf_life_days: number;
  storage_instructions: string;
  origin_country: string;
  certification: string[];
}

interface Nutrition {
  serving_size: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  sugar: number;
  fiber: number;
  fat: number;
  saturated_fat: number;
  trans_fat: number;
  cholesterol: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  vitamin_a: number;
  vitamin_c: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [nutrition, setNutrition] = useState<Nutrition | null>(null);
  const [allergens, setAllergens] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "details" | "nutrition" | "ingredients"
  >("details");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [circleRadius, setCircleRadius] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const { transitionState, endTransition } = useTransition();

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (data) {
        setProduct(data);

        // Load nutrition
        const { data: nutritionData } = await supabase
          .from("product_nutrition")
          .select("*")
          .eq("product_id", productId)
          .single();

        if (nutritionData) setNutrition(nutritionData);

        // Load allergens
        const { data: allergensData } = await supabase
          .from("product_allergens")
          .select("*")
          .eq("product_id", productId);

        if (allergensData) setAllergens(allergensData);

        // Load ingredients
        const { data: ingredientsData } = await supabase
          .from("product_ingredients")
          .select("*")
          .eq("product_id", productId)
          .order("display_order");

        if (ingredientsData) setIngredients(ingredientsData);

        // Load product variants
        const { data: variantsData } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("is_active", true)
          .order("price");

        if (variantsData && variantsData.length > 0) {
          setVariants(variantsData);
          setSelectedVariant(variantsData[0]); // Select first variant by default
        }

        // Check if product is in wishlist
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: wishlistData } = await supabase
            .from("wishlists")
            .select("id")
            .eq("customer_id", user.id)
            .eq("product_id", productId)
            .single();

          setIsInWishlist(!!wishlistData);
        }
      }
      setIsLoading(false);
    };
    loadProduct();
  }, [productId]);

  // Animate circle reveal from click point - START IMMEDIATELY
  // Only animate if the transition is for THIS product (not when navigating away)
  useEffect(() => {
    if (
      transitionState.isTransitioning &&
      transitionState.clickPosition &&
      transitionState.productId === productId
    ) {
      // Calculate max radius needed to cover entire document (not just viewport)
      // Get full document dimensions including scrollable content
      const docWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        window.innerWidth
      );
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );

      // Calculate distance from click point to all four corners of the document
      const clickX = transitionState.clickPosition!.x;
      const clickY = transitionState.clickPosition!.y;

      const distances = [
        Math.sqrt(Math.pow(clickX, 2) + Math.pow(clickY, 2)), // Top-left corner
        Math.sqrt(Math.pow(docWidth - clickX, 2) + Math.pow(clickY, 2)), // Top-right corner
        Math.sqrt(Math.pow(clickX, 2) + Math.pow(docHeight - clickY, 2)), // Bottom-left corner
        Math.sqrt(
          Math.pow(docWidth - clickX, 2) + Math.pow(docHeight - clickY, 2)
        ), // Bottom-right corner
      ];

      // Start from very small circle (0px) to ensure page is hidden initially
      const initialRadius = 0;
      setCircleRadius(initialRadius);

      // Small delay to ensure page is rendered and content is loaded, then start animation
      const startTime = Date.now() + 100; // 100ms delay to ensure DOM and content are ready
      const duration = 1000; // Full 1 second animation

      // Calculate maxRadius once after delay to ensure accurate document dimensions
      let calculatedMaxRadius = Math.max(...distances) * 1.2;

      const calculateMaxRadius = () => {
        // Recalculate dimensions to account for any dynamic content that loaded
        const currentDocWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
          window.innerWidth
        );
        const currentDocHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          window.innerHeight
        );

        const currentDistances = [
          Math.sqrt(Math.pow(clickX, 2) + Math.pow(clickY, 2)),
          Math.sqrt(
            Math.pow(currentDocWidth - clickX, 2) + Math.pow(clickY, 2)
          ),
          Math.sqrt(
            Math.pow(clickX, 2) + Math.pow(currentDocHeight - clickY, 2)
          ),
          Math.sqrt(
            Math.pow(currentDocWidth - clickX, 2) +
              Math.pow(currentDocHeight - clickY, 2)
          ),
        ];

        return Math.max(...currentDistances) * 1.2;
      };

      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 0) {
          // Recalculate maxRadius right before animation starts
          calculatedMaxRadius = calculateMaxRadius();
          requestAnimationFrame(animate);
          return;
        }

        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentRadius =
          initialRadius + eased * (calculatedMaxRadius - initialRadius);
        setCircleRadius(currentRadius);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete - wait for content to stabilize before ending transition
          let lastHeight = 0;
          let stableCount = 0;
          const checkContentStable = () => {
            const currentHeight = Math.max(
              document.documentElement.scrollHeight,
              document.body.scrollHeight
            );

            if (currentHeight === lastHeight) {
              stableCount++;
              // If height hasn't changed for 3 checks (300ms), consider it stable
              if (stableCount >= 3) {
                // Final recalculation with stable dimensions
                const finalDocWidth = Math.max(
                  document.documentElement.scrollWidth,
                  document.body.scrollWidth,
                  window.innerWidth
                );
                const finalDocHeight = Math.max(
                  document.documentElement.scrollHeight,
                  document.body.scrollHeight,
                  window.innerHeight
                );

                const finalDistances = [
                  Math.sqrt(Math.pow(clickX, 2) + Math.pow(clickY, 2)),
                  Math.sqrt(
                    Math.pow(finalDocWidth - clickX, 2) + Math.pow(clickY, 2)
                  ),
                  Math.sqrt(
                    Math.pow(clickX, 2) + Math.pow(finalDocHeight - clickY, 2)
                  ),
                  Math.sqrt(
                    Math.pow(finalDocWidth - clickX, 2) +
                      Math.pow(finalDocHeight - clickY, 2)
                  ),
                ];

                const finalMaxRadius = Math.max(...finalDistances) * 1.3; // Increased margin
                setCircleRadius(finalMaxRadius);

                // Clear transition after ensuring full coverage
                setTimeout(() => {
                  endTransition();
                  setCircleRadius(0);
                }, 200);
                return;
              }
            } else {
              // Height changed, reset counter and update radius
              stableCount = 0;
              const currentDocWidth = Math.max(
                document.documentElement.scrollWidth,
                document.body.scrollWidth,
                window.innerWidth
              );
              const currentDocHeight = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight,
                window.innerHeight
              );

              const currentDistances = [
                Math.sqrt(Math.pow(clickX, 2) + Math.pow(clickY, 2)),
                Math.sqrt(
                  Math.pow(currentDocWidth - clickX, 2) + Math.pow(clickY, 2)
                ),
                Math.sqrt(
                  Math.pow(clickX, 2) + Math.pow(currentDocHeight - clickY, 2)
                ),
                Math.sqrt(
                  Math.pow(currentDocWidth - clickX, 2) +
                    Math.pow(currentDocHeight - clickY, 2)
                ),
              ];

              const currentMaxRadius = Math.max(...currentDistances) * 1.3;
              setCircleRadius(currentMaxRadius);
            }

            lastHeight = currentHeight;
            setTimeout(checkContentStable, 100);
          };

          // Start checking after initial delay
          setTimeout(checkContentStable, 100);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setCircleRadius(0);
    }
  }, [
    transitionState.isTransitioning,
    transitionState.clickPosition,
    transitionState.productId,
    productId,
    endTransition,
  ]);

  const clickPosition = transitionState.clickPosition;
  // Always apply clip-path if transition is active for THIS product, even if radius is 0 (hides page)
  const isRevealing =
    transitionState.isTransitioning &&
    clickPosition &&
    transitionState.productId === productId;

  if (!product) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#f5f5f0]"
        style={{
          clipPath: isRevealing
            ? `circle(${Math.max(circleRadius, 0)}px at ${clickPosition!.x}px ${
                clickPosition!.y
              }px)`
            : "none",
          WebkitClipPath: isRevealing
            ? `circle(${Math.max(circleRadius, 0)}px at ${clickPosition!.x}px ${
                clickPosition!.y
              }px)`
            : "none",
        }}
      >
        {/* Hidden during transition - loading state */}
      </div>
    );
  }

  const currentProduct = selectedVariant || product;
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentDiscount =
    selectedVariant && selectedVariant.compare_at_price
      ? ((selectedVariant.compare_at_price - currentPrice) /
          selectedVariant.compare_at_price) *
        100
      : product.discount_percentage;

  const finalPrice =
    currentDiscount > 0
      ? currentPrice * (1 - currentDiscount / 100)
      : currentPrice;

  const handleAddToCart = () => {
    const displayName = selectedVariant
      ? `${product.name} (${selectedVariant.variant_name})`
      : product.name;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        product_id: product.id,
        name: displayName,
        price: currentPrice,
        image: product.image_url,
        discount: currentDiscount,
        variant_id: selectedVariant?.id,
        variant_name: selectedVariant?.variant_name,
      });
    }
    toast({
      title: "Added to cart",
      description: `${quantity} x ${displayName} added to cart`,
    });
  };

  const handleWishlistToggle = async () => {
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
          .eq("product_id", productId);

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
          product_id: productId,
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

  return (
    <>
      {/* Light green expanding circle border */}
      {isRevealing && clickPosition && circleRadius > 0 && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${clickPosition.x}px`,
            top: `${clickPosition.y}px`,
            transform: "translate(-50%, -50%)",
            width: `${circleRadius * 2}px`,
            height: `${circleRadius * 2}px`,
            borderRadius: "50%",
            border: "2px solid rgba(134, 239, 172, 0.6)",
            boxShadow: "0 0 20px rgba(134, 239, 172, 0.4)",
          }}
        />
      )}
      <div
        className="min-h-screen relative bg-[#f5f5f0]"
        style={{
          clipPath: isRevealing
            ? `circle(${Math.max(circleRadius, 0)}px at ${clickPosition.x}px ${
                clickPosition.y
              }px)`
            : "none",
          WebkitClipPath: isRevealing
            ? `circle(${Math.max(circleRadius, 0)}px at ${clickPosition.x}px ${
                clickPosition.y
              }px)`
            : "none",
        }}
      >
        <Navbar />
        <div className="pt-32 pb-12 md:pt-40 md:pb-16 lg:pt-44">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:pl-8">
              <div className="relative">
                {/* Frame Container with Multiple Border Lines */}
                <div className="product-image-frame">
                  {/* Floating Shadow Layers */}
                  <div className="frame-shadow-layer frame-shadow-1"></div>
                  <div className="frame-shadow-layer frame-shadow-2"></div>
                  <div className="frame-shadow-layer frame-shadow-3"></div>

                  {/* Border Frame Layers */}
                  <div className="frame-border-outer"></div>
                  <div className="frame-border-inner"></div>

                  {/* Main Image Container */}
                  <div className="frame-image-wrapper relative h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px]">
                    <div className="frame-image-inner relative w-full h-full overflow-hidden">
                      <Image
                        src={product.image_url || "/placeholder-product.jpg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.discount_percentage > 0 && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg z-10">
                          {product.discount_percentage}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 md:space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-3 md:mb-4">
                    {product.name}
                  </h1>

                  {/* Variant Selector */}
                  {variants.length > 0 && (
                    <div className="mb-5 md:mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Select Size / Pack:
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {variants.map((variant) => {
                          const variantDiscount =
                            variant.compare_at_price &&
                            variant.compare_at_price > variant.price
                              ? ((variant.compare_at_price - variant.price) /
                                  variant.compare_at_price) *
                                100
                              : 0;
                          const variantFinalPrice = variant.price;
                          const isSelected = selectedVariant?.id === variant.id;
                          const isOutOfStock = variant.stock_quantity === 0;

                          return (
                            <motion.button
                              key={variant.id}
                              onClick={() =>
                                !isOutOfStock && setSelectedVariant(variant)
                              }
                              disabled={isOutOfStock}
                              className={`relative px-6 py-3 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                                  : "border-gray-300 bg-white hover:border-green-400 hover:bg-green-50"
                              } ${
                                isOutOfStock
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              whileHover={!isOutOfStock ? { scale: 1.05 } : {}}
                              whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
                            >
                              <div className="text-left">
                                <div className="font-semibold">
                                  {variant.variant_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  ₹{variantFinalPrice.toFixed(2)}
                                  {variant.compare_at_price && (
                                    <span className="ml-2 text-xs line-through text-gray-400">
                                      ₹{variant.compare_at_price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {variant.stock_quantity > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    {variant.stock_quantity} in stock
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <motion.div
                                  className="absolute top-2 right-2 text-green-600"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  ✓
                                </motion.div>
                              )}
                              {isOutOfStock && (
                                <div className="absolute top-2 right-2 text-red-500 text-xs">
                                  Out of Stock
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center flex-wrap gap-3 md:gap-4 mb-5 md:mb-6">
                    {currentDiscount > 0 ? (
                      <>
                        <span className="text-3xl sm:text-4xl font-bold text-green-600">
                          ₹{finalPrice.toFixed(2)}
                        </span>
                        <span className="text-xl sm:text-2xl text-gray-500 line-through">
                          ₹{currentPrice.toFixed(2)}
                        </span>
                        {currentDiscount > 0 && (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {currentDiscount.toFixed(0)}% OFF
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-3xl sm:text-4xl font-bold text-green-600">
                        ₹{currentPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-5 md:mb-6">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-3 md:gap-4 mb-5 md:mb-6">
                  <span className="font-semibold text-sm sm:text-base">
                    Quantity:
                  </span>
                  <div className="flex items-center space-x-2 border rounded-lg">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setQuantity(
                          Math.min(product.stock_quantity, quantity + 1)
                        )
                      }
                      disabled={
                        quantity >=
                        (selectedVariant?.stock_quantity ||
                          product.stock_quantity)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {selectedVariant?.stock_quantity || product.stock_quantity}{" "}
                    available
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 md:mb-8">
                  <Button
                    onClick={handleAddToCart}
                    disabled={
                      (selectedVariant?.stock_quantity ||
                        product.stock_quantity) === 0
                    }
                    size="lg"
                    className="flex-1"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className={
                      isInWishlist
                        ? "text-red-500 border-red-500 hover:bg-red-50"
                        : ""
                    }
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isInWishlist ? "fill-current" : ""
                      }`}
                    />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="border-b mb-6">
                  <div className="flex space-x-4 md:space-x-6">
                    <button
                      onClick={() => setActiveTab("details")}
                      className={`pb-3 px-1 text-sm sm:text-base ${
                        activeTab === "details"
                          ? "border-b-2 border-green-600 font-semibold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Details
                    </button>
                    {nutrition && (
                      <button
                        onClick={() => setActiveTab("nutrition")}
                        className={`pb-3 px-1 text-sm sm:text-base ${
                          activeTab === "nutrition"
                            ? "border-b-2 border-green-600 font-semibold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Nutrition
                      </button>
                    )}
                    {ingredients.length > 0 && (
                      <button
                        onClick={() => setActiveTab("ingredients")}
                        className={`pb-3 px-1 text-sm sm:text-base ${
                          activeTab === "ingredients"
                            ? "border-b-2 border-green-600 font-semibold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Ingredients
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab Content */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    {activeTab === "details" && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-4">
                          Product Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-semibold capitalize">
                              {product.category.replace("_", " ")}
                            </span>
                          </div>
                          {product.subcategory && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Subcategory:
                              </span>
                              <span className="font-semibold">
                                {product.subcategory}
                              </span>
                            </div>
                          )}
                          {product.brand && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Brand:</span>
                              <span className="font-semibold">
                                {product.brand}
                              </span>
                            </div>
                          )}
                          {product.weight_grams && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Weight:</span>
                              <span className="font-semibold">
                                {product.weight_grams} {product.weight_unit}
                              </span>
                            </div>
                          )}
                          {product.shelf_life_days && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shelf Life:</span>
                              <span className="font-semibold">
                                {product.shelf_life_days} days
                              </span>
                            </div>
                          )}
                          {product.origin_country && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Origin:</span>
                              <span className="font-semibold">
                                {product.origin_country}
                              </span>
                            </div>
                          )}
                          {product.certification &&
                            product.certification.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Certifications:
                                </span>
                                <span className="font-semibold">
                                  {product.certification.join(", ")}
                                </span>
                              </div>
                            )}
                          {product.storage_instructions && (
                            <div className="pt-2">
                              <span className="text-gray-600">Storage:</span>
                              <p className="font-semibold mt-1">
                                {product.storage_instructions}
                              </p>
                            </div>
                          )}
                          {allergens.length > 0 && (
                            <div className="pt-2">
                              <span className="text-gray-600">Allergens:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {allergens.map((allergen, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-1 rounded text-xs ${
                                      allergen.severity === "severe"
                                        ? "bg-red-100 text-red-800"
                                        : allergen.severity === "moderate"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {allergen.allergen_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-semibold">
                              {product.stock_quantity} units
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "nutrition" && nutrition && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-4">
                          Nutrition Information
                        </h3>
                        {nutrition.serving_size && (
                          <p className="text-sm text-gray-600 mb-4">
                            Serving Size: {nutrition.serving_size}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {nutrition.calories && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Calories:</span>
                              <span className="font-semibold">
                                {nutrition.calories}
                              </span>
                            </div>
                          )}
                          {nutrition.protein !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Protein:</span>
                              <span className="font-semibold">
                                {nutrition.protein}g
                              </span>
                            </div>
                          )}
                          {nutrition.carbohydrates !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Carbohydrates:
                              </span>
                              <span className="font-semibold">
                                {nutrition.carbohydrates}g
                              </span>
                            </div>
                          )}
                          {nutrition.sugar !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sugar:</span>
                              <span className="font-semibold">
                                {nutrition.sugar}g
                              </span>
                            </div>
                          )}
                          {nutrition.fiber !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fiber:</span>
                              <span className="font-semibold">
                                {nutrition.fiber}g
                              </span>
                            </div>
                          )}
                          {nutrition.fat !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fat:</span>
                              <span className="font-semibold">
                                {nutrition.fat}g
                              </span>
                            </div>
                          )}
                          {nutrition.saturated_fat !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Saturated Fat:
                              </span>
                              <span className="font-semibold">
                                {nutrition.saturated_fat}g
                              </span>
                            </div>
                          )}
                          {nutrition.sodium !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sodium:</span>
                              <span className="font-semibold">
                                {nutrition.sodium}mg
                              </span>
                            </div>
                          )}
                          {nutrition.calcium !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Calcium:</span>
                              <span className="font-semibold">
                                {nutrition.calcium}mg
                              </span>
                            </div>
                          )}
                          {nutrition.iron !== null && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Iron:</span>
                              <span className="font-semibold">
                                {nutrition.iron}mg
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "ingredients" && ingredients.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-4">
                          Ingredients
                        </h3>
                        <ul className="space-y-2">
                          {ingredients.map((ingredient, idx) => (
                            <li key={idx} className="text-sm">
                              <span className="font-semibold">
                                {ingredient.ingredient_name}
                              </span>
                              {ingredient.quantity && (
                                <span className="text-gray-600 ml-2">
                                  ({ingredient.quantity})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        {product && (
          <div className="mt-8 md:mt-12">
            <ProductReviews productId={product.id} />
          </div>
        )}

        {/* Product Suggestions */}
        {product && (
          <div className="mt-0">
            <ProductSuggestions
              currentProductId={product.id}
              currentProductCategory={product.category}
            />
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}
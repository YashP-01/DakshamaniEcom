"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/product-card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Grid3x3,
} from "lucide-react";

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

function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(16);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");
  const PRODUCTS_PER_PAGE = 16;

  type SortOption =
    | "default"
    | "price-low"
    | "price-high"
    | "name-asc"
    | "name-desc"
    | "discount";

  const sortOptions = [
    { value: "default", label: "Default" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
    { value: "discount", label: "Highest Discount" },
  ];

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const supabase = createClient();
      // Only load products that have at least one active variant
      // First get all active products, then filter in memory for those with active variants
      const { data: allProducts } = await supabase
        .from("products")
        .select(
          `
          *,
          product_variants (
            id,
            is_active
          )
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Filter products that have at least one active variant
      const data = allProducts?.filter((product: any) =>
        product.product_variants?.some((v: any) => v.is_active)
      );

      if (data) {
        // Clean up nested variant data
        const cleanedProducts = data.map((product: any) => {
          const { product_variants, ...rest } = product;
          return rest;
        });

        setProducts(cleanedProducts);
        // Calculate price range from products
        if (cleanedProducts.length > 0) {
          const prices = cleanedProducts.map((p) => {
            const finalPrice =
              p.discount_percentage > 0
                ? p.price * (1 - p.discount_percentage / 100)
                : p.price;
            return finalPrice;
          });
          const minPrice = Math.floor(Math.min(...prices, 0));
          const calculatedMaxPrice = Math.ceil(Math.max(...prices, 10000));
          setMaxPrice(calculatedMaxPrice);
          setPriceRange([minPrice, calculatedMaxPrice]);
        }
      }
    };

    const loadOffers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_products_page", true)
        .order("products_page_position", { ascending: true });

      if (data) {
        setOffers(data || []);
      }
    };

    loadProducts();
    loadOffers();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter((p) => {
      const finalPrice =
        p.discount_percentage > 0
          ? p.price * (1 - p.discount_percentage / 100)
          : p.price;
      return finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    });

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      const getFinalPrice = (p: Product) =>
        p.discount_percentage > 0
          ? p.price * (1 - p.discount_percentage / 100)
          : p.price;

      switch (sortBy) {
        case "price-low":
          return getFinalPrice(a) - getFinalPrice(b);
        case "price-high":
          return getFinalPrice(b) - getFinalPrice(a);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "discount":
          return (b.discount_percentage || 0) - (a.discount_percentage || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(sorted);
    // Reset displayed count when filters change
    setDisplayedCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, searchQuery, priceRange, products, sortBy]);

  const categories = [
    { value: "all", label: "All Products", icon: "📦" },
    { value: "dry_fruits", label: "Dry Fruits", icon: "🥜" },
    { value: "masalas", label: "Masalas", icon: "🌶️" },
    { value: "sweets", label: "Sweets", icon: "🍬" },
    { value: "ghee", label: "Ghee", icon: "🧈" },
    { value: "moringa_powder", label: "Moringa Powder", icon: "🌿" },
    { value: "other", label: "Other", icon: "📦" },
  ];

  const resetFilters = () => {
    setSelectedCategory("all");
    if (products.length > 0) {
      const prices = products.map((p) => {
        const finalPrice =
          p.discount_percentage > 0
            ? p.price * (1 - p.discount_percentage / 100)
            : p.price;
        return finalPrice;
      });
      const minPrice = Math.floor(Math.min(...prices, 0));
      const calculatedMaxPrice = Math.ceil(Math.max(...prices, 10000));
      setMaxPrice(calculatedMaxPrice);
      setPriceRange([minPrice, calculatedMaxPrice]);
    }
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const displayedProducts = filteredProducts.slice(0, displayedCount);
  const hasMoreProducts = displayedCount < filteredProducts.length;

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const previousCount = displayedCount;

    // Simulate smooth loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 400));

    setDisplayedCount((prev) => prev + PRODUCTS_PER_PAGE);
    setIsLoadingMore(false);

    // Smooth scroll to newly loaded products
    setTimeout(() => {
      const element = document.getElementById(`product-${previousCount}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  };

  const getCategoryLabel = (value: string) => {
    return categories.find((cat) => cat.value === value)?.label || value;
  };

  const removeCategoryFilter = () => {
    setSelectedCategory("all");
  };

  const removePriceFilter = () => {
    if (products.length > 0) {
      const prices = products.map((p) => {
        const finalPrice =
          p.discount_percentage > 0
            ? p.price * (1 - p.discount_percentage / 100)
            : p.price;
        return finalPrice;
      });
      const minPrice = Math.floor(Math.min(...prices, 0));
      const calculatedMaxPrice = Math.ceil(Math.max(...prices, 10000));
      setMaxPrice(calculatedMaxPrice);
      setPriceRange([minPrice, calculatedMaxPrice]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-40 pb-16 md:pt-48 md:pb-20 lg:pt-56 lg:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          {/* Header Section with Better Spacing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 lg:mb-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  Our Products
                </h1>
                <p className="text-gray-600 text-base sm:text-lg">
                  Discover our premium collection of natural products
                </p>
              </div>
              {/* Product Count Badge */}
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-green-600">
                      {filteredProducts.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {products.length}
                    </span>{" "}
                    products
                  </span>
                </div>
              </div>
            </div>

            {/* Search query indicator */}
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-gray-700">
                  Showing results for:{" "}
                  <span className="font-semibold text-green-700">
                    &quot;{searchQuery}&quot;
                  </span>
                </p>
              </motion.div>
            )}

            {/* Active Filters & Sorting Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              {/* Active Filter Chips */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    Active filters:
                  </span>
                  {selectedCategory !== "all" && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={removeCategoryFilter}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      {getCategoryLabel(selectedCategory)}
                      <X className="h-3 w-3" />
                    </motion.button>
                  )}
                  {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={removePriceFilter}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                      <X className="h-3 w-3" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Sorting Control */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 font-medium flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Filter Toggle Button for Mobile */}
          <div className="lg:hidden mb-6">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="w-full flex items-center justify-between bg-white hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Main Content with Filters */}
          <div className="flex gap-6 lg:gap-8">
            {/* Filter Sidebar */}
            <AnimatePresence>
              {(showFilters || isDesktop) && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`w-full lg:w-80 flex-shrink-0 ${
                    showFilters ? "block mb-6" : "hidden lg:block"
                  }`}
                >
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-7 sticky top-32 sm:top-36 lg:top-40 space-y-7">
                    {/* Filter Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                      </h2>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetFilters}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <div>
                      <button
                        onClick={() =>
                          setExpandedCategories(!expandedCategories)
                        }
                        className="flex items-center justify-between w-full mb-4 text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        <span>Category</span>
                        {expandedCategories ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedCategories && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2.5 overflow-hidden"
                          >
                            {categories.map((cat) => (
                              <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                                  selectedCategory === cat.value
                                    ? "bg-green-50 border-2 border-green-500 text-green-700 font-semibold"
                                    : "bg-gray-50 border-2 border-transparent hover:bg-green-50 hover:border-green-200 text-gray-700"
                                }`}
                              >
                                <span className="text-xl">{cat.icon}</span>
                                <span>{cat.label}</span>
                                {selectedCategory === cat.value && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto text-green-600"
                                  >
                                    ✓
                                  </motion.span>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Price Filter */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Price Range
                      </h3>
                      <div className="space-y-5">
                        <div className="px-1">
                          <Slider
                            value={priceRange}
                            onValueChange={(value) =>
                              setPriceRange(value as [number, number])
                            }
                            min={0}
                            max={maxPrice}
                            step={10}
                            className="w-full"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 mb-2 block font-medium">
                              Min
                            </label>
                            <input
                              type="number"
                              value={priceRange[0]}
                              onChange={(e) =>
                                setPriceRange([
                                  Math.max(0, Number(e.target.value)),
                                  priceRange[1],
                                ])
                              }
                              min={0}
                              max={priceRange[1]}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 mb-2 block font-medium">
                              Max
                            </label>
                            <input
                              type="number"
                              value={priceRange[1]}
                              onChange={(e) =>
                                setPriceRange([
                                  priceRange[0],
                                  Math.min(maxPrice, Number(e.target.value)),
                                ])
                              }
                              min={priceRange[0]}
                              max={maxPrice}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                        <div className="text-center px-3 py-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-700">
                            ₹{priceRange[0]} - ₹{priceRange[1]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="pt-5 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 text-center">
                          Showing{" "}
                          <span className="font-semibold text-green-600">
                            {filteredProducts.length}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-gray-900">
                            {products.length}
                          </span>{" "}
                          products
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              {displayedProducts.length > 0 ? (
                <>
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-8">
                      {Array.from({
                        length: Math.ceil(displayedProducts.length / 4),
                      }).map((_, rowIndex) => {
                        const startIndex = rowIndex * 4;
                        const rowProducts = displayedProducts.slice(
                          startIndex,
                          startIndex + 4
                        );
                        const offerToShow = offers.find(
                          (offer) =>
                            offer.products_page_position === rowIndex + 1
                        );

                        return (
                          <div key={`row-${rowIndex}`} className="space-y-8">
                            {/* Products Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
                              {rowProducts.map((product, colIndex) => {
                                const index = startIndex + colIndex;
                                const isFirstLoad = index < PRODUCTS_PER_PAGE;
                                const isNewlyLoaded =
                                  index >= displayedCount - PRODUCTS_PER_PAGE &&
                                  index < displayedCount &&
                                  displayedCount > PRODUCTS_PER_PAGE;
                                const animationDelay = isNewlyLoaded
                                  ? (index -
                                      (displayedCount - PRODUCTS_PER_PAGE)) *
                                    0.03
                                  : isFirstLoad
                                  ? index * 0.03
                                  : 0;

                                return (
                                  <motion.div
                                    key={`${product.id}-${index}`}
                                    id={
                                      index ===
                                      displayedCount - PRODUCTS_PER_PAGE
                                        ? `product-${index}`
                                        : undefined
                                    }
                                    layout
                                    initial={
                                      isNewlyLoaded
                                        ? {
                                            opacity: 0,
                                            y: 30,
                                            scale: 0.95,
                                          }
                                        : false
                                    }
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                      scale: 1,
                                    }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                      delay: animationDelay,
                                      duration: 0.6,
                                      ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    className="product-item h-full"
                                  >
                                    <ProductCard product={product} />
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Offer Banner after this row */}
                            {offerToShow && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="w-full mt-4"
                              >
                                {offerToShow.link_url ? (
                                  <Link href={offerToShow.link_url} className="block">
                                    <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden shadow-lg group">
                                      {/* Shimmer Effect - Continuous */}
                                      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent card-shimmer" />
                                      </div>
                                      {offerToShow.image_url && (
                                        <Image
                                          src={offerToShow.image_url}
                                          alt={offerToShow.title || "Offer"}
                                          fill
                                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      )}
                                      {(offerToShow.title || offerToShow.description) && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent flex items-center p-6 md:p-8 z-0">
                                          <div>
                                            {offerToShow.title && (
                                              <h3 className="text-white font-bold text-xl md:text-2xl mb-2">
                                                {offerToShow.title}
                                              </h3>
                                            )}
                                            {offerToShow.description && (
                                              <p className="text-white/90 text-sm md:text-base max-w-md">
                                                {offerToShow.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Link>
                                ) : (
                                  <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden shadow-lg group">
                                    {/* Shimmer Effect - Continuous */}
                                    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent card-shimmer" />
                                    </div>
                                    {offerToShow.image_url && (
                                      <Image
                                        src={offerToShow.image_url}
                                        alt={offerToShow.title || "Offer"}
                                        fill
                                        className="object-cover"
                                      />
                                    )}
                                    {(offerToShow.title || offerToShow.description) && (
                                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent flex items-center p-6 md:p-8 z-0">
                                        <div>
                                          {offerToShow.title && (
                                            <h3 className="text-white font-bold text-xl md:text-2xl mb-2">
                                              {offerToShow.title}
                                            </h3>
                                          )}
                                          {offerToShow.description && (
                                            <p className="text-white/90 text-sm md:text-base max-w-md">
                                              {offerToShow.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AnimatePresence>

                  {/* Load More Button */}
                  {hasMoreProducts && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-16 lg:mt-20 flex justify-center"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          size="lg"
                          className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                        >
                          {isLoadingMore ? (
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                              <span>Loading...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-lg">
                                Load More Products
                              </span>
                              <motion.div
                                animate={{ y: [0, 4, 0] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                <ChevronDown className="h-5 w-5" />
                              </motion.div>
                            </div>
                          )}
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* End of Products Indicator */}
                  {!hasMoreProducts &&
                    filteredProducts.length > PRODUCTS_PER_PAGE && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-16 lg:mt-20 text-center"
                      >
                        <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-2xl"
                          >
                            ✨
                          </motion.div>
                          <span className="text-green-700 font-semibold text-base">
                            You&apos;ve seen all {filteredProducts.length}{" "}
                            products
                          </span>
                        </div>
                      </motion.div>
                    )}
                </>
              ) : (
                <div className="text-center py-20 lg:py-24 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-700 text-xl font-semibold mb-2">
                      No products found
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      {activeFiltersCount > 0
                        ? "Try adjusting your filters to see more products"
                        : "Check back later for new products"}
                    </p>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
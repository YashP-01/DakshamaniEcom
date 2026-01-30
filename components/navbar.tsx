"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, 
  Menu, 
  X, 
  Search, 
  User, 
  LogOut, 
  ChevronRight,
  Nut,
  UtensilsCrossed,
  Candy,
  Droplet,
  Leaf,
  Package,
  X as XIcon,
  MapPin
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url?: string;
}

interface Category {
  name: string;
  label: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_percentage: number;
  image_url: string;
  category: string;
}

// Category icons mapping
const categoryIcons: Record<string, any> = {
  dry_fruits: Nut,
  masalas: UtensilsCrossed,
  sweets: Candy,
  ghee: Droplet,
  moringa_powder: Leaf,
  other: Package,
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Check authentication status
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true); // Mark auth check as complete
    };
    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true); // Ensure it's marked as checked on auth state change
    });

    return () => subscription.unsubscribe();
  }, []);

  // Scroll detection for navbar hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar at top of page or when scrolling up
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar (only after scrolling past 100px)
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showProductsMenu && !target.closest('.products-menu-container')) {
        setShowProductsMenu(false);
        setHoveredCategory(null);
      }
      if (isSearchExpanded && !target.closest('.search-container')) {
        setIsSearchExpanded(false);
        setSearchResults([]);
      }
    };

    if (showUserMenu || showProductsMenu || isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showProductsMenu, isSearchExpanded]);

  // Handle search
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 0) {
        const supabase = createClient();
        // Only search products with active variants
        const { data: allResults } = await supabase
          .from("products")
          .select(`
            id, 
            name, 
            slug, 
            price, 
            discount_percentage, 
            image_url, 
            category,
            product_variants (
              id,
              is_active
            )
          `)
          .eq("is_active", true)
          .ilike("name", `%${searchQuery}%`)
          .limit(10);
        
        // Filter for products with active variants and clean up nested data
        const cleanedResults = allResults
          ?.filter((product: any) => 
            product.product_variants?.some((v: any) => v.is_active)
          )
          .slice(0, 6)
          .map((product: any) => {
            const { product_variants, ...rest } = product;
            return rest;
          });
        
        setSearchResults(cleanedResults || []);
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    // Check if user has seen welcome popup
    const hasSeenPopup = localStorage.getItem("hasSeenWelcomePopup");
    if (!hasSeenPopup) {
      setTimeout(() => {
        setShowWelcomePopup(true);
        localStorage.setItem("hasSeenWelcomePopup", "true");
      }, 2000);
    }

    // Load offers for hero section
    const loadOffers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (data) setOffers(data);
    };

    // Load categories and products for dropdown menu
    const loadCategories = async () => {
      const supabase = createClient();
      const { data: products } = await supabase
        .from("products")
        .select("id, name, slug, price, discount_percentage, image_url, category")
        .eq("is_active", true)
        .order("name");

      if (products) {
        // Group products by category
        const categoryMap = new Map<string, Product[]>();
        
        products.forEach((product) => {
          if (!categoryMap.has(product.category)) {
            categoryMap.set(product.category, []);
          }
          categoryMap.get(product.category)!.push(product);
        });

        // Convert to category array with labels
        const categoryLabels: Record<string, string> = {
          dry_fruits: "Dry Fruits",
          masalas: "Masalas & Spices",
          sweets: "Sweets",
          ghee: "Ghee",
          moringa_powder: "Moringa Powder",
          other: "Other Products",
        };

        const categoriesList: Category[] = Array.from(categoryMap.entries()).map((entry) => {
          const [name, products] = entry;
          const formattedLabel = name.replace(/_/g, " ").split(" ").map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(" ");
          return {
            name,
            label: categoryLabels[name] || formattedLabel,
            products: products.slice(0, 8), // Limit to 8 products per category
          };
        });

        setCategories(categoriesList);
      }
    };

    loadOffers();
    loadCategories();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <React.Fragment>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-sm shadow-sm border-b border-green-100"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          {/* Single Row: Logo, Navigation, Icons */}
          <div className="flex h-16 md:h-20 items-center justify-between">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-base">D</span>
                </div>
              </motion.div>
              <div className="hidden md:block">
                <h1 className="text-base font-semibold text-green-800 tracking-tight">
                  Dakshamani Naturo Food
                </h1>
              </div>
            </Link>

            {/* Centered Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
              <Link
                href="/"
                className={`relative text-sm font-medium tracking-wide uppercase transition-colors duration-200 ${
                  pathname === "/"
                    ? "text-green-700"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                Home
                {pathname === "/" && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}
              </Link>
              <div
                className="relative products-menu-container"
                onMouseEnter={() => setShowProductsMenu(true)}
                onMouseLeave={() => {
                  setShowProductsMenu(false);
                  setHoveredCategory(null);
                }}
              >
                <Link
                  href="/products"
                  className={`relative text-sm font-medium tracking-wide uppercase transition-colors duration-200 flex items-center space-x-1 ${
                    pathname === "/products" || pathname?.startsWith("/products/")
                      ? "text-green-700"
                      : "text-gray-600 hover:text-green-700"
                  }`}
                >
                  <span>Products</span>
                  <ChevronRight
                    className={`h-3 w-3 transition-transform duration-200 ${
                      showProductsMenu ? "rotate-90" : ""
                    }`}
                  />
                  {(pathname === "/products" || pathname?.startsWith("/products/")) && (
                    <motion.div
                      layoutId="navbar-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30
                      }}
                    />
                  )}
                </Link>


                <AnimatePresence>
                  {showProductsMenu && categories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-2xl border border-gray-100 py-4 z-50 overflow-hidden"
                      style={{ minWidth: "750px", maxWidth: "900px" }}
                    >
                      <div className="flex">
                        {/* Vertical Categories Menu */}
                        <div className="w-64 border-r border-gray-100 bg-gray-50/50 rounded-l-lg">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="font-semibold text-sm text-gray-900">Categories</h3>
                          </div>
                          <div className="py-2">
                            {categories.map((category) => {
                              const IconComponent = categoryIcons[category.name] || Package;
                              const isActive = hoveredCategory === category.name;
                              return (
                                <motion.div
                                  key={category.name}
                                  onMouseEnter={() => setHoveredCategory(category.name)}
                                  className={`mx-2 my-1 px-3 py-2.5 rounded-lg cursor-pointer ${
                                    isActive
                                      ? "bg-white text-gray-900 shadow-sm"
                                      : "text-gray-700"
                                  }`}
                                  whileHover={{ x: 2 }}
                                  transition={{ duration: 0.15, ease: "easeOut" }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <motion.div
                                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                        isActive
                                          ? "bg-gray-100 text-gray-900"
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                      animate={{
                                        backgroundColor: isActive ? "#f3f4f6" : "#e5e7eb",
                                        color: isActive ? "#111827" : "#4b5563"
                                      }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <IconComponent className="h-5 w-5" />
                                    </motion.div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between">
                                      <div>
                                        <p className={`text-sm font-medium ${
                                          isActive ? "text-gray-900" : "text-gray-900"
                                        }`}>
                                          {category.label}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {category.products.length} {category.products.length === 1 ? 'item' : 'items'}
                                        </p>
                                      </div>
                                      <motion.div
                                        animate={{
                                          x: isActive ? 4 : 0,
                                          color: isActive ? "#111827" : "#9ca3af"
                                        }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </motion.div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                          <div className="px-4 pt-2 border-t border-gray-100">
                            <Link
                              href="/products"
                              onClick={() => setShowProductsMenu(false)}
                              className="block py-2.5 text-sm text-gray-900 font-semibold hover:text-gray-700 transition-colors"
                            >
                              Shop All Products →
                            </Link>
                          </div>
                        </div>

                        {/* Products Column */}
                        <div className="flex-1 px-4 bg-white rounded-r-lg">
                          <AnimatePresence mode="wait">
                            {hoveredCategory && (
                              <motion.div
                                key={hoveredCategory}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                              >
                                <div className="px-2 py-3 border-b border-gray-100">
                                  <h3 className="font-semibold text-base text-gray-900">
                                    {categories.find((c) => c.name === hoveredCategory)?.label}
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Browse our premium selection
                                  </p>
                                </div>
                                <div className="py-3 space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar">
                                  {categories
                                    .find((c) => c.name === hoveredCategory)
                                    ?.products.map((product) => {
                                      const finalPrice =
                                        product.discount_percentage > 0
                                          ? product.price * (1 - product.discount_percentage / 100)
                                          : product.price;
                                      return (
                                        <Link
                                          key={product.id}
                                          href={`/products/${product.id}`}
                                          onClick={() => {
                                            setShowProductsMenu(false);
                                            setHoveredCategory(null);
                                          }}
                                        >
                                          <motion.div
                                            initial={{ backgroundColor: "transparent" }}
                                            whileHover={{ 
                                              x: 4, 
                                              backgroundColor: "#f9fafb",
                                              borderColor: "#e5e7eb"
                                            }}
                                            transition={{ 
                                              duration: 0.15,
                                              ease: "easeOut"
                                            }}
                                            className="flex items-center space-x-3 p-2.5 rounded-lg group border border-transparent"
                                          >
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                                              {product.image_url && (
                                                <Image
                                                  src={product.image_url}
                                                  alt={product.name}
                                                  fill
                                                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors duration-200">
                                                {product.name}
                                              </p>
                                              <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-sm font-bold text-gray-900">
                                                  ₹{finalPrice.toFixed(2)}
                                                </span>
                                                {product.discount_percentage > 0 && (
                                                  <>
                                                    <span className="text-xs text-gray-500 line-through">
                                                      ₹{product.price.toFixed(2)}
                                                    </span>
                                                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                                                      {product.discount_percentage}% OFF
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </motion.div>
                                        </Link>
                                      );
                                    })}
                                </div>
                              </motion.div>
                            )}
                            {!hoveredCategory && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center h-64 text-gray-400"
                              >
                                <div className="text-center">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Package className="h-8 w-8 text-gray-400" />
                                  </div>
                                  <p className="text-sm font-medium mb-1">Browse Categories</p>
                                  <p className="text-xs">Hover over a category to see products</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link
                href="/stores"
                className={`relative text-sm font-medium tracking-wide uppercase transition-colors duration-200 ${
                  pathname === "/stores"
                    ? "text-green-700"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                Stores
                {pathname === "/stores" && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}
              </Link>
              <Link
                href="/about"
                className={`relative text-sm font-medium tracking-wide uppercase transition-colors duration-200 ${
                  pathname === "/about"
                    ? "text-green-700"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                About
                {pathname === "/about" && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}
              </Link>
              <Link
                href="/contact"
                className={`relative text-sm font-medium tracking-wide uppercase transition-colors duration-200 ${
                  pathname === "/contact"
                    ? "text-green-700"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                Contact
                {pathname === "/contact" && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}
              </Link>
            </nav>

            {/* Right Side: Search (Collapsible), Cart, Account */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Collapsible Search */}
              <div className="relative search-container">
                {!isSearchExpanded ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsSearchExpanded(true);
                      setTimeout(() => searchInputRef.current?.focus(), 100);
                    }}
                    className="p-2 text-gray-600 hover:text-green-700 transition-colors"
                  >
                    <Search className="h-5 w-5" />
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "300px", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative"
                  >
                    <Input
                      ref={searchInputRef}
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
                          setIsSearchExpanded(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }
                        if (e.key === "Escape") {
                          setIsSearchExpanded(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }
                      }}
                      className="w-full bg-white border border-green-200 rounded-full py-2 pl-10 pr-10 text-sm focus-visible:ring-1 focus-visible:ring-green-300 focus-visible:border-green-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600"
                      >
                        <XIcon className="h-4 w-4" />
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {isSearchExpanded && (searchResults.length > 0 || searchQuery.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-[60] max-h-96 overflow-y-auto custom-scrollbar"
                    >
                      {searchResults.length > 0 ? (
                        <>
                          {searchResults.map((product) => {
                            const finalPrice = product.discount_percentage > 0
                              ? product.price * (1 - product.discount_percentage / 100)
                              : product.price;
                            return (
                              <Link
                                key={product.id}
                                href={`/products/${product.id}`}
                                onClick={() => {
                                  setIsSearchExpanded(false);
                                  setSearchQuery("");
                                  setSearchResults([]);
                                }}
                              >
                                <motion.div
                                  whileHover={{ x: 4, backgroundColor: "#f9fafb" }}
                                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                                >
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {product.image_url && (
                                      <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {product.name}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-sm font-bold text-gray-900">
                                        ₹{finalPrice.toFixed(2)}
                                      </span>
                                      {product.discount_percentage > 0 && (
                                        <span className="text-xs text-gray-500 line-through">
                                          ₹{product.price.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              </Link>
                            );
                          })}
                          <Link
                            href={`/products?search=${encodeURIComponent(searchQuery)}`}
                            onClick={() => {
                              setIsSearchExpanded(false);
                              setSearchQuery("");
                            }}
                            className="block px-4 py-2 text-sm text-gray-900 font-semibold hover:bg-gray-50 border-t border-gray-100"
                          >
                            View all results for &quot;{searchQuery}&quot; →
                          </Link>
                        </>
                      ) : searchQuery.length > 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="text-sm">No products found</p>
                          <Link
                            href={`/products?search=${encodeURIComponent(searchQuery)}`}
                            onClick={() => setIsSearchExpanded(false)}
                            className="text-xs text-gray-900 hover:underline mt-2 inline-block"
                          >
                            Try searching in all products
                          </Link>
                        </div>
                      ) : (
                        <div className="px-4 py-4 text-center text-gray-400 text-sm">
                          Start typing to search...
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <Link href="/cart" className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </motion.button>
              </Link>

              {/* Account - Always reserve space to prevent layout shift */}
              <div className="flex items-center space-x-2 min-w-[120px] justify-end">
                {authChecked && mounted ? (
                  <>
                    {user ? (
                      <div className="relative user-menu-container">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowUserMenu(!showUserMenu)}
                          className="p-2 text-gray-600 hover:text-green-700 transition-colors"
                        >
                          <User className="h-5 w-5" />
                        </motion.button>
                        {showUserMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                            <Link
                              href="/customer/dashboard"
                              className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              Dashboard
                            </Link>
                            <Link
                              href="/customer/orders"
                              className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              My Orders
                            </Link>
                            <Link
                              href="/customer/addresses"
                              className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              Addresses
                            </Link>
                            <Link
                              href="/customer/returns"
                              className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              Returns & Exchanges
                            </Link>
                            <Link
                              href="/customer/wishlist"
                              className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              Wishlist
                            </Link>
                            <hr className="my-2 border-gray-100" />
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Logout</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Link href="/customer/login">
                          <Button variant="ghost" className="text-gray-600 hover:text-green-700 text-sm">
                            Login
                          </Button>
                        </Link>
                        <Link href="/customer/register">
                          <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">Sign Up</Button>
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  // Placeholder to maintain layout during auth check
                  <div className="h-9 w-9 opacity-0 pointer-events-none" aria-hidden="true">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                className="lg:hidden p-2"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t bg-white shadow-lg fixed top-20 left-0 right-0 z-40"
        >
          <div className="container mx-auto px-4 py-4 space-y-3 bg-white">
            {/* Mobile Search */}
            <div className="mb-4 pb-4 border-b border-green-100">
              <div className="flex items-center space-x-2 border-2 border-green-200 rounded-full px-3 py-2 bg-white">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 flex-1 rounded-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchQuery && searchResults.length > 0 && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((product) => {
                    const finalPrice = product.discount_percentage > 0
                      ? product.price * (1 - product.discount_percentage / 100)
                      : product.price;
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        onClick={() => {
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.image_url && (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <span className="text-sm font-bold text-green-600">
                            ₹{finalPrice.toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <Link
              href="/"
              className={`block py-2 font-medium transition-colors ${
                pathname === "/"
                  ? "text-green-700 font-semibold"
                  : "text-gray-700 hover:text-green-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`block py-2 font-medium transition-colors ${
                pathname === "/products" || pathname?.startsWith("/products/")
                  ? "text-green-700 font-semibold"
                  : "text-gray-700 hover:text-green-600"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Products
            </Link>
            {categories.length > 0 && (
              <div className="pl-4 space-y-2">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    href={`/products?category=${category.name}`}
                    className="block text-sm py-1 text-gray-600 hover:text-green-600"
                    onClick={() => setIsOpen(false)}
                  >
                    {category.label} ({category.products.length})
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/stores"
              className={`block py-2 text-sm font-medium tracking-wide uppercase transition-colors flex items-center space-x-2 ${
                pathname === "/stores"
                  ? "text-green-700 font-semibold"
                  : "text-gray-600 hover:text-green-700"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <MapPin className="h-4 w-4" />
              <span>Stores</span>
            </Link>
            <Link
              href="/about"
              className={`block py-2 text-sm font-medium tracking-wide uppercase transition-colors ${
                pathname === "/about"
                  ? "text-green-700 font-semibold"
                  : "text-gray-600 hover:text-green-700"
              }`}
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`block py-2 text-sm font-medium tracking-wide uppercase transition-colors ${
                pathname === "/contact"
                  ? "text-green-700 font-semibold"
                  : "text-gray-600 hover:text-green-700"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
              {authChecked && mounted && (
                <>
                  {user ? (
                    <>
                      <hr className="my-2" />
                      <Link
                        href="/customer/dashboard"
                        className="block text-gray-700 hover:text-green-700"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/customer/orders"
                        className="block text-gray-700 hover:text-green-700"
                        onClick={() => setIsOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="block w-full text-left text-gray-700 hover:text-green-700"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <hr className="my-2" />
                      <Link
                        href="/customer/login"
                        className="block text-gray-700 hover:text-green-700"
                        onClick={() => setIsOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/customer/register"
                        className="block text-gray-700 hover:text-green-700"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </>
              )}
          </div>
        </motion.div>
      )}

      <Dialog open={showWelcomePopup} onOpenChange={setShowWelcomePopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Dakshamani Naturo Food!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Discover premium dry fruits, masalas, sweets, and natural products.
              Get exclusive offers on your first order!
            </p>
            {offers.length > 0 && (
              <div className="relative h-48 rounded-lg overflow-hidden">
                <Image
                  src={offers[0].image_url}
                  alt={offers[0].title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {offers[0].title}
                    </h3>
                    <p className="text-white text-sm">{offers[0].description}</p>
                  </div>
                </div>
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => setShowWelcomePopup(false)}
            >
              Start Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
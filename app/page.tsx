// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Image from "next/image";
// import Link from "next/link";
// import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Sprout, Shield, Package, Truck } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { createClient } from "@/lib/supabase/client";
// import ProductCard from "@/components/product-card";
// import VerticalCard from "@/components/vertical-card";
// import Navbar from "@/components/navbar";
// import Footer from "@/components/footer";

// interface Offer {
//   id: string;
//   title: string;
//   description: string;
//   image_url: string;
//   link_url?: string;
// }

// interface Product {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   discount_percentage: number;
//   image_url: string;
//   category: string;
//   stock_quantity: number;
// }

// interface VerticalCard {
//   id: string;
//   title: string;
//   description: string | null;
//   media_url: string;
//   media_type: "image" | "video";
//   thumbnail_url: string | null;
//   link_url: string | null;
//   position: "left" | "right";
//   display_order: number;
// }

// export default function HomePage() {
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [verticalCards, setVerticalCards] = useState<VerticalCard[]>([]);
//   const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
//   const [direction, setDirection] = useState(0);
//   const [isPaused, setIsPaused] = useState(false);
//   const [touchStart, setTouchStart] = useState(0);
//   const [touchEnd, setTouchEnd] = useState(0);

//   useEffect(() => {
//     const loadData = async () => {
//       const supabase = createClient();
      
//       // Load offers
//       const { data: offersData } = await supabase
//         .from("offers")
//         .select("*")
//         .eq("is_active", true)
//         .order("display_order");
//       if (offersData) setOffers(offersData);

//       // Load homepage showcase products
//       // Try to load products with homepage showcase, fallback to featured products if columns don't exist yet
//       let productsData;
      
//       try {
//         // Load products with variants, then filter
//         const { data: allProducts, error } = await supabase
//           .from("products")
//           .select(`
//             *,
//             product_variants (
//               id,
//               is_active
//             )
//           `)
//           .eq("is_active", true)
//           .eq("show_on_homepage", true)
//           .order("homepage_display_order", { ascending: true })
//           .order("created_at", { ascending: false })
//           .limit(20); // Get more to filter
        
//         if (error && error.code === '42703') {
//           // Column doesn't exist yet, fallback
//           const { data: fallbackData } = await supabase
//             .from("products")
//             .select(`
//               *,
//               product_variants (
//                 id,
//                 is_active
//               )
//             `)
//             .eq("is_active", true)
//             .limit(20)
//             .order("created_at", { ascending: false });
          
//           productsData = fallbackData?.filter((p: any) => 
//             p.product_variants?.some((v: any) => v.is_active)
//           ).slice(0, 8);
//         } else {
//           productsData = allProducts?.filter((p: any) => 
//             p.product_variants?.some((v: any) => v.is_active)
//           ).slice(0, 8);
//         }
//       } catch (err: any) {
//         // Schema cache not updated yet, use fallback
//         const { data: fallbackData } = await supabase
//           .from("products")
//           .select(`
//             *,
//             product_variants (
//               id,
//               is_active
//             )
//           `)
//           .eq("is_active", true)
//           .limit(20)
//           .order("created_at", { ascending: false });
        
//         productsData = fallbackData?.filter((p: any) => 
//           p.product_variants?.some((v: any) => v.is_active)
//         ).slice(0, 8);
//       }
      
//       if (productsData) {
//         // Clean up nested variant data
//         const cleanedProducts = productsData.map((product: any) => {
//           const { product_variants, ...rest } = product;
//           return rest;
//         });
//         setProducts(cleanedProducts);
//       }

//       // Load vertical cards
//       try {
//         const { data: cardsData } = await supabase
//           .from("vertical_cards")
//           .select("*")
//           .eq("is_active", true)
//           .order("display_order", { ascending: true });
        
//         if (cardsData) setVerticalCards(cardsData);
//       } catch (err) {
//         // Table might not exist yet
//         console.log("Vertical cards table not available yet");
//       }
//     };

//     loadData();
//   }, []);

//   const nextSlide = useCallback(() => {
//     setDirection(1);
//     setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
//   }, [offers.length]);

//   const prevSlide = useCallback(() => {
//     setDirection(-1);
//     setCurrentOfferIndex((prev) => (prev - 1 + offers.length) % offers.length);
//   }, [offers.length]);

//   const goToSlide = useCallback((index: number) => {
//     setDirection(index > currentOfferIndex ? 1 : -1);
//     setCurrentOfferIndex(index);
//   }, [currentOfferIndex]);

//   useEffect(() => {
//     if (offers.length > 1 && !isPaused) {
//       const interval = setInterval(() => {
//         nextSlide();
//       }, 6000); // 6 seconds per slide
//       return () => clearInterval(interval);
//     }
//   }, [offers.length, isPaused, nextSlide]);

//   // Touch handlers for mobile swipe
//   const handleTouchStart = (e: React.TouchEvent) => {
//     setTouchStart(e.targetTouches[0].clientX);
//   };

//   const handleTouchMove = (e: React.TouchEvent) => {
//     setTouchEnd(e.targetTouches[0].clientX);
//   };

//   const handleTouchEnd = () => {
//     if (!touchStart || !touchEnd) return;
//     const distance = touchStart - touchEnd;
//     const isLeftSwipe = distance > 50;
//     const isRightSwipe = distance < -50;

//     if (isLeftSwipe) {
//       nextSlide();
//     }
//     if (isRightSwipe) {
//       prevSlide();
//     }
//   };

//   // Animation variants for different slide effects
//   const slideVariants = {
//     enter: (direction: number) => ({
//       x: direction > 0 ? "100%" : "-100%",
//       opacity: 0,
//       scale: 0.8,
//     }),
//     center: {
//       zIndex: 1,
//       x: 0,
//       opacity: 1,
//       scale: 1,
//     },
//     exit: (direction: number) => ({
//       zIndex: 0,
//       x: direction < 0 ? "100%" : "-100%",
//       opacity: 0,
//       scale: 0.8,
//     }),
//   };

//   const imageVariants = {
//     enter: { scale: 1.2, opacity: 0 },
//     center: { 
//       scale: 1,
//       opacity: 1,
//       transition: {
//         scale: { duration: 1.5, ease: "easeOut" },
//         opacity: { duration: 0.8 }
//       }
//     },
//     exit: { scale: 1.1, opacity: 0 }
//   };

//   const contentVariants = {
//     enter: { 
//       x: -100, 
//       opacity: 0,
//       y: 50
//     },
//     center: { 
//       x: 0, 
//       opacity: 1,
//       y: 0,
//       transition: {
//         type: "spring",
//         stiffness: 100,
//         damping: 15,
//         delay: 0.5
//       }
//     },
//     exit: { 
//       x: 100, 
//       opacity: 0,
//       y: -50
//     }
//   };

//   return (
//     <div className="min-h-screen">
//       <Navbar />
//       <div className="pt-24 md:pt-28">
//         {/* Full-Screen Hero Section with Animated Banners */}
//         <section 
//           className="relative h-screen w-full overflow-hidden"
//           onMouseEnter={() => setIsPaused(true)}
//           onMouseLeave={() => setIsPaused(false)}
//           onTouchStart={handleTouchStart}
//           onTouchMove={handleTouchMove}
//           onTouchEnd={handleTouchEnd}
//         >
//           {offers.length > 0 ? (
//             <>
//               <AnimatePresence mode="wait" custom={direction}>
//                 <motion.div
//                   key={currentOfferIndex}
//                   custom={direction}
//                   variants={slideVariants}
//                   initial="enter"
//                   animate="center"
//                   exit="exit"
//                   transition={{
//                     x: { type: "spring", stiffness: 300, damping: 30 },
//                     opacity: { duration: 0.4 },
//                     scale: { duration: 0.6 }
//                   }}
//                   className="absolute inset-0"
//                 >
//                   {/* Background Image with Zoom Animation */}
//                   <motion.div
//                     variants={imageVariants}
//                     initial="enter"
//                     animate="center"
//                     exit="exit"
//                     className="absolute inset-0"
//                   >
//                     <Image
//                       src={offers[currentOfferIndex].image_url}
//                       alt={offers[currentOfferIndex].title}
//                       fill
//                       className="object-cover"
//                       priority
//                       quality={100}
//                       sizes="100vw"
//                     />
//                   </motion.div>

//                   {/* Animated Gradient Overlay */}
//                   <motion.div 
//                     className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     transition={{ duration: 0.6 }}
//                   />
                  
//                   {/* Animated Particles Effect */}
//                   <div className="absolute inset-0 overflow-hidden">
//                     {[...Array(20)].map((_, i) => {
//                       const randomX = Math.random() * 100;
//                       const randomY = Math.random() * 100;
//                       const randomDelay = Math.random() * 5;
//                       const randomDuration = Math.random() * 10 + 10;
//                       return (
//                         <motion.div
//                           key={i}
//                           className="absolute w-2 h-2 bg-white/20 rounded-full"
//                           initial={{
//                             x: `${randomX}%`,
//                             y: `${randomY}%`,
//                           }}
//                           animate={{
//                             y: [`${randomY}%`, `${randomY + 120}%`],
//                             x: [
//                               `${randomX}%`,
//                               `${Math.max(0, randomX - 10)}%`,
//                               `${Math.min(100, randomX + 10)}%`,
//                             ],
//                             opacity: [0, 1, 0.5, 0],
//                           }}
//                           transition={{
//                             duration: randomDuration,
//                             repeat: Infinity,
//                             delay: randomDelay,
//                             ease: "linear",
//                           }}
//                         />
//                       );
//                     })}
//                   </div>

//                   {/* Content */}
//                   <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px] h-full flex items-center relative z-10">
//                     <AnimatePresence mode="wait">
//                       <motion.div
//                         key={`content-${currentOfferIndex}`}
//                         variants={contentVariants}
//                         initial="enter"
//                         animate="center"
//                         exit="exit"
//                         className="max-w-3xl text-white"
//                       >
//                         <motion.h1 
//                           className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight"
//                           initial={{ opacity: 0, y: 30 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           transition={{ delay: 0.7, duration: 0.8 }}
//                         >
//                           {offers[currentOfferIndex].title}
//                         </motion.h1>
//                         <motion.p 
//                           className="text-xl md:text-2xl mb-10 text-gray-200 leading-relaxed"
//                           initial={{ opacity: 0, y: 20 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           transition={{ delay: 0.9, duration: 0.8 }}
//                         >
//                           {offers[currentOfferIndex].description}
//                         </motion.p>
//                         <motion.div
//                           initial={{ opacity: 0, scale: 0.9 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
//                         >
//                           <Link href={offers[currentOfferIndex].link_url || "/products"}>
//                             <Button 
//                               size="lg" 
//                               className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
//                             >
//                               Shop Now <ArrowRight className="ml-2 h-6 w-6" />
//                             </Button>
//                           </Link>
//                         </motion.div>
//                       </motion.div>
//                     </AnimatePresence>
//                   </div>

//                   {/* Progress Bar */}
//                   {offers.length > 1 && !isPaused && (
//                     <motion.div
//                       className="absolute bottom-0 left-0 h-1 bg-green-500 z-20"
//                       initial={{ width: 0 }}
//                       animate={{ width: "100%" }}
//                       transition={{ duration: 6, ease: "linear" }}
//                       key={currentOfferIndex}
//                     />
//                   )}
//                 </motion.div>
//               </AnimatePresence>

//               {/* Navigation Arrows */}
//               {offers.length > 1 && (
//                 <>
//                   <button
//                     onClick={prevSlide}
//                     className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 group"
//                     aria-label="Previous slide"
//                   >
//                     <ChevronLeft className="h-8 w-8 text-white" />
//                   </button>
//                   <button
//                     onClick={nextSlide}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 group"
//                     aria-label="Next slide"
//                   >
//                     <ChevronRight className="h-8 w-8 text-white" />
//                   </button>

//                   {/* Play/Pause Button */}
//                   <button
//                     onClick={() => setIsPaused(!isPaused)}
//                     className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-300"
//                     aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
//                   >
//                     {isPaused ? (
//                       <Play className="h-5 w-5 text-white" />
//                     ) : (
//                       <Pause className="h-5 w-5 text-white" />
//                     )}
//                   </button>
//                 </>
//               )}

//               {/* Slide Indicators */}
//               {offers.length > 1 && (
//                 <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
//                   {offers.map((_, index) => (
//                     <button
//                       key={index}
//                       onClick={() => goToSlide(index)}
//                       className="group relative"
//                       aria-label={`Go to slide ${index + 1}`}
//                     >
//                       <motion.div
//                         className={`h-2 rounded-full transition-all duration-300 ${
//                           index === currentOfferIndex
//                             ? "w-10 bg-white"
//                             : "w-2 bg-white/50 hover:bg-white/75"
//                         }`}
//                         whileHover={{ scale: 1.2 }}
//                         whileTap={{ scale: 0.9 }}
//                       >
//                         {index === currentOfferIndex && (
//                           <motion.div
//                             className="h-full bg-green-400 rounded-full"
//                             layoutId="activeIndicator"
//                             transition={{ type: "spring", stiffness: 500, damping: 30 }}
//                           />
//                         )}
//                       </motion.div>
//                     </button>
//                   ))}
//                 </div>
//               )}

//               {/* Slide Counter */}
//               {offers.length > 1 && (
//                 <div className="absolute bottom-8 right-8 z-20 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
//                   {currentOfferIndex + 1} / {offers.length}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="h-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center">
//               <motion.div 
//                 className="text-center text-white px-4"
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.8 }}
//               >
//                 <h1 className="text-6xl md:text-7xl font-extrabold mb-6">
//                   Dakshamani Naturo Food
//                 </h1>
//                 <p className="text-2xl mb-10 text-gray-100">
//                   Premium Dry Fruits, Masalas & Natural Products
//                 </p>
//                 <Link href="/products">
//                   <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl hover:scale-105 transition-all">
//                     Explore Products <ArrowRight className="ml-2 h-6 w-6" />
//                   </Button>
//                 </Link>
//               </motion.div>
//             </div>
//           )}
//         </section>

//         {/* Authenticity Journey Section */}
//         <section className="py-20 bg-gradient-to-b from-white to-gray-50">
//           <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.6 }}
//               className="text-center mb-16"
//             >
//               <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//                 Our Journey to Your Table
//               </h2>
//               <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
//                 From traditional sourcing to modern quality standards, every step is carefully crafted 
//                 to bring you the purest, freshest natural products with authentic flavors.
//               </p>
//             </motion.div>

//             <div className="relative">
//               {/* Connection Line */}
//               <div className="hidden md:block absolute top-16 left-0 right-0 h-1 z-0">
//                 <div className="relative h-full">
//                   <motion.div
//                     className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 via-green-500 to-orange-500"
//                     initial={{ width: 0 }}
//                     whileInView={{ width: "100%" }}
//                     viewport={{ once: true }}
//                     transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
//                   />
//                 </div>
//               </div>

//               {/* Journey Steps */}
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 relative z-10">
//                 {[
//                   {
//                     icon: Sprout,
//                     title: "Sourcing",
//                     shortDesc: "Premium ingredients from certified organic farms",
//                     longDesc: "We partner with trusted farmers across India, ensuring sustainable farming practices, fair trade, and the highest quality raw materials.",
//                     color: "green",
//                     delay: 0.1,
//                   },
//                   {
//                     icon: Shield,
//                     title: "Quality",
//                     shortDesc: "Rigorous testing and certification standards",
//                     longDesc: "Every batch undergoes comprehensive quality checks, nutritional analysis, and meets FSSAI standards. We guarantee purity and authenticity.",
//                     color: "yellow",
//                     delay: 0.2,
//                   },
//                   {
//                     icon: Package,
//                     title: "Processing",
//                     shortDesc: "Traditional methods preserving natural goodness",
//                     longDesc: "Cold processing techniques maintain nutritional value and authentic flavors. No artificial preservatives, just pure, natural products.",
//                     color: "green",
//                     delay: 0.3,
//                   },
//                   {
//                     icon: Truck,
//                     title: "Your Doorstep",
//                     shortDesc: "Fresh, pure products delivered with care",
//                     longDesc: "Fast delivery in hygienic packaging ensures maximum freshness and nutritional value reaches your table.",
//                     color: "orange",
//                     delay: 0.4,
//                   },
//                 ].map((step, index) => (
//                   <motion.div
//                     key={step.title}
//                     initial={{ opacity: 0, y: 30 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     viewport={{ once: true }}
//                     transition={{ duration: 0.6, delay: step.delay }}
//                     className="flex flex-col items-center text-center"
//                   >
//                     {/* Icon Circle */}
//                     <motion.div
//                       className={`relative mb-6 w-20 h-20 rounded-full flex items-center justify-center bg-white shadow-lg border-4 ${
//                         step.color === "green"
//                           ? "border-green-500"
//                           : step.color === "yellow"
//                           ? "border-yellow-500"
//                           : "border-orange-500"
//                       }`}
//                       whileHover={{ scale: 1.1, rotate: 5 }}
//                       transition={{ type: "spring", stiffness: 300 }}
//                     >
//                       <step.icon
//                         className={`h-10 w-10 ${
//                           step.color === "green"
//                             ? "text-green-600"
//                             : step.color === "yellow"
//                             ? "text-yellow-600"
//                             : "text-orange-600"
//                         }`}
//                       />
//                       {/* Pulse Animation */}
//                       <motion.div
//                         className={`absolute inset-0 rounded-full border-4 ${
//                           step.color === "green"
//                             ? "border-green-500"
//                             : step.color === "yellow"
//                             ? "border-yellow-500"
//                             : "border-orange-500"
//                         }`}
//                         animate={{
//                           scale: [1, 1.3, 1],
//                           opacity: [0.5, 0, 0.5],
//                         }}
//                         transition={{
//                           duration: 2,
//                           repeat: Infinity,
//                           ease: "easeInOut",
//                         }}
//                       />
//                     </motion.div>

//                     {/* Content */}
//                     <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
//                       {step.title}
//                     </h3>
//                     <p className="text-gray-700 font-medium mb-3 text-sm md:text-base">
//                       {step.shortDesc}
//                     </p>
//                     <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
//                       {step.longDesc}
//                     </p>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Additional Trust Indicators */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.6, delay: 0.6 }}
//               className="mt-16 pt-12 border-t border-gray-200"
//             >
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//                 {[
//                   { label: "Certified Organic", value: "100%" },
//                   { label: "Quality Tested", value: "100%" },
//                   { label: "Fresh Delivery", value: "24-48hrs" },
//                   { label: "Happy Customers", value: "10K+" },
//                 ].map((stat, index) => (
//                   <motion.div
//                     key={stat.label}
//                     initial={{ opacity: 0, scale: 0.9 }}
//                     whileInView={{ opacity: 1, scale: 1 }}
//                     viewport={{ once: true }}
//                     transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
//                   >
//                     <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
//                       {stat.value}
//                     </div>
//                     <div className="text-sm md:text-base text-gray-600">
//                       {stat.label}
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           </div>
//         </section>

//         {/* Featured Products with Vertical Cards */}
//         <section className="py-16">
//           <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
//             <div className="flex justify-between items-center mb-12">
//               <motion.h2
//                 initial={{ opacity: 0, x: -20 }}
//                 whileInView={{ opacity: 1, x: 0 }}
//                 viewport={{ once: true }}
//                 className="text-3xl font-bold"
//               >
//                 Featured Products
//               </motion.h2>
//               <Link href="/products">
//                 <Button variant="outline">
//                   View All <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </Link>
//             </div>

//             {/* Interactive Layout with Vertical Cards */}
//             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//               {/* Left Vertical Card */}
//               {verticalCards.filter(card => card.position === "left").length > 0 && (
//                 <motion.div
//                   className="lg:col-span-2 hidden lg:block"
//                   initial={{ opacity: 0, x: -50 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   viewport={{ once: true }}
//                   transition={{ duration: 0.6 }}
//                 >
//                   {verticalCards
//                     .filter(card => card.position === "left")
//                     .sort((a, b) => a.display_order - b.display_order)
//                     .slice(0, 1)
//                     .map((card) => (
//                       <VerticalCard key={card.id} card={card} />
//                     ))}
//                 </motion.div>
//               )}

//               {/* Products Grid */}
//               <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${
//                 verticalCards.filter(card => card.position === "left").length > 0 
//                   ? "lg:col-span-8" 
//                   : verticalCards.filter(card => card.position === "right").length > 0
//                   ? "lg:col-span-8"
//                   : "lg:col-span-12"
//               }`}>
//                 {products.map((product, index) => (
//                   <motion.div
//                     key={product.id}
//                     initial={{ opacity: 0, y: 20 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     viewport={{ once: true }}
//                     transition={{ delay: index * 0.1 }}
//                   >
//                     <ProductCard product={product} />
//                   </motion.div>
//                 ))}
//               </div>

//               {/* Right Vertical Card */}
//               {verticalCards.filter(card => card.position === "right").length > 0 && (
//                 <motion.div
//                   className="lg:col-span-2 hidden lg:block"
//                   initial={{ opacity: 0, x: 50 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   viewport={{ once: true }}
//                   transition={{ duration: 0.6 }}
//                 >
//                   {verticalCards
//                     .filter(card => card.position === "right")
//                     .sort((a, b) => a.display_order - b.display_order)
//                     .slice(0, 1)
//                     .map((card) => (
//                       <VerticalCard key={card.id} card={card} />
//                     ))}
//                 </motion.div>
//               )}
//             </div>

//             {/* Mobile Vertical Cards - Below Products */}
//             {verticalCards.length > 0 && (
//               <div className="lg:hidden mt-8 space-y-6">
//                 {verticalCards
//                   .sort((a, b) => a.display_order - b.display_order)
//                   .map((card, index) => (
//                     <motion.div
//                       key={card.id}
//                       initial={{ opacity: 0, y: 30 }}
//                       whileInView={{ opacity: 1, y: 0 }}
//                       viewport={{ once: true }}
//                       transition={{ delay: index * 0.2 }}
//                     >
//                       <VerticalCard card={card} />
//                     </motion.div>
//                   ))}
//               </div>
//             )}
//           </div>
//         </section>
//       </div>
//       <Footer />
//     </div>
//   );
// }














"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sprout,
  Shield,
  Package,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url?: string;
}

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

interface VerticalCard {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url: string | null;
  link_url: string | null;
  position: "left" | "right";
  display_order: number;
}

export default function HomePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [verticalCards, setVerticalCards] = useState<VerticalCard[]>([]);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Load offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (offersData) setOffers(offersData);

      // Load homepage showcase products
      // Try to load products with homepage showcase, fallback to featured products if columns don't exist yet
      let productsData;

      try {
        // Load products with variants, then filter
        const { data: allProducts, error } = await supabase
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
          .eq("show_on_homepage", true)
          .order("homepage_display_order", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(20); // Get more to filter

        if (error && error.code === "42703") {
          // Column doesn't exist yet, fallback
          const { data: fallbackData } = await supabase
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
            .limit(20)
            .order("created_at", { ascending: false });

          productsData = fallbackData
            ?.filter((p: any) =>
              p.product_variants?.some((v: any) => v.is_active)
            )
            .slice(0, 8);
        } else {
          productsData = allProducts
            ?.filter((p: any) =>
              p.product_variants?.some((v: any) => v.is_active)
            )
            .slice(0, 8);
        }
      } catch (err: any) {
        // Schema cache not updated yet, use fallback
        const { data: fallbackData } = await supabase
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
          .limit(20)
          .order("created_at", { ascending: false });

        productsData = fallbackData
          ?.filter((p: any) =>
            p.product_variants?.some((v: any) => v.is_active)
          )
          .slice(0, 8);
      }

      if (productsData) {
        // Clean up nested variant data
        const cleanedProducts = productsData.map((product: any) => {
          const { product_variants, ...rest } = product;
          return rest;
        });
        setProducts(cleanedProducts);
      }

      // Load vertical cards
      try {
        const { data: cardsData } = await supabase
          .from("vertical_cards")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (cardsData) setVerticalCards(cardsData);
      } catch (err) {
        // Table might not exist yet
        console.log("Vertical cards table not available yet");
      }
    };

    loadData();
  }, []);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
  }, [offers.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentOfferIndex((prev) => (prev - 1 + offers.length) % offers.length);
  }, [offers.length]);

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentOfferIndex ? 1 : -1);
      setCurrentOfferIndex(index);
    },
    [currentOfferIndex]
  );

  useEffect(() => {
    if (offers.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        nextSlide();
      }, 6000); // 6 seconds per slide
      return () => clearInterval(interval);
    }
  }, [offers.length, isPaused, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // Animation variants for different slide effects
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.8,
    }),
  };

  const imageVariants = {
    enter: { scale: 1.2, opacity: 0 },
    center: {
      scale: 1,
      opacity: 1,
      transition: {
        scale: { duration: 1.5, ease: "easeOut" },
        opacity: { duration: 0.8 },
      },
    },
    exit: { scale: 1.1, opacity: 0 },
  };

  const contentVariants = {
    enter: {
      x: -100,
      opacity: 0,
      y: 50,
    },
    center: {
      x: 0,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.5,
      },
    },
    exit: {
      x: 100,
      opacity: 0,
      y: -50,
    },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-24 md:pt-28">
        {/* Hero Section with Animated Banners */}
        <section
          className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden mt-4 md:mt-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {offers.length > 0 ? (
            <>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentOfferIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.4 },
                    scale: { duration: 0.6 },
                  }}
                  className="absolute inset-0"
                >
                  {/* Background Image with Zoom Animation */}
                  <motion.div
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                  >
                    <Image
                      src={offers[currentOfferIndex].image_url}
                      alt={offers[currentOfferIndex].title}
                      fill
                      className="object-cover"
                      priority
                      quality={100}
                      sizes="100vw"
                    />
                  </motion.div>

                  {/* Animated Gradient Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  />

                  {/* Animated Particles Effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => {
                      const randomX = Math.random() * 100;
                      const randomY = Math.random() * 100;
                      const randomDelay = Math.random() * 5;
                      const randomDuration = Math.random() * 10 + 10;
                      return (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-white/20 rounded-full"
                          initial={{
                            x: `${randomX}%`,
                            y: `${randomY}%`,
                          }}
                          animate={{
                            y: [`${randomY}%`, `${randomY + 120}%`],
                            x: [
                              `${randomX}%`,
                              `${Math.max(0, randomX - 10)}%`,
                              `${Math.min(100, randomX + 10)}%`,
                            ],
                            opacity: [0, 1, 0.5, 0],
                          }}
                          transition={{
                            duration: randomDuration,
                            repeat: Infinity,
                            delay: randomDelay,
                            ease: "linear",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Content */}
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px] h-full flex items-center relative z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`content-${currentOfferIndex}`}
                        variants={contentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="max-w-3xl text-white"
                      >
                        <motion.h1
                          className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7, duration: 0.8 }}
                        >
                          {offers[currentOfferIndex].title}
                        </motion.h1>
                        <motion.p
                          className="text-lg md:text-xl mb-6 text-gray-200 leading-relaxed"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9, duration: 0.8 }}
                        >
                          {offers[currentOfferIndex].description}
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 1.1,
                            type: "spring",
                            stiffness: 200,
                          }}
                        >
                          <Link
                            href={
                              offers[currentOfferIndex].link_url || "/products"
                            }
                          >
                            <Button
                              size="lg"
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 md:px-8 md:py-5 text-base md:text-lg font-semibold shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
                            >
                              Shop Now{" "}
                              <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                            </Button>
                          </Link>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Progress Bar */}
                  {offers.length > 1 && !isPaused && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-green-500 z-20"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 6, ease: "linear" }}
                      key={currentOfferIndex}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {offers.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 group"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-8 w-8 text-white" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 sm:right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 group"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-8 w-8 text-white" />
                  </button>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="absolute top-4 right-4 sm:right-6 md:right-8 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-300"
                    aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
                  >
                    {isPaused ? (
                      <Play className="h-5 w-5 text-white" />
                    ) : (
                      <Pause className="h-5 w-5 text-white" />
                    )}
                  </button>
                </>
              )}

              {/* Slide Indicators */}
              {offers.length > 1 && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
                  {offers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className="group relative"
                      aria-label={`Go to slide ${index + 1}`}
                    >
                      <motion.div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentOfferIndex
                            ? "w-10 bg-white"
                            : "w-2 bg-white/50 hover:bg-white/75"
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {index === currentOfferIndex && (
                          <motion.div
                            className="h-full bg-green-400 rounded-full"
                            layoutId="activeIndicator"
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}
                      </motion.div>
                    </button>
                  ))}
                </div>
              )}

              {/* Slide Counter */}
              {offers.length > 1 && (
                <div className="absolute bottom-8 right-8 z-20 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
                  {currentOfferIndex + 1} / {offers.length}
                </div>
              )}
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center">
              <motion.div
                className="text-center text-white px-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
                  Dakshamani Naturo Food
                </h1>
                <p className="text-lg md:text-xl mb-6 text-gray-100">
                  Premium Dry Fruits, Masalas & Natural Products
                </p>
                <Link href="/products">
                  <Button
                    size="lg"
                    className="bg-white text-green-700 hover:bg-gray-100 text-base md:text-lg px-6 py-4 md:px-8 md:py-5 shadow-xl hover:scale-105 transition-all"
                  >
                    Explore Products{" "}
                    <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          )}
        </section>

        {/* Authenticity Journey Section */}
        <section className="py-16 bg-[#f5f5f0]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {[
                {
                  icon: Sprout,
                  title: "Sourcing",
                  description: "Premium ingredients from certified organic farms",
                },
                {
                  icon: Shield,
                  title: "Quality",
                  description: "Rigorous testing and certification standards",
                },
                {
                  icon: Package,
                  title: "Processing",
                  description: "Traditional methods preserving natural goodness",
                },
                {
                  icon: Truck,
                  title: "Your Doorstep",
                  description: "Fresh, pure products delivered with care",
                },
              ].map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon Circle - Light Green Background */}
                  <div className="mb-5 w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-[#16a34a]" />
                  </div>

                  {/* Title - Bold Green */}
                  <h3 className="text-base font-bold text-[#15803d] mb-2.5 tracking-tight">
                    {step.title}
                  </h3>

                  {/* Description - Gray */}
                  <p className="text-sm text-[#6b7280] leading-relaxed max-w-[220px] font-normal">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products with Vertical Cards */}
        <section className="py-16 bg-[#f5f5f0]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
            <div className="flex justify-between items-center mb-12">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold"
              >
                Featured Products
              </motion.h2>
              <Link href="/products">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Button 
                    variant="outline"
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-300/60 text-gray-700 hover:text-gray-900 hover:bg-white hover:border-gray-400/80 shadow-sm hover:shadow-md transition-all duration-300 px-6 py-2.5 font-medium"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      View All
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Interactive Layout with Vertical Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Vertical Card */}
              {verticalCards.filter((card) => card.position === "left").length >
                0 && (
                <motion.div
                  className="lg:col-span-2 hidden lg:block h-full"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  {verticalCards
                    .filter((card) => card.position === "left")
                    .sort((a, b) => a.display_order - b.display_order)
                    .slice(0, 1)
                    .map((card) => (
                      <div key={card.id} className="relative h-full rounded-lg overflow-hidden shadow-lg group">
                        {/* Shimmer Effect - Continuous */}
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent card-shimmer" />
                        </div>
                        {card.link_url ? (
                          <Link href={card.link_url}>
                            {card.media_type === "video" ? (
                              <video
                                src={card.media_url}
                                poster={card.thumbnail_url || undefined}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <Image
                                src={card.media_url}
                                alt={card.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            {(card.title || card.description) && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 z-0">
                                <div>
                                  {card.title && (
                                    <h3 className="text-white font-bold text-xl mb-2">{card.title}</h3>
                                  )}
                                  {card.description && (
                                    <p className="text-white/90 text-sm">{card.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </Link>
                        ) : (
                          <>
                            {card.media_type === "video" ? (
                              <video
                                src={card.media_url}
                                poster={card.thumbnail_url || undefined}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <Image
                                src={card.media_url}
                                alt={card.title}
                                fill
                                className="object-cover"
                              />
                            )}
                            {(card.title || card.description) && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 z-0">
                                <div>
                                  {card.title && (
                                    <h3 className="text-white font-bold text-xl mb-2">{card.title}</h3>
                                  )}
                                  {card.description && (
                                    <p className="text-white/90 text-sm">{card.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                </motion.div>
              )}

              {/* Products Grid */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  verticalCards.filter((card) => card.position === "left").length > 0 ||
                  verticalCards.filter((card) => card.position === "right").length > 0
                    ? "lg:grid-cols-3"
                    : "lg:grid-cols-4"
                } gap-6 ${
                  verticalCards.filter((card) => card.position === "left")
                    .length > 0
                    ? "lg:col-span-10"
                    : verticalCards.filter((card) => card.position === "right")
                        .length > 0
                    ? "lg:col-span-10"
                    : "lg:col-span-12"
                }`}
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {/* Right Vertical Card */}
              {verticalCards.filter((card) => card.position === "right")
                .length > 0 && (
                <motion.div
                  className="lg:col-span-2 hidden lg:block h-full"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  {verticalCards
                    .filter((card) => card.position === "right")
                    .sort((a, b) => a.display_order - b.display_order)
                    .slice(0, 1)
                    .map((card) => (
                      <div key={card.id} className="relative h-full rounded-lg overflow-hidden shadow-lg group">
                        {/* Shimmer Effect - Continuous */}
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent card-shimmer" />
                        </div>
                        {card.link_url ? (
                          <Link href={card.link_url}>
                            {card.media_type === "video" ? (
                              <video
                                src={card.media_url}
                                poster={card.thumbnail_url || undefined}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <Image
                                src={card.media_url}
                                alt={card.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            {(card.title || card.description) && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 z-0">
                                <div>
                                  {card.title && (
                                    <h3 className="text-white font-bold text-xl mb-2">{card.title}</h3>
                                  )}
                                  {card.description && (
                                    <p className="text-white/90 text-sm">{card.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </Link>
                        ) : (
                          <>
                            {card.media_type === "video" ? (
                              <video
                                src={card.media_url}
                                poster={card.thumbnail_url || undefined}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <Image
                                src={card.media_url}
                                alt={card.title}
                                fill
                                className="object-cover"
                              />
                            )}
                            {(card.title || card.description) && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 z-0">
                                <div>
                                  {card.title && (
                                    <h3 className="text-white font-bold text-xl mb-2">{card.title}</h3>
                                  )}
                                  {card.description && (
                                    <p className="text-white/90 text-sm">{card.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                </motion.div>
              )}
            </div>

            {/* Mobile Vertical Cards - Below Products */}
            {verticalCards.length > 0 && (
              <div className="lg:hidden mt-8 space-y-6">
                {verticalCards
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden shadow-lg group">
                        {/* Shimmer Effect - Continuous */}
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent card-shimmer" />
                        </div>
                        {card.link_url ? (
                          <Link href={card.link_url}>
                            {card.media_type === "video" ? (
                              <video
                                src={card.media_url}
                                poster={card.thumbnail_url || undefined}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <Image
                                src={card.media_url}
                                alt={card.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            {(card.title || card.description) && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 z-0">
                                <div>
                                  {card.title && (
                                    <h3 className="text-white font-bold text-xl mb-2">{card.title}</h3>
                                  )}
                                  {card.description && (
                                    <p className="text-white/90 text-sm">{card.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </Link>
                        ) : (
                          <>
                            {card.media_type === "video" ? (
                              <video
                                src={card.media_url}
                                poster={card.thumbnail_url || undefined}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <Image
                                src={card.media_url}
                                alt={card.title}
                                fill
                                className="object-cover"
                              />
                            )}
                            {(card.title || card.description) && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 z-0">
                                <div>
                                  {card.title && (
                                    <h3 className="text-white font-bold text-xl mb-2">{card.title}</h3>
                                  )}
                                  {card.description && (
                                    <p className="text-white/90 text-sm">{card.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
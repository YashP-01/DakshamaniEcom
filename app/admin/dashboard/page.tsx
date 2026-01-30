// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { Package, Tag, Gift, LogOut, ShoppingBag, LayoutGrid, MessageSquare, MapPin, Phone, FileText, ArrowLeftRight, Printer, TrendingUp, TrendingDown, DollarSign, Users, Activity, Clock, CheckCircle, AlertCircle, BarChart3, Calendar, RefreshCw } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { createClient } from "@/lib/supabase/client";
// import AdminAnalytics from "@/components/admin-analytics";

// interface DashboardStats {
//   totalRevenue: number;
//   todayRevenue: number;
//   totalOrders: number;
//   pendingOrders: number;
//   completedOrders: number;
//   totalProducts: number;
//   activeProducts: number;
//   totalCustomers: number;
//   recentOrders: any[];
//   ordersByStatus: Record<string, number>;
//   revenueGrowth: number;
// }

// interface AnalyticsData {
//   revenueByDate: Array<{ date: string; revenue: number; orders: number }>;
//   categoryPerformance: Array<{ category: string; revenue: number; orders: number; quantity: number }>;
//   topProducts: Array<{ product_id: string; product_name: string; revenue: number; quantity: number; orders: number }>;
//   mostExchanged: Array<{ product_id: string; product_name: string; exchange_count: number }>;
// }

// export default function AdminDashboard() {
//   const router = useRouter();
//   const [authenticated, setAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [analyticsLoading, setAnalyticsLoading] = useState(false);
//   const [dateRange, setDateRange] = useState({
//     start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
//     end: new Date().toISOString().split('T')[0], // today
//   });
//   const [stats, setStats] = useState<DashboardStats>({
//     totalRevenue: 0,
//     todayRevenue: 0,
//     totalOrders: 0,
//     pendingOrders: 0,
//     completedOrders: 0,
//     totalProducts: 0,
//     activeProducts: 0,
//     totalCustomers: 0,
//     recentOrders: [],
//     ordersByStatus: {},
//     revenueGrowth: 0,
//   });
//   const [analytics, setAnalytics] = useState<AnalyticsData>({
//     revenueByDate: [],
//     categoryPerformance: [],
//     topProducts: [],
//     mostExchanged: [],
//   });

//   useEffect(() => {
//     const checkAuth = async () => {
//       const supabase = createClient();
//       const { data: { user } } = await supabase.auth.getUser();

//       if (!user) {
//         router.push("/admin/login");
//         return;
//       }

//       // Check if user is admin
//       const { data: customerData } = await supabase
//         .from("customers")
//         .select("is_admin, is_active")
//         .eq("id", user.id)
//         .single();

//       if (!customerData || !customerData.is_admin || !customerData.is_active) {
//         await supabase.auth.signOut();
//         router.push("/admin/login");
//         return;
//       }

//       setAuthenticated(true);
//       loadDashboardStats();
//     };

//     checkAuth();
//   }, [router]);

//   const loadDashboardStats = async () => {
//     const supabase = createClient();
//     setLoading(true);

//     try {
//       // Get current date ranges
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const yesterday = new Date(today);
//       yesterday.setDate(yesterday.getDate() - 1);
//       const lastMonth = new Date(today);
//       lastMonth.setMonth(lastMonth.getMonth() - 1);

//       // Load orders
//       const { data: allOrders } = await supabase
//         .from("orders")
//         .select("id, order_number, final_amount, order_status, shipping_status, payment_status, created_at")
//         .order("created_at", { ascending: false });

//       // Load today's orders
//       const { data: todayOrders } = await supabase
//         .from("orders")
//         .select("final_amount")
//         .gte("created_at", today.toISOString())
//         .eq("payment_status", "paid");

//       // Load yesterday's orders for growth calculation
//       const { data: yesterdayOrders } = await supabase
//         .from("orders")
//         .select("final_amount")
//         .gte("created_at", yesterday.toISOString())
//         .lt("created_at", today.toISOString())
//         .eq("payment_status", "paid");

//       // Calculate revenue
//       const totalRevenue = allOrders
//         ?.filter(o => o.payment_status === "paid")
//         .reduce((sum, o) => sum + (parseFloat(o.final_amount.toString()) || 0), 0) || 0;

//       const todayRevenue = todayOrders
//         ?.reduce((sum, o) => sum + (parseFloat(o.final_amount.toString()) || 0), 0) || 0;

//       const yesterdayRevenue = yesterdayOrders
//         ?.reduce((sum, o) => sum + (parseFloat(o.final_amount.toString()) || 0), 0) || 0;

//       const revenueGrowth = yesterdayRevenue > 0 
//         ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
//         : (todayRevenue > 0 ? 100 : 0);

//       // Calculate order stats
//       const totalOrders = allOrders?.length || 0;
//       const pendingOrders = allOrders?.filter(o => 
//         o.order_status === "pending" || o.order_status === "confirmed" || o.order_status === "processing"
//       ).length || 0;
//       const completedOrders = allOrders?.filter(o => 
//         o.order_status === "delivered" || o.shipping_status === "delivered"
//       ).length || 0;

//       // Orders by status
//       const ordersByStatus: Record<string, number> = {};
//       allOrders?.forEach(order => {
//         const status = order.order_status || "pending";
//         ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
//       });

//       // Recent orders (last 5)
//       const recentOrders = allOrders?.slice(0, 5) || [];

//       // Load products
//       const { data: products } = await supabase
//         .from("products")
//         .select("id, is_active")
//         .eq("is_active", true);

//       const totalProducts = products?.length || 0;
//       const activeProducts = totalProducts;

//       // Load customers
//       const { count: customersCount } = await supabase
//         .from("customers")
//         .select("*", { count: "exact", head: true })
//         .eq("is_active", true);

//       setStats({
//         totalRevenue,
//         todayRevenue,
//         totalOrders,
//         pendingOrders,
//         completedOrders,
//         totalProducts,
//         activeProducts,
//         totalCustomers: customersCount || 0,
//         recentOrders,
//         ordersByStatus,
//         revenueGrowth,
//       });
//     } catch (error) {
//       console.error("Error loading dashboard stats:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     const supabase = createClient();
//     await supabase.auth.signOut();
//     router.push("/admin/login");
//   };

//   if (!authenticated) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Checking authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   const menuItems = [
//     {
//       title: "Products",
//       description: "Manage products",
//       icon: Package,
//       href: "/admin/products",
//       color: "bg-blue-500",
//     },
//     {
//       title: "Offers",
//       description: "Manage banner offers",
//       icon: Tag,
//       href: "/admin/offers",
//       color: "bg-green-500",
//     },
//     {
//       title: "Vertical Cards",
//       description: "Manage vertical content cards",
//       icon: LayoutGrid,
//       href: "/admin/vertical-cards",
//       color: "bg-indigo-500",
//     },
//     {
//       title: "Coupons",
//       description: "Manage coupon codes",
//       icon: Gift,
//       href: "/admin/coupons",
//       color: "bg-purple-500",
//     },
//     {
//       title: "Orders",
//       description: "View orders",
//       icon: ShoppingBag,
//       href: "/admin/orders",
//       color: "bg-orange-500",
//     },
//     {
//       title: "Print Labels",
//       description: "Print shipping labels",
//       icon: Printer,
//       href: "/admin/labels",
//       color: "bg-cyan-500",
//     },
//     {
//       title: "Reviews",
//       description: "Approve product reviews",
//       icon: MessageSquare,
//       href: "/admin/reviews",
//       color: "bg-pink-500",
//     },
//     {
//       title: "Stores",
//       description: "Manage store locations",
//       icon: MapPin,
//       href: "/admin/stores",
//       color: "bg-teal-500",
//     },
//     {
//       title: "Contact Settings",
//       description: "Manage contact page details",
//       icon: Phone,
//       href: "/admin/contact-settings",
//       color: "bg-cyan-500",
//     },
//     {
//       title: "Invoice Settings",
//       description: "Customize PDF invoice template",
//       icon: FileText,
//       href: "/admin/invoice-settings",
//       color: "bg-emerald-500",
//     },
//     {
//       title: "Exchanges",
//       description: "Manage exchange requests",
//       icon: ArrowLeftRight,
//       href: "/admin/exchanges",
//       color: "bg-violet-500",
//     },
//     {
//       title: "Policy Management",
//       description: "Manage return & exchange policy",
//       icon: FileText,
//       href: "/admin/policy",
//       color: "bg-indigo-500",
//     },
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "delivered":
//         return "bg-green-100 text-green-800";
//       case "pending":
//       case "confirmed":
//         return "bg-yellow-100 text-yellow-800";
//       case "processing":
//       case "shipped":
//         return "bg-blue-100 text-blue-800";
//       case "cancelled":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b sticky top-0 z-10">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
//               <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
//             </div>
//             <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
//               <LogOut className="h-4 w-4" />
//               Logout
//             </Button>
//           </div>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-8">
//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
//           </div>
//         ) : (
//           <>
//             {/* KPI Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               {/* Total Revenue */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.1 }}
//               >
//                 <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
//                   <CardContent className="p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
//                         <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
//                         <div className="flex items-center gap-1 mt-2">
//                           {stats.revenueGrowth >= 0 ? (
//                             <TrendingUp className="h-4 w-4 text-green-500" />
//                           ) : (
//                             <TrendingDown className="h-4 w-4 text-red-500" />
//                           )}
//                           <span className={`text-xs font-medium ${stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
//                             {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth.toFixed(1)}%
//                           </span>
//                           <span className="text-xs text-gray-500">vs yesterday</span>
//                         </div>
//                       </div>
//                       <div className="bg-blue-100 p-3 rounded-full">
//                         <DollarSign className="h-6 w-6 text-blue-600" />
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Today's Revenue */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.2 }}
//               >
//                 <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
//                   <CardContent className="p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-600 mb-1">Today's Revenue</p>
//                         <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
//                         <p className="text-xs text-gray-500 mt-2">From paid orders today</p>
//                       </div>
//                       <div className="bg-green-100 p-3 rounded-full">
//                         <Activity className="h-6 w-6 text-green-600" />
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Total Orders */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.3 }}
//               >
//                 <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
//                   <CardContent className="p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
//                         <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
//                         <div className="flex items-center gap-2 mt-2">
//                           <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
//                             {stats.pendingOrders} pending
//                           </span>
//                           <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
//                             {stats.completedOrders} completed
//                           </span>
//                         </div>
//                       </div>
//                       <div className="bg-orange-100 p-3 rounded-full">
//                         <ShoppingBag className="h-6 w-6 text-orange-600" />
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Products & Customers */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.4 }}
//               >
//                 <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
//                   <CardContent className="p-6">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-medium text-gray-600 mb-1">Products & Customers</p>
//                         <div className="flex items-center gap-4 mt-2">
//                           <div>
//                             <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
//                             <p className="text-xs text-gray-500">Active Products</p>
//                           </div>
//                           <div>
//                             <p className="text-xl font-bold text-gray-900">{stats.totalCustomers}</p>
//                             <p className="text-xs text-gray-500">Customers</p>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="bg-purple-100 p-3 rounded-full">
//                         <Users className="h-6 w-6 text-purple-600" />
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>

//             {/* Recent Orders & Quick Actions */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//               {/* Recent Orders */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.5 }}
//                 className="lg:col-span-2"
//               >
//                 <Card className="h-full">
//                   <CardHeader>
//                     <div className="flex items-center justify-between">
//                       <CardTitle className="flex items-center gap-2">
//                         <Clock className="h-5 w-5" />
//                         Recent Orders
//                       </CardTitle>
//                       <Link href="/admin/orders">
//                         <Button variant="ghost" size="sm">View All</Button>
//                       </Link>
//                     </div>
//                   </CardHeader>
//                   <CardContent>
//                     {stats.recentOrders.length === 0 ? (
//                       <div className="text-center py-8 text-gray-500">
//                         <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
//                         <p>No orders yet</p>
//                       </div>
//                     ) : (
//                       <div className="space-y-3">
//                         {stats.recentOrders.map((order: any) => (
//                           <Link key={order.id} href={`/admin/orders`}>
//                             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
//                               <div className="flex-1">
//                                 <p className="font-medium text-gray-900">Order #{order.order_number || order.id.slice(0, 8)}</p>
//                                 <p className="text-sm text-gray-500">
//                                   {formatCurrency(parseFloat(order.final_amount?.toString() || "0"))} • {new Date(order.created_at).toLocaleDateString()}
//                                 </p>
//                               </div>
//                               <div className="flex items-center gap-2">
//                                 <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.order_status)}`}>
//                                   {order.order_status || "pending"}
//                                 </span>
//                                 {order.payment_status === "paid" ? (
//                                   <CheckCircle className="h-4 w-4 text-green-500" />
//                                 ) : (
//                                   <AlertCircle className="h-4 w-4 text-yellow-500" />
//                                 )}
//                               </div>
//                             </div>
//                           </Link>
//                         ))}
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Quick Actions */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.6 }}
//               >
//                 <Card className="h-full">
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Activity className="h-5 w-5" />
//                       Quick Actions
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-2">
//                       <Link href="/admin/orders">
//                         <Button variant="outline" className="w-full justify-start" size="lg">
//                           <ShoppingBag className="h-4 w-4 mr-2" />
//                           Manage Orders
//                         </Button>
//                       </Link>
//                       <Link href="/admin/products">
//                         <Button variant="outline" className="w-full justify-start" size="lg">
//                           <Package className="h-4 w-4 mr-2" />
//                           Manage Products
//                         </Button>
//                       </Link>
//                       <Link href="/admin/exchanges">
//                         <Button variant="outline" className="w-full justify-start" size="lg">
//                           <ArrowLeftRight className="h-4 w-4 mr-2" />
//                           Exchange Requests
//                         </Button>
//                       </Link>
//                       <Link href="/admin/labels">
//                         <Button variant="outline" className="w-full justify-start" size="lg">
//                           <Printer className="h-4 w-4 mr-2" />
//                           Print Labels
//                         </Button>
//                       </Link>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>

//             {/* Analytics Section */}
//             <AdminAnalytics />

//             {/* All Management Sections */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.7 }}
//             >
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Management Sections</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                     {menuItems.map((item, index) => {
//                       const Icon = item.icon;
//                       return (
//                         <motion.div
//                           key={item.href}
//                           initial={{ opacity: 0, scale: 0.9 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           transition={{ delay: 0.7 + index * 0.05 }}
//                           whileHover={{ scale: 1.02 }}
//                         >
//                           <Link href={item.href}>
//                             <div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer bg-white">
//                               <div className={`${item.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
//                                 <Icon className="h-5 w-5 text-white" />
//                               </div>
//                               <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
//                               <p className="text-sm text-gray-600">{item.description}</p>
//                             </div>
//                           </Link>
//                         </motion.div>
//                       );
//                     })}
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }











"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Tag, Gift, LogOut, ShoppingBag, LayoutGrid, MessageSquare, MapPin, Phone, FileText, ArrowLeftRight, Printer, TrendingUp, TrendingDown, DollarSign, Users, Activity, Clock, CheckCircle, AlertCircle, BarChart3, Calendar, RefreshCw, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalCustomers: number;
  recentOrders: any[];
  ordersByStatus: Record<string, number>;
  revenueGrowth: number;
}

interface AnalyticsData {
  revenueByDate: Array<{ date: string; revenue: number; orders: number }>;
  categoryPerformance: Array<{ category: string; revenue: number; orders: number; quantity: number }>;
  topProducts: Array<{ product_id: string; product_name: string; revenue: number; quantity: number; orders: number }>;
  mostExchanged: Array<{ product_id: string; product_name: string; exchange_count: number }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // today
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalCustomers: 0,
    recentOrders: [],
    ordersByStatus: {},
    revenueGrowth: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenueByDate: [],
    categoryPerformance: [],
    topProducts: [],
    mostExchanged: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Check if user is admin
      const { data: customerData } = await supabase
        .from("customers")
        .select("is_admin, is_active")
        .eq("id", user.id)
        .single();

      if (!customerData || !customerData.is_admin || !customerData.is_active) {
        await supabase.auth.signOut();
        router.push("/admin/login");
        return;
      }

      setAuthenticated(true);
      loadDashboardStats();
    };

    checkAuth();
  }, [router]);

  const loadDashboardStats = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Get current date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      // Load orders
      const { data: allOrders } = await supabase
        .from("orders")
        .select("id, order_number, final_amount, order_status, shipping_status, payment_status, created_at")
        .order("created_at", { ascending: false });

      // Load today's orders
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("final_amount")
        .gte("created_at", today.toISOString())
        .eq("payment_status", "paid");

      // Load yesterday's orders for growth calculation
      const { data: yesterdayOrders } = await supabase
        .from("orders")
        .select("final_amount")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString())
        .eq("payment_status", "paid");

      // Calculate revenue
      const totalRevenue = allOrders
        ?.filter(o => o.payment_status === "paid")
        .reduce((sum, o) => sum + (parseFloat(o.final_amount.toString()) || 0), 0) || 0;

      const todayRevenue = todayOrders
        ?.reduce((sum, o) => sum + (parseFloat(o.final_amount.toString()) || 0), 0) || 0;

      const yesterdayRevenue = yesterdayOrders
        ?.reduce((sum, o) => sum + (parseFloat(o.final_amount.toString()) || 0), 0) || 0;

      const revenueGrowth = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
        : (todayRevenue > 0 ? 100 : 0);

      // Calculate order stats
      const totalOrders = allOrders?.length || 0;
      const pendingOrders = allOrders?.filter(o => 
        o.order_status === "pending" || o.order_status === "confirmed" || o.order_status === "processing"
      ).length || 0;
      const completedOrders = allOrders?.filter(o => 
        o.order_status === "delivered" || o.shipping_status === "delivered"
      ).length || 0;

      // Orders by status
      const ordersByStatus: Record<string, number> = {};
      allOrders?.forEach(order => {
        const status = order.order_status || "pending";
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      });

      // Recent orders (last 5)
      const recentOrders = allOrders?.slice(0, 5) || [];

      // Load products
      const { data: products } = await supabase
        .from("products")
        .select("id, is_active")
        .eq("is_active", true);

      const totalProducts = products?.length || 0;
      const activeProducts = totalProducts;

      // Load customers
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        totalRevenue,
        todayRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts,
        activeProducts,
        totalCustomers: customersCount || 0,
        recentOrders,
        ordersByStatus,
        revenueGrowth,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Products",
      description: "Manage products",
      icon: Package,
      href: "/admin/products",
      color: "bg-blue-500",
    },
    {
      title: "Offers",
      description: "Manage banner offers",
      icon: Tag,
      href: "/admin/offers",
      color: "bg-green-500",
    },
    {
      title: "Vertical Cards",
      description: "Manage vertical content cards",
      icon: LayoutGrid,
      href: "/admin/vertical-cards",
      color: "bg-indigo-500",
    },
    {
      title: "Business Analytics",
      description: "View performance insights",
      icon: BarChart3,
      href: "/admin/dashboard/analytics",
      color: "bg-slate-500",
    },
    {
      title: "Coupons",
      description: "Manage coupon codes",
      icon: Gift,
      href: "/admin/coupons",
      color: "bg-purple-500",
    },
    {
      title: "Orders",
      description: "View orders",
      icon: ShoppingBag,
      href: "/admin/orders",
      color: "bg-orange-500",
    },
    {
      title: "Print Labels",
      description: "Print shipping labels",
      icon: Printer,
      href: "/admin/labels",
      color: "bg-cyan-500",
    },
    {
      title: "Reviews",
      description: "Approve product reviews",
      icon: MessageSquare,
      href: "/admin/reviews",
      color: "bg-pink-500",
    },
    {
      title: "Stores",
      description: "Manage store locations",
      icon: MapPin,
      href: "/admin/stores",
      color: "bg-teal-500",
    },
    {
      title: "Contact Settings",
      description: "Manage contact page details",
      icon: Phone,
      href: "/admin/contact-settings",
      color: "bg-cyan-500",
    },
    {
      title: "Invoice Settings",
      description: "Customize PDF invoice template",
      icon: FileText,
      href: "/admin/invoice-settings",
      color: "bg-emerald-500",
    },
    {
      title: "Exchanges",
      description: "Manage exchange requests",
      icon: ArrowLeftRight,
      href: "/admin/exchanges",
      color: "bg-violet-500",
    },
    {
      title: "Policy Management",
      description: "Manage return & exchange policy",
      icon: FileText,
      href: "/admin/policy",
      color: "bg-indigo-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
      case "confirmed":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-start gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="flex items-center gap-2"
                aria-pressed={isSidebarOpen}
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isSidebarOpen ? "Hide" : "Show"} Sidebar</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar - Management Sections */}
              <aside
                className={`transition-all duration-300 ${
                  isSidebarOpen ? "block lg:col-span-3" : "hidden"
                }`}
              >
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Management Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            whileHover={{ scale: 1.01 }}
                          >
                            <Link href={item.href}>
                              <div className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white flex items-center gap-3">
                                <div className={`${item.color} w-9 h-9 rounded-md flex items-center justify-center`}>
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900 leading-none">{item.title}</h3>
                                  <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </aside>

              {/* Main content */}
              <div className={`${isSidebarOpen ? "lg:col-span-9" : "lg:col-span-12"}`}>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
              {/* Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {stats.revenueGrowth >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-xs font-medium ${stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth.toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-500">vs yesterday</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Today's Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Today's Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-2">From paid orders today</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                            {stats.pendingOrders} pending
                          </span>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                            {stats.completedOrders} completed
                          </span>
                        </div>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full">
                        <ShoppingBag className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Products & Customers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Products & Customers</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div>
                            <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
                            <p className="text-xs text-gray-500">Active Products</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-gray-900">{stats.totalCustomers}</p>
                            <p className="text-xs text-gray-500">Customers</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
                </div>

                {/* Recent Orders & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Orders
                      </CardTitle>
                      <Link href="/admin/orders">
                        <Button variant="ghost" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.recentOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentOrders.map((order: any) => (
                          <Link key={order.id} href={`/admin/orders`}>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">Order #{order.order_number || order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-500">
                                  {formatCurrency(parseFloat(order.final_amount?.toString() || "0"))} • {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                  {order.order_status || "pending"}
                                </span>
                                {order.payment_status === "paid" ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Link href="/admin/orders">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Manage Orders
                        </Button>
                      </Link>
                      <Link href="/admin/products">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <Package className="h-4 w-4 mr-2" />
                          Manage Products
                        </Button>
                      </Link>
                      <Link href="/admin/exchanges">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <ArrowLeftRight className="h-4 w-4 mr-2" />
                          Exchange Requests
                        </Button>
                      </Link>
                      <Link href="/admin/labels">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <Printer className="h-4 w-4 mr-2" />
                          Print Labels
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


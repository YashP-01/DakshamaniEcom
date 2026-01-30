"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Heart,
  RefreshCw,
  Edit,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import OrderTracking from "@/components/order-tracking";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  final_amount: number;
  order_status: string;
  shipping_status: string;
  payment_status: string;
  tracking_number?: string;
  tracking_url?: string;
  shiprocket_shipment_id?: string;
  created_at: string;
  estimated_delivery_date?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  product_image_url?: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/customer/login");
        return;
      }

      // Load customer profile
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();

      setCustomer(customerData);

      // Load all orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);

      // Load order items for all orders
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(order => order.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsData) {
          const itemsMap: Record<string, OrderItem[]> = {};
          itemsData.forEach(item => {
            if (!itemsMap[item.order_id]) {
              itemsMap[item.order_id] = [];
            }
            itemsMap[item.order_id].push(item);
          });
          setOrderItems(itemsMap);
        }
      }

      // Load wishlist count
      const { count: wishlistCountData } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id);

      setWishlistCount(wishlistCountData || 0);

      // Load addresses count
      const { count: addressesCountData } = await supabase
        .from("customer_addresses")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id);

      setAddressesCount(addressesCountData || 0);

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleEditProfile = () => {
    if (customer) {
      setEditFormData({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        phone: customer.phone || "",
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update your profile",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("customers")
        .update({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          phone: editFormData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setCustomer({
        ...customer!,
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        phone: editFormData.phone,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setShowEditDialog(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "confirmed":
      case "processing":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "shipped":
      case "in_transit":
        return <Truck className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "confirmed":
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const ordersInTransit = orders.filter(
    (order) =>
      order.order_status !== "delivered" &&
      order.order_status !== "cancelled" &&
      (order.shipping_status === "shipped" ||
        order.shipping_status === "in_transit" ||
        order.shipping_status === "out_for_delivery")
  );

  const completedOrders = orders.filter((o) => o.order_status === "delivered").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {customer?.first_name || "Customer"}! 👋
              </h1>
              <p className="text-gray-600">{customer?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <ShoppingBag className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Wishlist Items</p>
                      <p className="text-3xl font-bold text-gray-900">{wishlistCount}</p>
                    </div>
                    <div className="bg-pink-100 p-3 rounded-full">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Saved Addresses</p>
                      <p className="text-3xl font-bold text-gray-900">{addressesCount}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/customer/orders">
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500">
                          <CardContent className="p-6 text-center">
                            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Package className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-1">My Orders</h3>
                            <p className="text-sm text-gray-600">View all orders</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>

                    <Link href="/customer/addresses">
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500">
                          <CardContent className="p-6 text-center">
                            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                              <MapPin className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Addresses</h3>
                            <p className="text-sm text-gray-600">Manage addresses</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>

                    <Link href="/customer/returns">
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500">
                          <CardContent className="p-6 text-center">
                            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                              <RefreshCw className="h-6 w-6 text-orange-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Returns</h3>
                            <p className="text-sm text-gray-600">Returns & exchanges</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>

                    <Link href="/customer/wishlist">
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500">
                          <CardContent className="p-6 text-center">
                            <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Heart className="h-6 w-6 text-pink-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Wishlist</h3>
                            <p className="text-sm text-gray-600">Saved products</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              {orders.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Link href="/customer/orders">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <Link key={order.id} href="/customer/orders">
                          <motion.div
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              {getStatusIcon(order.order_status)}
                              <div>
                                <p className="font-semibold">Order #{order.order_number}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₹{order.final_amount.toFixed(2)}</p>
                              <span
                                className={`text-xs px-2 py-1 rounded ${getStatusColor(
                                  order.order_status
                                )}`}
                              >
                                {order.order_status}
                              </span>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Orders in Transit */}
              {ordersInTransit.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-600" />
                      Orders in Transit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {ordersInTransit.slice(0, 3).map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">Order #{order.order_number}</p>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.shipping_status)}`}>
                              {order.shipping_status}
                            </span>
                          </div>
                          {order.tracking_number && (
                            <p className="text-sm text-gray-600">
                              Tracking: {order.tracking_number}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                    <Link href="/products">
                      <Button>Browse Products</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                                {getStatusIcon(order.order_status)}
                                <span className="ml-2">{order.order_status}</span>
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            {order.estimated_delivery_date && (
                              <p className="text-gray-600 text-sm">
                                Estimated delivery: {new Date(order.estimated_delivery_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl mb-2">₹{order.final_amount.toFixed(2)}</p>
                            <Link href="/customer/orders">
                              <Button variant="outline">View Details</Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tracking Tab */}
            <TabsContent value="tracking" className="space-y-4">
              {ordersInTransit.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders in transit</h3>
                    <p className="text-gray-600">All your orders have been delivered or are being prepared</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {ordersInTransit.map((order) => {
                    const items = orderItems[order.id] || [];
                    return (
                      <div key={order.id}>
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle>Order #{order.order_number}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-sm text-gray-600">Order Amount</p>
                                <p className="font-bold text-lg">₹{order.final_amount.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.shipping_status)}`}>
                                  {order.shipping_status}
                                </span>
                              </div>
                            </div>
                            
                            {/* Order Items */}
                            {items.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4" />
                                  Order Items ({items.length})
                                </p>
                                <div className="space-y-2">
                                  {items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                      <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded border border-gray-200 bg-white overflow-hidden">
                                          {item.product_image_url ? (
                                            <img
                                              src={item.product_image_url}
                                              alt={item.product_name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Package className="h-5 w-5 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        {item.quantity > 1 && (
                                          <div className="absolute -top-1 -right-1 bg-gray-700 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                                            {item.quantity}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {item.product_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Qty: {item.quantity} × ₹{item.product_price.toFixed(2)} = ₹{item.subtotal.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <OrderTracking
                          orderId={order.id}
                          shipmentId={order.shiprocket_shipment_id || null}
                          trackingNumber={order.tracking_number || null}
                          orderStatus={order.order_status}
                          shippingStatus={order.shipping_status}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleEditProfile}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-semibold">
                          {customer?.first_name} {customer?.last_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{customer?.email}</p>
                      </div>
                    </div>

                    {customer?.phone && (
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-full">
                          <Phone className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-semibold">{customer.phone}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="bg-orange-100 p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Member Since</p>
                        <p className="font-semibold">
                          {customer?.created_at
                            ? new Date(customer.created_at).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <h4 className="font-semibold mb-4">Account Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                        <p className="text-sm text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{wishlistCount}</p>
                        <p className="text-sm text-gray-600">Wishlist Items</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{addressesCount}</p>
                        <p className="text-sm text-gray-600">Addresses</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={editFormData.first_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, first_name: e.target.value })
                }
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={editFormData.last_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, last_name: e.target.value })
                }
                placeholder="Enter your last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
                placeholder="Enter your phone number"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Email cannot be changed. If you need to update your email, please contact support.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

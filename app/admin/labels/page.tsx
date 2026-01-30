"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, Search, Filter, X, Package, MapPin, Phone, Mail, Calendar, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_full_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  shipping_phone?: string;
  final_amount: number;
  payment_status: string;
  order_status: string;
  shipping_status: string;
  delivery_date: string | null;
  estimated_delivery_date: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  created_at: string;
  admin_notes?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

export default function AdminLabels() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    order_status: "all",
    shipping_status: "all",
    payment_status: "all",
    date_from: "",
    date_to: "",
    min_amount: "",
    max_amount: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [orders, searchQuery, filters]);

  const loadOrders = async () => {
    const supabase = createClient();
    setLoading(true);
    
    // Default to last 2 days to reduce server load
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", twoDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setOrders(data || []);
    
    // Set default date filter to last 2 days
    const today = new Date();
    const twoDaysAgoDate = new Date();
    twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
    
    setFilters(prev => ({
      ...prev,
      date_from: twoDaysAgoDate.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
    }));

    // Load order items for all orders
    if (data && data.length > 0) {
      const orderIds = data.map(order => order.id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("Error loading order items:", itemsError);
      } else {
        // Group items by order_id
        const itemsMap: Record<string, OrderItem[]> = {};
        (itemsData || []).forEach(item => {
          if (!itemsMap[item.order_id]) {
            itemsMap[item.order_id] = [];
          }
          itemsMap[item.order_id].push(item);
        });
        setOrderItems(itemsMap);
      }
    }
    
    setLoading(false);
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...orders];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.customer_phone.includes(query) ||
        order.shipping_full_name.toLowerCase().includes(query) ||
        order.shipping_address.toLowerCase().includes(query) ||
        order.shipping_city.toLowerCase().includes(query) ||
        order.shipping_pincode.includes(query) ||
        (order.tracking_number && order.tracking_number.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.order_status !== "all") {
      filtered = filtered.filter(order => order.order_status === filters.order_status);
    }

    if (filters.shipping_status !== "all") {
      filtered = filtered.filter(order => order.shipping_status === filters.shipping_status);
    }

    if (filters.payment_status !== "all") {
      filtered = filtered.filter(order => order.payment_status === filters.payment_status);
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filtered = filtered.filter(order => new Date(order.created_at) >= fromDate);
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= toDate);
    }

    if (filters.min_amount) {
      const min = parseFloat(filters.min_amount);
      filtered = filtered.filter(order => order.final_amount >= min);
    }

    if (filters.max_amount) {
      const max = parseFloat(filters.max_amount);
      filtered = filtered.filter(order => order.final_amount <= max);
    }

    setFilteredOrders(filtered);
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const clearFilters = () => {
    setFilters({
      order_status: "all",
      shipping_status: "all",
      payment_status: "all",
      date_from: "",
      date_to: "",
      min_amount: "",
      max_amount: "",
    });
    setSearchQuery("");
  };

  const printLabels = () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to print labels",
        variant: "destructive",
      });
      return;
    }

    const selectedOrdersData = filteredOrders.filter(o => selectedOrders.has(o.id));
    
    // Create print window
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const labelsHTML = selectedOrdersData.map(order => {
      const items = orderItems[order.id] || [];
      const itemsList = items.map(item => 
        `${item.quantity}x ${item.product_name}`
      ).join(", ");

      return `
        <div class="label-page">
          <div class="label-content">
            <div class="label-header">
              <div class="label-logo">
                <h2>SHIPPING LABEL</h2>
              </div>
              <div class="label-order-info">
                <div><strong>Order #:</strong> ${order.order_number}</div>
                <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
                ${order.tracking_number ? `<div><strong>Tracking:</strong> ${order.tracking_number}</div>` : ""}
              </div>
            </div>
            
            <div class="label-section">
              <div class="label-section-title">SHIP TO:</div>
              <div class="label-address">
                <div class="label-name">${order.shipping_full_name}</div>
                <div>${order.shipping_address}</div>
                <div>${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</div>
                <div>${order.shipping_country}</div>
                ${order.shipping_phone ? `<div><strong>Phone:</strong> ${order.shipping_phone}</div>` : ""}
              </div>
            </div>

            <div class="label-section">
              <div class="label-section-title">ITEMS:</div>
              <div class="label-items">${itemsList || "No items"}</div>
            </div>

            <div class="label-footer">
              <div class="label-barcode-area">
                <div class="barcode-placeholder">${order.order_number}</div>
              </div>
              <div class="label-notes">
                ${order.admin_notes ? `<div><strong>Notes:</strong> ${order.admin_notes}</div>` : ""}
                <div><strong>Amount:</strong> ₹${order.final_amount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Labels</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 0.5cm;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            
            .label-page {
              width: 100%;
              page-break-after: always;
              margin-bottom: 1cm;
            }
            
            .label-content {
              border: 2px solid #000;
              padding: 15px;
              min-height: 8cm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            
            .label-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            
            .label-logo h2 {
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 2px;
            }
            
            .label-order-info {
              text-align: right;
              font-size: 11px;
            }
            
            .label-order-info div {
              margin-bottom: 3px;
            }
            
            .label-section {
              margin-bottom: 10px;
            }
            
            .label-section-title {
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 5px;
              text-transform: uppercase;
              border-bottom: 1px solid #ccc;
              padding-bottom: 2px;
            }
            
            .label-address {
              font-size: 12px;
              line-height: 1.6;
            }
            
            .label-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 3px;
            }
            
            .label-items {
              font-size: 11px;
              line-height: 1.5;
            }
            
            .label-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            
            .label-barcode-area {
              flex: 1;
            }
            
            .barcode-placeholder {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              font-weight: bold;
              letter-spacing: 2px;
              text-align: center;
              border: 1px solid #000;
              padding: 5px;
              background: #f5f5f5;
            }
            
            .label-notes {
              text-align: right;
              font-size: 11px;
            }
            
            @media print {
              .label-page {
                page-break-after: always;
              }
              
              .label-content {
                border: 2px solid #000;
              }
            }
          </style>
        </head>
        <body>
          ${labelsHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Print Shipping Labels</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedOrders.size} selected / {filteredOrders.length} orders
              </span>
              <Button
                onClick={printLabels}
                disabled={selectedOrders.size === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Selected ({selectedOrders.size})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Orders
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
                {(searchQuery || filters.order_status !== "all" || filters.shipping_status !== "all" || 
                  filters.payment_status !== "all" || filters.date_from || filters.date_to || 
                  filters.min_amount || filters.max_amount) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div>
                <Label htmlFor="search">Search Orders</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by order number, customer name, email, phone, address, pincode, tracking..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="order_status">Order Status</Label>
                    <Select
                      value={filters.order_status}
                      onValueChange={(value) => setFilters({ ...filters, order_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="shipping_status">Shipping Status</Label>
                    <Select
                      value={filters.shipping_status}
                      onValueChange={(value) => setFilters({ ...filters, shipping_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment_status">Payment Status</Label>
                    <Select
                      value={filters.payment_status}
                      onValueChange={(value) => setFilters({ ...filters, payment_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date_from">Date From</Label>
                    <Input
                      id="date_from"
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="date_to">Date To</Label>
                    <Input
                      id="date_to"
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="min_amount">Min Amount (₹)</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      placeholder="0"
                      value={filters.min_amount}
                      onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_amount">Max Amount (₹)</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      placeholder="0"
                      value={filters.max_amount}
                      onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No orders found</p>
                {(searchQuery || filters.order_status !== "all" || filters.shipping_status !== "all" || 
                  filters.payment_status !== "all" || filters.date_from || filters.date_to || 
                  filters.min_amount || filters.max_amount) && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedOrders.size === filteredOrders.length ? "Deselect All" : "Select All"}
                </Button>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Showing {filteredOrders.length} of {orders.length} orders
                    {filters.date_from && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Last 2 days by default - adjust date filters to see more)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {filteredOrders.map((order) => {
                const items = orderItems[order.id] || [];
                const isSelected = selectedOrders.has(order.id);

                return (
                  <Card
                    key={order.id}
                    className={`border-2 cursor-pointer transition-all ${
                      isSelected ? "border-green-500 bg-green-50" : "hover:shadow-md"
                    }`}
                    onClick={() => handleSelectOrder(order.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-gray-500" />
                              <span className="font-semibold">Order #{order.order_number}</span>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium">Customer:</span> {order.customer_name}</p>
                              <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                              <p><span className="font-medium">Email:</span> {order.customer_email}</p>
                              <p className="text-lg font-bold text-gray-900 mt-2">
                                ₹{order.final_amount.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="font-semibold">Shipping Address</span>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="font-medium">{order.shipping_full_name}</p>
                              <p>{order.shipping_address}</p>
                              <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
                              <p>{order.shipping_country}</p>
                              {order.shipping_phone && <p><span className="font-medium">Phone:</span> {order.shipping_phone}</p>}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-4 w-4 text-gray-500" />
                              <span className="font-semibold">Status & Items</span>
                            </div>
                            <div className="text-sm space-y-2">
                              <div className="flex flex-wrap gap-1">
                                <span className={`px-2 py-1 rounded text-xs border ${
                                  order.payment_status === "paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700"
                                }`}>
                                  {order.payment_status.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs border ${
                                  order.order_status === "delivered" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                }`}>
                                  {order.order_status.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs border ${
                                  order.shipping_status === "delivered" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"
                                }`}>
                                  {order.shipping_status.toUpperCase()}
                                </span>
                              </div>
                              {items.length > 0 && (
                                <div>
                                  <p className="font-medium mb-1">Items ({items.length}):</p>
                                  <div className="text-xs text-gray-600 space-y-0.5">
                                    {items.slice(0, 3).map(item => (
                                      <p key={item.id}>
                                        {item.quantity}x {item.product_name}
                                      </p>
                                    ))}
                                    {items.length > 3 && (
                                      <p className="text-gray-500">+{items.length - 3} more</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {order.tracking_number && (
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium">Tracking:</span> {order.tracking_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


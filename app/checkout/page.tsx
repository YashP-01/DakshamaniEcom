"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Truck, MapPin, Phone, Mail, Plus, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useCartStore } from "@/lib/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { findStoreByPincode, StoreLocation } from "@/lib/utils/store-locator";
import { Store, ShoppingBag } from "lucide-react";
import Script from "next/script";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [fulfillmentStore, setFulfillmentStore] = useState<StoreLocation | null>(null);
  const [serveEverywhere, setServeEverywhere] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Prevent hydration mismatch by only calculating totals on client
  const subtotal = mounted ? getTotal() : 0;
  const total = subtotal;

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
    // Note: Test mode is determined by server-side API response

    // Load customer data and addresses
    const loadCustomerData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);

        // Load customer profile
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", user.id)
          .single();

        // Load email from customer profile or user
        const customerEmail = customer?.email || user.email || "";
        
        if (customer) {
          setFormData((prev) => ({
            ...prev,
            name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || prev.name,
            email: customerEmail || prev.email,
            phone: customer.phone || prev.phone,
          }));
        } else if (user.email) {
          // If no customer profile but user exists, set email
          setFormData((prev) => ({
            ...prev,
            email: user.email || prev.email,
          }));
        }

        // Load saved addresses
        const { data: addressesData } = await supabase
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", user.id)
          .eq("is_active", true)
          .order("is_default", { ascending: false });

        if (addressesData && addressesData.length > 0) {
          setAddresses(addressesData);
          const defaultAddress = addressesData.find((a: any) => a.is_default) || addressesData[0];
          if (defaultAddress && !useNewAddress) {
            setSelectedAddressId(defaultAddress.id);
            setFormData((prev) => ({
              ...prev,
              name: defaultAddress.full_name,
              phone: defaultAddress.phone,
              address: defaultAddress.address_line1 + (defaultAddress.address_line2 ? `, ${defaultAddress.address_line2}` : ''),
              city: defaultAddress.city,
              state: defaultAddress.state,
              pincode: defaultAddress.pincode,
              country: defaultAddress.country || "India",
              // Keep email from customer profile
              email: customerEmail || prev.email,
            }));
          }
        }
      }
    };

    // Load stores
    const loadStores = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true);
      
      if (data) {
        setStores(data);
      }

      // Load delivery zone setting
      const { data: mapData } = await supabase
        .from("store_map_settings")
        .select("serve_everywhere")
        .limit(1)
        .single();
      
      if (mapData) {
        setServeEverywhere(mapData.serve_everywhere !== false);
      }
    };

    loadStores();
    loadCustomerData();
  }, [items.length, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for store fulfillment when pincode changes
  useEffect(() => {
    if (formData.pincode && formData.pincode.length >= 6 && stores.length > 0) {
      console.log("Checking pincode:", formData.pincode);
      console.log("Available stores:", stores);
      const store = findStoreByPincode(formData.pincode, stores);
      console.log("Found store:", store);
      setFulfillmentStore(store);
    } else {
      setFulfillmentStore(null);
    }
  }, [formData.pincode, stores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current total from cart store (ensure we have latest values)
      const currentTotal = getTotal();
      const currentSubtotal = currentTotal;
      
      // Get address data - either from formData or selected address
      let addressData = { ...formData };
      
      // Ensure email is populated first - try to get from user if missing
      if (!addressData.email) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: customer } = await supabase
            .from("customers")
            .select("email")
            .eq("id", user.id)
            .single();
          addressData.email = customer?.email || user.email || "";
        }
      }
      
      // If a saved address is selected, get its full details
      if (selectedAddressId && !useNewAddress) {
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
        if (selectedAddress) {
          addressData = {
            name: selectedAddress.full_name || addressData.name,
            email: addressData.email || "", // Keep email we just loaded
            phone: selectedAddress.phone || addressData.phone,
            address: (selectedAddress.address_line1 || "") + (selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''),
            city: selectedAddress.city || addressData.city,
            state: selectedAddress.state || addressData.state,
            pincode: selectedAddress.pincode || addressData.pincode,
            country: selectedAddress.country || addressData.country || "India",
          };
        }
      } else {
        // For new address, ensure country is set
        if (!addressData.country) {
          addressData.country = "India";
        }
      }
      
      // Validate required fields before proceeding
      const missingFields = [];
      if (!addressData.name || addressData.name.trim() === "") missingFields.push("Name");
      if (!addressData.email || addressData.email.trim() === "") missingFields.push("Email");
      if (!addressData.phone || addressData.phone.trim() === "") missingFields.push("Phone");
      if (!addressData.address || addressData.address.trim() === "") missingFields.push("Address");
      if (!addressData.city || addressData.city.trim() === "") missingFields.push("City");
      if (!addressData.state || addressData.state.trim() === "") missingFields.push("State");
      if (!addressData.pincode || addressData.pincode.trim() === "") missingFields.push("Pincode");
      
      if (missingFields.length > 0) {
        alert(`Please complete all required fields: ${missingFields.join(", ")}`);
        setLoading(false);
        return;
      }
      
      // Create Razorpay order
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentTotal,
            orderData: {
              ...addressData,
              items,
              totalAmount: currentSubtotal,
              finalAmount: currentTotal,
              shippingAddressId: selectedAddressId,
            },
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.error || responseData.message || "Failed to create order";
        console.error("Payment API error:", responseData);
        throw new Error(errorMsg);
      }

      const { order, testMode } = responseData;

      if (!order) {
        throw new Error("Failed to create order: No order data received");
      }

      // TEST MODE: Skip Razorpay and directly process order (when no Razorpay keys configured)
      if (testMode) {
        // Use the same addressData we prepared earlier
        // Simulate payment success in test mode
        const verifyResponse = await fetch("/api/payment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: order.id,
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_signature: "test_signature",
            orderData: {
              ...addressData,
              items,
              totalAmount: currentSubtotal,
              finalAmount: currentTotal,
              shippingAddressId: selectedAddressId,
            },
          }),
        });

        const result = await verifyResponse.json();

        if (result.success) {
          clearCart();
          router.push(`/order-success?orderId=${result.orderId}`);
        } else {
          alert(`Order processing failed: ${result.error || "Unknown error"}`);
        }
        setLoading(false);
        return;
      }

      // RAZORPAY MODE: Use Razorpay (Test or Production)
      // Get Razorpay key from environment or use test key
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      
      if (!razorpayKeyId) {
        throw new Error("Razorpay Key ID is not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to your environment variables.");
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Dakshamani Naturo Food",
        description: `Order Payment - ${order.id}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            
            // Get address data - either from formData or selected address
            let addressData = { ...formData };
            
            // Ensure email is populated first - try to get from user if missing
            if (!addressData.email) {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: customer } = await supabase
                  .from("customers")
                  .select("email")
                  .eq("id", user.id)
                  .single();
                addressData.email = customer?.email || user.email || "";
              }
            }
            
            // If a saved address is selected, get its full details
            if (selectedAddressId && !useNewAddress) {
              const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
              if (selectedAddress) {
                addressData = {
                  name: selectedAddress.full_name || addressData.name,
                  email: addressData.email || "", // Keep email we just loaded
                  phone: selectedAddress.phone || addressData.phone,
                  address: (selectedAddress.address_line1 || "") + (selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''),
                  city: selectedAddress.city || addressData.city,
                  state: selectedAddress.state || addressData.state,
                  pincode: selectedAddress.pincode || addressData.pincode,
                  country: selectedAddress.country || addressData.country || "India",
                };
              }
            } else {
              // For new address, ensure country is set
              if (!addressData.country) {
                addressData.country = "India";
              }
            }
            
            // Ensure all required fields are present
            const missingFields = [];
            if (!addressData.name || addressData.name.trim() === "") missingFields.push("Name");
            if (!addressData.email || addressData.email.trim() === "") missingFields.push("Email");
            if (!addressData.phone || addressData.phone.trim() === "") missingFields.push("Phone");
            if (!addressData.address || addressData.address.trim() === "") missingFields.push("Address");
            if (!addressData.city || addressData.city.trim() === "") missingFields.push("City");
            if (!addressData.state || addressData.state.trim() === "") missingFields.push("State");
            if (!addressData.pincode || addressData.pincode.trim() === "") missingFields.push("Pincode");
            
            if (missingFields.length > 0) {
              throw new Error(`Please complete all required fields: ${missingFields.join(", ")}`);
            }
            
            const verifyResponse = await fetch("/api/payment", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            orderData: {
              ...addressData,
              items,
              totalAmount: currentSubtotal,
              finalAmount: currentTotal,
              shippingAddressId: selectedAddressId,
              storeId: fulfillmentStore?.id || null,
            },
              }),
            });

            const result = await verifyResponse.json();

            if (result.success) {
              clearCart();
              router.push(`/order-success?orderId=${result.orderId}`);
            } else {
              alert(`Payment verification failed: ${result.error || "Unknown error"}`);
              setLoading(false);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert(`Payment verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            setLoading(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#22c55e",
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please check your internet connection.");
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response);
        alert(`Payment failed: ${response.error?.description || "Please try again."}`);
        setLoading(false);
      });
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error processing payment";
      alert(`Checkout failed: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-[#f5f5f0]">
        <Navbar />
        <div className="pt-32 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5" />
                        <span>Shipping Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Saved Addresses for Logged-in Users */}
                      {isLoggedIn && addresses.length > 0 && !useNewAddress && (
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center">
                            <Label>Saved Addresses</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setUseNewAddress(true);
                                setSelectedAddressId(null);
                                
                                // Keep email when switching to new address
                                const supabase = createClient();
                                const { data: { user } } = await supabase.auth.getUser();
                                let email = formData.email;
                                if (!email && user) {
                                  const { data: customer } = await supabase
                                    .from("customers")
                                    .select("email")
                                    .eq("id", user.id)
                                    .single();
                                  email = customer?.email || user.email || "";
                                }
                                
                                setFormData({
                                  name: "",
                                  email: email || "",
                                  phone: "",
                                  address: "",
                                  city: "",
                                  state: "",
                                  pincode: "",
                                  country: "India",
                                });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              New Address
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {addresses.map((addr) => (
                              <div
                                key={addr.id}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                  selectedAddressId === addr.id
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={async () => {
                                  setSelectedAddressId(addr.id);
                                  
                                  // Ensure email is loaded
                                  const supabase = createClient();
                                  const { data: { user } } = await supabase.auth.getUser();
                                  let email = formData.email;
                                  if (!email && user) {
                                    const { data: customer } = await supabase
                                      .from("customers")
                                      .select("email")
                                      .eq("id", user.id)
                                      .single();
                                    email = customer?.email || user.email || "";
                                  }
                                  
                                  setFormData({
                                    ...formData,
                                    name: addr.full_name,
                                    phone: addr.phone,
                                    address: addr.address_line1 + (addr.address_line2 ? `, ${addr.address_line2}` : ''),
                                    city: addr.city,
                                    state: addr.state,
                                    pincode: addr.pincode,
                                    country: addr.country || "India",
                                    email: email || formData.email, // Keep email
                                  });
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-semibold">{addr.label}</span>
                                      {addr.is_default && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700">{addr.full_name}</p>
                                    <p className="text-sm text-gray-600">{addr.phone}</p>
                                    <p className="text-sm text-gray-600">
                                      {addr.address_line1}
                                      {addr.address_line2 && `, ${addr.address_line2}`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {addr.city}, {addr.state} {addr.pincode}
                                    </p>
                                  </div>
                                  {selectedAddressId === addr.id && (
                                    <Check className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <Link href="/customer/addresses">
                            <Button type="button" variant="outline" className="w-full">
                              Manage Addresses
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* New Address Form */}
                      {(!isLoggedIn || addresses.length === 0 || useNewAddress) && (
                        <>
                          {isLoggedIn && addresses.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setUseNewAddress(false);
                                const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
                                if (defaultAddress) {
                                  setSelectedAddressId(defaultAddress.id);
                                  setFormData({
                                    ...formData,
                                    name: defaultAddress.full_name,
                                    phone: defaultAddress.phone,
                                    address: defaultAddress.address_line1,
                                    city: defaultAddress.city,
                                    state: defaultAddress.state,
                                    pincode: defaultAddress.pincode,
                                  });
                                }
                              }}
                              className="mb-4"
                            >
                              Use Saved Address
                            </Button>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Full Name *</Label>
                              <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({ ...formData, name: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                  setFormData({ ...formData, email: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone *</Label>
                              <Input
                                id="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) =>
                                  setFormData({ ...formData, phone: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="pincode">Pincode *</Label>
                              <Input
                                id="pincode"
                                required
                                value={formData.pincode}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    pincode: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="address">Address *</Label>
                            <Input
                              id="address"
                              required
                              value={formData.address}
                              onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="city">City *</Label>
                              <Input
                                id="city"
                                required
                                value={formData.city}
                                onChange={(e) =>
                                  setFormData({ ...formData, city: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State *</Label>
                              <Input
                                id="state"
                                required
                                value={formData.state}
                                onChange={(e) =>
                                  setFormData({ ...formData, state: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Fulfillment Status */}
                      {(() => {
                        const hasValidPincode = formData.pincode.length >= 6;
                        const isNotDeliverable = !serveEverywhere && hasValidPincode && !fulfillmentStore;

                        if (isNotDeliverable) {
                          return (
                            <div className="p-3 rounded-lg border bg-red-50 border-red-200 flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-red-700">Not deliverable at your location</p>
                                <p className="text-xs text-red-500 mt-0.5">We don&apos;t currently deliver to pincode {formData.pincode}. Please contact us or try a different address.</p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className={`p-3 rounded-lg border flex items-start gap-3 ${
                            fulfillmentStore 
                              ? "bg-green-50 border-green-200" 
                              : "bg-gray-50 border-gray-200"
                          }`}>
                            {fulfillmentStore ? (
                              <Store className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              <Truck className="h-5 w-5 text-gray-500 mt-0.5" />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${
                                fulfillmentStore ? "text-green-800" : "text-gray-700"
                              }`}>
                                {fulfillmentStore ? "Fulfilled by Store" : "Warehouse Delivery"}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {fulfillmentStore 
                                  ? `Your order will be delivered from: ${fulfillmentStore.name}`
                                  : "Standard shipping from central warehouse."
                                }
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{mounted ? `₹${subtotal.toFixed(2)}` : "₹0.00"}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>{mounted ? `₹${total.toFixed(2)}` : "₹0.00"}</span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={loading || (!serveEverywhere && formData.pincode.length >= 6 && !fulfillmentStore)}
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        {loading ? "Processing..." : "Pay Now"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>
      
      {/* Debug: Stores Data */}
      <div className="container mx-auto px-4 py-8 mt-8 border-t border-gray-200">
        <h3 className="text-sm font-bold text-red-500 mb-2">Debug Info (Remove after fixing)</h3>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
          {JSON.stringify({ 
            userPincode: formData.pincode,
            storesCount: stores.length,
            stores: stores 
          }, null, 2)}
        </pre>
      </div>
    </>
  );
}



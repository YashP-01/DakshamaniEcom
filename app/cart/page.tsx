"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useCartStore } from "@/lib/store/cart-store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotal = useCartStore((state) => state.getTotal);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const subtotal = getTotal();
  const discount = couponDiscount;
  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;

    try {
      const response = await fetch(`/api/coupons?code=${couponCode}`);
      const data = await response.json();

      if (data.coupon) {
        const coupon = data.coupon;
        let discountAmount = 0;

        if (coupon.discount_percentage) {
          discountAmount = (subtotal * coupon.discount_percentage) / 100;
          if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
          }
        } else if (coupon.discount_amount) {
          discountAmount = coupon.discount_amount;
        }

        if (subtotal >= coupon.min_order_amount) {
          setCouponDiscount(discountAmount);
          setAppliedCoupon(coupon);
        } else {
          alert(
            `Minimum order amount is ₹${coupon.min_order_amount}`
          );
        }
      } else {
        alert("Invalid coupon code");
      }
    } catch (error) {
      alert("Error applying coupon");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f0]">
        <Navbar />
        <div className="pt-32 pb-16 md:pt-40 md:pb-20 lg:pt-44 lg:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12 md:py-16"
            >
              <ShoppingBag className="h-20 w-20 sm:h-24 sm:w-24 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 md:mb-8">
                Add some products to get started
              </p>
              <Link href="/products">
                <Button size="lg">
                  Browse Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-32 pb-16 md:pt-40 md:pb-20 lg:pt-44 lg:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">Shopping Cart</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {items.map((item) => {
                const itemPrice = item.discount
                  ? item.price * (1 - item.discount / 100)
                  : item.price;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative w-full sm:w-32 h-32 flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base sm:text-lg mb-2">
                              {item.name}
                            </h3>
                            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                              {item.discount ? (
                                <>
                                  <span className="text-base sm:text-lg font-bold text-green-600">
                                    ₹{(itemPrice * item.quantity).toFixed(2)}
                                  </span>
                                  <span className="text-xs sm:text-sm text-gray-500 line-through">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-base sm:text-lg font-bold text-green-600">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 border rounded-lg">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm sm:text-base text-green-600">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-base sm:text-lg">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {!appliedCoupon && (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 border rounded-lg px-3 py-2 text-sm sm:text-base"
                        />
                        <Button onClick={handleApplyCoupon} className="text-sm sm:text-base">Apply</Button>
                      </div>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs sm:text-sm text-green-700">
                        Coupon {appliedCoupon.code} applied!
                      </p>
                      <button
                        onClick={() => {
                          setCouponCode("");
                          setCouponDiscount(0);
                          setAppliedCoupon(null);
                        }}
                        className="text-xs text-green-600 underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <Link href="/checkout" className="block">
                    <Button className="w-full" size="lg">
                      Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


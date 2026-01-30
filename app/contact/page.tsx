"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageCircle,
  Headphones,
  ShoppingBag,
  Package,
  RefreshCw,
  HelpCircle,
  Store,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ContactSettings {
  primary_phone: string;
  primary_phone_hours: string | null;
  urgent_phone: string | null;
  general_email: string;
  support_email: string | null;
  orders_email: string | null;
  company_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  support_hours_weekdays: string | null;
  support_hours_weekend: string | null;
  live_chat_enabled: boolean;
  live_chat_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_features: string[] | null;
}

export default function ContactPage() {
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "general",
    orderNumber: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadContactSettings();
  }, []);

  const loadContactSettings = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contact_settings")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setContactSettings(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        inquiryType: "general",
        orderNumber: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  const quickActions = [
    {
      icon: ShoppingBag,
      title: "Order Status",
      description: "Track your order or check order details",
      href: "/customer/orders",
      color: "bg-blue-500",
    },
    {
      icon: Package,
      title: "Returns & Exchanges",
      description: "Initiate return or exchange request",
      href: "/customer/orders",
      color: "bg-purple-500",
    },
    {
      icon: Store,
      title: "Store Locator",
      description: "Find our physical store locations",
      href: "/stores",
      color: "bg-green-500",
    },
    {
      icon: HelpCircle,
      title: "FAQs",
      description: "Find answers to common questions",
      href: "#faq",
      color: "bg-orange-500",
    },
  ];

  const inquiryTypes = [
    { value: "general", label: "General Inquiry" },
    { value: "order", label: "Order Related" },
    { value: "product", label: "Product Question" },
    { value: "return", label: "Return/Exchange" },
    { value: "shipping", label: "Shipping & Delivery" },
    { value: "payment", label: "Payment Issue" },
    { value: "complaint", label: "Complaint" },
    { value: "feedback", label: "Feedback" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-40 pb-12 md:pt-48 md:pb-16 lg:pt-56 lg:pb-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {contactSettings?.hero_title || "We're Here to Help"}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 md:mb-8">
              {contactSettings?.hero_subtitle || "Have a question? Need support? Our customer care team is ready to assist you 24/7."}
            </p>
            <div className="flex items-center justify-center gap-4 sm:gap-6 text-green-100 flex-wrap">
              {contactSettings?.hero_features && contactSettings.hero_features.length > 0 ? (
                contactSettings.hero_features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Quick Response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Expert Help</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 md:py-16 lg:py-20">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="h-full"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className={`${action.color} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-base sm:text-lg mb-2">{action.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                      <ArrowRight className="h-4 w-4 mx-auto mt-3 sm:mt-4 text-gray-400" />
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:col-span-1 space-y-4 md:space-y-6"
          >
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  Call Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    {contactSettings?.primary_phone || "+91 XXXXX XXXXX"}
                  </p>
                  {contactSettings?.primary_phone_hours && (
                    <p className="text-sm text-gray-600">{contactSettings.primary_phone_hours}</p>
                  )}
                  {contactSettings?.support_hours_weekdays && (
                    <p className="text-sm text-gray-600">{contactSettings.support_hours_weekdays}</p>
                  )}
                  {contactSettings?.support_hours_weekend && (
                    <p className="text-sm text-gray-600">{contactSettings.support_hours_weekend}</p>
                  )}
                </div>
                {contactSettings?.urgent_phone && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">For urgent queries:</p>
                    <p className="font-semibold">{contactSettings.urgent_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  Email Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactSettings?.general_email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">General Inquiries</p>
                    <a href={`mailto:${contactSettings.general_email}`} className="text-green-600 hover:underline font-semibold">
                      {contactSettings.general_email}
                    </a>
                  </div>
                )}
                {contactSettings?.support_email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer Support</p>
                    <a href={`mailto:${contactSettings.support_email}`} className="text-green-600 hover:underline font-semibold">
                      {contactSettings.support_email}
                    </a>
                  </div>
                )}
                {contactSettings?.orders_email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Orders & Shipping</p>
                    <a href={`mailto:${contactSettings.orders_email}`} className="text-green-600 hover:underline font-semibold">
                      {contactSettings.orders_email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {contactSettings?.live_chat_enabled && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Chat with our support team for instant help
                  </p>
                  {contactSettings.live_chat_url ? (
                    <a href={contactSettings.live_chat_url} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Start Chat
                      </Button>
                    </a>
                  ) : (
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Start Chat
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Visit Our Stores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Find our physical store locations near you
                </p>
                <Link href="/stores">
                  <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                    View Store Locations
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">Send us a Message</CardTitle>
                <p className="text-gray-600 text-xs sm:text-sm mt-2">
                  Fill out the form below and we'll get back to you within 24 hours
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      We've received your message and will respond soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>
                      <div>
                        <Label htmlFor="inquiryType">Inquiry Type *</Label>
                        <select
                          id="inquiryType"
                          required
                          value={formData.inquiryType}
                          onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2 bg-white"
                        >
                          {inquiryTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.inquiryType === "order" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Label htmlFor="orderNumber">Order Number</Label>
                        <Input
                          id="orderNumber"
                          value={formData.orderNumber}
                          onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                          placeholder="Enter your order number (optional)"
                        />
                      </motion.div>
                    )}

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <textarea
                        id="message"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 min-h-[150px] resize-none"
                        placeholder="Please provide details about your inquiry..."
                      />
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-lg py-6">
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By submitting this form, you agree to our privacy policy and terms of service.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          id="faq"
          className="mt-12 md:mt-16 lg:mt-20"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-2">How can I track my order?</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  You can track your order by logging into your account and visiting the Orders section. 
                  You'll receive a tracking number via email once your order ships.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-2">What is your return policy?</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  We offer a 7-day return policy for unused items in original packaging. 
                  Visit the Returns section in your account to initiate a return.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-2">Do you ship internationally?</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Currently, we ship within India. International shipping options are coming soon. 
                  Check our shipping page for more details.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  We accept all major credit/debit cards, UPI, Net Banking, and Cash on Delivery (COD) 
                  for orders above ₹500.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, MapPin, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface ContactSettings {
  id: string;
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

export default function AdminContactSettings() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<ContactSettings | null>(null);

  const [formData, setFormData] = useState({
    primary_phone: "",
    primary_phone_hours: "",
    urgent_phone: "",
    general_email: "",
    support_email: "",
    orders_email: "",
    company_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    support_hours_weekdays: "",
    support_hours_weekend: "",
    live_chat_enabled: true,
    live_chat_url: "",
    hero_title: "",
    hero_subtitle: "",
    hero_features: ["24/7 Support", "Quick Response", "Expert Help"],
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("Error loading contact settings:", error);
      toast({
        title: "Error",
        description: "Failed to load contact settings",
        variant: "destructive",
      });
    } else if (data) {
      setSettings(data);
      setFormData({
        primary_phone: data.primary_phone || "",
        primary_phone_hours: data.primary_phone_hours || "",
        urgent_phone: data.urgent_phone || "",
        general_email: data.general_email || "",
        support_email: data.support_email || "",
        orders_email: data.orders_email || "",
        company_name: data.company_name || "",
        address_line1: data.address_line1 || "",
        address_line2: data.address_line2 || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        country: data.country || "India",
        support_hours_weekdays: data.support_hours_weekdays || "",
        support_hours_weekend: data.support_hours_weekend || "",
        live_chat_enabled: data.live_chat_enabled ?? true,
        live_chat_url: data.live_chat_url || "",
        hero_title: data.hero_title || "",
        hero_subtitle: data.hero_subtitle || "",
        hero_features: (data.hero_features as string[]) || ["24/7 Support", "Quick Response", "Expert Help"],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const supabase = createClient();
    setSaving(true);
    setSaved(false);

    const updateData = {
      primary_phone: formData.primary_phone,
      primary_phone_hours: formData.primary_phone_hours || null,
      urgent_phone: formData.urgent_phone || null,
      general_email: formData.general_email,
      support_email: formData.support_email || null,
      orders_email: formData.orders_email || null,
      company_name: formData.company_name || null,
      address_line1: formData.address_line1 || null,
      address_line2: formData.address_line2 || null,
      city: formData.city || null,
      state: formData.state || null,
      pincode: formData.pincode || null,
      country: formData.country,
      support_hours_weekdays: formData.support_hours_weekdays || null,
      support_hours_weekend: formData.support_hours_weekend || null,
      live_chat_enabled: formData.live_chat_enabled,
      live_chat_url: formData.live_chat_url || null,
      hero_title: formData.hero_title || null,
      hero_subtitle: formData.hero_subtitle || null,
      hero_features: formData.hero_features,
    };

    let error;
    if (settings) {
      // Update existing
      const { error: updateError } = await supabase
        .from("contact_settings")
        .update(updateData)
        .eq("id", settings.id);
      error = updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from("contact_settings")
        .insert(updateData);
      error = insertError;
    }

    if (error) {
      console.error("Error saving contact settings:", error);
      toast({
        title: "Error",
        description: "Failed to save contact settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact settings saved successfully",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadSettings();
    }
    setSaving(false);
  };

  const addHeroFeature = () => {
    setFormData({
      ...formData,
      hero_features: [...formData.hero_features, ""],
    });
  };

  const updateHeroFeature = (index: number, value: string) => {
    const newFeatures = [...formData.hero_features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      hero_features: newFeatures,
    });
  };

  const removeHeroFeature = (index: number) => {
    const newFeatures = formData.hero_features.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      hero_features: newFeatures,
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Contact Settings</h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Phone Numbers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Phone Numbers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primary_phone">Primary Phone *</Label>
                <Input
                  id="primary_phone"
                  value={formData.primary_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_phone: e.target.value })
                  }
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
              <div>
                <Label htmlFor="primary_phone_hours">Primary Phone Hours</Label>
                <Input
                  id="primary_phone_hours"
                  value={formData.primary_phone_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primary_phone_hours: e.target.value,
                    })
                  }
                  placeholder="Mon - Sat: 9:00 AM - 9:00 PM"
                />
              </div>
              <div>
                <Label htmlFor="urgent_phone">Urgent Phone</Label>
                <Input
                  id="urgent_phone"
                  value={formData.urgent_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, urgent_phone: e.target.value })
                  }
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Email Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="general_email">General Email *</Label>
                <Input
                  id="general_email"
                  type="email"
                  value={formData.general_email}
                  onChange={(e) =>
                    setFormData({ ...formData, general_email: e.target.value })
                  }
                  placeholder="info@dakshamani.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={formData.support_email}
                  onChange={(e) =>
                    setFormData({ ...formData, support_email: e.target.value })
                  }
                  placeholder="support@dakshamani.com"
                />
              </div>
              <div>
                <Label htmlFor="orders_email">Orders Email</Label>
                <Input
                  id="orders_email"
                  type="email"
                  value={formData.orders_email}
                  onChange={(e) =>
                    setFormData({ ...formData, orders_email: e.target.value })
                  }
                  placeholder="orders@dakshamani.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="Dakshamani Naturo Food Pvt LTD"
                />
              </div>
              <div>
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line1: e.target.value })
                  }
                  placeholder="Street Address"
                />
              </div>
              <div>
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line2: e.target.value })
                  }
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    placeholder="000000"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="India"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Support Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="support_hours_weekdays">Weekdays Hours</Label>
                <Input
                  id="support_hours_weekdays"
                  value={formData.support_hours_weekdays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      support_hours_weekdays: e.target.value,
                    })
                  }
                  placeholder="Mon - Sat: 9:00 AM - 9:00 PM"
                />
              </div>
              <div>
                <Label htmlFor="support_hours_weekend">Weekend Hours</Label>
                <Input
                  id="support_hours_weekend"
                  value={formData.support_hours_weekend}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      support_hours_weekend: e.target.value,
                    })
                  }
                  placeholder="Sunday: 10:00 AM - 8:00 PM"
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Chat */}
          <Card>
            <CardHeader>
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="live_chat_enabled"
                  checked={formData.live_chat_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      live_chat_enabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="live_chat_enabled">Enable Live Chat</Label>
              </div>
              {formData.live_chat_enabled && (
                <div>
                  <Label htmlFor="live_chat_url">Live Chat URL</Label>
                  <Input
                    id="live_chat_url"
                    value={formData.live_chat_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        live_chat_url: e.target.value,
                      })
                    }
                    placeholder="https://chat.example.com"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hero Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero_title">Hero Title</Label>
                <Input
                  id="hero_title"
                  value={formData.hero_title}
                  onChange={(e) =>
                    setFormData({ ...formData, hero_title: e.target.value })
                  }
                  placeholder="We're Here to Help"
                />
              </div>
              <div>
                <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                <Textarea
                  id="hero_subtitle"
                  value={formData.hero_subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, hero_subtitle: e.target.value })
                  }
                  placeholder="Have a question? Need support? Our customer care team is ready to assist you 24/7."
                  rows={3}
                />
              </div>
              <div>
                <Label>Hero Features</Label>
                <div className="space-y-2 mt-2">
                  {formData.hero_features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) =>
                          updateHeroFeature(index, e.target.value)
                        }
                        placeholder="Feature text"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeHeroFeature(index)}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addHeroFeature}
                    className="w-full"
                  >
                    Add Feature
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}









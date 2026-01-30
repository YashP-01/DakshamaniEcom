"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, FileText, GripVertical, CheckCircle2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ComponentItem {
  id: string;
  enabled: boolean;
  order: number;
  label: string;
  description: string;
}

interface InvoiceTemplateSettings {
  id: string;
  company_name: string;
  company_legal_name: string;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_pincode: string | null;
  company_phone: string | null;
  company_email: string | null;
  font_size_normal: number;
  font_size_large: number;
  font_size_title: number;
  primary_color: { r: number; g: number; b: number };
  page_margin: number;
  components_order: ComponentItem[];
  show_payment_method: boolean;
  show_payment_status: boolean;
  footer_text: string;
}

function SortableItem({ item, onToggle }: { item: ComponentItem; onToggle: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getComponentInfo = (id: string) => {
    switch (id) {
      case "header":
        return { icon: "🏢", shortLabel: "Header" };
      case "invoice_details":
        return { icon: "📄", shortLabel: "Invoice Details" };
      case "bill_to":
        return { icon: "💳", shortLabel: "Bill To" };
      case "ship_to":
        return { icon: "📦", shortLabel: "Ship To" };
      case "items_table":
        return { icon: "📋", shortLabel: "Items Table" };
      case "summary":
        return { icon: "💰", shortLabel: "Summary" };
      case "footer":
        return { icon: "📝", shortLabel: "Footer" };
      default:
        return { icon: "📌", shortLabel: "Component" };
    }
  };

  const componentInfo = getComponentInfo(item.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-5 border-2 rounded-lg bg-white transition-all ${
        item.enabled 
          ? "border-green-300 bg-green-50/30 shadow-sm" 
          : "border-gray-200 bg-gray-50 opacity-60"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="h-6 w-6" />
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0 min-w-[140px]">
        <span className="text-2xl">{componentInfo.icon}</span>
        <span className={`font-semibold text-sm ${item.enabled ? "text-gray-700" : "text-gray-400"}`}>
          {componentInfo.shortLabel}
        </span>
      </div>
      
      <input
        type="checkbox"
        checked={item.enabled}
        onChange={() => onToggle(item.id)}
        className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer flex-shrink-0"
        title={item.enabled ? "Disable component" : "Enable component"}
      />
      
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-lg mb-1 ${item.enabled ? "text-gray-900" : "text-gray-400"}`}>
          {item.label}
        </p>
        <p className={`text-sm ${item.enabled ? "text-gray-600" : "text-gray-400"}`}>
          {item.description}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${
            item.enabled 
              ? "bg-green-100 text-green-700 font-semibold" 
              : "bg-gray-200 text-gray-500"
          }`}>
            {item.enabled ? "✓ Enabled" : "✗ Disabled"}
          </span>
        </div>
      </div>
      
      <div className={`text-sm font-semibold px-3 py-1 rounded flex-shrink-0 ${
        item.enabled 
          ? "bg-green-100 text-green-700" 
          : "bg-gray-100 text-gray-500"
      }`}>
        #{item.order}
      </div>
    </div>
  );
}

export default function AdminInvoiceSettings() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<InvoiceTemplateSettings | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const defaultComponents: ComponentItem[] = [
    { id: "header", enabled: true, order: 1, label: "Company Header", description: "Company name, address, and contact info" },
    { id: "invoice_details", enabled: true, order: 2, label: "Invoice Details", description: "Invoice number, date, payment info" },
    { id: "bill_to", enabled: true, order: 3, label: "Bill To", description: "Billing address information" },
    { id: "ship_to", enabled: true, order: 4, label: "Ship To", description: "Shipping address information" },
    { id: "items_table", enabled: true, order: 5, label: "Items Table", description: "Product list with prices" },
    { id: "summary", enabled: true, order: 6, label: "Order Summary", description: "Subtotal, discounts, tax, total" },
    { id: "footer", enabled: true, order: 7, label: "Footer", description: "Footer text and notes" },
  ];

  const [formData, setFormData] = useState({
    company_name: "",
    company_legal_name: "",
    company_address: "",
    company_city: "",
    company_state: "",
    company_pincode: "",
    company_phone: "",
    company_email: "",
    font_size_normal: 10,
    font_size_large: 12,
    font_size_title: 20,
    primary_color_r: 34,
    primary_color_g: 197,
    primary_color_b: 94,
    page_margin: 20,
    show_payment_method: true,
    show_payment_status: true,
    footer_text: "Thank you for your business!",
  });

  const [components, setComponents] = useState<ComponentItem[]>(defaultComponents);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("invoice_template_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("Error loading invoice settings:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice settings",
        variant: "destructive",
      });
    } else if (data) {
      setSettings(data);
      const color = typeof data.primary_color === 'string' 
        ? JSON.parse(data.primary_color) 
        : data.primary_color || { r: 34, g: 197, b: 94 };
      
      const comps = typeof data.components_order === 'string'
        ? JSON.parse(data.components_order)
        : data.components_order || defaultComponents;

      setFormData({
        company_name: data.company_name || "",
        company_legal_name: data.company_legal_name || "",
        company_address: data.company_address || "",
        company_city: data.company_city || "",
        company_state: data.company_state || "",
        company_pincode: data.company_pincode || "",
        company_phone: data.company_phone || "",
        company_email: data.company_email || "",
        font_size_normal: data.font_size_normal || 10,
        font_size_large: data.font_size_large || 12,
        font_size_title: data.font_size_title || 20,
        primary_color_r: color.r || 34,
        primary_color_g: color.g || 197,
        primary_color_b: color.b || 94,
        page_margin: data.page_margin || 20,
        show_payment_method: data.show_payment_method ?? true,
        show_payment_status: data.show_payment_status ?? true,
        footer_text: data.footer_text || "Thank you for your business!",
      });

      setComponents(comps.length > 0 ? comps : defaultComponents);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const supabase = createClient();

      // Update component orders based on current order
      const updatedComponents = components.map((comp, index) => ({
        ...comp,
        order: index + 1,
      }));

      const updateData: any = {
        company_name: formData.company_name,
        company_legal_name: formData.company_legal_name,
        company_address: formData.company_address || null,
        company_city: formData.company_city || null,
        company_state: formData.company_state || null,
        company_pincode: formData.company_pincode || null,
        company_phone: formData.company_phone || null,
        company_email: formData.company_email || null,
        font_size_normal: formData.font_size_normal,
        font_size_large: formData.font_size_large,
        font_size_title: formData.font_size_title,
        primary_color: {
          r: formData.primary_color_r,
          g: formData.primary_color_g,
          b: formData.primary_color_b,
        },
        page_margin: formData.page_margin,
        components_order: updatedComponents,
        show_payment_method: formData.show_payment_method,
        show_payment_status: formData.show_payment_status,
        footer_text: formData.footer_text,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (settings) {
        result = await supabase
          .from("invoice_template_settings")
          .update(updateData)
          .eq("id", settings.id);
      } else {
        result = await supabase
          .from("invoice_template_settings")
          .insert(updateData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setSaved(true);
      toast({
        title: "Success",
        description: "Invoice template settings saved successfully",
      });

      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error("Error saving invoice settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggleComponent = (id: string) => {
    setComponents((items) =>
      items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-green-100 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Invoice Template Settings</h1>
            <p className="text-gray-600">Customize PDF invoice structure and appearance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="DAKSHAMANI NATURO FOOD"
                />
              </div>
              <div>
                <Label htmlFor="company_legal_name">Legal Name</Label>
                <Input
                  id="company_legal_name"
                  value={formData.company_legal_name}
                  onChange={(e) => setFormData({ ...formData, company_legal_name: e.target.value })}
                  placeholder="Dakshamani Naturo Food Pvt LTD"
                />
              </div>
              <div>
                <Label htmlFor="company_address">Address</Label>
                <Textarea
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  placeholder="Your Company Address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_city">City</Label>
                  <Input
                    id="company_city"
                    value={formData.company_city}
                    onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company_state">State</Label>
                  <Input
                    id="company_state"
                    value={formData.company_state}
                    onChange={(e) => setFormData({ ...formData, company_state: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_pincode">Pincode</Label>
                  <Input
                    id="company_pincode"
                    value={formData.company_pincode}
                    onChange={(e) => setFormData({ ...formData, company_pincode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company_phone">Phone</Label>
                  <Input
                    id="company_phone"
                    value={formData.company_phone}
                    onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company_email">Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* PDF Settings */}
          <Card>
            <CardHeader>
              <CardTitle>PDF Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="font_size_normal">Normal Font</Label>
                  <Input
                    id="font_size_normal"
                    type="number"
                    value={formData.font_size_normal}
                    onChange={(e) => setFormData({ ...formData, font_size_normal: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <Label htmlFor="font_size_large">Large Font</Label>
                  <Input
                    id="font_size_large"
                    type="number"
                    value={formData.font_size_large}
                    onChange={(e) => setFormData({ ...formData, font_size_large: parseInt(e.target.value) || 12 })}
                  />
                </div>
                <div>
                  <Label htmlFor="font_size_title">Title Font</Label>
                  <Input
                    id="font_size_title"
                    type="number"
                    value={formData.font_size_title}
                    onChange={(e) => setFormData({ ...formData, font_size_title: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>
              <div>
                <Label>Primary Color (RGB)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="color_r" className="text-xs">Red</Label>
                    <Input
                      id="color_r"
                      type="number"
                      min="0"
                      max="255"
                      value={formData.primary_color_r}
                      onChange={(e) => setFormData({ ...formData, primary_color_r: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color_g" className="text-xs">Green</Label>
                    <Input
                      id="color_g"
                      type="number"
                      min="0"
                      max="255"
                      value={formData.primary_color_g}
                      onChange={(e) => setFormData({ ...formData, primary_color_g: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color_b" className="text-xs">Blue</Label>
                    <Input
                      id="color_b"
                      type="number"
                      min="0"
                      max="255"
                      value={formData.primary_color_b}
                      onChange={(e) => setFormData({ ...formData, primary_color_b: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div
                  className="mt-2 h-8 rounded border-2"
                  style={{
                    backgroundColor: `rgb(${formData.primary_color_r}, ${formData.primary_color_g}, ${formData.primary_color_b})`,
                  }}
                />
              </div>
              <div>
                <Label htmlFor="page_margin">Page Margin (mm)</Label>
                <Input
                  id="page_margin"
                  type="number"
                  value={formData.page_margin}
                  onChange={(e) => setFormData({ ...formData, page_margin: parseInt(e.target.value) || 20 })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_payment_method"
                    checked={formData.show_payment_method}
                    onChange={(e) => setFormData({ ...formData, show_payment_method: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="show_payment_method">Show Payment Method</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_payment_status"
                    checked={formData.show_payment_status}
                    onChange={(e) => setFormData({ ...formData, show_payment_status: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="show_payment_status">Show Payment Status</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="footer_text">Footer Text</Label>
                <Input
                  id="footer_text"
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  placeholder="Thank you for your business!"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Order */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>PDF Components</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Drag and drop to reorder components. Check/uncheck to enable/disable components in the PDF.
            </p>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {components.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggleComponent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 min-w-[150px]"
          >
            {saving ? (
              "Saving..."
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


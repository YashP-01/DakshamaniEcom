"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Save, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export default function AdminPolicy() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [policy, setPolicy] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "Return & Exchange Policy",
    content: "",
    return_window_days: 7,
    exchange_window_days: 7,
    refund_processing_days: 5,
    exchange_processing_days: 3,
    policy_contact_email: "",
    policy_contact_phone: "",
    eligible_conditions: "",
    non_eligible_conditions: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadPolicy();
    }
  }, [isAuthenticated]);

  const loadPolicy = async () => {
    const supabase = createClient();
    setLoading(true);
    
    const { data, error } = await supabase
      .from("return_exchange_policy")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading policy:", error);
      toast({
        title: "Error",
        description: "Failed to load policy",
        variant: "destructive",
      });
    } else if (data) {
      setPolicy(data);
      setFormData({
        title: data.title || "Return & Exchange Policy",
        content: data.content || "",
        return_window_days: data.return_window_days || 7,
        exchange_window_days: data.exchange_window_days || 7,
        refund_processing_days: data.refund_processing_days || 5,
        exchange_processing_days: data.exchange_processing_days || 3,
        policy_contact_email: data.policy_contact_email || "",
        policy_contact_phone: data.policy_contact_phone || "",
        eligible_conditions: Array.isArray(data.eligible_conditions)
          ? data.eligible_conditions.join("\n")
          : "",
        non_eligible_conditions: Array.isArray(data.non_eligible_conditions)
          ? data.non_eligible_conditions.join("\n")
          : "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const supabase = createClient();

      const updateData: any = {
        title: formData.title,
        content: formData.content,
        return_window_days: formData.return_window_days,
        exchange_window_days: formData.exchange_window_days,
        refund_processing_days: formData.refund_processing_days,
        exchange_processing_days: formData.exchange_processing_days,
        policy_contact_email: formData.policy_contact_email || null,
        policy_contact_phone: formData.policy_contact_phone || null,
        eligible_conditions: formData.eligible_conditions
          .split("\n")
          .filter((line) => line.trim().length > 0),
        non_eligible_conditions: formData.non_eligible_conditions
          .split("\n")
          .filter((line) => line.trim().length > 0),
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let result;
      if (policy) {
        result = await supabase
          .from("return_exchange_policy")
          .update(updateData)
          .eq("id", policy.id);
      } else {
        result = await supabase
          .from("return_exchange_policy")
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
        description: "Policy saved successfully",
      });

      setTimeout(() => setSaved(false), 3000);
      loadPolicy();
    } catch (error: any) {
      console.error("Error saving policy:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save policy",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-purple-100 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Return & Exchange Policy</h1>
            <p className="text-gray-600">Manage policy content and settings</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Policy Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Return & Exchange Policy"
              />
            </div>

            <div>
              <Label htmlFor="content">Policy Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the policy content here..."
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use markdown formatting. Line breaks will be preserved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="return_window">Return Window (days)</Label>
                <Input
                  id="return_window"
                  type="number"
                  value={formData.return_window_days}
                  onChange={(e) =>
                    setFormData({ ...formData, return_window_days: parseInt(e.target.value) || 7 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="exchange_window">Exchange Window (days)</Label>
                <Input
                  id="exchange_window"
                  type="number"
                  value={formData.exchange_window_days}
                  onChange={(e) =>
                    setFormData({ ...formData, exchange_window_days: parseInt(e.target.value) || 7 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="refund_processing">Refund Processing (days)</Label>
                <Input
                  id="refund_processing"
                  type="number"
                  value={formData.refund_processing_days}
                  onChange={(e) =>
                    setFormData({ ...formData, refund_processing_days: parseInt(e.target.value) || 5 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="exchange_processing">Exchange Processing (days)</Label>
                <Input
                  id="exchange_processing"
                  type="number"
                  value={formData.exchange_processing_days}
                  onChange={(e) =>
                    setFormData({ ...formData, exchange_processing_days: parseInt(e.target.value) || 3 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.policy_contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, policy_contact_email: e.target.value })
                  }
                  placeholder="support@example.com"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.policy_contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, policy_contact_phone: e.target.value })
                  }
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="eligible_conditions">Eligible Conditions (one per line)</Label>
              <Textarea
                id="eligible_conditions"
                value={formData.eligible_conditions}
                onChange={(e) =>
                  setFormData({ ...formData, eligible_conditions: e.target.value })
                }
                placeholder="Unused items&#10;Original packaging&#10;Within 7 days of delivery"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="non_eligible_conditions">Non-Eligible Conditions (one per line)</Label>
              <Textarea
                id="non_eligible_conditions"
                value={formData.non_eligible_conditions}
                onChange={(e) =>
                  setFormData({ ...formData, non_eligible_conditions: e.target.value })
                }
                placeholder="Perishable items&#10;Damaged by misuse&#10;Missing original packaging"
                rows={4}
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
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
                    Save Policy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







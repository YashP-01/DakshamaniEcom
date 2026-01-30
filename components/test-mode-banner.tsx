"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TestModeBanner() {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    // Check if Razorpay key is available (client-side check)
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    setIsTestMode(!razorpayKey || razorpayKey === "");
  }, []);

  if (!isTestMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 text-sm mb-1">
                Test Mode Active
              </h4>
              <p className="text-xs text-yellow-700">
                Razorpay & Shiprocket APIs are not configured. Orders will be processed in test mode.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

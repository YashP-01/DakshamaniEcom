"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Package, CheckCircle, Clock, MapPin, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrackingData {
  tracking_data?: {
    track_status?: number;
    current_status?: string;
    shipment_track?: Array<{
      tracking_date?: string;
      tracking_time?: string;
      date?: string;
      status?: string;
      activity?: string;
      location?: string;
      courier_name?: string;
    }>;
    shipment_track_activities?: Array<{
      date?: string;
      tracking_date?: string;
      tracking_time?: string;
      status?: string;
      activity?: string;
      location?: string;
    }>;
  };
  shipment?: {
    status?: string;
    awb_code?: string;
    courier_name?: string;
    estimated_delivery_date?: string;
  };
}

interface OrderTrackingProps {
  orderId: string;
  shipmentId?: string | null;
  trackingNumber?: string | null;
  orderStatus?: string;
  shippingStatus?: string;
}

export default function OrderTracking({
  orderId,
  shipmentId,
  trackingNumber,
  orderStatus,
  shippingStatus,
}: OrderTrackingProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!shipmentId && !trackingNumber) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (shipmentId) params.append("shipment_id", shipmentId);
        if (trackingNumber) params.append("awb_code", trackingNumber);

        const response = await fetch(`/api/shiprocket/tracking?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setTrackingData(data);
        } else {
          setError(data.error || "Failed to fetch tracking");
        }
      } catch (err: any) {
        console.error("Tracking fetch error:", err);
        setError("Failed to load tracking information");
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();

    // Refresh tracking every 30 seconds if order is in transit
    const shouldRefresh = 
      orderStatus !== "delivered" && 
      orderStatus !== "cancelled" &&
      (shippingStatus === "shipped" || shippingStatus === "in_transit" || shippingStatus === "out_for_delivery");

    if (shouldRefresh) {
      const interval = setInterval(fetchTracking, 30000);
      return () => clearInterval(interval);
    }
  }, [shipmentId, trackingNumber, orderStatus, shippingStatus]);

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (statusLower.includes("out for delivery") || statusLower.includes("out_for_delivery")) {
      return <Truck className="h-5 w-5 text-blue-600" />;
    }
    if (statusLower.includes("shipped") || statusLower.includes("in transit") || statusLower.includes("in_transit")) {
      return <Package className="h-5 w-5 text-orange-600" />;
    }
    return <Clock className="h-5 w-5 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) {
      return "bg-green-100 text-green-800 border-green-300";
    }
    if (statusLower.includes("out for delivery") || statusLower.includes("out_for_delivery")) {
      return "bg-blue-100 text-blue-800 border-blue-300";
    }
    if (statusLower.includes("shipped") || statusLower.includes("in transit") || statusLower.includes("in_transit")) {
      return "bg-orange-100 text-orange-800 border-orange-300";
    }
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading tracking information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !trackingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no tracking data available, show basic status
  if (!trackingData?.tracking_data && !trackingData?.shipment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${getStatusColor(shippingStatus || orderStatus || "pending")}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(shippingStatus || orderStatus || "pending")}
                <div>
                  <p className="font-semibold capitalize">
                    {shippingStatus || orderStatus || "Pending"}
                  </p>
                  <p className="text-sm opacity-80">
                    {shippingStatus === "pending" 
                      ? "Your order is being prepared"
                      : shippingStatus === "shipped"
                      ? "Your order has been shipped"
                      : shippingStatus === "in_transit"
                      ? "Your order is in transit"
                      : shippingStatus === "out_for_delivery"
                      ? "Your order is out for delivery"
                      : "Tracking information will be available soon"}
                  </p>
                </div>
              </div>
            </div>
            {trackingNumber && (
              <div className="text-sm text-gray-600">
                <p><strong>Tracking Number:</strong> {trackingNumber}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tracking = trackingData.tracking_data;
  const shipment = trackingData.shipment;
  const activities = tracking?.shipment_track_activities || tracking?.shipment_track || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Track Your Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Status */}
          <div className={`p-4 rounded-lg border-2 ${getStatusColor(tracking?.current_status || shipment?.status || shippingStatus || "pending")}`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(tracking?.current_status || shipment?.status || shippingStatus || "pending")}
              <div>
                <p className="font-semibold capitalize">
                  {tracking?.current_status || shipment?.status || shippingStatus || "Pending"}
                </p>
                {shipment?.estimated_delivery_date && (
                  <p className="text-sm opacity-80 mt-1">
                    Estimated delivery: {new Date(shipment.estimated_delivery_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tracking Number */}
          {(shipment?.awb_code || trackingNumber) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="font-mono font-semibold">{shipment?.awb_code || trackingNumber}</p>
                </div>
                {shipment?.courier_name && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Courier</p>
                    <p className="font-semibold">{shipment.courier_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking Timeline */}
          {activities.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Tracking Timeline</h4>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-4">
                  {activities.map((activity, index) => {
                    const isLatest = index === 0;
                    const date = activity.date || activity.tracking_date;
                    const time = activity.tracking_time;
                    const status = activity.status || activity.activity;
                    const location = activity.location;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-start gap-4"
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isLatest 
                            ? "bg-green-600 border-4 border-white shadow-lg" 
                            : "bg-gray-300"
                        }`}>
                          {isLatest && <CheckCircle className="h-4 w-4 text-white" />}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 pb-4 ${isLatest ? "border-b-2 border-green-200" : ""}`}>
                          <p className={`font-semibold ${isLatest ? "text-green-700" : "text-gray-700"}`}>
                            {status || "Status Update"}
                          </p>
                          {location && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </p>
                          )}
                          {date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(date).toLocaleDateString()}
                              {time && ` at ${time}`}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}




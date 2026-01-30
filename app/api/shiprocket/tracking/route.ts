import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Get Shiprocket authentication token
async function getShiprocketToken() {
  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL || "",
        password: process.env.SHIPROCKET_PASSWORD || "",
      }
    );

    return response.data.token;
  } catch (error: any) {
    console.error("Shiprocket auth error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Shiprocket");
  }
}

// Get tracking details from Shiprocket
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get("shipment_id");
    const orderId = searchParams.get("order_id");
    const awbCode = searchParams.get("awb_code");

    if (!shipmentId && !orderId && !awbCode) {
      return NextResponse.json(
        { error: "Please provide shipment_id, order_id, or awb_code" },
        { status: 400 }
      );
    }

    const token = await getShiprocketToken();

    // Try to get tracking by AWB code first (most reliable)
    if (awbCode) {
      try {
        const response = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return NextResponse.json({
          success: true,
          tracking: response.data,
        });
      } catch (error: any) {
        console.error("AWB tracking error:", error.response?.data || error.message);
      }
    }

    // Try to get tracking by shipment ID
    if (shipmentId) {
      try {
        const response = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/orders/show/${shipmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const shipmentData = response.data;
        
        // Get tracking details if AWB is available
        if (shipmentData.shipment_id) {
          try {
            const trackingResponse = await axios.get(
              `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${shipmentData.awb_code}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            return NextResponse.json({
              success: true,
              tracking: trackingResponse.data,
              shipment: shipmentData,
            });
          } catch (trackError: any) {
            // If AWB tracking fails, return shipment data
            return NextResponse.json({
              success: true,
              shipment: shipmentData,
              tracking: null,
            });
          }
        }

        return NextResponse.json({
          success: true,
          shipment: shipmentData,
          tracking: null,
        });
      } catch (error: any) {
        console.error("Shipment tracking error:", error.response?.data || error.message);
      }
    }

    // Try to get tracking by order ID
    if (orderId) {
      try {
        const response = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/orders/show/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const orderData = response.data;
        
        // If order has shipment, get tracking
        if (orderData.shipment_id) {
          const trackingResponse = await axios.get(
            `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${orderData.awb_code}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          return NextResponse.json({
            success: true,
            tracking: trackingResponse.data,
            order: orderData,
          });
        }

        return NextResponse.json({
          success: true,
          order: orderData,
          tracking: null,
        });
      } catch (error: any) {
        console.error("Order tracking error:", error.response?.data || error.message);
      }
    }

    return NextResponse.json(
      { error: "Could not fetch tracking information" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Tracking API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch tracking information",
        message: error.message 
      },
      { status: 500 }
    );
  }
}







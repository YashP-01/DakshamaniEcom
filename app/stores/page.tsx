"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: any;
  image_url: string | null;
  description: string | null;
  display_order: number;
}

interface MapSettings {
  map_image_url: string;
  description: string | null;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [mapSettings, setMapSettings] = useState<MapSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    // Load stores
    const { data: storesData } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    setStores(storesData || []);

    // Load map settings
    const { data: mapData } = await supabase
      .from("store_map_settings")
      .select("*")
      .limit(1)
      .single();

    if (mapData) {
      setMapSettings({
        map_image_url: mapData.map_image_url,
        description: mapData.description,
      });
    }

    setLoading(false);
  };

  const getOpeningHours = (openingHours: any) => {
    if (!openingHours || typeof openingHours !== 'object') {
      return "Contact store for hours";
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => {
      const hours = openingHours[day];
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      return hours ? `${dayName}: ${hours}` : null;
    }).filter(Boolean).join('\n') || "Contact store for hours";
  };

  const getGoogleMapsUrl = (store: Store) => {
    if (store.latitude && store.longitude) {
      return `https://www.google.com/maps?q=${store.latitude},${store.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${store.address}, ${store.city}, ${store.state} ${store.pincode}`
    )}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">Our Stores</h1>
            <p className="text-gray-600 text-lg">
              Visit us at any of our locations across India
            </p>
          </motion.div>

          {/* Map Image Section */}
          {mapSettings && mapSettings.map_image_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-16"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative w-full">
                    <img
                      src={mapSettings.map_image_url}
                      alt="Store locations map"
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: "600px" }}
                    />
                  </div>
                  {mapSettings.description && (
                    <div className="p-6">
                      <p className="text-gray-600 text-center">{mapSettings.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stores List */}
          {stores.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No stores available at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      {store.image_url && (
                        <div className="mb-4">
                          <img
                            src={store.image_url}
                            alt={store.name}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 mb-4">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{store.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">{store.address}</p>
                          <p className="text-gray-500 text-sm">
                            {store.city}, {store.state} - {store.pincode}
                          </p>
                        </div>
                      </div>

                      {store.description && (
                        <p className="text-gray-700 mb-4 text-sm">{store.description}</p>
                      )}

                      <div className="space-y-2 mb-4">
                        {store.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${store.phone}`} className="hover:text-green-600">
                              {store.phone}
                            </a>
                          </div>
                        )}
                        
                        {store.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${store.email}`} className="hover:text-green-600">
                              {store.email}
                            </a>
                          </div>
                        )}

                        {store.opening_hours && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="whitespace-pre-line">
                              {getOpeningHours(store.opening_hours)}
                            </div>
                          </div>
                        )}
                      </div>

                      <a
                        href={getGoogleMapsUrl(store)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
                      >
                        <Navigation className="h-4 w-4" />
                        Get Directions
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

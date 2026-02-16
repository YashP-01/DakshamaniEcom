export interface StoreLocation {
  id: string;
  name: string;
  serviceable_pincodes?: string[] | null;
  [key: string]: any;
}

/**
 * Finds a store that serves the given pincode.
 * @param pincode The customer's pincode
 * @param stores List of available stores
 * @returns The matching store or null
 */
export function findStoreByPincode(pincode: string, stores: StoreLocation[]): StoreLocation | null {
  if (!pincode || !stores || stores.length === 0) {
    return null;
  }

  const cleanPincode = pincode.trim();

  // Find a store that has the pincode in its serviceable_pincodes list OR matches main pincode
  return stores.find(store => 
    (store.serviceable_pincodes && 
    Array.isArray(store.serviceable_pincodes) &&
    store.serviceable_pincodes.includes(cleanPincode)) ||
    (store.pincode && store.pincode.trim() === cleanPincode)
  ) || null;
}

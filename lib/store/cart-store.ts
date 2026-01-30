import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  discount?: number;
  variant_id?: string;
  variant_name?: string;
  product_id: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        // Create unique ID for variant-based items
        const itemId = item.variant_id ? `${item.product_id}-${item.variant_id}` : item.id;
        const existingItem = items.find((i) => 
          i.variant_id ? `${i.product_id}-${i.variant_id}` === itemId : i.id === itemId
        );

        if (existingItem) {
          set({
            items: items.map((i) => {
              const currentId = i.variant_id ? `${i.product_id}-${i.variant_id}` : i.id;
              return currentId === itemId
                ? { ...i, quantity: i.quantity + 1 }
                : i;
            }),
          });
        } else {
          set({ items: [...items, { ...item, id: itemId, quantity: 1 }] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },
      clearCart: () => {
        set({ items: [] });
      },
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const itemPrice = item.discount
            ? item.price * (1 - item.discount / 100)
            : item.price;
          return total + itemPrice * item.quantity;
        }, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);


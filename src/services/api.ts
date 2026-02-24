import { MenuItem, Order } from '@/types';
import { INITIAL_MENU_ITEMS } from '@/data/menu';
import { db, isFirebaseEnabled } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc, setDoc } from 'firebase/firestore';

// Types
interface AdminUser {
  username: string;
  password_hash: string;
}

// Keys for LocalStorage
const STORAGE_KEYS = {
  MENU: 'lb_menu_items',
  ORDERS: 'lb_orders',
  ADMIN_TOKEN: 'lb_admin_token'
};

// Mock Admin Credentials
const ADMIN_CREDS: AdminUser = {
  username: 'admin',
  password_hash: 'admin123' // Plain text for demo
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorage(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- Menu API ---
  async getMenu(): Promise<MenuItem[]> {
    if (isFirebaseEnabled && db) {
      try {
        const q = query(collection(db, 'menu_items'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          // Seed if empty
          for (const item of INITIAL_MENU_ITEMS) {
            await addDoc(collection(db, 'menu_items'), item);
          }
          return INITIAL_MENU_ITEMS;
        }
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      } catch (error) {
        console.error('Firebase Menu Error:', error);
        return INITIAL_MENU_ITEMS;
      }
    }
    
    // LocalStorage Fallback
    await delay(500); 
    return this.getStorage<MenuItem[]>(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS);
  }

  async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    if (isFirebaseEnabled && db) {
      const docRef = await addDoc(collection(db, 'menu_items'), item);
      return { id: docRef.id, ...item } as MenuItem;
    }

    await delay(500);
    const menu = await this.getMenu();
    const newItem = { ...item, id: Date.now() }; // Simple ID generation
    const updatedMenu = [...menu, newItem];
    this.setStorage(STORAGE_KEYS.MENU, updatedMenu);
    return newItem;
  }

  async updateMenuItem(item: MenuItem): Promise<MenuItem> {
    if (isFirebaseEnabled && db) {
      const itemRef = doc(db, 'menu_items', String(item.id));
      const { id, ...data } = item;
      await updateDoc(itemRef, data);
      return item;
    }

    await delay(500);
    const menu = await this.getMenu();
    const updatedMenu = menu.map(i => i.id === item.id ? item : i);
    this.setStorage(STORAGE_KEYS.MENU, updatedMenu);
    return item;
  }

  async deleteMenuItem(id: string | number): Promise<void> {
    if (isFirebaseEnabled && db) {
      await deleteDoc(doc(db, 'menu_items', String(id)));
      return;
    }

    await delay(500);
    const menu = await this.getMenu();
    const updatedMenu = menu.filter(i => i.id !== id);
    this.setStorage(STORAGE_KEYS.MENU, updatedMenu);
  }

  // --- Order API ---
  async createOrder(orderData: any): Promise<{ success: boolean, orderId: string, totalAmount: number }> {
    // Calculate total
    const menu = await this.getMenu();
    let totalAmount = 0;
    const orderItems = orderData.items.map((item: any) => {
      const menuItem = menu.find(m => String(m.id) === String(item.id));
      if (menuItem) {
        totalAmount += menuItem.price * item.quantity;
        return {
          ...menuItem,
          quantity: item.quantity,
          price_at_time: menuItem.price
        };
      }
      return null;
    }).filter(Boolean);

    const newOrder: Order = {
      id: crypto.randomUUID(),
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address,
      total_amount: totalAmount,
      status: 'pending',
      payment_method: orderData.payment_method,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      items: orderItems
    };

    if (isFirebaseEnabled && db) {
      try {
        const docRef = await addDoc(collection(db, 'orders'), newOrder);
        // Update ID to match Firestore ID if needed, but we use UUID for display
        return { success: true, orderId: newOrder.id, totalAmount };
      } catch (error) {
        console.error('Firebase Order Error:', error);
        throw new Error('Failed to create order in database');
      }
    }

    await delay(800);
    const orders = this.getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const updatedOrders = [newOrder, ...orders];
    this.setStorage(STORAGE_KEYS.ORDERS, updatedOrders);

    return { success: true, orderId: newOrder.id, totalAmount };
  }

  async getOrders(): Promise<Order[]> {
    if (isFirebaseEnabled && db) {
      const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data() } as Order));
    }

    await delay(500);
    return this.getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  }

  // Real-time Subscription
  subscribeToOrders(callback: (orders: Order[]) => void): () => void {
    if (isFirebaseEnabled && db) {
      const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const orders = querySnapshot.docs.map(doc => ({ ...doc.data() } as Order));
        callback(orders);
      });
      return unsubscribe;
    }

    // Polling Fallback for LocalStorage
    const interval = setInterval(() => {
      const orders = this.getStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
      callback(orders);
    }, 5000);
    
    return () => clearInterval(interval);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    if (isFirebaseEnabled && db) {
      // Find doc by UUID stored in field 'id'
      const q = query(collection(db, 'orders'));
      const querySnapshot = await getDocs(q);
      const docRef = querySnapshot.docs.find(d => d.data().id === orderId);
      
      if (docRef) {
        await updateDoc(doc(db, 'orders', docRef.id), { status });
      }
      return;
    }

    await delay(300);
    const orders = await this.getOrders();
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
    this.setStorage(STORAGE_KEYS.ORDERS, updatedOrders);
  }

  // --- Auth API ---
  async login(username: string, password: string): Promise<{ success: boolean, token?: string }> {
    await delay(600);
    if (username === ADMIN_CREDS.username && password === ADMIN_CREDS.password_hash) {
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
      return { success: true, token };
    }
    return { success: false };
  }
}

export const api = new ApiService();

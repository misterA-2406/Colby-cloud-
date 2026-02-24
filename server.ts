import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from './src/db/index.ts';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDb();

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // 1. Get Menu
  app.get('/api/menu', (req, res) => {
    try {
      const menu = db.prepare('SELECT * FROM menu_items WHERE is_available = 1').all();
      res.json(menu);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      res.status(500).json({ error: 'Failed to fetch menu' });
    }
  });

  // 2. Create Order
  const orderSchema = z.object({
    customer_name: z.string().min(1, "Name is required"),
    customer_phone: z.string().min(10, "Valid phone number is required"),
    customer_address: z.string().min(5, "Address must be complete"),
    items: z.array(z.object({
      id: z.number(),
      quantity: z.number().min(1)
    })).min(1, "Cart cannot be empty"),
    payment_method: z.enum(['cod', 'online'])
  });

  app.get('/api/orders/:id', (req, res) => {
    try {
      const { id } = req.params;
      const order = db.prepare('SELECT id, status, total_amount, created_at FROM orders WHERE id = ?').get(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order status' });
    }
  });

  app.post('/api/orders', (req, res) => {
    try {
      const validation = orderSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues[0].message });
      }

      const { customer_name, customer_phone, customer_address, items, payment_method } = validation.data;
      const orderId = uuidv4();

      // Calculate total and verify prices server-side
      let totalAmount = 0;
      const orderItemsData = [];

      const getPriceStmt = db.prepare('SELECT price, name FROM menu_items WHERE id = ?');

      for (const item of items) {
        const menuItem = getPriceStmt.get(item.id) as { price: number, name: string } | undefined;
        if (!menuItem) {
          return res.status(400).json({ error: `Item with ID ${item.id} not found` });
        }
        totalAmount += menuItem.price * item.quantity;
        orderItemsData.push({
          menu_item_id: item.id,
          quantity: item.quantity,
          price_at_time: menuItem.price
        });
      }

      // Atomic Transaction
      const createOrderTransaction = db.transaction(() => {
        db.prepare(`
          INSERT INTO orders (id, customer_name, customer_phone, customer_address, total_amount, payment_method)
          VALUES (@id, @customer_name, @customer_phone, @customer_address, @total_amount, @payment_method)
        `).run({
          id: orderId,
          customer_name,
          customer_phone,
          customer_address,
          total_amount: totalAmount,
          payment_method
        });

        const insertItemStmt = db.prepare(`
          INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time)
          VALUES (@order_id, @menu_item_id, @quantity, @price_at_time)
        `);

        for (const item of orderItemsData) {
          insertItemStmt.run({
            order_id: orderId,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price_at_time: item.price_at_time
          });
        }
      });

      createOrderTransaction();

      res.status(201).json({ success: true, orderId, totalAmount });

    } catch (error) {
      console.error('Order creation failed:', error);
      res.status(500).json({ error: 'Internal server error processing order' });
    }
  });

  // 3. Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Simple check for demo purposes. In prod, use bcrypt compare.
    const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password_hash = ?').get(username, password);
    
    if (admin) {
      res.json({ success: true, token: 'dummy-jwt-token-for-demo' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // 4. Admin: Get All Orders
  app.get('/api/admin/orders', (req, res) => {
    // In a real app, verify token here
    try {
      const orders = db.prepare(`
        SELECT 
          o.*,
          json_group_array(json_object('name', m.name, 'quantity', oi.quantity, 'price', oi.price_at_time)) as items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN menu_items m ON oi.menu_item_id = m.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `).all();
      
      // Parse the JSON string from sqlite
      const parsedOrders = orders.map((order: any) => ({
        ...order,
        items: JSON.parse(order.items)
      }));

      res.json(parsedOrders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // 5. Admin: Update Order Status
  app.patch('/api/admin/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // 6. Admin: Get All Menu Items (including unavailable)
  app.get('/api/admin/menu', (req, res) => {
    try {
      const menu = db.prepare('SELECT * FROM menu_items').all();
      res.json(menu);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch menu' });
    }
  });

  // 7. Admin: Update Menu Item (Full Update)
  app.put('/api/admin/menu/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_veg, is_available } = req.body;

    try {
      const result = db.prepare(`
        UPDATE menu_items 
        SET name = @name, 
            description = @description, 
            price = @price, 
            category = @category, 
            image_url = @image_url, 
            is_veg = @is_veg, 
            is_available = @is_available 
        WHERE id = @id
      `).run({
        id,
        name,
        description,
        price,
        category,
        image_url,
        is_veg: is_veg ? 1 : 0,
        is_available: is_available ? 1 : 0
      });

      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  });

  // 8. Admin: Add New Menu Item
  app.post('/api/admin/menu', (req, res) => {
    const { name, description, price, category, image_url, is_veg, is_available } = req.body;

    try {
      const result = db.prepare(`
        INSERT INTO menu_items (name, description, price, category, image_url, is_veg, is_available)
        VALUES (@name, @description, @price, @category, @image_url, @is_veg, @is_available)
      `).run({
        name,
        description,
        price,
        category,
        image_url,
        is_veg: is_veg ? 1 : 0,
        is_available: is_available ? 1 : 0
      });

      res.status(201).json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  });


  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

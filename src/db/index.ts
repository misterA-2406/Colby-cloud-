import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'kitchen.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export function initDb() {
  // Menu Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL, -- Stored in cents/paise
      category TEXT NOT NULL,
      image_url TEXT,
      is_veg BOOLEAN DEFAULT 1,
      is_available BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, -- UUID
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, out_for_delivery, delivered, cancelled
      payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
      payment_method TEXT DEFAULT 'cod', -- cod, online
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Order Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_time INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    )
  `);

  // Admin Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, -- In a real app, use bcrypt. For this demo, simple hash or plain (if strictly internal)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Menu Data if empty
  const count = db.prepare('SELECT count(*) as count FROM menu_items').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO menu_items (name, description, price, category, image_url, is_veg, is_available)
      VALUES (@name, @description, @price, @category, @image_url, @is_veg, @is_available)
    `);

    const seedData = [
      {
        name: 'Truffle Mushroom Risotto',
        description: 'Creamy arborio rice with wild mushrooms and black truffle oil.',
        price: 450,
        category: 'Mains',
        image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80',
        is_veg: 1,
        is_available: 1
      },
      {
        name: 'Smoked BBQ Chicken Wings',
        description: 'Slow-cooked wings glazed in our signature hickory BBQ sauce.',
        price: 320,
        category: 'Starters',
        image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
        is_veg: 0,
        is_available: 1
      },
      {
        name: 'Paneer Tikka Lababdar',
        description: 'Cottage cheese cubes simmered in a rich, spicy tomato gravy.',
        price: 380,
        category: 'Mains',
        image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
        is_veg: 1,
        is_available: 1
      },
      {
        name: 'Classic Beef Burger',
        description: 'Juicy patty with cheddar, caramelized onions, and secret sauce.',
        price: 420,
        category: 'Burgers',
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        is_veg: 0,
        is_available: 1
      },
      {
        name: 'Quinoa & Avocado Salad',
        description: 'Fresh greens, cherry tomatoes, and lemon vinaigrette.',
        price: 290,
        category: 'Salads',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        is_veg: 1,
        is_available: 1
      },
      {
        name: 'Belgian Chocolate Mousse',
        description: 'Rich dark chocolate mousse topped with sea salt.',
        price: 250,
        category: 'Desserts',
        image_url: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=800&q=80',
        is_veg: 1,
        is_available: 1
      }
    ];

    seedData.forEach(item => insert.run(item));
    console.log('Database seeded with initial menu items.');
  }
  
  // Seed Admin User
  const adminCount = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', 'admin123'); // Simple hash for demo
  }
}

export default db;

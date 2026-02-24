import { MenuItem } from '@/types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    name: 'Truffle Mushroom Risotto',
    description: 'Creamy arborio rice with wild mushrooms and black truffle oil.',
    price: 450,
    category: 'Mains',
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true
  },
  {
    id: 2,
    name: 'Smoked BBQ Chicken Wings',
    description: 'Slow-cooked wings glazed in our signature hickory BBQ sauce.',
    price: 320,
    category: 'Starters',
    image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
    is_veg: false,
    is_available: true
  },
  {
    id: 3,
    name: 'Paneer Tikka Lababdar',
    description: 'Cottage cheese cubes simmered in a rich, spicy tomato gravy.',
    price: 380,
    category: 'Mains',
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true
  },
  {
    id: 4,
    name: 'Classic Beef Burger',
    description: 'Juicy patty with cheddar, caramelized onions, and secret sauce.',
    price: 420,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    is_veg: false,
    is_available: true
  },
  {
    id: 5,
    name: 'Quinoa & Avocado Salad',
    description: 'Fresh greens, cherry tomatoes, and lemon vinaigrette.',
    price: 290,
    category: 'Salads',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true
  },
  {
    id: 6,
    name: 'Belgian Chocolate Mousse',
    description: 'Rich dark chocolate mousse topped with sea salt.',
    price: 250,
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true
  }
];

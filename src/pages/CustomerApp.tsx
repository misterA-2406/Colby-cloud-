import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Phone, MapPin, Plus, Minus, X, Search, Truck, Check, Clock, Package } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatCurrency, cn } from '@/lib/utils';
import { MenuItem } from '@/types';
import toast from 'react-hot-toast';

// --- Components ---

const OrderTrackerModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const res = await fetch(`/api/orders/${orderId.trim()}`);
      const data = await res.json();
      
      if (res.ok) {
        setStatus(data);
      } else {
        setError(data.error || 'Order not found');
      }
    } catch (err) {
      setError('Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusStep = (currentStatus: string) => {
    const steps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIndex = steps.indexOf(currentStatus);
    return currentIndex;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-stone-800 flex justify-between items-center">
          <h3 className="font-serif font-bold text-lg text-white">Track Your Order</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-white" /></button>
        </div>
        
        <div className="p-6">
          <form onSubmit={checkStatus} className="flex gap-2 mb-8">
            <input 
              type="text" 
              placeholder="Enter Order ID (e.g. a1b2c3d4)"
              className="flex-1 bg-stone-950 border border-stone-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-400 transition-colors"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-amber-400 text-stone-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : <Search className="w-5 h-5" />}
            </button>
          </form>

          {error && (
            <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-lg border border-red-900/50 mb-4">
              {error}
            </div>
          )}

          {status && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-stone-400 text-sm mb-1">Status for Order #{status.id.slice(0,8)}</p>
                <p className="text-2xl font-serif font-bold text-white capitalize">
                  {status.status.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="relative flex justify-between items-center px-2">
                {/* Progress Bar Background */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-stone-800 -z-10" />
                
                {/* Active Progress */}
                <div 
                  className="absolute left-0 top-1/2 h-0.5 bg-amber-400 -z-10 transition-all duration-500" 
                  style={{ width: `${(getStatusStep(status.status) / 4) * 100}%` }}
                />

                {['pending', 'preparing', 'out_for_delivery', 'delivered'].map((step, idx) => {
                  const currentStepIdx = getStatusStep(status.status);
                  const isCompleted = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  let Icon = Package;
                  if (step === 'preparing') Icon = Clock;
                  if (step === 'out_for_delivery') Icon = Truck;
                  if (step === 'delivered') Icon = Check;

                  return (
                    <div key={step} className="flex flex-col items-center gap-2 bg-stone-900 px-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                        isCompleted ? "bg-amber-400 border-amber-400 text-stone-950" : "bg-stone-950 border-stone-700 text-stone-700",
                        isCurrent && "ring-4 ring-amber-400/20"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-stone-500 font-bold px-1">
                <span>Received</span>
                <span>Kitchen</span>
                <span>On Way</span>
                <span>Delivered</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const Header = ({ cartCount, onOpenCart, onOpenTracker }: { cartCount: number, onOpenCart: () => void, onOpenTracker: () => void }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-white/5">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-serif font-bold text-2xl tracking-widest text-amber-400">COLBY'S</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest text-stone-300 uppercase">
        <a href="#menu" className="hover:text-amber-400 transition-colors">Menu</a>
        <a href="#about" className="hover:text-amber-400 transition-colors">Story</a>
        <a href="#visit" className="hover:text-amber-400 transition-colors">Delivery</a>
        <button onClick={onOpenTracker} className="hover:text-amber-400 transition-colors">Track Order</button>
      </nav>

      <div className="flex items-center gap-6">
        <button onClick={onOpenTracker} className="md:hidden text-stone-300 hover:text-amber-400">
          <Search className="w-5 h-5" />
        </button>
        <a href="tel:+918074047927" className="hidden md:block text-stone-300 hover:text-amber-400 transition-colors">
          <Phone className="w-5 h-5" />
        </a>
        <button 
          onClick={onOpenCart}
          className="bg-amber-400 text-stone-950 px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors flex items-center gap-2"
        >
          <span>Order Now</span>
          {cartCount > 0 && (
            <span className="bg-stone-950 text-amber-400 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="relative h-screen min-h-[600px] bg-stone-950 flex items-center justify-center overflow-hidden">
    {/* Background Image with Overlay */}
    <div className="absolute inset-0 z-0">
      <img 
        src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80" 
        alt="Dark moody cocktail" 
        className="w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/20 to-stone-950" />
    </div>
    
    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-6">Stretford, Manchester</p>
        <h1 className="font-serif text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
          COLBY'S
        </h1>
        <p className="text-white text-lg md:text-2xl font-medium mb-2">
          Modern British Small Plates & Craft Cocktails
        </p>
        <p className="text-stone-400 text-sm md:text-base mb-10 max-w-xl mx-auto">
          Wood-fired pizza, rebellious spirits, and small plates worth sharing.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="bg-amber-400 text-stone-950 px-8 py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-amber-300 transition-colors min-w-[160px]">
            Order Delivery
          </button>
          <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="border border-stone-600 text-white px-8 py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:border-white transition-colors min-w-[160px]">
            Browse Menu
          </button>
        </div>
      </motion.div>
    </div>
    
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-stone-500">
      <Minus className="w-6 h-6 rotate-90" />
    </div>
  </section>
);



const AboutSection = () => (
  <section id="about" className="py-24 bg-stone-950 border-t border-stone-900">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
      <div className="relative">
        <div className="absolute -top-4 -left-4 w-full h-full border border-stone-800 z-0" />
        <img 
          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80" 
          alt="Dark interior" 
          className="relative z-10 w-full h-[600px] object-cover grayscale hover:grayscale-0 transition-all duration-700"
        />
      </div>
      
      <div>
        <h2 className="font-serif text-5xl md:text-6xl font-bold text-white mb-8 leading-none">
          Crafted in <br />
          <span className="text-amber-400">Manchester</span>
        </h2>
        
        <p className="text-stone-400 mb-6 leading-relaxed">
          COLBY'S occupies what was once a derelict textile storage unit on Chester Road. 
          When we acquired the space in late 2023, it was nothing but exposed brick, rain-damaged timber, 
          and industrial potential. We didn't fix the imperfections; we highlighted them.
        </p>
        
        <p className="text-stone-400 mb-8 leading-relaxed">
          Our philosophy is simple: Fire and Flour. We source our heritage grains from Cheshire mills 
          and our lamb from the rainy hills of the Ribble Valley. Everything—from our 48-hour fermented 
          pizza dough to our charred hispi cabbage—touches the open flame of our central obsidian-tiled hearth.
        </p>
        
        <div className="border-l-2 border-amber-400 pl-6 my-8">
          <p className="font-serif text-xl italic text-white mb-2">
            "We don't hide behind white tablecloths. We hide behind the smoke."
          </p>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Liam Harrow, Executive Chef</p>
        </div>
        
        <div className="flex gap-12 mt-12">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Established</p>
            <p className="font-serif text-2xl text-white">2024</p>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Signature</p>
            <p className="font-serif text-2xl text-white">Fire & Flour</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ContactSection = () => (
  <section id="visit" className="py-24 bg-stone-950 border-t border-stone-900">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
      <div>
        <h2 className="font-serif text-4xl font-bold text-white mb-12">Delivery & Pickup</h2>
        
        <div className="space-y-12">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Kitchen Location (Pickup Only)</p>
            <p className="text-white text-lg leading-relaxed">
              1116 Chester Rd, Stretford,<br />
              Manchester M32 0HA, UK
            </p>
            <a href="#" className="inline-block mt-4 text-amber-400 text-xs font-bold uppercase tracking-widest border-b border-amber-400 pb-1 hover:text-white hover:border-white transition-colors">
              View on Google Maps
            </a>
          </div>
          
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Delivery Hours</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <span className="text-stone-400">Monday</span>
              <span className="text-stone-600">Closed</span>
              
              <span className="text-stone-400">Tuesday</span>
              <span className="text-white">17:00 - 23:00</span>
              
              <span className="text-stone-400">Wednesday</span>
              <span className="text-white">17:00 - 23:00</span>
              
              <span className="text-stone-400">Thursday</span>
              <span className="text-white">17:00 - 23:00</span>
              
              <span className="text-stone-400">Friday</span>
              <span className="text-white">16:00 - 24:00</span>
              
              <span className="text-stone-400">Saturday</span>
              <span className="text-white">12:00 - 24:00</span>
              
              <span className="text-stone-400">Sunday</span>
              <span className="text-white">12:00 - 22:00</span>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Contact</p>
            <p className="text-white text-lg mb-2">0161 555 0199</p>
            <p className="text-stone-400">hello@colbysstretford.co.uk</p>
          </div>
        </div>
      </div>
      
      <div className="h-[600px] bg-stone-900 grayscale hover:grayscale-0 transition-all duration-700 relative overflow-hidden">
        {/* Placeholder for map */}
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2376.671754877386!2d-2.296169023027874!3d53.43844897231653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487bb37d363530c1%3A0x633537233e725662!2s1116%20Chester%20Rd%2C%20Stretford%2C%20Manchester%20M32%200HA%2C%20UK!5e0!3m2!1sen!2sin!4v1708700000000!5m2!1sen!2sin" 
          width="100%" 
          height="100%" 
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute bottom-6 left-6">
           <button className="bg-amber-400 text-stone-950 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-amber-300 transition-colors">
             Get Directions
           </button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-stone-950 py-20 border-t border-stone-900">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-16">
      <div>
        <h3 className="font-serif text-xl font-bold text-white mb-6">@colbysstretford</h3>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-stone-900 hover:opacity-75 transition-opacity cursor-pointer">
              <img src={`https://picsum.photos/200?random=${i}`} alt="Instagram" className="w-full h-full object-cover grayscale" />
            </div>
          ))}
        </div>
        <a href="#" className="inline-block mt-4 text-xs font-bold text-amber-400 uppercase tracking-widest hover:text-white transition-colors">
          Follow Us
        </a>
      </div>
      
      <div className="text-center">
        <h3 className="font-serif text-2xl font-bold text-white mb-4">Join the Inner Circle</h3>
        <p className="text-stone-400 text-sm mb-8">Weekly specials, secret menu items, and event invites. No spam, just good food.</p>
        <div className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="EMAIL ADDRESS" 
            className="bg-stone-900 border border-stone-800 text-white px-4 py-3 text-xs tracking-widest focus:outline-none focus:border-amber-400 transition-colors text-center"
          />
          <button className="bg-amber-400 text-stone-950 px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-amber-300 transition-colors">
            Subscribe
          </button>
        </div>
      </div>
      
      <div className="text-right">
        <h3 className="font-serif text-3xl font-bold text-amber-400 mb-2">COLBY'S</h3>
        <p className="text-stone-500 text-sm mb-8">Modern British small plates <br />& craft cocktails.</p>
        
        <div className="flex flex-col gap-2 items-end">
          <a href="#" className="text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-white transition-colors">Accessibility</a>
          <a href="#" className="text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-white transition-colors">Terms of Service</a>
        </div>
        
        <p className="text-stone-700 text-[10px] mt-12 uppercase tracking-widest">
          © 2024 Colby's Stretford. <br />
          Website by Obsidian Design
        </p>
      </div>
    </div>
  </footer>
);

const MenuSection = ({ items, onAdd }: { items: MenuItem[], onAdd: (item: MenuItem) => void }) => {
  const categories = Array.from(new Set(items.map(i => i.category)));
  const [activeCategory, setActiveCategory] = useState(categories[0] || 'All');

  const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  return (
    <section id="menu" className="py-24 px-4 bg-stone-950 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-5xl font-bold text-white mb-4">Our Menu</h2>
          <div className="w-24 h-1 bg-amber-400 mx-auto" />
        </div>

        <div className="flex overflow-x-auto pb-4 gap-8 mb-12 no-scrollbar justify-center border-b border-stone-800">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "pb-4 text-xs font-bold tracking-widest uppercase transition-all relative",
                activeCategory === cat 
                  ? "text-amber-400" 
                  : "text-stone-500 hover:text-stone-300"
              )}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {filteredItems.map(item => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group flex gap-4 items-start pb-6 border-b border-stone-900"
            >
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-amber-400 transition-colors">{item.name}</h3>
                  <span className="font-bold text-amber-400">{formatCurrency(item.price)}</span>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed mb-3">{item.description}</p>
                
                <div className="flex items-center gap-3">
                  {item.is_veg ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 border border-stone-800 px-2 py-0.5 rounded-sm">Vegan Option</span>
                  ) : null}
                  
                  {item.is_available ? (
                    <button 
                      onClick={() => onAdd(item)}
                      className="text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add to Order
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Sold Out</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-amber-400 text-stone-950 px-10 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-amber-300 transition-colors"
          >
            Order Now
          </button>
        </div>
      </div>
    </section>
  );
};

const CartDrawer = ({ isOpen, onClose, onCheckout }: { isOpen: boolean, onClose: () => void, onCheckout: () => void }) => {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h2 className="font-serif font-bold text-xl text-stone-900">Your Order</h2>
              <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full">
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                  <ShoppingBag className="w-16 h-16 opacity-20" />
                  <p>Your cart is empty</p>
                  <button onClick={onClose} className="text-emerald-600 font-medium hover:underline">
                    Browse Menu
                  </button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "w-3 h-3 border flex items-center justify-center flex-shrink-0",
                          item.is_veg ? "border-green-600" : "border-red-600"
                        )}>
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            item.is_veg ? "bg-green-600" : "bg-red-600"
                          )} />
                        </div>
                        <h4 className="font-medium text-stone-900">{item.name}</h4>
                      </div>
                      <p className="text-sm text-stone-500">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-50 rounded-lg p-1 border border-stone-200">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 hover:text-red-600 disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-stone-600 hover:text-emerald-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-stone-600">Total Amount</span>
                  <span className="font-serif font-bold text-xl text-stone-900">{formatCurrency(totalPrice())}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-medium hover:bg-stone-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const CheckoutModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cod' as 'cod' | 'online'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          items: items.map(i => ({ id: i.id, quantity: i.quantity })),
          payment_method: formData.paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Order failed');

      // Success
      toast.success('Order placed successfully!');
      
      // Show Order ID to user
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span className="font-bold">Order #{data.orderId.slice(0, 8)}</span>
          <span className="text-sm">Save this ID to track your order!</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(data.orderId);
              toast.success('Copied to clipboard');
            }}
            className="text-xs bg-stone-200 px-2 py-1 rounded hover:bg-stone-300"
          >
            Copy ID
          </button>
        </div>
      ), { duration: 6000 });
      
      // WhatsApp Redirection
      const message = `*New Order: ${data.orderId.slice(0, 8)}*\n\n` +
        items.map(i => `${i.quantity}x ${i.name} - ${formatCurrency(i.price * i.quantity)}`).join('\n') +
        `\n\n*Total: ${formatCurrency(totalPrice())}*\n` +
        `Payment: ${formData.paymentMethod.toUpperCase()}\n` +
        `Name: ${formData.name}\n` +
        `Address: ${formData.address}`;
      
      const whatsappUrl = `https://wa.me/918074047927?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      clearCart();
      onClose();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-sm w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="font-serif font-bold text-lg text-stone-900">Checkout Details</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-500" /></button>
        </div>
        {/* ... form content ... */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ... existing form fields ... */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
            <input 
              required
              type="text"
              className="w-full px-4 py-2 rounded-sm border border-stone-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
            <input 
              required
              type="tel"
              pattern="[0-9]{10}"
              className="w-full px-4 py-2 rounded-sm border border-stone-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="8074047927"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Delivery Address</label>
            <textarea 
              required
              rows={3}
              className="w-full px-4 py-2 rounded-sm border border-stone-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all resize-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Flat No, Street, Landmark..."
            />
          </div>
          
          <div className="pt-2">
            <label className="block text-sm font-medium text-stone-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                className={cn(
                  "py-2 px-3 rounded-sm border text-sm font-medium transition-all",
                  formData.paymentMethod === 'cod' 
                    ? "border-amber-400 bg-amber-50 text-amber-900" 
                    : "border-stone-200 text-stone-600 hover:bg-stone-50"
                )}
              >
                Cash on Delivery
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, paymentMethod: 'online'})}
                className={cn(
                  "py-2 px-3 rounded-sm border text-sm font-medium transition-all",
                  formData.paymentMethod === 'online' 
                    ? "border-amber-400 bg-amber-50 text-amber-900" 
                    : "border-stone-200 text-stone-600 hover:bg-stone-50"
                )}
              >
                Pay Online (UPI/Card)
              </button>
            </div>
            {formData.paymentMethod === 'online' && (
              <p className="text-xs text-stone-500 mt-2 bg-stone-50 p-2 rounded">
                Payment link will be shared via WhatsApp after order confirmation.
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 rounded-sm font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors shadow-lg mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Place Order • ${formatCurrency(totalPrice())}`}
          </button>
          <p className="text-xs text-stone-400 text-center mt-2">
            If WhatsApp doesn't open, please message us at +91 80740 47927
          </p>
        </form>
      </motion.div>
    </div>
  );
};

// --- Main Page ---

export default function CustomerApp() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const { addItem, totalItems } = useCartStore();

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error('Failed to load menu', err));
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
    toast.success(`Added ${item.name} to cart`, {
      style: {
        background: '#1c1917',
        color: '#fbbf24',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      },
      iconTheme: {
        primary: '#fbbf24',
        secondary: '#1c1917',
      },
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-100">
      <Header 
        cartCount={totalItems()} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenTracker={() => setIsTrackerOpen(true)}
      />
      <Hero />
      <MenuSection items={menuItems} onAdd={handleAddToCart} />
      <AboutSection />
      <ContactSection />
      <Footer />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }} 
      />
      
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />

      <OrderTrackerModal 
        isOpen={isTrackerOpen} 
        onClose={() => setIsTrackerOpen(false)} 
      />
    </div>
  );
}

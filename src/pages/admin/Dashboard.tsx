import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, MenuItem } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { RefreshCw, LogOut, Package, Check, Clock, Truck, X, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    is_veg: true,
    is_available: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) navigate('/admin');
    
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(console.error);
      
    fetch('/api/admin/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(console.error);
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        image_url: item.image_url,
        is_veg: !!item.is_veg,
        is_available: !!item.is_available
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        is_veg: true,
        is_available: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseInt(formData.price),
      is_veg: formData.is_veg ? 1 : 0,
      is_available: formData.is_available ? 1 : 0
    };

    try {
      const url = editingItem 
        ? `/api/admin/menu/${editingItem.id}` 
        : '/api/admin/menu';
      
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? 'Item updated' : 'Item created');
        setIsModalOpen(false);
        fetchData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="font-serif font-bold text-xl text-stone-900">LuxeBites Admin</h1>
        <div className="flex items-center gap-4">
          <button onClick={fetchData} className="p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('admin_token');
              navigate('/admin');
            }}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-stone-200 shadow-sm">
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-6 py-2.5 rounded-lg font-medium transition-all text-sm",
                activeTab === 'orders' ? "bg-stone-900 text-white shadow" : "text-stone-600 hover:bg-stone-50"
              )}
            >
              Live Orders
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={cn(
                "px-6 py-2.5 rounded-lg font-medium transition-all text-sm",
                activeTab === 'menu' ? "bg-stone-900 text-white shadow" : "text-stone-600 hover:bg-stone-50"
              )}
            >
              Menu Management
            </button>
          </div>
          
          {activeTab === 'menu' && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add New Item
            </button>
          )}
        </div>

        {activeTab === 'orders' ? (
          <div className="grid gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-stone-500">#{order.id.slice(0, 8)}</span>
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide", getStatusColor(order.status))}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-lg">{order.customer_name}</h3>
                    <p className="text-sm text-stone-500">{order.customer_phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(order.id, status)}
                        disabled={order.status === status}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                          order.status === status 
                            ? "bg-stone-900 text-white border-stone-900 shadow-md" 
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                        )}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-stone-100 pt-4 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase mb-3 tracking-wider">Order Items</h4>
                    <ul className="space-y-3">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm items-center">
                          <span className="text-stone-700 font-medium"><span className="text-stone-400 mr-2">{item.quantity}x</span> {item.name}</span>
                          <span className="text-stone-900 font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                      <span className="font-bold text-stone-900">Total Amount</span>
                      <span className="font-serif font-bold text-xl text-emerald-700">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase mb-3 tracking-wider">Delivery Details</h4>
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                      <p className="text-sm text-stone-700 leading-relaxed">
                        {order.customer_address}
                      </p>
                      <div className="mt-3 pt-3 border-t border-stone-200/50 text-xs flex justify-between items-center">
                         <span className="text-stone-500">Payment Method</span>
                         <span className="uppercase font-bold text-stone-800 bg-white px-2 py-1 rounded border border-stone-200">{order.payment_method}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 border-dashed">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-stone-900 font-medium text-lg">No orders yet</h3>
                <p className="text-stone-500">New orders will appear here automatically</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <div key={item.id} className={cn("bg-white rounded-xl overflow-hidden shadow-sm border transition-all hover:shadow-md group", item.is_available ? "border-stone-200" : "border-red-200 opacity-75")}>
                <div className="relative h-48 overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white transition-colors text-stone-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase border border-red-200">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-stone-900 line-clamp-1 text-lg">{item.name}</h3>
                    <div className={cn("w-4 h-4 border flex items-center justify-center flex-shrink-0 mt-1.5", item.is_veg ? "border-green-600" : "border-red-600")}>
                      <div className={cn("w-2 h-2 rounded-full", item.is_veg ? "bg-green-600" : "bg-red-600")} />
                    </div>
                  </div>
                  <p className="text-sm text-stone-500 mb-4 line-clamp-2 h-10">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-lg text-stone-800">{formatCurrency(item.price)}</span>
                    <span className="text-xs font-medium text-stone-400 uppercase bg-stone-100 px-2 py-1 rounded">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h2 className="font-serif font-bold text-xl text-stone-900">
                  {editingItem ? 'Edit Menu Item' : 'Add New Item'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Item Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-800 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                    <textarea 
                      required
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-800 outline-none resize-none"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Price (₹)</label>
                    <input 
                      required
                      type="number"
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-800 outline-none"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                    <input 
                      required
                      type="text"
                      list="categories"
                      className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-800 outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                    <datalist id="categories">
                      <option value="Starters" />
                      <option value="Mains" />
                      <option value="Burgers" />
                      <option value="Salads" />
                      <option value="Desserts" />
                      <option value="Beverages" />
                    </datalist>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Image URL</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                          required
                          type="url"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-800 outline-none"
                          value={formData.image_url}
                          onChange={e => setFormData({...formData, image_url: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    {formData.image_url && (
                      <div className="mt-2 h-32 w-full rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="is_veg"
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                      checked={formData.is_veg}
                      onChange={e => setFormData({...formData, is_veg: e.target.checked})}
                    />
                    <label htmlFor="is_veg" className="text-sm font-medium text-stone-700">Vegetarian</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="is_available"
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                      checked={formData.is_available}
                      onChange={e => setFormData({...formData, is_available: e.target.checked})}
                    />
                    <label htmlFor="is_available" className="text-sm font-medium text-stone-700">Available</label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors shadow-lg"
                  >
                    {editingItem ? 'Save Changes' : 'Create Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

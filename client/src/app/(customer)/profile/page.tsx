'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import type { IAddress, IProfile } from '@/types/user';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  History, 
  Upload, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  LogOut, 
  Loader2, 
  Phone, 
  Mail, 
  Calendar,
  Shield,
  Home as HomeIcon,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type TabId = 'account' | 'addresses' | 'orders' | 'ai-history';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, loading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [isUploading, setIsUploading] = useState(false);
  const [localProfile, setLocalProfile] = useState<IProfile | null>(null);

  // Form states for account info
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address CRUD states
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  // Address form fields
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

  // Orders & AI history states
  const [orders, setOrders] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Sync profile data to local state
  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
    }
  }, [profile]);

  // Fetch orders and AI history when relevant tabs are active
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'ai-history') {
      fetchAIHistory();
    }
  }, [activeTab, user]);

  async function fetchOrders() {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }

  async function fetchAIHistory() {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase
        .from('ai_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAiLogs(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load AI Match history');
    } finally {
      setLoadingAI(false);
    }
  }

  // Handle Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatar-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatar-images')
        .getPublicUrl(fileName);

      // Update profile record
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (localProfile) {
        setLocalProfile({ ...localProfile, avatar_url: publicUrl });
      }
      toast.success('Profile photo updated!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Update Account Info via Express Backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const updated = await apiFetch<IProfile>('/api/auth/profile', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phoneNumber,
          saved_addresses: localProfile?.saved_addresses || [],
        }),
      });

      setLocalProfile(updated);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Address CRUD Handlers
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !localProfile) return;

    if (!streetAddress || !city || !stateName || !postalCode) {
      toast.error('Please fill all required address fields');
      return;
    }

    const newAddress: IAddress = {
      id: editingAddressId || crypto.randomUUID(),
      street_address: streetAddress,
      city,
      state: stateName,
      postal_code: postalCode,
      country,
      is_default: isDefaultAddress,
    };

    let updatedAddresses = [...(localProfile.saved_addresses || [])];

    if (isDefaultAddress) {
      // Set all other addresses default status to false
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, is_default: false }));
    }

    if (editingAddressId) {
      updatedAddresses = updatedAddresses.map(addr => addr.id === editingAddressId ? newAddress : addr);
    } else {
      // If this is the first address, make it default automatically
      if (updatedAddresses.length === 0) {
        newAddress.is_default = true;
      }
      updatedAddresses.push(newAddress);
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const updated = await apiFetch<IProfile>('/api/auth/profile', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          full_name: localProfile.full_name,
          phone_number: localProfile.phone_number,
          saved_addresses: updatedAddresses,
        }),
      });

      setLocalProfile(updated);
      toast.success(editingAddressId ? 'Address updated!' : 'Address added!');
      resetAddressForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save address');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!localProfile) return;

    const updatedAddresses = localProfile.saved_addresses.map(addr => ({
      ...addr,
      is_default: addr.id === addressId,
    }));

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const updated = await apiFetch<IProfile>('/api/auth/profile', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          full_name: localProfile.full_name,
          phone_number: localProfile.phone_number,
          saved_addresses: updatedAddresses,
        }),
      });

      setLocalProfile(updated);
      toast.success('Default address updated!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to set default address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!localProfile) return;

    let updatedAddresses = localProfile.saved_addresses.filter(addr => addr.id !== addressId);
    
    // If we deleted the default address, set another one as default
    if (localProfile.saved_addresses.find(addr => addr.id === addressId)?.is_default && updatedAddresses.length > 0) {
      updatedAddresses[0].is_default = true;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const updated = await apiFetch<IProfile>('/api/auth/profile', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          full_name: localProfile.full_name,
          phone_number: localProfile.phone_number,
          saved_addresses: updatedAddresses,
        }),
      });

      setLocalProfile(updated);
      toast.success('Address removed');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete address');
    }
  };

  const startEditAddress = (address: IAddress) => {
    setEditingAddressId(address.id);
    setStreetAddress(address.street_address);
    setCity(address.city);
    setStateName(address.state);
    setPostalCode(address.postal_code);
    setCountry(address.country);
    setIsDefaultAddress(address.is_default);
    setIsAddingAddress(true);
  };

  const resetAddressForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setStreetAddress('');
    setCity('');
    setStateName('');
    setPostalCode('');
    setCountry('United States');
    setIsDefaultAddress(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  // Loading Screen
  if (loading || !user || !localProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 text-brand-mint animate-spin" />
        <p className="mt-4 text-sm text-slate-500">Loading your Green Nest profile...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-6xl flex-1 flex flex-col text-slate-800 dark:text-slate-100"
    >
      {/* Upper Grid: Profile Hero Banner */}
      <div className="glass-card rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-mint/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Avatar Upload Container */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-brand-mint/40 relative bg-slate-100 dark:bg-zinc-800">
            {localProfile.avatar_url ? (
              <Image 
                src={localProfile.avatar_url} 
                alt={localProfile.full_name || 'Avatar'} 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 96px, 128px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-forest dark:text-emerald-400 font-bold text-3xl">
                {localProfile.full_name?.charAt(0) || 'P'}
              </div>
            )}
            
            {/* Upload Overlay */}
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer text-white">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">Upload</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                className="hidden" 
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Profile Info Details */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-2xl font-bold font-outfit text-brand-forest dark:text-emerald-400">
              {localProfile.full_name || 'Plant Lover'}
            </h2>
            {localProfile.role === 'admin' && (
              <span className="inline-flex items-center gap-1 bg-brand-forest/10 dark:bg-emerald-500/20 text-brand-forest dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-semibold self-center w-fit mx-auto md:mx-0">
                <Shield className="w-3.5 h-3.5" />
                Admin
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center md:justify-start gap-1.5">
            <Mail className="w-4 h-4" />
            {localProfile.email}
          </p>
          <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Member since {new Date(localProfile.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-sm font-medium flex items-center gap-2 cursor-pointer self-center"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Main Profile Content: Tabs & Panels */}
      <div className="grid grid-col-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Tab list */}
        <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'account' 
                ? 'bg-brand-mint text-white shadow-md shadow-brand-mint/20' 
                : 'glass-card hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            Account Info
          </button>
          
          <button 
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'addresses' 
                ? 'bg-brand-mint text-white shadow-md shadow-brand-mint/20' 
                : 'glass-card hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-slate-300'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Saved Addresses
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders' 
                ? 'bg-brand-mint text-white shadow-md shadow-brand-mint/20' 
                : 'glass-card hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            My Orders
          </button>

          <button 
            onClick={() => setActiveTab('ai-history')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai-history' 
                ? 'bg-brand-mint text-white shadow-md shadow-brand-mint/20' 
                : 'glass-card hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            AI Match History
          </button>
        </div>

        {/* Right Column: Active Tab Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-3xl p-6 md:p-8"
            >
              
              {/* PANEL 1: ACCOUNT INFO */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-brand-forest dark:text-emerald-400 border-b border-slate-200 dark:border-white/10 pb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-mint" />
                    Account Information
                  </h3>
                  
                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</label>
                      <input 
                        type="email" 
                        value={localProfile.email} 
                        disabled 
                        className="glass-input w-full px-4 py-2.5 rounded-xl text-sm opacity-60 cursor-not-allowed bg-slate-100/50" 
                      />
                      <p className="text-[10px] text-slate-400">Email cannot be changed.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Name</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Your phone number"
                          className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 bg-brand-mint hover:bg-brand-forest text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Profile Changes
                    </button>
                  </form>
                </div>
              )}

              {/* PANEL 2: SAVED ADDRESSES */}
              {activeTab === 'addresses' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                    <h3 className="text-lg font-bold text-brand-forest dark:text-emerald-400 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-brand-mint" />
                      Saved Addresses
                    </h3>
                    {!isAddingAddress && (
                      <button 
                        onClick={() => setIsAddingAddress(true)}
                        className="bg-brand-mint hover:bg-brand-forest text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Address
                      </button>
                    )}
                  </div>

                  {isAddingAddress ? (
                    <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-xl p-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-slate-200/50 dark:border-white/5">
                      <h4 className="text-sm font-semibold text-brand-forest dark:text-emerald-400 mb-2">
                        {editingAddressId ? 'Edit Address' : 'Add New Address'}
                      </h4>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Street Address</label>
                        <input 
                          type="text" 
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="123 Main St"
                          className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">City</label>
                          <input 
                            type="text" 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="San Francisco"
                            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">State / Region</label>
                          <input 
                            type="text" 
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            placeholder="CA"
                            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Postal / ZIP Code</label>
                          <input 
                            type="text" 
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="94103"
                            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Country</label>
                          <input 
                            type="text" 
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="United States"
                            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" 
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 py-2">
                        <input 
                          type="checkbox" 
                          id="is_default"
                          checked={isDefaultAddress}
                          onChange={(e) => setIsDefaultAddress(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-mint focus:ring-brand-mint cursor-pointer"
                        />
                        <label htmlFor="is_default" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                          Set as default shipping address
                        </label>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button 
                          type="button" 
                          onClick={resetAddressForm}
                          className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-brand-mint hover:bg-brand-forest text-white rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer"
                        >
                          {editingAddressId ? 'Save Address' : 'Add Address'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {(!localProfile.saved_addresses || localProfile.saved_addresses.length === 0) ? (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No saved addresses found. Add one to speed up checkout!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {localProfile.saved_addresses.map((address) => (
                            <div 
                              key={address.id} 
                              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                                address.is_default 
                                  ? 'bg-brand-mint/5 border-brand-mint/30 dark:bg-emerald-500/5' 
                                  : 'bg-white/40 dark:bg-zinc-900/10 border-slate-200/50 dark:border-white/5'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-bold text-brand-forest dark:text-emerald-400 flex items-center gap-1">
                                    <HomeIcon className="w-3.5 h-3.5 text-brand-mint" />
                                    Address
                                  </span>
                                  {address.is_default && (
                                    <span className="bg-brand-mint/20 text-brand-mint px-2 py-0.5 rounded-full text-[9px] font-bold">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{address.street_address}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {address.city}, {address.state} {address.postal_code}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{address.country}</p>
                              </div>

                              <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-200/30 dark:border-white/5">
                                {!address.is_default && (
                                  <button 
                                    onClick={() => handleSetDefaultAddress(address.id)}
                                    className="text-[10px] text-brand-mint hover:underline font-semibold cursor-pointer"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button 
                                  onClick={() => startEditAddress(address)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 rounded-lg cursor-pointer"
                                  title="Edit Address"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg cursor-pointer"
                                  title="Delete Address"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 3: MY ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-brand-forest dark:text-emerald-400 border-b border-slate-200 dark:border-white/10 pb-3 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-brand-mint" />
                    My Order History
                  </h3>

                  {loadingOrders ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-8 h-8 text-brand-mint animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">You haven&apos;t placed any orders yet.</p>
                      <Link href="/" className="inline-block mt-3 text-brand-mint font-semibold hover:underline text-xs">
                        Start Shopping 🌿
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="p-4 rounded-2xl bg-white/30 dark:bg-zinc-900/10 border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-mint/20 transition-all">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              Order #{order.id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-slate-500">
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-400">
                              Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card'}
                            </p>
                          </div>
                          
                          <div className="flex md:flex-col items-start md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50 dark:border-white/5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.order_status === 'delivered' 
                                ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                : order.order_status === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                                : 'bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {order.order_status.toUpperCase()}
                            </span>
                            <p className="text-sm font-bold text-brand-forest dark:text-emerald-400 mt-1">
                              ${parseFloat(order.total_amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 4: AI MATCH HISTORY */}
              {activeTab === 'ai-history' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-brand-forest dark:text-emerald-400 border-b border-slate-200 dark:border-white/10 pb-3 flex items-center gap-2">
                    <History className="w-5 h-5 text-brand-mint" />
                    Plant Match AI History
                  </h3>

                  {loadingAI ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-8 h-8 text-brand-mint animate-spin" />
                    </div>
                  ) : aiLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No plant matches run yet. Find your perfect plant match today!</p>
                      <Link href="/" className="inline-block mt-3 text-brand-mint font-semibold hover:underline text-xs">
                        Try Plant Match AI Sparkles
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiLogs.map((log) => (
                        <div key={log.id} className="p-4 rounded-2xl bg-white/30 dark:bg-zinc-900/10 border border-slate-200/50 dark:border-white/5 flex gap-4 hover:border-brand-mint/20 transition-all">
                          <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-slate-200/40">
                            <Image 
                              src={log.uploaded_image_url} 
                              alt="AI Uploaded" 
                              fill 
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-brand-mint bg-brand-mint/10 px-2 py-0.5 rounded-full">
                                {log.confidence_score ? `${parseFloat(log.confidence_score).toFixed(0)}% Match` : 'Analyzed'}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              Environment: {log.detected_environment || 'N/A'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Space: {log.detected_space || 'N/A'} | Light: {log.detected_lighting || 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, MedicalSource } from '../../types';
import {
  User as UserIcon,
  Building2,
  Hospital,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Camera,
  Check,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586015555751-63c237841c7b?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, sources } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || SAMPLE_AVATARS[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentSource = sources.find((s) => s.id === currentUser.sourceId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      phone,
      address,
      avatarUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'PATIENT':
        return { label: 'Patient User', color: 'bg-blue-100 text-blue-800', icon: UserIcon };
      case 'PHARMACY':
        return { label: 'Approved Pharmacy', color: 'bg-teal-100 text-teal-800', icon: Building2 };
      case 'HOSPITAL':
        return { label: 'Verified Trauma Center', color: 'bg-indigo-100 text-indigo-800', icon: Hospital };
      case 'ADMIN':
        return { label: 'State Drug Controller Admin', color: 'bg-purple-100 text-purple-800', icon: ShieldCheck };
    }
  };

  const badge = getRoleBadge();
  const Icon = badge.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-scale-up">
        {/* Header with avatar banner */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-teal-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt={name}
                className="w-18 h-18 rounded-2xl object-cover border-2 border-white/90 shadow-lg bg-white"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-md border border-white">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${badge.color}`}>
                  <Icon className="w-3 h-3 inline mr-1" />
                  {badge.label}
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ● Active
                </span>
              </div>
              <h2 className="text-xl font-black mt-1">{currentUser.name}</h2>
              <p className="text-xs text-blue-100/90">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Avatar Selector Gallery */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Profile Picture / Facility Logo
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {SAMPLE_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                    avatarUrl === url ? 'border-blue-600 ring-2 ring-blue-400/50 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="preset avatar" className="w-10 h-10 object-cover" />
                  {avatarUrl === url && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Name */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              {currentUser.role === 'PATIENT' ? 'Full Name' : 'Organization / Authorized Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Phone Number (SMS Alert Route)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Physical Location / Operating Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-400">Default municipal zone: Tisaiyanvilai (627657), Tamil Nadu</p>
          </div>

          {/* Verification License info for Pharmacies and Hospitals */}
          {currentSource && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Drug Authority License Number</span>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentSource.registrationNumber}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Verified with Tamil Nadu State Pharmacy Council on {new Date(currentSource.verifiedAt || '').toLocaleDateString()}. License changes require Admin re-verification.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Profile Updates</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

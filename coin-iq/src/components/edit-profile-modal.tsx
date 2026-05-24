'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from './providers';
import { getUserProfile } from '@/lib/auth';
import { X, Camera, User, Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

interface UserProfile { id: number; name: string; email: string; created_at: string; }
interface Props { open: boolean; onClose: () => void; onSaved?: (name: string) => void; }

export default function EditProfileModal({ open, onClose, onSaved }: Props) {
  const [mounted, setMounted]             = useState(false);
  const [user, setUser]                   = useState<UserProfile | null>(null);
  const [formData, setFormData]           = useState({ name: '', email: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading]             = useState(false);
  const [fetching, setFetching]           = useState(true);
  const [message, setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imagePreview, setImagePreview]   = useState<string | null>(null);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [activeSection, setActiveSection] = useState<'info' | 'password'>('info');

  // Mount portal target
  useEffect(() => { setMounted(true); }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Fetch profile on open
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    setMessage(null);
    setActiveSection('info');
    getUserProfile().then(profile => {
      if (!profile) return;
      setUser(profile);
      setFormData({ name: profile.name, email: profile.email, newPassword: '', confirmPassword: '' });
      const canvas = document.createElement('canvas');
      canvas.width = 120; canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const g = ctx.createLinearGradient(0, 0, 120, 120);
        g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e293b');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 120, 120);
        ctx.font = 'bold 48px Arial'; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(profile.name.charAt(0).toUpperCase(), 60, 60);
        setImagePreview(canvas.toDataURL());
      }
    }).finally(() => setFetching(false));
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' }); return;
    }
    setLoading(true); setMessage(null);
    try {
      const body: any = { name: formData.name, email: formData.email };
      if (formData.newPassword) body.password = formData.newPassword;
      const res = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update'); }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setUser(prev => prev ? { ...prev, name: formData.name, email: formData.email } : prev);
      onSaved?.(formData.name);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally { setLoading(false); }
  };

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Full-screen flex container — centers the card */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Dark banner */}
              <div style={{ background: '#0f172a', padding: '28px 24px 56px', textAlign: 'center', position: 'relative', borderRadius: '24px 24px 0 0' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <X size={16} />
                </button>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 17, margin: 0 }}>Edit Profile</p>
                <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Manage your account details</p>
              </div>

              {/* Avatar overlapping banner */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40, marginBottom: 8, position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', overflow: 'hidden', background: '#1e293b' }}>
                    {imagePreview
                      ? <img src={imagePreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 900 }}>{user?.name?.charAt(0).toUpperCase()}</div>
                    }
                  </div>
                  <label htmlFor="modal-avatar" style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: '#0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <Camera size={13} color="#fff" />
                  </label>
                  <input id="modal-avatar" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
              </div>

              {fetching ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-900" />
                </div>
              ) : (
                <div style={{ padding: '0 24px 24px' }}>
                  {/* Name / email */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>{user?.name}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{user?.email}</p>
                  </div>

                  {/* Section tabs */}
                  <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 20 }}>
                    {([
                      { key: 'info' as const,     label: 'Personal Info', Icon: User },
                      { key: 'password' as const, label: 'Password',      Icon: Shield },
                    ]).map(({ key, label, Icon }) => (
                      <button key={key} type="button"
                        onClick={() => { setActiveSection(key); setMessage(null); }}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                          background: activeSection === key ? '#fff' : 'transparent',
                          color: activeSection === key ? '#0f172a' : '#64748b',
                          boxShadow: activeSection === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        }}>
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>

                  {/* Alert */}
                  <AnimatePresence mode="wait">
                    {message && (
                      <motion.div key="msg"
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500, marginBottom: 16,
                          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                          color:      message.type === 'success' ? '#166534' : '#991b1b',
                          border:     `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                        }}>
                        {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                        {message.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">

                      {activeSection === 'info' && (
                        <motion.div key="info"
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.16 }}
                          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {[
                            { name: 'name',  type: 'text',  placeholder: 'Full name',      Icon: User },
                            { name: 'email', type: 'email', placeholder: 'Email address',  Icon: Mail },
                          ].map(({ name, type, placeholder, Icon }) => (
                            <div key={name} style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                                <Icon size={15} />
                              </div>
                              <input name={name} type={type} value={(formData as any)[name]} onChange={handleChange} required placeholder={placeholder}
                                style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <button type="button" onClick={onClose}
                              style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              Cancel
                            </button>
                            <button type="submit" disabled={loading}
                              style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                              {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {activeSection === 'password' && (
                        <motion.div key="password"
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}
                          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {[
                            { name: 'newPassword',     placeholder: 'New password',      show: showNewPw,     toggle: () => setShowNewPw(p => !p) },
                            { name: 'confirmPassword', placeholder: 'Confirm password',  show: showConfirmPw, toggle: () => setShowConfirmPw(p => !p) },
                          ].map(({ name, placeholder, show, toggle }) => (
                            <div key={name} style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                                <Lock size={15} />
                              </div>
                              <input name={name} type={show ? 'text' : 'password'} value={(formData as any)[name]} onChange={handleChange} placeholder={placeholder}
                                style={{ width: '100%', paddingLeft: 36, paddingRight: 40, paddingTop: 11, paddingBottom: 11, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
                              <button type="button" onClick={toggle}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                                {show ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          ))}
                          <p style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                            <Shield size={11} /> Leave blank to keep your current password
                          </p>
                          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <button type="button" onClick={onClose}
                              style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              Cancel
                            </button>
                            <button type="submit" disabled={loading}
                              style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                              {loading ? 'Saving...' : 'Update Password'}
                            </button>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

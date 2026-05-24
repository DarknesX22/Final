'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from './providers';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import EditProfileModal from './edit-profile-modal';

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Active link helper — exact match for '/', prefix match for everything else
  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserName(data.user.name || '');
        } else {
          setIsAuthenticated(false);
          setUserName('');
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUserName('');
      }
    };
    
    checkAuthStatus();

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false);
      setUserName('');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const desktopNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Coins', path: '/coins' },
    { name: 'Predictions', path: '/predictions' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'News', path: '/news' },
    { name: 'Learn', path: '/learn' },
    { name: 'About', path: '/about' }
  ];

  const mobileNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Coins', path: '/coins' },
    { name: 'Predictions', path: '/predictions' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'News', path: '/news' },
    { name: 'Learn', path: '/learn' },
    { name: 'About', path: '/about' }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white shadow-md' 
          : 'bg-white/95 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0"
          >
            <Link 
              href="/" 
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Coin<span className="text-gray-600">IQ</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center gap-0.5">
              {desktopNavItems.map((item, index) => {
                const active = isActive(item.path);
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.path}
                      className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        active
                          ? 'text-black bg-black/[0.06]'
                          : 'text-gray-500 hover:text-black hover:bg-black/[0.04]'
                      }`}
                    >
                      {item.name}
                      {/* Active bottom bar */}
                      {active && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-black rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </nav>

          {/* Authentication-dependent navigation */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200">
                      <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 max-w-[100px] truncate">
                        {userName}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Manage your account</p>
                      </div>
                      
                      <button
                        onClick={() => setProfileModalOpen(true)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Edit Profile
                      </button>

                      <Link 
                        href="/dashboard" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    href="/login"
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <EditProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSaved={(name) => setUserName(name)}
      />

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden bg-white border-t border-gray-200 shadow-lg"
        >
          <div className="px-4 py-4 space-y-1">
            {mobileNavItems.map((item, index) => {
              const active = isActive(item.path);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.path}
                    className={`flex items-center justify-between px-4 py-3 text-base font-semibold rounded-xl transition-colors ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-white opacity-80" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <button
                    onClick={() => { setProfileModalOpen(true); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <Link 
                    href="/login" 
                    className="block w-full px-4 py-3 text-center text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup" 
                    className="block w-full px-4 py-3 text-center text-base font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
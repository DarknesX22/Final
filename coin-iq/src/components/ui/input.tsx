import { motion } from 'framer-motion';
import { ChangeEvent } from 'react';

interface InputProps {
  id?: string;
  name?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function Input({ 
  id, 
  name, 
  type = 'text', 
  value, 
  placeholder, 
  required = false, 
  disabled = false, 
  onChange, 
  className = '' 
}: InputProps) {
  return (
    <motion.input
      id={id}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      onChange={onChange}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
      whileFocus={{ scale: 1.01 }}
    />
  );
}
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  animateOnView?: boolean;
  variant?: 'default' | 'elevated' | 'floating';
}

export function Card({ children, className = '', animateOnView = false, variant = 'default' }: CardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md',
    elevated: 'bg-white border border-gray-200 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-lg',
    floating: 'bg-white border border-gray-200 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl relative overflow-hidden',
  };
  
  const baseClasses = variantClasses[variant];
  
  if (animateOnView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        whileHover={variant === 'floating' ? { y: -5 } : undefined}
        className={`${baseClasses} ${className}`}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div className={`${baseClasses} ${className}`}
         onMouseEnter={variant === 'floating' ? (e) => (e.currentTarget.style.transform = 'translateY(-5px)') : undefined}
         onMouseLeave={variant === 'floating' ? (e) => (e.currentTarget.style.transform = 'translateY(0)') : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`text-gray-600 ${className}`}>{children}</div>;
}

interface CardDescriptionProps {
  children: ReactNode;
}

export function CardDescription({ children }: CardDescriptionProps) {
  return <p className="text-sm text-gray-500 mt-1">{children}</p>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>;
}
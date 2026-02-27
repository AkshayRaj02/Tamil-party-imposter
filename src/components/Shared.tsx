import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`glass-panel rounded-2xl p-6 shadow-xl ${className}`}
    >
        {children}
    </motion.div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => (
    <motion.button
        whileTap={{ scale: 0.96 }}
        className={`px-5 py-3 rounded-xl font-semibold flex items-center justify-center transition-colors 
    ${variant === 'primary' ? 'btn-primary text-white' : 'btn-secondary'} 
    ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        {...props}
    >
        {children}
    </motion.button>
);

export const Title: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <h2 className={`text-2xl font-bold mb-6 text-center gradient-text ${className}`}>
        {children}
    </h2>
);

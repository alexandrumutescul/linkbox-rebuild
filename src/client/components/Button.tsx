import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ children, className = '', variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} type={type} {...props}>
      {children}
    </button>
  );
}

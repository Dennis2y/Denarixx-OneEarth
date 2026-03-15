import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Card ---
export function Card({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("glass-panel rounded-2xl overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}
export function Button({ className, variant = 'default', size = 'default', isLoading, children, ...props }: ButtonProps) {
  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        variant === 'default' && "bg-primary text-primary-foreground gold-glow-hover active:scale-[0.98]",
        variant === 'outline' && "border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary active:scale-[0.98]",
        variant === 'ghost' && "text-muted-foreground hover:text-white hover:bg-white/5",
        variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-[0.98]",
        size === 'default' && "h-11 px-5",
        size === 'sm' && "h-9 px-3 text-sm rounded-lg",
        size === 'lg' && "h-14 px-8 text-lg rounded-2xl",
        size === 'icon' && "h-11 w-11",
        className
      )} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

// --- Badge ---
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'critical' | 'warning' | 'info' | 'safe' | 'outline';
}
export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
      variant === 'default' && "bg-primary/10 text-primary border border-primary/30",
      variant === 'critical' && "bg-destructive/10 text-red-400 border border-destructive/30",
      variant === 'warning' && "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      variant === 'info' && "bg-blue-500/10 text-blue-400 border border-blue-500/30",
      variant === 'safe' && "bg-green-500/10 text-green-400 border border-green-500/30",
      variant === 'outline' && "border border-border text-foreground",
      className
    )} {...props}>
      {children}
    </span>
  );
}

// --- Input ---
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={cn(
        "flex w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm text-foreground transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

// --- Select ---
export function Select({ className, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: {label: string, value: string}[] }) {
  return (
    <select 
      className={cn(
        "flex w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm text-foreground transition-all duration-200 appearance-none",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <option value="" disabled className="bg-card text-muted-foreground">Select an option</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-card text-foreground py-2">{opt.label}</option>
      ))}
    </select>
  );
}

// --- Label ---
export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-sm font-medium text-foreground mb-2", className)} {...props}>
      {children}
    </label>
  );
}

// --- Table ---
export function Table({ children, className }: any) {
  return <div className="w-full overflow-x-auto"><table className={cn("w-full text-sm text-left border-collapse", className)}>{children}</table></div>
}
export function Th({ children, className }: any) {
  return <th className={cn("px-6 py-4 font-display font-semibold text-muted-foreground border-b border-border/50 uppercase tracking-wider text-xs", className)}>{children}</th>
}
export function Td({ children, className }: any) {
  return <td className={cn("px-6 py-4 border-b border-border/20 text-foreground", className)}>{children}</td>
}

// --- Modal ---
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-primary/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden z-10"
          >
            <div className="flex justify-between items-center p-6 border-b border-border/50 bg-secondary/30">
              <h3 className="font-display font-bold text-xl text-primary">{title}</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"><X size={20}/></button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Loading Screen ---
export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-2 border-primary/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} className="absolute inset-6 w-12 h-12 object-contain animate-pulse" alt="Loading" />
      </div>
      <p className="text-primary font-display tracking-[0.2em] uppercase text-sm animate-pulse">Initializing Data Stream...</p>
    </div>
  );
}

// --- Skeleton ---
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  );
}

// --- Empty State ---
export function EmptyState({ icon: Icon, title, description, action }: { icon: any, title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border border-primary/20 mb-6 gold-glow">
        <Icon className="w-10 h-10 text-muted-foreground opacity-50" />
      </div>
      <h3 className="text-2xl font-display font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-muted-foreground max-w-md mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

// --- Page Header ---
export function PageHeader({ title, description, actions }: { title: string, description?: string, actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-8 gap-3 sm:gap-4">
       <div className="min-w-0">
         <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight drop-shadow-md leading-tight">{title}</h1>
         {description && <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base md:text-lg">{description}</p>}
       </div>
       {actions && <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}

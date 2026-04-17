'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { isOpen, setIsOpen });
        }
        return child;
      })}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, setIsOpen }: any) => {
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen((prev: boolean) => !prev);
    },
  });
};

export const DropdownMenuContent = ({ children, isOpen, setIsOpen, align = 'end', className }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-2xl mt-2",
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { onClick: (e: React.MouseEvent) => {
                if (child.props.onClick) child.props.onClick(e);
                setIsOpen(false);
              }});
            }
            return child;
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const DropdownMenuItem = ({ children, onClick, className }: any) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-secondary/80 focus:bg-secondary/80 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
};

export const DropdownMenuSeparator = () => (
    <div className="-mx-1 my-1 h-px bg-border/40" />
);

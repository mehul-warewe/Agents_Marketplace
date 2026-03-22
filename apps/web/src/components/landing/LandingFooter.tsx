'use client';

import React from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="py-20 px-6 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
              <Bot size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">warewe</span>
          </div>
          <p className="text-muted max-w-sm">The world's most powerful visual builder for autonomous AI agents. Empowering developers to automate at scale.</p>
        </div>
        <div className="space-y-6">
          <h4 className="font-bold text-lg">Product</h4>
          <ul className="space-y-4 text-sm font-medium text-muted">
            <li><Link href="#features">Features</Link></li>
            <li><Link href="/marketplace">Marketplace</Link></li>
            <li><Link href="#pricing">Pricing</Link></li>
          </ul>
        </div>
        <div className="space-y-6">
          <h4 className="font-bold text-lg">Legal</h4>
          <ul className="space-y-4 text-sm font-medium text-muted">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-muted">
         <p>© 2026 warewe. Built for tomorrow.</p>
         <div className="flex items-center gap-6">
            <Link href="#">Twitter</Link>
            <Link href="#">GitHub</Link>
         </div>
      </div>
    </footer>
  );
}

import { create } from 'zustand';
import api from '@/lib/api';

interface ConnectionStore {
  connectedPlatforms: Set<string>;
  credentials: any[];
  pdAccounts: any[];
  isLoading: boolean;
  initialized: boolean;
  
  fetchConnections: () => Promise<void>;
  isPlatformConnected: (platform: string) => boolean;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connectedPlatforms: new Set(),
  credentials: [],
  pdAccounts: [],
  isLoading: false,
  initialized: false,

  fetchConnections: async () => {
    // Prevent multiple simultaneous fetches
    if (get().isLoading) return;
    
    set({ isLoading: true });
    try {
      const [credsRes, pdAccountsRes] = await Promise.all([
        api.get('/credentials').catch(() => ({ data: [] })),
        api.get('/credentials/pipedream/accounts').catch(() => ({ data: { accounts: [] } }))
      ]);

      const connectedSet = new Set<string>();
      const credentials = credsRes.data || [];
      const pdAccounts = pdAccountsRes.data?.accounts || [];
      
      // Native credentials
      credentials.forEach((c: any) => {
        connectedSet.add(c.type);
      });

      // Pipedream accounts
      pdAccounts.forEach((acc: any) => {
        connectedSet.add(`pd:${acc.app_slug}`);
      });

      set({ 
        connectedPlatforms: connectedSet, 
        credentials,
        pdAccounts,
        isLoading: false, 
        initialized: true 
      });
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      set({ isLoading: false });
    }
  },

  isPlatformConnected: (platform: string) => {
    const { connectedPlatforms, initialized, fetchConnections } = get();
    // Use a normalized slug for comparison
    const normalized = platform.toLowerCase();
    
    // Check for exact match or pd: prefix
    return connectedPlatforms.has(normalized) || 
           connectedPlatforms.has(`pd:${normalized}`) ||
           (normalized.startsWith('pd:') && connectedPlatforms.has(normalized));
  }
}));

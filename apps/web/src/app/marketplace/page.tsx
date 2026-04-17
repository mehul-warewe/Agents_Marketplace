import SidebarLayout from '@/components/SidebarLayout';
import AgentMarketplace from '@/components/AgentMarketplace';

export default function MarketplacePage() {
  return (
    <SidebarLayout title="Marketplace" noScroll={true}>
      <AgentMarketplace />
    </SidebarLayout>
  );
}

import SidebarLayout from '@/components/SidebarLayout';
import AgentMarketplace from '@/components/AgentMarketplace';

export default function MarketplacePage() {
  return (
    <SidebarLayout title="EXTERNAL_REGISTRY // MARKETPLACE">
      <AgentMarketplace />
    </SidebarLayout>
  );
}

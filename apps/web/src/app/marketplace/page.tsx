import SidebarLayout from '@/components/SidebarLayout';
import FleetMarketplace from '@/components/FleetMarketplace';

export default function MarketplacePage() {
  return (
    <SidebarLayout title="Marketplace" noScroll={true}>
      <FleetMarketplace />
    </SidebarLayout>
  );
}

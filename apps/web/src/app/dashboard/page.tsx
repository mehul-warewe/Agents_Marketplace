import SidebarLayout from '@/components/SidebarLayout';
import WorkforceDashboard from '@/components/WorkforceDashboard';

export default function DashboardPage() {
  return (
    <SidebarLayout title="Overview">
      <WorkforceDashboard />
    </SidebarLayout>
  );
}

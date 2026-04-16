import SidebarLayout from '@/components/SidebarLayout';
import AgentDashboard from '@/components/AgentDashboard';

export default function DashboardPage() {
  return (
    <SidebarLayout title="Overview">
      <AgentDashboard />
    </SidebarLayout>
  );
}

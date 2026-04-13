import SidebarLayout from '@/components/SidebarLayout';
import EmployeeDashboard from '@/components/EmployeeDashboard';

export default function EmployeesPage() {
  return (
    <SidebarLayout title="PERSONNEL // FLEET_MANAGEMENT">
      <EmployeeDashboard />
    </SidebarLayout>
  );
}

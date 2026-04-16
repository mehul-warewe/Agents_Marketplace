import SidebarLayout from '@/components/SidebarLayout';
import EmployeeDashboard from '@/components/EmployeeDashboard';

export default function EmployeesPage() {
  return (
    <SidebarLayout title="Employees">
      <EmployeeDashboard />
    </SidebarLayout>
  );
}

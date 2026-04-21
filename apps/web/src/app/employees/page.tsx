import SidebarLayout from '@/components/SidebarLayout';
import WorkforceRegistry from '@/components/WorkforceRegistry';

export default function EmployeesPage() {
  return (
    <SidebarLayout title="Employees">
      <WorkforceRegistry />
    </SidebarLayout>
  );
}

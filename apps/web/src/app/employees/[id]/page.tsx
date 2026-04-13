import SidebarLayout from '@/components/SidebarLayout';
import EmployeeDetail from '@/components/EmployeeDetail';

export default function EmployeePage() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      <EmployeeDetail />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { dashboardRoutes } from '@/lib/dashboard-routes';

export default function DashboardIndexPage() {
  redirect(dashboardRoutes.profile);
}

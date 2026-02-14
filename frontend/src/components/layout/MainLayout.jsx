import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { Skeleton } from '@/components/ui/skeleton';

function AuthenticatedLayout() {
  useStudyTimer();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pt-16 lg:pt-8 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AuthenticatedLayout />;
}

import SideNav from '@/app/components/dashboard/sidenav';
import Header from '@/app/components/dashboard/header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-none w-full md:w-64 hidden md:block">
          <SideNav />
        </div>
        <div className="flex-grow overflow-y-auto p-6 md:p-12 bg-gray-100">{children}</div>
      </div>
    </div>
  );
}

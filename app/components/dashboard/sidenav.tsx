"use client"
import NavLinks from '@/app/components/dashboard/nav-links';
import { Power } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2 bg-sidebar border-r border-gray-500">
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-transparent md:block"></div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-red-600 p-3 text-sm font-semibold text-white hover:bg-red-500 active:bg-red-700 md:flex-none md:justify-start md:p-2 md:px-3 border border-red-500 transition-colors"
        >
          <Power className="w-6" />
          <div className="hidden md:block">Sign Out</div>
        </button>
      </div>
    </div>
  );
}

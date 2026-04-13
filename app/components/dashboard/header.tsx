"use client"

import { useSession } from 'next-auth/react';
import { UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user?.name || session?.user?.email || '';

  return (
    <header className="flex items-center justify-between px-6 py-4 shadow-md w-full flex-shrink-0" style={{ backgroundColor: '#262e37' }}>
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-white font-bold text-xl tracking-tight whitespace-nowrap">
          💸 Expense Tracker
        </Link>
      </div>
      {user && (
        <div className="flex items-center gap-2 text-sm text-gray-200">
          <UserCircle className="h-6 w-6 text-white" />
          <span className="font-medium">{user}</span>
        </div>
      )}
    </header>
  );
}

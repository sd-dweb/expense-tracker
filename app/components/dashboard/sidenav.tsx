"use client"
import NavLinks from '@/app/components/dashboard/nav-links';
import { Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { signOut } from 'next-auth/react';

type SideNavProps = {
  isCollapsed: boolean
  onToggle: () => void
}

export default function SideNav({ isCollapsed, onToggle }: SideNavProps) {
  return (
    <div className="flex h-full flex-col px-2 py-4 bg-sidebar border-r border-gray-500 overflow-hidden">
      <div className="flex grow flex-col space-y-2">
        <NavLinks isCollapsed={isCollapsed} />
        <div className="grow"></div>

        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex h-[48px] w-full items-center justify-start gap-2 rounded-md bg-gray-500 p-2 px-3 text-sm font-semibold text-gray-100 hover:bg-gray-400 active:bg-gray-600 border border-gray-400 transition-colors overflow-hidden"
        >
          <Power className="w-6 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </button>

        {/* Collapse / Expand toggle */}
        <button
          onClick={onToggle}
          className="flex h-[48px] w-full items-center justify-center rounded-md bg-gray-600 p-2 text-gray-100 hover:bg-gray-500 border border-gray-400 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed
            ? <ChevronRight className="w-5 shrink-0" />
            : <ChevronLeft className="w-5 shrink-0" />
          }
        </button>
      </div>
    </div>
  );
}

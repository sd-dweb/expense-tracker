"use client";
import { useState } from "react";
import SideNav from "@/app/components/dashboard/sidenav";
import Header from "@/app/components/dashboard/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`flex-none hidden md:block transition-all duration-300 ${
            isCollapsed ? "w-16" : "w-56"
          }`}
        >
          <SideNav
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed((prev) => !prev)}
          />
        </div>
        <div className="flex-grow overflow-y-auto p-6 md:p-12 bg-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

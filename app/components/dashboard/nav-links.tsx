"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, Receipt } from 'lucide-react';

const links = [
	{ name: 'Home', href: '/dashboard', icon: Home },
	{ name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
];

type NavLinksProps = {
	isCollapsed: boolean
}

export default function NavLinks({ isCollapsed }: NavLinksProps) {
	const pathname = usePathname();
	return (
		<>
			{links.map((link) => {
				const LinkIcon = link.icon;
				return (
					<Link
						key={link.name}
						href={link.href}
						className={clsx(
							'flex h-[48px] items-center justify-start gap-2 rounded-md bg-gray-500 p-2 px-3 text-sm font-medium text-gray-100 hover:bg-indigo-600 hover:text-white border border-gray-400 overflow-hidden transition-colors',
							{
								'bg-indigo-600 text-white border-indigo-500': pathname === link.href,
							},
						)}
						title={isCollapsed ? link.name : ''}
					>
						<LinkIcon className="w-6 shrink-0" />
						{!isCollapsed && <p className="whitespace-nowrap">{link.name}</p>}
					</Link>
				);
			})}
		</>
	);
}

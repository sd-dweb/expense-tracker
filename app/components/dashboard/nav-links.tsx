"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, Receipt } from 'lucide-react';

const links = [
	{ name: 'Home', href: '/dashboard', icon: Home },
	{ name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
];

export default function NavLinks() {
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
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-500 p-3 text-sm font-medium text-gray-100 hover:bg-indigo-600 hover:text-white md:flex-none md:justify-start md:p-2 md:px-3 border border-gray-400',
							{
								'bg-indigo-600 text-white border-indigo-500': pathname === link.href,
							},
						)}
					>
						<LinkIcon className="w-6" />
						<p className="hidden md:block">{link.name}</p>
					</Link>
				);
			})}
		</>
	);
}

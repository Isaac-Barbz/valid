"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  className: string;
  activeClassName: string;
  inactiveClassName: string;
  children: ReactNode;
}

/** Link that marks itself as the current page when its path is open. */
export function NavLink({ href, className, activeClassName, inactiveClassName, children }: NavLinkProps) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : inactiveClassName}`}
    >
      {children}
    </Link>
  );
}

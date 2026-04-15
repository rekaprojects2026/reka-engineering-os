'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FolderKanban,
  CheckSquare,
  FileText,
  UserSquare2,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { logout } from '@/app/auth/login/actions'
import { getInitials } from '@/lib/utils/formatters'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',    icon: <LayoutDashboard size={16} /> },
  { label: 'Clients',     href: '/clients',      icon: <Users size={16} /> },
  { label: 'Intakes',     href: '/intakes',      icon: <ClipboardList size={16} /> },
  { label: 'Projects',    href: '/projects',     icon: <FolderKanban size={16} /> },
  { label: 'Tasks',       href: '/tasks',        icon: <CheckSquare size={16} /> },
  { label: 'Deliverables',href: '/deliverables', icon: <FileText size={16} /> },
  { label: 'Team',        href: '/team',         icon: <UserSquare2 size={16} /> },
  { label: 'Settings',    href: '/settings',     icon: <Settings size={16} /> },
]

interface AppSidebarProps {
  userFullName?: string
  userEmail?: string
}

export function AppSidebar({ userFullName = 'User', userEmail = '' }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* App brand */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            backgroundColor: 'var(--color-primary)',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '11px' }}>EA</span>
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Agency OS
        </span>
      </div>

      {/* Nav */}
      <nav
        className="flex-1"
        style={{ padding: '8px', overflowY: 'auto' }}
        aria-label="Main navigation"
      >
        <ul role="list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors no-underline',
                  )}
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User menu */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '12px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {getInitials(userFullName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userFullName}
            </p>
            {userEmail && (
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userEmail}
              </p>
            )}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'background-color 0.1s, color 0.1s',
            }}
            className="hover:bg-[#FEE2E2] hover:text-[#DC2626]"
            aria-label="Sign out"
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}

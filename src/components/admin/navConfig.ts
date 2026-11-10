import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Sparkles,
  FileDown,
  Package,
  ScrollText,
  Settings,
  UserCog,
  Inbox,
  UserCheck,
} from 'lucide-react'

export const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/assistance-requests', label: 'Assistance Requests', icon: Inbox },
  { to: '/admin/access-requests', label: 'Access Requests', icon: UserCheck },
  { to: '/admin/audit-logs', label: 'View Audit Logs', icon: ScrollText },
  { to: '/admin/reports', label: 'Export Reports', icon: FileDown },
  { to: '/admin/aid-records', label: 'Submitted Aid Records', icon: Package },
  { to: '/admin/users', label: 'Manage Users', icon: UserCog },
  { to: '/admin/associations', label: 'Manage Association', icon: Building2 },
  { to: '/admin/recommendations', label: 'View AI-Generated Recommendation', icon: Sparkles },
  { to: '/admin/programs', label: 'Manage Assistance Lists', icon: ClipboardList },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

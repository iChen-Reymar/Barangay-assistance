import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  ClipboardCheck,
  FileDown,
  ScrollText,
  Settings,
} from 'lucide-react'

export const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/reports', label: 'Export Reports', icon: FileDown },
  { to: '/admin/associations', label: 'Manage Association', icon: Building2 },
  { to: '/admin/recommendations?status=approved', label: 'Approved Recommendations', icon: ClipboardCheck },
  { to: '/admin/programs', label: 'Assistance Lists', icon: ClipboardList },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

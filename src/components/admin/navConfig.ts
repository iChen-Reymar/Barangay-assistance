import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Sparkles,
  FileDown,
  Package,
  ScrollText,
  Settings,
  Users,
} from 'lucide-react'

export const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/people', label: 'People & Requests', icon: Users },
  { to: '/admin/reports', label: 'Export Reports', icon: FileDown },
  { to: '/admin/aid-records', label: 'Submitted Aid Records', icon: Package },
  { to: '/admin/associations', label: 'Manage Association', icon: Building2 },
  { to: '/admin/recommendations', label: 'View AI-Generated Recommendation', icon: Sparkles },
  { to: '/admin/programs', label: 'Manage Assistance Lists', icon: ClipboardList },
  { to: '/admin/audit-logs', label: 'View Audit Logs', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

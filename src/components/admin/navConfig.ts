import {
  LayoutDashboard,
  Users,
  UserCircle,
  Package,
  Shield,
  FileText,
  Sparkles,
  ListOrdered,
  BarChart3,
  ScrollText,
  Settings,
  UserCheck,
} from 'lucide-react'

export const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/associations', label: 'Associations', icon: Users },
  { to: '/admin/beneficiaries', label: 'Beneficiaries', icon: UserCircle },
  { to: '/admin/programs', label: 'Assistance Programs', icon: Package },
  { to: '/admin/vulnerability-assessment', label: 'Vulnerability Assessment', icon: Shield },
  { to: '/admin/assistance-requests', label: 'Assistance Requests', icon: FileText },
  { to: '/admin/recommendations', label: 'Recommendations', icon: Sparkles },
  { to: '/admin/priority-list', label: 'Priority List', icon: ListOrdered },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/access-requests', label: 'Access Requests', icon: UserCheck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

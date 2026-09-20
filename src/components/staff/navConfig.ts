import {
  LayoutDashboard,
  UserCircle,
  Shield,
  FileText,
  ListOrdered,
  Sparkles,
  CheckCircle,
  BarChart3,
  Settings,
} from 'lucide-react'

export const staffNavItems = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/beneficiaries', label: 'Beneficiaries', icon: UserCircle },
  { to: '/staff/vulnerability-assessment', label: 'Vulnerability Assessment', icon: Shield },
  { to: '/staff/assistance-requests', label: 'Assistance Requests', icon: FileText },
  { to: '/staff/priority-list', label: 'Priority List', icon: ListOrdered },
  { to: '/staff/recommendations', label: 'Recommendations', icon: Sparkles },
  { to: '/staff/approved-requests', label: 'Approved Requests', icon: CheckCircle },
  { to: '/staff/reports', label: 'Reports', icon: BarChart3 },
  { to: '/staff/settings', label: 'Settings', icon: Settings },
]

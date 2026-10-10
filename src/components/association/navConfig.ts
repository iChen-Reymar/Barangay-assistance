import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  Sparkles,
  Package,
  Bell,
  Settings,
} from 'lucide-react'

export const associationNavItems = [
  { to: '/association', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/association/members', label: 'Manage Association Members', icon: Users },
  { to: '/association/assistance-request', label: 'Submit Assistance Request', icon: FileText },
  { to: '/association/request-status', label: 'Track Request Status', icon: GitBranch },
  { to: '/association/ai-recommendations', label: 'View AI Recommendations', icon: Sparkles },
  { to: '/association/aid-records', label: 'Submit Aid Records', icon: Package },
  { to: '/association/notifications', label: 'Notifications', icon: Bell },
  { to: '/association/settings', label: 'Settings', icon: Settings },
]

export const associationUser = {
  initials: 'AH',
  name: 'Association Head',
  role: 'Association Head',
}

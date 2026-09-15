import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  GitBranch,
  Sparkles,
  Package,
  CheckCircle,
  Settings,
} from 'lucide-react'

export const associationNavItems = [
  { to: '/association', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/association/profile', label: 'My Association', icon: Building2 },
  { to: '/association/members', label: 'My Members', icon: Users },
  { to: '/association/assistance-request', label: 'Assistance Request', icon: FileText },
  { to: '/association/request-status', label: 'Request Status', icon: GitBranch },
  { to: '/association/ai-recommendations', label: 'AI Recommendations', icon: Sparkles },
  { to: '/association/aid-records', label: 'Aid Records', icon: Package },
  { to: '/association/approved-requests', label: 'Approved Requests', icon: CheckCircle },
  { to: '/association/settings', label: 'Settings', icon: Settings },
]

export const associationUser = {
  initials: 'RS',
  name: 'Ricardo Lopez',
  role: 'Association Head',
}

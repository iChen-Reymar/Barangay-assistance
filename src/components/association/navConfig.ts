import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  Sparkles,
  Package,
  Settings,
  CircleCheck,
} from 'lucide-react'

export const associationNavItems = [
  { to: '/association', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/association/members', label: 'Manage Association Members', icon: Users },
  { to: '/association/assistance-request', label: 'Submit Assistance Request', icon: FileText },
  { to: '/association/request-status', label: 'Track Request Status', icon: GitBranch },
  { to: '/association/approved-requests', label: 'Generated Lists', icon: CircleCheck },
  { to: '/association/ai-recommendations', label: 'View AI Recommendations', icon: Sparkles },
  { to: '/association/aid-records', label: 'Submit Aid Records', icon: Package },
  { to: '/association/settings', label: 'Settings', icon: Settings },
]


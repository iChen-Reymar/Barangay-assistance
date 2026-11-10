import {
  LayoutDashboard,
  Shield,
  ListOrdered,
  ClipboardCheck,
  Sparkles,
  PieChart,
  Package,
  Settings,
  Inbox,
  CircleCheck,
} from 'lucide-react'

export const staffNavItems = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/assistance-requests', label: 'Assistance Requests', icon: Inbox },
  { to: '/staff/verify-qualification', label: 'Verify Qualification', icon: ClipboardCheck },
  { to: '/staff/vulnerability-assessment', label: 'Classify Beneficiaries', icon: Shield },
  { to: '/staff/priority-list', label: 'Generate Assistance Lists', icon: ListOrdered },
  { to: '/staff/aid-records', label: 'Submitted Aid Records', icon: Package },
  { to: '/staff/recommendations', label: 'View AI-Generated Recommendation', icon: Sparkles },
  { to: '/staff/approved-requests', label: 'Generated Lists', icon: CircleCheck },
  { to: '/staff/status-reports', label: 'View Status Reports', icon: PieChart },
  { to: '/staff/settings', label: 'Settings', icon: Settings },
]

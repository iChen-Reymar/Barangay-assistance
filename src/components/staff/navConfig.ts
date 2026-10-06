import {
  LayoutDashboard,
  UserCircle,
  Shield,
  ListOrdered,
  ClipboardCheck,
  Sparkles,
  PieChart,
  FileDown,
  Settings,
} from 'lucide-react'

export const staffNavItems = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/beneficiaries', label: 'Input Beneficiaries Data', icon: UserCircle },
  { to: '/staff/vulnerability-assessment', label: 'Classify Beneficiaries', icon: Shield },
  { to: '/staff/priority-list', label: 'Generate Assistance Lists', icon: ListOrdered },
  { to: '/staff/reports', label: 'Export Reports', icon: FileDown },
  { to: '/staff/recommendations', label: 'View AI-Generated Recommendation', icon: Sparkles },
  { to: '/staff/status-reports', label: 'View Status Reports', icon: PieChart },
  { to: '/staff/verify-qualification', label: 'Verify Qualification', icon: ClipboardCheck },
  { to: '/staff/settings', label: 'Settings', icon: Settings },
]

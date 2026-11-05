import {
  LayoutDashboard,
  Shield,
  ListOrdered,
  ClipboardCheck,
  Sparkles,
  PieChart,
  FileDown,
  Package,
  Settings,
} from 'lucide-react'

export const staffNavItems = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/vulnerability-assessment', label: 'Classify Beneficiaries', icon: Shield },
  { to: '/staff/priority-list', label: 'Generate Assistance Lists', icon: ListOrdered },
  { to: '/staff/reports', label: 'Export Reports', icon: FileDown },
  { to: '/staff/aid-records', label: 'Submitted Aid Records', icon: Package },
  { to: '/staff/recommendations', label: 'View AI-Generated Recommendation', icon: Sparkles },
  { to: '/staff/status-reports', label: 'View Status Reports', icon: PieChart },
  { to: '/staff/verify-qualification', label: 'Verify Qualification', icon: ClipboardCheck },
  { to: '/staff/settings', label: 'Settings', icon: Settings },
]

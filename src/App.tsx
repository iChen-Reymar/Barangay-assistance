import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import AssociationLayout from './layouts/AssociationLayout'
import StaffLayout from './layouts/StaffLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RequestAccessPage from './pages/RequestAccessPage'
import StaffRequestAccessPage from './pages/StaffRequestAccessPage'
import RegisterAssociationHeadPage from './pages/RegisterAssociationHeadPage'
import DashboardPage from './pages/admin/DashboardPage'
import AssociationsPage from './pages/admin/AssociationsPage'
import BeneficiariesPage from './pages/admin/BeneficiariesPage'
import ProgramsPage from './pages/admin/ProgramsPage'
import VulnerabilityAssessmentPage from './pages/admin/VulnerabilityAssessmentPage'
import AssistanceRequestsPage from './pages/admin/AssistanceRequestsPage'
import RecommendationsPage from './pages/admin/RecommendationsPage'
import PriorityListPage from './pages/admin/PriorityListPage'
import ReportsPage from './pages/admin/ReportsPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import AccessRequestsPage from './pages/admin/AccessRequestsPage'
import SettingsPage from './pages/admin/SettingsPage'
import AssociationDashboardPage from './pages/association/DashboardPage'
import MembersPage from './pages/association/MembersPage'
import AssociationProfilePage from './pages/association/AssociationProfilePage'
import AssistanceRequestPage from './pages/association/AssistanceRequestPage'
import RequestStatusPage from './pages/association/RequestStatusPage'
import AiRecommendationsPage from './pages/association/AiRecommendationsPage'
import AidRecordsPage from './pages/association/AidRecordsPage'
import ApprovedRequestsPage from './pages/association/ApprovedRequestsPage'
import NotificationsPage from './pages/association/NotificationsPage'
import AssociationSettingsPage from './pages/association/SettingsPage'
import StaffDashboardPage from './pages/staff/DashboardPage'
import StaffBeneficiariesPage from './pages/staff/BeneficiariesPage'
import AddBeneficiaryPage from './pages/staff/AddBeneficiaryPage'
import StaffVulnerabilityAssessmentPage from './pages/staff/VulnerabilityAssessmentPage'
import StaffAssistanceRequestsPage from './pages/staff/AssistanceRequestsPage'
import StaffPriorityListPage from './pages/staff/PriorityListPage'
import StaffRecommendationsPage from './pages/staff/RecommendationsPage'
import StaffApprovedRequestsPage from './pages/staff/ApprovedRequestsPage'
import StaffReportsPage from './pages/staff/ReportsPage'
import StaffSettingsPage from './pages/staff/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
        <Route path="/request-access/staff" element={<StaffRequestAccessPage />} />
        <Route path="/register/association-head" element={<RegisterAssociationHeadPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="associations" element={<AssociationsPage />} />
          <Route path="beneficiaries" element={<BeneficiariesPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="vulnerability-assessment" element={<VulnerabilityAssessmentPage />} />
          <Route path="assistance-requests" element={<AssistanceRequestsPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="priority-list" element={<PriorityListPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="access-requests" element={<AccessRequestsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="/association"
          element={
            <ProtectedRoute allowedRoles={['association']}>
              <AssociationLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AssociationDashboardPage />} />
          <Route path="profile" element={<AssociationProfilePage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="assistance-request" element={<AssistanceRequestPage />} />
          <Route path="request-status" element={<RequestStatusPage />} />
          <Route path="ai-recommendations" element={<AiRecommendationsPage />} />
          <Route path="aid-records" element={<AidRecordsPage />} />
          <Route path="approved-requests" element={<ApprovedRequestsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<AssociationSettingsPage />} />
        </Route>

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffDashboardPage />} />
          <Route path="beneficiaries" element={<StaffBeneficiariesPage />} />
          <Route path="beneficiaries/add" element={<AddBeneficiaryPage />} />
          <Route path="vulnerability-assessment" element={<StaffVulnerabilityAssessmentPage />} />
          <Route path="assistance-requests" element={<StaffAssistanceRequestsPage />} />
          <Route path="priority-list" element={<StaffPriorityListPage />} />
          <Route path="recommendations" element={<StaffRecommendationsPage />} />
          <Route path="approved-requests" element={<StaffApprovedRequestsPage />} />
          <Route path="reports" element={<StaffReportsPage />} />
          <Route path="settings" element={<StaffSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

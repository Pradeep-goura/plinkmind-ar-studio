import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { HomePage } from '../../pages/HomePage'
import { FeaturesPage } from '../../pages/FeaturesPage'
import { SignInPage } from '../../pages/SignInPage'
import { RegisterPage } from '../../pages/RegisterPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { PrivacyPage } from '../../pages/PrivacyPage'
import { TermsPage } from '../../pages/TermsPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { StatusPage } from '../../pages/StatusPage'
export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
                <Route path="/status" element={<StatusPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
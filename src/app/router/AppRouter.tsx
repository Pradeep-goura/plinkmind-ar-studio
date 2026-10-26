import { Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { RequireAuth } from '../../features/auth/RequireAuth'
import { DashboardPage } from '../../pages/DashboardPage'
import { FeaturesPage } from '../../pages/FeaturesPage'
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage'
import { HomePage } from '../../pages/HomePage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { PrivacyPage } from '../../pages/PrivacyPage'
import { RegisterPage } from '../../pages/RegisterPage'
import { ResetPasswordPage } from '../../pages/ResetPasswordPage'
import { SignInPage } from '../../pages/SignInPage'
import { StatusPage } from '../../pages/StatusPage'
import { TermsPage } from '../../pages/TermsPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
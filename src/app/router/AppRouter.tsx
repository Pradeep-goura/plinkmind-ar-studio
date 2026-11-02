import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { RequireAuth } from '../../features/auth/RequireAuth'
import { AssetsPage } from '../../pages/AssetsPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { DiagnosticsPage } from '../../pages/DiagnosticsPage'
import { EditorPage } from '../../pages/EditorPage'
import { FeaturesPage } from '../../pages/FeaturesPage'
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage'
import { HomePage } from '../../pages/HomePage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { PrivacyPage } from '../../pages/PrivacyPage'
import { PublicExperiencePage } from '../../pages/PublicExperiencePage'
import { RegisterPage } from '../../pages/RegisterPage'
import { ResetPasswordPage } from '../../pages/ResetPasswordPage'
import { SignInPage } from '../../pages/SignInPage'
import { TermsPage } from '../../pages/TermsPage'

// The AR lab pulls in all of Three.js, so it is only downloaded when someone opens it.
const ArLabPage = lazy(() =>
  import('../../pages/ArLabPage').then((module) => ({ default: module.ArLabPage })),
)

export function AppRouter() {
  return (
    <Routes>
      {/* Normal website pages: they share the site header and footer. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Pages without the site header: the public AR page, the AR lab and the device check. */}
      <Route path="/experience/:slug" element={<PublicExperiencePage />} />
      <Route
        path="/lab/ar/:slug"
        element={
          <Suspense fallback={<p role="status" className="p-8">Loading...</p>}>
            <ArLabPage />
          </Suspense>
        }
      />
      <Route path="/diag" element={<DiagnosticsPage />} />

      {/* Pages that need a login. */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard/projects/:projectId/editor" element={<EditorPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/assets" element={<AssetsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
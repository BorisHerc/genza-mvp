import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import {
  GuestRoute,
  AdminRoute,
  OnboardingRoute,
  ProtectedRoute,
} from './components/auth/RouteGuards'
import { LegalLayout } from './components/legal/LegalLayout'
import { AppLayout } from './components/layout/AppLayout'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { CurrencyProvider } from './context/CurrencyContext'
import { GeolocationProvider } from './context/GeolocationContext'
import { LocaleProvider } from './context/LocaleContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { ToastProvider } from './context/ToastContext'
import { getLegalDocument, getLegalPath } from './content/legal'
import { AdminPage } from './pages/AdminPage'
import { BrowsePage } from './pages/BrowsePage'
import { ChatPage } from './pages/ChatPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { HomePage } from './pages/HomePage'
import { MessagesPage } from './pages/MessagesPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { PostTaskPage } from './pages/PostTaskPage'
import { ProfilePage } from './pages/ProfilePage'
import { PublicProfilePage } from './pages/PublicProfilePage'
import { PublicTaskPage } from './pages/PublicTaskPage'
import { LoginPage } from './pages/auth/LoginPage'
import { ProfileSetupPage } from './pages/auth/ProfileSetupPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { LegalDocumentPage } from './pages/legal/LegalDocumentPage'
import { TrustSafetyPage } from './pages/legal/TrustSafetyPage'

function LegalLegacyRedirect() {
  const { slug } = useParams<{ slug: string }>()
  const document = slug ? getLegalDocument(slug) : undefined
  if (document) return <Navigate to={getLegalPath(document.slug)} replace />
  return <Navigate to="/trust" replace />
}

function App() {
  return (
    <LocaleProvider>
    <AuthProvider>
      <GeolocationProvider>
      <CurrencyProvider>
      <ToastProvider>
        <NotificationsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/signup" element={<SignUpPage />} />
            </Route>

            <Route element={<OnboardingRoute />}>
              <Route path="/auth/role" element={<Navigate to="/auth/profile-setup" replace />} />
              <Route path="/auth/profile-setup" element={<ProfileSetupPage />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/u/:username" element={<PublicProfilePage />} />
              <Route path="/tasker/:userId" element={<PublicProfilePage />} />
              <Route path="/tasks/:taskId" element={<PublicTaskPage />} />
              <Route path="/tasks/:taskId/:slug" element={<PublicTaskPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout showBottomNav={false} />}>
                <Route path="post" element={<PostTaskPage />} />
                <Route path="messages/:chatId" element={<ChatPage />} />
                <Route path="profile/edit" element={<EditProfilePage />} />
              </Route>

              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route element={<AppLayout showBottomNav={false} />}>
                  <Route path="admin" element={<AdminPage />} />
                </Route>
              </Route>
            </Route>

            <Route element={<LegalLayout />}>
              <Route path="/terms" element={<LegalDocumentPage />} />
              <Route path="/privacy" element={<LegalDocumentPage />} />
              <Route path="/disclaimer" element={<LegalDocumentPage />} />
              <Route path="/community-guidelines" element={<LegalDocumentPage />} />
              <Route path="/safety" element={<LegalDocumentPage />} />
              <Route path="/cookies" element={<LegalDocumentPage />} />
              <Route path="/trust" element={<TrustSafetyPage />} />
              <Route path="/legal/:slug" element={<LegalLegacyRedirect />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </NotificationsProvider>
      </ToastProvider>
      </CurrencyProvider>
      </GeolocationProvider>
    </AuthProvider>
    </LocaleProvider>
  )
}

export default App

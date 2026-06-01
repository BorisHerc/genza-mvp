import { Navigate } from 'react-router-dom'

/** Legacy route — role selection removed in dual-role marketplace. */
export function RoleSelectionPage() {
  return <Navigate to="/auth/profile-setup" replace />
}

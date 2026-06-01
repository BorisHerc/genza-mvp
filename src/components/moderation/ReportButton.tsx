import { useState } from 'react'
import { Flag } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LocaleContext'
import { Button } from '../ui/Button'
import { ReportDialog, type ReportTarget } from './ReportDialog'

interface ReportButtonProps {
  target: ReportTarget
  variant?: 'ghost' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

export function ReportButton({
  target,
  variant = 'ghost',
  size = 'sm',
  className = '',
}: ReportButtonProps) {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    if (!isAuthenticated || !user) {
      navigate('/auth/login', { state: { from: location.pathname } })
      return
    }
    setOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        <Flag className="h-4 w-4" />
        {t('moderation.report')}
      </Button>

      {user && (
        <ReportDialog
          open={open}
          target={target}
          reporterId={user.id}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

import { differenceInDays, format } from 'date-fns'
import { Link } from 'react-router-dom'

import PageContainer from '@/app/PageContainer'
import { exportAllData, useLastExportAt } from '../backup/export'
import { useDailyExerciseLog } from '../session/dailyExerciseLogs.store'
import LogCalendar from './LogCalendar'

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function HomePage() {
  const lastExportAt = useLastExportAt()
  const showBackupReminder =
    lastExportAt === undefined || differenceInDays(new Date(), new Date(lastExportAt)) > 14

  const todayLog = useDailyExerciseLog(todayKey())
  const hasActiveSession =
    todayLog !== 'loading' && todayLog !== null && todayLog.exerciseIds.length > 0

  return (
    <>
      <PageContainer>
        {showBackupReminder && (
          <button
            type="button"
            onClick={() => exportAllData()}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-200 active:bg-amber-500/20"
          >
            {lastExportAt === undefined
              ? 'Kamu belum pernah ekspor data.'
              : 'Sudah lebih dari 14 hari sejak ekspor terakhir.'}{' '}
            Cadangkan secara berkala supaya data tidak hilang. Ketuk untuk ekspor sekarang.
          </button>
        )}

        <header className="pt-2">
          <h1 className="text-2xl font-semibold">Workout Log</h1>
        </header>

        <div className="w-full">
          <LogCalendar />
        </div>

        <div className="h-20 md:h-24" />
      </PageContainer>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 md:bottom-6 md:pl-56">
        <div className="mx-auto max-w-md px-4 md:max-w-3xl lg:max-w-5xl">
          <Link
            to={hasActiveSession ? '/session/active' : '/session'}
            className={`flex min-h-14 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-lg md:max-w-xs ${
              hasActiveSession
                ? 'bg-emerald-500 shadow-emerald-500/20 active:bg-emerald-600'
                : 'bg-primary-500 shadow-primary-500/20 active:bg-primary-600'
            }`}
          >
            {hasActiveSession ? 'Kembali ke Latihan' : 'Mulai Latihan'}
          </Link>
        </div>
      </div>
    </>
  )
}

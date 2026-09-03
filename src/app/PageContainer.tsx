import type { ReactNode } from 'react'

const widthByVariant = {
  // halaman jelajah/daftar: manfaatkan lebar ekstra di tablet/desktop
  browse: 'max-w-md md:max-w-3xl lg:max-w-5xl',
  // form: dibatasi supaya input tidak melebar berlebihan di layar besar
  form: 'max-w-md md:max-w-xl lg:max-w-2xl',
}

interface PageContainerProps {
  children: ReactNode
  variant?: keyof typeof widthByVariant
}

export default function PageContainer({ children, variant = 'browse' }: PageContainerProps) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 md:pl-56">
      <main
        className={`mx-auto flex min-h-dvh w-full flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pt-10 md:pb-10 ${widthByVariant[variant]}`}
      >
        {children}
      </main>
    </div>
  )
}

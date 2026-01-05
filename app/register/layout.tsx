import { Suspense } from 'react'

export default function RegisterLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col justify-center h-screen'>
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </div>
  )
}



// /src/app/layout.tsx - layout page


import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import Navbar from './_components/layout/navbar';
import { SessionProvider } from "next-auth/react";


async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token.value, process.env.JWT_SECRET!) as {
      id: string
      email: string
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    return user
  } catch {
    return null
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/login", "/signup", "/reset-password"]
const PRIVATE_ROUTES = ["/meeting", "/desktop"]

const isPublic = (pathname: string) =>
  PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

const isPrivate = (pathname: string) =>
  PRIVATE_ROUTES.some((route) => pathname.startsWith(route))

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has("salesai_auth")

  if (isPrivate(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isPublic(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/desktop", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/signup", "/reset-password", "/meeting/:path*", "/desktop/:path*"],
}
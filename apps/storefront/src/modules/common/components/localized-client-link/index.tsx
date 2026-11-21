"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 *
 * Outside a `[countryCode]` route (e.g. the root not-found page) the href is used as is,
 * and the middleware redirects it to the default region.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  const { countryCode } = useParams()

  return (
    <Link href={countryCode ? `/${countryCode}${href}` : href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink

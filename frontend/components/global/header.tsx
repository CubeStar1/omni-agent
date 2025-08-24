"use client"

import * as React from "react"
import Link from "next/link"
import { ModeToggle } from "./theme-switcher"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { NavigationMobile } from "./header-mobile"
import { motion, useAnimationControls, LayoutGroup } from "framer-motion"
import { HeaderConfig } from "@/lib/config/header"

interface HeaderProps {
  config: HeaderConfig
}

function BlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <linearGradient id="blob-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.15)" />
          </linearGradient>
          <filter id="blob-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -15" result="blob" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}

export function Header({ config }: HeaderProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const blobControls = useAnimationControls()

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <div className="m-10" />

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed left-0 right-0 top-0 z-40"
      >
        <motion.div
          animate={{
            maxWidth: isScrolled ? "68rem" : "100%",
            margin: isScrolled ? "1rem auto" : "0 auto",
            borderRadius: isScrolled ? "9999px" : "0",
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn(
            "bg-background/80 border backdrop-blur-xl transition-all duration-500",
            isScrolled 
              ? "bg-background/80 mx-4 md:mx-auto shadow-lg " 
              : "shadow-sm "
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={cn(
              "flex items-center justify-between",
              isScrolled 
                ? "h-14" 
                : "h-16"
            )}>
              <Link href="/" className="group relative flex items-center gap-3">
                <Image src={config.brand.icon} alt={config.brand.title} width={24} height={24} />
                <span className="font-medium tracking-tight">{config.brand.title}</span>
              </Link>

              <nav className="relative hidden md:block">
                <LayoutGroup>
                  <motion.ul className="flex items-center gap-1">
                    {config.navigationLinks.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                      return (
                        <motion.li key={item.href} className="relative flex items-center justify-center">
                          <Link
                            href={item.href}
                            className={cn(
                              "relative flex items-center justify-center rounded-full px-4 py-2 text-sm transition-colors duration-200",
                              isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"
                            )}
                          >
                            {item.label}
                          </Link>
                          {isActive && (
                            <motion.div
                              layoutId="blob"
                              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-blue-500/30 to-sky-400/30 dark:from-blue-400/30 dark:to-sky-300/30 shadow-[0_0_15px_rgba(56,189,248,0.3)] dark:shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                                mass: 1,
                              }}
                            >
                              <BlobBackground />
                            </motion.div>
                          )}
                        </motion.li>
                      )
                    })}
                  </motion.ul>
                </LayoutGroup>
              </nav>

              <div className="flex items-center gap-2">
                <div className="md:hidden">
                  <NavigationMobile navigationLinks={config.navigationLinks} />
                </div>
                <ModeToggle />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.header>
    </>
  )
}
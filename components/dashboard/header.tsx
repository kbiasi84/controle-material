'use client'

import { Menu, Home, ChevronRight, Building2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

interface HeaderProps {
  userName: string
  unidadeNome: string
  perfil: string
}

export function Header({ userName, unidadeNome, perfil }: HeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const pathname = usePathname()

  // Breadcrumb baseado no pathname
  const getBreadcrumb = () => {
    const paths = pathname.split('/').filter(Boolean)
    if (paths.length === 1 && paths[0] === 'dashboard') return 'Dashboard'
    if (paths.includes('admin')) {
      const page = paths[paths.length - 1]
      return page.charAt(0).toUpperCase() + page.slice(1)
    }
    const lastPath = paths[paths.length - 1]
    return lastPath ? lastPath.charAt(0).toUpperCase() + lastPath.slice(1) : 'Dashboard'
  }

  return (
    <header className="h-20 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 border-b border-slate-200 shrink-0">
      {/* Left Side - Menu & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
              <span className="sr-only">Abrir menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-slate-900 border-slate-800">
            <Sidebar
              perfil={perfil}
              unidadeNome={unidadeNome}
              userName={userName}
              onNavigate={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <nav className="flex items-center text-slate-500 text-base">
          <Link href="/dashboard" className="hover:text-slate-700 transition-colors p-1">
            <Home className="w-5 h-5" />
          </Link>
          <ChevronRight className="w-5 h-5 mx-2 text-slate-300" />
          <span className="font-bold text-slate-800 text-lg">{getBreadcrumb()}</span>
        </nav>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {/* Unit Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border-2 border-blue-100">
          <Building2 className="w-4 h-4" />
          <span>Unidade: {unidadeNome}</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 pl-6 border-l-2 border-slate-200 cursor-pointer group">
          <div className="hidden sm:block text-right">
            <p className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {userName}
            </p>
            <p className="text-sm text-slate-500">{perfil}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-200 overflow-hidden border-2 border-white shadow-md">
            <Image
              src="/avatar.jpg"
              alt={userName}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

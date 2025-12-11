'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  History,
  Users,
  Package,
  UserCog,
  Building2,
  LogOut,
  Boxes,
  FileText,
} from 'lucide-react'
import { logoutAction } from '@/app/dashboard/actions'

interface SidebarProps {
  perfil: string
  unidadeNome: string
  userName: string
  onNavigate?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export function Sidebar({ perfil, unidadeNome, userName, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  const isControladorOrGestor = perfil === 'CONTROLADOR' || perfil === 'GESTOR'
  const isGestor = perfil === 'GESTOR'

  const menuPrincipal: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-6 h-6" /> },
    { label: 'Minhas Retiradas', href: '/dashboard/retiradas', icon: <ShoppingBag className="w-6 h-6" /> },
    { label: 'Histórico', href: '/dashboard/historico', icon: <History className="w-6 h-6" /> },
  ]

  const menuOperacional: NavItem[] = [
    { label: 'Controle de Devolução', href: '/dashboard/devolucao', icon: <Users className="w-6 h-6" /> },
  ]

  const menuAdmin: NavItem[] = [
    { label: 'Materiais', href: '/dashboard/materiais', icon: <Package className="w-6 h-6" /> },
    { label: 'Unidades', href: '/dashboard/unidades', icon: <Building2 className="w-6 h-6" /> },
    { label: 'Usuários', href: '/dashboard/usuarios', icon: <UserCog className="w-6 h-6" /> },
    { label: 'Relatórios', href: '/dashboard/relatorios', icon: <FileText className="w-6 h-6" /> },
  ]

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center px-6 py-4 text-base font-semibold transition-all border-r-4 ${isActive
          ? 'bg-slate-800 text-white border-blue-500'
          : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white'
          }`}
      >
        {item.icon}
        <span className="ml-4">{item.label}</span>
      </Link>
    )
  }

  const NavGroup = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-4">
      <h3 className="px-6 mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <nav>
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </div>
  )

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 text-slate-300">
      {/* Logo Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center mr-3 shadow-lg">
          <Boxes className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-bold text-xl text-white tracking-wide">SCMP</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <NavGroup title="Operacional" items={menuPrincipal} />

        {isControladorOrGestor && (
          <NavGroup title="Gestão de Pessoal" items={menuOperacional} />
        )}

        {isGestor && (
          <NavGroup title="Administração" items={menuAdmin} />
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-5 border-t border-slate-800 shrink-0">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full h-12 flex items-center justify-center gap-3 text-base font-semibold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <p className="text-xs text-slate-600 text-center">© 2025 SCMP v1.1</p>
      </div>
    </div>
  )
}

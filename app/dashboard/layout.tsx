import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar - Hidden on mobile, visible on lg+ */}
      <aside className="hidden lg:block w-64 shrink-0 shadow-xl z-20">
        <Sidebar
          perfil={session.perfil}
          unidadeNome={session.unidadeNome}
          userName={session.nome}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <Header
          userName={session.nome}
          unidadeNome={session.unidadeNome}
          perfil={session.perfil}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  )
}


import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RelatoriosClient } from './relatorios-client'

export default async function RelatoriosPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão (apenas GESTOR)
  if (session.perfil !== 'GESTOR') {
    redirect('/dashboard?error=unauthorized')
  }

  return <RelatoriosClient />
}

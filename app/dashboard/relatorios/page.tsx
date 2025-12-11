import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RelatoriosClient } from './relatorios-client'
import { getUnidadesParaSeletor } from '@/lib/unidades-helper'

export default async function RelatoriosPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Verifica se o usuário tem permissão (apenas GESTOR)
  if (session.perfil !== 'GESTOR') {
    redirect('/dashboard?error=unauthorized')
  }

  // Busca unidades com caminho completo para o seletor
  const unidades = await getUnidadesParaSeletor()

  return (
    <RelatoriosClient
      unidades={unidades.map(u => ({ id: u.id, nome: u.caminhoCompleto }))}
    />
  )
}

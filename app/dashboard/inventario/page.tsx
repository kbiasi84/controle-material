import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InventarioClient } from './inventario-client'
import { getUnidadesParaSeletor } from '@/lib/unidades-helper'

export default async function InventarioPage() {
    const session = await getSession()

    if (!session) {
        return null
    }

    // Verifica se o usuário tem permissão (CONTROLADOR ou GESTOR)
    if (session.perfil !== 'GESTOR' && session.perfil !== 'CONTROLADOR') {
        redirect('/dashboard?error=unauthorized')
    }

    // Busca unidades com caminho completo para o seletor
    const unidades = await getUnidadesParaSeletor()

    return (
        <InventarioClient
            unidades={unidades.map(u => ({ id: u.id, nome: u.caminhoCompleto }))}
        />
    )
}
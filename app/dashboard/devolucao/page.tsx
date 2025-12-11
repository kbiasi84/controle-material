import { getSession } from '@/lib/auth'
import { getPermissoesUsuario } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import {
    Users,
    Package,
} from 'lucide-react'
import { EfetivoLista } from '@/components/dashboard/efetivo-lista'

export default async function ControleDevolucaoPage() {
    const session = await getSession()

    if (!session) {
        return null
    }

    // Verifica se o usuário tem permissão
    if (session.perfil !== 'CONTROLADOR' && session.perfil !== 'GESTOR') {
        redirect('/dashboard?error=unauthorized')
    }

    const permissoes = await getPermissoesUsuario(session)

    // Busca materiais em uso (com usuário responsável)
    const materiaisEmUso = await prisma.material.findMany({
        where: {
            unidadeId: { in: permissoes.unidadesVisiveis },
            status: 'EM_USO',
        },
        include: {
            tipo: true,
            unidade: true,
        },
    })

    // Busca movimentações ativas (retiradas sem devolução)
    const movimentacoesAtivas = await prisma.movimentacao.findMany({
        where: {
            material: {
                unidadeId: { in: permissoes.unidadesVisiveis },
            },
            dataDevolucao: null,
        },
        include: {
            usuario: {
                include: {
                    unidade: true,
                }
            },
            material: {
                include: {
                    tipo: true,
                }
            },
        },
        orderBy: { dataRetirada: 'desc' },
    })

    // Agrupa materiais por usuário
    const materiaisPorUsuario = movimentacoesAtivas.reduce((acc, mov) => {
        const key = mov.usuarioId
        if (!acc[key]) {
            acc[key] = {
                usuario: {
                    id: mov.usuario.id,
                    nome: mov.usuario.nome,
                    identificacao: mov.usuario.identificacao,
                    unidade: {
                        nome: mov.usuario.unidade.nome,
                        sigla: mov.usuario.unidade.sigla,
                    },
                },
                materiais: []
            }
        }
        acc[key].materiais.push({
            id: mov.material.id,
            codigoIdentificacao: mov.material.codigoIdentificacao,
            descricao: mov.material.descricao,
            tipo: { nome: mov.material.tipo.nome },
        })
        return acc
    }, {} as Record<number, {
        usuario: { id: number; nome: string; identificacao: string; unidade: { nome: string; sigla: string | null } },
        materiais: { id: number; codigoIdentificacao: string; descricao: string; tipo: { nome: string } }[]
    }>)

    const totalMaterialEmUso = materiaisEmUso.length
    const usuariosComMateriais = Object.values(materiaisPorUsuario)

    // Dados do usuário logado
    const usuarioLogado = {
        userId: session.userId,
        nome: session.nome,
        perfil: session.perfil,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Controle de Devolução</h2>
                    <p className="text-slate-500 mt-1">
                        Gerencie materiais e equipamentos pendentes de devolução
                    </p>
                </div>

                {/* Stats Badges */}
                <div className="flex gap-3">
                    <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-purple-100 text-purple-800 border-2 border-purple-200">
                        <Users className="w-5 h-5 mr-2.5" />
                        {usuariosComMateriais.length} com materiais
                    </span>
                    <span className="inline-flex items-center px-4 py-2.5 rounded-xl text-base font-bold bg-orange-100 text-orange-800 border-2 border-orange-200">
                        <Package className="w-5 h-5 mr-2.5" />
                        {totalMaterialEmUso} Em Uso
                    </span>
                </div>
            </div>

            {/* Lista com busca (Client Component) */}
            <EfetivoLista
                usuariosComMateriais={usuariosComMateriais}
                usuarioLogado={usuarioLogado}
            />
        </div>
    )
}

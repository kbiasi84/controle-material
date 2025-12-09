'use client'

import { useState } from 'react'
import { 
  Zap, 
  Radio, 
  Car, 
  Shield, 
  ArrowUpFromLine,
  ArrowDownToLine,
  User,
  MessageSquare,
  Flashlight,
  Beaker,
  Lock,
  Wrench,
} from 'lucide-react'
import { ModalRetirada } from './modal-retirada'
import { ModalDevolucao } from './modal-devolucao'
import { ModalManutencao } from './modal-manutencao'

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
  status: string
  observacaoAtual: string | null
  tipo: {
    nome: string
  }
  usuarioEmUso?: {
    id: number
    nome: string
  } | null
}

interface UsuarioLogado {
  userId: number
  nome: string
  perfil: string
  unidadeId: number
}

interface MaterialCardProps {
  material: Material
  usuarioLogado: UsuarioLogado
}

export function MaterialCard({ material, usuarioLogado }: MaterialCardProps) {
  const [showModalRetirada, setShowModalRetirada] = useState(false)
  const [showModalDevolucao, setShowModalDevolucao] = useState(false)
  const [showModalManutencao, setShowModalManutencao] = useState(false)

  // Verifica se o usuário pode devolver (apenas CONTROLADOR e GESTOR)
  const podeDevolver = usuarioLogado.perfil === 'CONTROLADOR' || usuarioLogado.perfil === 'GESTOR'
  
  // Verifica se o usuário pode concluir manutenção (apenas GESTOR)
  const podeConcluirManutencao = usuarioLogado.perfil === 'GESTOR'

  // Ícone baseado no tipo de material
  const getIconByType = (tipoNome: string) => {
    const icons: Record<string, { icon: React.ReactNode; bg: string }> = {
      'Taser': { icon: <Zap className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
      'Rádio Comunicador': { icon: <Radio className="w-7 h-7" />, bg: 'bg-slate-600 text-white' },
      'Viatura': { icon: <Car className="w-7 h-7" />, bg: 'bg-amber-500 text-white' },
      'Colete Balístico': { icon: <Shield className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
      'Algema': { icon: <Lock className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
      'Lanterna Tática': { icon: <Flashlight className="w-7 h-7" />, bg: 'bg-slate-600 text-white' },
      'Etilômetro': { icon: <Beaker className="w-7 h-7" />, bg: 'bg-teal-600 text-white' },
    }
    return icons[tipoNome] || { icon: <Shield className="w-7 h-7" />, bg: 'bg-slate-500 text-white' }
  }

  // Status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
        return {
          badge: 'bg-green-50 text-green-700 border-green-200',
          dot: 'bg-green-500',
          text: 'Disponível',
          iconBg: 'bg-teal-600 text-white'
        }
      case 'EM_USO':
        return {
          badge: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          text: 'Em Uso',
          iconBg: 'bg-slate-400 text-white'
        }
      case 'MANUTENCAO':
        return {
          badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          dot: 'bg-yellow-500',
          text: 'Manutenção',
          iconBg: 'bg-amber-500 text-white'
        }
      default:
        return {
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          text: status,
          iconBg: 'bg-slate-500 text-white'
        }
    }
  }

  const iconConfig = getIconByType(material.tipo.nome)
  const statusConfig = getStatusConfig(material.status)

  const handleRetirar = () => {
    setShowModalRetirada(true)
  }

  const handleDevolver = () => {
    setShowModalDevolucao(true)
  }

  const handleSuccess = () => {
    // Força refresh da página para atualizar os dados
    window.location.reload()
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 group flex flex-col">
        {/* Header com ícone e info */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-14 h-14 rounded-xl ${material.status === 'EM_USO' ? statusConfig.iconBg : material.status === 'MANUTENCAO' ? statusConfig.iconBg : iconConfig.bg} flex items-center justify-center shrink-0 shadow-sm`}>
            {iconConfig.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
              {material.descricao || material.tipo.nome}
            </h3>
            <p className="text-sm text-slate-400 font-mono mt-1">
              {material.codigoIdentificacao}
            </p>
          </div>
        </div>

        {/* Status e Info */}
        <div className="mb-5 flex-1 space-y-2">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.badge}`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-2`}></span>
            {statusConfig.text}
          </div>
          
          {/* Quem está usando (para materiais EM_USO) */}
          {material.status === 'EM_USO' && material.usuarioEmUso && (
            <p className="text-sm text-slate-600 flex items-center">
              <User className="w-4 h-4 mr-2 text-red-400 shrink-0" />
              <span className="truncate font-medium">{material.usuarioEmUso.nome}</span>
            </p>
          )}
          
          {/* Observação (se houver e não for redundante com info do usuário) */}
          {material.observacaoAtual && !material.observacaoAtual.toLowerCase().startsWith('em uso por') && (
            <p className="text-sm text-slate-500 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
              <span className="truncate">{material.observacaoAtual}</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        {material.status === 'DISPONIVEL' && (
          <button 
            onClick={handleRetirar}
            className="w-full py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            <ArrowUpFromLine className="w-5 h-5 mr-2.5" />
            Retirar
          </button>
        )}
        {material.status === 'EM_USO' && podeDevolver && (
          <button 
            onClick={handleDevolver}
            className="w-full py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <ArrowDownToLine className="w-5 h-5 mr-2.5" />
            Devolver
          </button>
        )}
        {material.status === 'MANUTENCAO' && podeConcluirManutencao && (
          <button 
            onClick={() => setShowModalManutencao(true)}
            className="w-full py-3.5 rounded-xl text-base font-bold transition-colors flex items-center justify-center bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
          >
            <Wrench className="w-5 h-5 mr-2.5" />
            Concluir Manutenção
          </button>
        )}
      </div>

      {/* Modal de Retirada */}
      {showModalRetirada && (
        <ModalRetirada
          material={material}
          usuarioLogado={usuarioLogado}
          onClose={() => setShowModalRetirada(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal de Devolução */}
      {showModalDevolucao && (
        <ModalDevolucao
          material={material}
          usuarioLogado={usuarioLogado}
          onClose={() => setShowModalDevolucao(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal de Manutenção */}
      {showModalManutencao && (
        <ModalManutencao
          material={material}
          usuarioLogado={usuarioLogado}
          onClose={() => setShowModalManutencao(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

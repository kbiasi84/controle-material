'use client'

import { useState } from 'react'
import { User, Package, ArrowDownToLine, Loader2 } from 'lucide-react'
import { ModalDevolucao } from './modal-devolucao'
import { ModalConfirmacao } from './modal-confirmacao'
import { devolverMaterial } from '@/app/dashboard/devolucao-actions'

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
  tipo: {
    nome: string
  }
}

interface Usuario {
  id: number
  nome: string
  identificacao: string
  unidade: {
    nome: string
    sigla: string | null
  }
}

interface CardUsuarioEfetivoProps {
  usuario: Usuario
  materiais: Material[]
  usuarioLogado: {
    userId: number
    nome: string
    perfil: string
  }
}

export function CardUsuarioEfetivo({ usuario, materiais, usuarioLogado }: CardUsuarioEfetivoProps) {
  const [materialParaDevolver, setMaterialParaDevolver] = useState<Material | null>(null)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  const [devolvendoTodos, setDevolvendoTodos] = useState(false)
  const [materiaisRestantes, setMateriaisRestantes] = useState(materiais)

  const handleDevolverIndividual = (material: Material) => {
    setMaterialParaDevolver(material)
  }

  const handleClickDevolverTodos = () => {
    setMostrarConfirmacao(true)
  }

  const handleConfirmarDevolverTodos = async () => {
    setMostrarConfirmacao(false)
    setDevolvendoTodos(true)

    try {
      for (const material of materiaisRestantes) {
        await devolverMaterial({
          materialId: material.id,
          responsavelId: usuarioLogado.userId,
          enviarManutencao: false,
        })
      }
      // Atualiza a lista removendo todos
      setMateriaisRestantes([])
      window.location.reload()
    } catch (error) {
      console.error('Erro ao devolver materiais:', error)
      alert('Erro ao devolver alguns materiais. Tente novamente.')
    } finally {
      setDevolvendoTodos(false)
    }
  }

  const handleSuccessDevolucao = () => {
    // Remove o material devolvido da lista local
    if (materialParaDevolver) {
      setMateriaisRestantes(prev => prev.filter(m => m.id !== materialParaDevolver.id))
    }
    setMaterialParaDevolver(null)
    window.location.reload()
  }

  // Se não tem mais materiais, não renderiza o card
  if (materiaisRestantes.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 group flex flex-col">
        {/* Header com info do usuário */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {usuario.unidade.sigla || usuario.unidade.nome}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight mt-1">
              {usuario.nome}
            </h3>
            <p className="text-sm text-slate-400 font-mono">
              {usuario.identificacao}
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            {materiaisRestantes.length} {materiaisRestantes.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* Lista de Materiais com botão individual */}
        <div className="space-y-2 mb-4 flex-1">
          {materiaisRestantes.map((material) => (
            <div
              key={material.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group/item hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm truncate">
                  {material.descricao || material.tipo.nome}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {material.codigoIdentificacao} - {material.tipo.nome}
                </p>
              </div>
              <button
                onClick={() => handleDevolverIndividual(material)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                Devolver
              </button>
            </div>
          ))}
        </div>

        {/* Botão Devolver Todos */}
        <button
          onClick={handleClickDevolverTodos}
          disabled={devolvendoTodos}
          className="w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {devolvendoTodos ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Devolvendo...
            </>
          ) : (
            <>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Devolver Todos ({materiaisRestantes.length})
            </>
          )}
        </button>
      </div>

      {/* Modal de Confirmação para Devolver Todos */}
      {mostrarConfirmacao && (
        <ModalConfirmacao
          titulo="Devolver Todos"
          mensagem={`Deseja devolver todos os ${materiaisRestantes.length} materiais de ${usuario.nome}? Esta ação não pode ser desfeita.`}
          textoBotaoConfirmar="Sim, Devolver Todos"
          textoBotaoCancelar="Cancelar"
          corBotaoConfirmar="red"
          onConfirmar={handleConfirmarDevolverTodos}
          onCancelar={() => setMostrarConfirmacao(false)}
        />
      )}

      {/* Modal de Devolução Individual */}
      {materialParaDevolver && (
        <ModalDevolucao
          material={{
            id: materialParaDevolver.id,
            codigoIdentificacao: materialParaDevolver.codigoIdentificacao,
            descricao: materialParaDevolver.descricao,
            status: 'EM_USO',
            tipo: materialParaDevolver.tipo,
            usuarioEmUso: {
              id: usuario.id,
              nome: usuario.nome,
            },
          }}
          usuarioLogado={usuarioLogado}
          onClose={() => setMaterialParaDevolver(null)}
          onSuccess={handleSuccessDevolucao}
        />
      )}
    </>
  )
}

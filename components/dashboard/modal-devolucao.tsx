'use client'

import { useState } from 'react'
import { X, ArrowDownToLine, CheckCircle, AlertCircle, Loader2, Wrench, User } from 'lucide-react'
import { devolverMaterial } from '@/app/dashboard/devolucao-actions'

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
  status: string
  tipo: {
    nome: string
  }
  usuarioEmUso?: {
    id: number
    nome: string
  } | null
}

interface ModalDevolucaoProps {
  material: Material
  usuarioLogado: {
    userId: number
    nome: string
    perfil: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function ModalDevolucao({ material, usuarioLogado, onClose, onSuccess }: ModalDevolucaoProps) {
  const [observacao, setObservacao] = useState('')
  const [enviarManutencao, setEnviarManutencao] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)

  // Tela de sucesso
  if (resultado?.success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Devolução Confirmada!</h2>
          <p className="text-slate-600 mb-6">{resultado.message}</p>
          <button
            onClick={() => {
              onSuccess()
              onClose()
            }}
            className="w-full py-3.5 rounded-xl text-base font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  // Tela de erro
  if (resultado && !resultado.success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erro na Devolução</h2>
          <p className="text-slate-600 mb-6">{resultado.message}</p>
          <button
            onClick={() => setResultado(null)}
            className="w-full py-3.5 rounded-xl text-base font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      const result = await devolverMaterial({
        materialId: material.id,
        responsavelId: usuarioLogado.userId,
        observacao: observacao || undefined,
        enviarManutencao,
      })

      setResultado(result)
    } catch {
      setResultado({ success: false, message: 'Erro ao processar a devolução. Tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Registrar Devolução</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Material Info */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Item a Devolver</p>
            <p className="font-bold text-slate-800 text-lg">{material.descricao || material.tipo.nome}</p>
            <p className="text-sm text-slate-500">{material.codigoIdentificacao} - {material.tipo.nome}</p>
          </div>

          {/* Quem está com o material */}
          {material.usuarioEmUso && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <User className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs font-bold text-red-500 uppercase">Em posse de</p>
                <p className="font-semibold text-slate-800">{material.usuarioEmUso.nome}</p>
              </div>
            </div>
          )}

          {/* Checkbox Manutenção */}
          <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-yellow-400 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={enviarManutencao}
              onChange={(e) => setEnviarManutencao(e.target.checked)}
              className="w-5 h-5 text-yellow-500 rounded border-slate-300 focus:ring-yellow-500"
            />
            <div className="flex items-center gap-3 flex-1">
              <Wrench className={`w-5 h-5 ${enviarManutencao ? 'text-yellow-500' : 'text-slate-400'}`} />
              <div>
                <p className="font-semibold text-slate-700">Enviar para Manutenção</p>
                <p className="text-sm text-slate-500">Material precisa de reparo ou verificação</p>
              </div>
            </div>
          </label>

          {/* Observação */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              Observação {enviarManutencao ? '(Descreva o problema)' : '(Opcional)'}
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder={enviarManutencao
                ? "Ex: Tela trincada, bateria não carrega..."
                : "Ex: Devolvido em bom estado..."
              }
              rows={3}
              className="w-full p-4 text-base bg-white border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3.5 rounded-xl text-base font-bold bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 py-3.5 rounded-xl text-base font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${enviarManutencao
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : enviarManutencao ? (
              <>
                <Wrench className="w-5 h-5" />
                Devolver p/ Manutenção
              </>
            ) : (
              'Confirmar Devolução'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


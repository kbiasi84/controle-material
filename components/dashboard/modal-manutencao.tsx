'use client'

import { useState } from 'react'
import { X, Wrench, CheckCircle, AlertCircle, Loader2, Package } from 'lucide-react'
import { concluirManutencao } from '@/app/dashboard/manutencao-actions'

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
  status: string
  observacaoAtual: string | null
  tipo: {
    nome: string
  }
}

interface ModalManutencaoProps {
  material: Material
  usuarioLogado: {
    userId: number
    nome: string
    perfil: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function ModalManutencao({ material, usuarioLogado, onClose, onSuccess }: ModalManutencaoProps) {
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Manutenção Concluída!</h2>
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erro</h2>
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

  const handleConcluirManutencao = async () => {
    setSubmitting(true)

    try {
      const result = await concluirManutencao({
        materialId: material.id,
        responsavelId: usuarioLogado.userId,
      })
      
      setResultado(result)
    } catch {
      setResultado({ success: false, message: 'Erro ao processar a conclusão. Tente novamente.' })
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
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Concluir Manutenção</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Material Info */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Material em Manutenção</p>
              <p className="font-bold text-slate-800 text-lg">{material.descricao || material.tipo.nome}</p>
              <p className="text-sm text-slate-500">Cód: {material.codigoIdentificacao}</p>
            </div>
          </div>

          {/* Motivo da Manutenção */}
          {material.observacaoAtual && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Motivo da Manutenção</p>
              <p className="text-slate-700">{material.observacaoAtual}</p>
            </div>
          )}

          {/* Confirmação */}
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm text-green-700">
              <strong>Ao concluir a manutenção:</strong>
            </p>
            <ul className="text-sm text-green-600 mt-2 space-y-1 list-disc list-inside">
              <li>O status do material será alterado para <strong>Disponível</strong></li>
              <li>O motivo da manutenção será removido</li>
              <li>O material ficará disponível para retirada</li>
            </ul>
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
            onClick={handleConcluirManutencao}
            disabled={submitting}
            className="flex-1 py-3.5 rounded-xl text-base font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Concluir Manutenção
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


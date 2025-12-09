'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2, CheckCircle, AlertCircle, Power } from 'lucide-react'
import { excluirMaterial, inativarMaterial } from '@/app/dashboard/materiais/actions'

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
}

interface ModalExcluirMaterialProps {
  isOpen: boolean
  onClose: () => void
  material: Material | null
}

export function ModalExcluirMaterial({ isOpen, onClose, material }: ModalExcluirMaterialProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInativando, setIsInativando] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string; podeInativar?: boolean } | null>(null)

  const handleExcluir = async () => {
    if (!material) return

    setIsLoading(true)
    setResultado(null)

    try {
      const result = await excluirMaterial(material.id)
      setResultado(result)

      if (result.success) {
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (error) {
      setResultado({ success: false, message: 'Erro ao processar a exclusão.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInativar = async () => {
    if (!material) return

    setIsInativando(true)

    try {
      const result = await inativarMaterial(material.id)
      setResultado(result)

      if (result.success) {
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (error) {
      setResultado({ success: false, message: 'Erro ao processar a inativação.' })
    } finally {
      setIsInativando(false)
    }
  }

  const handleClose = () => {
    setResultado(null)
    onClose()
  }

  if (!isOpen || !material) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Excluir Material</h2>
              <p className="text-sm text-slate-500">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resultado de Sucesso */}
          {resultado?.success && (
            <div className="p-4 rounded-xl flex items-center gap-3 bg-green-50 text-green-800 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm font-medium">{resultado.message}</p>
            </div>
          )}

          {/* Pode Inativar - Mostrar opção */}
          {resultado && !resultado.success && resultado.podeInativar && (
            <>
              <div className="mb-4 p-4 rounded-xl flex items-start gap-3 bg-amber-50 text-amber-800 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{resultado.message}</p>
                  <p className="text-sm mt-1 text-amber-700">
                    Você pode inativar este material para que ele não apareça mais nas operações.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="font-bold text-slate-800">{material.descricao}</p>
                <p className="text-sm text-slate-500 font-mono">{material.codigoIdentificacao}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-xl text-base font-bold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleInativar}
                  disabled={isInativando}
                  className="flex-1 h-12 rounded-xl text-base font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isInativando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Inativando...
                    </>
                  ) : (
                    <>
                      <Power className="w-5 h-5" />
                      Inativar
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Erro sem opção de inativar */}
          {resultado && !resultado.success && !resultado.podeInativar && (
            <>
              <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm font-medium">{resultado.message}</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full h-12 rounded-xl text-base font-bold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </>
          )}

          {/* Estado inicial - Confirmação de exclusão */}
          {!resultado && (
            <>
              <p className="text-slate-600 mb-4">
                Tem certeza que deseja excluir o material:
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="font-bold text-slate-800">{material.descricao}</p>
                <p className="text-sm text-slate-500 font-mono">{material.codigoIdentificacao}</p>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                ⚠️ Materiais com histórico de movimentações não podem ser excluídos, mas podem ser inativados.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-xl text-base font-bold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExcluir}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl text-base font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Sim, Excluir'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

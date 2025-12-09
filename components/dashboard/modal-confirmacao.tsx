'use client'

import { AlertTriangle, X } from 'lucide-react'

interface ModalConfirmacaoProps {
  titulo: string
  mensagem: string
  textoBotaoConfirmar?: string
  textoBotaoCancelar?: string
  corBotaoConfirmar?: 'red' | 'blue' | 'green'
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalConfirmacao({
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  corBotaoConfirmar = 'red',
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoProps) {
  const coresBotao = {
    red: 'bg-red-600 hover:bg-red-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{titulo}</h2>
          </div>
          <button 
            onClick={onCancelar} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 text-base">{mensagem}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-slate-200">
          <button
            onClick={onCancelar}
            className="flex-1 py-3.5 rounded-xl text-base font-bold bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {textoBotaoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            className={`flex-1 py-3.5 rounded-xl text-base font-bold text-white transition-colors ${coresBotao[corBotaoConfirmar]}`}
          >
            {textoBotaoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}


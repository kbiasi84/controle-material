'use client'

import { useState, useEffect } from 'react'
import { X, Package, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { criarMaterial, editarMaterial } from '@/app/dashboard/materiais/actions'

interface TipoMaterial {
  id: number
  nome: string
}

interface Unidade {
  id: number
  nome: string
}

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
  tipoId: number
  unidadeId: number
  status: 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO'
}

interface ModalMaterialProps {
  isOpen: boolean
  onClose: () => void
  tipos: TipoMaterial[]
  unidades: Unidade[]
  material?: Material | null // Se passar material, é edição
}

export function ModalMaterial({ isOpen, onClose, tipos, unidades, material }: ModalMaterialProps) {
  const isEdicao = !!material

  const [formData, setFormData] = useState({
    codigoIdentificacao: '',
    descricao: '',
    tipoId: '',
    unidadeId: '',
    status: 'DISPONIVEL' as 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)

  // Preenche o form quando editar
  useEffect(() => {
    if (material) {
      setFormData({
        codigoIdentificacao: material.codigoIdentificacao,
        descricao: material.descricao,
        tipoId: material.tipoId.toString(),
        unidadeId: material.unidadeId.toString(),
        status: material.status,
      })
    } else {
      setFormData({
        codigoIdentificacao: '',
        descricao: '',
        tipoId: '',
        unidadeId: unidades[0]?.id.toString() || '',
        status: 'DISPONIVEL',
      })
    }
    setResultado(null)
  }, [material, unidades, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.codigoIdentificacao || !formData.descricao || !formData.tipoId || !formData.unidadeId) {
      setResultado({ success: false, message: 'Preencha todos os campos obrigatórios.' })
      return
    }

    setIsLoading(true)
    setResultado(null)

    try {
      let result
      if (isEdicao && material) {
        result = await editarMaterial({
          id: material.id,
          codigoIdentificacao: formData.codigoIdentificacao,
          descricao: formData.descricao,
          tipoId: parseInt(formData.tipoId),
          unidadeId: parseInt(formData.unidadeId),
          status: formData.status,
        })
      } else {
        result = await criarMaterial({
          codigoIdentificacao: formData.codigoIdentificacao,
          descricao: formData.descricao,
          tipoId: parseInt(formData.tipoId),
          unidadeId: parseInt(formData.unidadeId),
        })
      }

      setResultado(result)

      if (result.success) {
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error) {
      setResultado({ success: false, message: 'Erro ao processar a solicitação.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isEdicao ? 'Editar Material' : 'Novo Material'}
              </h2>
              <p className="text-sm text-slate-500">
                {isEdicao ? 'Atualize os dados do material' : 'Preencha os dados do material'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={`mx-6 mt-6 p-4 rounded-xl flex items-center gap-3 ${resultado.success
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {resultado.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <p className="text-sm font-medium">{resultado.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Código de Identificação */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Código de Identificação *
            </label>
            <input
              type="text"
              value={formData.codigoIdentificacao}
              onChange={(e) => setFormData({ ...formData, codigoIdentificacao: e.target.value.toUpperCase() })}
              placeholder="Ex: ETI-001"
              className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors font-mono"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Etilômetro Digital Modelo X"
              className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Tipo de Material *
            </label>
            <select
              value={formData.tipoId}
              onChange={(e) => setFormData({ ...formData, tipoId: e.target.value })}
              className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="">Selecione o tipo</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id.toString()}>{tipo.nome}</option>
              ))}
            </select>
          </div>

          {/* Unidade (apenas para novo cadastro - para alterar unidade, usar função de transferência) */}
          {!isEdicao && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Unidade *
              </label>
              <select
                value={formData.unidadeId}
                onChange={(e) => setFormData({ ...formData, unidadeId: e.target.value })}
                className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
              >
                <option value="">Selecione a unidade</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id.toString()}>{unidade.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status (apenas para edição) */}
          {isEdicao && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO' })}
                className="w-full h-12 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-blue-500 focus:bg-white transition-colors"
              >
                <option value="DISPONIVEL">Disponível</option>
                <option value="EM_USO">Em Uso</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-base font-bold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEdicao ? 'Salvar Alterações' : 'Cadastrar Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { X, Zap, Search, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { retirarMaterial } from '@/app/dashboard/retirada-actions'

interface Material {
  id: number
  codigoIdentificacao: string
  descricao: string
  status: string
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
  }
}

interface ModalRetiradaProps {
  material: Material | null
  usuarioLogado: {
    userId: number
    nome: string
    perfil: string
    unidadeId: number
  }
  onClose: () => void
  onSuccess: () => void
}

export function ModalRetirada({ material, usuarioLogado, onClose, onSuccess }: ModalRetiradaProps) {
  const [tipoRetirada, setTipoRetirada] = useState<'eu' | 'outro'>('eu')
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null)
  const [observacao, setObservacao] = useState('')
  const [busca, setBusca] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null)

  const isUsuarioSimples = usuarioLogado.perfil === 'USUARIO'
  const podeRetirarParaOutros = usuarioLogado.perfil === 'CONTROLADOR' || usuarioLogado.perfil === 'GESTOR'

  // Busca usuários quando digitar (mínimo 2 caracteres)
  useEffect(() => {
    if (tipoRetirada === 'outro' && busca.length >= 2) {
      setLoadingUsuarios(true)
      fetch(`/api/usuarios/buscar?q=${encodeURIComponent(busca)}`)
        .then(res => res.json())
        .then(data => {
          setUsuarios(data.usuarios || [])
          setLoadingUsuarios(false)
        })
        .catch(() => {
          setUsuarios([])
          setLoadingUsuarios(false)
        })
    } else if (busca.length < 2) {
      setUsuarios([])
    }
  }, [busca, tipoRetirada])

  // Reset quando trocar tipo de retirada
  useEffect(() => {
    if (tipoRetirada === 'eu') {
      setUsuarioSelecionado(null)
      setBusca('')
      setUsuarios([])
    }
  }, [tipoRetirada])

  if (!material) return null

  // IMPORTANTE: Verificar resultado PRIMEIRO (antes do status do material)
  // Isso evita que a tela de "indisponível" apareça após uma retirada bem-sucedida

  // Tela de sucesso
  if (resultado?.success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Retirada Confirmada!</h2>
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erro na Retirada</h2>
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

  // Validação: só pode retirar se disponível (verificação feita APÓS os resultados)
  if (material.status !== 'DISPONIVEL') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Material Indisponível</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <p className="text-slate-600 mb-6">
            Este material está <strong>{material.status === 'EM_USO' ? 'em uso' : 'em manutenção'}</strong> e não pode ser retirado no momento.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl text-base font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    const beneficiarioId = tipoRetirada === 'eu' ? usuarioLogado.userId : usuarioSelecionado

    if (!beneficiarioId) {
      setResultado({ success: false, message: 'Selecione um policial para a retirada.' })
      setSubmitting(false)
      return
    }

    try {
      const result = await retirarMaterial({
        materialId: material.id,
        beneficiarioId,
        responsavelId: usuarioLogado.userId,
        observacao: observacao || undefined,
      })

      setResultado(result)
    } catch {
      setResultado({ success: false, message: 'Erro ao processar a retirada. Tente novamente.' })
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
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Registrar Retirada</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Material Info */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Item Selecionado</p>
            <p className="font-bold text-slate-800 text-lg">{material.descricao || material.tipo.nome}</p>
            <p className="text-sm text-slate-500">{material.codigoIdentificacao} - {material.tipo.nome}</p>
          </div>

          {/* Opções de Retirada */}
          {isUsuarioSimples ? (
            // Usuario simples: retirada direta para si mesmo
            <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{usuarioLogado.nome}</p>
                  <p className="text-sm text-slate-500">Retirada para você mesmo</p>
                </div>
              </div>
            </div>
          ) : (
            // Controlador/Gestor: pode escolher
            <div className="space-y-4">
              <p className="font-bold text-slate-700">Quem vai retirar?</p>

              {/* Opção: Eu mesmo */}
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${tipoRetirada === 'eu'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <input
                  type="radio"
                  name="tipoRetirada"
                  checked={tipoRetirada === 'eu'}
                  onChange={() => setTipoRetirada('eu')}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="font-medium text-slate-700">Eu mesmo ({usuarioLogado.nome})</span>
              </label>

              {/* Opção: Outro Policial */}
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${tipoRetirada === 'outro'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <input
                  type="radio"
                  name="tipoRetirada"
                  checked={tipoRetirada === 'outro'}
                  onChange={() => setTipoRetirada('outro')}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="font-medium text-slate-700">Outro Policial da Unidade</span>
              </label>

              {/* Seleção de Policial */}
              {tipoRetirada === 'outro' && (
                <div className="space-y-3 pl-4 border-l-4 border-blue-200">
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Selecione o Policial</p>

                  {/* Campo de Busca */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar por nome... (mínimo 2 caracteres)"
                      className="w-full h-12 pl-12 pr-4 text-base bg-white border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Lista de Usuários */}
                  {loadingUsuarios && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  )}

                  {!loadingUsuarios && usuarios.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-50 rounded-xl p-2">
                      {usuarios.map((usuario) => (
                        <label
                          key={usuario.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${usuarioSelecionado === usuario.id
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-white border-2 border-transparent hover:bg-slate-100'
                            }`}
                        >
                          <input
                            type="radio"
                            name="usuarioSelecionado"
                            checked={usuarioSelecionado === usuario.id}
                            onChange={() => setUsuarioSelecionado(usuario.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{usuario.nome}</p>
                            <p className="text-xs text-slate-500">{usuario.identificacao} • {usuario.unidade.nome}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {!loadingUsuarios && busca.length >= 2 && usuarios.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Nenhum policial encontrado com "{busca}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Observação */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">Observação (Opcional)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Uso em operação especial..."
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
            disabled={submitting || (tipoRetirada === 'outro' && !usuarioSelecionado)}
            className="flex-1 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Retirada'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useMemo } from 'react'
import { Search, Users } from 'lucide-react'
import { CardUsuarioEfetivo } from './card-usuario-efetivo'

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

interface UsuarioComMateriais {
  usuario: Usuario
  materiais: Material[]
}

interface EfetivoListaProps {
  usuariosComMateriais: UsuarioComMateriais[]
  usuarioLogado: {
    userId: number
    nome: string
    perfil: string
  }
}

export function EfetivoLista({ usuariosComMateriais, usuarioLogado }: EfetivoListaProps) {
  const [busca, setBusca] = useState('')

  // Filtra os cards baseado na busca (mínimo 3 caracteres)
  const usuariosFiltrados = useMemo(() => {
    if (busca.length < 3) {
      return usuariosComMateriais
    }

    const termoBusca = busca.toLowerCase()

    return usuariosComMateriais.filter(({ usuario, materiais }) => {
      // Busca no nome do usuário
      if (usuario.nome.toLowerCase().includes(termoBusca)) {
        return true
      }

      // Busca na identificação do usuário
      if (usuario.identificacao.toLowerCase().includes(termoBusca)) {
        return true
      }

      // Busca na unidade
      if (usuario.unidade.nome.toLowerCase().includes(termoBusca)) {
        return true
      }
      if (usuario.unidade.sigla?.toLowerCase().includes(termoBusca)) {
        return true
      }

      // Busca nos materiais (descrição, código, tipo)
      const materialEncontrado = materiais.some(material => {
        if (material.descricao.toLowerCase().includes(termoBusca)) {
          return true
        }
        if (material.codigoIdentificacao.toLowerCase().includes(termoBusca)) {
          return true
        }
        if (material.tipo.nome.toLowerCase().includes(termoBusca)) {
          return true
        }
        return false
      })

      return materialEncontrado
    })
  }, [busca, usuariosComMateriais])

  return (
    <>
      {/* Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, identificação ou equipamento... (mínimo 3 caracteres)" 
            className="w-full h-12 pl-12 pr-4 text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {busca.length > 0 && busca.length < 3 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              +{3 - busca.length} caracteres
            </span>
          )}
        </div>
      </div>

      {/* Cards de Usuários com Materiais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-700">Usuários com Material em Posse</h3>
          {busca.length >= 3 && (
            <span className="text-sm text-slate-500">
              {usuariosFiltrados.length} de {usuariosComMateriais.length} encontrados
            </span>
          )}
        </div>
        
        {usuariosComMateriais.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600">Nenhum material em uso</h3>
            <p className="text-slate-400 text-base mt-2">
              Todos os materiais estão disponíveis no estoque.
            </p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600">Nenhum resultado encontrado</h3>
            <p className="text-slate-400 text-base mt-2">
              Nenhum usuário ou material corresponde a "{busca}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {usuariosFiltrados.map(({ usuario, materiais }) => (
              <CardUsuarioEfetivo
                key={usuario.id}
                usuario={usuario}
                materiais={materiais}
                usuarioLogado={usuarioLogado}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}


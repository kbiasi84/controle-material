'use client'

import { useActionState } from 'react'
import { loginAction, LoginState } from './actions'
import { Boxes } from 'lucide-react'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800/60 border-2 border-slate-700 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
            <Boxes className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            SCMP
          </h1>
          <p className="text-slate-400 mt-1 text-base">
            Sistema de Controle de Materiais
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="identificacao" className="block text-base font-semibold text-slate-200">
              Identificação
            </label>
            <input
              id="identificacao"
              name="identificacao"
              type="text"
              placeholder="Digite sua identificação"
              required
              disabled={isPending}
              className="w-full h-14 px-5 text-base bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-colors disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="senha" className="block text-base font-semibold text-slate-200">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              placeholder="Digite sua senha"
              required
              disabled={isPending}
              className="w-full h-14 px-5 text-base bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-colors disabled:opacity-50"
            />
          </div>

          {state.error && (
            <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30">
              <p className="text-base text-red-400 text-center font-medium">{state.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-14 mt-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2025 SCMP v1.1
        </p>
      </div>
    </div>
  )
}


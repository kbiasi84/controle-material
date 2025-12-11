'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Boxes, Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { resetPassword } from '../actions'

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.')
            return
        }

        if (!token) {
            setError('Token inválido.')
            return
        }

        setIsLoading(true)
        const result = await resetPassword(token, newPassword)
        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else if (result.success) {
            setSuccess(true)
        }
    }

    // Token inválido
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="w-full max-w-md bg-slate-800/60 border-2 border-slate-700 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
                    <p className="text-slate-400 mb-6">
                        Este link de recuperação de senha é inválido ou expirou.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        )
    }

    // Sucesso
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="w-full max-w-md bg-slate-800/60 border-2 border-slate-700 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Senha Alterada!</h1>
                    <p className="text-slate-400 mb-6">
                        Sua senha foi alterada com sucesso. Você já pode fazer login.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        )
    }

    // Formulário
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md bg-slate-800/60 border-2 border-slate-700 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
                        <Boxes className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Redefinir Senha
                    </h1>
                    <p className="text-slate-400 mt-1 text-base text-center">
                        Digite sua nova senha abaixo
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="block text-base font-semibold text-slate-200">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                disabled={isLoading}
                                className="w-full h-14 pl-12 pr-5 text-base bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-colors disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-base font-semibold text-slate-200">
                            Confirmar Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Digite novamente"
                                required
                                disabled={isLoading}
                                className="w-full h-14 pl-12 pr-5 text-base bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-colors disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30">
                            <p className="text-base text-red-400 text-center font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 mt-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Nova Senha'
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="w-full py-3 text-slate-400 hover:text-white text-base font-medium transition-colors"
                    >
                        Voltar ao Login
                    </button>
                </form>
            </div>
        </div>
    )
}

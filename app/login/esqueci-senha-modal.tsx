'use client'

import { useState } from 'react'
import { Mail, X, Loader2, CheckCircle } from 'lucide-react'
import { requestPasswordReset } from './actions'

interface EsqueciSenhaModalProps {
    onClose: () => void
}

export function EsqueciSenhaModal({ onClose }: EsqueciSenhaModalProps) {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const result = await requestPasswordReset(email)

        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        } else if (result.success) {
            setSuccess(true)
            setMessage(result.message || 'Instruções enviadas!')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Recuperar Senha</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <p className="text-slate-300 text-base">{message}</p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <p className="text-slate-400 text-sm">
                                Digite seu e-mail cadastrado. Você receberá um link para redefinir sua senha.
                            </p>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-base font-semibold text-slate-200">
                                    E-mail
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Digite seu e-mail"
                                    required
                                    disabled={isLoading}
                                    className="w-full h-14 px-5 text-base bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-colors disabled:opacity-50"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30">
                                    <p className="text-base text-red-400 text-center font-medium">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 rounded-xl text-base font-bold bg-slate-700 border-2 border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Recuperar Senha'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

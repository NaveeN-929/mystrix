'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Wallet, ArrowLeft, ArrowUpRight, ArrowDownLeft, History, Gift, CreditCard, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { walletApi, WalletTransaction } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface Pagination {
    total: number
    page: number
    limit: number
    pages: number
}

export default function WalletPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [transactions, setTransactions] = useState<WalletTransaction[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)

    const fetchWalletData = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await walletApi.getHistory({ page, limit: 10 }, session!.accessToken)
            setTransactions(data.transactions)
            setPagination(data.pagination)
        } catch (err) {
            console.error('Failed to fetch wallet data:', err)
            setError('Failed to load wallet history. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [page, session])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?redirect=/wallet')
            return
        }

        if (status === 'authenticated' && session?.accessToken) {
            fetchWalletData()
        }
    }, [status, session, page, fetchWalletData, router])

    const getTransactionIcon = (type: string, amount: number) => {
        if (amount > 0) return <ArrowDownLeft className="text-emerald-500" />
        return <ArrowUpRight className="text-rose-500" />
    }

    const getTransactionTypeLabel = (type: string) => {
        switch (type) {
            case 'REWARD': return 'Spin Reward 🎁'
            case 'CONTEST_PAYMENT': return 'Contest Entry 🎫'
            case 'REFUND': return 'Refund 💸'
            case 'ADMIN_ADJUSTMENT': return 'Adjustment ⚙️'
            default: return type
        }
    }

    if (status === 'loading' || (isLoading && transactions.length === 0)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading your wallet..." />
            </div>
        )
    }

    const balance = session?.user?.walletBalance || 0

    return (
        <div className="min-h-screen bg-lavender-50/30 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-white shadow-soft text-gray-600 hover:text-pink-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        My <span className="text-pink-500">Wallet</span>
                    </h1>
                </div>

                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        'bg-gradient-to-br from-pink-500 to-purple-600 rounded-super p-8 text-white mb-8',
                        'shadow-kawaii border-4 border-white overflow-hidden relative'
                    )}
                >
                    {/* Background Sparks */}
                    <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12">
                        <Sparkles size={120} />
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-inner">
                                <Wallet size={40} className="text-white" />
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-pink-100 font-bold uppercase tracking-widest text-sm mb-1">Available Balance</p>
                                <p className="text-6xl font-black">₹{balance}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/')}
                                className="px-8 py-3 bg-white text-pink-600 rounded-full font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <Sparkles size={18} />
                                PLAY NOW
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Transaction History */}
                <div className="bg-white/80 backdrop-blur-md rounded-super p-8 shadow-kawaii border border-pink-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-pink-50 text-pink-500">
                            <History size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
                    </div>

                    {error && (
                        <div className="p-4 rounded-kawaii bg-rose-50 border border-rose-100 text-rose-600 mb-6 text-center font-medium">
                            {error}
                        </div>
                    )}

                    {transactions.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <History size={32} />
                            </div>
                            <p className="text-gray-500 font-medium">No transactions yet!</p>
                            <p className="text-sm text-gray-400 mt-1">Start playing contests to see your history here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx, idx) => (
                                <motion.div
                                    key={tx._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={cn(
                                        'flex items-center justify-between p-4 rounded-kawaii border-2 transition-all group',
                                        'hover:border-pink-200 hover:bg-pink-50/30',
                                        'border-transparent bg-gray-50/50'
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            'w-12 h-12 rounded-full flex items-center justify-center shadow-soft',
                                            tx.amount > 0 ? 'bg-emerald-50' : 'bg-rose-50'
                                        )}>
                                            {getTransactionIcon(tx.type, tx.amount)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                                                {getTransactionTypeLabel(tx.type)}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-1">{tx.description}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            'text-lg font-black',
                                            tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                                        )}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                            Balance: ₹{tx.balanceAfter}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-pink-50">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 rounded-kawaii bg-gray-50 text-gray-600 font-bold disabled:opacity-50 hover:bg-pink-50 hover:text-pink-500 transition-all text-sm"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-black text-gray-400">
                                {page} of {pagination.pages}
                            </span>
                            <button
                                disabled={page === pagination.pages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 rounded-kawaii bg-gray-50 text-gray-600 font-bold disabled:opacity-50 hover:bg-pink-50 hover:text-pink-500 transition-all text-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mt-8">
                    {/* <div className="p-6 rounded-super bg-amber-50 border-2 border-amber-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-soft">
                            <Gift size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800">Earn Rewards</p>
                            <p className="text-xs text-amber-700/70 leading-relaxed mt-1">
                                Spin the wheel and land on 0 boxes to win random cash rewards added directly to your wallet!
                            </p>
                        </div>
                    </div> */}
                    <div className="p-6 rounded-super bg-emerald-50 border-2 border-emerald-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-soft">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-emerald-700">Save on Entries</p>
                            <p className="text-sm text-emerald-700/70 leading-relaxed mt-1">
                                Use your wallet balance to get discounts or even FREE entries into your favorite mystery box contests.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { signOut, useSession } from "next-auth/react"
import { LogOut, Pencil, Trash2 } from "lucide-react"
import ExpenseForm from "./components/ExpenseForm"

type Expense = {
  id: string
  date: string
  amount: number
  currency: string
  description: string
  amountUSD?: number
  userName?: string
}

type ExchangeRates = {
  USD_PLN: number
  USD_EUR: number
  USD_BYN: number
}

const GRID_COLS = "grid-cols-[170px_120px_105px_120px_120px_140px_1fr_180px]"

export default function Home() {
  const { data: session } = useSession()
  const currentUser = session?.user?.name || session?.user?.email || 'Unknown'

  const [expenses, setExpenses] = useState<Expense[]>([])
  const loadExpenses = async () => {
    try {
      const res = await fetch('/api/expenses')
      if (!res.ok) throw new Error('Failed to load expenses')
      const data = await res.json()
      setExpenses(data)
    } catch (error) {
      console.error('Error loading expenses:', error)
      alert('Failed to load expenses')
    }
  }
  useEffect(() => {
    loadExpenses()
  }, [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    currency: "PLN",
    description: "",
  })
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState<string | null>(null)
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + (expense.amountUSD || 0), 0), [expenses])

  const amountUSD = useMemo(() => {
    if (!exchangeRates || !formData.amount || isNaN(parseFloat(formData.amount))) return 0
    const amount = parseFloat(formData.amount)
    let result = amount
    if (formData.currency === 'PLN') result = amount / exchangeRates.USD_PLN
    else if (formData.currency === 'EUR') result = amount / exchangeRates.USD_EUR
    else if (formData.currency === 'BYN') result = amount / exchangeRates.USD_BYN
    return Math.round(result * 100) / 100
  }, [formData.amount, formData.currency, exchangeRates])

  const fetchRates = useCallback(async () => {
    try {
      setRatesLoading(true)
      setRatesError(null)

      // Fetch PLN to USD
      const plnResponse = await fetch('https://api.exchangerate-api.com/v4/latest/PLN')
      const plnData = await plnResponse.json()

      // Fetch USD to EUR
      const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const usdData = await usdResponse.json()

      setExchangeRates({
        USD_PLN: 1 / plnData.rates.USD,
        USD_EUR: usdData.rates.EUR,
        USD_BYN: plnData.rates.BYN / plnData.rates.USD,
      })
    } catch (error) {
      setRatesError('Failed to fetch exchange rates')
      console.error('Error fetching rates:', error)
    } finally {
      setRatesLoading(false)
    }
  }, [])

  const handleAddExpense = () => {
    setEditingId(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: "",
      currency: "PLN",
      description: "",
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      date: "",
      amount: "",
      currency: "PLN",
      description: "",
    })
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.amount || !formData.description) {
      alert("Please fill in all fields")
      return
    }

    if (!exchangeRates) {
      alert("Exchange rates not loaded yet, please wait")
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses'
      const body = {
        id: editingId || `EXP-${Date.now()}`,
        date: formData.date,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        amountUSD: Math.round(amountUSD * 100) / 100,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to save expense')

      await loadExpenses()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense')
    }
  }

  const handleEditExpense = (id: string) => {
    const expenseToEdit = expenses.find((expense) => expense.id === id)
    if (expenseToEdit) {
      setEditingId(id)
      setFormData({
        date: expenseToEdit.date,
        amount: expenseToEdit.amount.toString(),
        currency: expenseToEdit.currency,
        description: expenseToEdit.description,
      })
      setIsModalOpen(true)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete expense')

      await loadExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Expenses:</h1>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={handleAddExpense}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Add Expense
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:ml-0"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* ── Expense Grid ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* ── Desktop: single unified grid (header + all rows share column tracks) ── */}
        <div className={`hidden sm:grid ${GRID_COLS}`}>

          {/* Header cells — display:contents row */}
          <div className="contents">
            {["ID", "User", "Date", "Amount", "Currency", "Amount USD", "Description", "Actions"].map((h, i) => (
              <div
                key={h}
                className={`bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 ${i === 7 ? "text-right" : "text-left border-r border-gray-200"}`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Empty state spans all columns */}
          {expenses.length === 0 && (
            <div className="col-span-8 py-12 text-center text-sm text-gray-500">
              No expenses yet. Click &ldquo;Add Expense&rdquo; to get started.
            </div>
          )}

          {/* Data rows — display:contents so cells are direct grid children */}
          {expenses.map((expense) => (
            <div key={expense.id} className="contents group/row">
              <div className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-800 truncate group-hover/row:bg-gray-50 transition-colors">{expense.id}</div>
              <div className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-700 truncate group-hover/row:bg-gray-50 transition-colors">{expense.userName || '-'}</div>
              <div className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-700 group-hover/row:bg-gray-50 transition-colors">{expense.date}</div>
              <div className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-900 group-hover/row:bg-gray-50 transition-colors">{expense.amount.toFixed(2)}</div>
              <div className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-700 group-hover/row:bg-gray-50 transition-colors">{expense.currency}</div>
              <div className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-700 group-hover/row:bg-gray-50 transition-colors">{(expense.amountUSD || 0).toFixed(2)}</div>
              <div className="border-b border-r border-gray-100 px-4 py-3 text-left text-sm text-gray-700 group-hover/row:bg-gray-50 transition-colors">{expense.description}</div>
              <div className="border-b border-gray-100 px-4 py-3 flex justify-end items-center gap-2 group-hover/row:bg-gray-50 transition-colors">
                {expense.userName === currentUser && (
                  <button
                    type="button"
                    onClick={() => handleEditExpense(expense.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Mobile: card list ── */}
        <div className="sm:hidden divide-y divide-gray-100">
          {expenses.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">
              No expenses yet. Click &ldquo;Add Expense&rdquo; to get started.
            </p>
          )}
          {expenses.map((expense) => (
            <div key={`m-${expense.id}`}>
              {/* ── Mobile card ── */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-gray-400 truncate">{expense.id}</p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{expense.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {expense.date} • {expense.userName || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-gray-900">
                      {expense.amount.toFixed(2)}&nbsp;{expense.currency}
                    </p>
                    <p className="text-sm font-semibold text-indigo-600">
                      ${(expense.amountUSD || 0).toFixed(2)} USD
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {expense.userName === currentUser && (
                    <button
                      type="button"
                      onClick={() => handleEditExpense(expense.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-300 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-red-600 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <p className="mt-3 mb-6 text-lg font-semibold text-indigo-200">
        Total Amount: {total.toFixed(2)} $
      </p>

      {/* ── Exchange Rates (below grid) ── */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Exchange Rates</h3>

        {ratesLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {ratesError && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{ratesError}</p>
            <button onClick={fetchRates} className="mt-2 text-sm text-red-600 hover:text-red-500">
              Try again
            </button>
          </div>
        )}

        {exchangeRates && !ratesLoading && !ratesError && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">USD to PLN</p>
                  <p className="text-xs text-gray-500">1 USD = {exchangeRates.USD_PLN.toFixed(4)} PLN</p>
                </div>
                <p className="text-lg font-bold text-indigo-600">{exchangeRates.USD_PLN.toFixed(4)}</p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">EUR to USD</p>
                  <p className="text-xs text-gray-500">1 USD = {exchangeRates.USD_EUR.toFixed(4)} EUR</p>
                </div>
                <p className="text-lg font-bold text-indigo-600">{exchangeRates.USD_EUR.toFixed(4)}</p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">USD to BYN</p>
                  <p className="text-xs text-gray-500">1 USD = {exchangeRates.USD_BYN.toFixed(4)} BYN</p>
                </div>
                <p className="text-lg font-bold text-indigo-600">{exchangeRates.USD_BYN.toFixed(4)}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Rates refresh every minute &middot; Source: exchangerate-api.com
            </p>
          </>
        )}
      </div>

      {/* ── Modal ── */}
      <ExpenseForm
        isModalOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        exchangeRates={exchangeRates}
        amountUSD={amountUSD}
        onCloseModal={handleCloseModal}
        onFormChange={handleFormChange}
        onSubmitForm={handleSubmitForm}
        onFetchRates={fetchRates}
      />
    </main>
  )
}

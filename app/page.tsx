"use client"

import { useEffect, useMemo, useState } from "react"

type Expense = {
  id: string
  date: string
  amount: number
  currency: string
  description: string
}

type ExchangeRates = {
  USD_PLN: number
  USD_EUR: number
  USD_BYN: number
}

const currencies = ['PLN', 'USD', 'EUR', 'BYN']

export default function Home() {
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
  }, []);

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
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses])

  const fetchRates = async () => {
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
  }

  useEffect(() => {
    fetchRates()
    console.log("xxxx");
    // Update rates every 5 minutes
    const interval = setInterval(fetchRates, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleAddExpense = () => {
    setEditingId(null)
    setFormData({
      date: "",
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

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses'
      const body = {
        id: editingId || `EXP-${Date.now()}`,
        date: formData.date,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
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
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Expense Records</h1>
          <p className="text-sm text-white">Manage your expense entries from the grid below.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddExpense}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Expense Table */}
        <div className="flex-1">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Currency</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">{expense.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{expense.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900">
                      {expense.amount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.currency}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditExpense(expense.id)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mt-3 text-lg font-semibold text-indigo-200">
              Total Amount: {total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Exchange Rates Sidebar */}
        <div className="w-80">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Exchange Rates</h3>

            {ratesLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            )}

            {ratesError && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{ratesError}</p>
                <button
                  onClick={fetchRates}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Try again
                </button>
              </div>
            )}

            {exchangeRates && !ratesLoading && !ratesError && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">USD to PLN</p>
                    <p className="text-xs text-gray-500">1 USD = {exchangeRates.USD_PLN.toFixed(4)} PLN</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{exchangeRates.USD_PLN.toFixed(4)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">EUR to USD</p>
                    <p className="text-xs text-gray-500">1 USD = {exchangeRates.USD_EUR.toFixed(4)} EUR</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{exchangeRates.USD_EUR.toFixed(4)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">USD to BYN</p>
                    <p className="text-xs text-gray-500">1 USD = {exchangeRates.USD_BYN.toFixed(4)} BYN</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{exchangeRates.USD_BYN.toFixed(4)}</p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>Rates update every 5 minutes</p>
                  <p>Source: exchangerate-api.com</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {editingId ? "Edit Expense" : "Add Expense"}
            </h2>

            <form onSubmit={handleSubmitForm}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter expense description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  {editingId ? "Update Expense" : "Add Expense"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

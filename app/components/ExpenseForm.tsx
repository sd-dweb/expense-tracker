"use client"

import { useEffect } from "react"

type ExchangeRates = {
  USD_PLN: number
  USD_EUR: number
  USD_BYN: number
}

type ExpenseFormProps = {
  isModalOpen: boolean
  editingId: string | null
  formData: {
    date: string
    amount: string
    currency: string
    description: string
  }
  exchangeRates: ExchangeRates | null
  amountUSD: number
  onCloseModal: () => void
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onSubmitForm: (e: React.FormEvent) => Promise<void>
  onFetchRates: () => Promise<void>
}

const currencies = ['PLN', 'USD', 'EUR', 'BYN']

export default function ExpenseForm({
  isModalOpen,
  editingId,
  formData,
  exchangeRates,
  amountUSD,
  onCloseModal,
  onFormChange,
  onSubmitForm,
  onFetchRates,
}: ExpenseFormProps) {
  useEffect(() => {
    onFetchRates()
    const interval = setInterval(onFetchRates, 60000)
    return () => clearInterval(interval)
  }, [onFetchRates])

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {editingId ? "Edit Expense" : "Add Expense"}
            </h2>

            <form onSubmit={onSubmitForm}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="any"
                  min="0"
                  max="1000000"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={onFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={onFormChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              {formData.amount && exchangeRates && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Equivalent in USD: {amountUSD.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter expense description"
                  value={formData.description}
                  onChange={onFormChange}
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
                  onClick={onCloseModal}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}


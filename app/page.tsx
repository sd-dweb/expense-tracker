"use client"

import { useState } from "react"

type Expense = {
  id: string
  date: string
  amount: number
  currency: string
  description: string
}

const initialExpenses: Expense[] = [
  {
    id: "EXP-1001",
    date: "2026-03-28",
    amount: 54.25,
    currency: "PLN",
    description: "Groceries",
  },
  {
    id: "EXP-1002",
    date: "2026-03-29",
    amount: 18.0,
    currency: "PLN",
    description: "Taxi",
  },
  {
    id: "EXP-1003",
    date: "2026-03-31",
    amount: 120.5,
    currency: "PLN",
    description: "Utilities",
  },
  {
    id: "EXP-1004",
    date: "2026-04-01",
    amount: 164.25,
    currency: "PLN",
    description: "Groceries",
  },
]

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    currency: "PLN",
    description: "",
  })

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

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.amount || !formData.description) {
      alert("Please fill in all fields")
      return
    }

    if (editingId) {
      // Update existing expense
      setExpenses(
        expenses.map((expense) =>
          expense.id === editingId
            ? {
                ...expense,
                date: formData.date,
                amount: parseFloat(formData.amount),
                currency: formData.currency,
                description: formData.description,
              }
            : expense
        )
      )
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: `EXP-${Date.now()}`,
        date: formData.date,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
      }
      setExpenses([...expenses, newExpense])
    }

    handleCloseModal()
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

  const handleDeleteExpense = (id: string) => {
    console.log(`Delete expense with ID: ${id}`)
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
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
                  <option value="PLN">PLN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="BYN">BYN</option>
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

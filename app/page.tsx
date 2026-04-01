type Expense = {
  id: string
  date: string
  amount: number
  currency: string
  description: string
}

const expenses: Expense[] = [
  {
    id: "EXP-1001",
    date: "2026-03-28",
    amount: 54.25,
    currency: "USD",
    description: "Groceries",
  },
  {
    id: "EXP-1002",
    date: "2026-03-29",
    amount: 18.0,
    currency: "USD",
    description: "Taxi",
  },
  {
    id: "EXP-1003",
    date: "2026-03-31",
    amount: 120.5,
    currency: "USD",
    description: "Utilities",
  },
]

export default function Home() {
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Currency</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">{expense.id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.date}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{expense.description}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{expense.currency}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {expense.amount.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
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
    </main>
  )
}

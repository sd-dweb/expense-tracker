import connectToDatabase from '@/app/lib/mongodb';
import Expense from '@/app/models/Expense';
import { auth } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';
import ExpenseChart from '@/app/components/dashboard/expense-chart';

async function fetchDashboardData(userName: string) {
  await connectToDatabase();

  // Aggregate expenses for the user
  const expenses = await Expense.find({ userName }).sort({ date: 1 });

  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amountUSD || 0), 0);
  const totalExpenses = expenses.length;

  // Group by month for the chart
  const monthlyData = expenses.reduce((acc: Record<string, number>, exp) => {
    const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + (exp.amountUSD || 0);
    return acc;
  }, {});

  const chartData = Object.entries(monthlyData).map(([month, total]) => ({
    month,
    total: Math.round(total * 100) / 100
  }));

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalExpenses,
    chartData
  };
}

export default async function Dashboard() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const userName = session.user?.name || session.user?.email || 'Unknown';
  const { totalSpent, totalExpenses, chartData } = await fetchDashboardData(userName);

  return (
    <main className="">
      <h1 className="mb-6 text-2xl font-bold text-gray-800 md:text-3xl">Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Spent (USD)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalExpenses}</p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Average Expense</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${totalExpenses > 0 ? (totalSpent / totalExpenses).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="w-full">
        <h2 className="mb-4 text-xl font-semibold" style={{ color: '#262e37' }}>Spending Over Time</h2>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 min-h-[400px]">
          {chartData.length > 0 ? (
            <ExpenseChart data={chartData} />
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-gray-500">
              No expense data available to display chart.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


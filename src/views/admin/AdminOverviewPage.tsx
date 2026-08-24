import React, { useState, useEffect } from 'react';
import { Page, AdminOverviewStats, AdminTransaction, koboToNaira } from '@/types/index';
import { getAdminOverviewStats } from '@/lib/data-access';
import { Copy, Check, ArrowRight, RefreshCw } from 'lucide-react';

interface AdminOverviewPageProps {
  onNavigate: (page: Page) => void;
}

export function AdminOverviewPage({ onNavigate }: AdminOverviewPageProps) {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    getAdminOverviewStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Key operational metrics & latest incoming student transactions.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {/* Four figures in a row, no decoration */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-gray-200 bg-white divide-x divide-y md:divide-y-0 divide-gray-200">
        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
            Total Students
          </div>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {loading ? '—' : stats?.totalStudents.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            Enrolled across all tiers
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
            Total Revenue
          </div>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {loading ? '—' : koboToNaira(stats?.totalRevenueKobo || 0)}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            Gross Paystack settlements
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
            Enrollments This Week
          </div>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {loading ? '—' : stats?.enrollmentsThisWeek}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            Past 7 running days
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
            Avg Course Completion
          </div>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {loading ? '—' : `${stats?.avgCourseCompletionPercent}%`}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            Across active modules
          </div>
        </div>
      </div>

      {/* Ten Most Recent Transactions as a Compact Table */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-gray-900 uppercase font-mono tracking-wider">
              Recent Transactions
            </h2>
            <p className="text-[11px] text-gray-500">
              Showing the 10 most recent checkout and discount transactions.
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin/sales')}
            className="inline-flex items-center space-x-1 text-xs text-gray-700 hover:text-gray-900 font-medium hover:underline"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono text-[11px]">
                <th className="py-2.5 px-3 font-medium">Date (WAT)</th>
                <th className="py-2.5 px-3 font-medium">Student</th>
                <th className="py-2.5 px-3 font-medium">Product</th>
                <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-mono text-xs">
                    Loading transactions...
                  </td>
                </tr>
              ) : stats?.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-mono text-xs">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                stats?.recentTransactions.map((tx: AdminTransaction) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono text-gray-600 whitespace-nowrap text-[11px]">
                      {tx.date}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900">{tx.studentName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{tx.studentEmail}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-gray-100 text-gray-700">
                        {tx.product === 'cohort' ? 'Cohort 2' : 'Archive'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-right font-semibold text-gray-900 whitespace-nowrap">
                      {koboToNaira(tx.amountKobo)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${
                          tx.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : tx.status === 'refunded'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-600 whitespace-nowrap text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span>{tx.reference}</span>
                        <button
                          onClick={() => handleCopy(tx.reference)}
                          title="Copy Paystack reference"
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        >
                          {copiedRef === tx.reference ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

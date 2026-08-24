import React, { useState, useEffect } from 'react';
import { Page, AdminTransaction, koboToNaira } from '@/types/index';
import { getAdminTransactions } from '@/lib/data-access';
import {
  Search,
  Copy,
  Check,
  RefreshCw,
  X,
  CreditCard,
  Filter,
} from 'lucide-react';

interface AdminSalesPageProps {
  onNavigate: (page: Page) => void;
}

export function AdminSalesPage({ onNavigate }: AdminSalesPageProps) {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [totalFilteredKobo, setTotalFilteredKobo] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    getAdminTransactions({ status: statusFilter, dateRange, search }).then((res) => {
      setTransactions(res.transactions);
      setTotalFilteredKobo(res.totalFilteredKobo);
      setTotalCount(res.totalTransactionsCount);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, dateRange]);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Sales & Ledger</h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Full transaction records, discount tracking & Paystack reference audit logs.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Bar - Summed Total for Current Filter */}
      <div className="bg-white border border-gray-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 border border-gray-200 text-gray-700 rounded">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-gray-500">
              Summed Filtered Revenue
            </div>
            <div className="text-xl font-bold font-mono text-gray-900">
              {koboToNaira(totalFilteredKobo)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-gray-600">
          <div>
            <span className="text-gray-400">Transactions: </span>
            <span className="font-semibold text-gray-900">{totalCount}</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <span className="text-gray-400">Paid: </span>
            <span className="font-semibold text-emerald-700">
              {transactions.filter((t) => t.status === 'paid').length}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <span className="text-gray-400">Refunds: </span>
            <span className="font-semibold text-purple-700">
              {transactions.filter((t) => t.status === 'refunded').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-gray-200 p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reference, student, or coupon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white font-sans"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500 font-mono text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded py-1 px-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500 font-mono text-[11px]">Date:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded py-1 px-2 text-xs text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="all">All Time</option>
              <option value="today">Today (Aug 24)</option>
              <option value="7d">Last 7 Days</option>
              <option value="this-month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono text-[11px]">
                <th className="py-2.5 px-3 font-medium">Date (WAT)</th>
                <th className="py-2.5 px-3 font-medium">Student</th>
                <th className="py-2.5 px-3 font-medium">Product SKU</th>
                <th className="py-2.5 px-3 font-medium text-right">Amount (NGN)</th>
                <th className="py-2.5 px-3 font-medium">Discount Code</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Paystack Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-mono text-xs">
                    Loading financial ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-mono text-xs">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-gray-600 text-[11px] whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900">{tx.studentName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{tx.studentEmail}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-gray-100 text-gray-700">
                        {tx.product === 'cohort' ? 'Live Cohort 2' : 'Archive'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-semibold text-gray-900 whitespace-nowrap">
                      {koboToNaira(tx.amountKobo)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-600 text-[11px]">
                      {tx.discountCode ? (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded font-medium border border-gray-200">
                          {tx.discountCode}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
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
                    <td className="py-2.5 px-3 font-mono text-gray-700 text-[11px] whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium select-all">{tx.reference}</span>
                        <button
                          onClick={() => handleCopy(tx.reference)}
                          title="Copy Paystack reference"
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
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

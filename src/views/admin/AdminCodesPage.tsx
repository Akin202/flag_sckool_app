import React, { useState, useEffect } from 'react';
import { Page, AdminDiscountCode } from '@/types/index';
import {
  getAdminCodes,
  generateAdminCodes,
  toggleAdminCodeActive,
  deleteAdminCode,
} from '@/lib/data-access';
import {
  Copy,
  Check,
  Download,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AdminCodesPageProps {
  onNavigate: (page: Page) => void;
}

export function AdminCodesPage({ onNavigate }: AdminCodesPageProps) {
  const [codes, setCodes] = useState<AdminDiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate form state
  const [count, setCount] = useState<number>(10);
  const [product, setProduct] = useState<'all' | 'cohort' | 'recordings'>('cohort');
  const [kind, setKind] = useState<'invite' | 'promo' | 'alumni'>('alumni');
  const [discountPercent, setDiscountPercent] = useState<number>(100);
  const [expiryDate, setExpiryDate] = useState<string>('2026-03-31');
  const [generating, setGenerating] = useState(false);

  // Newly generated batch for instant export / copy
  const [lastGeneratedBatch, setLastGeneratedBatch] = useState<AdminDiscountCode[] | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [copiedSingle, setCopiedSingle] = useState<string | null>(null);

  const loadCodes = () => {
    setLoading(true);
    getAdminCodes().then((data) => {
      setCodes(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const generated = await generateAdminCodes({
        count: Number(count),
        product,
        kind,
        discountPercent: Number(discountPercent),
        expiryDate,
        maxRedemptionsPerCode: kind === 'alumni' ? 1 : 100,
      });

      setLastGeneratedBatch(generated);
      setCodes((prev) => [...generated, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAllGenerated = () => {
    if (!lastGeneratedBatch || lastGeneratedBatch.length === 0) return;
    const text = lastGeneratedBatch.map((c) => c.code).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  const handleDownloadCsvGenerated = () => {
    if (!lastGeneratedBatch || lastGeneratedBatch.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Code,Kind,AppliesTo,Discount,Expiry,MaxRedemptions']
        .concat(
          lastGeneratedBatch.map(
            (c) =>
              `"${c.code}","${c.kind}","${c.appliesTo}","${c.valueDescription}","${c.expiryDate}",${c.maxRedemptions}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `flagskool_${kind}_codes_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySingle = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSingle(code);
    setTimeout(() => setCopiedSingle(null), 1500);
  };

  const handleToggleActive = async (code: AdminDiscountCode) => {
    const updated = await toggleAdminCodeActive(code.id, !code.isActive);
    setCodes((prev) => prev.map((c) => (c.id === code.id ? updated : c)));
    if (lastGeneratedBatch) {
      setLastGeneratedBatch((prev) =>
        prev ? prev.map((c) => (c.id === code.id ? updated : c)) : null
      );
    }
  };

  const handleDelete = async (codeId: string) => {
    if (confirm('Permanently delete this discount code?')) {
      await deleteAdminCode(codeId);
      setCodes((prev) => prev.filter((c) => c.id !== codeId));
      if (lastGeneratedBatch) {
        setLastGeneratedBatch((prev) => (prev ? prev.filter((c) => c.id !== codeId) : null));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
            Discount & Alumni Codes
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Bulk generation for cohort alumni invites, marketing promotions, and partner grants.
          </p>
        </div>
        <button
          onClick={loadCodes}
          disabled={loading}
          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SECTION 1: GENERATE */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold uppercase text-gray-900 tracking-wider">
              1. Generate Codes (Bulk Engine)
            </span>
            <span className="text-[11px] font-mono text-gray-500">
              — optimized for fast alumni distribution
            </span>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-gray-600 mb-1">
                Count (Qty)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-600 mb-1">
                Kind
              </label>
              <select
                value={kind}
                onChange={(e) => {
                  const val = e.target.value as 'invite' | 'promo' | 'alumni';
                  setKind(val);
                  if (val === 'alumni' || val === 'invite') {
                    setDiscountPercent(100);
                  } else {
                    setDiscountPercent(50);
                  }
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
              >
                <option value="alumni">Alumni (1-Use Free/Discount)</option>
                <option value="promo">Promo (Multi-Use Campaign)</option>
                <option value="invite">Invite (Direct VIP Grant)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-600 mb-1">
                Product SKU
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
              >
                <option value="cohort">Live Cohort 2</option>
                <option value="recordings">Recordings Archive</option>
                <option value="all">All Products</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-600 mb-1">
                Discount Value (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(1, parseInt(e.target.value) || 100)))}
                className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-600 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-[11px] text-gray-500 font-mono">
              Creates {count} unique codes with {discountPercent}% discount applying to {product === 'all' ? 'any product' : product}.
            </div>
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded text-xs font-mono font-medium disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{generating ? 'Generating...' : `Generate ${count} Codes`}</span>
            </button>
          </div>
        </form>

        {/* Newly Generated Batch Quick Actions & Table */}
        {lastGeneratedBatch && lastGeneratedBatch.length > 0 && (
          <div className="border-t border-gray-200 bg-emerald-50/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold font-mono text-gray-900">
                  Newly Generated Batch ({lastGeneratedBatch.length} codes ready)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyAllGenerated}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 rounded"
                >
                  {copiedBatch ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedBatch ? 'Copied all!' : 'Copy All Codes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsvGenerated}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 rounded"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Batch CSV</span>
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 bg-white">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px]">
                    <th className="py-1.5 px-3">Code</th>
                    <th className="py-1.5 px-3">Kind</th>
                    <th className="py-1.5 px-3">Value</th>
                    <th className="py-1.5 px-3">Expires</th>
                    <th className="py-1.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[11px]">
                  {lastGeneratedBatch.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80">
                      <td className="py-1.5 px-3 font-bold text-gray-900 select-all">
                        {c.code}
                      </td>
                      <td className="py-1.5 px-3 uppercase text-gray-600">{c.kind}</td>
                      <td className="py-1.5 px-3 text-gray-700">{c.valueDescription}</td>
                      <td className="py-1.5 px-3 text-gray-500">{c.expiryDate}</td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          onClick={() => handleCopySingle(c.code)}
                          className="p-1 text-gray-500 hover:text-gray-900 rounded"
                        >
                          {copiedSingle === c.code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: EXISTING CODES */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-gray-900 uppercase font-mono tracking-wider">
              2. Existing Codes & Redemption History
            </h2>
            <p className="text-[11px] text-gray-500">
              {codes.length} active and historic discount, alumni, and promotional tokens.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono text-[11px]">
                <th className="py-2.5 px-3 font-medium">Code (Mono)</th>
                <th className="py-2.5 px-3 font-medium">Kind</th>
                <th className="py-2.5 px-3 font-medium">Value</th>
                <th className="py-2.5 px-3 font-medium">Applies To</th>
                <th className="py-2.5 px-3 font-medium text-center">Redemptions</th>
                <th className="py-2.5 px-3 font-medium">Expiry</th>
                <th className="py-2.5 px-3 font-medium text-center">Active</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 font-mono text-xs">
                    Loading codes library...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 font-mono text-xs">
                    No discount codes created yet.
                  </td>
                </tr>
              ) : (
                codes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-gray-900 select-all text-[12px]">
                      <div className="flex items-center space-x-1.5">
                        <span>{c.code}</span>
                        <button
                          onClick={() => handleCopySingle(c.code)}
                          title="Copy code"
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        >
                          {copiedSingle === c.code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          c.kind === 'alumni'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : c.kind === 'invite'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {c.kind}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-800 text-[11px]">
                      {c.valueDescription}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[11px] font-mono text-gray-600">
                        {c.appliesTo === 'cohort'
                          ? 'Cohort 2'
                          : c.appliesTo === 'recordings'
                          ? 'Recordings'
                          : 'All SKUs'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-gray-700 text-[11px]">
                      <span className="font-semibold">{c.redemptionsUsed}</span>
                      <span className="text-gray-400"> / </span>
                      <span>{c.maxRedemptions !== null ? c.maxRedemptions : '∞'}</span>
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-600 text-[11px] whitespace-nowrap">
                      {c.expiryDate || 'No Expiry'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleToggleActive(c)}
                        title={c.isActive ? 'Deactivate code' : 'Activate code'}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {/* Flag Red appears ONLY on destructive actions */}
                      <button
                        onClick={() => handleDelete(c.id)}
                        title="Delete code"
                        className="p-1 text-gray-400 hover:text-flag-red hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

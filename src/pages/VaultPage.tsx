import React, { useState, useEffect, useMemo } from 'react';
import {
  FlagSkoolConfig,
  Page,
  VaultResource,
  ResourceKind,
  ResourcesVariant,
  UserProfile,
  LoadState,
} from '@/types/index';
import { getAllVaultResources, getUserProfile } from '@/lib/data-access';
import { StudentNav } from '@/components/StudentNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Search,
  Download,
  FolderLock,
  FileCode,
  FileText,
  FileJson,
  Database,
  Layers,
  Sparkles,
  Filter,
  X,
} from 'lucide-react';

export interface VaultPageProps {
  config: FlagSkoolConfig;
  resourcesVariant?: ResourcesVariant;
  onNavigate?: (page: Page, lessonId?: string) => void;
}

export const VaultPage: React.FC<VaultPageProps> = ({
  config,
  resourcesVariant,
  onNavigate,
}) => {
  const [loadState, setLoadState] = useState<LoadState<VaultResource[]>>({
    status: 'loading',
  });
  const [user, setUser] = useState<UserProfile | undefined>();

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedKind, setSelectedKind] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    setLoadState({ status: 'loading' });

    Promise.all([
      getAllVaultResources(resourcesVariant),
      getUserProfile('usr-4911'),
    ])
      .then(([vaultItems, profile]) => {
        if (!isMounted) return;
        setLoadState({ status: 'success', data: vaultItems });
        setUser(profile);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadState({
          status: 'error',
          error: err?.message || 'Failed to load vault assets',
        });
      });

    return () => {
      isMounted = false;
    };
  }, [resourcesVariant]);

  // File type icon renderer
  const getResourceIcon = (format: string, kind: string) => {
    const fmt = format.toUpperCase();
    if (fmt === 'JSON' || kind === 'blueprint') {
      return <FileJson className="w-6 h-6 text-[#CA3A32]" />;
    }
    if (fmt === 'ZIP' || kind === 'code') {
      return <FileCode className="w-6 h-6 text-[#38BDF8]" />;
    }
    if (fmt === 'JSONL' || kind === 'dataset') {
      return <Database className="w-6 h-6 text-[#F59E0B]" />;
    }
    return <FileText className="w-6 h-6 text-[#10B981]" />;
  };

  // Filter items
  const filteredResources = useMemo(() => {
    if (loadState.status !== 'success') return [];

    return loadState.data.filter((item) => {
      // Search matching title, description, or module title
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase());

      // Module filter
      const matchesModule =
        selectedModule === 'all' || item.moduleId === selectedModule;

      // Kind filter
      const matchesKind = selectedKind === 'all' || item.kind === selectedKind;

      return matchesSearch && matchesModule && matchesKind;
    });
  }, [loadState, searchQuery, selectedModule, selectedKind]);

  // Reset filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedModule('all');
    setSelectedKind('all');
  };

  return (
    <div className="min-h-screen bg-[#030617] text-[#CBD5E1] flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <StudentNav
          config={config}
          currentPage="vault"
          user={user}
          onNavigate={(page) => onNavigate && onNavigate(page)}
        />

        {/* Vault Canvas */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
          
          {/* Header Banner */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#CA3A32]/20 text-[#CA3A32]">
                <FolderLock className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-mono text-[#8492A6] tracking-wider">
                Asset Vault & Blueprint Library
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-[#F8FAFC]">
              Commercial AI Vault
            </h1>
            <p className="text-sm sm:text-base text-[#8492A6] max-w-2xl leading-relaxed">
              Every production n8n JSON workflow blueprint, Python agent repository, masterclass slide deck, and fine-tuning dataset included in your Flag Skool access.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0F29] border border-[#1A2342] space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-[#8492A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="vault-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workflows, prompt guides, FastAPI scaffolds, datasets..."
                className="w-full bg-[#030617] border border-[#1A2342] focus:border-[#CA3A32] rounded-xl pl-11 pr-10 py-3 text-sm text-[#F8FAFC] placeholder-[#8492A6] focus:outline-none focus:ring-1 focus:ring-[#CA3A32]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8492A6] hover:text-[#F8FAFC]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Chips: Resource Kinds */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[#8492A6] font-mono whitespace-nowrap pl-1 pr-2">
                Type:
              </span>
              {[
                { id: 'all', label: 'All Assets' },
                { id: 'blueprint', label: 'Blueprints (n8n JSON)' },
                { id: 'code', label: 'Code Repos (ZIP)' },
                { id: 'slide', label: 'Slide Decks (PDF)' },
                { id: 'dataset', label: 'Datasets (JSONL)' },
                { id: 'doc', label: 'Cheat Sheets' },
              ].map((k) => (
                <button
                  key={k.id}
                  id={`vault-filter-kind-${k.id}`}
                  type="button"
                  onClick={() => setSelectedKind(k.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    selectedKind === k.id
                      ? 'bg-[#CA3A32] text-[#F8FAFC] font-semibold'
                      : 'bg-[#1A2342]/70 text-[#8492A6] hover:text-[#F8FAFC] hover:bg-[#1A2342]'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            {/* Filter Chips: Modules */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-t border-[#1A2342]/60 pt-3">
              <span className="text-[#8492A6] font-mono whitespace-nowrap pl-1 pr-2">
                Module:
              </span>
              {[
                { id: 'all', label: 'All Modules' },
                { id: 'mod-1', label: 'Mod 1: Foundations' },
                { id: 'mod-2', label: 'Mod 2: n8n' },
                { id: 'mod-3', label: 'Mod 3: Agents' },
                { id: 'mod-4', label: 'Mod 4: RAG' },
                { id: 'mod-5', label: 'Mod 5: Products' },
              ].map((m) => (
                <button
                  key={m.id}
                  id={`vault-filter-mod-${m.id}`}
                  type="button"
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-1 rounded-md whitespace-nowrap font-mono transition-colors ${
                    selectedModule === m.id
                      ? 'bg-[#CBD5E1] text-[#030617] font-bold'
                      : 'bg-[#1A2342]/40 text-[#8492A6] hover:text-[#CBD5E1]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {loadState.status === 'loading' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Card key={n} className="p-5 bg-[#0A0F29] border-[#1A2342] space-y-4">
                  <Skeleton height={36} width={36} />
                  <Skeleton height={20} width="80%" />
                  <Skeleton height={14} width="100%" />
                  <Skeleton height={40} width="100%" />
                </Card>
              ))}
            </div>
          ) : loadState.status === 'success' ? (
            loadState.data.length === 0 ? (
              /* EMPTY VAULT STATE */
              <EmptyState
                icon={<FolderLock className="w-10 h-10 text-[#8492A6]" />}
                headline="Vault Currently Empty"
                body="No downloadable assets were returned for your current tier configuration."
              />
            ) : filteredResources.length === 0 ? (
              /* NO FILTER RESULTS STATE */
              <EmptyState
                icon={<Search className="w-10 h-10 text-[#8492A6]" />}
                headline="No Matching Resources"
                body={`No assets match your search "${searchQuery}" and selected filters.`}
                actionLabel="Clear Filters"
                onAction={handleClearFilters}
              />
            ) : (
              /* POPULATED ASSETS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((res) => (
                  <Card
                    key={res.id}
                    id={`vault-card-${res.id}`}
                    className="p-5 bg-[#0A0F29] border border-[#1A2342] hover:border-[#2D3A63] transition-all flex flex-col justify-between space-y-4 relative group"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Icon, format & module badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-xl bg-[#1A2342] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          {getResourceIcon(res.fileFormat, res.kind)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1A2342] text-[#CBD5E1] font-semibold uppercase">
                            {res.fileFormat}
                          </span>
                          <span className="font-mono text-[11px] text-[#8492A6]">
                            {res.sizeFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Module context tag */}
                      <div className="text-[11px] font-mono font-bold text-[#CA3A32] uppercase">
                        Module 0{res.moduleNumber} · {res.moduleTitle}
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-bold text-base text-[#F8FAFC] leading-snug">
                        {res.title}
                      </h3>

                      {/* Description */}
                      {res.description && (
                        <p className="text-xs text-[#8492A6] leading-relaxed line-clamp-3">
                          {res.description}
                        </p>
                      )}
                    </div>

                    {/* Download Button */}
                    {/* // TODO(handoff): signed download URL */}
                    <div className="pt-3 border-t border-[#1A2342]">
                      <a
                        id={`vault-download-${res.id}`}
                        href={res.downloadUrl}
                        download
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#1A2342] hover:bg-[#CA3A32] text-[#F8FAFC] text-xs font-semibold flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-[#CA3A32]"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Asset</span>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <Card className="p-6 bg-[#0A0F29] border-[#CA3A32]/40 text-center space-y-2">
              <p className="text-sm text-[#CA3A32]">
                {loadState.status === 'error' ? loadState.error : 'Error loading vault'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Card>
          )}

        </main>
      </div>
    </div>
  );
};

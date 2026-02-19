import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, List, GitBranch, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Schema = Database['public']['Tables']['regionbu']['Row'];
type ViewMode = 'table' | 'tree';

export default function DashboardLayoutProps() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<Schema | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [expandedBUs, setExpandedBUs] = useState<Set<string>>(new Set());

  const [newSchema, setNewSchema] = useState<
    Omit<Database['public']['Tables']['regionbu']['Insert'], 'ID'>
  >({
    region: '',
    bucenter: '',
    district: '',
  });

  useEffect(() => {
    fetchSchema();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('regionbu')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch schema.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchema = () => {
    setEditingSchema(null);
    setNewSchema({ region: '', bucenter: '', district: '' });
    setShowModal(true);
  };

  const handleEdit = (schema: Schema) => {
    setEditingSchema(schema);
    setNewSchema({
      region: schema.region || '',
      bucenter: schema.bucenter || '',
      district: schema.district || '',
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    try {
      if (editingSchema) {
        const { data, error } = await supabase
          .from('regionbu')
          .update(newSchema)
          .eq('id', editingSchema.id)
          .select();
        if (error) throw error;
        setSchemas(schemas.map((s) => (s.id === editingSchema.id ? data[0] : s)));
        toast({ title: 'Success', description: 'Schema updated successfully' });
      } else {
        const { data, error } = await supabase
          .from('regionbu')
          .insert([newSchema])
          .select();
        if (error) throw error;
        setSchemas([...schemas, ...data]);
        toast({ title: 'Success', description: 'Schema added successfully' });
      }
      setShowModal(false);
      setEditingSchema(null);
      setNewSchema({ region: '', bucenter: '', district: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save schema', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this schema?')) {
      const { error } = await supabase.from('regionbu').delete().eq('id', id);
      if (error) {
        toast({ title: 'Error', description: 'Failed to delete schema', variant: 'destructive' });
      } else {
        setSchemas(schemas.filter((s) => s.id !== id));
        toast({ title: 'Deleted', description: 'Schema deleted successfully' });
      }
    }
  };

  const filteredSchemas = schemas.filter((schema) => {
    const q = searchQuery.toLowerCase();
    return (
      schema.region?.toLowerCase().includes(q) ||
      schema.bucenter?.toLowerCase().includes(q) ||
      schema.district?.toLowerCase().includes(q)
    );
  });

  // ─── Tree helpers ────────────────────────────────────────────────────────────
  const buildTree = (data: Schema[]) => {
    const tree: Record<string, Record<string, Schema[]>> = {};
    data.forEach((row) => {
      const region = row.region || 'Unknown';
      const bu = row.bucenter || 'Unknown';
      if (!tree[region]) tree[region] = {};
      if (!tree[region][bu]) tree[region][bu] = [];
      tree[region][bu].push(row);
    });
    return tree;
  };

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });
  };

  const toggleBU = (key: string) => {
    setExpandedBUs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const tree = buildTree(filteredSchemas);
    setExpandedRegions(new Set(Object.keys(tree)));
    const buKeys = new Set<string>();
    Object.entries(tree).forEach(([region, bus]) => {
      Object.keys(bus).forEach((bu) => buKeys.add(`${region}__${bu}`));
    });
    setExpandedBUs(buKeys);
  };

  const collapseAll = () => {
    setExpandedRegions(new Set());
    setExpandedBUs(new Set());
  };
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const tree = buildTree(filteredSchemas);

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* ═══════════════════════════ MOBILE LAYOUT ═══════════════════════════ */
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">REGION / BU</h2>
                <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <div className="flex items-center bg-gray-700 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                      title="Table view"
                    >
                      <List size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode('tree')}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'tree' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                      title="Tree view"
                    >
                      <GitBranch size={15} />
                    </button>
                  </div>
                  <button
                    onClick={handleAddSchema}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-input border-border text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {viewMode === 'table' ? (
              /* Mobile – Table (card) list */
              <div className="space-y-3 pb-6">
                {filteredSchemas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No regions found</div>
                ) : (
                  filteredSchemas.map((schema) => (
                    <Card key={schema.id} className="bg-card border-border" onClick={() => handleEdit(schema)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-primary font-semibold text-sm mb-1">{schema.region}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Region</div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(schema); }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(schema.id); }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="h-px bg-border my-2"></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">BU Center</div>
                            <div className="text-sm text-foreground mt-0.5">{schema.bucenter || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">District</div>
                            <div className="text-sm text-foreground mt-0.5">{schema.district || '-'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              /* Mobile – Tree view */
              <div className="space-y-2 pb-6">
                {Object.entries(tree).map(([region, bus]) => {
                  const isRegionOpen = expandedRegions.has(region);
                  const totalDistricts = Object.values(bus).flat().length;
                  return (
                    <div key={region} className="rounded-lg overflow-hidden border border-gray-700">
                      {/* Region */}
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 text-left"
                        onClick={() => toggleRegion(region)}
                      >
                        <div className="flex items-center gap-2">
                          {isRegionOpen ? <ChevronDown size={16} className="text-blue-400" /> : <ChevronRight size={16} className="text-blue-400" />}
                          <span className="text-blue-400 font-semibold text-sm">{region}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Object.keys(bus).length} BUs · {totalDistricts} districts
                        </span>
                      </button>

                      {isRegionOpen && Object.entries(bus).map(([bu, districts]) => {
                        const buKey = `${region}__${bu}`;
                        const isBUOpen = expandedBUs.has(buKey);
                        return (
                          <div key={buKey}>
                            {/* BU Center */}
                            <button
                              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800 text-left border-t border-gray-700"
                              onClick={() => toggleBU(buKey)}
                            >
                              <div className="flex items-center gap-2 pl-4">
                                {isBUOpen ? <ChevronDown size={14} className="text-yellow-400" /> : <ChevronRight size={14} className="text-yellow-400" />}
                                <span className="text-yellow-300 text-sm font-medium">{bu}</span>
                              </div>
                              <span className="text-xs text-gray-500">{districts.length} districts</span>
                            </button>

                            {/* Districts */}
                            {isBUOpen && districts.map((row) => (
                              <div
                                key={row.id}
                                className="flex items-center justify-between px-4 py-2 border-t border-gray-700"
                                style={{ backgroundColor: '#111827' }}
                              >
                                <div className="flex items-center gap-2 pl-10">
                                  <span className="text-gray-600 text-xs">└</span>
                                  <span className="text-gray-200 text-sm">{row.district || '-'}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-400 hover:text-blue-400 rounded transition-colors">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDelete(row.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ══════════════════════════ DESKTOP LAYOUT ═══════════════════════════ */
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">REGION / BU</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-input border-border transition-all duration-300 hover:w-80 focus:w-80"
                />
              </div>

              {/* View toggle */}
              <div className="flex items-center bg-gray-700 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List size={15} />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'tree'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <GitBranch size={15} />
                  Tree
                </button>
              </div>

              {/* Add button */}
              <button
                onClick={handleAddSchema}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 mx-4 mb-4 mt-4 overflow-hidden flex flex-col">
            {viewMode === 'table' ? (
              /* ── Desktop Table View ── */
              <div className="flex-1 overflow-auto bg-gray-800 rounded-lg shadow custom-scrollbar">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-900 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">REGION</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">BU CENTER</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DISTRICT</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 w-32 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredSchemas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-gray-400">No regions found</td>
                      </tr>
                    ) : (
                      filteredSchemas.map((schema) => (
                        <tr key={schema.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.region}</td>
                          <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.bucenter}</td>
                          <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.district}</td>
                          <td className="px-6 py-4 w-32">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(schema)}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(schema.id)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ── Desktop Tree View ── */
              <div className="flex-1 overflow-auto bg-gray-800 rounded-lg shadow custom-scrollbar flex flex-col">
                {/* Tree toolbar */}
                <div className="flex items-center justify-between px-5 py-2.5 bg-gray-900 border-b border-gray-700 sticky top-0 z-10 rounded-t-lg flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {Object.keys(tree).length} region{Object.keys(tree).length !== 1 ? 's' : ''} · {filteredSchemas.length} total rows
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={expandAll}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors border border-gray-600"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={collapseAll}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors border border-gray-600"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                {filteredSchemas.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">No regions found</div>
                ) : (
                  <div className="flex-1 overflow-auto p-3 space-y-2">
                    {Object.entries(tree).map(([region, bus]) => {
                      const isRegionOpen = expandedRegions.has(region);
                      const buCount = Object.keys(bus).length;
                      const districtCount = Object.values(bus).flat().length;

                      return (
                        <div key={`region-${region}`} className="rounded-lg overflow-hidden border border-gray-700">
                          {/* ── Region row ── */}
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors select-none group"
                            style={{ backgroundColor: '#0f172a' }}
                            onClick={() => toggleRegion(region)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/20 flex-shrink-0">
                                {isRegionOpen
                                  ? <ChevronDown size={13} className="text-blue-400" />
                                  : <ChevronRight size={13} className="text-blue-400" />}
                              </div>
                              <span className="text-blue-400 font-bold tracking-wide">{region}</span>
                              <div className="flex items-center gap-1.5 ml-1">
                                <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                                  {buCount} BU{buCount !== 1 ? 's' : ''}
                                </span>
                                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600">
                                  {districtCount} district{districtCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* ── BU rows ── */}
                          {isRegionOpen && (
                            <div className="border-t border-gray-700">
                              {Object.entries(bus).map(([bu, districts], buIdx, buArr) => {
                                const buKey = `${region}__${bu}`;
                                const isBUOpen = expandedBUs.has(buKey);
                                const isLastBU = buIdx === buArr.length - 1;

                                return (
                                  <div key={`bu-${buKey}`} className={!isLastBU || isBUOpen ? 'border-b border-gray-700/60' : ''}>
                                    <button
                                      className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors select-none hover:bg-gray-700/50"
                                      style={{ backgroundColor: '#131f2e' }}
                                      onClick={() => toggleBU(buKey)}
                                    >
                                      <div className="flex items-center gap-3 pl-7">
                                        {/* connector line */}
                                        <div className="flex items-center gap-2">
                                          <div className="w-4 h-5 border-l-2 border-b-2 border-gray-600 rounded-bl-md flex-shrink-0 -mt-2" />
                                          <div className="w-4 h-4 rounded flex items-center justify-center bg-yellow-500/15 flex-shrink-0">
                                            {isBUOpen
                                              ? <ChevronDown size={11} className="text-yellow-400" />
                                              : <ChevronRight size={11} className="text-yellow-400" />}
                                          </div>
                                        </div>
                                        <span className="text-yellow-300 font-semibold text-sm">{bu}</span>
                                        <span className="text-xs bg-yellow-500/10 text-yellow-400/80 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                          {districts.length} district{districts.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </button>

                                    {/* ── District rows ── */}
                                    {isBUOpen && (
                                      <div className="divide-y divide-gray-700/40" style={{ backgroundColor: '#0c1520' }}>
                                        {districts.map((row, dIdx) => (
                                          <div
                                            key={`district-${row.id}`}
                                            className="flex items-center justify-between px-4 py-2 hover:bg-gray-700/40 transition-colors group/row"
                                          >
                                            <div className="flex items-center gap-2 pl-16">
                                              {/* leaf connector */}
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="w-4 h-5 border-l-2 border-b-2 border-gray-700 rounded-bl-md -mt-2 flex-shrink-0" />
                                              </div>
                                              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                                              <span className="text-gray-200 text-sm">{row.district || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                              <button
                                                onClick={() => handleEdit(row)}
                                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                                                title="Edit"
                                              >
                                                <Edit2 size={14} />
                                              </button>
                                              <button
                                                onClick={() => handleDelete(row.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                title="Delete"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════ MODAL ══════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchema ? 'Edit Region / BU' : 'Add Region / BU'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'region', label: 'Region', type: 'text' },
                { key: 'bucenter', label: 'BU Center', type: 'text' },
                { key: 'district', label: 'District', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm mb-1 text-gray-300">{label}</label>
                  <input
                    type={type}
                    className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSchema[key]}
                    onChange={(e) => setNewSchema({ ...newSchema, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchema}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {editingSchema ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
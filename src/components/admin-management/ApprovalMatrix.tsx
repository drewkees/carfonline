import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Search, Building2, GitMerge, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ApprovalMatrixRow = Database['public']['Tables']['approvalmatrix']['Row'];
type CompanyRow = Database['public']['Tables']['company']['Row'];

type FormData = {
  approvaltype: string;
  firstapprover: string[];
  secondapprover: string[];
  thirdapprover: string[];
  company?: string;
};

type UserRow = { userid: string; fullname: string; email: string };
type CarfTypeRow = { id: number; carftype: string; company: string | null };

// ── Inline Multi-select (no absolute positioning — expands in flow) ───────────
function ApproverMultiSelect({
  label,
  selectedValues,
  onChange,
  users,
}: {
  label: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  users: UserRow[];
  filterCompany: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.userid.toLowerCase().includes(q) ||
      u.fullname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const toggle = (userid: string) => {
    if (selectedValues.includes(userid)) {
      onChange(selectedValues.filter((v) => v !== userid));
    } else {
      onChange([...selectedValues, userid]);
    }
  };

  const handleOpen = () => {
    setOpen((o) => {
      if (!o) setTimeout(() => searchRef.current?.focus(), 50);
      return !o;
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>

      {/* Trigger row */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm flex justify-between items-center hover:border-gray-500 transition-colors min-h-[42px] text-left"
      >
        <span className={`truncate pr-2 ${selectedValues.length === 0 ? 'text-gray-500' : 'text-white'}`}>
          {selectedValues.length === 0 ? `— Select ${label} —` : selectedValues.join(', ')}
        </span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          {selectedValues.length > 0 && (
            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-medium">
              {selectedValues.length}
            </span>
          )}
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </span>
      </button>

      {/* Inline expanded panel — pushes content down, never clips */}
      {open && (
        <div className="rounded-lg border border-gray-600 bg-gray-850 overflow-hidden" style={{ background: '#1a1f2e' }}>
          {/* Search */}
          <div className="p-2 border-b border-gray-700">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search users..."
              className="w-full px-3 py-1.5 rounded-md bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 custom-scrollbar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-44 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 italic">No users found</div>
            ) : (
              filtered.map((u) => {
                const selected = selectedValues.includes(u.userid);
                return (
                  <div
                    key={u.userid}
                    onClick={() => toggle(u.userid)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      selected ? 'bg-blue-600/20' : 'hover:bg-gray-700/60'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                      selected ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                    }`}>
                      {selected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white font-medium truncate">{u.userid}</div>
                      <div className="text-xs text-gray-400 truncate">{u.fullname}</div>
                    </div>
                    {selected && (
                      <span className="text-blue-400 text-xs flex-shrink-0">✓</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: selected chips + clear */}
          {selectedValues.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-700 bg-gray-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400 font-medium">{selectedValues.length} selected</span>
                <button
                  onClick={() => onChange([])}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedValues.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 bg-blue-600/25 border border-blue-600/40 text-blue-300 text-xs px-2 py-0.5 rounded-full"
                  >
                    {v}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(v); }}
                      className="hover:text-white transition-colors ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="px-3 py-2 border-t border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={() => { setOpen(false); setSearch(''); }}
              className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const toArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val]; }
    catch { return val.split(',').map((s) => s.trim()).filter(Boolean); }
  }
  return [];
};

const fromArray = (arr: string[]): string => arr.join(', ');

// ── Main Component ────────────────────────────────────────────────────────────
export default function ApprovalMatrix() {
  const [schemas, setSchemas] = useState<ApprovalMatrixRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [carfTypes, setCarfTypes] = useState<CarfTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<ApprovalMatrixRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [newSchema, setNewSchema] = useState<FormData>({
    approvaltype: '',
    firstapprover: [],
    secondapprover: [],
    thirdapprover: [],
    company: '',
  });

  useEffect(() => {
    fetchSchema();
    fetchCompanies();
    fetchUsers();
    fetchCarfTypes();
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
        .from('approvalmatrix')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setSchemas(data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch approval matrix.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('company').select('*').order('company_name', { ascending: true });
    if (!error) setCompanies(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('userid, fullname, email')
      .order('userid', { ascending: true });
    if (!error && data) setUsers(data as UserRow[]);
  };

  const fetchCarfTypes = async () => {
    const { data, error } = await supabase
      .from('customertypeseries')
      .select('id, carftype, company')
      .order('carftype', { ascending: true });
    if (!error && data) setCarfTypes(data as CarfTypeRow[]);
  };

  const filteredCarfTypes = newSchema.company
    ? carfTypes.filter((ct) => !ct.company || ct.company === newSchema.company)
    : carfTypes;

  const resetForm = (): FormData => ({
    approvaltype: '',
    firstapprover: [],
    secondapprover: [],
    thirdapprover: [],
    company: '',
  });

  const handleAddSchema = () => {
    setEditingSchema(null);
    setNewSchema(resetForm());
    setShowModal(true);
  };

  const handleEdit = (schema: ApprovalMatrixRow) => {
    setEditingSchema(schema);
    setNewSchema({
      approvaltype: schema.approvaltype || '',
      firstapprover: toArray(schema.firstapprover),
      secondapprover: toArray(schema.secondapprover),
      thirdapprover: toArray(schema.thirdapprover),
      company: (schema as any).company || '',
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    try {
      const payload = {
        ...newSchema,
        firstapprover: fromArray(newSchema.firstapprover),
        secondapprover: fromArray(newSchema.secondapprover),
        thirdapprover: fromArray(newSchema.thirdapprover),
      };

      if (editingSchema) {
        const { data, error } = await supabase
          .from('approvalmatrix')
          .update(payload)
          .eq('id', editingSchema.id)
          .select();
        if (error) throw error;
        setSchemas(schemas.map((s) => (s.id === editingSchema.id ? data[0] : s)));
        toast({ title: 'Success', description: 'Approval matrix updated successfully' });
      } else {
        const { data, error } = await supabase
          .from('approvalmatrix')
          .insert([payload])
          .select();
        if (error) throw error;
        setSchemas([...schemas, ...data]);
        toast({ title: 'Success', description: 'Approval matrix added successfully' });
      }
      setShowModal(false);
      setEditingSchema(null);
      setNewSchema(resetForm());
    } catch {
      toast({ title: 'Error', description: 'Failed to save approval matrix', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this approval matrix?')) return;
    const { error } = await supabase.from('approvalmatrix').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } else {
      setSchemas(schemas.filter((s) => s.id !== id));
      toast({ title: 'Deleted', description: 'Approval matrix deleted successfully' });
    }
  };

  const filteredSchemas = schemas.filter((schema) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      schema.approvaltype?.toLowerCase().includes(q) ||
      schema.firstapprover?.toLowerCase().includes(q) ||
      schema.secondapprover?.toLowerCase().includes(q) ||
      schema.thirdapprover?.toLowerCase().includes(q);
    const matchesCompany = selectedCompany ? (schema as any).company === selectedCompany : true;
    return matchesSearch && matchesCompany;
  });

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

  const CompanySelect = ({ className = '' }: { className?: string }) => (
    <div className={`relative ${className}`}>
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <select
        value={selectedCompany}
        onChange={(e) => setSelectedCompany(e.target.value)}
        className="pl-9 pr-8 py-2 text-sm rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full cursor-pointer"
      >
        <option value="">All Companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.company}>
            {c.company_name} ({c.company})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</div>
    </div>
  );

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* ── Mobile Layout ── */
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">APPROVAL MATRIX</h2>
                <button
                  onClick={handleAddSchema}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-input border-border text-sm"
                  />
                </div>
                <CompanySelect className="flex-1" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3 pb-6">
              {filteredSchemas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No approval matrix found</div>
              ) : (
                filteredSchemas.map((schema) => (
                  <Card key={schema.id} className="bg-card border-border" onClick={() => handleEdit(schema)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-primary font-semibold text-sm mb-1">{schema.approvaltype}</div>
                          {(schema as any).company && (
                            <div className="text-xs text-muted-foreground">{(schema as any).company}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(schema); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(schema.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="h-px bg-border my-2"></div>
                      <div className="space-y-2">
                        {[
                          { label: 'First Approver', value: schema.firstapprover },
                          { label: 'Second Approver', value: schema.secondapprover },
                          { label: 'Third Approver', value: schema.thirdapprover },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
                            <div className="text-sm text-foreground mt-0.5">{value || '-'}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Desktop Layout ── */
        <>
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">Approval Matrix</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-52 bg-input border-border transition-all duration-300 hover:w-72 focus:w-72"
                />
              </div>
              <CompanySelect className="w-52" />
              <button
                onClick={handleAddSchema}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          <div className="flex-1 mx-4 mb-4 mt-4 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-800 rounded-lg shadow custom-scrollbar">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">COMPANY</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">APPROVAL TYPE</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">FIRST APPROVER</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">SECOND APPROVER</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">THIRD APPROVER</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSchemas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic text-sm">
                        No approval matrix found
                      </td>
                    </tr>
                  ) : (
                    filteredSchemas.map((schema) => (
                      <tr key={schema.id} className="hover:bg-gray-700 transition-colors cursor-pointer" onDoubleClick={() => handleEdit(schema)}>
                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap text-sm">{(schema as any).company || '-'}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.approvaltype}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.firstapprover || '-'}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.secondapprover || '-'}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.thirdapprover || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(schema)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors" title="Edit">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(schema.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors" title="Delete">
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
          </div>
        </>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800 rounded-t-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <GitMerge size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editingSchema ? 'Edit Approval Matrix' : 'New Approval Matrix'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {editingSchema
                      ? `Editing: ${editingSchema.approvaltype}`
                      : 'Define approval workflow for a customer type'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

              {/* Configuration section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Configuration</span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Company <span className="text-red-400">*</span>
                    </label>
                    <select
                      className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer"
                      value={newSchema.company || ''}
                      onChange={(e) => setNewSchema({ ...newSchema, company: e.target.value, approvaltype: '' })}
                    >
                      <option value="">— Select Company —</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.company}>
                          {c.company_name} ({c.company})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Approval Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer disabled:opacity-50"
                      value={newSchema.approvaltype}
                      onChange={(e) => setNewSchema({ ...newSchema, approvaltype: e.target.value })}
                      disabled={!newSchema.company}
                    >
                      <option value="">
                        {!newSchema.company ? '— Select a company first —' : '— Select Approval Type —'}
                      </option>
                      {filteredCarfTypes.map((ct) => (
                        <option key={ct.id} value={ct.carftype}>{ct.carftype}</option>
                      ))}
                    </select>
                    {!newSchema.company && (
                      <p className="text-xs text-amber-500 mt-0.5">Please select a company to load available types.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700/60" />

              {/* Approvers section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Approvers</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Click a level to expand it, search and tick users, then click <strong className="text-gray-400">Done</strong> to close.
                </p>

                <div className="space-y-3">
                  <ApproverMultiSelect
                    label="First Approver"
                    selectedValues={newSchema.firstapprover}
                    onChange={(vals) => setNewSchema({ ...newSchema, firstapprover: vals })}
                    users={users}
                    filterCompany={newSchema.company || ''}
                  />
                  <ApproverMultiSelect
                    label="Second Approver"
                    selectedValues={newSchema.secondapprover}
                    onChange={(vals) => setNewSchema({ ...newSchema, secondapprover: vals })}
                    users={users}
                    filterCompany={newSchema.company || ''}
                  />
                  <ApproverMultiSelect
                    label="Third Approver"
                    selectedValues={newSchema.thirdapprover}
                    onChange={(vals) => setNewSchema({ ...newSchema, thirdapprover: vals })}
                    users={users}
                    filterCompany={newSchema.company || ''}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl flex-shrink-0">
              <p className="text-xs text-gray-500"><span className="text-red-400">*</span> Required fields</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchema}
                  className="px-5 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/30"
                >
                  {editingSchema ? 'Save Changes' : 'Create Matrix'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
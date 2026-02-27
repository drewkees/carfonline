import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Plus, Edit2, Trash2, X, Search, List, GitBranch,
  ChevronRight, ChevronDown, LayoutGrid, FileCode, FolderOpen,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import ListLoadingSkeleton from './ListLoadingSkeleton';

type Schema = Database['public']['Tables']['schemas']['Row'];
type ViewMode = 'table' | 'tree';

const TYPE_CONFIG: Record<string, {
  label: string; icon: React.ReactNode; badgeClass: string;
  rowBg: string; headerBg: string; textClass: string; borderClass: string;
}> = {
  M: { label: 'Menu', icon: <LayoutGrid size={14} />, badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', rowBg: '#0f172a', headerBg: '#0a1628', textClass: 'text-blue-400', borderClass: 'border-blue-500/30' },
  S: { label: 'Submenu', icon: <FolderOpen size={14} />, badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30', rowBg: '#131f2e', headerBg: '#0f1a24', textClass: 'text-yellow-300', borderClass: 'border-yellow-500/30' },
  P: { label: 'Program', icon: <FileCode size={14} />, badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', rowBg: '#0c1a14', headerBg: '#091410', textClass: 'text-emerald-300', borderClass: 'border-emerald-500/30' },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type] ?? { label: type || 'Unknown', icon: <FileCode size={14} />, badgeClass: 'bg-gray-500/20 text-gray-300 border border-gray-500/30', rowBg: '#1a1a2e', headerBg: '#111122', textClass: 'text-gray-300', borderClass: 'border-gray-500/30' };

const TypeBadge = ({ type }: { type: string }) => {
  const cfg = getTypeConfig(type);
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badgeClass}`}>{cfg.icon}{cfg.label}</span>;
};

const boolText = (v: boolean) => (v ? 'Yes' : 'No');

// All lucide icon names (only capitalized component names)
const ALL_LUCIDE_ICONS = Object.keys(LucideIcons).filter(
  (key) => /^[A-Z]/.test(key) && key !== 'createLucideIcon'
);

const SelectField = ({ label, value, onChange, options, placeholder, accentClass }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string; accentClass?: string;
}) => (
  <div>
    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded-lg bg-gray-700/60 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-white appearance-none cursor-pointer ${value ? accentClass || 'border-blue-500/50' : 'border-gray-600'}`}
    >
      <option value="" className="bg-gray-800 text-gray-400">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value} className="bg-gray-800 text-white">{o.label}</option>)}
    </select>
  </div>
);

export default function SchemaList() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<Schema | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['M', 'S', 'P']));
  const [selectedParentMenu, setSelectedParentMenu] = useState('');
  const [selectedParentSubmenu, setSelectedParentSubmenu] = useState('');

  // Icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const [newSchema, setNewSchema] = useState<Omit<Database['public']['Tables']['schemas']['Insert'], 'itemid'>>({
    menuid: '', menuname: '', menucmd: '', objectcode: '', menutype: 'P', menuicon: '', udfmaintained: false,
  });

  useEffect(() => { fetchSchema(); }, []);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('schemas').select('*');
      if (error) throw error;
      setSchemas(data || []);
    } catch { toast({ title: 'Error', description: 'Failed to fetch schemas.', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const allMenus = schemas.filter((s) => s.menutype === 'M');
  const allSubmenus = schemas.filter((s) => s.menutype === 'S');
  const selectedMenuObj = allMenus.find((m) => String(m.itemid) === selectedParentMenu) ?? null;
  const selectedSubObj = allSubmenus.find((s) => String(s.itemid) === selectedParentSubmenu) ?? null;
  const submenusForSelectedMenu = selectedMenuObj
    ? allSubmenus.filter((s) => s.menuid?.startsWith(selectedMenuObj.menuid || ''))
    : [];

  const openAdd = (presetType?: string) => {
    setEditingSchema(null);
    setSelectedParentMenu('');
    setSelectedParentSubmenu('');
    setNewSchema({ menuid: '', menuname: '', menucmd: '', objectcode: '', menutype: presetType || 'P', menuicon: '', udfmaintained: false });
    setShowModal(true);
  };

  const handleEdit = (schema: Schema) => {
    setEditingSchema(schema);
    setSelectedParentMenu('');
    setSelectedParentSubmenu('');
    setNewSchema({ menuid: schema.menuid || '', menuname: schema.menuname || '', menucmd: schema.menucmd || '', objectcode: schema.objectcode || '', menutype: schema.menutype || '', menuicon: schema.menuicon || '', udfmaintained: schema.udfmaintained || false });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingSchema) {
        const { data, error } = await supabase.from('schemas').update(newSchema).eq('itemid', editingSchema.itemid).select();
        if (error) throw error;
        setSchemas(schemas.map((s) => s.itemid === editingSchema.itemid ? data[0] : s));
        toast({ title: 'Success', description: 'Schema updated successfully' });
      } else {
        const { data, error } = await supabase.from('schemas').insert([newSchema]).select();
        if (error) throw error;
        setSchemas([...schemas, ...data]);
        toast({ title: 'Success', description: 'Schema added successfully' });
      }
      setShowModal(false); setEditingSchema(null);
      setSelectedParentMenu(''); setSelectedParentSubmenu('');
      setNewSchema({ menuid: '', menuname: '', menucmd: '', objectcode: '', menutype: 'P', menuicon: '', udfmaintained: false });
    } catch { toast({ title: 'Error', description: 'Failed to save schema', variant: 'destructive' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schema?')) return;
    const { error } = await supabase.from('schemas').delete().eq('itemid', id);
    if (error) toast({ title: 'Error', description: 'Failed to delete schema', variant: 'destructive' });
    else { setSchemas(schemas.filter((s) => s.itemid !== id)); toast({ title: 'Deleted', description: 'Schema deleted successfully' }); }
  };

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => { const next = new Set(prev); next.has(type) ? next.delete(type) : next.add(type); return next; });
  };

  const filteredSchemas = schemas.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.menuid?.toLowerCase().includes(q) || s.menuname?.toLowerCase().includes(q) || s.menucmd?.toLowerCase().includes(q) || s.objectcode?.toLowerCase().includes(q) || s.menutype?.toLowerCase().includes(q) || s.menuicon?.toLowerCase().includes(q);
  });

  const TYPE_ORDER = ['M', 'S', 'P'];
  const TYPE_RANK: Record<string, number> = { M: 0, S: 1, P: 2 };
  const sortedFilteredSchemas = [...filteredSchemas].sort((a, b) => {
    const byMenuId = (a.menuid || '').localeCompare(b.menuid || '');
    if (byMenuId !== 0) return byMenuId;
    const byType = (TYPE_RANK[a.menutype || ''] ?? 99) - (TYPE_RANK[b.menutype || ''] ?? 99);
    if (byType !== 0) return byType;
    return (a.menuname || '').localeCompare(b.menuname || '');
  });

  const grouped = sortedFilteredSchemas.reduce((acc, s) => { const t = s.menutype || 'Unknown'; if (!acc[t]) acc[t] = []; acc[t].push(s); return acc; }, {} as Record<string, Schema[]>);
  const groupKeys = [...TYPE_ORDER.filter((t) => grouped[t]), ...Object.keys(grouped).filter((t) => !TYPE_ORDER.includes(t))];

  if (loading) {
    return (
      <ListLoadingSkeleton
        isMobile={isMobile}
        title="SCHEMA LIST"
        tableColumns={6}
        mainClassName="p-6"
        showFilters={false}
        showActionButton
      />
    );
  }

  const GroupHeader = ({ type, count, onAdd }: { type: string; count: number; onAdd: () => void }) => {
    const cfg = getTypeConfig(type); const isOpen = expandedGroups.has(type);
    return (
      <div className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b ${cfg.borderClass} group`} style={{ backgroundColor: cfg.headerBg }} onClick={() => toggleGroup(type)}>
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${cfg.badgeClass}`}>{isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</div>
          <TypeBadge type={type} />
          <span className="text-xs text-gray-500 font-medium">{count} item{count !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all opacity-0 group-hover:opacity-100 ${cfg.badgeClass}`}>
          <Plus size={12} /> Add {cfg.label}
        </button>
      </div>
    );
  };

  // ── Icon Picker Modal ──────────────────────────────────────────────────────
  const IconPicker = () => {
    const filtered = ALL_LUCIDE_ICONS.filter((name) =>
      name.toLowerCase().includes(iconSearch.toLowerCase())
    );

    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/70 p-4 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
            <h4 className="text-sm font-semibold text-white">Select Icon</h4>
            <button
              onClick={() => { setShowIconPicker(false); setIconSearch(''); }}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search icons... (e.g. User, Home, Settings)"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {filtered.length} icon{filtered.length !== 1 ? 's' : ''} found
              {filtered.length > 200 && ' — showing first 200, refine your search'}
            </p>
          </div>

          {/* Icon Grid */}
          <div className="overflow-y-auto flex-1 p-3">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
              {filtered.slice(0, 200).map((name) => {
                const IconComp = (LucideIcons as any)[name];
                if (!IconComp) return null;
                const isSelected = newSchema.menuicon === name;
                return (
                  <button
                    key={name}
                    title={name}
                    onClick={() => {
                      setNewSchema((prev) => ({ ...prev, menuicon: name }));
                      setShowIconPicker(false);
                      setIconSearch('');
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center group ${
                      isSelected
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <IconComp size={18} />
                    <span className="text-[9px] leading-tight truncate w-full text-center">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer — selected icon */}
          <div className="px-4 py-2.5 border-t border-gray-700 flex items-center gap-3 flex-shrink-0 bg-gray-900/50">
            {newSchema.menuicon ? (
              <>
                {(() => {
                  const I = (LucideIcons as any)[newSchema.menuicon];
                  return I ? <I size={16} className="text-blue-400 flex-shrink-0" /> : null;
                })()}
                <span className="text-xs text-blue-300 font-mono flex-1">{newSchema.menuicon}</span>
                <button
                  onClick={() => setNewSchema((prev) => ({ ...prev, menuicon: '' }))}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500">No icon selected</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Parent selection inside modal ─────────────────────────────────────────
  const renderParentSelection = () => {
    const type = newSchema.menutype;
    if (type === 'M' || editingSchema) return null;

    if (type === 'S') return (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid size={13} className="text-yellow-400" />
          <span className="text-xs text-yellow-300 font-semibold uppercase tracking-wider">Parent Menu</span>
          <span className="text-xs text-gray-500">— which menu does this submenu belong to?</span>
        </div>
        <SelectField
          label="Select Menu"
          value={selectedParentMenu}
          onChange={(v) => {
            setSelectedParentMenu(v);
            const parent = allMenus.find((m) => String(m.itemid) === v);
            const resolvedId = parent?.menucmd?.trim() || '';
            setNewSchema((prev) => ({ ...prev, menuid: resolvedId }));
          }}
          options={allMenus.map((m) => ({ value: String(m.itemid), label: `${m.menuid} — ${m.menuname}` }))}
          placeholder="— Choose a Menu —"
          accentClass="border-yellow-500/50"
        />
        {!selectedParentMenu && <p className="text-xs text-gray-500 italic">A submenu must belong to a menu.</p>}
        {selectedMenuObj && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500">Will be added under:</span>
            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20"><LayoutGrid size={10} />{selectedMenuObj.menuid} — {selectedMenuObj.menuname}</span>
            <ChevronRight size={10} className="text-gray-600" />
            <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/15 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/20"><FolderOpen size={10} />New Submenu</span>
          </div>
        )}
      </div>
    );

    if (type === 'P') return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileCode size={13} className="text-emerald-400" />
          <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Parent Location</span>
          <span className="text-xs text-gray-500">— where does this program live?</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs text-blue-300 font-bold flex-shrink-0">1</span>
            <span className="text-xs text-gray-400">Select the Menu</span>
          </div>
          <SelectField
            label=""
            value={selectedParentMenu}
            onChange={(v) => {
              setSelectedParentMenu(v);
              setSelectedParentSubmenu('');
              const menu = allMenus.find((m) => String(m.itemid) === v);
              const resolvedId = menu?.menucmd?.trim() || '';
              setNewSchema((prev) => ({ ...prev, menuid: resolvedId }));
            }}
            options={allMenus.map((m) => ({ value: String(m.itemid), label: `${m.menuid} — ${m.menuname}` }))}
            placeholder="— Choose a Menu —"
            accentClass="border-blue-500/50"
          />
        </div>

        {selectedMenuObj && submenusForSelectedMenu.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-xs text-yellow-300 font-bold flex-shrink-0">2</span>
              <span className="text-xs text-gray-400">Select the Submenu</span>
            </div>
            <SelectField
              label=""
              value={selectedParentSubmenu}
              onChange={(v) => {
                setSelectedParentSubmenu(v);
                const sub = submenusForSelectedMenu.find((s) => String(s.itemid) === v);
                const resolvedId = sub?.menucmd?.trim() || '';
                setNewSchema((prev) => ({ ...prev, menuid: resolvedId }));
              }}
              options={submenusForSelectedMenu.map((s) => ({ value: String(s.itemid), label: `${s.menuid} — ${s.menuname}` }))}
              placeholder="— Choose a Submenu —"
              accentClass="border-yellow-500/50"
            />
          </div>
        )}

        {selectedMenuObj && (
          <div className="pt-1 border-t border-emerald-500/10">
            <span className="text-xs text-gray-500 block mb-1.5">Location preview:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20"><LayoutGrid size={10} />{selectedMenuObj.menuid} — {selectedMenuObj.menuname}</span>
              {submenusForSelectedMenu.length > 0 && <ChevronRight size={10} className="text-gray-600" />}
              {submenusForSelectedMenu.length > 0 && (
                selectedSubObj
                  ? <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/15 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/20"><FolderOpen size={10} />{selectedSubObj.menuid} — {selectedSubObj.menuname}</span>
                  : <span className="text-xs text-gray-600 italic">select a submenu…</span>
              )}
              {(submenusForSelectedMenu.length === 0 || selectedSubObj) && (
                <><ChevronRight size={10} className="text-gray-600" /><span className="inline-flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20"><FileCode size={10} />New Program</span></>
              )}
            </div>
          </div>
        )}
        {!selectedMenuObj && <p className="text-xs text-gray-500 italic">A program must belong to a menu (and submenu if available).</p>}
      </div>
    );

    return null;
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">SCHEMA LIST</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-700 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><List size={15} /></button>
                  <button onClick={() => setViewMode('tree')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><GitBranch size={15} /></button>
                </div>
                <button onClick={() => openAdd()} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"><Plus size={16} /> Add</button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full bg-input border-border text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {viewMode === 'table' ? (
              <div className="space-y-3 pb-6">
                {sortedFilteredSchemas.length === 0 ? <div className="text-center py-12 text-muted-foreground">No schemas found</div> : sortedFilteredSchemas.map((schema) => (
                  <Card key={schema.itemid} className="bg-card border-border" onClick={() => handleEdit(schema)}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div><div className="text-primary font-bold text-sm">{schema.menuid}</div><div className="text-xs text-muted-foreground mt-0.5">{schema.menuname}</div></div>
                        <div className="flex items-center gap-2">
                          <TypeBadge type={schema.menutype} />
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(schema); }} className="p-1.5 text-blue-400 rounded"><Edit2 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(schema.itemid); }} className="p-1.5 text-red-400 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground uppercase tracking-wide">Command</span><div className="text-foreground mt-0.5">{schema.menucmd || '-'}</div></div>
                        <div><span className="text-muted-foreground uppercase tracking-wide">Object Code</span><div className="text-foreground mt-0.5">{schema.objectcode || '-'}</div></div>
                        <div><span className="text-muted-foreground uppercase tracking-wide">Icon</span>
                          <div className="text-foreground mt-0.5 flex items-center gap-1">
                            {schema.menuicon && (() => { const I = (LucideIcons as any)[schema.menuicon]; return I ? <I size={12} /> : null; })()}
                            {schema.menuicon || '-'}
                          </div>
                        </div>
                        <div><span className="text-muted-foreground uppercase tracking-wide">UDF</span><div className="text-foreground mt-0.5">{boolText(schema.udfmaintained)}</div></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {groupKeys.map((type) => {
                  const items = grouped[type]; const cfg = getTypeConfig(type); const isOpen = expandedGroups.has(type);
                  return (
                    <div key={type} className={`rounded-lg overflow-hidden border ${cfg.borderClass}`}>
                      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" style={{ backgroundColor: cfg.headerBg }} onClick={() => toggleGroup(type)}>
                        <div className="flex items-center gap-2">{isOpen ? <ChevronDown size={14} className={cfg.textClass} /> : <ChevronRight size={14} className={cfg.textClass} />}<TypeBadge type={type} /><span className="text-xs text-gray-500">{items.length} items</span></div>
                        <button onClick={(e) => { e.stopPropagation(); openAdd(type); }} className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${cfg.badgeClass}`}><Plus size={11} /> Add</button>
                      </div>
                      {isOpen && items.map((schema) => (
                        <div key={schema.itemid} className="px-4 py-3 border-t border-gray-700/50" style={{ backgroundColor: cfg.rowBg }} onClick={() => handleEdit(schema)}>
                          <div className="flex justify-between items-center">
                            <div><div className={`text-sm font-semibold ${cfg.textClass}`}>{schema.menuid}</div><div className="text-xs text-gray-400 mt-0.5">{schema.menuname}</div></div>
                            <div className="flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(schema); }} className="p-1.5 text-gray-400 hover:text-blue-400 rounded"><Edit2 size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(schema.itemid); }} className="p-1.5 text-gray-400 hover:text-red-400 rounded"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-foreground">Schema List</h2>
              <div className="flex items-center gap-2">
                {groupKeys.map((t) => (
                  <span key={t} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeConfig(t).badgeClass}`}>
                    {getTypeConfig(t).icon}{grouped[t]?.length ?? 0} {getTypeConfig(t).label}{(grouped[t]?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64 bg-input border-border transition-all duration-300 hover:w-80 focus:w-80" />
              </div>
              <div className="flex items-center bg-gray-700 rounded-lg p-0.5 gap-0.5">
                <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><List size={15} /> Table</button>
                <button onClick={() => setViewMode('tree')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'tree' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><GitBranch size={15} /> Grouped</button>
              </div>
              <button onClick={() => openAdd()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"><Plus size={18} /> Add</button>
            </div>
          </div>
          <div className="flex-1 mx-4 mb-4 mt-4 overflow-hidden flex flex-col">
            {viewMode === 'table' ? (
              <div className="flex-1 overflow-auto bg-gray-800 rounded-lg shadow custom-scrollbar">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-900 sticky top-0 z-10">
                    <tr>
                      {['MENU ID','MENU NAME','TYPE','MENU COMMAND','OBJECT CODE','ICON','UDF','Actions'].map((h) => (
                        <th key={h} className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sortedFilteredSchemas.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No schemas found</td></tr>
                      : sortedFilteredSchemas.map((schema) => (
                        <tr key={schema.itemid} className="hover:bg-gray-700/50 transition-colors group">
                          <td className="px-6 py-3 text-gray-200 whitespace-nowrap font-mono text-sm">{schema.menuid}</td>
                          <td className="px-6 py-3 text-gray-200 whitespace-nowrap">{schema.menuname}</td>
                          <td className="px-6 py-3 whitespace-nowrap"><TypeBadge type={schema.menutype} /></td>
                          <td className="px-6 py-3 text-gray-400 whitespace-nowrap font-mono text-sm">{schema.menucmd || '-'}</td>
                          <td className="px-6 py-3 text-gray-400 whitespace-nowrap font-mono text-sm">{schema.objectcode || '-'}</td>
                          <td className="px-6 py-3 text-gray-400 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-1.5">
                              {schema.menuicon && (() => { const I = (LucideIcons as any)[schema.menuicon]; return I ? <I size={14} className="text-gray-300" /> : null; })()}
                              <span>{schema.menuicon || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded-full ${schema.udfmaintained ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>{boolText(schema.udfmaintained)}</span></td>
                          <td className="px-6 py-3 w-28">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(schema)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"><Edit2 size={15} /></button>
                              <button onClick={() => handleDelete(schema.itemid)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar pb-4">
                {groupKeys.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-lg">No schemas found</div>
                ) : (() => {
                  const menus = [...(grouped['M'] || [])].sort((a, b) => (a.menuid || '').localeCompare(b.menuid || ''));
                  const submenus = [...(grouped['S'] || [])].sort((a, b) => (a.menuid || '').localeCompare(b.menuid || ''));
                  const programs = [...(grouped['P'] || [])].sort((a, b) => (a.menuid || '').localeCompare(b.menuid || ''));

                  const getSubmenusForMenu = (menuId: string) =>
                    submenus.filter((s) => (s.menuid || '') === menuId);
                  const getProgramsForSubmenu = (subId: string) =>
                    programs.filter((p) => (p.menuid || '') === subId);

                  const matchedSubIds = new Set<number>();
                  const matchedProgIds = new Set<number>();

                  return (
                    <div className="space-y-1 bg-gray-900 rounded-xl border border-gray-700/50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-700/50">
                        <div className="flex items-center gap-3">
                          {['M','S','P'].map((t) => {
                            const cfg = getTypeConfig(t);
                            const count = grouped[t]?.length ?? 0;
                            return (
                              <span key={t} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${cfg.badgeClass}`}>
                                {cfg.icon} {count}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setExpandedGroups(new Set(['M','S','P','menus','subs']))} className="text-xs px-2.5 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 transition-colors">Expand All</button>
                          <button onClick={() => setExpandedGroups(new Set())} className="text-xs px-2.5 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 transition-colors">Collapse All</button>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        {menus.map((menu) => {
                          const menuSubs = getSubmenusForMenu(menu.menuid || '');
                          menuSubs.forEach((s) => matchedSubIds.add(s.itemid));
                          const menuKey = `menu-${menu.itemid}`;
                          const isMenuOpen = expandedGroups.has(menuKey);
                          const totalProgs = menuSubs.reduce((acc, s) => acc + getProgramsForSubmenu(s.menuid || '').length, 0);

                          return (
                            <div key={menu.itemid}>
                              <div
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer group/menu hover:bg-gray-800 transition-colors"
                                onClick={() => toggleGroup(menuKey)}
                              >
                                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                  {(menuSubs.length > 0) && (isMenuOpen
                                    ? <ChevronDown size={13} className="text-blue-400" />
                                    : <ChevronRight size={13} className="text-blue-400" />)}
                                </div>
                                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                  {menu.menuicon && (LucideIcons as any)[menu.menuicon]
                                    ? (() => { const I = (LucideIcons as any)[menu.menuicon!]; return <I size={14} className="text-blue-400" />; })()
                                    : <LayoutGrid size={14} className="text-blue-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-300 font-semibold text-sm font-mono">{menu.menuid}</span>
                                    <span className="text-gray-200 text-sm truncate">{menu.menuname}</span>
                                  </div>
                                  {(menuSubs.length > 0 || totalProgs > 0) && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-500">{menuSubs.length} submenu{menuSubs.length !== 1 ? 's' : ''}</span>
                                      <span className="text-gray-700">·</span>
                                      <span className="text-xs text-gray-500">{totalProgs} program{totalProgs !== 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover/menu:opacity-100 transition-opacity flex-shrink-0">
                                  {menu.menuicon && <span className="text-xs text-gray-500 bg-gray-700/60 px-1.5 py-0.5 rounded">{menu.menuicon}</span>}
                                  <button onClick={(e) => { e.stopPropagation(); handleEdit(menu); }} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"><Edit2 size={13} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(menu.itemid); }} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={13} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); openAdd('S'); }} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 transition-colors"><Plus size={11} /> Sub</button>
                                </div>
                              </div>

                              {isMenuOpen && (
                                <div className="ml-5 pl-4 border-l-2 border-gray-700/60 space-y-1 my-1">
                                  {menuSubs.map((sub) => {
                                    const subProgs = getProgramsForSubmenu(sub.menuid || '');
                                    subProgs.forEach((p) => matchedProgIds.add(p.itemid));
                                    const subKey = `sub-${sub.itemid}`;
                                    const isSubOpen = expandedGroups.has(subKey);

                                    return (
                                      <div key={sub.itemid}>
                                        <div
                                          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group/sub hover:bg-gray-800/80 transition-colors"
                                          onClick={() => toggleGroup(subKey)}
                                        >
                                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                            {subProgs.length > 0 && (isSubOpen
                                              ? <ChevronDown size={12} className="text-yellow-400" />
                                              : <ChevronRight size={12} className="text-yellow-400" />)}
                                          </div>
                                          <div className="w-6 h-6 rounded-md bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
                                            {sub.menuicon && (LucideIcons as any)[sub.menuicon]
                                              ? (() => { const I = (LucideIcons as any)[sub.menuicon!]; return <I size={12} className="text-yellow-400" />; })()
                                              : <FolderOpen size={12} className="text-yellow-400" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-yellow-300 font-semibold text-xs font-mono">{sub.menuid}</span>
                                              <span className="text-gray-300 text-sm truncate">{sub.menuname}</span>
                                            </div>
                                            {subProgs.length > 0 && <span className="text-xs text-gray-500">{subProgs.length} program{subProgs.length !== 1 ? 's' : ''}</span>}
                                          </div>
                                          <div className="flex items-center gap-1.5 opacity-0 group-hover/sub:opacity-100 transition-opacity flex-shrink-0">
                                            {sub.menuicon && <span className="text-xs text-gray-500 bg-gray-700/60 px-1.5 py-0.5 rounded">{sub.menuicon}</span>}
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(sub); }} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"><Edit2 size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.itemid); }} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); openAdd('P'); }} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors"><Plus size={11} /> Prog</button>
                                          </div>
                                        </div>

                                        {isSubOpen && subProgs.length > 0 && (
                                          <div className="ml-5 pl-4 border-l-2 border-gray-700/40 space-y-0.5 my-1">
                                            {subProgs.map((prog) => (
                                              <div
                                                key={prog.itemid}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg group/prog hover:bg-gray-800/60 transition-colors"
                                              >
                                                <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                  {prog.menuicon && (LucideIcons as any)[prog.menuicon]
                                                    ? (() => { const I = (LucideIcons as any)[prog.menuicon!]; return <I size={11} className="text-emerald-400" />; })()
                                                    : <FileCode size={11} className="text-emerald-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                                  <span className="text-emerald-300 text-xs font-mono font-semibold flex-shrink-0">{prog.menuid}</span>
                                                  <span className="text-gray-300 text-sm truncate">{prog.menuname}</span>
                                                  {prog.menucmd && <span className="text-xs text-gray-600 font-mono hidden xl:block truncate max-w-32">{prog.menucmd}</span>}
                                                  {prog.objectcode && <span className="text-xs bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded font-mono hidden 2xl:block">{prog.objectcode}</span>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/prog:opacity-100 transition-opacity flex-shrink-0">
                                                  {prog.udfmaintained && <span className="text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">UDF</span>}
                                                  {prog.menuicon && <span className="text-xs text-gray-500 bg-gray-700/60 px-1.5 py-0.5 rounded">{prog.menuicon}</span>}
                                                  <button onClick={() => handleEdit(prog)} className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"><Edit2 size={12} /></button>
                                                  <button onClick={() => handleDelete(prog.itemid)} className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={12} /></button>
                                                </div>
                                              </div>
                                            ))}
                                            <button onClick={() => openAdd('P')} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-emerald-400/40 hover:text-emerald-400/70 hover:bg-emerald-500/5 transition-colors">
                                              <Plus size={11} /> Add Program here
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <button onClick={() => openAdd('S')} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-yellow-400/40 hover:text-yellow-400/70 hover:bg-yellow-500/5 transition-colors">
                                    <Plus size={11} /> Add Submenu here
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <button onClick={() => openAdd('M')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-400/40 hover:text-blue-400/70 hover:bg-blue-500/5 transition-colors mt-1">
                          <Plus size={12} /> Add Menu
                        </button>

                        {submenus.filter((s) => !matchedSubIds.has(s.itemid)).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/40">
                            <div className="text-xs text-gray-500 px-3 mb-2 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              Unlinked Submenus
                            </div>
                            {submenus.filter((s) => !matchedSubIds.has(s.itemid)).map((sub) => (
                              <div key={sub.itemid} className="flex items-center gap-2 px-3 py-2 rounded-lg group/sub hover:bg-gray-800/80 transition-colors">
                                <div className="w-6 h-6 rounded-md bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center flex-shrink-0"><FolderOpen size={12} className="text-yellow-400" /></div>
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-yellow-300 text-xs font-mono font-semibold">{sub.menuid}</span>
                                  <span className="text-gray-300 text-sm">{sub.menuname}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(sub)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md"><Edit2 size={12} /></button>
                                  <button onClick={() => handleDelete(sub.itemid)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {programs.filter((p) => !matchedProgIds.has(p.itemid)).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/40">
                            <div className="text-xs text-gray-500 px-3 mb-2 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              Unlinked Programs
                            </div>
                            {programs.filter((p) => !matchedProgIds.has(p.itemid)).map((prog) => (
                              <div key={prog.itemid} className="flex items-center gap-2 px-3 py-1.5 rounded-lg group/prog hover:bg-gray-800/60 transition-colors">
                                <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0"><FileCode size={11} className="text-emerald-400" /></div>
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-emerald-300 text-xs font-mono font-semibold">{prog.menuid}</span>
                                  <span className="text-gray-300 text-sm">{prog.menuname}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover/prog:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(prog)} className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md"><Edit2 size={12} /></button>
                                  <button onClick={() => handleDelete(prog.itemid)} className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════ MODAL ═══════════════════ */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg text-white border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{editingSchema ? 'Edit Schema' : 'Add Schema'}</h3>
                {newSchema.menutype && <TypeBadge type={newSchema.menutype} />}
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700 transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Type selector — only when adding */}
              {!editingSchema && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Menu Type</label>
                  <div className="flex gap-2">
                    {['M', 'S', 'P'].map((t) => {
                      const cfg = getTypeConfig(t); const isSelected = newSchema.menutype === t;
                      return (
                        <button key={t} onClick={() => {
                          setNewSchema({ ...newSchema, menutype: t, menuid: '' });
                          setSelectedParentMenu('');
                          setSelectedParentSubmenu('');
                        }}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${isSelected ? `${cfg.badgeClass} ring-2 ring-offset-1 ring-offset-gray-800` : 'border-gray-600 text-gray-400 hover:border-gray-500 bg-gray-700/40'}`}>
                          {cfg.icon}{cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic parent selection */}
              {renderParentSelection()}

              <div className="h-px bg-gray-700" />

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'menuid', label: 'Menu ID', full: false },
                  { key: 'menuname', label: 'Menu Name', full: false },
                  { key: 'menucmd', label: 'Menu Command', full: true },
                  { key: 'objectcode', label: 'Object Code', full: false },
                ].map(({ key, label, full }) => (
                  <div key={key} className={full ? 'col-span-2' : ''}>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
                    <input type="text"
                      className="w-full px-3 py-2 rounded-lg bg-gray-700/60 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={newSchema[key] as string}
                      onChange={(e) => setNewSchema({ ...newSchema, [key]: e.target.value })}
                      placeholder={label}
                    />
                  </div>
                ))}

                {/* Icon Picker Field */}
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Menu Icon</label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/60 border border-gray-600 text-sm text-left flex items-center gap-2 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    {newSchema.menuicon ? (
                      <>
                        {(() => { const I = (LucideIcons as any)[newSchema.menuicon]; return I ? <I size={15} className="text-blue-400 flex-shrink-0" /> : null; })()}
                        <span className="text-white truncate">{newSchema.menuicon}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setNewSchema((prev) => ({ ...prev, menuicon: '' })); }}
                          className="ml-auto text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500">— Pick an icon —</span>
                    )}
                  </button>
                </div>
              </div>

              {/* UDF toggle */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-700/40 border border-gray-600">
                <label className="text-sm text-gray-300">UDF Maintained</label>
                <button onClick={() => setNewSchema({ ...newSchema, udfmaintained: !newSchema.udfmaintained })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${newSchema.udfmaintained ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${newSchema.udfmaintained ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors">{editingSchema ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ ICON PICKER ═══════════════════ */}
      {showIconPicker && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
              <h4 className="text-sm font-semibold text-white">Select Icon</h4>
              <button
                onClick={() => { setShowIconPicker(false); setIconSearch(''); }}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search icons... (e.g. User, Home, Settings, Arrow)"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {(() => {
                  const count = ALL_LUCIDE_ICONS.filter(n => n.toLowerCase().includes(iconSearch.toLowerCase())).length;
                  return `${count} icon${count !== 1 ? 's' : ''} found${count > 200 ? ' — showing first 200, refine your search' : ''}`;
                })()}
              </p>
            </div>

            {/* Icon Grid */}
            <div className="overflow-y-auto flex-1 p-3 custom-scrollbar">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1 ">
                {ALL_LUCIDE_ICONS
                  .filter((name) => name.toLowerCase().includes(iconSearch.toLowerCase()))
                  .slice(0, 200)
                  .map((name) => {
                    const IconComp = (LucideIcons as any)[name];
                    if (!IconComp) return null;
                    const isSelected = newSchema.menuicon === name;
                    return (
                      <button
                        key={name}
                        title={name}
                        onClick={() => {
                          setNewSchema((prev) => ({ ...prev, menuicon: name }));
                          setShowIconPicker(false);
                          setIconSearch('');
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-800'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <IconComp size={18} />
                        <span className="text-[9px] leading-tight truncate w-full text-center">{name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-700 flex items-center gap-3 flex-shrink-0 bg-gray-900/50 rounded-b-xl">
              {newSchema.menuicon ? (
                <>
                  {(() => { const I = (LucideIcons as any)[newSchema.menuicon]; return I ? <I size={16} className="text-blue-400 flex-shrink-0" /> : null; })()}
                  <span className="text-xs text-blue-300 font-mono flex-1">{newSchema.menuicon}</span>
                  <button
                    onClick={() => setNewSchema((prev) => ({ ...prev, menuicon: '' }))}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear selection
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-500">No icon selected</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CompanyRow = Database['public']['Tables']['company']['Row'];

export default function EXECEMAIL() {
  const [schemas, setSchemas] = useState([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [custTypes, setCustTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedExceptions, setSelectedExceptions] = useState<string[]>([]);

  const [newSchema, setNewSchema] = useState<any>({
    userid: '',
    email: '',
    fullname: '',
    exception: '',
    allaccess: false,
    company: '',
  });

  useEffect(() => {
    fetchSchema();
    fetchCompanies();
    fetchCustTypes();
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
      const { data, error } = await supabase.from('execemail').select('*').order('id', { ascending: true });
      if (error) throw error;
      setSchemas(data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch schema. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('company').select('*').order('company_name', { ascending: true });
    if (!error) setCompanies(data || []);
  };

  const fetchCustTypes = async () => {
    const { data, error } = await supabase
      .from('customertypeseries')
      .select('carftype')
      .order('id', { ascending: true });
    if (!error && data) {
      const unique = Array.from(new Set(data.map((r) => r.carftype).filter(Boolean)));
      setCustTypes(unique);
    }
  };

  const handleAddSchema = () => {
    setEditingSchema(null);
    setSelectedExceptions([]);
    setNewSchema({ userid: '', email: '', fullname: '', exception: '', allaccess: false, company: '' });
    setShowModal(true);
  };

  const handleEdit = (schema) => {
    setEditingSchema(schema);
    const exceptions = schema.exception
      ? schema.exception.split(',').map((e) => e.trim()).filter(Boolean)
      : [];
    setSelectedExceptions(exceptions);
    setNewSchema({
      userid: schema.userid || '',
      email: schema.email || '',
      fullname: schema.fullname || '',
      exception: schema.exception || '',
      allaccess: schema.allaccess || false,
      company: schema.company || '',
    });
    setShowModal(true);
  };

  const handleExceptionToggle = (value: string) => {
    setSelectedExceptions((prev) => {
      const updated = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      setNewSchema((s) => ({ ...s, exception: updated.join(',') }));
      return updated;
    });
  };

  const handleSaveSchema = async () => {
    try {
      const payload = { ...newSchema, exception: selectedExceptions.join(',') };
      if (editingSchema) {
        const { data, error } = await supabase.from('execemail').update(payload).eq('id', editingSchema.id).select();
        if (error) throw error;
        setSchemas(schemas.map((s) => (s.id === editingSchema.id ? data[0] : s)));
        toast({ title: 'Success', description: 'Schema updated successfully' });
      } else {
        const { data, error } = await supabase.from('execemail').insert([payload]).select();
        if (error) throw error;
        setSchemas([...schemas, ...data]);
        toast({ title: 'Success', description: 'Schema added successfully' });
      }
      setShowModal(false);
      setEditingSchema(null);
      setSelectedExceptions([]);
      setNewSchema({ userid: '', email: '', fullname: '', exception: '', allaccess: false, company: '' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save schema', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this executive email?')) {
      const { error } = await supabase.from('execemail').delete().eq('id', id);
      if (error) {
        toast({ title: 'Error', description: 'Failed to delete schema', variant: 'destructive' });
      } else {
        setSchemas(schemas.filter((s) => s.id !== id));
        toast({ title: 'Deleted', description: 'Schema deleted successfully' });
      }
    }
  };

  const boolText = (v: boolean) => (v ? 'Yes' : 'No');

  const filteredSchemas = schemas.filter((schema) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      schema.userid?.toLowerCase().includes(q) ||
      schema.email?.toLowerCase().includes(q) ||
      schema.fullname?.toLowerCase().includes(q) ||
      schema.exception?.toLowerCase().includes(q);
    const matchesCompany = selectedCompany
      ? schema.company === selectedCompany || schema.company === 'ALL'
      : true;
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

  const CompanyFilterSelect = ({ className = '' }: { className?: string }) => (
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
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">EXECUTIVE EMAILS</h2>
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
                <CompanyFilterSelect className="flex-1" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3 pb-6">
              {filteredSchemas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No executive emails found</div>
              ) : (
                filteredSchemas.map((schema) => (
                  <Card key={schema.id} className="bg-card border-border" onClick={() => handleEdit(schema)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-primary font-semibold text-sm mb-1">{schema.userid}</div>
                          {schema.company && (
                            <div className="text-xs text-muted-foreground">{schema.company}</div>
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
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</div>
                          <div className="text-sm text-foreground mt-0.5">{schema.fullname || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Email</div>
                          <div className="text-sm text-foreground mt-0.5">{schema.email || '-'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Exception</div>
                            <div className="text-sm text-foreground mt-0.5">{schema.exception || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">All Access</div>
                            <div className={`text-sm mt-0.5 ${schema.allaccess ? 'text-green-500' : 'text-gray-500'}`}>
                              {boolText(schema.allaccess)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">Executive Emails</h2>
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
              <CompanyFilterSelect className="w-52" />
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
            <div className="flex-1 overflow-auto bg-gray-800 rounded-lg shadow custom-scrollbar">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">COMPANY</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">USER</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">EMAIL</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">FULL NAME</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">EXCEPTIONS</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">ALL ACCESS</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 w-32 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSchemas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500 italic text-sm">
                        No executive emails found
                      </td>
                    </tr>
                  ) : (
                    filteredSchemas.map((schema) => (
                      <tr key={schema.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap text-sm">{schema.company || '-'}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.userid}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.email}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.fullname}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap max-w-xs truncate" title={schema.exception}>{schema.exception || '-'}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(schema.allaccess)}</td>
                        <td className="px-6 py-4 w-32">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchema ? 'Edit Executive Email' : 'Add Executive Email'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">

              {/* Company dropdown */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Company</label>
                <select
                  className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSchema.company || ''}
                  onChange={(e) => setNewSchema({ ...newSchema, company: e.target.value })}
                >
                  <option value="">-- Select Company --</option>
                  <option value="ALL">ALL (All Companies)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.company}>
                      {c.company_name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              {[
                { key: 'userid', label: 'User ID', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'fullname', label: 'Full Name', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm mb-1">{label}</label>
                  <input
                    type={type}
                    className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSchema[key]}
                    onChange={(e) => setNewSchema({ ...newSchema, [key]: e.target.value })}
                  />
                </div>
              ))}

              {/* Exception multi-select checkboxes */}
              <div className="flex flex-col">
                <label className="text-sm mb-2">Exception (Customer Types)</label>
                <div className="bg-gray-700 rounded p-3 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                  {custTypes.length === 0 ? (
                    <p className="text-xs text-gray-400">No customer types found</p>
                  ) : (
                    custTypes.map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedExceptions.includes(type)}
                          onChange={() => handleExceptionToggle(type)}
                          className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-blue-600"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedExceptions.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Selected: {selectedExceptions.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allaccess"
                  checked={newSchema.allaccess || false}
                  onChange={(e) => setNewSchema({ ...newSchema, allaccess: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="allaccess" className="text-sm cursor-pointer">All Access</label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">
                Cancel
              </button>
              <button onClick={handleSaveSchema} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
                {editingSchema ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
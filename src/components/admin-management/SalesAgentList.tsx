import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import ListLoadingSkeleton from '../list/ListLoadingSkeleton';

type SalesAgentRow = Database['public']['Tables']['sales_agent']['Row'];
type SalesAgentInsert = Omit<Database['public']['Tables']['sales_agent']['Insert'], 'id'>;
type CompanyRow = Database['public']['Tables']['company']['Row'];

export default function SalesAgentList() {
  const [schemas, setSchemas] = useState<SalesAgentRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<SalesAgentRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [newSchema, setNewSchema] = useState<SalesAgentInsert>({
    customername: '',
    email_address: '',
    position: '',
    cellphoneno: '',
    company: '',
  });

  useEffect(() => {
    fetchSchema();
    fetchCompanies();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('sales_agent').select('*').order('id', { ascending: true });
      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sales agents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('company').select('*').order('company_name', { ascending: true });
    if (!error) setCompanies(data || []);
  };

  const handleAddSchema = () => {
    setEditingSchema(null);
    setNewSchema({
      customername: '',
      email_address: '',
      position: '',
      cellphoneno: '',
      company: '',
    });
    setShowModal(true);
  };

  const handleEdit = (schema: SalesAgentRow) => {
    setEditingSchema(schema);
    setNewSchema({
      customername: schema.customername || '',
      email_address: schema.email_address || '',
      position: schema.position || '',
      cellphoneno: schema.cellphoneno || '',
      company: schema.company || '',
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    if (!newSchema.customername?.trim() || !newSchema.email_address?.trim()) {
      toast({
        title: 'Validation',
        description: 'Customer Name and Email Address are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingSchema) {
        const { data, error } = await supabase
          .from('sales_agent')
          .update(newSchema)
          .eq('id', editingSchema.id)
          .select();

        if (error) throw error;

        setSchemas((prev) => prev.map((s) => (s.id === editingSchema.id ? data[0] : s)));

        toast({
          title: 'Success',
          description: 'Sales agent updated successfully',
        });
      } else {
        const { data, error } = await supabase
          .from('sales_agent')
          .insert([newSchema])
          .select();

        if (error) throw error;
        setSchemas((prev) => [...prev, ...data]);
        toast({
          title: 'Success',
          description: 'Sales agent added successfully',
        });
      }

      setShowModal(false);
      setEditingSchema(null);
      setNewSchema({
        customername: '',
        email_address: '',
        position: '',
        cellphoneno: '',
        company: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save sales agent',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this sales agent?')) {
      const { error } = await supabase.from('sales_agent').delete().eq('id', id);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete sales agent',
          variant: 'destructive',
        });
      } else {
        setSchemas((prev) => prev.filter((schema) => schema.id !== id));
        toast({ title: 'Deleted', description: 'Sales agent deleted successfully' });
      }
    }
  };

  const filteredSchemas = schemas.filter((schema) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      schema.customername?.toLowerCase().includes(q) ||
      schema.email_address?.toLowerCase().includes(q) ||
      schema.position?.toLowerCase().includes(q) ||
      schema.cellphoneno?.toLowerCase().includes(q) ||
      schema.company?.toLowerCase().includes(q)
    );
    const matchesCompany = selectedCompany ? schema.company === selectedCompany : true;
    return matchesSearch && matchesCompany;
  });

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
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">v</div>
    </div>
  );

  if (loading) {
    return (
      <ListLoadingSkeleton
        isMobile={isMobile}
        title="SALES AGENTS"
        tableColumns={6}
        mainClassName="p-6"
        showFilters={false}
        showActionButton
      />
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">SALES AGENTS</h2>
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
                <div className="text-center py-12 text-muted-foreground">
                  No sales agents found
                </div>
              ) : (
                filteredSchemas.map((schema) => (
                  <Card key={schema.id} className="bg-card border-border" onClick={() => handleEdit(schema)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="min-w-0">
                          <div className="text-primary font-semibold text-sm mb-1 break-words">
                            {schema.customername}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Customer Name
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(schema)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(schema.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-border my-2"></div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Email Address
                          </div>
                          <div className="text-sm text-foreground mt-0.5 break-all">
                            {schema.email_address || '-'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Position
                            </div>
                            <div className="text-sm text-foreground mt-0.5">
                              {schema.position || '-'}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Cellphone
                            </div>
                            <div className="text-sm text-foreground mt-0.5">
                              {schema.cellphoneno || '-'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Company
                          </div>
                          <div className="text-sm text-foreground mt-0.5">
                            {schema.company || '-'}
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
            <h2 className="text-xl font-semibold text-foreground">Sales Agents</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-input border-border transition-all duration-300 hover:w-80 focus:w-80"
                />
              </div>
              <CompanySelect className="w-64" />
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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">CUSTOMER NAME</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">EMAIL ADDRESS</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">POSITION</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">CELLPHONE</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">COMPANY</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 w-32 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSchemas.map((schema) => (
                    <tr key={schema.id} className="hover:bg-gray-700 transition-colors cursor-pointer" onDoubleClick={() => handleEdit(schema)}>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.customername}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.email_address}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.position || '-'}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.cellphoneno || '-'}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.company || '-'}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchema ? 'Edit Sales Agent' : 'Add Sales Agent'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
                {[
                  { key: 'customername', label: 'Customer Name', type: 'text' },
                  { key: 'email_address', label: 'Email Address', type: 'email' },
                  { key: 'position', label: 'Position', type: 'text' },
                  { key: 'cellphoneno', label: 'Cellphone No.', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key} className="flex flex-col">
                    <label className="text-sm mb-1">{label}</label>
                  <input
                    type={type}
                    className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={(newSchema as Record<string, string | null>)[key] || ''}
                    onChange={(e) =>
                      setNewSchema({ ...newSchema, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div className="flex flex-col">
                <label className="text-sm mb-1">Company</label>
                <select
                  className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSchema.company || ''}
                  onChange={(e) => setNewSchema({ ...newSchema, company: e.target.value })}
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.company}>
                      {c.company_name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchema}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
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

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import ListLoadingSkeleton from '../list/ListLoadingSkeleton';

export default function PaymentTerms() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [newSchema, setNewSchema] = useState<
    Omit<Database['public']['Tables']['paymentterms']['Insert'], 'ID'>
  >({
    paymentterm: '',
    paymenttermname: '',
    limittype: '',
    limitgroup: '',
  });

  useEffect(() => {
    fetchSchema();
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
      const { data, error } = await supabase.from('paymentterms').select('*').order('id', { ascending: true });
      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch schema. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchema = () => {
    setEditingSchema(null);
    setNewSchema({
      paymentterm: '',
      paymenttermname: '',
      limittype: '',
      limitgroup: '',
    });
    setShowModal(true);
  };

  const handleEdit = (schema) => {
    setEditingSchema(schema);
    setNewSchema({
      paymentterm: schema.paymentterm || '',
      paymenttermname: schema.paymenttermname || '',
      limittype: schema.limittype || '',
      limitgroup: schema.limitgroup || '',
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    try {
      if (editingSchema) {
        const { data, error } = await supabase
          .from('paymentterms')
          .update(newSchema)
          .eq('id', editingSchema.id)
          .select();

        if (error) throw error;

        setSchemas(
          schemas.map((s) =>
            s.id === editingSchema.id ? data[0] : s
          )
        );

        toast({
          title: 'Success',
          description: 'Schema updated successfully',
        });
      } else {
        const { data, error } = await supabase
          .from('paymentterms')
          .insert([newSchema])
          .select();

        if (error) throw error;
        setSchemas([...schemas, ...data]);
        toast({
          title: 'Success',
          description: 'Schema added successfully',
        });
      }

      setShowModal(false);
      setEditingSchema(null);
      setNewSchema({
        paymentterm: '',
        paymenttermname: '',
        limittype: '',
        limitgroup: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save schema',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this schema?')) {
      const { error } = await supabase.from('paymentterms').delete().eq('id', id);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete schema',
          variant: 'destructive',
        });
      } else {
        setSchemas(schemas.filter((schema) => schema.id !== id));
        toast({ title: 'Deleted', description: 'Schema deleted successfully' });
      }
    }
  };

  const filteredSchemas = schemas.filter((schema) => {
    const q = searchQuery.toLowerCase();
    return (
      schema.paymentterm?.toLowerCase().includes(q) ||
      schema.paymenttermname?.toLowerCase().includes(q) ||
      schema.limittype?.toLowerCase().includes(q) ||
      schema.limitgroup?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <ListLoadingSkeleton
        isMobile={isMobile}
        title="PAYMENT TERMS"
        tableColumns={5}
        mainClassName="p-6"
        showFilters={false}
        showActionButton
      />
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* Mobile Layout */
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">PAYMENT TERMS</h2>
                <button
                  onClick={handleAddSchema}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={18} />
                  Add
                </button>
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
            <div className="space-y-3 pb-6">
              {filteredSchemas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No payment terms found
                </div>
              ) : (
                filteredSchemas.map((schema) => (
                  <Card key={schema.id} className="bg-card border-border" onClick={() => handleEdit(schema)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-primary font-semibold text-sm mb-1">
                            {schema.paymentterm}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Payment Term
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
                            Payment Term Name
                          </div>
                          <div className="text-sm text-foreground mt-0.5">
                            {schema.paymenttermname || '-'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Limit Type
                            </div>
                            <div className="text-sm text-foreground mt-0.5">
                              {schema.limittype || '-'}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Limit Group
                            </div>
                            <div className="text-sm text-foreground mt-0.5">
                              {schema.limitgroup || '-'}
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
        /* Desktop Layout */
        <>
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">Payment Terms</h2>
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
            <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow custom-scrollbar">
              <table className="min-w-full table-auto">
                <thead className="bg-slate-100 dark:bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-800 dark:text-gray-200 whitespace-nowrap">PAYMENT TERM</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-800 dark:text-gray-200 whitespace-nowrap">PAYMENT TERM NAME</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-800 dark:text-gray-200 whitespace-nowrap">LIMIT TYPE</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-800 dark:text-gray-200 whitespace-nowrap">LIMIT GROUP</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-800 dark:text-gray-200 w-32 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {filteredSchemas.map((schema) => (
                    <tr key={schema.id} className="hover:bg-slate-100/80 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{schema.paymentterm}</td>
                      <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{schema.paymenttermname}</td>
                      <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{schema.limittype}</td>
                      <td className="px-6 py-4 text-slate-800 dark:text-gray-200 whitespace-nowrap">{schema.limitgroup}</td>
                      <td className="px-6 py-4 w-32">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(schema)}
                            className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(schema.id)}
                            className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-[95vw] max-w-3xl rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-900 text-slate-900 dark:text-gray-100 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Plus size={16} className="text-slate-900 dark:text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {editingSchema ? 'Edit Payment Term' : 'Add Payment Term'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Configure payment term options</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'paymentterm', label: 'Payment Term', type: 'text' },
                { key: 'paymenttermname', label: 'Payment Term Name', type: 'text' },
                { key: 'limittype', label: 'Limit Type', type: 'text' },
                { key: 'limitgroup', label: 'Limit Group', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm mb-1">{label}</label>
                  <input
                    type={type}
                    className="px-3 py-2 rounded bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSchema[key]}
                    onChange={(e) =>
                      setNewSchema({ ...newSchema, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 rounded-b-xl mt-auto flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchema}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-medium transition-colors"
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





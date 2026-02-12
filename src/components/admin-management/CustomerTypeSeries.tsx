import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export default function CustomerTypeSeries() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [newSchema, setNewSchema] = useState<
    Omit<Database['public']['Tables']['customertypeseries']['Insert'], 'ID'>
  >({
    carftype: '',
    bostype: '',
    defaulttin: '',
    defaultvolumeday: 0,
    defaultvolumemonth: 0,
    defaultcreditlimit:0,
    defaultcreditterms: '',
    defaultsalestype: '',
    defaulttype: '',
    defaultapplyfor: '',
    defaultsoldto: '',
    defaultbillingaddress:'',
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
      const { data, error } = await supabase.from('customertypeseries').select('*').order('id', { ascending: true });
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
      carftype: '',
      bostype: '',
      defaulttin: '',
      defaultvolumeday: 0,
      defaultvolumemonth: 0,
      defaultcreditlimit: 0,
      defaultcreditterms: '',
      defaultsalestype: '',
      defaulttype: '',
      defaultapplyfor: '',
      defaultsoldto: '',
      defaultbillingaddress: '',
    });
    setShowModal(true);
  };

  const handleEdit = (schema) => {
    setEditingSchema(schema);
    setNewSchema({
      carftype: schema.carftype || '',
      bostype: schema.bostype || '',
      defaulttin: schema.defaulttin || '',
      defaultvolumeday: schema.defaultvolumeday || 0,
      defaultvolumemonth: schema.defaultvolumemonth || 0,
      defaultcreditlimit: schema.defaultcreditlimit || 0,
      defaultcreditterms: schema.defaultcreditterms || '',
      defaultsalestype: schema.defaultsalestype || '',
      defaulttype: schema.defaulttype || '',
      defaultapplyfor: schema.defaultapplyfor || '',
      defaultsoldto: schema.defaultsoldto || '',
      defaultbillingaddress: schema.defaultbillingaddress || '',
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    try {
      if (editingSchema) {
        const { data, error } = await supabase
          .from('customertypeseries')
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
          .from('customertypeseries')
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
        carftype: '',
        bostype: '',
        defaulttin: '',
        defaultvolumeday: 0,
        defaultvolumemonth: 0,
        defaultcreditlimit: 0,
        defaultcreditterms: '',
        defaultsalestype: '',
        defaulttype: '',
        defaultapplyfor: '',
        defaultsoldto: '',
        defaultbillingaddress: '',
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
      const { error } = await supabase.from('customertypeseries').delete().eq('id', id);
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
      schema.carftype?.toLowerCase().includes(q) ||
      schema.bostype?.toLowerCase().includes(q) ||
      schema.defaulttin?.toLowerCase().includes(q)
    );
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

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* Mobile Layout */
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">CUSTOMER TYPE SERIES</h2>
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
                  No customer type series found
                </div>
              ) : (
                filteredSchemas.map((schema) => (
                  <Card key={schema.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-primary font-semibold text-sm mb-1">
                            {schema.carftype}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            CARF Type
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

                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">BOS Type</div>
                            <div className="text-foreground mt-0.5">{schema.bostype || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Default TIN</div>
                            <div className="text-foreground mt-0.5">{schema.defaulttin || '-'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Volume/Day</div>
                            <div className="text-foreground mt-0.5">{schema.defaultvolumeday}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Volume/Month</div>
                            <div className="text-foreground mt-0.5">{schema.defaultvolumemonth}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Credit Limit</div>
                          <div className="text-foreground mt-0.5">{schema.defaultcreditlimit}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Credit Terms</div>
                          <div className="text-foreground mt-0.5">{schema.defaultcreditterms || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Sales Type</div>
                          <div className="text-foreground mt-0.5">{schema.defaultsalestype || '-'}</div>
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
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">CUSTOMER TYPE SERIES LIST</h2>
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
            <div className="flex-1 overflow-auto bg-gray-800 rounded-lg shadow">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">CARF TYPE</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">BOS TYPE</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT TIN</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT VOLUME DAY</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT VOLUME MONTH</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT CREDIT LIMIT</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT CREDIT TERMS</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT SALES TYPE</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT TYPE</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT APPLY FOR</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT SOLD TO</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">DEFAULT BILLING ADDRESS</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 w-32 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSchemas.map((schema) => (
                    <tr key={schema.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.carftype}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.bostype}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaulttin}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultvolumeday}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultvolumemonth}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultcreditlimit}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultcreditterms}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultsalestype}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaulttype}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultapplyfor}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultsoldto}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultbillingaddress}</td>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchema ? 'Edit Schema' : 'Add Schema'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'carftype', label: 'CARF Type', type: 'text' },
                { key: 'bostype', label: 'BOS Type', type: 'text' },
                { key: 'defaulttin', label: 'Default TIN', type: 'text' },
                { key: 'defaultvolumeday', label: 'Default Volume Day', type: 'number' },
                { key: 'defaultvolumemonth', label: 'Default Volume Month', type: 'number' },
                { key: 'defaultcreditlimit', label: 'Default Credit Limit', type: 'number' },
                { key: 'defaultcreditterms', label: 'Default Credit Terms', type: 'text' },
                { key: 'defaultsalestype', label: 'Default Sales Type', type: 'text' },
                { key: 'defaulttype', label: 'Default Type', type: 'text' },
                { key: 'defaultapplyfor', label: 'Default Apply For', type: 'text' },
                { key: 'defaultsoldto', label: 'Default Sold To', type: 'text' },
                { key: 'defaultbillingaddress', label: 'Default Billing Address', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm mb-1">{label}</label>
                  <input
                    type={type}
                    className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSchema[key]}
                    onChange={(e) =>
                      setNewSchema({ 
                        ...newSchema, 
                        [key]: type === 'number' ? Number(e.target.value) : e.target.value 
                      })
                    }
                  />
                </div>
              ))}
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
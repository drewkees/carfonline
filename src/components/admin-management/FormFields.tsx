import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export default function FormFields() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [newSchema, setNewSchema] = useState<
    Omit<Database['public']['Tables']['formfields']['Insert'], 'ID'>
  >({
    fields: '',
    isrequired: false,
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
      const { data, error } = await supabase.from('formfields').select('*').order('id', { ascending: true });
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
      fields: '',
      isrequired: false,
    });
    setShowModal(true);
  };

  const handleEdit = (schema) => {
    setEditingSchema(schema);
    setNewSchema({
      fields: schema.fields || '',
      isrequired: schema.isrequired || false,
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    try {
      if (editingSchema) {
        const { data, error } = await supabase
          .from('formfields')
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
          .from('formfields')
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
        fields: '',
        isrequired: false,
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
    if (confirm('Are you sure you want to delete this form field?')) {
      const { error } = await supabase.from('formfields').delete().eq('id', id);
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

  const boolText = (v: boolean) => (v ? 'Yes' : 'No');

  const filteredSchemas = schemas.filter((schema) => {
    const q = searchQuery.toLowerCase();
    return schema.fields?.toLowerCase().includes(q);
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
                <h2 className="text-lg font-semibold text-foreground">FORM FIELDS</h2>
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
                  No form fields found
                </div>
              ) : (
                filteredSchemas.map((schema) => (
                  <Card key={schema.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-primary font-semibold text-sm mb-1 break-all">
                            {schema.fields}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Field Name
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

                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          Is Required
                        </div>
                        <div className={`text-sm mt-0.5 ${schema.isrequired ? 'text-green-500' : 'text-gray-500'}`}>
                          {boolText(schema.isrequired)}
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
            <h2 className="text-xl font-semibold text-foreground">Form Fields</h2>
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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">FIELDS</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">IS REQUIRED</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 w-32 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSchemas.map((schema) => (
                    <tr key={schema.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.fields}</td>
                      <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(schema.isrequired)}</td>
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
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchema ? 'Edit Form Field' : 'Add Form Field'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Field Name</label>
                <input
                  type="text"
                  className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSchema.fields}
                  onChange={(e) =>
                    setNewSchema({ ...newSchema, fields: e.target.value })
                  }
                />
              </div>

              {/* Is Required Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isrequired"
                  checked={newSchema.isrequired || false}
                  onChange={(e) =>
                    setNewSchema({ ...newSchema, isrequired: e.target.checked })
                  }
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isrequired" className="text-sm cursor-pointer">
                  Is Required
                </label>
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
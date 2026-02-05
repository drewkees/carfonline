import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export default function SchemaList() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);

  const [newSchema, setNewSchema] = useState<
    Omit<Database['public']['Tables']['schemas']['Insert'], 'itemid'>
  >({
    menuid: '',
    menuname: '',
    menucmd: '',
    objectcode: '',
    menutype: 'P',
    menuicon: '',
    udfmaintained:false,
  });

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('schemas').select('*');
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
      menuid: '',
      menuname: '',
      menucmd: '',
      objectcode: '',
      menutype: 'P',
      menuicon: '',
      udfmaintained: false,
    });
    setShowModal(true);
  };

  const handleEdit = (schema) => {
    setEditingSchema(schema);
    setNewSchema({
      menuid: schema.menuid || '',
      menuname: schema.menuname || '',
      menucmd: schema.menucmd || '',
      objectcode: schema.objectcode || '',
      menutype: schema.menutype || '',
      menuicon: schema.menuicon || '',
      udfmaintained:schema.udfmaintained || false,
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    try {
      if (editingSchema) {
        // UPDATE
        const { data, error } = await supabase
          .from('schemas')
          .update(newSchema)
          .eq('itemid', editingSchema.itemid)
          .select();

        if (error) throw error;

        setSchemas(
          schemas.map((s) =>
            s.itemid === editingSchema.itemid ? data[0] : s
          )
        );

        toast({
          title: 'Success',
          description: 'Schema updated successfully',
        });
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('schemas')
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
        menuid: '',
        menuname: '',
        menucmd: '',
        objectcode: '',
        menutype: 'P',
        menuicon: '',
        udfmaintained:false,
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
      const { error } = await supabase.from('schemas').delete().eq('itemid', id);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete schema',
          variant: 'destructive',
        });
      } else {
        setSchemas(schemas.filter((schema) => schema.itemid !== id));
        toast({ title: 'Deleted', description: 'Schema deleted successfully' });
      }
    }
  };
  const boolText = (v: boolean) => (v ? 'Yes' : 'No')
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
        <h2 className="text-xl font-semibold text-foreground">CUSTOMER LIST</h2>
        <button
          onClick={handleAddSchema}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Schema
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 mx-4 mb-4 mt-4 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg shadow">
          <table className="w-full table-auto">
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 w-32">Menu ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Menu Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Menu Command</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Object Code</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Menu Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Menu Icon</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">UDF Maintained</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {schemas.map((schema) => (
                <tr key={schema.itemid} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 w-32 text-gray-300">{schema.menuid}</td>
                  <td className="px-6 py-4 text-gray-200">{schema.menuname}</td>
                  <td className="px-6 py-4 text-gray-200">{schema.menucmd}</td>
                  <td className="px-6 py-4 text-gray-200">{schema.objectcode}</td>
                  <td className="px-6 py-4 text-gray-200">{schema.menutype}</td>
                  <td className="px-6 py-4 text-gray-200">{schema.menuicon}</td>
                  <td className="px-6 py-4 text-gray-200">{boolText(schema.udfmaintained)}</td>
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
                        onClick={() => handleDelete(schema.itemid)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchema ? 'Edit Schema' : 'Add Schema'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {['menuid','menuname','menucmd','objectcode','menutype','menuicon','udfmaintained'].map((field) => (
                <div key={field} className="flex flex-col">
                  <label className="text-sm mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSchema[field]}
                    onChange={(e) =>
                      setNewSchema({ ...newSchema, [field]: e.target.value })
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

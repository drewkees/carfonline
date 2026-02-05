import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export default function CustomerTypeSeries() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);

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
        defaultcreditlimit:0,
        defaultcreditterms: '',
        defaultsalestype: '',
        defaulttype: '',
        defaultapplyfor: '',
        defaultsoldto: '',
        defaultbillingaddress:'',
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
      defaultcreditterms:schema.udfmaintained || "",
      defaultsalestype: schema.defaultsalestype || '',
      defaulttype: schema.defaulttype || '',
      defaultapplyfor: schema.defaultapplyfor || '',
      defaultsoldto: schema.defaultsoldto || '',
      defaultbillingaddress:schema.defaultbillingaddress || "",
    });
    setShowModal(true);
  };

  const handleSaveSchema = async () => {
    try {
      if (editingSchema) {
        // UPDATE
        // alert(editingSchema.id);
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
        // INSERT
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
        defaultcreditlimit:0,
        defaultcreditterms: '',
        defaultsalestype: '',
        defaulttype: '',
        defaultapplyfor: '',
        defaultsoldto: '',
        defaultbillingaddress:'',
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
        <h2 className="text-xl font-semibold text-foreground">CUSTOMER TYPE SERIES LIST</h2>
        <button
          onClick={handleAddSchema}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add
        </button>
      </div>

      {/* Table */}
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
              {schemas.map((schema) => (
                <tr key={schema.itemid} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.carftype}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.bostype}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaulttin}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultvolumeday}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultvolumemonth}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultcreditlimit}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultcreditterms}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.defaultsalestype}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{schema.type}</td>
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
              {['carftype','bostype','defaulttin','defaultvolumeday','defaultvolumemonth','defaultcreditlimit','defaultcreditterms','defaultsalestype','defaulttype','defaultapplyfor','defaultsoldto','defaultbillingaddress'].map((field) => (
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

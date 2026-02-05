import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

type FieldType = {
  id: number;
  fieldid: string;
  fieldnames: string;
  datatype: string;
  visible: boolean;
  truncatecolumn: boolean;
};

export default function UdfMaintenance() {
  const [selectedTable, setSelectedTable] = useState('');
  const [fields, setFields] = useState<FieldType[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRow, setNewRow] = useState({
    id: 0,
    fieldid: '',
    fieldnames: '',
    datatype: 'Text',
    visible: true,
    truncatecolumn: false,
    objectcode: '',
  });
  const [tablelist, setTablelist] = useState<
    Pick<Database['public']['Tables']['schemas']['Insert'], 'menuname' | 'objectcode'>[]
  >([]);
  const [customerColumns, setCustomerColumns] = useState<string[]>([]);

  const dataTypes = ['Text', 'Number', 'Date', 'Boolean', 'Decimal'];

  // Fetch table list
  useEffect(() => {
    const fetchTableSchema = async () => {
      try {
        const { data, error } = await supabase
          .from('schemas')
          .select('menuname, objectcode')
          .eq('udfmaintained', true);
        if (error) throw error;
        setTablelist(data || []);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to fetch schema. Please try again.',
          variant: 'destructive',
        });
      }
    };
    fetchTableSchema();
  }, []);

  // Populate customer columns
  useEffect(() => {
    const columns: (keyof Database['public']['Tables']['customerdata']['Row'])[] = [
      'id', 'requestfor', 'boscode', 'soldtoparty', 'tin', 'shiptoparty',
      'storecode', 'busstyle', 'saletype', 'deladdress', 'billaddress',
      'contactperson', 'contactnumber', 'email', 'bucenter', 'region',
      'district', 'datestart', 'terms', 'creditlimit', 'bccode', 'bcname',
      'saocode', 'saoname', 'supcode', 'custtype', 'approvestatus',
      'nextapprover', 'finalapprover', 'maker', 'datecreated',
      'initialapprover', 'initialapprovedate', 'secondapprover',
      'secondapproverdate', 'thirdapprover', 'thirdapproverdate',
      'fourthapprover', 'fourthapproverdate', 'fifthapprover',
      'fifthapproverdate', 'sixthapprover', 'sixthapproverdate',
      'checkcaprow1', 'checkcaprow2', 'checkcaprow3', 'checkcaprow4',
      'checkcaprow5', 'checkcaprow6', 'targetvolumeday', 'targetvolumemonth',
      'salessupervisor', 'typecustomer', 'firstname', 'middlename', 'lastname',
      'fullname', 'type', 'position', 'supname', 'docowner', 'boscusttype',
      'firstapprovername', 'secondapprovername', 'thirdapprovername',
      'finalapprovername', 'gencode', 'remarks', 'ismother', 'company',
      'pdfexported', 'salesinfosalesorg', 'salesinfodistributionchannel',
      'salesinfodivision', 'salesinfobucenter', 'idtype',
    ];
    setCustomerColumns(columns as string[]);
  }, []);

  // Fetch fields for selected table
  useEffect(() => {
    if (!selectedTable) {
      setFields([]);
      return;
    }

    const fetchFields = async () => {
      try {
        const { data, error } = await supabase
          .from('udfmaintainance')
          .select('fieldid, fieldnames,datatype, visible,truncatecolumn')
          .eq('objectcode', selectedTable);
        if (error) throw error;

        const mappedFields = (data || []).map((f, index) => ({
          id: index + 1,
          fieldid: f.fieldid,
          fieldnames: f.fieldnames,
          datatype: f.datatype,
          visible: f.visible,
          truncatecolumn: f.truncatecolumn,
        }));

        setFields(mappedFields);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to fetch fields for the selected table.',
          variant: 'destructive',
        });
      }
    };

    fetchFields();
  }, [selectedTable]);

  const handleAddField = () => {
    if (!newRow.fieldid.trim()) return;
    setFields([...fields, { ...newRow, id: Date.now() }]);
    setNewRow({ fieldid: '', fieldnames: '', datatype: 'Text', visible: true, id: 0, objectcode: '' , truncatecolumn:false});
  };

  const handleDeleteField = (id: number) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const updatedFields = Array.from(fields);
    const [removed] = updatedFields.splice(result.source.index, 1);
    updatedFields.splice(result.destination.index, 0, removed);
    setFields(updatedFields);
  };

  const handleSave = async () => {
    try {
      if (!selectedTable) return;

      const insertData = fields.map(f => ({
        objectcode: selectedTable,
        fieldid: f.fieldid,
        fieldnames: f.fieldnames,
        datatype: f.datatype,
        visible: f.visible,
        truncatecolumn: f.truncatecolumn,
      }));

      const { error: deleteError } = await supabase
        .from('udfmaintainance')
        .delete()
        .eq('objectcode', selectedTable);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('udfmaintainance')
        .insert(insertData as Database['public']['Tables']['udfmaintainance']['Insert'][]);
      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'UDF fields saved successfully!',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to save UDF fields.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
        <h2 className="text-xl font-semibold text-foreground">UDF MAINTENANCE</h2>
      </div>

      {/* Table Selection */}
      <div className="bg-gray-900 rounded-lg shadow-sm p-6 mb-6 flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Select Table</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-4 py-2 border bg-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-auto min-w-[600px]"
          >
            <option value="">-- Choose a table --</option>
            {tablelist.map((table) => (
              <option key={table.objectcode} value={table.objectcode}>
                {table.menuname}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={!selectedTable}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-200
                    ${selectedTable
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          <Save size={22} />
          Save
        </button>
      </div>

      {/* Fields Table */}
      {selectedTable ? (
        <div className="no-scrollbar bg-gray-900 rounded-lg shadow-sm relative overflow-y-auto max-h-[500px]">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-200">
                {['Field ID', 'Field Name', 'Data Type', 'Visible', 'Truncate','Actions'].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-[#f5f5f5] uppercase tracking-wider sticky top-0 z-10 bg-gray-900"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields" component="tbody">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-800 divide-y">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`hover:bg-gray-600 ${snapshot.isDragging ? 'bg-gray-700' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5]">{field.fieldid}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5] ">
                              {editingId === field.id ? (
                                <input
                                  type="text"
                                  value={field.fieldnames}
                                  autoFocus
                                  onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                      f.id === field.id ? { ...f, fieldnames: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                  }}
                                  onBlur={() => setEditingId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingId(null);
                                  }}
                                  className="w-72 px-2 py-1 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                              ) : (
                                <span
                                  onDoubleClick={() => setEditingId(field.id)}
                                  className="cursor-pointer"
                                  title="Double click to edit"
                                >
                                  {field.fieldnames}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5]">
                              {editingId === field.id?.toString() + '-datatype' ? (
                                <select
                                  value={field.datatype}
                                  autoFocus
                                  onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                      f.id === field.id ? { ...f, datatype: e.target.value } : f
                                    );
                                    setFields(updatedFields);
                                  }}
                                  onBlur={() => setEditingId(null)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                  {dataTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  onDoubleClick={() => setEditingId(field.id.toString() + '-datatype')}
                                  className="cursor-pointer"
                                  title="Double click to edit"
                                >
                                  {field.datatype}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5]">{field.visible ? 'Yes' : 'No'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5]">
                              {editingId === `${field.id}-truncate` ? (
                                <input
                                  type="checkbox"
                                  checked={field.truncatecolumn}
                                  autoFocus
                                  onChange={(e) => {
                                    const updatedFields = fields.map(f =>
                                      f.id === field.id ? { ...f, truncatecolumn: e.target.checked } : f
                                    );
                                    setFields(updatedFields);
                                  }}
                                  onBlur={() => setEditingId(null)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              ) : (
                                <span
                                  onDoubleClick={() => setEditingId(`${field.id}-truncate`)}
                                  className="cursor-pointer select-none"
                                  title="Double click to edit"
                                >
                                  {field.truncatecolumn ? 'Yes' : 'No'}
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Inline Add Row (Sticky Bottom) */}
                    <tr className="bg-gray-800 border-t-2 border-blue-200 sticky bottom-0 z-10">
                      <td className="px-6 py-4 whitespace-nowrap pr-2">
                        <select
                          value={newRow.fieldid}
                          onChange={(e) => setNewRow({ ...newRow, fieldid: e.target.value })}
                          className="text-black w-70 px-2 py-2 border border-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="">-- Select a field --</option>
                          {customerColumns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="pl-4 px-2 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          placeholder="Custom field"
                          value={newRow.fieldnames}
                          onChange={(e) => setNewRow({ ...newRow, fieldnames: e.target.value })}
                          className="w-72 px-2 py-2 border border-gray-800 bg-white text-black rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={newRow.datatype}
                          onChange={(e) => setNewRow({ ...newRow, datatype: e.target.value })}
                          className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          {dataTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={newRow.visible}
                          onChange={(e) => setNewRow({ ...newRow, visible: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={newRow.truncatecolumn}
                          onChange={(e) => setNewRow({ ...newRow, truncatecolumn: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={handleAddField}
                          disabled={!newRow.fieldid.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                )}
              </Droppable>
            </DragDropContext>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Please select a table to manage UDF fields</p>
        </div>
      )}
    </div>
  );
}

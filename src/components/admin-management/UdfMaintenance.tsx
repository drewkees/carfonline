import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Edit2, GripVertical, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    setNewRow({ fieldid: '', fieldnames: '', datatype: 'Text', visible: true, id: 0, objectcode: '', truncatecolumn: false });
    setShowAddModal(false);
  };

  const handleDeleteField = (id: number) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
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

  const filteredFields = fields.filter((field) => {
    const q = searchQuery.toLowerCase();
    return (
      field.fieldid?.toLowerCase().includes(q) ||
      field.fieldnames?.toLowerCase().includes(q) ||
      field.datatype?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* Mobile Layout */
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">UDF MAINTENANCE</h2>
                <button
                  onClick={handleSave}
                  disabled={!selectedTable}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    selectedTable
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save size={18} />
                  Save
                </button>
              </div>

              {/* Table Selection */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Select Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-3 py-2 text-sm border bg-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Choose a table --</option>
                  {tablelist.map((table) => (
                    <option key={table.objectcode} value={table.objectcode}>
                      {table.menuname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              {selectedTable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search fields..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-input border-border text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {selectedTable ? (
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3 pb-20">
                {filteredFields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No fields found
                  </div>
                ) : (
                  filteredFields.map((field, index) => (
                    <Card key={field.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <GripVertical size={16} className="text-muted-foreground" />
                              <div className="text-primary font-semibold text-sm">
                                {field.fieldid}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Field ID
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => setEditingId(field.id)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.id)}
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
                              Field Name
                            </div>
                            <div className="text-sm text-foreground mt-0.5">
                              {field.fieldnames || '-'}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                Data Type
                              </div>
                              <div className="text-sm text-foreground mt-0.5">
                                {field.datatype}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                Visible
                              </div>
                              <div className={`text-sm mt-0.5 ${field.visible ? 'text-green-500' : 'text-gray-500'}`}>
                                {field.visible ? 'Yes' : 'No'}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                Truncate
                              </div>
                              <div className={`text-sm mt-0.5 ${field.truncatecolumn ? 'text-green-500' : 'text-gray-500'}`}>
                                {field.truncatecolumn ? 'Yes' : 'No'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Floating Add Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={24} />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12">
              <p className="text-muted-foreground text-center">
                Please select a table to manage UDF fields
              </p>
            </div>
          )}

          {/* Add Field Modal */}
          {showAddModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Add Field</h3>
                  <button onClick={() => setShowAddModal(false)}>
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm mb-1 block">Field ID</label>
                    <select
                      value={newRow.fieldid}
                      onChange={(e) => setNewRow({ ...newRow, fieldid: e.target.value })}
                      className="w-full px-3 py-2 border bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Select a field --</option>
                      {customerColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm mb-1 block">Field Name</label>
                    <input
                      type="text"
                      placeholder="Custom field name"
                      value={newRow.fieldnames}
                      onChange={(e) => setNewRow({ ...newRow, fieldnames: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm mb-1 block">Data Type</label>
                    <select
                      value={newRow.datatype}
                      onChange={(e) => setNewRow({ ...newRow, datatype: e.target.value })}
                      className="w-full px-3 py-2 border bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {dataTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={newRow.visible}
                      onChange={(e) => setNewRow({ ...newRow, visible: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="visible" className="text-sm cursor-pointer">
                      Visible
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="truncate"
                      checked={newRow.truncatecolumn}
                      onChange={(e) => setNewRow({ ...newRow, truncatecolumn: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="truncate" className="text-sm cursor-pointer">
                      Truncate Column
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddField}
                    disabled={!newRow.fieldid.trim()}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    Add Field
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Layout */
        <>
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">UDF MAINTENANCE</h2>
            <div className="flex items-center gap-4">
              {selectedTable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-input border-border transition-all duration-300 hover:w-80 focus:w-80"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="bg-gray-900 rounded-lg shadow-sm p-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Select Table</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="px-4 py-2 border bg-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full xl:w-[620px] max-w-full"
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
                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-200 self-start xl:self-auto
                          ${selectedTable
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              >
                <Save size={22} />
                Save
              </button>
            </div>
          </div>

          {selectedTable ? (
            <div className="flex-1 mx-4 mb-4 overflow-hidden flex flex-col">
              <div className="custom-scrollbar bg-gray-900 rounded-lg shadow-sm relative overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <table className="w-full min-w-[980px] table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-200">
                      {['Field ID', 'Field Name', 'Data Type', 'Visible', 'Truncate', 'Actions'].map((col) => (
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
                    <Droppable droppableId="fields">
                      {(provided) => (
                        <tbody ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-800 divide-y">
                          {filteredFields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`hover:bg-gray-600 ${snapshot.isDragging ? 'bg-gray-700' : ''}`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5]">{field.fieldid}</td>
                                  <td className="px-6 py-4 text-sm text-[#f5f5f5]">
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
                                        className="w-full min-w-[220px] max-w-[360px] px-2 py-1 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                                className="text-black w-full min-w-[220px] px-2 py-2 border border-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                                className="w-full min-w-[220px] max-w-[360px] px-2 py-2 border border-gray-800 bg-white text-black rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12">
              <p className="text-gray-500 text-center">Please select a table to manage UDF fields</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

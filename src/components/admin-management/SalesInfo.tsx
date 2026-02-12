import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TabData {
  id: string;
  label: string;
  items: string[];
}

const SalesInfo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('salesOrg');
  const [inputValue, setInputValue] = useState('');
  const [salesOrgData, setSalesOrgData] = useState<string[]>([]);
  const [distributionChannel, setDistributionChannel] = useState<string[]>([]);
  const [division, setDivision] = useState<string[]>([]);
  const [bucenter, setBucenter] = useState<string[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Inline editing states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');

  // --- MOBILE DETECTION ---
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- FETCH FUNCTIONS ---
  useEffect(() => {
    const fetchSalesOrg = async () => {
      const { data, error } = await supabase
        .from('salesinfosalesorg')
        .select('salesorganization')
        .order('salesorganization', { ascending: true });

      if (error) console.log('Error fetching', error);
      else setSalesOrgData(data.map((row) => row.salesorganization));
    };
    fetchSalesOrg();
  }, []);

  useEffect(() => {
    const fetchDistributionChannel = async () => {
      const { data, error } = await supabase
        .from('salesinfodistributionchannel')
        .select('distributionchannel')
        .order('distributionchannel', { ascending: true });

      if (error) console.log('Error fetching', error);
      else setDistributionChannel(data.map((row) => row.distributionchannel));
    };
    fetchDistributionChannel();
  }, []);

  useEffect(() => {
    const fetchDivision = async () => {
      const { data, error } = await supabase
        .from('salesinfodivision')
        .select('division')
        .order('division', { ascending: true });

      if (error) console.log('Error fetching', error);
      else setDivision(data.map((row) => row.division));
    };
    fetchDivision();
  }, []);

  useEffect(() => {
    const fetchBUCenter = async () => {
      const { data, error } = await supabase
        .from('salesinfobucenter')
        .select('bucenter')
        .order('bucenter', { ascending: true });

      if (error) console.log('Error fetching', error);
      else setBucenter(data.map((row) => row.bucenter));
    };
    fetchBUCenter();
  }, []);

  // --- TABS CONFIG ---
  const tabs: TabData[] = [
    { id: 'salesOrg', label: 'Sales Organization', items: salesOrgData },
    { id: 'distChannel', label: 'Distribution Channel', items: distributionChannel },
    { id: 'division', label: 'Division', items: division },
    { id: 'businessCenter', label: 'Business Center', items: bucenter },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const filteredItems = (activeTabData?.items || []).filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- HANDLE ADD ---
  const handleAdd = () => {
    const newValue = inputValue.trim();
    if (!newValue) return;

    switch (activeTab) {
      case 'salesOrg':
        setSalesOrgData((prev) => [...prev, newValue]);
        break;
      case 'distChannel':
        setDistributionChannel((prev) => [...prev, newValue]);
        break;
      case 'division':
        setDivision((prev) => [...prev, newValue]);
        break;
      case 'businessCenter':
        setBucenter((prev) => [...prev, newValue]);
        break;
    }

    setInputValue('');
    setUnsavedChanges(true);
  };

  // --- HANDLE DELETE ---
  const handleDelete = async (itemToDelete: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    let table = '';
    let column = '';
    let setter: any;
    let data: string[];

    switch (activeTab) {
      case 'salesOrg':
        table = 'salesinfosalesorg';
        column = 'salesorganization';
        setter = setSalesOrgData;
        data = salesOrgData;
        break;
      case 'distChannel':
        table = 'salesinfodistributionchannel';
        column = 'distributionchannel';
        setter = setDistributionChannel;
        data = distributionChannel;
        break;
      case 'division':
        table = 'salesinfodivision';
        column = 'division';
        setter = setDivision;
        data = division;
        break;
      case 'businessCenter':
        table = 'salesinfobucenter';
        column = 'bucenter';
        setter = setBucenter;
        data = bucenter;
        break;
    }

    const { error } = await supabase.from(table).delete().eq(column, itemToDelete);
    if (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Error',
        description: 'Error deleting record.',
        variant: 'destructive',
      });
      return;
    }

    setter(data.filter((item) => item !== itemToDelete));
    setUnsavedChanges(false);
    toast({
      title: 'Success',
      description: 'Record deleted successfully!',
    });
  };

  // --- INLINE EDIT HANDLERS ---
  const handleDoubleClick = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
    setOriginalValue(value);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  const handleEditSave = async (index: number) => {
    if (!editingValue.trim() || editingValue === originalValue) {
      setEditingIndex(null);
      setEditingValue('');
      setOriginalValue('');
      return;
    }

    let table = '';
    let column = '';
    let setter: any;
    let data: string[];

    switch (activeTab) {
      case 'salesOrg':
        table = 'salesinfosalesorg';
        column = 'salesorganization';
        setter = setSalesOrgData;
        data = salesOrgData;
        break;
      case 'distChannel':
        table = 'salesinfodistributionchannel';
        column = 'distributionchannel';
        setter = setDistributionChannel;
        data = distributionChannel;
        break;
      case 'division':
        table = 'salesinfodivision';
        column = 'division';
        setter = setDivision;
        data = division;
        break;
      case 'businessCenter':
        table = 'salesinfobucenter';
        column = 'bucenter';
        setter = setBucenter;
        data = bucenter;
        break;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({ [column]: editingValue })
      .eq(column, originalValue);

    if (updateError) {
      console.error('Error updating record:', updateError);
      toast({
        title: 'Error',
        description: 'Error updating record.',
        variant: 'destructive',
      });
      return;
    }

    const updated = [...data];
    updated[index] = editingValue;
    setter(updated);

    setEditingIndex(null);
    setEditingValue('');
    setOriginalValue('');
    setUnsavedChanges(false);

    toast({
      title: 'Success',
      description: 'Record updated successfully!',
    });
  };

  // --- HANDLE SAVE ---
  const handleSave = async () => {
    try {
      if (!unsavedChanges) {
        toast({
          title: 'Info',
          description: 'No new changes to save.',
        });
        return;
      }

      let table = '';
      let column = '';
      let localData: string[] = [];

      switch (activeTab) {
        case 'salesOrg':
          table = 'salesinfosalesorg';
          column = 'salesorganization';
          localData = salesOrgData;
          break;
        case 'distChannel':
          table = 'salesinfodistributionchannel';
          column = 'distributionchannel';
          localData = distributionChannel;
          break;
        case 'division':
          table = 'salesinfodivision';
          column = 'division';
          localData = division;
          break;
        case 'businessCenter':
          table = 'salesinfobucenter';
          column = 'bucenter';
          localData = bucenter;
          break;
      }

      const { data: existingRows, error: fetchError } = await supabase.from(table).select(column);
      if (fetchError) {
        console.error('Error fetching existing rows:', fetchError);
        toast({
          title: 'Error',
          description: 'Error fetching existing records.',
          variant: 'destructive',
        });
        return;
      }

      const existingValues = existingRows.map((row) => row[column]);
      const newValues = localData.filter((val) => !existingValues.includes(val));

      if (newValues.length > 0) {
        const newRows = newValues.map((value) => ({ [column]: value }));
        const { error: insertError } = await supabase.from(table).insert(newRows);
        if (insertError) throw insertError;
      }
      toast({
        title: 'Success',
        description: 'Changes saved successfully!',
      });
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Error saving data. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* Mobile Layout */
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          {/* Header */}
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex flex-col gap-3 p-4 pb-3">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold text-foreground">SALES INFO</h2>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={18} />
                  Save
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full bg-input border-border text-sm"
                />
              </div>

              {/* Mobile Tabs - Horizontal Scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3 pb-20">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No items found
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <Card key={index} className="bg-card border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={handleEditChange}
                            onBlur={() => handleEditSave(index)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSave(index)}
                            autoFocus
                            className="flex-1 bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => handleDoubleClick(index, item)}
                            className="flex-1 text-foreground text-sm"
                          >
                            {item}
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Fixed Bottom Input */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-border p-4 bg-background">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={`Add ${activeTabData?.label}...`}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-input text-foreground border border-border placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="w-full h-full bg-background flex flex-col px-4 pb-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground tracking-wide">Sales Info</h2>
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
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus size={20} />
                Save
              </button>
            </div>
          </div>

          {/* Tabs and Content */}
          <div className="flex-1 flex flex-col bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden mt-2">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-700 bg-gray-900">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-all border-r border-gray-700 last:border-r-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white rounded-t-md shadow-inner'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Sub-header */}
              <div className="bg-gray-900 text-gray-100 px-4 py-2 text-sm font-semibold border-b border-gray-700">
                {activeTabData?.label}
              </div>

              {/* Items List with Delete + Inline Edit */}
              <div className="no-scrollbar flex-1 bg-gray-800 p-2 overflow-y-auto">
                {filteredItems.map((item, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 text-sm text-gray-200 border-b border-gray-700 flex items-center justify-between hover:bg-gray-700 hover:text-white cursor-pointer last:border-b-0 transition-colors"
                  >
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={handleEditChange}
                        onBlur={() => handleEditSave(index)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(index)}
                        autoFocus
                        className="flex-1 bg-gray-900 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span onDoubleClick={() => handleDoubleClick(index, item)} className="flex-1">
                        {item}
                      </span>
                    )}
                    <Trash2
                      size={16}
                      className="text-red-400 hover:text-red-600 cursor-pointer ml-2"
                      onClick={() => handleDelete(item)}
                    />
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="px-3 py-3 text-sm text-gray-500 text-center italic">No items found</div>
                )}
              </div>

              {/* Input + Add */}
              <div className="border-t border-gray-700 p-3 bg-gray-900 flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder={`Enter ${activeTabData?.label}...`}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-800 text-gray-100 border border-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAdd}
                  className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInfo;
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ListLoadingSkeleton from '../list/ListLoadingSkeleton';

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
  const [loading, setLoading] = useState(true);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [salesOrgRes, distRes, divisionRes, buRes] = await Promise.all([
          supabase.from('salesinfosalesorg').select('salesorganization').order('salesorganization', { ascending: true }),
          supabase.from('salesinfodistributionchannel').select('distributionchannel').order('distributionchannel', { ascending: true }),
          supabase.from('salesinfodivision').select('division').order('division', { ascending: true }),
          supabase.from('salesinfobucenter').select('bucenter').order('bucenter', { ascending: true }),
        ]);

        if (!salesOrgRes.error) setSalesOrgData((salesOrgRes.data || []).map((r) => r.salesorganization));
        if (!distRes.error) setDistributionChannel((distRes.data || []).map((r) => r.distributionchannel));
        if (!divisionRes.error) setDivision((divisionRes.data || []).map((r) => r.division));
        if (!buRes.error) setBucenter((buRes.data || []).map((r) => r.bucenter));
      } catch {
        toast({ title: 'Error', description: 'Failed to load sales info.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

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

  const handleAdd = () => {
    const newValue = inputValue.trim();
    if (!newValue) return;
    switch (activeTab) {
      case 'salesOrg': setSalesOrgData((prev) => [...prev, newValue]); break;
      case 'distChannel': setDistributionChannel((prev) => [...prev, newValue]); break;
      case 'division': setDivision((prev) => [...prev, newValue]); break;
      case 'businessCenter': setBucenter((prev) => [...prev, newValue]); break;
    }
    setInputValue('');
    setUnsavedChanges(true);
  };

  const handleDelete = async (itemToDelete: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    let table = '', column = '', setter: any, data: string[] = [];
    switch (activeTab) {
      case 'salesOrg': table = 'salesinfosalesorg'; column = 'salesorganization'; setter = setSalesOrgData; data = salesOrgData; break;
      case 'distChannel': table = 'salesinfodistributionchannel'; column = 'distributionchannel'; setter = setDistributionChannel; data = distributionChannel; break;
      case 'division': table = 'salesinfodivision'; column = 'division'; setter = setDivision; data = division; break;
      case 'businessCenter': table = 'salesinfobucenter'; column = 'bucenter'; setter = setBucenter; data = bucenter; break;
    }
    const { error } = await supabase.from(table).delete().eq(column, itemToDelete);
    if (error) { toast({ title: 'Error', description: 'Error deleting record.', variant: 'destructive' }); return; }
    setter(data.filter((item: string) => item !== itemToDelete));
    toast({ title: 'Success', description: 'Record deleted successfully!' });
  };

  const handleDoubleClick = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
    setOriginalValue(value);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => setEditingValue(e.target.value);

  const handleEditSave = async (index: number) => {
    if (!editingValue.trim() || editingValue === originalValue) {
      setEditingIndex(null); setEditingValue(''); setOriginalValue(''); return;
    }
    let table = '', column = '', setter: any, data: string[] = [];
    switch (activeTab) {
      case 'salesOrg': table = 'salesinfosalesorg'; column = 'salesorganization'; setter = setSalesOrgData; data = salesOrgData; break;
      case 'distChannel': table = 'salesinfodistributionchannel'; column = 'distributionchannel'; setter = setDistributionChannel; data = distributionChannel; break;
      case 'division': table = 'salesinfodivision'; column = 'division'; setter = setDivision; data = division; break;
      case 'businessCenter': table = 'salesinfobucenter'; column = 'bucenter'; setter = setBucenter; data = bucenter; break;
    }
    const { error } = await supabase.from(table).update({ [column]: editingValue }).eq(column, originalValue);
    if (error) { toast({ title: 'Error', description: 'Error updating record.', variant: 'destructive' }); return; }
    const updated = [...data]; updated[index] = editingValue; setter(updated);
    setEditingIndex(null); setEditingValue(''); setOriginalValue('');
    toast({ title: 'Success', description: 'Record updated successfully!' });
  };

  const handleSave = async () => {
    if (!unsavedChanges) { toast({ title: 'Info', description: 'No new changes to save.' }); return; }
    try {
      let table = '', column = '', localData: string[] = [];
      switch (activeTab) {
        case 'salesOrg': table = 'salesinfosalesorg'; column = 'salesorganization'; localData = salesOrgData; break;
        case 'distChannel': table = 'salesinfodistributionchannel'; column = 'distributionchannel'; localData = distributionChannel; break;
        case 'division': table = 'salesinfodivision'; column = 'division'; localData = division; break;
        case 'businessCenter': table = 'salesinfobucenter'; column = 'bucenter'; localData = bucenter; break;
      }
      const { data: existingRows, error: fetchError } = await supabase.from(table).select(column);
      if (fetchError) throw fetchError;
      const existingValues = existingRows.map((row: any) => row[column]);
      const newValues = localData.filter((val) => !existingValues.includes(val));
      if (newValues.length > 0) {
        const { error } = await supabase.from(table).insert(newValues.map((v) => ({ [column]: v })));
        if (error) throw error;
      }
      toast({ title: 'Success', description: 'Changes saved successfully!' });
      setUnsavedChanges(false);
    } catch {
      toast({ title: 'Error', description: 'Error saving data.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <ListLoadingSkeleton
        isMobile={isMobile}
        title="SALES INFO"
        tableColumns={5}
        mainClassName="p-6"
        showFilters={false}
        showActionButton
      />
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .si-wrap { font-family: 'DM Sans', sans-serif; }

        .si-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          border-bottom: 1px solid rgb(55 65 81);
          transition: background 0.12s ease;
          cursor: default;
        }
        .si-row:last-child { border-bottom: none; }
        .si-row:hover { background: rgb(55 65 81); }

        .si-trash {
          opacity: 0;
          transition: opacity 0.15s ease;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 5px;
          border-radius: 5px;
          color: rgb(248 113 113);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .si-row:hover .si-trash { opacity: 1; }
        .si-trash:hover { background: rgba(239,68,68,0.12); color: rgb(239 68 68); }

        .si-inline-input {
          flex: 1;
          background: rgb(17 24 39);
          color: white;
          border: 1px solid rgb(59 130 246);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }

        .si-add-input {
          flex: 1;
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 8px;
          background: rgb(31 41 55);
          color: rgb(243 244 246);
          border: 1px solid rgb(75 85 99);
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .si-add-input:focus { border-color: rgb(59 130 246); }
        .si-add-input::placeholder { color: rgb(107 114 128); }

        .si-unsaved-dot {
          width: 6px; height: 6px;
          background: #f59e0b;
          border-radius: 50%;
          display: inline-block;
          animation: si-pulse 1.5s ease-in-out infinite;
        }
        @keyframes si-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .si-scrollbar::-webkit-scrollbar { width: 4px; }
        .si-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .si-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .si-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div className="si-wrap h-full bg-background flex flex-col">
        {isMobile ? (
          /* ─── MOBILE ─── */
          <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
            <div className="flex-shrink-0 bg-background border-b border-border">
              <div className="flex flex-col gap-3 p-4 pb-3">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5" style={{ fontSize: '10px' }}>Configuration</p>
                    <h2 className="text-base font-semibold text-foreground">Sales Info</h2>
                  </div>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {unsavedChanges && <span className="si-unsaved-dot" />}
                    <Save size={14} />
                    Save
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-input border-border text-sm"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                        activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2 pb-24">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm italic">No items found</div>
                ) : (
                  filteredItems.map((item, index) => (
                    <Card key={index} className="bg-card border-border" onDoubleClick={() => handleDoubleClick(index, item)}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          {editingIndex === index ? (
                            <input
                              className="si-inline-input"
                              value={editingValue}
                              onChange={handleEditChange}
                              onBlur={() => handleEditSave(index)}
                              onKeyDown={(e) => e.key === 'Enter' && handleEditSave(index)}
                              autoFocus
                            />
                          ) : (
                            <span className="flex-1 text-foreground text-sm">{item}</span>
                          )}
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors flex-shrink-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-border p-3 bg-background">
              <div className="flex gap-2">
                <input
                  className="si-add-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder={`Add ${activeTabData?.label}...`}
                />
                <button
                  onClick={handleAdd}
                  className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ─── DESKTOP ─── */
          <div className="w-full h-full bg-background flex flex-col px-4 pb-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-gray-700">
              <div>
                <p className="text-gray-500 uppercase tracking-widest mb-0.5" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Configuration</p>
                <h2 className="text-lg font-semibold text-foreground">Sales Info</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-56 bg-input border-border transition-all duration-300 hover:w-72 focus:w-72 text-sm"
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium"
                >
                  {unsavedChanges && <span className="si-unsaved-dot" />}
                  <Save size={15} />
                  Save
                </button>
              </div>
            </div>

            {/* Card */}
            <div className="flex-1 flex flex-col bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden mt-3">
              {/* Tabs */}
              <div className="flex border-b border-gray-700 bg-gray-900">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 text-sm font-medium transition-all border-r border-gray-700 last:border-r-0 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Sub-header */}
                <div className="flex items-center justify-between bg-gray-900 px-4 py-2 border-b border-gray-700">
                  <span className="text-sm font-semibold text-gray-100">{activeTabData?.label}</span>
                  <span className="text-xs text-gray-500">{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</span>
                </div>

                {/* List */}
                <div className="si-scrollbar flex-1 bg-gray-800 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="py-10 text-sm text-gray-500 text-center italic">No items found</div>
                  ) : (
                    filteredItems.map((item, index) => (
                      <div key={index} className="si-row">
                        {editingIndex === index ? (
                          <input
                            className="si-inline-input"
                            value={editingValue}
                            onChange={handleEditChange}
                            onBlur={() => handleEditSave(index)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSave(index)}
                            autoFocus
                          />
                        ) : (
                          <>
                            <span
                              onDoubleClick={() => handleDoubleClick(index, item)}
                              className="flex-1 text-sm text-gray-200 select-none"
                            >
                              {item}
                            </span>
                            <button className="si-trash" onClick={() => handleDelete(item)}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Input footer */}
                <div className="border-t border-gray-700 p-3 bg-gray-900 flex gap-2">
                  <input
                    className="si-add-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder={`Enter ${activeTabData?.label}...`}
                  />
                  <button
                    onClick={handleAdd}
                    className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
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
    </>
  );
};

export default SalesInfo;

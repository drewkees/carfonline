import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface MonthlyThemeRow {
  month: string;
  theme: string;
  isactivate: boolean;
}

const MonthlyThemes: React.FC = () => {
  const [rows, setRows] = useState<MonthlyThemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<MonthlyThemeRow | null>(null);
  const [newRow, setNewRow] = useState<Partial<MonthlyThemeRow>>({
    month: '',
    theme: '',
    isactivate: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // fetch from database
  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('monthlythemes')
        .select('*')
        .order('month', { ascending: true });
      setLoading(false);
      if (!error && data) {
        setRows(data as MonthlyThemeRow[]);
        const active = (data as MonthlyThemeRow[]).find(r => r.isactivate);
        if (active) {
          localStorage.setItem('monthlyTheme', active.month);
          window.dispatchEvent(new Event('monthlyThemeChanged'));
        }
      }
    };

    fetchRows();
  }, []);

  const toggleActive = async (row: MonthlyThemeRow) => {
    // if currently active, simply deactivate and clear
    if (row.isactivate) {
      const { error } = await supabase
        .from('monthlythemes')
        .update({ isactivate: false })
        .eq('month', row.month);
      if (!error) {
        setRows(rows.map(r => r.month === row.month ? { ...r, isactivate: false } : r));
        localStorage.setItem('monthlyTheme', '');
        window.dispatchEvent(new Event('monthlyThemeChanged'));
      }
      return;
    }

    // deactivate any other active row first
    await supabase
      .from('monthlythemes')
      .update({ isactivate: false })
      .neq('month', row.month);
    // activate this one
    const { error } = await supabase
      .from('monthlythemes')
      .update({ isactivate: true })
      .eq('month', row.month);

    if (!error) {
      setRows(rows.map(r => ({ ...r, isactivate: r.month === row.month })));
      localStorage.setItem('monthlyTheme', row.month);
      window.dispatchEvent(new Event('monthlyThemeChanged'));
    }
  };

  const handleAdd = () => {
    setEditingRow(null);
    setNewRow({ month: '', theme: '', isactivate: false });
    setShowModal(true);
  };

  const handleEdit = (row: MonthlyThemeRow) => {
    setEditingRow(row);
    setNewRow({ ...row });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // if marking active, clear others first
      if (newRow.isactivate) {
        await supabase
          .from('monthlythemes')
          .update({ isactivate: false });
      }

      if (editingRow) {
        const payload = {
          month: newRow.month!,
          theme: newRow.theme!,
          isactivate: newRow.isactivate,
        };
        const { data, error } = await supabase
          .from('monthlythemes')
          .update(payload)
          .eq('month', editingRow.month)
          .select();
        if (error) throw error;
        setRows(rows.map(r => (r.month === editingRow.month ? data[0] : r)));
        toast({ title: 'Success', description: 'Entry updated' });
      } else {
        const payload = {
          month: newRow.month!,
          theme: newRow.theme!,
          isactivate: newRow.isactivate,
        };
        const { data, error } = await supabase
          .from('monthlythemes')
          .insert([payload])
          .select();
        if (error) throw error;
        setRows([...rows, ...data]);
        toast({ title: 'Success', description: 'Entry added' });
      }
      setShowModal(false);
      setEditingRow(null);
      setNewRow({ month: '', theme: '', isactivate: false });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save entry', variant: 'destructive' });
    }
  };

  const handleDelete = async (month: string) => {
    if (confirm('Delete this theme entry?')) {
      const { error } = await supabase
        .from('monthlythemes')
        .delete()
        .eq('month', month);
      if (error) {
        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
      } else {
        setRows(rows.filter(r => r.month !== month));
        toast({ title: 'Deleted', description: 'Entry removed' });
      }
    }
  };

  const filtered = rows.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.month.toLowerCase().includes(q) ||
      (r.theme || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
        <h2 className="text-xl font-semibold text-foreground">MONTHLY THEMES</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-input border-border"
            />
          </div>
          <button
            onClick={handleAdd}
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">MONTH</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">THEME</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 whitespace-nowrap">ACTIVE</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-200 w-32 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map((r) => (
                <tr key={r.month} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap capitalize">{r.month}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{r.theme}</td>
                  <td className="px-6 py-4 text-gray-200 whitespace-nowrap">
                    {r.isactivate ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 w-32 whitespace-nowrap flex gap-2">
                    <button
                      onClick={() => handleEdit(r)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(r.month)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(r)}
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded transition-colors"
                    >
                      {r.isactivate ? '●' : '○'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-[95vw] max-w-3xl rounded-xl border border-gray-700 bg-gray-900 text-gray-100 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 rounded-t-xl px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Plus size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editingRow ? 'Edit' : 'Add'} Monthly Theme
                  </h3>
                  <p className="text-xs text-gray-400">Manage month-to-theme mapping</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Month</label>
                <Input
                  value={newRow.month}
                  onChange={(e) => setNewRow({ ...newRow, month: e.target.value })}
                  placeholder="e.g. january"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Theme</label>
                <Input
                  value={newRow.theme}
                  onChange={(e) => setNewRow({ ...newRow, theme: e.target.value })}
                  placeholder="Color theme or description"
                />
              </div>
              <div className="flex items-center md:col-span-2">
                <input
                  type="checkbox"
                  checked={newRow.isactivate}
                  onChange={(e) => setNewRow({ ...newRow, isactivate: e.target.checked })}
                  id="active-checkbox"
                  className="mr-2"
                />
                <label htmlFor="active-checkbox" className="text-sm text-gray-200">Active</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/40 rounded-b-xl mt-auto flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyThemes;


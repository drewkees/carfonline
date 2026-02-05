import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X ,Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newUser, setNewUser] = useState<
  Database['public']['Tables']['users']['Insert']
    >({
    userid: '',
    email: '',
    fullname: '',
    approver: false,
    allaccess: false,
    editaccess: false,
    customlimitaccess: false,
    usergroup: '',
    company: '',
    allcompanyaccess: false,
    });


  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setNewUser({
        userid: '',
        email: '',
        fullname: '',
        approver: false,
        allaccess: false,
        editaccess: false,
        customlimitaccess: false,
        usergroup: '',
        company: '',
        allcompanyaccess: false,
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setNewUser({
      userid: user.userid || '',
      email: user.email || '',
      fullname: user.fullname || '',
      approver: user.approver || false,
      allaccess: user.allaccess || false,
      editaccess: user.editaccess || false,
      customlimitaccess: user.customlimitaccess || false,
      usergroup: user.usergroup || '',
      company: user.company || '',
      allcompanyaccess: user.allcompanyaccess || false,
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // UPDATE
        const { userid, ...updateData } = newUser;
        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('userid', editingUser.userid)
          .select();

        if (error) throw error;

        setUsers(
          users.map((s) =>
            s.itemid === editingUser.userid ? data[0] : s
          )
        );

        toast({
          title: 'Success',
          description: 'Schema updated successfully',
        });
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select();

        if (error) throw error;
        setUsers([...users, ...data]);
        toast({
          title: 'Success',
          description: 'Schema added successfully',
        });
      }

      setShowModal(false);
      setEditingUser(null);
      setNewUser({
        userid: '',
        email: '',
        fullname: '',
        approver: false,
        allaccess: false,
        editaccess: false,
        customlimitaccess: false,
        usergroup: '',
        company: '',
        allcompanyaccess: false,
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
      const { error } = await supabase.from('users').delete().eq('userid', id);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete schema',
          variant: 'destructive',
        });
      } else {
        setUsers(users.filter((user) => user.userid !== id));
        toast({ title: 'Deleted', description: 'Schema deleted successfully' });
      }
    }
  };
  
  const boolText = (v: boolean) => (v ? 'Yes' : 'No')
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
        user.userid?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.fullname?.toLowerCase().includes(q) ||
        user.company?.toLowerCase().includes(q) ||
        user.usergroup?.toLowerCase().includes(q)
    );
    });

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
        <h2 className="text-xl font-semibold text-foreground">USER LIST</h2>
        <div className='flex items-center gap-4'>
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
            onClick={handleAddUser}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
            <Plus size={20} />
            Add Users
            </button>
        </div>
        
      </div>

      {/* Table Container - Scrollable */}
      <div className="flex flex-col bg-gray-800 mx-4 mb-4 mt-4 rounded-lg shadow overflow-hidden flex-1">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 w-32">User ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Full Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Approver</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">AllAccess</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">EditAccess</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">CustomLimit Access</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Company</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">User Group</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">All Company Access</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.userid} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 w-32 text-gray-300">{user.userid}</td>
                  <td className="px-6 py-4 text-gray-200">{user.email}</td>
                  <td className="px-6 py-4 text-gray-200">{user.fullname}</td>
                  <td className="px-6 py-4 text-gray-200">{boolText(user.approver)}</td>
                  <td className="px-6 py-4 text-gray-200">{boolText(user.allaccess)}</td>
                  <td className="px-6 py-4 text-gray-200">{boolText(user.editaccess)}</td>
                  <td className="px-6 py-4 text-gray-200">{boolText(user.customlimitaccess)}</td>
                  <td className="px-6 py-4 text-gray-200">{user.company}</td>
                  <td className="px-6 py-4 text-gray-200">{user.usergroup}</td>
                  <td className="px-6 py-4 text-gray-200">{boolText(user.allcompanyaccess)}</td>
                  <td className="px-6 py-4 w-32">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.userid)}
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
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {['userid','email','fullname','approver','allaccess','editaccess','customlimitaccess','usergroup','company','allcompanyaccess'].map((field) => (
                <div key={field} className="flex flex-col">
                  <label className="text-sm mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUser[field]}
                    onChange={(e) =>
                      setNewUser({ ...newUser, [field]: e.target.value })
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
                onClick={handleSaveUser}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
              >
                {editingUser ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
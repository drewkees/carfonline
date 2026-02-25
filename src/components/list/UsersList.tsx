import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [userGroups, setUserGroups] = useState<{id: number; groupcode: string; groupname: string}[]>([]);
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
    complianceandfinalapprover: false,
  });

  // ✅ Single useEffect for initial data fetching
  useEffect(() => {
    fetchUsers();
    fetchUserGroups();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchUsers = async () => {
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

  const fetchUserGroups = async () => {
    const { data, error } = await supabase
      .from('usergroups')
      .select('id, groupcode, groupname')
      .order('groupname', { ascending: true });
    if (!error && data) setUserGroups(data);
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
      complianceandfinalapprover: false,
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
      complianceandfinalapprover: user.complianceandfinalapprover || false,
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
            s.userid === editingUser.userid ? data[0] : s
          )
        );

        toast({
          title: 'Success',
          description: 'User updated successfully',
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
          description: 'User added successfully',
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
        complianceandfinalapprover: false,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save user',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const { error } = await supabase.from('users').delete().eq('userid', id);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete user',
          variant: 'destructive',
        });
      } else {
        setUsers(users.filter((user) => user.userid !== id));
        toast({ title: 'Deleted', description: 'User deleted successfully' });
      }
    }
  };

  const boolText = (v: boolean) => (v ? 'Yes' : 'No');

  const filteredUsers = users
  .filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.userid?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.fullname?.toLowerCase().includes(q) ||
      user.company?.toLowerCase().includes(q) ||
      user.usergroup?.toLowerCase().includes(q)
    );
  })
  .sort((a, b) => (a.userid || '').localeCompare(b.userid || ''));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
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
                <h2 className="text-lg font-semibold text-foreground">USER LIST</h2>
                <button
                  onClick={handleAddUser}
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
                    placeholder="Search users..."
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
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.userid} className="bg-card border-border" onClick={() => handleEdit(user)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-primary font-semibold text-sm">
                          {user.userid}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.userid)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Full Name
                          </div>
                          <div className="text-sm text-foreground mt-0.5">
                            {user.fullname || '-'}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Email
                          </div>
                          <div className="text-sm text-foreground mt-0.5">
                            {user.email || '-'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              Company
                            </div>
                            <div className="text-sm text-foreground mt-0.5">
                              {user.company || '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              User Group
                            </div>
                            <div className="text-sm text-foreground mt-0.5">
                              {user.usergroup || '-'}
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-border my-2"></div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Approver:</span>
                            <span className={user.approver ? 'text-green-500' : 'text-gray-500'}>
                              {boolText(user.approver)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">All Access:</span>
                            <span className={user.allaccess ? 'text-green-500' : 'text-gray-500'}>
                              {boolText(user.allaccess)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Edit Access:</span>
                            <span className={user.editaccess ? 'text-green-500' : 'text-gray-500'}>
                              {boolText(user.editaccess)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Custom Limit:</span>
                            <span className={user.customlimitaccess ? 'text-green-500' : 'text-gray-500'}>
                              {boolText(user.customlimitaccess)}
                            </span>
                          </div>
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
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">USER LIST</h2>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full table-auto ">
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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Compliance & Final Approver</th>
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
                      <td className="px-6 py-4 text-gray-200">{boolText(user.complianceandfinalapprover)}</td>
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
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {/* Text Fields */}
              {['userid', 'email', 'fullname', 'company'].map((field) => (
                <div key={field} className="flex flex-col">
                  <label className="text-sm mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUser[field]}
                    onChange={(e) =>
                      setNewUser({ ...newUser, [field]: e.target.value })
                    }
                    disabled={field === 'userid' && editingUser}
                  />
                </div>
              ))}

              {/* User Group Dropdown */}
              <div className="flex flex-col">
                <label className="text-sm mb-1">User Group</label>
                <select
                  className="px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.usergroup || ''}
                  onChange={(e) => setNewUser({ ...newUser, usergroup: e.target.value })}
                >
                  <option value="">— Select User Group —</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.groupcode}>
                      {group.groupname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Boolean Fields as Checkboxes */}
              <div className="pt-2 border-t border-gray-700">
                <label className="text-sm font-semibold mb-2 block">Permissions</label>
                {[
                  { key: 'approver', label: 'Approver' },
                  { key: 'allaccess', label: 'All Access' },
                  { key: 'editaccess', label: 'Edit Access' },
                  { key: 'customlimitaccess', label: 'Custom Limit Access' },
                  { key: 'allcompanyaccess', label: 'All Company Access' },
                  { key: 'complianceandfinalapprover', label: 'Compliance & Final Approver' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={newUser[key] || false}
                      onChange={(e) =>
                        setNewUser({ ...newUser, [key]: e.target.checked })
                      }
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={key} className="text-sm cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
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
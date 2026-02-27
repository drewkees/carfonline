import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Building2, User, Mail, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import ListLoadingSkeleton from './ListLoadingSkeleton';

type CompanyRow = Database['public']['Tables']['company']['Row'];

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
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

  useEffect(() => {
    fetchUsers();
    fetchUserGroups();
    fetchCompanies();
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

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('company').select('*').order('company_name', { ascending: true });
    if (!error) setCompanies(data || []);
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
        const { userid, ...updateData } = newUser;
        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('userid', editingUser.userid)
          .select();

        if (error) throw error;

        setUsers(users.map((s) => s.userid === editingUser.userid ? data[0] : s));
        toast({ title: 'Success', description: 'User updated successfully' });
      } else {
        const { data, error } = await supabase.from('users').insert([newUser]).select();
        if (error) throw error;
        setUsers([...users, ...data]);
        toast({ title: 'Success', description: 'User added successfully' });
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
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const { error } = await supabase.from('users').delete().eq('userid', id);
      if (error) {
        toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
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
      const matchesSearch =
        user.userid?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.fullname?.toLowerCase().includes(q) ||
        user.company?.toLowerCase().includes(q) ||
        user.usergroup?.toLowerCase().includes(q);

      const matchesCompany = selectedCompany ? user.company === selectedCompany : true;

      return matchesSearch && matchesCompany;
    })
    .sort((a, b) => (a.userid || '').localeCompare(b.userid || ''));

  if (loading) {
    return (
      <ListLoadingSkeleton
        isMobile={isMobile}
        title="USER LIST"
        tableColumns={10}
        mainClassName="p-6"
        showFilters={false}
        showActionButton
      />
    );
  }

  const CompanySelect = ({ className = '' }: { className?: string }) => (
    <div className={`relative ${className}`}>
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <select
        value={selectedCompany}
        onChange={(e) => setSelectedCompany(e.target.value)}
        className="pl-9 pr-8 py-2 text-sm rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full cursor-pointer"
      >
        <option value="">All Companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.company}>
            {c.company_name} ({c.company})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</div>
    </div>
  );

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
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-input border-border text-sm"
                  />
                </div>
                <CompanySelect className="flex-1" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3 pb-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.userid} className="bg-card border-border" onClick={() => handleEdit(user)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-primary font-semibold text-sm">{user.userid}</div>
                          {user.company && (
                            <div className="text-xs text-muted-foreground">{user.company}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(user); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(user.userid); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</div>
                          <div className="text-sm text-foreground mt-0.5">{user.fullname || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Email</div>
                          <div className="text-sm text-foreground mt-0.5">{user.email || '-'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Company</div>
                            <div className="text-sm text-foreground mt-0.5">{user.company || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">User Group</div>
                            <div className="text-sm text-foreground mt-0.5">{user.usergroup || '-'}</div>
                          </div>
                        </div>
                        <div className="h-px bg-border my-2"></div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Approver:</span>
                            <span className={user.approver ? 'text-green-500' : 'text-gray-500'}>{boolText(user.approver)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">All Access:</span>
                            <span className={user.allaccess ? 'text-green-500' : 'text-gray-500'}>{boolText(user.allaccess)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Edit Access:</span>
                            <span className={user.editaccess ? 'text-green-500' : 'text-gray-500'}>{boolText(user.editaccess)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Custom Limit:</span>
                            <span className={user.customlimitaccess ? 'text-green-500' : 'text-gray-500'}>{boolText(user.customlimitaccess)}</span>
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
          <div className="flex items-center justify-between px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">USER LIST</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-input border-border transition-all duration-300 hover:w-80 focus:w-80"
                />
              </div>
              <CompanySelect className="w-52" />
              <button
                onClick={handleAddUser}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Users
              </button>
            </div>
          </div>

          {/* ✅ FIX: overflow-x-auto added so table scrolls horizontally on zoom */}
          <div className="flex flex-col bg-gray-800 mx-4 mb-4 mt-4 rounded-lg shadow overflow-hidden flex-1">
            <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
              <table className="w-full table-auto">
                <thead className="bg-gray-900 sticky top-0 z-10">
                  <tr>
                    {/* ✅ FIX: whitespace-nowrap on all <th> to prevent text wrapping */}
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">User ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Full Name</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Approver</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">All Access</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Edit Access</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Custom Limit Access</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Company</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">User Group</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">All Company Access</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Compliance & Final Approver</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-10 text-center text-gray-500 italic text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.userid} className="hover:bg-gray-700 transition-colors cursor-pointer" onDoubleClick={() => handleEdit(user)}>
                        {/* ✅ FIX: whitespace-nowrap on all <td> to prevent text wrapping */}
                        <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{user.userid}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{user.fullname}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(user.approver)}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(user.allaccess)}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(user.editaccess)}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(user.customlimitaccess)}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{user.company}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{user.usergroup}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(user.allcompanyaccess)}</td>
                        <td className="px-6 py-4 text-gray-200 whitespace-nowrap">{boolText(user.complianceandfinalapprover)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================
          FORMAL MODAL
      ======================== */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editingUser ? 'Edit User Account' : 'New User Account'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {editingUser ? `Editing: ${editingUser.userid}` : 'Fill in all required fields to create a new user'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Section: Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Basic Information</span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      User ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. jdoe"
                      className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                      value={newUser.userid}
                      onChange={(e) => setNewUser({ ...newUser, userid: e.target.value })}
                      disabled={!!editingUser}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Juan Dela Cruz"
                      className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={newUser.fullname}
                      onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="e.g. jdoe@bounty.com.ph"
                        className="pl-9 pr-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition w-full"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700/60" />

              {/* Section: Assignment */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Assignment</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Company</label>
                    <select
                      className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                      value={newUser.company || ''}
                      onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                    >
                      <option value="">— Select —</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.company}>
                          {c.company_name} ({c.company})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">User Group</label>
                    <select
                      className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                      value={newUser.usergroup || ''}
                      onChange={(e) => setNewUser({ ...newUser, usergroup: e.target.value })}
                    >
                      <option value="">— Select —</option>
                      {userGroups.map((group) => (
                        <option key={group.id} value={group.groupcode}>
                          {group.groupname}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700/60" />

              {/* Section: Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Access & Permissions</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { key: 'approver', label: 'Approver' },
                    { key: 'allaccess', label: 'All Access' },
                    { key: 'editaccess', label: 'Edit Access' },
                    { key: 'customlimitaccess', label: 'Custom Limit Access' },
                    { key: 'allcompanyaccess', label: 'All Company Access' },
                    { key: 'complianceandfinalapprover', label: 'Compliance & Final Approver' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      htmlFor={key}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          id={key}
                          checked={newUser[key] || false}
                          onChange={(e) => setNewUser({ ...newUser, [key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 border border-gray-600 rounded-full peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors leading-tight">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl mt-auto">
              <p className="text-xs text-gray-500"><span className="text-red-400">*</span> Required fields</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-5 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/30"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

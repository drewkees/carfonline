import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Schema {
  itemid: number;
  menuid: string | null;
  menuname: string;
  menucmd: string;
  objectcode: string | null;
  menutype: string;
  menuicon: string | null;
  udfmaintained: boolean | null;
}

interface UserGroup {
  id: string;
  groupcode: string | null;
  groupname: string | null;
}

interface Authorization {
  id?: number;
  groupcode: string;
  menucmd: string;
  accesslevel: string;
  created_at?: string;
  updated_at?: string;
}

export default function GroupAuthorization() {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchAuthorizations();
      if (isMobile) {
        setShowGroupPanel(false);
      }
    }
  }, [selectedGroup]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('usergroups')
        .select('*')
        .order('groupcode', { ascending: true });
      
      if (groupsError) throw groupsError;
      setUserGroups(groupsData || []);

      // Fetch schemas
      const { data: schemasData, error: schemasError } = await supabase
        .from('schemas')
        .select('*')
        .order('itemid', { ascending: true });
      
      if (schemasError) throw schemasError;
      setSchemas(schemasData || []);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorizations = async () => {
    try {
      const { data, error } = await supabase
        .from('groupauthorizations')
        .select('*')
        .eq('groupcode', selectedGroup);
      
      if (error) throw error;
      setAuthorizations(data || []);
    } catch (error) {
      setAuthorizations([]);
    }
  };

  const getAccessLevel = (menucmd: string): 'FULL' | 'NONE' => {
    const auth = authorizations.find(a => a.menucmd === menucmd);
    return auth?.accesslevel || 'NONE';
  };

  const handleAccessChange = async (menucmd: string, accessLevel: 'FULL' | 'NONE') => {
    if (!selectedGroup) {
      toast({
        title: 'Warning',
        description: 'Please select a group first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const schemaItem = schemas.find(s => s.menucmd === menucmd);
      const affectedMenuCmds: string[] = [menucmd];
      
      if (schemaItem && schemaItem.menutype === 'M') {
        const subMenus = schemas.filter(s => s.menutype === 'M' && s.menuid === menucmd);
        affectedMenuCmds.push(...subMenus.map(sm => sm.menucmd));
        
        const programs = schemas.filter(s => s.menutype === 'P' && s.menuid === menucmd);
        affectedMenuCmds.push(...programs.map(p => p.menucmd));
        
        subMenus.forEach(subMenu => {
          const subPrograms = schemas.filter(s => s.menutype === 'P' && s.menuid === subMenu.menucmd);
          affectedMenuCmds.push(...subPrograms.map(p => p.menucmd));
        });
      }

      const updatePromises = affectedMenuCmds.map(async (cmd) => {
        const existingAuth = authorizations.find(a => a.menucmd === cmd);

        if (existingAuth) {
          return await supabase
            .from('groupauthorizations')
            .update({ accesslevel: accessLevel })
            .eq('id', existingAuth.id)
            .select();
        } else {
          return await supabase
            .from('groupauthorizations')
            .insert([{
              groupcode: selectedGroup,
              menucmd: cmd,
              accesslevel: accessLevel
            }])
            .select();
        }
      });

      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error('Failed to update some authorizations');
      }

      await fetchAuthorizations();

      toast({
        title: 'Success',
        description: `Authorization updated for ${affectedMenuCmds.length} item(s)`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update authorization',
        variant: 'destructive',
      });
    }
  };

  const toggleMenu = (menucmd: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menucmd)) {
      newExpanded.delete(menucmd);
    } else {
      newExpanded.add(menucmd);
    }
    setExpandedMenus(newExpanded);
  };

  const getMenuHierarchy = () => {
    const menus = schemas.filter(s => s.menutype === 'M' && (!s.menuid || s.menuid === ''));
    const topLevelPrograms = schemas.filter(s => s.menutype === 'P' && (!s.menuid || s.menuid === ''));
    
    return [
      ...menus.map(menu => ({
        ...menu,
        subMenus: schemas.filter(s => s.menutype === 'M' && s.menuid === menu.menucmd),
        programs: schemas.filter(s => s.menutype === 'P' && s.menuid === menu.menucmd)
      })),
      ...topLevelPrograms.map(program => ({
        ...program,
        subMenus: [],
        programs: []
      }))
    ];
  };

  const renderPrograms = (programs: Schema[], level: number = 0) => {
    return programs.map(program => (
      <div
        key={program.itemid}
        className={`flex items-center justify-between py-2 px-3 ${isMobile ? 'px-2' : 'px-4'} hover:bg-gray-700/50 transition-colors`}
        style={{ paddingLeft: isMobile ? `${(level + 2) * 1}rem` : `${(level + 2) * 1.5}rem` }}
      >
        <span className={`text-gray-200 ${isMobile ? 'text-xs' : 'text-sm'} flex-1 mr-2`}>{program.menuname}</span>
        <select
          value={getAccessLevel(program.menucmd)}
          onChange={(e) => handleAccessChange(program.menucmd, e.target.value as 'FULL' | 'NONE')}
          className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={!selectedGroup}
        >
          <option value="NONE">None</option>
          <option value="FULL">Full</option>
        </select>
      </div>
    ));
  };

  const renderSubMenus = (subMenus: Schema[], parentMenu: string, level: number = 0) => {
    return subMenus.map(subMenu => {
      const isExpanded = expandedMenus.has(subMenu.menucmd);
      const subPrograms = schemas.filter(s => s.menutype === 'P' && s.menuid === subMenu.menucmd);

      return (
        <div key={subMenu.itemid}>
          <div
            className={`flex items-center justify-between py-2 px-3 ${isMobile ? 'px-2' : 'px-4'} hover:bg-gray-700/50 transition-colors cursor-pointer`}
            style={{ paddingLeft: isMobile ? `${(level + 1) * 1}rem` : `${(level + 1) * 1.5}rem` }}
            onClick={() => toggleMenu(subMenu.menucmd)}
          >
            <div className="flex items-center gap-2 flex-1 mr-2">
              {isExpanded ? <ChevronDown size={isMobile ? 14 : 16} /> : <ChevronRight size={isMobile ? 14 : 16} />}
              <span className={`text-gray-200 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{subMenu.menuname}</span>
            </div>
            <select
              value={getAccessLevel(subMenu.menucmd)}
              onChange={(e) => {
                e.stopPropagation();
                handleAccessChange(subMenu.menucmd, e.target.value as 'FULL' | 'NONE');
              }}
              className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={!selectedGroup}
            >
              <option value="NONE">None</option>
              <option value="FULL">Full</option>
            </select>
          </div>
          {isExpanded && subPrograms.length > 0 && renderPrograms(subPrograms, level + 1)}
        </div>
      );
    });
  };

  const hierarchy = getMenuHierarchy();

  const GroupSelectionPanel = () => (
    <div className={`${isMobile ? 'w-full' : 'w-80'} bg-gray-800 rounded-lg p-4 shadow`}>
      <label className="block text-sm font-semibold text-gray-200 mb-2">
        GROUPS
      </label>
      <select
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select a group...</option>
        {userGroups.map((group) => (
          <option key={group.id} value={group.groupcode || ''}>
            {group.groupcode} - {group.groupname}
          </option>
        ))}
      </select>

      {selectedGroup && (
        <div className="mt-4 p-3 bg-gray-700/50 rounded">
          <p className="text-xs text-gray-400 mb-1">Selected Group:</p>
          <p className="text-sm text-gray-200 font-medium">
            {userGroups.find(g => g.groupcode === selectedGroup)?.groupname}
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* Mobile Layout */
        <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
          {/* Mobile Header */}
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold text-foreground">GROUP AUTHORIZATION</h2>
              <button
                onClick={() => setShowGroupPanel(!showGroupPanel)}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {showGroupPanel ? <X size={18} /> : <Menu size={18} />}
                {showGroupPanel ? 'Close' : 'Select Group'}
              </button>
            </div>
            
            {/* Selected Group Badge */}
            {selectedGroup && !showGroupPanel && (
              <div className="px-4 pb-3">
                <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-2">
                  <div className="text-xs text-blue-400 mb-0.5">Current Group</div>
                  <div className="text-sm text-blue-100 font-medium">
                    {userGroups.find(g => g.groupcode === selectedGroup)?.groupname}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-auto">
            {showGroupPanel ? (
              /* Group Selection Panel */
              <div className="p-4">
                <GroupSelectionPanel />
              </div>
            ) : (
              /* Authorizations List */
              <div className="p-4">
                {!selectedGroup ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">Please select a group to manage authorizations</p>
                    <Button
                      onClick={() => setShowGroupPanel(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Select Group
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hierarchy.map(item => {
                      const isExpanded = expandedMenus.has(item.menucmd);
                      const isMenu = item.menutype === 'M';
                      const hasChildren = item.subMenus.length > 0 || item.programs.length > 0;
                      
                      return (
                        <Card key={item.itemid} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-3">
                            {/* Main Menu or Program */}
                            <div
                              className="flex items-center justify-between"
                              style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                              onClick={() => hasChildren && toggleMenu(item.menucmd)}
                            >
                              <div className="flex items-center gap-2 flex-1 mr-2">
                                {hasChildren && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                                <span className={`text-gray-100 font-semibold text-sm ${!hasChildren ? 'ml-6' : ''}`}>
                                  {item.menuname}
                                </span>
                              </div>
                              <select
                                value={getAccessLevel(item.menucmd)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleAccessChange(item.menucmd, e.target.value as 'FULL' | 'NONE');
                                }}
                                className="px-2 py-1 text-xs rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!selectedGroup}
                              >
                                <option value="NONE">None</option>
                                <option value="FULL">Full</option>
                              </select>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && hasChildren && (
                              <div className="mt-2 pt-2 border-t border-gray-700">
                                {item.subMenus.length > 0 && renderSubMenus(item.subMenus, item.menucmd)}
                                {item.programs.length > 0 && renderPrograms(item.programs)}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <>
          {/* Header */}
          <div className="px-4 py-4 bg-background border-b border-gray-700">
            <h2 className="text-xl font-semibold text-foreground">GROUP AUTHORIZATION</h2>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            {/* Left Panel - Group Selection */}
            <GroupSelectionPanel />

            {/* Right Panel - Module and Programs */}
            <div className="flex-1 bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
              <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-200">MODULE / PROGRAM</span>
                  <span className="text-sm font-semibold text-gray-200">ACCESS LEVEL</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                {!selectedGroup ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Please select a group to manage authorizations
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {hierarchy.map(item => {
                      const isExpanded = expandedMenus.has(item.menucmd);
                      const isMenu = item.menutype === 'M';
                      const hasChildren = item.subMenus.length > 0 || item.programs.length > 0;
                      
                      return (
                        <div key={item.itemid}>
                          {/* Main Menu or Top-Level Program */}
                          <div
                            className="flex items-center justify-between py-3 px-4 hover:bg-gray-700/50 transition-colors bg-gray-800/50"
                            style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                            onClick={() => hasChildren && toggleMenu(item.menucmd)}
                          >
                            <div className="flex items-center gap-2">
                              {hasChildren && (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                              <span className="text-gray-100 font-semibold" style={{ marginLeft: hasChildren ? '0' : '26px' }}>
                                {item.menuname}
                              </span>
                            </div>
                            <select
                              value={getAccessLevel(item.menucmd)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleAccessChange(item.menucmd, e.target.value as 'FULL' | 'NONE');
                              }}
                              className="px-3 py-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!selectedGroup}
                            >
                              <option value="NONE">None</option>
                              <option value="FULL">Full Access</option>
                            </select>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && hasChildren && (
                            <div className="bg-gray-800">
                              {item.subMenus.length > 0 && renderSubMenus(item.subMenus, item.menucmd)}
                              {item.programs.length > 0 && renderPrograms(item.programs)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
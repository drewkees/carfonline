import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';

interface CarfSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
  onUserId?: (id: string) => void;
  onAuthorizationStatus?: (hasAuthorization: boolean) => void;
  onMenuClick?: () => void; // ✅ NEW: Callback when menu item is clicked
}

const CarfSidebar: React.FC<CarfSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  userEmail,
  onUserId,
  onAuthorizationStatus,
  onMenuClick // ✅ NEW
}) => {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [navigationItems, setNavigationItems] = useState<any[]>([]);
  const [userGroup, setUserGroup] = useState<string>('');

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch user full name
  useEffect(() => {
    const fetchFullName = async () => {
      if (!userEmail) return;
      const { data, error } = await supabase
        .from('users')
        .select('userid, fullname, avatar_url')
        .eq('email', userEmail)
        .single();

      if (!error && data) {
        setFullName(data.fullname);
        setUserId(data.userid);
        setAvatarUrl((data as any).avatar_url || null);
        if (onUserId) onUserId(data.userid);
      }
    };
    fetchFullName();
  }, [userEmail, onUserId]);

  // Fetch navigation dynamically with authorization filtering
  useEffect(() => {
    const fetchNavigation = async () => {
      if (!userEmail) return;

      try {
        // First, get the user's group
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('usergroup')
          .eq('email', userEmail)
          .single();

        if (userError || !userData?.usergroup) {
          console.error('Failed to fetch user group:', userError);
          if (onAuthorizationStatus) onAuthorizationStatus(false);
          return;
        }

        // Get authorizations for this user's group
        const { data: authData, error: authError } = await supabase
          .from('groupauthorizations')
          .select('menucmd, accesslevel')
          .eq('groupcode', userData.usergroup)
          .eq('accesslevel', 'FULL');

        if (authError) {
          console.error('Failed to fetch authorizations:', authError);
          if (onAuthorizationStatus) onAuthorizationStatus(false);
          return;
        }

        // Create a Set of authorized menu commands for fast lookup
        const authorizedMenuCmds = new Set(authData?.map(auth => auth.menucmd) || []);

        // Check if user has any authorizations
        if (authorizedMenuCmds.size === 0) {
          if (onAuthorizationStatus) onAuthorizationStatus(false);
          setNavigationItems([]);
          return;
        }

        // Fetch all schemas
        const { data: schemasData, error: schemasError } = await supabase
          .from('schemas')
          .select('*')
          .order('itemid');

        if (schemasError || !schemasData) {
          console.error('Failed to fetch schemas:', schemasError);
          if (onAuthorizationStatus) onAuthorizationStatus(false);
          return;
        }

        // Filter schemas to only include authorized items
        const authorizedSchemas = schemasData.filter(item => 
          authorizedMenuCmds.has(item.menucmd)
        );

        const buildTree = (parentCmd: string | null): any[] => {
          return authorizedSchemas
            .filter(item => item.menuid === parentCmd || (!parentCmd && !item.menuid))
            .map(item => {
              const children = buildTree(item.menucmd);
              return {
                id: item.objectcode || item.itemid.toString(),
                label: item.menuname,
                icon: mapIcon(item.menuicon),
                menucmd: item.menucmd,
                ...(children.length ? { children } : {})
              };
            });
        };

        const navItems = buildTree(null);
        setNavigationItems(navItems);
        
        // Notify parent about authorization status
        if (onAuthorizationStatus) {
          onAuthorizationStatus(navItems.length > 0);
        }

        // Set user group for conditional rendering
        setUserGroup(userData.usergroup);
      } catch (error) {
        console.error('Error fetching navigation:', error);
        if (onAuthorizationStatus) onAuthorizationStatus(false);
      }
    };

    fetchNavigation();
  }, [userEmail, onAuthorizationStatus]);

  // Map string menuicon to actual React icon
  const mapIcon = (iconName: string) => {
  const icon = (LucideIcons as any)[iconName];
  return icon || LucideIcons.FileText; // fallback to FileText if not found
};

  // Render navigation recursively
  const handleLeafClick = (ancestors: string[]) => {
    // Keep only selected branch expanded (auto-close other open main menus).
    const nextOpen: { [key: string]: boolean } = {};
    ancestors.forEach((id) => {
      nextOpen[id] = true;
    });
    setOpenMenus(nextOpen);
  };

  const hasActiveDescendant = (item: any): boolean => {
    if (!item?.children?.length) return false;
    return item.children.some((child: any) =>
      activeTab === child.id || hasActiveDescendant(child)
    );
  };

  const renderNavItem = (item: any, depth = 0, ancestors: string[] = []) => {
    const isActive = activeTab === item.id;
    const hasChildren = item.children?.length > 0;
    const isOpen = openMenus[item.id] || false;
    const isBranchActive = hasActiveDescendant(item);
    const isHighlighted = isActive || isBranchActive;
    const activeClass = hasChildren
      ? 'bg-white/10 text-white font-medium'
      : 'bg-accent text-accent-foreground font-medium';

    return (
      <div key={item.id}>
        <Button
          variant="ghost"
          className={`w-full justify-start text-left mb-1 flex items-center text-white ${
            depth > 0 ? 'pl-8 py-1.5 md:py-2 h-auto text-xs md:text-sm' : 'py-2 md:py-3 h-auto text-sm md:text-base'
          } ${isHighlighted ? activeClass : 'hover:bg-accent hover:text-accent-foreground'}`}
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              handleLeafClick(ancestors);
              onTabChange(item.id);
              if (onMenuClick) onMenuClick();
            }
          }}
        >
          <item.icon className={`${depth > 0 ? 'h-3 w-3' : 'h-3.5 w-3.5 md:h-4 md:w-4'} mr-2 md:mr-3 flex-shrink-0`} />
          <span className="truncate">{item.label}</span>
          {hasChildren && (
            <span className="ml-auto flex-shrink-0">
              {isOpen ? <LucideIcons.ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <LucideIcons.ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            </span>
          )}
        </Button>
        {hasChildren && isOpen && (
          <div className="ml-1 md:ml-2">
            {item.children.map((child: any) => renderNavItem(child, depth + 1, [...ancestors, item.id]))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full border-r border-gray-700 flex flex-col"
      style={{ 
        width: '100%',
        maxWidth: '300px',
        backgroundColor: '#343a40',
        maxHeight: '100dvh', // Use dvh for better mobile support
        height: '100dvh'
      }}
    >
      {/* Header with Logo - Responsive sizing */}
      <div className="border-b border-gray-700 flex flex-col items-center py-2 md:py-3 flex-shrink-0">
        <img 
          src="https://bounty.com.ph/wp-content/uploads/2022/07/Site-Logo-Bounty.webp" 
          alt="Bounty Logo" 
          className="h-12 md:h-16 lg:max-h-20 object-contain mb-1"
        />
        <p className="text-xs md:text-sm font-semibold text-white leading-tight px-2 text-center">
          Bounty day {fullName || 'Loading...'}
        </p>
      </div>

      {/* Navigation - Scrollable with proper height constraint */}
      <div 
        className="flex-1 p-2 md:p-4 overflow-y-auto no-scrollbar"
        style={{
          minHeight: 0, // Important for flex-1 with overflow to work properly
        }}
      >
        <nav className="space-y-0.5 md:space-y-1">
          {navigationItems.length > 0 ? (
            <>
              {navigationItems.map(item => renderNavItem(item))}
              {userGroup === 'ADMIN' && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left mb-1 flex items-center text-white py-2 md:py-3 h-auto text-sm md:text-base hover:bg-gray-700 hover:text-[#635e5e]"
                    onClick={() => {
                      onTabChange('monthly-themes');
                      if (onMenuClick) onMenuClick();
                    }}
                  >
                    <LucideIcons.Sun className="h-4 w-4 mr-2" />
                    <span className="truncate">Monthly Themes</span>
                  </Button>
                </div>
              )}
            </>
           ) : (
             <div className="text-gray-400 text-xs md:text-sm text-center py-4">
               No authorized menu items
             </div>
           )}
        </nav>
      </div>


      {/* User Section - Always visible at bottom */}
      <div className="p-2 md:p-4 border-t border-gray-700 text-white flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-600 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-white">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-xs md:text-sm break-all leading-tight">
            {userEmail}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CarfSidebar;





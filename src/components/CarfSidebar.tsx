import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, UserCheck, Clock, CheckCircle, 
  RotateCcw, XCircle, Settings, MapPin,
  FileText, ChevronDown, ChevronRight
} from 'lucide-react';

interface CarfSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
  onUserId?: (id: string) => void; // optional callback
}

const CarfSidebar: React.FC<CarfSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  userEmail, 
  onLogout,
  onUserId 
}) => {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [navigationItems, setNavigationItems] = useState<any[]>([]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch user full name
  useEffect(() => {
    const fetchFullName = async () => {
      if (!userEmail) return;
      const { data, error } = await supabase
        .from('users')
        .select('userid, fullname')
        .eq('email', userEmail)
        .single();

      if (!error && data) {
        setFullName(data.fullname);
        setUserId(data.userid);
        if (onUserId) onUserId(data.userid); // optional upward callback
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
          return;
        }

        // Create a Set of authorized menu commands for fast lookup
        const authorizedMenuCmds = new Set(authData?.map(auth => auth.menucmd) || []);

        // Fetch all schemas
        const { data: schemasData, error: schemasError } = await supabase
          .from('schemas')
          .select('*')
          .order('itemid');

        if (schemasError || !schemasData) {
          console.error('Failed to fetch schemas:', schemasError);
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

        const navItems = buildTree(null); // Start with root items (menuid null or missing)
        setNavigationItems(navItems);
      } catch (error) {
        console.error('Error fetching navigation:', error);
      }
    };

    fetchNavigation();
  }, [userEmail]);


  // Optional: map string menuicon to actual React icon
  const mapIcon = (iconName: string) => {
    switch(iconName) {
      case 'Users': return Users;
      case 'UserCheck': return UserCheck;
      case 'Clock': return Clock;
      case 'CheckCircle': return CheckCircle;
      case 'RotateCcw': return RotateCcw;
      case 'XCircle': return XCircle;
      case 'Settings': return Settings;
      case 'MapPin': return MapPin;
      case 'FileText': return FileText;
      default: return FileText; // fallback
    }
  };

  // Render navigation recursively
  const renderNavItem = (item: any, depth = 0) => {
    const isActive = activeTab === item.id;
    const hasChildren = item.children?.length > 0;
    const isOpen = openMenus[item.id] || false;

    return (
      <div key={item.id}>
        <Button
          variant="ghost"
          className={`w-full justify-start text-left mb-1 flex items-center text-white ${
            depth > 0 ? 'pl-8 py-2 h-auto text-sm' : 'py-3 h-auto'
          } ${isActive ? 'bg-accent font-medium' : 'hover:bg-gray-700 hover:text-[#635e5e]'}`}
          onClick={() => {
            if (hasChildren) toggleMenu(item.id);
            else onTabChange(item.id);
          }}
        >
          <item.icon className={`${depth > 0 ? 'h-3 w-3' : 'h-4 w-4'} mr-3`} />
          {item.label}
          {hasChildren && (
            <span className="ml-auto">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
        </Button>
        {hasChildren && isOpen && (
          <div className="ml-2">
            {item.children.map((child: any) => renderNavItem(child, 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full border-r border-gray-700 flex flex-col"
      style={{ width: '300px', backgroundColor: '#343a40' }}
    >
      {/* Hidden userId */}
      {/* <div id="hidden-userid" data-userid={userId} className="hidden"></div> */}

      {/* Header with Logo */}
      <div className="border-b border-gray-700 flex flex-col items-center py-3">
        <img 
          src="https://bounty.com.ph/wp-content/uploads/2022/07/Site-Logo-Bounty.webp" 
          alt="Bounty Logo" 
          className="max-h-20 object-contain mb-1"
        />
        <p className="text-sm font-semibold text-white leading-tight">
          Bounty day {fullName || 'Loading...'}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
        <nav className="space-y-1">
          {navigationItems.length > 0 ? (
            navigationItems.map(item => renderNavItem(item))
          ) : (
            <div className="text-gray-400 text-sm text-center py-4">
              No authorized menu items
            </div>
          )}
        </nav>
      </div>

      {/* Submit Ticket Button */}
      <div className="p-4 border-t border-gray-700">
        <Button 
          className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold py-3"
          onClick={() => onTabChange('submit-ticket')}
        >
          📋 SUBMIT A TICKET
        </Button>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm truncate max-w-[140px]">{userEmail}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-white hover:text-gray-300"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarfSidebar;
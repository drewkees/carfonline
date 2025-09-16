import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  RotateCcw, 
  XCircle, 
  Settings, 
  Building, 
  MapPin,
  FileText
} from 'lucide-react';

interface CarfSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
}

const CarfSidebar: React.FC<CarfSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  userEmail, 
  onLogout 
}) => {
  const navigationItems = [
    { id: 'for-approval', label: 'For Approval', icon: FileText },
    { 
      id: 'customer',
      label: 'Customer',
      icon: Users,
      children: [
        { id: 'customer-list', label: 'Customer List', icon: Users },
        { id: 'pending', label: 'Pending', icon: Clock },
        { id: 'approved', label: 'Approved', icon: CheckCircle },
        { id: 'return-to-maker', label: 'Return To Maker', icon: RotateCcw },
        { id: 'cancelled', label: 'Cancelled', icon: XCircle },
      ]
    },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'employee', label: 'Employee', icon: UserCheck },
    { id: 'region', label: 'Region', icon: MapPin },
  ];

  const renderNavItem = (item: any, depth = 0) => {
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isParentActive = hasChildren && item.children.some((child: any) => child.id === activeTab);

    return (
      <div key={item.id}>
        <Button
          variant="ghost"
          className={`w-full justify-start text-left mb-1 ${
            depth > 0 ? 'pl-8 py-2 h-auto text-sm' : 'py-3 h-auto'
          } ${
            isActive 
              ? 'bg-accent text-accent-foreground font-medium' 
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
          onClick={() => onTabChange(item.id)}
        >
          <item.icon className={`${depth > 0 ? 'h-3 w-3' : 'h-4 w-4'} mr-3`} />
          {item.label}
        </Button>
        {hasChildren && (isParentActive || activeTab.startsWith('customer')) && (
          <div className="ml-2">
            {item.children.map((child: any) => renderNavItem(child, 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-destructive rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-destructive">Bounty</h1>
            <p className="text-xs text-sidebar-foreground/60">Bounty Day, Andrew</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-1">
          {navigationItems.map(item => renderNavItem(item))}
        </nav>
      </div>

      {/* Submit Ticket Button */}
      <div className="p-4 border-t border-sidebar-border">
        <Button 
          className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold py-3"
          onClick={() => onTabChange('submit-ticket')}
        >
          📋 SUBMIT A TICKET
        </Button>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-accent-foreground">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-sidebar-foreground truncate max-w-[120px]">
              {userEmail}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarfSidebar;
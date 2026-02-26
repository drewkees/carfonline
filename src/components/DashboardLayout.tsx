import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, ChevronDown, User, MessageSquare, Settings, X } from 'lucide-react';
import CarfSidebar from '@/components/CarfSidebar';
import CustomerList from '@/components/list/CustomerList';
import ApprovedCustomerList from '@/components/list/ApprovedCustomerList';
import ReturnCustomerList from '@/components/list/ReturnCustomerList';
import PendingCustomerList from '@/components/list/PendingCustomerList';
import CancelledCustomerList from '@/components/list/CancelledCustomerList';
import ForApprovalCustomerList from '@/components/list/ForApprovalCustomerList';
import NewCustomerForm from '@/components/CustomerForm';
import SubmitTicketForm from '@/components/SubmitTicketForm';
import EmployeeDirectory from '@/components/admin-management/Employee';
import SchemaList from '@/components/list/SchemaList';
import UsersList from '@/components/list/UsersList';
import UdfMaintenance from './admin-management/UdfMaintenance';
import Message from '@/components/messaging/Message';
import CustomerTypeSeries from '@/components/admin-management/CustomerTypeSeries';
import RegionBU from '@/components/admin-management/RegionBU';
import SalesInfo from '@/components/admin-management/SalesInfo';
import SettingsUI from '@/components/Settings';
import PaymentTerms from '@/components/admin-management/PaymentTerms';
import PaymentLimit from '@/components/admin-management/PaymentLimit';
import ApprovalMatrix from '@/components/admin-management/ApprovalMatrix';
import FormFields from '@/components/admin-management/FormFields';
import UserGroups from './authorization/UserGroups';
import GroupAuthorization from './authorization/GroupAuthorization';
import CCEMAIL from './admin-management/CCEmail';
import EXECEMAIL from './admin-management/ExecEmail';
import BCApprovalMatrix from './admin-management/BCApprovalMatrix';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import CompanyList from './list/CompanyList';
import ProfilePage from './uploading/ProfilePage';

interface DashboardLayoutProps {
  userEmail: string;
  userId: string | null;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userEmail, userId, onLogout }) => {
  const [activeTab, setActiveTab] = useState('customer-list');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showSubmitTicketForm, setShowSubmitTicketForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previousTab, setPreviousTab] = useState<string>('customer-list');
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasAuthorization, setHasAuthorization] = useState<boolean>(true);
  const [userGroup, setUserGroup] = useState<string>('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const isMobile = () => {
    return window.innerWidth < 768;
  };

  const userid = (window as any).getGlobal?.('userid') || '';

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications(userid, true);

  useEffect(() => {
    const fetchUserGroup = async () => {
      if (!userEmail) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('usergroup, avatar_url')
        .eq('email', userEmail)
        .single();

      if (!error && data) {
        setUserGroup(data.usergroup || '');
        setAvatarUrl((data as any).avatar_url || null);
      }
    };

    fetchUserGroup();
  }, [userEmail]);

  // Re-fetch avatar when returning from ProfilePage so header updates immediately
  const handleProfileBack = async () => {
    setShowProfile(false);
    if (!userEmail) return;
    const { data } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('email', userEmail)
      .single();
    if (data) setAvatarUrl((data as any).avatar_url || null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // ✅ Prevent body scroll on mobile - force fixed viewport
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      window.removeEventListener('resize', setVH);
    };
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowNewCustomerForm(false);
    setShowSubmitTicketForm(tab === 'submit-ticket');
  };

  const handleNewCustomer = () => {
    setPreviousTab(activeTab);
    setShowNewCustomerForm(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setPreviousTab(activeTab);
    setShowNewCustomerForm(true);
  };

  const handleBackToCustomerList = () => {
    setEditingCustomer(null);
    setShowNewCustomerForm(false);
    setShowSubmitTicketForm(false);
    setActiveTab(previousTab);
  };

  const handleAuthorizationStatus = (status: boolean) => {
    setHasAuthorization(status);
  };

  const handleMenuClick = () => {
    if (isMobile()) {
      setIsCollapsed(true);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setShowNotifications(false);
    if (notification.gencode) {
      // console.log('Navigate to form:', notification.gencode);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL':
        return '✅';
      case 'RETURN':
        return '🔙';
      case 'CANCEL':
        return '❌';
      case 'BOS_SUBMISSION':
        return '📤';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const UnauthorizedAccess = () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center px-6">
        <p className="text-muted-foreground text-sm">No authorized menu items</p>
      </div>
    </div>
  );

  const renderContent = () => {
    // ── Profile page ──────────────────────────────────────────────────────────
    if (showProfile) {
      return (
        <ProfilePage
          userEmail={userEmail}
          onBack={handleProfileBack}
          onLogout={onLogout}
        />
      );
    }

    if (showSubmitTicketForm) {
      return <SubmitTicketForm onBack={handleBackToCustomerList} onSuccess={handleBackToCustomerList} />;
    }

    if (showNewCustomerForm) {
      return (
        <NewCustomerForm
          dialogVisible={showNewCustomerForm}
          onClose={handleBackToCustomerList}
          onSubmit={(data) => {
            handleBackToCustomerList();
          }}
          initialData={editingCustomer}
        />
      );
    }

    if (!hasAuthorization) {
      return <UnauthorizedAccess />;
    }

    switch (activeTab) {
      case 'approved':
        return <ApprovedCustomerList onEditCustomer={handleEditCustomer} />;
      case 'returntomaker':
        return <ReturnCustomerList onEditCustomer={handleEditCustomer} />;
      case 'pending':
        return <PendingCustomerList onEditCustomer={handleEditCustomer} />;
      case 'cancelled':
        return <CancelledCustomerList onEditCustomer={handleEditCustomer} />;
      case 'forapproval':
        return <ForApprovalCustomerList onEditCustomer={handleEditCustomer} />;
      case 'employee':
        return <EmployeeDirectory />;
      case 'schema':
        return <SchemaList />;
      case 'user':
        return <UsersList />;
      case 'udfmaintenance':
        return <UdfMaintenance />;
      case 'message':
        return <Message />;
      case 'settings':
        return <SettingsUI />;
      case 'custtypeseries':
        return <CustomerTypeSeries />;
      case 'regionbu':
        return <RegionBU />;
      case 'salesinfo':
        return <SalesInfo />;
      case 'paymentterms':
        return <PaymentTerms />;
      case 'paymentlimit':
        return <PaymentLimit />;
      case 'approvalmatrix':
        return <ApprovalMatrix />;
      case 'formfields':
        return <FormFields />;
      case 'usergroups':
        return <UserGroups />;
      case 'groupauth':
        return <GroupAuthorization />;
      case 'ccemail':
        return <CCEMAIL />;
      case 'execemail':
        return <EXECEMAIL />;
      case 'bcapprovalmatrix':
        return <BCApprovalMatrix />;
      case 'company':
        return <CompanyList />;
      case 'customerlist':
      case 'customer-list':
      default:
        return <CustomerList userId={userId} onNewCustomer={handleNewCustomer} onEditCustomer={handleEditCustomer} />;
    }
  };

  return (
    <div className="flex bg-background" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bg-gray-800 transition-all duration-300 ease-in-out z-40 md:z-30 ${
          isCollapsed ? 'w-0 overflow-hidden' : 'w-[300px]'
        }`}
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      >
        <div className="sticky top-0 h-full">
          <CarfSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userEmail={userEmail}
            onLogout={onLogout}
            onAuthorizationStatus={handleAuthorizationStatus}
            onMenuClick={handleMenuClick}
          />
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && isMobile() && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Main Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          !isCollapsed ? 'md:ml-[300px] ml-0' : 'ml-0'
        }`}
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      >
        {/* Header */}
        <header 
          id="dashboard-header"
          className="h-14 md:h-16 bg-card border-b border-border px-3 md:px-6 flex items-center justify-between flex-shrink-0 z-20"
        >
          <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 md:p-2 hover:bg-muted rounded-md transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
            </button>
            <h2
              onClick={() => {
                setActiveTab('customer-list');
                setShowNewCustomerForm(false);
                setShowSubmitTicketForm(false);
                setShowProfile(false);
                setEditingCustomer(null);
              }}
              className="text-sm md:text-lg lg:text-xl font-semibold text-foreground cursor-pointer hover:opacity-80 transition truncate"
            >
              ONLINE CARF
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4 relative flex-shrink-0">
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 md:p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] md:text-[10px] font-bold w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  {/* Mobile backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/20 z-40 md:hidden"
                    onClick={() => setShowNotifications(false)}
                  />
                  
                  <div className="
                    fixed md:absolute 
                    inset-x-2 top-16 md:top-auto md:inset-x-auto
                    md:right-0 md:mt-2 md:w-96
                    bg-card border border-border rounded-xl shadow-lg 
                    z-50 
                    max-h-[calc(100vh-5rem)] md:max-h-[500px]
                    overflow-hidden flex flex-col
                  ">
                    {/* Header */}
                    <div className="px-3 md:px-4 py-2 md:py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                      <h3 className="font-semibold text-sm md:text-base text-foreground">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead(userid)}
                            className="text-xs text-blue-500 hover:text-blue-600"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {loading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors ${
                              !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl flex-shrink-0">
                                {getNotificationIcon(notification.notification_type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-sm text-foreground">
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                {notification.remarks && (
                                  <p className="text-xs text-orange-600 mt-1 italic">
                                    Remarks: {notification.remarks}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(notification.created_at)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-border bg-card sticky bottom-0 z-10">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                          }}
                          className="text-xs text-blue-500 hover:text-blue-600 w-full text-center"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Avatar + Dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center space-x-2 p-1 md:p-2 rounded-full hover:bg-muted transition-colors"
              >
                {/* Avatar — shows photo if set, otherwise gradient + initial */}
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden bg-gradient-to-r from-indigo-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    userEmail?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50">
                  {/* Profile — opens ProfilePage */}
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setShowUserMenu(false);
                      setShowNewCustomerForm(false);
                      setShowSubmitTicketForm(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left"
                  >
                    <User className="h-4 w-4" /> Profile
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('message');
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left"
                  >
                    <MessageSquare className="h-4 w-4" /> Messages
                  </button>

                  {userGroup === 'sysadmin' && (
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setShowUserMenu(false);
                        setActiveTab('settings');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-muted w-full text-left border-t border-border"
                  >
                    <User className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 bg-background overflow-hidden min-h-0">
          {/* make this a flex column with min-h-0 so children using flex-1 (like Message) can stretch */}
          <div className="h-full p-3 md:p-4 lg:p-6 flex flex-col min-h-0">{renderContent()}</div>
        </main>

        {/* Footer */}
        <footer
          className="h-10 bg-card border-t border-border flex justify-between items-center px-3 md:px-6 text-xs text-muted-foreground flex-shrink-0 z-10"
        >
          <span className="truncate">Online CARF</span>
          <span className="hidden sm:inline">Version 3.0</span>
          <span className="text-[10px] sm:text-xs">{today}</span>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
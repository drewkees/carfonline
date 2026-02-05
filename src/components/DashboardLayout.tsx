import React, { useState, useEffect } from 'react';
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
import CustomerGSheet from '@/components/list/CustomerGSheet';
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

interface DashboardLayoutProps {
  userEmail: string;
  userId: string | null;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userEmail,  userId, onLogout }) => {
  const [activeTab, setActiveTab] = useState('customer-list');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showSubmitTicketForm, setShowSubmitTicketForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previousTab, setPreviousTab] = useState<string>('customer-list');
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ Get userid from global state
  const userid = (window as any).getGlobal?.('userid') || '';

  // ✅ Use notifications hook with real-time subscription
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications(userid, true); // true = enable real-time subscription

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

  // ✅ Handle notification click
  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Close notification panel
    setShowNotifications(false);

    // Navigate to the form if needed
    if (notification.gencode) {
      // You can implement navigation to the specific form here
      // For example, open the customer form with the gencode
      console.log('Navigate to form:', notification.gencode);
    }
  };

  // ✅ Get notification icon based on type
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

  // ✅ Format time ago
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

  const renderContent = () => {
    if (showNewCustomerForm)
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

    if (showSubmitTicketForm)
      return <SubmitTicketForm onBack={handleBackToCustomerList} onSuccess={handleBackToCustomerList} />;

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
      case 'customergsheet':
        return <CustomerGSheet />;
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
      case 'customerlist':
      default:
        return (
          <CustomerList userId={userId} onNewCustomer={handleNewCustomer} onEditCustomer={handleEditCustomer} />
        );
    }
  };

  return (
    <div className="h-screen flex bg-background overflow-x-auto overflow-y-hidden no-scrollbar">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-gray-800 transition-all duration-300 ease-in-out z-30 ${
          isCollapsed ? 'w-0 overflow-hidden' : 'w-[300px]'
        }`}
      >
        <div className="sticky top-0 h-full">
          <CarfSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userEmail={userEmail}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Main Column */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out ${
          !isCollapsed ? 'ml-[300px]' : 'ml-0'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">ONLINE CARF</h2>
          </div>
          <div className="flex items-center space-x-4 relative">
            {/* ✅ Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ✅ Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-lg z-50 max-h-[500px] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
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
                    <div className="px-4 py-2 border-t border-border bg-card sticky bottom-0">
                      <button
                        onClick={() => {
                          // You can implement a "View All" page here
                          setShowNotifications(false);
                        }}
                        className="text-xs text-blue-500 hover:text-blue-600 w-full text-center"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {userEmail?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left">
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
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 p-4 md:p-6 bg-background overflow-x-auto overflow-y-hidden min-h-0"
          style={{ paddingBottom: '3rem' }}
        >
          <div className="min-w-full h-full flex flex-col">{renderContent()}</div>
        </main>

        {/* Sticky Footer */}
        <footer
          className="h-10 bg-card border-t border-border flex justify-between items-center px-6 text-xs text-muted-foreground fixed bottom-0 right-0 z-40 transition-all duration-300"
          style={{ left: isCollapsed ? '0' : '300px' }}
        >
          <span>Online CARF</span>
          <span>
            Version 3.0 {today}
          </span>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
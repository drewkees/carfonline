import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, User, MessageSquare, Settings } from 'lucide-react';
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

interface DashboardLayoutProps {
  userEmail: string;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userEmail, onLogout }) => {
  const [activeTab, setActiveTab] = useState('customer-list');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showSubmitTicketForm, setShowSubmitTicketForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null); // holds selected customer
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowNewCustomerForm(false);
    setShowSubmitTicketForm(tab === 'submit-ticket');
  };

  const handleNewCustomer = () => setShowNewCustomerForm(true);

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    // console.log(customer);
    setShowNewCustomerForm(true);
  };

  const handleBackToCustomerList = () => {
    setEditingCustomer(null);
    setShowNewCustomerForm(false);
    setShowSubmitTicketForm(false);
    setActiveTab('customer-list');
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
            // console.log(editingCustomer ? 'Updated customer:' : 'New customer:', data);
            handleBackToCustomerList();
          }}
          initialData={editingCustomer} // 👈 pass selected data for editing
        />
      );

    if (showSubmitTicketForm)
      return <SubmitTicketForm onBack={handleBackToCustomerList} onSuccess={handleBackToCustomerList} />;
    switch (activeTab) {
      case 'approved':
         return (
            <ApprovedCustomerList
              onEditCustomer={handleEditCustomer}
            />
          );
      case 'returntomaker':
        // return <ReturnCustomerList />;
        return (
            <ReturnCustomerList
              onEditCustomer={handleEditCustomer}
            />
          );
      case 'pending':
        // return <PendingCustomerList />;
        return (
            <PendingCustomerList
              onEditCustomer={handleEditCustomer}
            />
          );
      case 'cancelled':
        // return <CancelledCustomerList />;
        return (
            <CancelledCustomerList
              onEditCustomer={handleEditCustomer}
            />
          );
      case 'forapproval':
        return <ForApprovalCustomerList />;
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
      case 'customerlist':
      default:
        return (
          <CustomerList
            onNewCustomer={handleNewCustomer}
            onEditCustomer={handleEditCustomer}
          />
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
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out ${!isCollapsed ? 'ml-[300px]' : 'ml-0' }`}>

        {/* Header */}
       <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            {/* Hamburger */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Toggle sidebar"
            >
              {/* <Menu className="h-6 w-6 text-foreground" /> */}
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">ONLINE CARF</h2>
          </div>
          <div className="flex items-center space-x-4 relative">
            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                3
              </span>
            </button>

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
                  <button onClick={()=> {setActiveTab('message'); setShowUserMenu(false)}} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left">
                    <MessageSquare className="h-4 w-4" /> Messages
                  </button>
                  <button  onClick={() => {
                    setShowSettings(true);
                    setShowUserMenu(false); 
                    setActiveTab('settings');
                  }}className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left">
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        {/* <main className="flex-1 p-4 md:p-6 bg-background overflow-x-auto overflow-y-hidden pb-12">
          <div className="min-w-full">
            {renderContent()}
          </div>
        </main> */}
        <main
          className="flex-1 p-4 md:p-6 bg-background overflow-x-auto overflow-y-hidden min-h-0"
          style={{ paddingBottom: '3rem' }} // footer height (h-10) + 0.5rem gap
        >
          <div className="min-w-full h-full flex flex-col">
            {renderContent()}
          </div>
        </main>



        {/* Sticky Footer */}
        <footer
        className="h-10 bg-card border-t border-border flex justify-between items-center px-6 text-xs text-muted-foreground fixed bottom-0 right-0 z-40 transition-all duration-300"
        style={{ left: isCollapsed ? '0' : '300px' }}
      >
        <span>Online CARF</span>
        <span>Version 3.0 {today}</span>
      </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;

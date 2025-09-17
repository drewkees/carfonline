import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import CarfSidebar from '@/components/CarfSidebar';
import CustomerList from '@/components/CustomerList';
import ApprovedCustomerList from '@/components/ApprovedCustomerList';
import ReturnCustomerList from '@/components/ReturnCustomerList';
import PendingCustomerList from '@/components/PendingCustomerList';
import CancelledCustomerList from '@/components/CancelledCustomerList';
import ForApprovalCustomerList from '@/components/ForApprovalCustomerList';
import NewCustomerForm from '@/components/CustomerForm';
import SubmitTicketForm from '@/components/SubmitTicketForm';
import EmployeeDirectory from '@/components/Employee';

interface DashboardLayoutProps {
  userEmail: string;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userEmail, onLogout }) => {
  const [activeTab, setActiveTab] = useState('customer-list');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showSubmitTicketForm, setShowSubmitTicketForm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowNewCustomerForm(false);
    setShowSubmitTicketForm(tab === 'submit-ticket');
  };

  const handleNewCustomer = () => setShowNewCustomerForm(true);

  const handleBackToCustomerList = () => {
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
            console.log('Form submitted', data);
            handleBackToCustomerList();
          }}
        />
      );
    if (showSubmitTicketForm)
      return <SubmitTicketForm onBack={handleBackToCustomerList} onSuccess={handleBackToCustomerList} />;

    switch (activeTab) {
      case 'approved':
        return <ApprovedCustomerList />;
      case 'return-to-maker':
        return <ReturnCustomerList />;
      case 'pending':
        return <PendingCustomerList />;
      case 'cancelled':
        return <CancelledCustomerList />;
      case 'for-approval':
        return <ForApprovalCustomerList />;
      case 'employee':
        return <EmployeeDirectory />;
      case 'customer-list':
      default:
        return <CustomerList onNewCustomer={handleNewCustomer} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0 overflow-hidden' : 'w-[300px]'
        }`}
      >
        <div className="sticky top-0 h-screen">
          <CarfSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userEmail={userEmail}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            {/* Hamburger */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>
            <h2 className="text-xl font-semibold text-foreground">ONLINE CARF</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">👤</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{renderContent()}</main>

        {/* Sticky Footer */}
        <footer className="h-10 bg-card border-t border-border flex justify-between items-center px-6 text-xs text-muted-foreground sticky bottom-0">
          <span>Online CARF</span>
          <span>Version 3.0 {today}</span>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;

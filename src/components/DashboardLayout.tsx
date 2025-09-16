import React, { useState } from 'react';
import CarfSidebar from '@/components/CarfSidebar';
import CustomerList from '@/components/CustomerList';
import NewCustomerForm from '@/components/NewCustomerForm';
import SubmitTicketForm from '@/components/SubmitTicketForm';

interface DashboardLayoutProps {
  userEmail: string;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userEmail, onLogout }) => {
  const [activeTab, setActiveTab] = useState('customer-list');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showSubmitTicketForm, setShowSubmitTicketForm] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowNewCustomerForm(false);
    setShowSubmitTicketForm(false);
    
    if (tab === 'submit-ticket') {
      setShowSubmitTicketForm(true);
    }
  };

  const handleNewCustomer = () => {
    setShowNewCustomerForm(true);
  };

  const handleBackToCustomerList = () => {
    setShowNewCustomerForm(false);
    setShowSubmitTicketForm(false);
    setActiveTab('customer-list');
  };

  const renderContent = () => {
    if (showNewCustomerForm) {
      return (
        <NewCustomerForm
          onBack={handleBackToCustomerList}
          onSuccess={handleBackToCustomerList}
        />
      );
    }

    if (showSubmitTicketForm) {
      return (
        <SubmitTicketForm
          onBack={handleBackToCustomerList}
          onSuccess={handleBackToCustomerList}
        />
      );
    }

    switch (activeTab) {
      case 'customer-list':
      case 'customer':
        return <CustomerList onNewCustomer={handleNewCustomer} />;
      case 'pending':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">Pending Customers</h3>
            <p className="text-muted-foreground">Customer requests awaiting approval will appear here.</p>
          </div>
        );
      case 'approved':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">Approved Customers</h3>
            <p className="text-muted-foreground">Approved customer requests will appear here.</p>
          </div>
        );
      case 'return-to-maker':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">Return to Maker</h3>
            <p className="text-muted-foreground">Requests requiring revision will appear here.</p>
          </div>
        );
      case 'cancelled':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">Cancelled Requests</h3>
            <p className="text-muted-foreground">Cancelled customer requests will appear here.</p>
          </div>
        );
      case 'for-approval':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">For Approval</h3>
            <p className="text-muted-foreground">Customer requests requiring approval will appear here.</p>
          </div>
        );
      case 'admin':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">Admin Panel</h3>
            <p className="text-muted-foreground">Administrative functions will be available here.</p>
          </div>
        );
      case 'employee':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">Employee Management</h3>
            <p className="text-muted-foreground">Employee management features coming soon.</p>
          </div>
        );
      case 'region':
        return (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-foreground mb-2">Region Management</h3>
            <p className="text-muted-foreground">Regional management features coming soon.</p>
          </div>
        );
      default:
        return <CustomerList onNewCustomer={handleNewCustomer} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <CarfSidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-foreground">
              ONLINE CARF
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">👤</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto bg-background">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSystemSettings } from '../SystemSettings/SystemSettingsContext';
import { useCustomerForm } from '@/hooks/useCustomerForm';
import ConfirmationDialog from '@/pages/ConfirmationDialog';

interface CustomerListProps {
  onEditCustomer: (customer: Customer) => void;
}

interface Customer {
  id: string;
  [key: string]: any;
}

type FieldType = {
  id: number;
  fieldid: string;
  fieldnames: string;
  datatype: string;
  visible: boolean;
  truncatecolumn: boolean;
};

const ForApprovalCustomerList: React.FC<CustomerListProps> = ({ onEditCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [udfFields, setUdfFields] = useState<FieldType[]>([]);
  const { customerSource, sheetId, sheetApiKey, sheetRange } = useSystemSettings();
  const [isMobile, setIsMobile] = useState(false);
  
  // Get the approval functions from useCustomerForm hook
  const { approveForm, cancelForm, returntomakerForm } = useCustomerForm();
  
  // Confirmation dialog states
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    action: 'approve' as 'approve' | 'cancel' | 'update' | 'return',
    customer: null as Customer | null,
  });
  const [returnDialog, setReturnDialog] = useState({
      isOpen: false,
      remarks: '',
    });
  const [isReturnLoading, setIsReturnLoading] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await fetchUdfFields();
    };
    initialize();
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
    if (!customerSource || !sheetId || !sheetApiKey || !sheetRange) return;
    if (customerSource === 'PROD') {
      fetchCustomers();
    } else {
      fetchCustomersFromGSheet();
    }
  }, [customerSource, sheetId, sheetApiKey, sheetRange]);

  const fetchUdfFields = async () => {
    try {
      const { data, error } = await supabase
        .from('udfmaintainance')
        .select('fieldid, fieldnames, datatype, visible,truncatecolumn')
        .eq('objectcode', 'forapproval')
        .order('id', { ascending: true });
      if (error) throw error;
      setUdfFields((data || []) as FieldType[]);
    } catch (error) {
      console.error('Error fetching UDF fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch UDF fields.',
        variant: 'destructive',
      });
    }
  };

  const truncate = (value: any, max = 20) => {
    if (!value) return "-";
    const str = String(value);
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customerdata')
        .select('*')
        .eq('approvestatus', 'PENDING')
        .order('datecreated', { ascending: false });
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersFromGSheet = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?key=${sheetApiKey}`
      );
      const result = await res.json();
      if (!result.values || result.values.length === 0) {
        setCustomers([]);
        return;
      }
      const [headerRow, ...rows] = result.values;
      const sheetCustomers = rows.map((row, idx) => {
        const customer: Customer = { id: idx.toString() };
        headerRow.forEach((key, i) => {
          customer[key] = row[i] ?? null;
        });
        return customer;
      });

      const currentUserId = (window.getGlobal('userid') || "")
        .toString()
        .trim()
        .toLowerCase();

      const filteredCustomers = sheetCustomers.filter((customer) => {
        const status = (customer.approvestatus || "")
          .toString()
          .trim()
          .toUpperCase();

        if (status !== "PENDING") return false;

        const nextApproverRaw = (customer.nextapprover || "").toString();
        const approvers = nextApproverRaw
          .split(",")
          .map(a => a.trim().toLowerCase())
          .filter(Boolean);

        return approvers.includes(currentUserId);
      });

      setCustomers(filteredCustomers);
    } catch (error) {
      console.error("Error fetching Google Sheet:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers from Google Sheet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Action handlers - open confirmation dialogs
  const handleApprove = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmationDialog({
      isOpen: true,
      action: 'approve',
      customer,
    });
  };

  const handleReturnClick = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setReturnDialog({ isOpen: true, remarks: '' });
    setConfirmationDialog(prev => ({ ...prev, customer })); // save customer for later
  };


  const handleReturnSubmit = async () => {
    if (!returnDialog.remarks.trim()) {
      alert('Please enter remarks before returning to maker');
      return;
    }
    setIsReturnLoading(true);
    try {
      // open the confirmation dialog for 'return'
      setConfirmationDialog(prev => ({
        ...prev,
        isOpen: true,
        action: 'return',
        remarks: returnDialog.remarks, 
      }));
    } finally {
      setIsReturnLoading(false);
    }
  };

  const handleReturnToMaker = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmationDialog({
      isOpen: true,
      action: 'update',
      customer,
    });
  };

  const handleCancel = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmationDialog({
      isOpen: true,
      action: 'cancel',
      customer,
    });
  };

  // Actual action executions after confirmation
  const executeApprove = async () => {
    if (!confirmationDialog.customer) return;
    
    try {
      setLoading(true);
      const success = await approveForm(confirmationDialog.customer);
      
      if (success) {
        // Refresh the list after approval
        if (customerSource === 'PROD') {
          await fetchCustomers();
        } else {
          await fetchCustomersFromGSheet();
        }
      }
    } catch (error) {
      console.error('Error approving customer:', error);
      toast({
        title: "Error",
        description: "Failed to approve customer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      closeConfirmationDialog();
    }
  };

  const executeReturnToMaker = async () => {
    if (!confirmationDialog.customer) return;
    
    try {
      setLoading(true);
      const success = await returntomakerForm(confirmationDialog.customer, returnDialog.remarks );
      
      if (success) {
        // Refresh the list
        if (customerSource === 'PROD') {
          await fetchCustomers();
        } else {
          await fetchCustomersFromGSheet();
        }
      }
    } catch (error) {
      console.error('Error returning to maker:', error);
      toast({
        title: "Error",
        description: "Failed to return customer to maker.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      closeConfirmationDialog();
    }
  };

  const executeCancel = async () => {
    if (!confirmationDialog.customer) return;
    
    try {
      setLoading(true);
      const success = await cancelForm(confirmationDialog.customer);
      
      if (success) {
        // Refresh the list
        if (customerSource === 'PROD') {
          await fetchCustomers();
        } else {
          await fetchCustomersFromGSheet();
        }
      }
    } catch (error) {
      console.error('Error cancelling customer:', error);
      toast({
        title: "Error",
        description: "Failed to cancel customer request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      closeConfirmationDialog();
    }
  };

  // Handle confirmation based on action type
  const handleConfirmAction = () => {
    switch (confirmationDialog.action) {
      case 'approve':
        executeApprove();
        break;
      case 'update':
        executeReturnToMaker();
        break;
      case 'cancel':
        executeCancel();
        break;
      case 'return':
        executeReturnToMaker();
        break;
    }
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      isOpen: false,
      action: 'approve',
      customer: null,
    });
  };

  const filteredCustomers = customers.filter(c =>
    Object.values(c)
      .join(' ')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'Decimal':
      case 'Number':
        return formatCurrency(value);
      default:
        return value;
    }
  };

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-6">
        {isMobile ? (
          /* Mobile Layout */
          <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
            <div className="flex-shrink-0 bg-background border-b border-border">
              <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
                <div className="flex items-center space-x-2 w-full">
                  <User className="h-5 w-5 text-foreground flex-shrink-0" />
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    FOR APPROVAL LIST
                  </h2>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full bg-input border-border text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3 pb-6">
                {currentCustomers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No pending customers found
                  </div>
                ) : (
                  currentCustomers.map((customer) => {
                    const visibleFields = udfFields.filter(f => f.visible);
                    const primaryFields = visibleFields.slice(0, 4);
                    const secondaryFields = visibleFields.slice(4, 6);

                    return (
                      <Card
                        key={customer.id}
                        className="bg-card border-border"
                        onClick={() => onEditCustomer(customer)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-primary font-semibold text-sm cursor-pointer" onClick={() => onEditCustomer(customer)}>
                              {customer.carfno || customer.id}
                            </div>
                          </div>

                          {primaryFields.map((field) => {
                            const value = customer[field.fieldid];
                            if (!value) return null;
                            return (
                              <div key={field.fieldid} className="mb-2">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                  {field.fieldnames}
                                </div>
                                <div className="text-sm text-foreground mt-0.5">
                                  {formatValue(value, field.datatype)}
                                </div>
                              </div>
                            );
                          })}

                          {secondaryFields.length > 0 && (
                            <div className="h-px bg-border my-3"></div>
                          )}

                          {secondaryFields.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              {secondaryFields.map((field) => {
                                const value = customer[field.fieldid];
                                return (
                                  <div key={field.fieldid}>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                      {field.fieldnames}
                                    </div>
                                    <div className="text-sm text-foreground mt-0.5">
                                      {formatValue(value, field.datatype) || '-'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Mobile Action Buttons */}
                          <div className="mt-4 pt-3 border-t border-border">
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => handleApprove(customer, e)}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs h-9"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => handleReturnClick(customer, e)}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs h-9"
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                Return to Maker
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => handleCancel(customer, e)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white text-xs h-9"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="text-xs">
                    {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3 text-xs"
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 text-xs"
                    >
                      →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Layout */
          <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-6 w-6 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">PENDING LIST</h2>
              </div>

              <div className="flex items-center space-x-4 mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-input border-border transition-all duration-300 hover:w-80 focus:w-80"
                  />
                </div>
              </div>
            </div>

            <Card className="bg-card border-border overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto no-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)', width: '100%' }}>
                  <table className="min-w-max w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b bg-muted">
                        {udfFields.filter(f => f.visible).map((field) => (
                          <th
                            key={field.fieldid}
                            className="text-foreground font-medium text-left px-4 py-2 whitespace-nowrap text-sm"
                            style={{ width: '150px', minWidth: '150px' }}
                          >
                            {field.fieldnames.toUpperCase()}
                          </th>
                        ))}
                        <th
                          className="text-foreground font-medium text-center px-4 py-2 whitespace-nowrap text-sm sticky right-0 bg-muted"
                          style={{ minWidth: '300px', width: '300px' }}
                        >
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-border hover:bg-muted/50 cursor-pointer" onDoubleClick={() => onEditCustomer(customer)}>
                          {udfFields.filter(f => f.visible).map((field) => {
                            const value = customer[field.fieldid];
                            return (
                              <td
                                key={field.fieldid}
                                className="relative text-foreground px-4 py-2 whitespace-nowrap text-sm group"
                                style={{ width: '150px', minWidth: '150px' }}
                              >
                                <span>
                                  {field.truncatecolumn ? truncate(value ?? '') : value ?? '-'}
                                </span>
                                {field.truncatecolumn && value && (
                                  <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 z-50 whitespace-pre">
                                    {value}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-2 sticky right-0 bg-card">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => handleApprove(customer, e)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs h-8 px-3"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => handleReturnClick(customer, e)}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 px-3"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Return to Maker
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => handleCancel(customer, e)}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs h-8 px-3"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span>Items per page:</span>
                <span className="font-medium">{itemsPerPage}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>
                  {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={handleConfirmAction}
        action={confirmationDialog.action}
        title={
          confirmationDialog.action === 'approve' 
            ? 'Approve Customer Request' 
            : confirmationDialog.action === 'update' || confirmationDialog.action === 'return'
            ? 'Return to Maker'
            : 'Cancel Customer Request'
        }
        message={
          confirmationDialog.action === 'approve'
            ? 'Are you sure you want to approve this customer activation request? This will move the request forward in the approval chain.'
            : confirmationDialog.action === 'update' || confirmationDialog.action === 'return'
            ? 'Are you sure you want to return this request to the maker? They will need to review and resubmit.'
            : 'Are you sure you want to cancel this customer request? This action cannot be undone.'
        }
      />

      {/* Return to Maker Dialog */}
      {returnDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] mx-4">
            <h3 className="text-xl text-black font-bold mb-4">Return to Maker</h3>
            <p className="text-black mb-4">Please provide remarks for returning this form to the maker:</p>
            
            <textarea
              value={returnDialog.remarks}
              onChange={(e) => setReturnDialog(prev => ({ ...prev, remarks: e.target.value }))}
              className="text-gray-900 w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-300 resize-none"
              placeholder="Enter your remarks here..."
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setReturnDialog({ isOpen: false, remarks: '' })}
                disabled={isReturnLoading}
                className="px-6 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturnSubmit}
                disabled={isReturnLoading || !returnDialog.remarks.trim()}
                className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isReturnLoading && <Spinner />}
                {isReturnLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForApprovalCustomerList;
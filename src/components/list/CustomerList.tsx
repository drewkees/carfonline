import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSystemSettings } from '../SystemSettings/SystemSettingsContext';


interface Customer {
  id: string;
  [key: string]: any;
}

interface CustomerListProps {
  userId: string | null;
  onNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
}

type FieldType = {
  id: number;
  fieldid: string;
  fieldnames: string;
  datatype: string;
  visible: boolean;
  truncatecolumn: boolean;
};

const CustomerList: React.FC<CustomerListProps> = ({ userId, onNewCustomer, onEditCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 200;
  const [udfFields, setUdfFields] = useState<FieldType[]>([]);
  const { customerSource, sheetId, sheetApiKey, sheetRange } = useSystemSettings();
  const [isMobile, setIsMobile] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

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
        .eq('objectcode', 'customerlist')
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

      if (!userId) {
        console.error('User ID not found in globalsss');
        toast({
          title: "Error",
          description: "User session not found. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      // Fetch user's allaccess setting
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('allaccess,allcompanyaccess,company')
        .eq('userid', userId)
        .single();

      if (userError) {
        console.error('Error fetching user access:', userError);
        throw userError;
      }

      const hasAllAccess = userData?.allaccess || false;
      const hasAllCompanyAccess = userData?.allcompanyaccess || false;
      const userCompany = userData?.company || null;

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

      let filteredCustomers = sheetCustomers.filter((customer) => {
        const status = (customer.approvestatus || "").trim().toUpperCase();
        return status !== "APPROVED" && status !== "CANCELLED" && status !== "RETURN TO MAKER";
      });

      if (hasAllCompanyAccess) {
      } else if (userCompany) {
        filteredCustomers = filteredCustomers.filter((customer) => 
          (customer.company || "").trim().toUpperCase() === userCompany.trim().toUpperCase()
        );
      }
      if (!hasAllAccess) {
        filteredCustomers = filteredCustomers.filter((customer) => 
          customer.maker === userId
        );
      } else {
        console.log(filteredCustomers);
        console.log('User has all access - showing all records');
      }

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

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = Object.values(c)
      .join(' ')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'All' || 
      (c.requestfor || '').toUpperCase() === activeFilter.toUpperCase();
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const getStatusBadgeClass = (status: string) => {
    const upperStatus = (status || '').toUpperCase();
    if (upperStatus === 'ACTIVATION') return 'bg-green-500 text-white';
    if (upperStatus === 'DEACTIVATION') return 'bg-red-500 text-white';
    if (upperStatus === 'EDIT') return 'bg-yellow-500 text-black';
    return 'bg-gray-500 text-white';
  };

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
      <main className="flex-1 p-4 sm:p-6">
        {isMobile ? (
          /* Mobile Layout with Sticky Header */
          <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
            {/* Sticky Header Section */}
            <div className="flex-shrink-0 bg-background border-b border-border">
              {/* Page Header */}
              <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
                <div className="flex items-center space-x-2 w-full">
                  <User className="h-5 w-5 text-foreground flex-shrink-0" />
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    CUSTOMER LIST
                  </h2>
                </div>
                <div className="flex items-center gap-2 w-full">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full bg-input border-border text-sm"
                    />
                  </div>
                  {/* New Customer Button */}
                  <Button
                    onClick={onNewCustomer}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-3 text-sm flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+</span>
                  </Button>
                </div>
              </div>

              {/* Mobile Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-3 px-4 no-scrollbar">
                {['All', 'Activation', 'Deactivation', 'Edit'].map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className={`flex-shrink-0 text-xs ${
                      activeFilter === filter 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card text-foreground'
                    }`}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3 pb-6">
                {currentCustomers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No customers found
                  </div>
                ) : (
                  currentCustomers.map((customer) => {
                    const visibleFields = udfFields.filter(f => f.visible);
                    const primaryFields = visibleFields.slice(0, 4);
                    const secondaryFields = visibleFields.slice(4, 6);
                    
                    return (
                      <Card 
                        key={customer.id} 
                        className="bg-card border-border cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                        onClick={() => onEditCustomer(customer)}
                      >
                        <CardContent className="p-4">
                          {/* Header with CARF and Status */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-primary font-semibold text-sm">
                              {customer.carfno || customer.id}
                            </div>
                            {customer.requestfor && (
                              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeClass(customer.requestfor)}`}>
                                {customer.requestfor}
                              </div>
                            )}
                          </div>
                          
                          {/* Primary Information */}
                          {primaryFields.map((field) => {
                            const value = customer[field.fieldid];
                            if (!value) return null;
                            return (
                              <div key={field.fieldid} className="mb-2">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                  {field.fieldnames}
                                </div>
                                <div className="text-sm text-foreground mt-0.5">
                                  {value}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Divider */}
                          {secondaryFields.length > 0 && (
                            <div className="h-px bg-border my-3"></div>
                          )}
                          
                          {/* Secondary Info */}
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
                                      {value || '-'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Mobile Pagination */}
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
          /* Desktop Layout - Original Structure */
          <div className="space-y-4 sm:space-y-6 pb-24">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-foreground flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                  CUSTOMER LIST
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
                {/* Search */}
                <div className="relative flex-1 min-w-[120px] sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-input border-border text-sm sm:text-base"
                  />
                </div>
                {/* New Customer Button */}
                <Button
                  onClick={onNewCustomer}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-2 sm:px-6 text-xs sm:text-sm flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">NEW CUSTOMER</span>
                </Button>
              </div>
            </div>

            {/* Table */}
            <Card className="bg-card border-border overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto no-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  <table className="min-w-max w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b bg-muted">
                        {udfFields.filter(f => f.visible).map((field) => (
                          <th
                            key={field.fieldid}
                            className="text-foreground font-medium text-left px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm"
                            style={{ minWidth: '120px', width: '150px' }}
                          >
                            {field.fieldnames.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentCustomers.map((customer) => (
                        <tr 
                          key={customer.id} 
                          className="border-b border-border hover:bg-muted/50 cursor-pointer" 
                          onDoubleClick={() => onEditCustomer(customer)}
                        >
                          {udfFields.filter(f => f.visible).map((field) => {
                            const value = customer[field.fieldid];
                            return (
                              <td
                                key={field.fieldid}
                                className="relative text-foreground px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm group"
                              >
                                <span>{field.truncatecolumn ? truncate(value ?? '') : value ?? '-'}</span>
                                {field.truncatecolumn && value && (
                                  <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 z-50 whitespace-pre">
                                    {value}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-muted-foreground gap-2">
              <div className="flex items-center space-x-2">
                <span>Items per page:</span>
                <span className="font-medium">{itemsPerPage}</span>
              </div>
              <div className="flex items-center space-x-1">
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
    </div>
  );
};

export default CustomerList;
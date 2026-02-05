import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  [key: string]: any;
}

interface CustomerListProps {
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

const PendingCustomerList: React.FC<CustomerListProps>  = ({onEditCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [udfFields, setUdfFields] = useState<FieldType[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [config, setConfig] = useState<{ customerSource: string }>({ customerSource: 'null' });

  const SHEET_ID = "1JJDh_w_opcdy3QNPZ-1xh-wahsx_t0iElBw95TwK8iY";
  const API_KEY = "AIzaSyDy68c4i84RYAM-5iDKyzCGQVCJPimid4U";
  const RANGE = "CUSTOMER DATA!A1:BX6000"; 

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('customer_source')
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setConfig(prev => ({ ...prev, customerSource: data[0].customer_source }));
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    }
  };

  // useEffect(() => {
  //   const initialize = async () => {
  //     await fetchUdfFields();
  //     await fetchPendingCustomers();
  //   };
  //   initialize();
  // }, []);

  useEffect(() => {
    const initialize = async () => {
      await loadSettings();
      await fetchUdfFields();      
    };
    initialize();
  }, []);

  useEffect(() => {
    if (config.customerSource) {
      if (config.customerSource === 'PROD') {
        fetchPendingCustomers();
      } else {
        fetchCustomersFromGSheet();
      }
    }
  }, [config.customerSource]);

  const fetchUdfFields = async () => {
    try {
      const { data, error } = await supabase
        .from('udfmaintainance')
        .select('fieldid, fieldnames, datatype, visible,truncatecolumn')
        .eq('objectcode', 'pending') // dynamic objectcode
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

  const fetchPendingCustomers = async () => {
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
      console.error('Error fetching pending customers:', error);
      toast({ title: 'Error', description: 'Failed to fetch pending customers.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersFromGSheet = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
      );
      const result = await res.json();

      if (!result.values || result.values.length === 0) {
        setCustomers([]);
        setColumns([]);
        return;
      }

      const [headerRow, ...rows] = result.values;
      setColumns(headerRow);

      const sheetCustomers = rows.map((row, idx) => {
        const customer: Customer = { id: idx.toString() };
        headerRow.forEach((key, i) => {
          customer[key] = row[i] ?? null;
        });
        return customer;
      });

      const filteredCustomers = sheetCustomers.filter((customer) => {
        const status = (customer.approvestatus || "").trim().toUpperCase();
        return status === "PENDING";
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

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-foreground flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                PENDING LIST
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
                      <tr key={customer.id} className="border-b border-border hover:bg-muted/50 cursor-pointer" onDoubleClick={() => onEditCustomer(customer)}>
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
      </main>
    </div>
    
  );
};

export default PendingCustomerList;

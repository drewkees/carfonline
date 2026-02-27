import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User, Workflow } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSystemSettings } from '../SystemSettings/SystemSettingsContext';
import ApprovalFlowModal from '../ApprovalModalFlow';
import ListLoadingSkeleton from './ListLoadingSkeleton';

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

type TooltipState = {
  value: string;
  x: number;
  y: number;
  flipUp: boolean;
} | null;

// ── Approval Flow Trigger Icon ──────────────────────────────────────────────
const ApprovalIcon: React.FC<{ customer: Customer; onClick: (e: React.MouseEvent) => void }> = ({
  customer,
  onClick,
}) => {
  const status = (customer.approvestatus || '').toUpperCase();
  const isApproved = status === 'APPROVED';
  const isCancelled = status === 'CANCELLED';
  const isReturned = status === 'RETURN TO MAKER';

  const color = isApproved
    ? '#22c55e'
    : isCancelled
    ? '#ef4444'
    : isReturned
    ? '#f59e0b'
    : 'hsl(var(--primary))';

  return (
    <button
      onClick={onClick}
      title="View Approval Flow"
      className="inline-flex items-center justify-center w-7 h-7 rounded-md transition-all hover:scale-110 active:scale-95 border flex-shrink-0"
      style={{ background: `${color}12`, borderColor: `${color}35`, color }}
    >
      <Workflow className="w-3.5 h-3.5" />
    </button>
  );
};
// ───────────────────────────────────────────────────────────────────────────

const PendingCustomerList: React.FC<CustomerListProps> = ({ onEditCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [udfFields, setUdfFields] = useState<FieldType[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const { customerSource, sheetId, sheetApiKey, sheetRange } = useSystemSettings();
  const [isMobile, setIsMobile] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [approvalCustomer, setApprovalCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchUdfFields(), fetchUsersMap()]);
    };
    initialize();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!customerSource) return;
    if (customerSource === 'PROD') {
      fetchPendingCustomers();
    } else {
      fetchCustomersFromGSheet();
    }
  }, [customerSource, sheetId, sheetApiKey, sheetRange]);

  const fetchUsersMap = async () => {
    const { data, error } = await supabase.from('users').select('userid,fullname');
    if (error) { console.error('Error fetching users map:', error); return; }
    const map: Record<string, string> = {};
    (data || []).forEach((u) => { map[u.userid] = u.fullname; });
    setUsersMap(map);
  };

  const fetchUdfFields = async () => {
    try {
      const { data, error } = await supabase
        .from('udfmaintainance')
        .select('fieldid, fieldnames, datatype, visible,truncatecolumn')
        .eq('objectcode', 'pending')
        .order('id', { ascending: true });
      if (error) throw error;
      setUdfFields((data || []) as FieldType[]);
    } catch (error) {
      console.error('Error fetching UDF fields:', error);
      toast({ title: 'Error', description: 'Failed to fetch UDF fields.', variant: 'destructive' });
    }
  };

  const truncate = (value: any, max = 20) => {
    if (!value) return '-';
    const str = String(value);
    return str.length > max ? str.substring(0, max) + '…' : str;
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
      const userid = (window as any).getGlobal?.('userid');
      if (!userid) {
        toast({ title: 'Error', description: 'User session not found. Please refresh the page.', variant: 'destructive' });
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('allaccess')
        .eq('userid', userid)
        .single();
      if (userError) throw userError;

      const hasAllAccess = userData?.allaccess || false;

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?key=${sheetApiKey}`
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
        headerRow.forEach((key: string, i: number) => {
          customer[key] = row[i] ?? null;
        });
        return customer;
      });

      let filteredCustomers = sheetCustomers.filter((customer) => {
        const status = (customer.approvestatus || '').trim().toUpperCase();
        return status === 'PENDING';
      });

      if (!hasAllAccess) {
        filteredCustomers = filteredCustomers.filter((customer) => customer.maker === userid);
      }

      const sorted = [...filteredCustomers].sort((a, b) => {
        const aId = parseInt(a['#'] || '0');
        const bId = parseInt(b['#'] || '0');
        return bId - aId;
      });
      setCustomers(sorted);
    } catch (error) {
      console.error('Error fetching Google Sheet:', error);
      toast({ title: 'Error', description: 'Failed to fetch customers from Google Sheet.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = Object.values(c).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || (c.requestfor || '').toUpperCase() === activeFilter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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

  const getStatusBadgeClass = (status: string) => {
    const upperStatus = (status || '').toUpperCase();
    if (upperStatus === 'ACTIVATION') return 'bg-green-500 text-white';
    if (upperStatus === 'DEACTIVATION') return 'bg-red-500 text-white';
    if (upperStatus === 'EDIT') return 'bg-yellow-500 text-black';
    return 'bg-gray-500 text-white';
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>, value: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipMaxWidth = 280;
    const tooltipMaxHeight = 300;
    const spaceOnRight = window.innerWidth - rect.left;
    const spaceBelow = window.innerHeight - rect.bottom;
    let x = spaceOnRight < tooltipMaxWidth ? rect.right - tooltipMaxWidth : rect.left;
    x = Math.max(8, x);
    const flipUp = spaceBelow < tooltipMaxHeight;
    const y = flipUp ? rect.top - 6 : rect.bottom + 6;
    setTooltip({ value, x, y, flipUp });
  };

  const handleMouseLeave = () => setTooltip(null);

  if (loading) {
    return (
      <ListLoadingSkeleton
        isMobile={isMobile}
        title="PENDING LIST"
        tableColumns={udfFields.filter((f) => f.visible).length + 1}
        mainClassName="p-4 sm:p-6"
        showFilters
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-4 sm:p-6">
        {isMobile ? (
          /* ── Mobile Layout ── */
          <div className="fixed inset-x-0 top-0 bottom-0 flex flex-col" style={{ paddingTop: '60px' }}>
            <div className="flex-shrink-0 bg-background border-b border-border">
              <div className="flex flex-col items-start justify-between gap-3 p-4 pb-3">
                <div className="flex items-center space-x-2 w-full">
                  <User className="h-5 w-5 text-foreground flex-shrink-0" />
                  <h2 className="text-lg font-semibold text-foreground truncate">PENDING LIST</h2>
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

              <div className="flex gap-2 overflow-x-auto pb-3 px-4 no-scrollbar">
                {['All', 'Activation', 'Deactivation', 'Edit'].map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className={`flex-shrink-0 text-xs ${
                      activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
                    }`}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3 pb-6">
                {currentCustomers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No pending customers found</div>
                ) : (
                  currentCustomers.map((customer) => {
                    const visibleFields = udfFields.filter((f) => f.visible);
                    const primaryFields = visibleFields.slice(0, 4);
                    const secondaryFields = visibleFields.slice(4, 6);

                    return (
                      <Card
                        key={customer.id}
                        className="bg-card border-border cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                        onClick={() => onEditCustomer(customer)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              {/* ── Approval Icon (mobile) ── */}
                              <ApprovalIcon
                                customer={customer}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setApprovalCustomer(customer);
                                }}
                              />
                              <div className="text-primary font-semibold text-sm">
                                {customer.carfno || customer.id}
                              </div>
                            </div>
                            {customer.requestfor && (
                              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeClass(customer.requestfor)}`}>
                                {customer.requestfor}
                              </div>
                            )}
                          </div>

                          {primaryFields.map((field) => {
                            const value = customer[field.fieldid];
                            if (!value) return null;
                            const displayValue = field.fieldid === 'maker' ? (usersMap[value] || value) : value;
                            return (
                              <div key={field.fieldid} className="mb-2">
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">{field.fieldnames}</div>
                                <div className="text-sm text-foreground mt-0.5">{formatValue(displayValue, field.datatype)}</div>
                              </div>
                            );
                          })}

                          {secondaryFields.length > 0 && <div className="h-px bg-border my-3"></div>}

                          {secondaryFields.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              {secondaryFields.map((field) => {
                                const value = customer[field.fieldid];
                                const displayValue = field.fieldid === 'maker' ? (usersMap[value] || value) : value;
                                return (
                                  <div key={field.fieldid}>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">{field.fieldnames}</div>
                                    <div className="text-sm text-foreground mt-0.5">{formatValue(displayValue, field.datatype) || '-'}</div>
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

              <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="text-xs">
                    {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="h-8 px-3 text-xs">←</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="h-8 px-3 text-xs">→</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Desktop Layout ── */
          <div className="space-y-4 sm:space-y-6 pb-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-foreground flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">PENDING LIST</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
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

            <Card className="bg-card border-border overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="w-full overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  <table className="min-w-max w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b bg-muted">
                        {/* ── Approval Flow Column Header ── */}
                        <th
                          className="text-foreground font-medium text-left px-2 sm:px-3 py-1 sm:py-2"
                          style={{ width: '44px', minWidth: '44px' }}
                        />
                        {udfFields.filter((f) => f.visible).map((field) => (
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
                          {/* ── Approval Icon Cell ── */}
                          <td
                            className="px-2 sm:px-3 py-1 sm:py-2"
                            style={{ width: '44px', minWidth: '44px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ApprovalIcon
                              customer={customer}
                              onClick={(e) => {
                                e.stopPropagation();
                                setApprovalCustomer(customer);
                              }}
                            />
                          </td>

                          {udfFields.filter((f) => f.visible).map((field) => {
                            const value = customer[field.fieldid];
                            const displayValue =
                              field.fieldid === 'maker' && value ? (usersMap[value] || value) : value;
                            const isTruncated = field.truncatecolumn && displayValue;

                            return (
                              <td
                                key={field.fieldid}
                                className="text-foreground px-2 sm:px-4 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm"
                                style={{ minWidth: '120px', width: '150px' }}
                                onMouseEnter={isTruncated ? (e) => handleMouseEnter(e, String(displayValue)) : undefined}
                                onMouseLeave={isTruncated ? handleMouseLeave : undefined}
                              >
                                {field.truncatecolumn ? truncate(displayValue ?? '') : displayValue ?? '-'}
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
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>‹</Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>›</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Smart Edge-Aware Tooltip ── */}
      {tooltip && (
        <div
          className="fixed bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg pointer-events-none break-words"
          style={{
            ...(tooltip.flipUp ? { bottom: window.innerHeight - tooltip.y, top: 'auto' } : { top: tooltip.y, bottom: 'auto' }),
            left: tooltip.x,
            zIndex: 99999,
            maxWidth: '280px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {tooltip.value}
        </div>
      )}

      {/* ── Approval Flow Modal ── */}
      {approvalCustomer && (
        <ApprovalFlowModal
          customer={approvalCustomer}
          usersMap={usersMap}
          onClose={() => setApprovalCustomer(null)}
        />
      )}
    </div>
  );
};

export default PendingCustomerList;

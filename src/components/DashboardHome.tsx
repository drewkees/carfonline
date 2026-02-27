import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Maximize2, Undo2, X, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemSettings } from './SystemSettings/SystemSettingsContext';

interface DashboardHomeProps {
  userId: string | null;
  totalNotifications: number;
  unreadNotifications: number;
  notifications: any[];
  onOpenCustomerByGencode?: (gencode: string) => void | Promise<void>;
  onNotificationClick?: (notification: any) => void | Promise<void>;
  onNavigateTab?: (tab: string) => void;
}

type Counts = {
  forApproval: number;
  unsubmitted: number;
  approved: number;
  pending: number;
  returned: number;
  cancelled: number;
};

type CustomerItem = {
  id: string;
  status: string;
  soldToParty: string;
  gencode: string;
  dateCreated: string;
};

const DashboardHome: React.FC<DashboardHomeProps> = ({
  userId,
  notifications,
  onOpenCustomerByGencode,
  onNotificationClick,
  onNavigateTab,
}) => {
  const { customerSource, sheetId, sheetApiKey, sheetRange } = useSystemSettings();
  const [loading, setLoading] = useState(true);
  const [isApprover, setIsApprover] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    forApproval: 0,
    unsubmitted: 0,
    approved: 0,
    pending: 0,
    returned: 0,
    cancelled: 0,
  });
  const [customerList, setCustomerList] = useState<CustomerItem[]>([]);
  const [forApprovalList, setForApprovalList] = useState<CustomerItem[]>([]);
  const [hoveredMix, setHoveredMix] = useState<string | null>(null);
  const [showMixModal, setShowMixModal] = useState(false);

  const cards = useMemo(() => {
    const topCards = [];
    if (isApprover) {
      topCards.push({
        label: 'For Approval',
        value: counts.forApproval,
        icon: Clock3,
        className: 'bg-slate-50 border-slate-200 text-slate-700',
        tab: 'forapproval',
      });
    }
    topCards.push(
      {
        label: 'Approved Customers',
        value: counts.approved,
        icon: CheckCircle2,
        className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        tab: 'approved',
      },
      {
        label: 'Pending Customers',
        value: counts.pending,
        icon: Clock3,
        className: 'bg-amber-50 border-amber-200 text-amber-700',
        tab: 'pending',
      },
      {
        label: 'Returned Customers',
        value: counts.returned,
        icon: Undo2,
        className: 'bg-orange-50 border-orange-200 text-orange-700',
        tab: 'returntomaker',
      },
      {
        label: 'Cancelled Customers',
        value: counts.cancelled,
        icon: XCircle,
        className: 'bg-rose-50 border-rose-200 text-rose-700',
        tab: 'cancelled',
      }
    );
    return topCards;
  }, [counts, isApprover]);

  const latestNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);
  const forApprovalTotal = counts.forApproval;
  const mixItems = useMemo(
    () => [
      { label: 'Unsubmitted', value: counts.unsubmitted, color: '#64748b' },
      { label: 'Pending', value: counts.pending, color: '#f59e0b' },
      { label: 'Approved', value: counts.approved, color: '#10b981' },
      { label: 'Cancelled', value: counts.cancelled, color: '#f43f5e' },
      { label: 'Return to maker', value: counts.returned, color: '#f97316' },
    ],
    [counts]
  );

  const mixTotal = useMemo(
    () => counts.unsubmitted + counts.pending + counts.approved + counts.cancelled + counts.returned,
    [counts]
  );

  const mixSegments = useMemo(() => {
    const safeTotal = Math.max(1, mixTotal);
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return mixItems.map((item) => {
      const length = (item.value / safeTotal) * circumference;
      const segment = {
        ...item,
        radius,
        circumference,
        length,
        offset,
      };
      offset += length;
      return segment;
    });
  }, [mixItems, mixTotal]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: userData } = await supabase
          .from('users')
          .select('allaccess, allcompanyaccess, company, approver')
          .eq('userid', userId)
          .single();

        const hasAllAccess = userData?.allaccess || false;
        const hasAllCompanyAccess = userData?.allcompanyaccess || false;
        const userCompany = (userData?.company || '').trim().toUpperCase();
        const userIsApprover = !!userData?.approver;
        setIsApprover(userIsApprover);

        let rows: any[] = [];

        if (customerSource === 'PROD') {
          const { data } = await supabase
            .from('customerdata')
            .select('approvestatus, maker, company, soldtoparty, fullname, gencode, datecreated, nextapprover');
          rows = data || [];
        } else {
          if (!sheetId || !sheetApiKey || !sheetRange) {
            setCounts({ forApproval: 0, unsubmitted: 0, approved: 0, pending: 0, returned: 0, cancelled: 0 });
            setCustomerList([]);
            setForApprovalList([]);
            return;
          }

          const res = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?key=${sheetApiKey}`
          );
          const result = await res.json();
          if (!result.values || result.values.length === 0) {
            setCounts({ forApproval: 0, unsubmitted: 0, approved: 0, pending: 0, returned: 0, cancelled: 0 });
            setCustomerList([]);
            setForApprovalList([]);
            return;
          }

          const [headers, ...sheetRows] = result.values;
          rows = sheetRows.map((row: string[]) => {
            const obj: Record<string, string | null> = {};
            headers.forEach((h: string, i: number) => {
              obj[h] = row[i] ?? null;
            });
            return obj;
          });
        }

        let filtered = [...rows];

        if (!hasAllCompanyAccess && userCompany) {
          filtered = filtered.filter(
            (r) => (r.company || '').toString().trim().toUpperCase() === userCompany
          );
        }

        if (!hasAllAccess) {
          filtered = filtered.filter((r) => (r.maker || '').toString() === userId);
        }

        const parseApprovers = (value: any) =>
          (value || '')
            .toString()
            .split(',')
            .map((v: string) => v.trim())
            .filter(Boolean);

        const pendingForThisApprover = filtered.filter((row) => {
          const status = (row.approvestatus || '').toString().trim().toUpperCase();
          if (status !== 'PENDING') return false;
          if (!userIsApprover) return false;
          const approvers = parseApprovers(row.nextapprover);
          return approvers.includes((userId || '').toString());
        });

        const nextCounts = filtered.reduce(
          (acc, row) => {
            const status = (row.approvestatus || '').toString().trim().toUpperCase();
            if (status === 'APPROVED') acc.approved += 1;
            else if (status === 'PENDING') acc.pending += 1;
            else if (status === 'RETURN TO MAKER') acc.returned += 1;
            else if (status === 'CANCELLED') acc.cancelled += 1;
            else if (!status) acc.unsubmitted += 1;
            return acc;
          },
          {
            forApproval: pendingForThisApprover.length,
            unsubmitted: 0,
            approved: 0,
            pending: 0,
            returned: 0,
            cancelled: 0,
          } as Counts
        );

        setCounts(nextCounts);

        const mapped = filtered
          .map((row, idx) => ({
            id: (row.gencode || row['#'] || `row-${idx}`).toString(),
            status: (row.approvestatus || 'NOT SUBMITTED').toString(),
            soldToParty: (row.soldtoparty || row.fullname || row.company || '-').toString(),
            gencode: (row.gencode || '-').toString(),
            dateCreated: (row.datecreated || '').toString(),
          }))
          .sort((a, b) => new Date(b.dateCreated || 0).getTime() - new Date(a.dateCreated || 0).getTime())
          .slice(0, 12);

        setCustomerList(mapped);

        const forApprovalMapped = pendingForThisApprover
          .map((row, idx) => ({
            id: (row.gencode || row['#'] || `for-approval-${idx}`).toString(),
            status: (row.approvestatus || 'PENDING').toString(),
            soldToParty: (row.soldtoparty || row.fullname || row.company || '-').toString(),
            gencode: (row.gencode || '-').toString(),
            dateCreated: (row.datecreated || '').toString(),
          }))
          .sort((a, b) => new Date(b.dateCreated || 0).getTime() - new Date(a.dateCreated || 0).getTime())
          .slice(0, 12);

        setForApprovalList(forApprovalMapped);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [userId, customerSource, sheetId, sheetApiKey, sheetRange]);

  const renderMixChart = (size: number) => {
    const hoveredItem = mixItems.find((item) => item.label === hoveredMix);
    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g transform="rotate(-90 50 50)">
              <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(var(--muted) / 0.35)" strokeWidth="16" />
              {mixSegments.map((segment) => (
                <circle
                  key={segment.label}
                  cx="50"
                  cy="50"
                  r={segment.radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={hoveredMix === segment.label ? 19 : 16}
                  strokeDasharray={`${Math.max(segment.length, 0)} ${segment.circumference}`}
                  strokeDashoffset={-segment.offset}
                  strokeLinecap="butt"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredMix(segment.label)}
                  onMouseLeave={() => setHoveredMix(null)}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-7 rounded-full bg-card border border-border flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {loading ? '...' : hoveredItem ? hoveredItem.value.toLocaleString() : mixTotal.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{hoveredItem ? hoveredItem.label : 'Total'}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 h-7 flex items-center justify-center">
          <div
            className={`rounded-md border border-border px-2 py-1 text-xs text-foreground bg-muted/30 transition-opacity ${
              hoveredItem ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {hoveredItem ? `${hoveredItem.label}: ${hoveredItem.value.toLocaleString()}` : ' '}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-auto p-2 md:p-4 custom-scrollbar relative">
      <div className="mb-3 rounded-xl border border-border bg-card px-4 py-3 md:px-4 md:py-3 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold text-foreground leading-tight">Dashboard</h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Overview of customer request statuses
        </p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isApprover ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-3 md:gap-4`}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              type="button"
              key={card.label}
              onClick={() => onNavigateTab?.(card.tab)}
              className={`rounded-xl border p-3 md:p-4 shadow-sm bg-white ${card.className}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm font-medium">{card.label}</p>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-bold mt-2 md:mt-3">
                {loading ? '...' : card.value.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden md:h-[430px] flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">Customer List</h3>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => onNavigateTab?.('customer-list')}
              >
                See all
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            {customerList.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No customer data</div>
            ) : (
              <>
                <div className="md:hidden divide-y divide-border">
                  {customerList.map((item) => (
                    <div key={`m-${item.id}`} className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground truncate">{item.soldToParty}</p>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          className="text-primary hover:underline font-medium truncate"
                          onClick={() => onOpenCustomerByGencode?.(item.gencode)}
                        >
                          {item.gencode || '-'}
                        </button>
                        <span className="text-muted-foreground truncate">{item.status}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.dateCreated ? new Date(item.dateCreated).toLocaleString() : '-'}
                      </p>
                    </div>
                  ))}
                </div>
                <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">CARF No</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customerList.map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="py-3 px-4 text-foreground">{item.soldToParty}</td>
                      <td className="py-3 px-4 text-foreground">
                        {item.gencode && item.gencode !== '-' ? (
                          <button
                            type="button"
                            className="text-primary hover:underline font-medium"
                            onClick={() => onOpenCustomerByGencode?.(item.gencode)}
                          >
                            {item.gencode}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-foreground">{item.status}</td>
                      <td className="py-3 px-4 text-foreground">
                        {item.dateCreated ? new Date(item.dateCreated).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden md:h-[430px] flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-base font-semibold text-foreground">For Approval</h3>
          </div>
          <div className="p-4 flex-1 overflow-auto custom-scrollbar">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
              <p className="text-xs text-muted-foreground">Total Pending For You</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {loading ? '...' : forApprovalTotal.toLocaleString()}
              </p>
            </div>
            <div className="divide-y divide-border">
              {!isApprover ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Available for approver accounts only
                </div>
              ) : forApprovalList.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No pending approvals
                </div>
              ) : (
                forApprovalList.map((item) => (
                  <div key={`fa-${item.id}`} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{item.soldToParty}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.gencode}</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline shrink-0"
                      onClick={() => onOpenCustomerByGencode?.(item.gencode)}
                    >
                      Open
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden md:h-[430px] flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">Customer Chart</h3>
              <button
                type="button"
                onClick={() => setShowMixModal(true)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                aria-label="Expand customer chart"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col items-center overflow-auto custom-scrollbar">
            {renderMixChart(window.innerWidth < 768 ? 148 : 176)}
            <div className="w-full mt-4 space-y-2 text-sm">
              {mixItems.map((item) => (
                <div key={`mix-${item.label}`} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{loading ? '...' : item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden md:h-[430px] flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-base font-semibold text-foreground">Notification Summary</h3>
          </div>
          <div className="divide-y divide-border flex-1 overflow-auto custom-scrollbar">
            {latestNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No recent activity</div>
            ) : (
              latestNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onNotificationClick?.(n)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{n.title || '-'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.message || '-'}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{n.notification_type || 'OTHER'}</span>
                    <span>{n.created_at ? new Date(n.created_at).toLocaleString() : '-'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {showMixModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto custom-scrollbar rounded-xl border border-border bg-card shadow-lg">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Customer Chart</h3>
              <button
                type="button"
                onClick={() => setShowMixModal(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                aria-label="Close chart modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 md:p-6 flex flex-col items-center">
              {renderMixChart(window.innerWidth < 768 ? 220 : 320)}
              <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {mixItems.map((item) => (
                  <div key={`mix-modal-${item.label}`} className="flex items-center justify-between rounded border border-border px-3 py-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">{loading ? '...' : item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;

import React, { useState, useEffect } from 'react';

interface ApprovalFlowModalProps {
  customer: any;
  onClose: () => void;
  usersMap?: Record<string, string>;
}

const ApprovalFlowModal: React.FC<ApprovalFlowModalProps> = ({ customer, onClose, usersMap = {} }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const status = (customer.approvestatus || '').toUpperCase();
  const isApproved = status === 'APPROVED';
  const isCancelled = status === 'CANCELLED';
  const isReturned = status === 'RETURN TO MAKER';

  const steps = [
    {
      key: 'maker',
      label: 'Request Created',
      role: 'Maker',
      person: usersMap[customer.maker] || customer.maker || '—',
      date: customer.datecreated || null,
      done: true,
      active: false,
    },
    {
      key: 'firstapprover',
      label: 'Initial Review',
      role: '1st Approver',
      person: customer.firstapprovername || usersMap[customer.initialapprover] || customer.initialapprover || '—',
      date: customer.initialapprovedate || null,
      done: !!(customer.initialapprover && customer.initialapprovedate),
      active: !!(customer.initialapprover && !customer.secondapproverdate && status === 'PENDING'),
    },
    {
      key: 'secondapprover',
      label: 'Secondary Review',
      role: '2nd Approver',
      person: customer.secondapprovername || usersMap[customer.secondapprover] || customer.secondapprover || '—',
      date: customer.secondapproverdate || null,
      done: !!(customer.secondapprover && customer.secondapproverdate),
      active: !!(customer.initialapprovedate && !customer.secondapproverdate && status === 'PENDING'),
    },
    {
      key: 'thirdapprover',
      label: 'Final Approval',
      role: '3rd Approver',
      person: customer.finalapprovername || usersMap[customer.thirdapprover] || customer.thirdapprover || '—',
      date: customer.thirdapproverdate || null,
      done: !!(customer.thirdapprover && customer.thirdapproverdate) || isApproved,
      active: !!(customer.secondapproverdate && !customer.thirdapproverdate && status === 'PENDING'),
    },
  ];

  const statusLabel = isApproved ? 'Approved' : isCancelled ? 'Cancelled' : isReturned ? 'Returned' : 'Pending';
  const statusCls = isApproved
    ? 'bg-green-500 text-white'
    : isCancelled
    ? 'bg-red-500 text-white'
    : isReturned
    ? 'bg-yellow-500 text-black'
    : 'bg-muted text-muted-foreground border border-border';

  return (
    <>
      <style>{`
        .afm-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          opacity: 0; transition: opacity 0.2s ease;
        }
        .afm-overlay.visible { opacity: 1; }

        .afm-panel {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          width: 100%;
          max-width: 860px;
          max-height: 92vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(10px);
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease;
          opacity: 0;
        }
        .afm-overlay.visible .afm-panel {
          transform: translateY(0); opacity: 1;
        }

        /* ── Header ── */
        .afm-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          flex-shrink: 0;
        }
        .afm-header-row {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
        }
        .afm-record-id {
          font-size: 12px; color: hsl(var(--muted-foreground));
          margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em;
        }
        .afm-title {
          font-size: 20px; font-weight: 700;
          color: hsl(var(--foreground));
          line-height: 1.25;
        }
        .afm-close {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
          background: hsl(var(--muted)); border: 1px solid hsl(var(--border));
          color: hsl(var(--muted-foreground)); font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s; margin-top: 2px;
        }
        .afm-close:hover {
          background: hsl(var(--accent)); color: hsl(var(--accent-foreground));
        }
        .afm-tags {
          display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center;
        }
        .afm-tag-muted {
          font-size: 12px; padding: 3px 10px; border-radius: 5px;
          background: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
          border: 1px solid hsl(var(--border));
        }

        /* ── Body ── */
        .afm-body {
          padding: 28px;
          overflow-y: auto; flex: 1;
        }
        .afm-body::-webkit-scrollbar { width: 5px; }
        .afm-body::-webkit-scrollbar-thumb {
          background: hsl(var(--border)); border-radius: 3px;
        }

        /* Summary cards row */
        .afm-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }
        .afm-summary-card {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 8px; padding: 12px 14px;
        }
        .afm-summary-lbl {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground)); margin-bottom: 4px;
        }
        .afm-summary-val {
          font-size: 14px; font-weight: 600; color: hsl(var(--foreground));
        }

        /* Section divider */
        .afm-divider-row {
          display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
        }
        .afm-divider-label {
          font-size: 13px; font-weight: 600; color: hsl(var(--muted-foreground));
          white-space: nowrap;
        }
        .afm-divider-line { flex: 1; height: 1px; background: hsl(var(--border)); }

        /* ── Flowchart ── */
        .afm-flow {
          display: flex; align-items: stretch; gap: 0;
          overflow-x: auto; padding-bottom: 8px;
        }
        .afm-flow::-webkit-scrollbar { height: 5px; }
        .afm-flow::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }

        .afm-step-unit {
          display: flex; align-items: center; flex: 1; min-width: 0;
          opacity: 0; animation: afmSlideIn 0.3s ease forwards;
        }
        .afm-step-unit:nth-child(1) { animation-delay: 0.05s; }
        .afm-step-unit:nth-child(2) { animation-delay: 0.12s; }
        .afm-step-unit:nth-child(3) { animation-delay: 0.19s; }
        .afm-step-unit:nth-child(4) { animation-delay: 0.26s; }
        @keyframes afmSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .afm-node {
          flex: 1; min-width: 140px; max-width: 200px;
          border: 1.5px solid hsl(var(--border));
          border-radius: 10px;
          background: hsl(var(--card));
          overflow: hidden;
          display: flex; flex-direction: column;
        }
        .afm-node.done {
          border-color: #22c55e;
        }
        .afm-node.active {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.08);
          animation: afmPulse 2s ease-in-out infinite;
        }
        .afm-node.cancelled {
          border-color: #ef4444; opacity: 0.65;
        }
        .afm-node.waiting { opacity: 0.45; }

        @keyframes afmPulse {
          0%,100% { box-shadow: 0 0 0 4px hsl(var(--primary) / 0.08); }
          50%      { box-shadow: 0 0 0 7px hsl(var(--primary) / 0.04); }
        }

        /* Colored top stripe */
        .afm-stripe { height: 4px; }
        .afm-stripe.done     { background: #22c55e; }
        .afm-stripe.active   { background: hsl(var(--primary)); }
        .afm-stripe.waiting  { background: hsl(var(--border)); }
        .afm-stripe.cancelled{ background: #ef4444; }

        .afm-node-body { padding: 14px 14px 12px; flex: 1; display: flex; flex-direction: column; }

        .afm-step-label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
          color: hsl(var(--muted-foreground)); margin-bottom: 6px;
        }
        .afm-step-title {
          font-size: 15px; font-weight: 700; color: hsl(var(--foreground));
          line-height: 1.3; margin-bottom: 2px;
        }
        .afm-step-role {
          font-size: 12px; color: hsl(var(--muted-foreground)); margin-bottom: 12px;
        }

        .afm-node-hr { height: 1px; background: hsl(var(--border)); margin-bottom: 10px; }

        .afm-step-person {
          font-size: 14px; font-weight: 600; color: hsl(var(--foreground));
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin-bottom: 3px;
        }
        .afm-step-person.empty {
          font-size: 13px; font-weight: 400;
          color: hsl(var(--muted-foreground)); font-style: italic;
        }
        .afm-step-date {
          font-size: 12px; color: hsl(var(--muted-foreground));
        }

        .afm-node-footer { margin-top: auto; padding-top: 10px; }
        .afm-status-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 5px;
          font-size: 12px; font-weight: 500;
        }
        .afm-status-chip.done     { background: rgba(34,197,94,0.12); color: #15803d; }
        .afm-status-chip.active   { background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); }
        .afm-status-chip.waiting  { background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); }
        .afm-status-chip.cancelled{ background: rgba(239,68,68,0.1); color: #dc2626; }

        .afm-chip-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .afm-chip-dot.blink { animation: afmBlink 1.4s ease-in-out infinite; }
        @keyframes afmBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }

        /* Arrow */
        .afm-arrow {
          flex-shrink: 0; width: 32px;
          display: flex; align-items: center; justify-content: center;
          color: hsl(var(--border));
        }
        .afm-arrow.done { color: #22c55e; }

        /* Outcome */
        .afm-outcome {
          margin-top: 24px;
          border: 1.5px solid hsl(var(--border));
          border-radius: 10px; padding: 16px 20px;
          display: flex; align-items: center; gap: 14px;
          background: hsl(var(--card));
          opacity: 0; animation: afmSlideIn 0.3s 0.35s ease forwards;
        }
        .afm-outcome.approved { border-color: #22c55e; background: rgba(34,197,94,0.05); }
        .afm-outcome.cancelled { border-color: #ef4444; background: rgba(239,68,68,0.05); }
        .afm-outcome.returned  { border-color: #f59e0b; background: rgba(245,158,11,0.05); }

        .afm-outcome-icon {
          font-size: 24px; flex-shrink: 0;
        }
        .afm-outcome-title {
          font-size: 15px; font-weight: 700; color: hsl(var(--foreground));
        }
        .afm-outcome-sub {
          font-size: 13px; color: hsl(var(--muted-foreground)); margin-top: 2px;
        }

        /* Remarks */
        .afm-remarks {
          margin-top: 16px;
          border: 1px solid hsl(var(--border));
          border-left: 4px solid #f59e0b;
          border-radius: 0 8px 8px 0;
          padding: 14px 16px;
          background: hsl(var(--card));
          opacity: 0; animation: afmSlideIn 0.3s 0.4s ease forwards;
        }
        .afm-remarks-lbl {
          font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;
          color: #b45309; margin-bottom: 6px; font-weight: 600;
        }
        .afm-remarks-txt {
          font-size: 14px; color: hsl(var(--foreground)); line-height: 1.6;
        }
      `}</style>

      <div className={`afm-overlay ${visible ? 'visible' : ''}`} onClick={handleClose}>
        <div className="afm-panel" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="afm-header">
            <div className="afm-header-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="afm-record-id">
                  Approval Workflow &nbsp;/&nbsp; {customer.carfno || `Record #${customer['#'] || customer.id}`}
                </div>
                <div className="afm-title">
                  {(() => {
                    const isMother = Array.isArray(customer.ismother)
                      ? String(customer.ismother[0] || '').trim().toUpperCase()
                      : String(customer.ismother || '').trim().toUpperCase();
                    if (isMother === 'SHIP TO PARTY') return customer.shiptoparty || customer.soldtoparty || 'Customer Form';
                    return customer.soldtoparty || customer.customername || 'Customer Form';
                  })()}
                </div>
              </div>
              <button className="afm-close" onClick={handleClose}>✕</button>
            </div>
            <div className="afm-tags">
              <span className={`px-3 py-1 rounded-md text-sm font-semibold ${statusCls}`}>
                {statusLabel}
              </span>
              {customer.requestfor && (
                <span className="afm-tag-muted">{customer.requestfor}</span>
              )}
              {customer.custtype && (
                <span className="afm-tag-muted">{customer.custtype}</span>
              )}
              {customer.company && (
                <span className="afm-tag-muted">{customer.company}</span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="afm-body">

            {/* Summary */}
            <div className="afm-summary">
              <div className="afm-summary-card">
                <div className="afm-summary-lbl">Maker</div>
                <div className="afm-summary-val">
                  {usersMap[customer.maker] || customer.maker || '—'}
                </div>
              </div>
              <div className="afm-summary-card">
                <div className="afm-summary-lbl">Date Submitted</div>
                <div className="afm-summary-val">{customer.datecreated || '—'}</div>
              </div>
              {customer.bucenter && (
                <div className="afm-summary-card">
                  <div className="afm-summary-lbl">Business Center</div>
                  <div className="afm-summary-val">{customer.bucenter}</div>
                </div>
              )}
              {customer.saletype && (
                <div className="afm-summary-card">
                  <div className="afm-summary-lbl">Sale Type</div>
                  <div className="afm-summary-val">{customer.saletype}</div>
                </div>
              )}
            </div>

            <div className="afm-divider-row">
              <span className="afm-divider-label">Approval Steps</span>
              <div className="afm-divider-line" />
            </div>

            {/* Flowchart */}
            <div className="afm-flow">
              {steps.map((step, i) => {
                const cls = isCancelled
                  ? 'cancelled'
                  : step.done ? 'done'
                  : step.active ? 'active'
                  : 'waiting';

                const isEmpty = step.person === '—' && !step.date;

                return (
                  <div className="afm-step-unit" key={step.key}>
                    <div className={`afm-node ${cls}`}>
                      <div className={`afm-stripe ${cls}`} />
                      <div className="afm-node-body">
                        <div className="afm-step-label">Step {i + 1}</div>
                        <div className="afm-step-title">{step.label}</div>
                        <div className="afm-step-role">{step.role}</div>
                        <div className="afm-node-hr" />
                        <div className={`afm-step-person ${isEmpty && !step.active ? 'empty' : ''}`}>
                          {step.person !== '—'
                            ? step.person
                            : step.active
                            ? 'Awaiting approval'
                            : 'Not assigned'}
                        </div>
                        {step.date && (
                          <div className="afm-step-date">{step.date}</div>
                        )}
                        <div className="afm-node-footer">
                          <div className={`afm-status-chip ${cls}`}>
                            <div
                              className={`afm-chip-dot ${step.active && !isCancelled ? 'blink' : ''}`}
                              style={{
                                background: cls === 'done' ? '#22c55e'
                                  : cls === 'active' ? 'hsl(var(--primary))'
                                  : cls === 'cancelled' ? '#ef4444'
                                  : 'hsl(var(--muted-foreground))',
                              }}
                            />
                            {cls === 'done' && !isCancelled
                              ? 'Completed'
                              : cls === 'active'
                              ? 'In Progress'
                              : cls === 'cancelled'
                              ? 'Cancelled'
                              : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {i < steps.length - 1 && (
                      <div className={`afm-arrow ${step.done && !isCancelled ? 'done' : ''}`}>
                        <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
                          <path
                            d="M0 7H21M21 7L14 1M21 7L14 13"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Outcome */}
            {isApproved && (
              <div className="afm-outcome approved">
                <div className="afm-outcome-icon">✅</div>
                <div>
                  <div className="afm-outcome-title" style={{ color: '#15803d' }}>Fully Approved</div>
                  <div className="afm-outcome-sub">Form has been submitted to the BOS system.</div>
                </div>
              </div>
            )}
            {isCancelled && (
              <div className="afm-outcome cancelled">
                <div className="afm-outcome-icon">🚫</div>
                <div>
                  <div className="afm-outcome-title" style={{ color: '#dc2626' }}>Request Cancelled</div>
                  <div className="afm-outcome-sub">This form has been cancelled and is no longer active.</div>
                </div>
              </div>
            )}
            {isReturned && (
              <div className="afm-outcome returned">
                <div className="afm-outcome-icon">↩</div>
                <div>
                  <div className="afm-outcome-title" style={{ color: '#b45309' }}>Returned to Maker</div>
                  <div className="afm-outcome-sub">Awaiting revision and resubmission from the maker.</div>
                </div>
              </div>
            )}

            {/* Remarks */}
            {customer.remarks && (
              <div className="afm-remarks">
                <div className="afm-remarks-lbl">Remarks / Return Notes</div>
                <div className="afm-remarks-txt">{customer.remarks}</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalFlowModal;
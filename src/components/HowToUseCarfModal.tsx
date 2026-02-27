import React, { useState } from 'react';
import { ClipboardList, Maximize2, X } from 'lucide-react';

const HowToUseCarfModal: React.FC = () => {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [expandedStep, setExpandedStep] = useState<{ title: string; desc: string; kind: string } | null>(null);

  const steps = [
    {
      title: 'Step 1: Login (Verified Email)',
      desc: 'Sign in using your verified company email address.',
      kind: 'login',
    },
    {
      title: 'Step 2: Customer List',
      desc: 'View CARF records, search customers, and open a record from CARF No.',
      kind: 'list',
    },
    {
      title: 'Step 3: Customer Form',
      desc: 'Complete required fields and save/submit customer request details.',
      kind: 'form',
    },
    {
      title: 'Step 4: Upload Required Attachment',
      desc: 'Upload required supporting documents before final submission.',
      kind: 'attachment',
    },
    {
      title: 'Step 5: Submit',
      desc: 'Submit the completed CARF to send it to the approval queue.',
      kind: 'submit',
    },
    {
      title: 'Step 6: Wait for Approval',
      desc: 'Wait while your customer request is being reviewed and approved.',
      kind: 'approval',
    },
  ];

  const renderStepMock = (step: { kind: string }, large = false) => (
    <div className={`w-full ${large ? 'h-60' : 'h-32'} bg-[#2f3743] border-b border-[#3f4a59] p-2`}>
      <div className="carf-mock-screen h-full rounded border border-[#4d5a6d] bg-[#394452] p-2 flex flex-col">
        {step.kind === 'login' && (
          <>
            <div className="text-[9px] font-semibold text-[#f8c40f] border-b border-[#4d5a6d] pb-1 mb-1">
              LOGIN - VERIFIED EMAIL
            </div>
            <div className="bg-[#e5e7eb] rounded p-2 space-y-1">
              <div className="h-2 bg-white rounded w-full" />
              <div className="h-2 bg-white rounded w-4/5" />
              <div className="mt-1 flex justify-end">
                <div className="text-[8px] rounded bg-[#334155] text-white px-2 py-1">Continue with Google</div>
              </div>
            </div>
          </>
        )}

        {step.kind === 'list' && (
          <>
            <div className="flex items-center justify-between text-[9px] text-[#f8c40f] border-b border-[#4d5a6d] pb-1 mb-1">
              <span className="font-semibold">CUSTOMER LIST</span>
              <span className="carf-new-btn-wrap">
                <svg viewBox="0 0 24 24" className="carf-cursor-new-btn" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 3L18 12L11 13.5L9 20L4 3Z" fill="#f8c40f" stroke="#1f2937" strokeWidth="1.5" />
                </svg>
                <span className="carf-new-btn bg-[#ff0066] text-white px-1.5 py-0.5 rounded">+ NEW</span>
              </span>
            </div>
            <div className="rounded border border-[#56657a] overflow-hidden">
              <div className="grid grid-cols-4 text-[8px] bg-[#465466] text-slate-200 px-1 py-0.5">
                <span>CARF NO.</span><span>REQUEST</span><span>SOLD TO</span><span>STATUS</span>
              </div>
              {['CARF-000000076', 'CARF-000000073', 'CARF-000000072'].map((c, i) => (
                <div key={c} className="grid grid-cols-4 text-[8px] text-slate-100 px-1 py-0.5 border-t border-[#4d5a6d]">
                  <span className="truncate">{c}</span>
                  <span>ACTIVATION</span>
                  <span className="truncate">{i === 0 ? 'ABC CORP' : i === 1 ? 'TEST' : 'TESTFARN'}</span>
                  <span className={i === 0 ? 'text-amber-300' : 'text-green-300'}>{i === 0 ? 'PENDING' : 'APPROVED'}</span>
                </div>
              ))}
            </div>
            <div className="carf-open-form-panel">
              <div className="text-[7px] font-semibold text-slate-700 mb-1">OPEN CUSTOMER FORM</div>
              <div className="h-1.5 bg-white rounded w-5/6" />
              <div className="h-1.5 bg-white rounded w-full mt-1" />
            </div>
          </>
        )}

        {step.kind === 'form' && (
          <>
            <div className="text-[9px] font-semibold text-[#f8c40f] border-b border-[#4d5a6d] pb-1 mb-1">
              CUSTOMER ACTIVATION REQUEST FORM
            </div>
            <div className="bg-[#e5e7eb] text-[8px] text-slate-800 rounded p-1 overflow-hidden">
              <div className="carf-scroll-area space-y-1">
                <div className="carf-type-line" />
                <div className="grid grid-cols-2 gap-1">
                  <div className="h-2 bg-white rounded" />
                  <div className="h-2 bg-white rounded" />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-2 bg-white rounded" />
                  <div className="h-2 bg-white rounded" />
                  <div className="h-2 bg-white rounded" />
                </div>
                <div className="h-2 bg-white rounded w-full" />
                <div className="h-2 bg-white rounded w-2/3" />
                <div className="h-2 bg-white rounded w-4/5" />
              </div>
            </div>
          </>
        )}

        {step.kind === 'attachment' && (
          <>
            <div className="text-[9px] font-semibold text-[#f8c40f] border-b border-[#4d5a6d] pb-1 mb-1">
              SUPPORTING DOCUMENTS
            </div>
            <div className="bg-[#e5e7eb] rounded p-1.5 space-y-1">
              <div className="h-2 bg-white rounded w-full" />
              <div className="h-1 bg-[#3b82f6] rounded w-1/3" />
              <div className="rounded bg-[#d1fae5] border border-[#86efac] px-1 py-0.5 text-[7px] text-emerald-700">
                BIR Business Registration - 1 file uploaded
              </div>
              <div className="rounded bg-white border border-slate-300 px-1 py-0.5 text-[7px] text-slate-600">
                SEC Registration - Upload
              </div>
              <div className="rounded bg-white border border-slate-300 px-1 py-0.5 text-[7px] text-slate-600">
                Board Resolution - Upload
              </div>
            </div>
          </>
        )}

        {step.kind === 'submit' && (
          <>
            <div className="text-[9px] font-semibold text-[#f8c40f] border-b border-[#4d5a6d] pb-1 mb-1">
              SUBMIT CUSTOMER REQUEST
            </div>
            <div className="bg-[#e5e7eb] rounded p-2">
              <div className="text-[8px] text-slate-700">All required fields are complete.</div>
              <div className="mt-2 flex items-center justify-end">
                <div className="carf-submit-btn-wrap">
                  <svg viewBox="0 0 24 24" className="carf-cursor-submit-btn" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 3L18 12L11 13.5L9 20L4 3Z" fill="#f8c40f" stroke="#1f2937" strokeWidth="1.5" />
                  </svg>
                  <div className="carf-submit-btn text-[8px] rounded bg-green-600 text-white px-2 py-1">Submit</div>
                </div>
              </div>
              <div className="mt-1 flex justify-end">
                <div className="carf-submit-done text-[7px] rounded bg-emerald-100 text-emerald-700 px-1.5 py-0.5">
                  Submitted
                </div>
              </div>
            </div>
          </>
        )}

        {step.kind === 'approval' && (
          <>
            <div className="flex-1 bg-black/45 rounded flex items-center justify-center">
              <div className="w-[78%] rounded bg-white p-2 text-center">
                <div className="text-[9px] font-semibold text-slate-800">Waiting for Approval</div>
                <div className="text-[8px] text-slate-500 mt-1">Your request is in queue and currently under review.</div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <div className="text-[8px] rounded bg-amber-100 text-amber-700 py-1">Status: Pending</div>
                  <div className="text-[8px] rounded bg-slate-200 text-slate-700 py-1">Notify Me</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes carfStepEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes carfCursorOnButton {
          0% { transform: translate(-18px, -8px) scale(1); opacity: 0; }
          15% { opacity: 1; }
          50% { transform: translate(-2px, -2px) scale(1); opacity: 1; }
          62% { transform: translate(-2px, -2px) scale(0.82); opacity: 1; }
          76% { transform: translate(-2px, -2px) scale(1); opacity: 1; }
          100% { transform: translate(-2px, -2px) scale(1); opacity: 0; }
        }
        @keyframes carfNewPulse {
          0%, 20% { box-shadow: 0 0 0 rgba(255, 0, 102, 0); }
          45%, 70% { box-shadow: 0 0 0 3px rgba(255, 0, 102, 0.35); }
          100% { box-shadow: 0 0 0 rgba(255, 0, 102, 0); }
        }
        @keyframes carfOpenFormPanel {
          0%, 58% { opacity: 0; transform: translateY(8px); }
          70%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes carfTyping {
          0% { width: 6%; }
          45% { width: 76%; }
          100% { width: 76%; }
        }
        @keyframes carfScrollDown {
          0%, 35% { transform: translateY(0); }
          70%, 100% { transform: translateY(-22px); }
        }
        @keyframes carfSubmitClick {
          0%, 50% { transform: scale(1); filter: brightness(1); }
          60% { transform: scale(0.92); filter: brightness(1.15); }
          75%, 100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes carfSubmittedBadge {
          0%, 62% { opacity: 0; transform: translateY(4px); }
          75%, 100% { opacity: 1; transform: translateY(0); }
        }
        .carf-step-card {
          animation: carfStepEnter 280ms ease-out both;
        }
        .carf-mock-screen {
          position: relative;
          overflow: hidden;
        }
        .carf-new-btn-wrap { position: relative; display: inline-flex; }
        .carf-cursor-new-btn {
          position: absolute;
          left: 0;
          top: 0;
          width: 14px;
          height: 14px;
          pointer-events: none;
          animation: carfCursorOnButton 2.2s ease-in-out infinite;
          z-index: 2;
        }
        .carf-new-btn {
          animation: carfNewPulse 2.4s ease-in-out infinite;
        }
        .carf-open-form-panel {
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 58%;
          background: #e5e7eb;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 4px;
          animation: carfOpenFormPanel 2.4s ease-in-out infinite;
        }
        .carf-type-line {
          height: 8px;
          background: #ffffff;
          border-radius: 3px;
          animation: carfTyping 2.3s ease-in-out infinite;
        }
        .carf-scroll-area {
          animation: carfScrollDown 2.3s ease-in-out infinite;
        }
        .carf-submit-btn {
          animation: carfSubmitClick 1.9s ease-in-out infinite;
          transform-origin: center;
        }
        .carf-submit-btn-wrap { position: relative; display: inline-flex; }
        .carf-cursor-submit-btn {
          position: absolute;
          left: 0;
          top: 0;
          width: 14px;
          height: 14px;
          pointer-events: none;
          animation: carfCursorOnButton 1.9s ease-in-out infinite;
          z-index: 2;
        }
        .carf-submit-done {
          animation: carfSubmittedBadge 1.9s ease-in-out infinite;
        }
      `}</style>

      <button
        type="button"
        onClick={() => setShowGuideModal(true)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
      >
        <ClipboardList className="h-4 w-4 text-slate-700" />
        How to Use CARF
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto custom-scrollbar rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-700" />
                <h3 className="text-sm md:text-base font-semibold text-slate-800">How to Use CARF</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {steps.map((step, idx) => (
                <div
                  key={step.title}
                  className="carf-step-card relative rounded-lg border border-slate-200 bg-white overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <button
                    type="button"
                    aria-label={`Expand ${step.title}`}
                    onClick={() => setExpandedStep(step)}
                    className="absolute right-2 top-2 z-20 rounded border border-slate-300 bg-white/90 p-1 text-slate-700 hover:bg-white"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                  {renderStepMock(step)}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-800">{step.title}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {expandedStep && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto custom-scrollbar rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h4 className="text-sm md:text-base font-semibold text-slate-800">{expandedStep.title}</h4>
              <button
                type="button"
                onClick={() => setExpandedStep(null)}
                className="p-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                aria-label="Close expanded mockup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderStepMock(expandedStep, true)}
            <div className="p-4 text-sm text-slate-600">{expandedStep.desc}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default HowToUseCarfModal;

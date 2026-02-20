import React, { useRef, useState } from 'react';
import { CustomerFormData } from '@/hooks/useCustomerForm';

interface PrintableFormProps {
  formData: CustomerFormData;
  makerName: string;
  onClose: () => void;
  isVisible: boolean;
}

const PrintableCustomerForm: React.FC<PrintableFormProps> = ({ 
  formData, 
  makerName, 
  onClose, 
  isVisible 
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const handlePrint = () => {
    if (!componentRef.current) return;
    const formContent = componentRef.current.innerHTML;
    const docTitle = formData.gencode || 'CustomerForm';
    const styles = [
      '@page { size: 8.5in 13in; margin: 0.3in; }',
      '* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
      'body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 9.5pt; color: #000; line-height: 1.15; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
      '.underline-input { border: none; border-bottom: 1px solid #000; padding: 1px 5px; background: #D9EBD3 !important; outline: none; width: 100%; font-size: inherit; font-family: inherit; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
      '.text-sm { font-size: 0.85em; }',
      '.text-lg { font-size: 1.1em; }',
    ].join('\n');
    const html = [
      '<!DOCTYPE html><html><head>',
      '<meta charset="utf-8" />',
      '<title>' + docTitle + '</title>',
      '<style>' + styles + '</style>',
      '</head><body>',
      formContent,
      '<script>',
      'window.onload = function() {',
      '  window.print();',
      '  window.onafterprint = function() { window.close(); };',
      '};',
      '<' + '/script>',
      '</body></html>',
    ].join('\n');
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadPdf = async () => {
    if (!componentRef.current) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html:  componentRef.current.innerHTML,
          title: formData.gencode || 'CustomerForm',
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('[generate-pdf] Server response:', response.status, text);
        let err: { message?: string } = {};
        try { err = JSON.parse(text); } catch {}
        throw new Error(err.message || `Server error ${response.status}: ${text}`);
      }
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${formData.gencode || 'CustomerForm'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        /* ── Typewriter loader ─────────────────────────────────────── */
        .typewriter-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 99999; gap: 24px;
        }
        .typewriter-label {
          color: #fff; font-family: Arial, sans-serif;
          font-size: 14px; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9;
        }
        .typewriter {
          --blue: #5c86ff; --blue-dark: #1e0325; --key: #fff;
          --paper: #eef0fd; --text: #d3d4ec; --tool: #fbc56c; --duration: 3s;
          position: relative;
          animation: bounce05 var(--duration) linear infinite;
        }
        .typewriter .slide {
          width: 92px; height: 20px; border-radius: 3px;
          margin-left: 14px; transform: translateX(14px);
          background: linear-gradient(var(--blue), var(--blue-dark));
          animation: slide05 var(--duration) ease infinite;
        }
        .typewriter .slide:before, .typewriter .slide:after, .typewriter .slide i:before {
          content: ""; position: absolute; background: var(--tool);
        }
        .typewriter .slide:before { width: 2px; height: 8px; top: 6px; left: 100%; }
        .typewriter .slide:after  { left: 94px; top: 3px; height: 14px; width: 6px; border-radius: 3px; }
        .typewriter .slide i { display: block; position: absolute; right: 100%; width: 6px; height: 4px; top: 4px; background: var(--tool); }
        .typewriter .slide i:before { right: 100%; top: -2px; width: 4px; border-radius: 2px; height: 14px; }
        .typewriter .paper {
          position: absolute; left: 24px; top: -26px; width: 40px; height: 46px;
          border-radius: 5px; background: var(--paper); transform: translateY(46px);
          animation: paper05 var(--duration) linear infinite;
        }
        .typewriter .paper:before {
          content: ""; position: absolute; left: 6px; right: 6px; top: 7px;
          border-radius: 2px; height: 4px; transform: scaleY(0.8); background: var(--text);
          box-shadow: 0 12px 0 var(--text), 0 24px 0 var(--text), 0 36px 0 var(--text);
        }
        .typewriter .keyboard { width: 120px; height: 56px; margin-top: -10px; z-index: 1; position: relative; }
        .typewriter .keyboard:before, .typewriter .keyboard:after { content: ""; position: absolute; }
        .typewriter .keyboard:before {
          top: 0; left: 0; right: 0; bottom: 0; border-radius: 7px;
          background: linear-gradient(135deg, var(--blue), var(--blue-dark));
          transform: perspective(10px) rotateX(2deg); transform-origin: 50% 100%;
        }
        .typewriter .keyboard:after {
          left: 2px; top: 25px; width: 11px; height: 4px; border-radius: 2px;
          box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);
          animation: keyboard05 var(--duration) linear infinite;
        }
        @keyframes bounce05 {
          85%,92%,100% { transform: translateY(0); }
          89%           { transform: translateY(-4px); }
          95%           { transform: translateY(2px); }
        }
        @keyframes slide05 {
          5%       { transform: translateX(14px); }
          15%,30%  { transform: translateX(6px); }
          40%,55%  { transform: translateX(0); }
          65%,70%  { transform: translateX(-4px); }
          80%,89%  { transform: translateX(-12px); }
          100%     { transform: translateX(14px); }
        }
        @keyframes paper05 {
          5%       { transform: translateY(46px); }
          20%,30%  { transform: translateY(34px); }
          40%,55%  { transform: translateY(22px); }
          65%,70%  { transform: translateY(10px); }
          80%,85%  { transform: translateY(0); }
          92%,100% { transform: translateY(46px); }
        }
        @keyframes keyboard05 {
          5%,12%,21%,30%,39%,48%,57%,66%,75%,84% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
          9%  { box-shadow: 15px 2px 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
          18% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 2px 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
          27% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 12px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
          36% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 12px 0 var(--key),60px 12px 0 var(--key),68px 12px 0 var(--key),83px 10px 0 var(--key); }
          45% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 2px 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
          54% { box-shadow: 15px 0 0 var(--key),30px 2px 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
          63% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 12px 0 var(--key); }
          72% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 2px 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
          81% { box-shadow: 15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 12px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); }
        }

        /* ── Modal styles ──────────────────────────────────────────── */
        @media print {
          @page { size: 8.5in 13in; margin: 0.3in; }
          body { margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-container { width: 100%; max-width: none; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
          .modal-overlay { position: static !important; background: none !important; }
          .modal-content { max-height: none !important; overflow: visible !important; box-shadow: none !important; border-radius: 0 !important; }
        }
        @media screen { .print-container { background: white; width: 100%; padding: 0; } }
        * { box-sizing: border-box; }
        .print-container { font-size: 9.5pt; }
        .underline-input {
          border: none; border-bottom: 1px solid #000; padding: 1px 5px;
          background: #D9EBD3; outline: none; width: 100%; font-size: inherit; font-family: inherit;
        }
        .text-sm { font-size: 0.85em; }
        .text-lg { font-size: 1.1em; }
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex; justify-content: center; align-items: center;
          z-index: 9999; padding: 20px;
        }
        .modal-content {
          background: white; border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          max-width: 900px; width: 100%; max-height: 90vh;
          overflow-y: auto; position: relative;
        }
        .modal-header {
          position: sticky; top: 0; background: white; z-index: 10;
          padding: 15px 20px; border-bottom: 2px solid #e5e7eb;
          display: flex; justify-content: space-between; align-items: center;
        }
        .modal-body { padding: 20px 30px 30px; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
        .btn-print { background: #22c55e; color: white; margin-right: 8px; }
        .btn-print:hover { background: #16a34a; }
        .btn-pdf { background: #dc2626; color: white; margin-right: 8px; }
        .btn-pdf:hover:not(:disabled) { background: #b91c1c; }
        .btn-pdf:disabled { background: #f87171; cursor: not-allowed; }
        .btn-close { background: #3b82f6; color: white; }
        .btn-close:hover { background: #2563eb; }
      `}</style>

      {/* Typewriter loading overlay */}
      {loading && (
        <div className="typewriter-overlay">
          <div className="typewriter">
            <div className="slide"><i></i></div>
            <div className="paper"></div>
            <div className="keyboard"></div>
          </div>
          <div className="typewriter-label">Generating PDF, please wait...</div>
        </div>
      )}

      <div className="modal-overlay no-print">
        <div className="modal-content">
          <div className="modal-header no-print">
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
              Customer Activation Request Form
            </h3>
            <div>
              <button onClick={handlePrint} className="btn btn-print">Print</button>
              <button onClick={handleDownloadPdf} className="btn btn-pdf" disabled={loading}>
                {loading ? 'Generating...' : 'Download PDF'}
              </button>
              <button onClick={onClose} className="btn btn-close">Close</button>
            </div>
          </div>

          <div className="modal-body">
            <div ref={componentRef} className="print-container" style={{ fontFamily: 'Arial, sans-serif', color: '#000', lineHeight: '1.15' }}>

              <div style={{ textAlign: 'center', marginBottom: '6px', lineHeight: '1.1' }}>
                <div>BOUNTY PLUS INC.</div>
                <div>Inoza Tower 40th Street, BGC, Taguig City</div>
                <div>Tel: 663-9639 local 1910</div>
                <div className="text-lg" style={{ fontWeight: 'bold', marginTop: '3px' }}>CUSTOMER ACTIVATION REQUEST FORM</div>
                <div style={{ marginTop: '3px' }}><strong>FOR</strong> {formData.custtype}</div>
              </div>

              <div style={{ marginBottom: '4px' }}>
                <strong>REQUEST FOR:</strong>{' '}
                <span style={{ background: '#D9EBD3', padding: '1px 4px', borderRadius: '2px' }}>
                  {(Array.isArray(formData.requestfor) ? formData.requestfor : [formData.requestfor]).filter(Boolean).join(', ')}
                </span>
              </div>

              <div style={{ marginBottom: '4px' }}>
                <strong>APPLY FOR:</strong>{' '}
                <span style={{ background: '#D9EBD3', padding: '1px 4px', borderRadius: '2px' }}>
                  {(Array.isArray(formData.ismother) ? formData.ismother : [formData.ismother]).filter(Boolean).join(', ')}
                </span>
              </div>

              <div style={{ marginBottom: '4px' }}>
                <strong>TYPE:</strong>{' '}
                <span style={{ background: '#D9EBD3', padding: '1px 4px', borderRadius: '2px' }}>
                  {(Array.isArray(formData.type) ? formData.type : [formData.type])
                    .filter(Boolean)
                    .map(t => (t === 'PERSONAL' ? 'INDIVIDUAL' : t))
                    .join(', ')}
                </span>
              </div>

              <div style={{ marginBottom: '6px' }}>
                <strong>DISTRIBUTION CHANNEL:</strong>{' '}
                <span style={{ background: '#D9EBD3', padding: '1px 4px', borderRadius: '2px' }}>
                  {(Array.isArray(formData.saletype) ? formData.saletype : [formData.saletype]).filter(Boolean).join(', ')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '6px' }}>
                <div>
                  {formData.type.includes('CORPORATION') ? (
                    <>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>REGISTERED COMPANY NAME:</div>
                      <input type="text" value={formData.soldtoparty} readOnly className="underline-input" style={{ marginBottom: '2px' }} />
                      <div className="text-sm" style={{ fontStyle: 'italic' }}>Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts</div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '3px', marginBottom: '2px' }}>
                        <strong className="text-sm">LAST NAME</strong><span>/</span>
                        <strong className="text-sm">FIRST NAME</strong><span>/</span>
                        <strong className="text-sm">MIDDLE NAME</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '3px', marginBottom: '2px' }}>
                        <input type="text" value={formData.lastname}   readOnly className="underline-input" /><span>/</span>
                        <input type="text" value={formData.firstname}  readOnly className="underline-input" /><span>/</span>
                        <input type="text" value={formData.middlename} readOnly className="underline-input" />
                      </div>
                      <div className="text-sm" style={{ fontStyle: 'italic' }}>Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts</div>
                    </>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px', visibility: 'hidden' }}>PLACEHOLDER</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <strong style={{ whiteSpace: 'nowrap' }}>{formData.idtype === 'OTHERS' ? 'OTHERS:' : 'TIN:'}</strong>
                    <input type="text" value={formData.tin} readOnly className="underline-input" style={{ width: '160px' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '5px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>BILLING ADDRESS:</div>
                <input type="text" value={formData.billaddress} readOnly className="underline-input" />
              </div>

              <div style={{ marginBottom: '5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', gap: '6px', marginBottom: '2px' }}>
                  <strong>BRANCH (SHIP TO PARTY):</strong>
                  <strong>STORE CODE:</strong>
                  <strong>TRADE NAME:</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', gap: '6px' }}>
                  <input type="text" value={formData.shiptoparty} readOnly className="underline-input" />
                  <input type="text" value={formData.storecode}   readOnly className="underline-input" />
                  <input type="text" value={formData.busstyle}    readOnly className="underline-input" />
                </div>
              </div>

              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>DELIVERY ADDRESS:</div>
                <input type="text" value={formData.deladdress} readOnly className="underline-input" />
              </div>

              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Requested By:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                  <div>
                    <strong>Customer Name:</strong>
                    <input type="text" value={formData.contactperson} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                  <div>
                    <strong>Email Address:</strong>
                    <input type="text" value={formData.email} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <strong>Position:</strong>
                    <input type="text" value={formData.position} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                  <div>
                    <strong>Cellphone No.:</strong>
                    <input type="text" value={formData.contactnumber} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0', paddingTop: '4px' }}>
                <div className="text-sm" style={{ fontStyle: 'italic', color: '#666' }}>To be filled out by BPlus:</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '5px' }}>
                <div>
                  <strong>BOS/WMS CODE:</strong>
                  <input type="text" value={formData.boscode} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                </div>
                <div>
                  <strong>BUSINESS CENTER:</strong>
                  <input type="text" value={formData.bucenter} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '5px' }}>
                <div>
                  <strong>REGION:</strong>
                  <input type="text" value={formData.region} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                </div>
                <div>
                  <strong>DISTRICT:</strong>
                  <input type="text" value={formData.district} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '5px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>SALES INFO:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                  <div>
                    <strong>SALES ORG:</strong>
                    <input type="text" value={formData.salesinfosalesorg} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                  <div>
                    <strong>DISTRIBUTION CHANNEL:</strong>
                    <input type="text" value={formData.salesinfodistributionchannel} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                </div>
                <div>
                  <strong>DIVISION:</strong>
                  <input type="text" value={formData.salesinfodivision} readOnly className="underline-input" style={{ width: '280px', marginTop: '1px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '5px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>TERRITORY:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                  <div>
                    <strong>SALES TERRITORY:</strong>
                    <input type="text" value={formData.salesterritory} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                  <div>
                    <strong>STATE / PROVINCE:</strong>
                    <input type="text" value={formData.territoryprovince} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <strong>REGION:</strong>
                    <input type="text" value={formData.territoryregion} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                  <div>
                    <strong>CITY / MUNICIPALITY:</strong>
                    <input type="text" value={formData.territorycity} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#e5e7eb', textAlign: 'center' }}>TRUCK DESCRIPTION</th>
                    <th style={{ border: '1px solid #000', padding: '3px', backgroundColor: '#e5e7eb', textAlign: 'center' }}>CHECK CAPACITY</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '2TONNER FRESH3 - 1500kg', field: 'checkcapRow1' },
                    { label: '2TONNER FROZEN - 1500kg',  field: 'checkcapRow2' },
                    { label: '4TONNER FRESH - 2600kg',   field: 'checkcapRow3' },
                    { label: '4TONNER FROZEN - 2600kg',  field: 'checkcapRow4' },
                    { label: 'FORWARD FRESH - 6000kg',   field: 'checkcapRow5' },
                    { label: 'FORWARD FROZEN - 6000kg',  field: 'checkcapRow6' },
                  ].map((row) => (
                    <tr key={row.field}>
                      <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{row.label}</td>
                      <td style={{ border: '1px solid #000', padding: '3px', background: '#D9EBD3' }}>
                        {formData[row.field as keyof CustomerFormData] as string}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '5px' }}>
                <div>
                  <strong>DATE TO START:</strong>
                  <input type="text" value={formData.datestart} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                </div>
                <div>
                  <strong>TERMS:</strong>
                  <input type="text" value={formData.terms} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                </div>
                <div>
                  <strong>CREDIT LIMIT:</strong>
                  <input type="text" value={formData.creditlimit} readOnly className="underline-input" style={{ marginTop: '1px' }} />
                </div>
              </div>

              {formData.custtype !== 'HIGH RISK ACCOUNTS' && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>TARGET VOLUME ({formData.custtype === 'LIVE SALES' ? 'hds' : 'kgs'})/DAY:</strong>
                    <input type="text" value={formData.targetvolumeday} readOnly className="underline-input" style={{ width: '160px', marginLeft: '6px' }} />
                  </div>
                  <div>
                    <strong>TARGET VOLUME ({formData.custtype === 'LIVE SALES' ? 'hds' : 'kgs'})/MONTH:</strong>
                    <input type="text" value={formData.targetvolumemonth} readOnly className="underline-input" style={{ width: '160px', marginLeft: '6px' }} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '6px', marginBottom: '2px' }}>
                  <div></div>
                  <strong>EMPLOYEE NUMBER</strong>
                  <strong>NAME</strong>
                </div>
                {[
                  { label: 'EXECUTIVE:',               code: formData.bccode,  name: formData.bcname  },
                  { label: 'GM:',                      code: formData.saocode, name: formData.saoname },
                  { label: 'AM/SAO (WMS PRICE):',      code: formData.supcode, name: formData.supname },
                  { label: 'OPS LEAD/ FIELD OFFICER:', code: formData.opscode, name: formData.opsname },
                ].map((row, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '6px', marginBottom: '3px' }}>
                    <strong>{row.label}</strong>
                    <input type="text" value={row.code} readOnly className="underline-input" />
                    <input type="text" value={row.name} readOnly className="underline-input" />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { label: 'Requested By:',  name: makerName,                  date: formData.datecreated        },
                    { label: 'Processed By:',  name: formData.firstapprovername,  date: formData.initialapprovedate },
                    { label: 'Approved By:',   name: formData.secondapprovername, date: formData.secondapproverdate },
                    { label: 'Approved By:',   name: formData.finalapprovername,  date: formData.thirdapproverdate  },
                  ].map((sig, index) => (
                    <div key={index} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                      <div className="text-sm" style={{ height: '14px', marginBottom: '2px' }}>{sig.label}</div>
                      <div className="text-sm" style={{ height: '14px', color: '#666' }}>
                        {sig.date ? new Date(sig.date).toLocaleDateString() : ''}
                      </div>
                      <div style={{ borderBottom: '1px solid #000', marginBottom: '2px' }}></div>
                      <div style={{ fontWeight: 'bold', minHeight: '16px', marginBottom: '2px', background: '#D9EBD3', padding: '1px' }}>
                        {sig.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintableCustomerForm;
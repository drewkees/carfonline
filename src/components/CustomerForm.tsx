import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import SupportingDocumentsDialog from '@/components/uploading/SupportingDocumentsDialog';
import { useSystemSettings } from './SystemSettings/SystemSettingsContext';
import { useCustomerForm } from '@/hooks/useCustomerForm';
import { CustomerFormData } from '@/hooks/useCustomerForm';
import Loader from './ui/loader';
import { formatTIN, formatNumberWithCommas } from '@/utils/formobjs';
import Select from 'react-select';
import ConfirmationDialog from '@/pages/ConfirmationDialog';
import PrintableCustomerForm from './PrintableCustomerForm';
import { VirtualizedMenuList } from '@/components/VirtualizedMenuList';


interface CustomerFormProps {
  dialogVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ 
  dialogVisible, 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const {
    formData,
    setFormData,
    loading,
    isCustomLimit,
    setIsCustomLimit,
    hasServerFiles,
    dialogOpen,
    setDialogOpen,
    isEditMode,
    invalidFields,
    uploadedFiles,
    districtOptions,
    bucenterOptions,
    custTypeOptions,
    regionOptions,
    paymentLimitOptions,
    paymentTermsOptions,
    salesorgOptions,
    divisionOptions,
    dcOptions,
    salesTerritoryOptions,
    stateProvinceOptions,
    regionTerritoryOptions,
    cityMunicipalityOptions,
    employeeOptions,
    companyNameOptions,
    userPermissions,
    makerName,
    handleCheckboxChange,
    handleInputChange,
    handleFileUpload,
    handleEmployeeNoChange,
    handleEmployeeNameChange,
    handleCompanySelect,
    submitToGoogleSheet,
    updateToGoogleSheet,
    postToGoogleSheet,
    approveForm,
    cancelForm,
    fetchMakerNameByUserId,
    returntomakerForm,
    returnForm
  } = useCustomerForm(initialData, dialogVisible, onClose);

  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'update' | 'cancel' | 'submit' | 'approve' |'return'| null;
  }>({
    isOpen: false,
    action: null,
  });
  const [returnDialog, setReturnDialog] = useState({
    isOpen: false,
    remarks: '',
  });

  const [isReturnLoading, setIsReturnLoading] = useState(false);

  const isApproved = 
    formData.approvestatus === "APPROVED" || 
    (formData.approvestatus === "PENDING" && !userPermissions.hasEditAccess);

  const handlePrintClick = () => {
    setShowPrintView(true);
  };

  const handleClosePrintView = () => {
    setShowPrintView(false);
  };

  const handleConfirmedAction = async () => {
    const action = confirmDialog.action;
    
    switch (action) {
      case 'update':
        setIsUpdateLoading(true);
        try {
          const success = await updateToGoogleSheet(formData);
          if (success) onClose();
        } finally {
          setIsUpdateLoading(false);
        }
        break;

      case 'submit':
        setIsSubmitLoading(true);
        try {
          const success = await postToGoogleSheet(formData);
          if (success) onClose();
        } finally {
          setIsSubmitLoading(false);
        }
        break;

      case 'cancel':
        setIsCancelLoading(true);
        try {
          const success = await cancelForm(formData);
          if (success) onClose();
        } finally {
          setIsCancelLoading(false);
        }
        break;

      case 'return':
        setIsReturnLoading(true);
        try {
          const success = await returnForm(formData,returnDialog.remarks);
          if (success) {
            onClose();
            setReturnDialog({ isOpen: false, remarks: '' });
          }
        } finally {
          setIsReturnLoading(false);
        }
        break;

      case 'approve':
        setIsApproveLoading(true);
        try {
          const success = await approveForm(formData);
          if (success) onClose();
        } finally {
          setIsApproveLoading(false);
        }
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleDraftClick = async () => {
    setIsDraftLoading(true);
    try {
      await submitToGoogleSheet(formData);
    } finally {
      setIsDraftLoading(false);
    }
  };

  const handleUpdateClick = async () => {
    setConfirmDialog({ isOpen: true, action: 'update' });
  };

  const handleSubmitClick = async () => {
    setConfirmDialog({ isOpen: true, action: 'submit' });
  };

  const handleCancelClick = async () => {
    setConfirmDialog({ isOpen: true, action: 'cancel' });
  };

  const handleApproveClick = async () => {
    setConfirmDialog({ isOpen: true, action: 'approve' });
  };
  
  const handleReturnClick = () => {
    setReturnDialog({ isOpen: true, remarks: '' });
  };

  const handleReturnSubmit = async () => {
    if (!returnDialog.remarks.trim()) {
      alert('Please enter remarks before returning to maker');
      return;
    }
    setIsReturnLoading(true);
    try {
      setConfirmDialog({ isOpen: true, action: 'return' });
    } finally {
      setIsReturnLoading(false);
    }
  };

  const formatToISODate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const hasAnyFiles = hasServerFiles || Object.values(uploadedFiles).some(f => f !== null);

  if (!dialogVisible) return null;

  const resolvedTerritoryRegion =
    regionTerritoryOptions.find((opt) => opt.code === formData.territoryregion)?.text ||
    formData.territoryregion;

  const resolvedTerritoryProvince =
    stateProvinceOptions.find((opt) => opt.code === formData.territoryprovince)?.text ||
    formData.territoryprovince;

  const resolvedTerritoryCity =
    cityMunicipalityOptions.find((opt) => opt.code === formData.territorycity)?.text ||
    formData.territorycity;
  
  if (showPrintView) {
    return (
      <PrintableCustomerForm
        formData={{
          ...formData,
          territoryregion: resolvedTerritoryRegion,
          territoryprovince: resolvedTerritoryProvince,
          territorycity: resolvedTerritoryCity,
        }}
        makerName={makerName}
        onClose={handleClosePrintView}
        isVisible={showPrintView}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 md:p-8">
      <div className="no-scrollbar bg-gray-100 text-black w-full max-w-[95vw] md:max-w-[75vw] rounded-lg shadow-lg overflow-y-scroll max-h-[95vh] md:max-h-[92vh] p-4 md:p-20 m-2 md:m-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 mb-4">
          <h2 className="text-lg md:text-xl font-bold">📄 CUSTOMER ACTIVATION REQUEST FORM</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-blue-700 text-xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
          <fieldset disabled={loading} className={loading ? 'opacity-60 pointer-events-none' : ''}>
          {/* Company Header Info */}
          <div className="relative text-center mb-6">
            {/* CARF NO. - Aligned to the right */}
            <div className="hidden md:absolute md:flex md:right-0 md:top-0 md:items-center md:space-x-2">
              <strong className="text-xl">CARF NO.:</strong>
              <input
                type="text"
                value={formData.gencode || ''}
                readOnly
                className="w-[200px] rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900"
              />
            </div>

            {/* Mobile CARF NO */}
            <div className="flex md:hidden flex-col gap-2 mb-4">
              <strong className="text-sm">CARF NO.:</strong>
              <input
                type="text"
                value={formData.gencode || ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900"
              />
            </div>

            {/* Center content */}
            <div className="text-base md:text-xl font-bold mb-1">BOUNTY PLUS INC.</div>
            <div className="text-sm md:text-base mb-1">Inoza Tower 40th Street, BGC, Taguig City</div>
            <div className="text-sm md:text-base mb-1">Tel: 663-9639 local 1910</div>
            <div className="text-base md:text-xl font-bold mt-3 mb-4">CUSTOMER ACTIVATION REQUEST FORM</div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-center mt-4 gap-2 md:gap-0">
              <strong className="text-base md:text-xl md:mr-8">FOR</strong>
              <select
                value={formData.custtype}
                onChange={(e) => handleInputChange('custtype', e.target.value)}
                disabled={isApproved}
                className={`w-full md:w-[350px] rounded-lg border border-gray-300 px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('custtype') ? 'error-border' : ''} ${isApproved ? 'bg-gray-200' : 'bg-white'}`}
              >
                <option value="" disabled>Select WMS Customer Group</option>
                {custTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                {formData.custtype && !custTypeOptions.includes(formData.custtype) && (
                  <option value={formData.custtype}>{formData.custtype}</option>
                )}
              </select>
            </div>
          </div>

          {/* REQUEST FOR */}
          <div className="flex flex-col md:flex-row md:items-center mt-4">
            <strong className="text-base md:text-xl md:min-w-[150px] mb-2 md:mb-0">REQUEST FOR:</strong>
            <div className={`flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0 p-2 rounded ${invalidFields.includes('requestfor') ? 'error-border' : ''}`}>
              {['ACTIVATION', 'DEACTIVATION', 'EDIT'].map(option => (
                <label key={option} className="flex items-center text-sm md:text-xl">
                  <input
                    type="checkbox"
                    checked={formData.requestfor.includes(option)}
                    onChange={(e) =>setFormData(prev => ({ ...prev, requestfor: [option] }))}
                    disabled={isApproved}
                    className="mr-2"
                  />
                  <span>{option} of Customer Code</span>
                </label>
              ))}
            </div>
          </div>

          {/* APPLY FOR */}
          <div className="flex flex-col md:flex-row md:items-center mt-1">
            <strong className="text-base md:text-xl md:min-w-[150px] mb-2 md:mb-0">APPLY FOR:</strong>
            <div className={`flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0 ${invalidFields.includes('ismother') ? 'error-border' : ''}`}>
              {['SOLD TO PARTY', 'SHIP TO PARTY'].map(option => (
                <label key={option} className="flex items-center text-sm md:text-xl">
                  <input
                    type="checkbox"
                    checked={formData.ismother.includes(option)}
                    onChange={(e) =>setFormData(prev => ({ ...prev, ismother: [option] }))}
                    disabled={isApproved}
                    className="mr-2"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* TYPE */}
          <div className="flex flex-col md:flex-row md:items-center mt-4">
            <strong className="text-base md:text-xl md:min-w-[150px] mb-2 md:mb-0">TYPE:</strong>
            <div className={`flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0 ${invalidFields.includes('type') ? 'error-border' : ''}`}>
              {['PERSONAL', 'CORPORATION'].map(option => (
                <label key={option} className="flex items-center text-sm md:text-xl">
                  <input
                    type="radio"
                    name="type"
                    value={option}
                    checked={formData.type.includes(option)}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: [e.target.value] }))}
                    disabled={isApproved}
                    className="mr-2"
                  />
                  <span>{option === 'PERSONAL' ? 'INDIVIDUAL' : 'CORPORATION'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* DISTRIBUTION CHANNEL */}
          <div className="flex flex-col md:flex-row md:items-center mt-4">
            <strong className="text-base md:text-xl md:min-w-[150px] mb-2 md:mb-0">DISTRIBUTION CHANNEL:</strong>
            <div className={`flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0 ${invalidFields.includes('saletype') ? 'error-border' : ''}`}>
              {['OUTRIGHT', 'CONSIGNMENT'].map(option => (
                <label key={option} className="flex items-center text-sm md:text-xl">
                  <input
                    type="checkbox"
                    checked={formData.saletype.includes(option)}
                   onChange={(e) =>setFormData(prev => ({ ...prev, saletype: [option] }))}
                    disabled={isApproved}
                    className="mr-2"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          
          {/* Corporation Name Section - SOLD TO PARTY (Input Field) */}
          {formData.type.includes('CORPORATION') && formData.ismother.includes('SOLD TO PARTY') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-xl items-start">
              <div>
                <label className="block font-semibold mb-2 text-sm md:text-base">
                  REGISTERED COMPANY NAME (SOLD TO PARTY):
                </label>
                <input
                  type="text"
                  value={formData.soldtoparty}
                  onChange={(e) => handleInputChange('soldtoparty', e.target.value)}
                  className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('soldtoparty') ? 'error-border' : ''}`}
                />
                <i className="text-xs md:text-sm text-gray-600">
                  Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts
                </i>
              </div>

              <div>
                <div className="flex items-center space-x-6 mb-2 text-sm md:text-base">
                  <label className="font-semibold">ID TYPE:</label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="idtype"
                      value="TIN"
                      checked={formData.idtype === 'TIN'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>TIN</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="idtype"
                      value="OTHERS"
                      checked={formData.idtype === 'OTHERS'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>OTHERS</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2 text-sm md:text-base">
                  <strong>{formData.idtype === 'OTHERS' ? 'OTHERS:' : 'TIN:'}</strong>
                  <input
                    type="text"
                    value={formData.tin}
                    disabled={isApproved}
                    onChange={(e) => setFormData(prev => ({ ...prev, tin: formatTIN(e.target.value) }))}
                    className={`flex-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('tin') ? 'error-border' : ''}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Corporation Name Section - SHIP TO PARTY (Select Field) */}
          {formData.type.includes('CORPORATION') && formData.ismother.includes('SHIP TO PARTY') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-xl items-start">
              <div>
                <label className="block font-semibold mb-2 text-sm md:text-base">
                  REGISTERED COMPANY NAME (SHIP TO PARTY):
                </label>
                <Select
                  components={{ MenuList: VirtualizedMenuList }} 
                  value={
                    formData.soldtoparty
                      ? { value: formData.soldtoparty, label: formData.soldtoparty }
                      : null
                  }
                  onChange={(option) => {
                    if (option) {
                      handleCompanySelect(option.value);
                    }
                  }}
                  options={companyNameOptions.map((name) => ({
                    value: name,
                    label: name,
                  }))}
                  placeholder="Select registered company"
                  isClearable
                  isSearchable
                  isDisabled={isApproved}
                  className={invalidFields.includes('soldtoparty') ? 'error-border' : ''}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: invalidFields.includes('soldtoparty')
                        ? '#ef4444'
                        : state.isFocused
                        ? '#3b82f6'
                        : '#d1d5db',
                      borderRadius: '0.5rem',
                      padding: '0.125rem',
                      backgroundColor: isApproved ? '#f3f4f6' : base.backgroundColor,
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
                      '&:hover': {
                        borderColor: '#3b82f6',
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                />
                <i className="text-xs md:text-sm text-gray-600">
                  Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts
                </i>
              </div>

              <div>
                <div className="flex items-center space-x-6 mb-2 text-sm md:text-base">
                  <label className="font-semibold">ID TYPE:</label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="idtype"
                      value="TIN"
                      checked={formData.idtype === 'TIN'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>TIN</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="idtype"
                      value="OTHERS"
                      checked={formData.idtype === 'OTHERS'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>OTHERS</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2 text-sm md:text-base">
                  <strong>{formData.idtype === 'OTHERS' ? 'OTHERS:' : 'TIN:'}</strong>
                  <input
                    type="text"
                    value={formData.tin}
                    disabled={isApproved}
                    onChange={(e) => setFormData(prev => ({ ...prev, tin: formatTIN(e.target.value) }))}
                    className={`flex-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('tin') ? 'error-border' : ''}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Personal Name Section - SOLD TO PARTY (Input Fields) */}
          {formData.type.includes('PERSONAL') && formData.ismother.includes('SOLD TO PARTY') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-xl items-start">
              <div>
                {/* Desktop view - original 3 column layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 mb-2">
                  <strong>LAST NAME</strong>
                  <span></span>
                  <strong>FIRST NAME</strong>
                  <span></span>
                  <strong>MIDDLE NAME</strong>
                </div>

                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2">
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange('lastname', e.target.value)}
                    disabled={isApproved}
                    className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2 text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('lastname') ? 'error-border' : ''}`}
                  />
                  <span className="flex items-center justify-center">/</span>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange('firstname', e.target.value)}
                    disabled={isApproved}
                    className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2 text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('firstname') ? 'error-border' : ''}`}
                  />
                  <span className="flex items-center justify-center">/</span>
                  <input
                    type="text"
                    value={formData.middlename}
                    onChange={(e) => handleInputChange('middlename', e.target.value)}
                    disabled={isApproved}
                    className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2 text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('middlename') ? 'error-border' : ''}`}
                  />
                </div>

                {/* Mobile view - stacked */}
                <div className="md:hidden space-y-3">
                  <div>
                    <strong className="text-sm">LAST NAME</strong>
                    <input
                      type="text"
                      value={formData.lastname}
                      onChange={(e) => handleInputChange('lastname', e.target.value)}
                      disabled={isApproved}
                      className={`w-full mt-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm text-gray-900 
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('lastname') ? 'error-border' : ''}`}
                    />
                  </div>
                  <div>
                    <strong className="text-sm">FIRST NAME</strong>
                    <input
                      type="text"
                      value={formData.firstname}
                      onChange={(e) => handleInputChange('firstname', e.target.value)}
                      disabled={isApproved}
                      className={`w-full mt-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm text-gray-900 
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('firstname') ? 'error-border' : ''}`}
                    />
                  </div>
                  <div>
                    <strong className="text-sm">MIDDLE NAME</strong>
                    <input
                      type="text"
                      value={formData.middlename}
                      onChange={(e) => handleInputChange('middlename', e.target.value)}
                      disabled={isApproved}
                      className={`w-full mt-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm text-gray-900 
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('middlename') ? 'error-border' : ''}`}
                    />
                  </div>
                </div>

                <div className="mt-1">
                  <i className="text-xs md:text-sm text-gray-600">
                    Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts
                  </i>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-2 text-sm md:text-base">
                  <strong className="mr-4">ID TYPE:</strong>
                  <label className="flex items-center mr-4">
                    <input
                      type="radio"
                      name="idtype"
                      value="TIN"
                      checked={formData.idtype === 'TIN'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>TIN</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="idtype"
                      value="OTHERS"
                      checked={formData.idtype === 'OTHERS'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>OTHERS</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2 text-sm md:text-base">
                  <strong className="whitespace-nowrap">{formData.idtype === 'OTHERS' ? 'OTHERS:' : 'TIN:'}</strong>
                  <input
                    type="text"
                    value={formData.tin}
                    onChange={(e) => handleInputChange('tin', e.target.value)}
                    className={`flex-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('tin') ? 'error-border' : ''}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Personal Name Section - SHIP TO PARTY (Single Select Field for Full Name) */}
          {formData.type.includes('PERSONAL') && formData.ismother.includes('SHIP TO PARTY') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-xl items-start">
              <div>
                <label className="block font-semibold mb-2 text-sm md:text-base">
                  REGISTERED COMPANY NAME (SHIP TO PARTY):
                </label>
                <Select
                  value={
                    formData.soldtoparty
                      ? { value: formData.soldtoparty, label: formData.soldtoparty }
                      : null
                  }
                  onChange={(option) => {
                    if (option) {
                      handleCompanySelect(option.value);
                    }
                  }}
                  options={companyNameOptions.map((name) => ({
                    value: name,
                    label: name,
                  }))}
                  placeholder="Select registered company"
                  isClearable
                  isSearchable
                  isDisabled={isApproved}
                  className={invalidFields.includes('soldtoparty') ? 'error-border' : ''}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: invalidFields.includes('soldtoparty')
                        ? '#ef4444'
                        : state.isFocused
                        ? '#3b82f6'
                        : '#d1d5db',
                      borderRadius: '0.5rem',
                      padding: '0.125rem',
                      backgroundColor: isApproved ? '#f3f4f6' : base.backgroundColor,
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
                      '&:hover': {
                        borderColor: '#3b82f6',
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                />
                <i className="text-xs md:text-sm text-gray-600">
                  Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts
                </i>
              </div>

              <div>
                <div className="flex items-center mb-2 text-sm md:text-base">
                  <strong className="mr-4">ID TYPE:</strong>
                  <label className="flex items-center mr-4">
                    <input
                      type="radio"
                      name="idtype"
                      value="TIN"
                      checked={formData.idtype === 'TIN'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>TIN</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="idtype"
                      value="OTHERS"
                      checked={formData.idtype === 'OTHERS'}
                      onChange={(e) => handleInputChange('idtype', e.target.value)}
                      className="mr-2"
                    />
                    <span>OTHERS</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2 text-sm md:text-base">
                  <strong className="whitespace-nowrap">{formData.idtype === 'OTHERS' ? 'OTHERS:' : 'TIN:'}</strong>
                  <input
                    type="text"
                    value={formData.tin}
                    onChange={(e) => handleInputChange('tin', e.target.value)}
                    className={`flex-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('tin') ? 'error-border' : ''}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Billing Address */}
          <div className="mt-8">
            <div className="text-base md:text-xl font-bold mb-2">BILLING ADDRESS:</div>
            <input
              type="text"
              value={formData.billaddress}
              onChange={(e) => handleInputChange('billaddress', e.target.value)}
              disabled={isApproved || formData.ismother?.includes('SHIP TO PARTY')}
              className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('billaddress') ? 'error-border' : ''}`}
            />
          </div>

          {/* Branch, Store Code, Trade Name */}
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 text-sm md:text-xl mb-2">
                <strong className="font-bold">BRANCH (SHIP TO PARTY):</strong>
                <strong className="font-bold">STORE CODE:</strong>
                <strong className="font-bold">TRADE NAME (BUSINESS STYLE):</strong>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <input
                type="text"
                value={formData.shiptoparty}
                onChange={(e) => handleInputChange('shiptoparty', e.target.value)}
                disabled={isApproved}
                  className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('shiptoparty') ? 'error-border' : ''}`}
              />
              <input
                type="text"
                value={formData.storecode}
                onChange={(e) => handleInputChange('storecode', e.target.value)}
                disabled={isApproved}
                  className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('storecode') ? 'error-border' : ''}`}
              />
              <input
                type="text"
                value={formData.busstyle}
                onChange={(e) => handleInputChange('busstyle', e.target.value)}
                disabled={isApproved}
                  className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm${invalidFields.includes('busstyle') ? 'error-border' : ''}`}
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="mt-8">
            <div className="text-base md:text-xl font-bold mb-2">DELIVERY ADDRESS:</div>
            <input
              type="text"
              value={formData.deladdress}
              disabled={isApproved}
              onChange={(e) => handleInputChange('deladdress', e.target.value)}
            className= {`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('deladdress') ? 'error-border' : ''}`}
            />
          </div>

          {/* Requested By Section */}
          <div className="mt-10 text-base md:text-xl">
            <div className="font-bold mb-4">Requested By:</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <strong className="whitespace-nowrap mb-1 md:mb-0 text-sm md:text-base">Customer Name:</strong>
                <input
                  type="text"
                  value={formData.contactperson}
                  onChange={(e) => handleInputChange('contactperson', e.target.value)}
                  disabled={isApproved}
                  className={`flex-1 rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('contactperson') ? 'error-border' : ''}`}
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <strong className="whitespace-nowrap mb-1 md:mb-0 text-sm md:text-base">Email Address:</strong>
                <input
                  type="text"
                  placeholder="email@example.com or N/A"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isApproved}
                  className={`md:w-[600px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('email') ? 'error-border' : ''}`}
                />
                {invalidFields.includes('email') && (
                  <p className="text-red-600 text-sm mt-1">
                    Please enter a valid email address or N/A
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <strong className="whitespace-nowrap mb-1 md:mb-0 text-sm md:text-base">Position:</strong>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  disabled={isApproved}
                  className={`md:w-[600px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('position') ? 'error-border' : ''}`}
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <strong className="whitespace-nowrap mb-1 md:mb-0 text-sm md:text-base">Cellphone No.:</strong>
                <input
                  type="number"
                  value={formData.contactnumber}
                  onChange={(e) => handleInputChange('contactnumber', e.target.value)}
                  disabled={isApproved}
                  className={`md:w-[500px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('contactnumber') ? 'error-border' : ''}`}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <strong className="text-sm md:text-base">Supporting Documents:</strong>
              <button
              type="button"
              className={`ml-0 md:ml-4 mt-2 md:mt-0 px-3 md:px-4 py-2 rounded text-sm md:text-base ${
                hasAnyFiles
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                onClick={() => setDialogOpen(true)}
                disabled={loading}
            >
              {loading ? 'Loading...' : hasAnyFiles ? 'VIEW FILES' : 'CHOOSE FILE'}
            </button>
              <SupportingDocumentsDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                uploadedFiles={uploadedFiles}
                onFileUpload={handleFileUpload}
                gencode={formData.gencode}
                approvestatus={formData.approvestatus} 
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mt-5">
            <hr className="border-t border-dashed border-black" />
          </div>

          {/* BPlus Section */}
          <div className="mt-2">
            <i className="text-xs md:text-sm">To be filled out by BPlus:</i>
          </div>

          {/* BOS/WMS Code and Business Center */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 text-base md:text-xl">
            <div className="flex flex-col md:flex-row md:items-center">
              <strong className="mr-0 md:mr-4 mb-1 md:mb-0 text-sm md:text-base">BOS/WMS CODE:</strong>
              <input
                type="text"
                value={formData.boscode}
                onChange={(e) => handleInputChange('boscode', e.target.value)}
                disabled={isApproved || !formData.requestfor.includes('EDIT')}
                  className={`md:w-[300px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('boscode') ? 'error-border' : ''}`}
                readOnly={formData.requestfor.includes('ACTIVATION')}
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center">
              <strong className="mr-0 md:mr-4 mb-1 md:mb-0 text-sm md:text-base">BUSINESS CENTER:</strong>
              <select
                value={formData.bucenter}
                onChange={(e) => handleInputChange('bucenter', e.target.value)}
                disabled={isApproved}
                  className={`md:w-[400px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('bucenter') ? 'error-border' : ''}`}
              >
                <option value="" disabled>
                  Select BU Center
                </option>
                {bucenterOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {formData.bucenter && !bucenterOptions.includes(formData.bucenter) && (
                  <option value={formData.bucenter}>{formData.bucenter}</option>
                )}
              </select>
            </div>
          </div>

          {/* Region and District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 text-base md:text-xl">
            <div className="flex flex-col md:flex-row md:items-center">
              <strong className="mr-0 md:mr-20 mb-1 md:mb-0 text-sm md:text-base">REGION:</strong>
              <select
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                disabled={isApproved}
                  className={`md:w-[450px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('region') ? 'error-border' : ''}`}
              >
                <option value="" disabled>
                  Select Region
                </option>
                {regionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {formData.region && !regionOptions.includes(formData.region) && (
                  <option value={formData.region}>{formData.region}</option>
                )}
              </select>
            </div>
            <div className="flex flex-col md:flex-row md:items-center">
              <strong className="mr-0 md:mr-4 mb-1 md:mb-0 text-sm md:text-base">DISTRICT:</strong>
              <select
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                disabled={isApproved}
                  className={`md:w-[420px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('district') ? 'error-border' : ''}`}
              >
                <option value="" disabled>
                  Select District
                </option>
                {districtOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {formData.district && !districtOptions.includes(formData.district) && (
                  <option value={formData.district}>{formData.district}</option>
                )}
              </select>
            </div>
          </div>

          {/* Sales Info */}
          <div className="mt-6">
            <div className="text-base md:text-xl font-bold mb-2">SALES INFO:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 text-base md:text-xl">
              <div className="flex flex-col md:flex-row md:items-center">
                <strong className="mr-0 md:mr-12 mb-1 md:mb-0 text-sm md:text-base">SALES ORG:</strong>
                <select
                  value={formData.salesinfosalesorg}
                  onChange={(e) => handleInputChange('salesinfosalesorg', e.target.value)}
                disabled={isApproved}
                  className={`md:w-[300px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('salesinfosalesorg') ? 'error-border' : ''}`}
                >
                  <option value="" disabled>
                  Select Sales Organization
                </option>
                {salesorgOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {formData.salesinfosalesorg && !salesorgOptions.includes(formData.salesinfosalesorg) && (
                  <option value={formData.salesinfosalesorg}>{formData.salesinfosalesorg}</option>
                )}
                </select>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <strong className="mr-0 md:mr-4 mb-1 md:mb-0 text-xs md:text-base whitespace-nowrap">DISTRIBUTION CHANNEL:</strong>
                <select
                  value={formData.salesinfodistributionchannel}
                  onChange={(e) => handleInputChange('salesinfodistributionchannel', e.target.value)}
                disabled={isApproved}
                  className={`md:w-[350px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('salesinfodistributionchannel') ? 'error-border' : ''}`}
                >
                   <option value="" disabled>
                  Select Distribution Channel
                </option>
                {dcOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {formData.salesinfodistributionchannel && !dcOptions.includes(formData.salesinfodistributionchannel) && (
                  <option value={formData.salesinfodistributionchannel}>{formData.salesinfodistributionchannel}</option>
                )}
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center mt-4 text-base md:text-xl">
              <strong className="mr-0 md:mr-20 mb-1 md:mb-0 text-sm md:text-base">DIVISION:</strong>
              <select
                value={formData.salesinfodivision}
                onChange={(e) => handleInputChange('salesinfodivision', e.target.value)}
                disabled={isApproved}
                  className={`md:w-[350px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('salesinfodivision') ? 'error-border' : ''}`}
              >
                <option value="" disabled>
                  Select Division
                </option>
                {divisionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {formData.salesinfodivision && divisionOptions.includes(formData.region) && (
                  <option value={formData.salesinfodivision} >
                    {formData.salesinfodivision}
                  </option>
                )}
              </select>
            </div>
          </div>
          
          {/* Sales Territory */}
          <div className="mt-6">
            <div className="text-base md:text-xl font-bold mb-2">TERRITORY:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 text-base md:text-xl">
              <div className="flex flex-col md:flex-row md:items-center">
                <strong className="mr-0 md:mr-12 mb-1 md:mb-0 text-sm md:text-base whitespace-nowrap">SALES TERRITORY:</strong>
                <select
                  value={formData.salesterritory}
                  onChange={(e) => handleInputChange('salesterritory', e.target.value)}
                  disabled={isApproved}
                  className={`md:w-[300px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('salesterritory') ? 'error-border' : ''}`}
                >
                  <option value="" disabled>
                    Select Sales Territory
                  </option>
                  {salesTerritoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {formData.salesterritory && !salesTerritoryOptions.includes(formData.salesterritory) && (
                    <option value={formData.salesterritory}>{formData.salesterritory}</option>
                  )}
                </select>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <strong className="mr-0 md:mr-4 mb-1 md:mb-0 text-sm md:text-base whitespace-nowrap">STATE / PROVINCE:</strong>
                <select
                  value={formData.territoryprovince}
                  onChange={(e) => {
                    handleInputChange('territoryprovince', e.target.value);
                    handleInputChange('territorycity', '');
                  }}
                  disabled={!formData.territoryregion || isApproved}
                  className={`md:w-[350px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('territoryprovince') ? 'error-border' : ''}`}
                >
                  <option value="" disabled>Select Province</option>
                  {stateProvinceOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.text}</option>
                  ))}
                </select>
              </div>
              
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 text-base md:text-xl">
                  <div className="flex flex-col md:flex-row md:items-center md:mt-4">
                    <strong className="mr-0 md:mr-12 mb-1 md:mb-0 text-sm md:text-base">REGION:</strong>
                    <select
                      value={formData.territoryregion}
                      onChange={(e) => {
                        handleInputChange('territoryregion', e.target.value);
                        handleInputChange('territoryprovince', '');
                        handleInputChange('territorycity', '');
                      }}
                      disabled={isApproved}
                  className={`md:w-[400px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('territoryregion') ? 'error-border' : ''}`}
                    >
                      <option value="" disabled>Select Region</option>
                      {regionTerritoryOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.text}</option>
                      ))}
                    </select>
                  </div>

                 <div className="flex flex-col md:flex-row md:items-center md:mt-4">
                    <strong className="mr-0 md:mr-20 mb-1 md:mb-0 text-sm md:text-base whitespace-nowrap">CITY / MUNICIPALITY:</strong>
                    <select
                      value={formData.territorycity}
                      onChange={(e) => handleInputChange('territorycity', e.target.value)}
                      disabled={!formData.territoryprovince || isApproved}
                  className={`md:w-[350px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('territorycity') ? 'error-border' : ''}`}
                    >
                      <option value="" disabled>Select City/Municipality</option>
                      {cityMunicipalityOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.text}</option>
                      ))}
                    </select>
                  </div>
              </div>
          </div>



          <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 text-xs md:text-base">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 md:w-[500px] text-center">TRUCK DESCRIPTION</th>
                    <th className="border border-gray-400 p-2 md:w-[700px] text-center">CHECK CAPACITY</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '2TONNER FRESH3 - 1500kg', field: 'checkcapRow1' },
                    { label: '2TONNER FROZEN - 1500kg', field: 'checkcapRow2' },
                    { label: '4TONNER FRESH - 2600kg', field: 'checkcapRow3' },
                    { label: '4TONNER FROZEN - 2600kg', field: 'checkcapRow4' },
                    { label: 'FORWARD FRESH - 6000kg', field: 'checkcapRow5' },
                    { label: 'FORWARD FROZEN - 6000kg', field: 'checkcapRow6' },
                  ].map((row) => (
                    <tr key={row.field}>
                      <td className="border border-gray-400 p-2 text-center">{row.label}</td>
                      <td className="border border-gray-400 p-2">
                        <input
                          type="text"
                          value={formData[row.field as keyof CustomerFormData] as string}
                          disabled={isApproved}
                          placeholder="Enter truck capacity"
                          onChange={(e) => handleInputChange(row.field as keyof CustomerFormData, e.target.value)}
                          className={`w-full rounded-lg border border-gray-300 ${
                            isApproved ? "bg-gray-200" : "bg-white"
                          } px-3 md:px-4 py-2 text-xs md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm`}

                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          {/* Date, Terms, Credit Limit - DESKTOP ORIGINAL LAYOUT */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 mb-4 text-xl">
            <div className="flex items-center">
              <strong className="mr-8">DATE TO START:</strong>
              <input
                type="date"
                value={formatToISODate(formData.datestart)}
                onChange={(e) => handleInputChange('datestart', e.target.value)}
                disabled={isApproved}
                className="w-[200px] rounded-lg border border-gray-300 bg-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex items-center">
              <strong className="mr-4">TERMS:</strong>
              <select
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                disabled={!formData.custtype || !formData.type || isApproved} 
                className= {`w-[220px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('terms') ? 'error-border' : ''}`}
                
              >
                 <option value="" disabled>
                  Select Terms
                </option>
                {paymentTermsOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {`${opt.code} - ${opt.name}`}
                  </option>
                ))}

                {formData.terms && !paymentTermsOptions.some(opt => opt.code === formData.terms) && (
                  <option value={formData.terms}>{formData.terms}</option>
                )}

              </select>
            </div>
            <div className="flex items-center">
              <strong className="mr-4">CREDIT LIMIT:</strong>
              {isCustomLimit ? (
                <input
                  type="text"
                  value={formData.creditlimit}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    if (rawValue === '' || /^\d+$/.test(rawValue)) {
                      handleInputChange('creditlimit', rawValue);
                    }
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    if (rawValue) {
                      handleInputChange('creditlimit', formatNumberWithCommas(rawValue));
                    }
                    if (rawValue === '') {
                      setIsCustomLimit(false);
                    }
                  }}
                  disabled={isApproved}
                              className={`w-[250px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('creditlimit') ? 'error-border' : ''}`}
                  placeholder="Enter custom limit"
                />
              ) : (
                <select
                  value={formData.creditlimit || ''}
                  onChange={(e) => {
                    if (e.target.value === 'Enter Custom Limit') {
                      setIsCustomLimit(true);
                      handleInputChange('creditlimit', '');
                    } else {
                      handleInputChange('creditlimit', e.target.value);
                    }
                  }}
                  disabled={!formData.terms || isApproved}
                              className={`w-[250px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('creditlimit') ? 'error-border' : ''}`}
                >
                  <option value="" disabled>
                    Select Limit
                  </option>

                  {paymentLimitOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Date, Terms, Credit Limit - MOBILE STACKED LAYOUT */}
          <div className="md:hidden space-y-4 mb-4">
            <div className="flex flex-col">
              <strong className="mb-1 text-sm">DATE TO START:</strong>
              <input
                type="date"
                value={formatToISODate(formData.datestart)}
                onChange={(e) => handleInputChange('datestart', e.target.value)}
                disabled={isApproved}
                className="w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex flex-col">
              <strong className="mb-1 text-sm">TERMS:</strong>
              <select
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                disabled={!formData.custtype || !formData.type || isApproved} 
                className= {`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('terms') ? 'error-border' : ''}`}
              >
                 <option value="" disabled>
                  Select Terms
                </option>
                {paymentTermsOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {`${opt.code} - ${opt.name}`}
                  </option>
                ))}

                {formData.terms && !paymentTermsOptions.some(opt => opt.code === formData.terms) && (
                  <option value={formData.terms}>{formData.terms}</option>
                )}

              </select>
            </div>
            <div className="flex flex-col">
              <strong className="mb-1 text-sm">CREDIT LIMIT:</strong>
              {isCustomLimit ? (
                <input
                  type="text"
                  value={formData.creditlimit}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    if (rawValue === '' || /^\d+$/.test(rawValue)) {
                      handleInputChange('creditlimit', rawValue);
                    }
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    if (rawValue) {
                      handleInputChange('creditlimit', formatNumberWithCommas(rawValue));
                    }
                    if (rawValue === '') {
                      setIsCustomLimit(false);
                    }
                  }}
                  disabled={isApproved}
                  className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('creditlimit') ? 'error-border' : ''}`}
                  placeholder="Enter custom limit"
                />
              ) : (
                <select
                  value={formData.creditlimit || ''}
                  onChange={(e) => {
                    if (e.target.value === 'Enter Custom Limit') {
                      setIsCustomLimit(true);
                      handleInputChange('creditlimit', '');
                    } else {
                      handleInputChange('creditlimit', e.target.value);
                    }
                  }}
                  disabled={!formData.terms || isApproved}
                  className={`w-full rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('creditlimit') ? 'error-border' : ''}`}
                >
                  <option value="" disabled>
                    Select Limit
                  </option>

                  {paymentLimitOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Target Volume */}
          {formData.custtype !== 'HIGH RISK ACCOUNTS' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center mt-8 text-base md:text-xl">
                <strong className="mr-0 md:mr-4 mb-1 md:mb-0 text-sm md:text-base">
                  TARGET VOLUME ({formData.custtype === 'LIVE SALES' ? 'hds' : 'kgs'})/DAY:
                </strong>
                <input
                  type="text"
                  value={formData.targetvolumeday}
                  onChange={(e) => handleInputChange('targetvolumeday', e.target.value)}
                disabled={isApproved}
                  className={`md:w-[200px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('targetvolumeday') ? 'error-border' : ''}`}
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center mt-8 text-base md:text-xl">
                <strong className="mr-0 md:mr-4 mb-1 md:mb-0 text-sm md:text-base">
                  TARGET VOLUME ({formData.custtype === 'LIVE SALES' ? 'hds' : 'kgs'})/MONTH:
                </strong>
                <input
                  type="text"
                  value={formData.targetvolumemonth}
                  readOnly
                  onChange={(e) => handleInputChange('targetvolumemonth', e.target.value)}
                  disabled={isApproved}
                  className={`md:w-[200px] rounded-lg border border-gray-300 ${isApproved ? "bg-gray-200" : "bg-white"} px-3 md:px-4 py-2 text-sm md:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm ${invalidFields.includes('targetvolumemonth') ? 'error-border' : ''}`}
                />
              </div>
            </>
          )}

          {/* Employee Section - DESKTOP ORIGINAL LAYOUT */}
          <div className="mt-6">
            <div className="hidden md:grid md:grid-cols-[290px_1fr_1fr] gap-3 text-xl font-bold mb-2">
              <div></div>
              <div>EMPLOYEE NUMBER</div>
              <div>NAME</div>
            </div>

            {[
              {
                label: 'EXECUTIVE:',
                codeField: 'bccode',
                nameField: 'bcname',
                type: 'GM',
              },
              {
                label: 'GM:',
                codeField: 'saocode',
                nameField: 'saoname',
                type: 'AM',
              },
              {
                label: 'AM/SAO (WMS PRICE):',
                codeField: 'supcode',
                nameField: 'supname',
                type: 'SS',
              },
              {
                label: 'OPS LEAD/ FIELD OFFICER:',
                codeField: 'opscode',
                nameField: 'opsname',
                type: 'OPS',
              },
            ].map((row) => {
              const list = employeeOptions[row.type as 'GM' | 'AM' | 'SS'| 'OPS'] ?? [];

              return (
                <div key={row.label}>
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-[290px_1fr_1fr] gap-3 items-center mt-3 text-xl">
                    <strong>{row.label}</strong>

                    <select
                      value={formData[row.codeField as keyof CustomerFormData] as string}
                      onChange={(e) =>
                        handleEmployeeNoChange(
                          row.codeField as keyof CustomerFormData,
                          row.nameField as keyof CustomerFormData,
                          list,
                          e.target.value
                        )
                      }
                      className={`w-full rounded-lg border ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2
                        ${
                          invalidFields.includes(row.codeField)
                            ? 'error-border'
                            : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select</option>
                      {list.map((emp, i) => (
                        <option key={`${emp.employeetype}-${emp.employeeno}-${i}`} value={emp.employeeno}>
                          {emp.employeeno}
                        </option>
                      ))}

                    </select>

                    <select
                      value={formData[row.nameField as keyof CustomerFormData] as string}
                      onChange={(e) =>
                        handleEmployeeNameChange(
                          row.codeField as keyof CustomerFormData,
                          row.nameField as keyof CustomerFormData,
                          list,
                          e.target.value
                        )
                      }
                      className={`w-full rounded-lg border ${isApproved ? "bg-gray-200" : "bg-white"} px-4 py-2
                        ${
                          invalidFields.includes(row.nameField)
                            ? 'error-border'
                            : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select</option>
                      {list.map((emp, i) => (
                        <option key={`${emp.employeetype}-${emp.employeeno}-name-${i}`} value={emp.employeename}>
                          {emp.employeename}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3 mt-4">
                    <strong className="text-sm">{row.label}</strong>
                    
                    <div>
                      <label className="text-xs text-gray-600">EMPLOYEE NUMBER</label>
                      <select
                        value={formData[row.codeField as keyof CustomerFormData] as string}
                        onChange={(e) =>
                          handleEmployeeNoChange(
                            row.codeField as keyof CustomerFormData,
                            row.nameField as keyof CustomerFormData,
                            list,
                            e.target.value
                          )
                        }
                        className={`w-full mt-1 rounded-lg border ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm
                          ${
                            invalidFields.includes(row.codeField)
                              ? 'error-border'
                              : 'border-gray-300'
                          }`}
                      >
                        <option value="">Select</option>
                        {list.map((emp, i) => (
                        <option key={`${emp.employeetype}-${emp.employeeno}-${i}`} value={emp.employeeno}>
                          {emp.employeeno}
                        </option>
                      ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">NAME</label>
                      <select
                        value={formData[row.nameField as keyof CustomerFormData] as string}
                        onChange={(e) =>
                          handleEmployeeNameChange(
                            row.codeField as keyof CustomerFormData,
                            row.nameField as keyof CustomerFormData,
                            list,
                            e.target.value
                          )
                        }
                        className={`w-full mt-1 rounded-lg border ${isApproved ? "bg-gray-200" : "bg-white"} px-3 py-2 text-sm
                          ${
                            invalidFields.includes(row.nameField)
                              ? 'error-border'
                              : 'border-gray-300'
                          }`}
                      >
                        <option value="">Select</option>
                        {list.map((emp, i) => (
                        <option key={`${emp.employeetype}-${emp.employeeno}-name-${i}`} value={emp.employeename}>
                          {emp.employeename}
                        </option>
                      ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signature Section - DESKTOP ORIGINAL LAYOUT */}
          <div className="hidden md:block mt-10 pt-4">
            <div className="flex text-sm mb-2">
              <span>Requested By:</span>
              <span className="ml-[135px]">Processed By:</span>
              <span className="ml-[150px]">Approved By:</span>
            </div>

            {/* Dates */}
            <div className="flex text-xs text-gray-600">
              <div className="w-[200px] text-center">{formData.datecreated}</div>
              <div className="w-[200px] text-center ml-10">{formData.initialapprovedate}</div>
              <div className="w-[200px] text-center ml-10">{formData.secondapproverdate}</div>
              <div className="w-[200px] text-center ml-10">{formData.thirdapproverdate}</div>
            </div>

            {/* Signature lines */}
            <div className="flex">
              <div className="w-[200px] border-b border-black"></div>
              <div className="w-[200px] border-b border-black ml-10"></div>
              <div className="w-[200px] border-b border-black ml-10"></div>
              <div className="w-[200px] border-b border-black ml-10"></div>
            </div>

            {/* Names */}
            <div className="flex text-sm">
              <div className="w-[200px] text-center">
                {makerName && <span className="font-semibold">{makerName}</span>}
              </div>
              <div className="w-[200px] text-center ml-10">
                {formData.firstapprovername && <span className="font-semibold">{formData.firstapprovername}</span>}
              </div>
              <div className="w-[200px] text-center ml-10">
                {formData.secondapprovername && <span className="font-semibold">{formData.secondapprovername}</span>}
              </div>
              <div className="w-[200px] text-center ml-10">
                {formData.finalapprovername && <span className="font-semibold">{formData.finalapprovername}</span>}
              </div>
            </div>
          </div>

          {/* Signature Section - MOBILE STACKED LAYOUT */}
          <div className="md:hidden mt-6 pt-4 space-y-4">
            <div>
              <div className="text-xs font-semibold mb-1">Requested By:</div>
              <div className="text-xs text-gray-600">{formData.datecreated}</div>
              <div className="border-b border-black mt-2"></div>
              <div className="text-xs text-center mt-1">
                {makerName && <span className="font-semibold">{makerName}</span>}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold mb-1">Processed By:</div>
              <div className="text-xs text-gray-600">{formData.initialapprovedate}</div>
              <div className="border-b border-black mt-2"></div>
              <div className="text-xs text-center mt-1">
                {formData.firstapprovername && <span className="font-semibold">{formData.firstapprovername}</span>}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold mb-1">Approved By:</div>
              <div className="text-xs text-gray-600">{formData.secondapproverdate}</div>
              <div className="border-b border-black mt-2"></div>
              <div className="text-xs text-center mt-1">
                {formData.secondapprovername && <span className="font-semibold">{formData.secondapprovername}</span>}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold mb-1">Final Approval:</div>
              <div className="text-xs text-gray-600">{formData.thirdapproverdate}</div>
              <div className="border-b border-black mt-2"></div>
              <div className="text-xs text-center mt-1">
                {formData.finalapprovername && <span className="font-semibold">{formData.finalapprovername}</span>}
              </div>
            </div>
          </div>

          
          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row md:justify-end gap-2 md:gap-4 pt-6 mt-8">
            
            {formData.approvestatus === "APPROVED" ? (
              <>
                <button
                  type="button"
                  onClick={handlePrintClick}
                  className="px-4 md:px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  PRINT
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base"
                >
                  Close
                </button>
              </>
            ) : formData.approvestatus === "" ? (
              <>
                
                {isEditMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdateClick}
                      disabled={isUpdateLoading}
                      className="px-4 md:px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      {isUpdateLoading && <Spinner />}
                      {isUpdateLoading ? 'Updating...' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      disabled={isCancelLoading}
                      className="px-4 md:px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      {isCancelLoading && <Spinner />}
                      {isCancelLoading ? 'Cancelling...' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitClick}
                      disabled={isSubmitLoading}
                      className="px-4 md:px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      {isSubmitLoading && <Spinner />}
                      {isSubmitLoading ? 'Submitting...' : 'Submit'}
                    </button>
                  </>
                )}
                {!isEditMode && (
                  <button
                    type="button"
                    disabled={isDraftLoading}
                    onClick={handleDraftClick}
                    className="px-4 md:px-6 py-2 rounded text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    {isDraftLoading && <Spinner />}
                    {isDraftLoading ? 'Saving...' : 'Draft'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base"
                >
                  Close
                </button>
              </>
            ) : formData.approvestatus === "PENDING" ? (
              <>
                 {userPermissions.hasEditAccess && (
                    <button
                      type="button"
                      onClick={handleUpdateClick}
                      disabled={isUpdateLoading}
                      className="px-4 md:px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      {isUpdateLoading && <Spinner />}
                      {isUpdateLoading ? 'Updating...' : 'Update'}
                    </button>
                  )}
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={isCancelLoading}
                  className="px-4 md:px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isCancelLoading && <Spinner />}
                  {isCancelLoading ? 'Cancelling...' : 'Cancel'}
                </button>
                {userPermissions.isApprover && (
                  <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isApproveLoading}
                  className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isApproveLoading && <Spinner />}
                  {isApproveLoading ? 'Approving...' : 'Approved'}
                </button>

                
                )}
                {userPermissions.isApprover && (
                <button
                  type="button"
                  onClick={handleReturnClick}
                  disabled={isReturnLoading}
                  className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isApproveLoading && <Spinner />}
                  {isApproveLoading ? 'Returning...' : 'Return to Maker'}
                </button>
              )}

                <button type="button" onClick={onClose} className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base">
                  Close
                </button>
                
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={isCancelLoading}
                  className="px-4 md:px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isCancelLoading && <Spinner />}
                  {isCancelLoading ? 'Cancelling...' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={isSubmitLoading}
                  className="px-4 md:px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isSubmitLoading && <Spinner />}
                  {isSubmitLoading ? 'Submitting...' : 'Submit'}
                </button>
                <button type="button" onClick={onClose} className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base">
                  Close
                </button>
              </>
            )}
          </div>
           <ConfirmationDialog
            isOpen={confirmDialog.isOpen}
            onClose={() => setConfirmDialog({ isOpen: false, action: null })}
            onConfirm={handleConfirmedAction}
            action={confirmDialog.action || 'update'}
          />

          {/* Return to Maker Modal */}
          {returnDialog.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-[500px]">
                <h3 className="text-lg md:text-xl font-bold mb-4">Return to Maker</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">Please provide remarks for returning this form to the maker:</p>
                
                <textarea
                  value={returnDialog.remarks}
                  onChange={(e) => setReturnDialog(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full h-32 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-300 resize-none text-sm md:text-base"
                  placeholder="Enter your remarks here..."
                />
                
                <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setReturnDialog({ isOpen: false, remarks: '' })}
                    disabled={isReturnLoading}
                    className="px-4 md:px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnSubmit}
                    disabled={isReturnLoading || !returnDialog.remarks.trim()}
                    className="px-4 md:px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    {isReturnLoading && <Spinner />}
                    {isReturnLoading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </fieldset>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
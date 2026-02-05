import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import SupportingDocumentsDialog from '@/components/uploading/SupportingDocumentsDialog';

interface CustomerFormData {
  requestfor: string[];
  ismother: string[];
  type: string[];
  saletype: string[];
  soldtoparty: string;
  idtype: string;
  tin: string;
  billaddress: string;
  shiptoparty: string;
  storecode: string;
  busstyle: string;
  deladdress: string;
  contactperson: string;
  email: string;
  position: string;
  contactnumber: string;
  boscode: string;
  bucenter: string;
  region: string;
  district: string;
  salesinfosalesorg: string;
  salesinfodistributionchannel: string;
  salesinfodivision: string;
  checkcaprow1: string;
  checkcaprow2: string;
  checkcaprow3: string;
  checkcaprow4: string;
  checkcaprow5: string;
  checkcaprow6: string;
  datestart: string;
  terms: string;
  creditlimit: string;
  targetvolumeday: string;
  targetvolumemonth: string;
  bccode: string;
  bcname: string;
  saocode: string;
  saoname: string;
  supcode: string;
  supname: string;
  custtype: string;
  lastname: string;
  firstname: string;
  middlename: string;
  gencode?: string;
}

interface CustomerFormProps {
  dialogVisible: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  initialData?: CustomerFormData | null;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ dialogVisible, onClose, onSubmit ,initialData}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    requestfor: [],
    ismother: [],
    type: ['CORPORATION'],
    saletype: [],
    soldtoparty: '',
    idtype: 'TIN',
    tin: '',
    billaddress: '',
    shiptoparty: '',
    storecode: '',
    busstyle: '',
    deladdress: '',
    contactperson: '',
    email: '',
    position: '',
    contactnumber: '',
    boscode: '',
    bucenter: '',
    region: '',
    district: '',
    salesinfosalesorg: '',
    salesinfodistributionchannel: '',
    salesinfodivision: '',
    checkcaprow1: '',
    checkcaprow2: '',
    checkcaprow3: '',
    checkcaprow4: '',
    checkcaprow5: '',
    checkcaprow6: '',
    datestart: new Date().toISOString().split('T')[0],
    terms: '',
    creditlimit: '',
    targetvolumeday: '',
    targetvolumemonth: '',
    bccode: '',
    bcname: '',
    saocode: '',
    saoname: '',
    supcode: '',
    supname: '',
    custtype: '',
    lastname: '',
    firstname: '',
    middlename: '',
    
  });
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [bucenterOptions, setBucenterOptions] = useState<string[]>([]);
  const [custTypeOptions, setCustTypeOptions] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);

  const [salesorgOptions, setSalesOrgOptions] = useState<string[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<string[]>([]);
  const [dcOptions, setDCOPtions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [prevRegion, setPrevRegion] = useState<string>('');

  const [hasServerFiles, setHasServerFiles] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    birBusinessRegistration: null,
    secRegistration: null,
    generalInformation: null,
    boardResolution: null,
    others: null
  });
  
   useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  // When region changes, reset BU center & district

useEffect(() => {
  setFormData(prev => ({ ...prev, bucenter: prev.bucenter || '', district: prev.district || '' }));
}, [formData.region]);

// When BU center changes, reset district
useEffect(() => {
  setFormData(prev => ({ ...prev, district: prev.district || '' }));
}, [formData.bucenter]);

  const handleCheckboxChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    onClose();
  };

  if (!dialogVisible) return null;

  useEffect(() => {
    // on mount fetch customer type series entries
    const fetchCustTypes = async () => {
      const { data, error } = await supabase
        .from('customertypeseries')
        .select('carftype')
        .order('id', { ascending: true });
      if (error) {
        console.error('Error fetching customer type series:', error);
        // optionally toast an error
      } else if (data) {
        // filter out null/empty and maybe unique them
        const options = Array.from(
          new Set(data.map((row) => row.carftype).filter((v): v is string => !!v))
        );
        setCustTypeOptions(options);
      }
    };

    fetchCustTypes();
  }, []);

  useEffect(() => {
    // on mount fetch customer type series entries
    const fetchRegion = async () => {
      const { data, error } = await supabase
        .from('regionbu')
        .select('region')
        .order('id', { ascending: true });
      if (error) {
        console.error('Error fetching customer type series:', error);
      } else if (data) {
        // filter out null/empty and maybe unique them
        const options = Array.from(
          new Set(data.map((row) => row.region).filter((v): v is string => !!v))
        );
        setRegionOptions(options);
      }
    };

    fetchRegion();
  }, []);

  useEffect(() => {
    if (!formData.region) {
      setBucenterOptions([]);
      return;
    }
    const fetchBUCenter = async () => {
      const { data, error } = await supabase
        .from('regionbu')
        .select('bucenter')
        .eq('region', formData.region)
        .order('id', { ascending: true });
        // console.log(data);
      if (error) {
        console.error('Error fetching customer type series:', error);
      } else if (data) {
        // filter out null/empty and maybe unique them
        const options = Array.from(
          new Set(data.map((row) => row.bucenter).filter((v): v is string => !!v))
        );
        if (formData.bucenter && !options.includes(formData.bucenter)) {
          options.push(formData.bucenter);
        }
        setBucenterOptions(options);
      }
    };

    fetchBUCenter();
  }, [formData.region]);

  useEffect(() => {
    if (!formData.bucenter) {
      setDistrictOptions([]);
      return;
    }
    const fetchDistrict = async () => {
      const { data, error } = await supabase
        .from('regionbu')
        .select('district')
        .eq('bucenter', formData.bucenter)
        .order('id', { ascending: true });
        // console.log(data);
      if (error) {
        console.error('Error fetching customer type series:', error);
      } else if (data) {
        // filter out null/empty and maybe unique them
        const options = Array.from(
          new Set(data.map((row) => row.district).filter((v): v is string => !!v))
        );
        setDistrictOptions(options);
      }
    };

    fetchDistrict();
  }, [formData.bucenter]);

  useEffect(() => {
    // on mount fetch customer type series entries
    const fetchSalesOrg = async () => {
      const { data, error } = await supabase
        .from('salesinfosalesorg')
        .select('salesorganization')
        .order('salesorganization', { ascending: true });
      if (error) {
        console.error('Error fetching sales organization:', error);
      } else if (data) {
        // filter out null/empty and maybe unique them
        const options = Array.from(
          new Set(data.map((row) => row.salesorganization).filter((v): v is string => !!v))
        );
        setSalesOrgOptions(options);
      }
    };

    fetchSalesOrg();
  }, []);


  useEffect(() => {
    // on mount fetch customer type series entries
    const fetchDivision= async () => {
      const { data, error } = await supabase
        .from('salesinfodivision')
        .select('division')
        .order('division', { ascending: true });
      if (error) {
        console.error('Error fetching division:', error);
      } else if (data) {
        // filter out null/empty and maybe unique them
        const options = Array.from(
          new Set(data.map((row) => row.division).filter((v): v is string => !!v))
        );
        setDivisionOptions(options);
      }
    };

    fetchDivision();
  }, []);
  
   useEffect(() => {
    // on mount fetch customer type series entries
    const fetchDistributionChannel= async () => {
      const { data, error } = await supabase
        .from('salesinfodistributionchannel')
        .select('distributionchannel')
        .order('distributionchannel', { ascending: true });
      if (error) {
        console.error('Error fetching distribution channel:', error);
      } else if (data) {
        // filter out null/empty and maybe unique them
        const options = Array.from(
          new Set(data.map((row) => row.distributionchannel).filter((v): v is string => !!v))
        );
        setDCOPtions(options);
      }
    };

    fetchDistributionChannel();
  }, []);

  useEffect(() => {
    const checkForServerFiles = async () => {
      const gencode = formData.gencode || initialData?.gencode;
      
      if (!gencode) {
        setHasServerFiles(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3001/api/gencode/${gencode}`);
        const data = await res.json();
        
        // Check if any document type has files
        const hasAnyFiles = Object.values(data).some(
          (files: any) => Array.isArray(files) && files.length > 0
        );
        
        setHasServerFiles(hasAnyFiles);
        
        // Optionally, update uploadedFiles state to reflect server files
        if (hasAnyFiles) {
          const newUploadedFiles: any = {};
          Object.keys(data).forEach((key) => {
            if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
              // Create placeholder File to indicate server files exist
              newUploadedFiles[key] = new File([''], 'server-files-exist', { 
                type: 'application/placeholder' 
              });
            }
          });
          setUploadedFiles(prev => ({ ...prev, ...newUploadedFiles }));
        }
      } catch (err) {
        console.error('Error checking for server files:', err);
        setHasServerFiles(false);
      }
    };

    if (dialogVisible) {
      checkForServerFiles();
    }
  }, [dialogVisible, formData.gencode, initialData?.gencode]);

  const handleFileUpload = (docType: keyof typeof uploadedFiles, file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const hasAnyFiles = hasServerFiles || Object.values(uploadedFiles).some(f => f !== null);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8">
      <div className="no-scrollbar bg-gray-100 text-black w-full max-w-[75vw] rounded-lg shadow-lg overflow-y-scroll max-h-[100vh] p-20 m-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 mb-4">
          <h2 className="text-xl font-bold">📄 CUSTOMER ACTIVATION REQUEST FORM</h2>
          <button onClick={closeDialog} className="text-gray-500 hover:text-blue-700 text-xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Company Header Info */}
          <div className="text-center mb-6">
            <div className="text-xl font-bold mb-1">BOUNTY PLUS INC.</div>
            <div className="mb-1">Inoza Tower 40th Street, BGC, Taguig City</div>
            <div className="mb-1">Tel: 663-9639 local 1910</div>
            <div className="text-xl font-bold mt-3 mb-4">CUSTOMER ACTIVATION REQUEST FORM</div>

            <div className="flex items-center justify-center mt-4">
              <strong className="text-xl mr-8">FOR</strong>
              <select
                value={formData.custtype}
                onChange={(e) => handleInputChange('custtype', e.target.value)}
                className="w-[350px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              >
                <option value="" disabled>
                  Select WMS Customer Group
                </option>
                {custTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {/* Include current value if not in options */}
                {formData.custtype && !custTypeOptions.includes(formData.custtype) && (
                  <option value={formData.custtype}>{formData.custtype}</option>
                )}
              </select>

            </div>
          </div>

          {/* REQUEST FOR */}
          <div className="flex items-center mt-4">
            <strong className="text-xl min-w-[150px]">REQUEST FOR:</strong>
            <div className="flex items-center space-x-6">
              {['ACTIVATION', 'DEACTIVATION', 'EDIT'].map(option => (
                <label key={option} className="flex items-center text-xl">
                  <input
                    type="checkbox"
                    checked={formData.requestfor.includes(option)}
                    onChange={() => handleCheckboxChange('requestfor', option)}
                    className="mr-2"
                  />
                  <span>{option} of Customer Code</span>
                </label>
              ))}
            </div>
          </div>

          {/* APPLY FOR */}
          <div className="flex items-center mt-1">
            <strong className="text-xl min-w-[150px]">APPLY FOR:</strong>
            <div className="flex items-center space-x-6">
              {['SOLD TO PARTY', 'SHIP TO PARTY'].map(option => (
                <label key={option} className="flex items-center text-xl">
                  <input
                    type="checkbox"
                    checked={formData.ismother.includes(option)}
                    onChange={() => handleCheckboxChange('ismother', option)}
                    className="mr-2"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* TYPE */}
        <div className="flex items-center mt-4">
        <strong className="text-xl min-w-[150px]">TYPE:</strong>
        <div className="flex items-center space-x-6">
            {['PERSONAL', 'CORPORATION'].map(option => (
            <label key={option} className="flex items-center text-xl">
                <input
                type="radio"
                name="type"
                value={option}
                checked={formData.type[0] === option}
                onChange={(e) => setFormData(prev => ({ ...prev, type: [e.target.value] }))}
                className="mr-2"
                />
                <span>{option === 'PERSONAL' ? 'INDIVIDUAL' : 'CORPORATION'}</span>
            </label>
            ))}
        </div>
        </div>

                    {/* DISTRIBUTION CHANNEL */}
          <div className="flex items-center mt-4">
            <strong className="text-xl min-w-[150px]">DISTRIBUTION CHANNEL:</strong>
            <div className="flex items-center space-x-6">
              {['OUTRIGHT', 'CONSIGNMENT'].map(option => (
                <label key={option} className="flex items-center text-xl">
                  <input
                    type="checkbox"
                    checked={formData.saletype.includes(option)}
                    onChange={() => handleCheckboxChange('saletype', option)}
                    className="mr-2"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Corporation Name Section */}
          {formData.type.includes('CORPORATION') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-xl items-start">
            {/* LEFT COLUMN */}
            <div>
              <label className="block font-semibold mb-2">
                REGISTERED COMPANY NAME (SOLD TO PARTY):
              </label>
              <input
                type="text"
                value={formData.soldtoparty}
                onChange={(e) => handleInputChange('soldtoparty', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              />
              <i className="text-sm text-gray-600">
                Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts
              </i>
            </div>

            {/* RIGHT COLUMN */}
            <div>
              {/* ID TYPE inline */}
              <div className="flex items-center space-x-6 mb-2">
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

              {/* TIN input */}
              <div className="flex items-center space-x-2">
                <strong>{formData.idtype === 'OTHERS' ? 'OTHERS:' : 'TIN:'}</strong>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => handleInputChange('tin', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          </div>
          )}

          {/* Personal Name Section */}
          {formData.type.includes('PERSONAL') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-xl items-start">
              {/* LEFT COLUMN – Name Fields */}
              <div>
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 mb-2">
                  <strong>LAST NAME</strong>
                  <span></span>
                  <strong>FIRST NAME</strong>
                  <span></span>
                  <strong>MIDDLE NAME</strong>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2">
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange('lastname', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                  />
                  <span className="flex items-center justify-center">/</span>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange('firstname', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                  />
                  <span className="flex items-center justify-center">/</span>
                  <input
                    type="text"
                    value={formData.middlename}
                    onChange={(e) => handleInputChange('middlename', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                  />
                </div>

                <div className="mt-1">
                  <i className="text-sm text-gray-600">
                    Name to appear on all Records, Official Receipts, Invoices, Delivery Receipts
                  </i>
                </div>
              </div>

              {/* RIGHT COLUMN – ID Type + TIN */}
              <div>
                <div className="flex items-center mb-2">
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

                <div className="flex items-center space-x-2">
                  <strong className="whitespace-nowrap">{formData.idtype === 'OTHERS' ? 'OTHERS:' : 'TIN:'}</strong>
                  <input
                    type="text"
                    value={formData.tin}
                    onChange={(e) => handleInputChange('tin', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Billing Address */}
          <div className="mt-8">
            <div className="text-xl font-bold mb-2">BILLING ADDRESS:</div>
            <input
              type="text"
              value={formData.billaddress}
              onChange={(e) => handleInputChange('billaddress', e.target.value)}
            //   className="border rounded px-3 py-2 w-full max-w-[1200px]"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Branch, Store Code, Trade Name */}
          <div className="mt-8">
            <div className="grid grid-cols-3 gap-6 text-xl mb-2">
                <strong className="font-bold">BRANCH (SHIP TO PARTY):</strong>
                <strong className="font-bold">STORE CODE:</strong>
                <strong className="font-bold">TRADE NAME (BUSINESS STYLE):</strong>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <input
                type="text"
                value={formData.shiptoparty}
                onChange={(e) => handleInputChange('shiptoparty', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              />
              <input
                type="text"
                value={formData.storecode}
                onChange={(e) => handleInputChange('storecode', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              />
              <input
                type="text"
                value={formData.busstyle}
                onChange={(e) => handleInputChange('busstyle', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="mt-8">
            <div className="text-xl font-bold mb-2">DELIVERY ADDRESS:</div>
            <input
              type="text"
              value={formData.deladdress}
              onChange={(e) => handleInputChange('deladdress', e.target.value)}
            //   className="border rounded px-3 py-2 w-full max-w-[1200px]"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Requested By Section */}
          <div className="mt-10 text-xl">
            <div className="font-bold mb-4">Requested By:</div>
            
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="flex items-center space-x-4">
                <strong className="whitespace-nowrap">Customer Name:</strong>
                <input
                  type="text"
                  value={formData.contactperson}
                  onChange={(e) => handleInputChange('contactperson', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                />
              </div>
              <div className="flex items-center space-x-4">
                <strong className="whitespace-nowrap">Email Address:</strong>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-[600px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <strong className="whitespace-nowrap">Position:</strong>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-[600px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                />
              </div>
              <div className="flex items-center space-x-4">
                <strong className="whitespace-nowrap">Cellphone No.:</strong>
                <input
                  type="tel"
                  value={formData.contactnumber}
                  onChange={(e) => handleInputChange('contactnumber', e.target.value)}
                  className="w-[500px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <strong>Supporting Documents:</strong>
              <button
              type="button"
              className={`ml-4 px-4 py-2 rounded ${
                hasAnyFiles
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                onClick={() => setDialogOpen(true)}
            >
              {hasAnyFiles ? 'VIEW FILES' : 'CHOOSE FILE'}
            </button>
              <SupportingDocumentsDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                uploadedFiles={uploadedFiles}
                onFileUpload={handleFileUpload}
                gencode={formData.gencode}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mt-5">
            <hr className="border-t border-dashed border-black" />
          </div>

          {/* BPlus Section */}
          <div className="mt-2">
            <i className="text-sm">To be filled out by BPlus:</i>
          </div>

          {/* BOS/WMS Code and Business Center */}
          <div className="grid grid-cols-2 gap-6 mb-4 text-xl">
            <div className="flex items-center">
              <strong className="mr-4">BOS/WMS CODE:</strong>
              <input
                type="text"
                value={formData.boscode}
                onChange={(e) => handleInputChange('boscode', e.target.value)}
                // className="border rounded px-3 py-2 w-[300px]"
                className="w-[300px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                readOnly={formData.requestfor.includes('ACTIVATION')}
              />
            </div>
            <div className="flex items-center">
              <strong className="mr-4">BUSINESS CENTER:</strong>
              <select
                value={formData.bucenter}
                onChange={(e) => handleInputChange('bucenter', e.target.value)}
                // className="border rounded px-3 py-2 w-[300px]"
                className="w-[400px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              >
                <option value="" disabled>
                  Select BU Center
                </option>
                {bucenterOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {/* Include current value if not in options */}
                {formData.bucenter && !bucenterOptions.includes(formData.bucenter) && (
                  <option value={formData.bucenter}>{formData.bucenter}</option>
                )}
              </select>
            </div>
          </div>

          {/* Region and District */}
          <div className="grid grid-cols-2 gap-6 mb-4 text-xl">
            <div className="flex items-center">
              <strong className="mr-20">REGION:</strong>
              <select
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                // className="border rounded px-3 py-2 w-[450px]"
                className="w-[450px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              >
                <option value="" disabled>
                  Select Region
                </option>
                {regionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {/* Include current value if not in options */}
                {formData.region && !regionOptions.includes(formData.region) && (
                  <option value={formData.region}>{formData.region}</option>
                )}
              </select>
            </div>
            <div className="flex items-center">
              <strong className="mr-4">DISTRICT:</strong>
              <select
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                // className="border rounded px-3 py-2 w-[450px]"
                className="w-[420px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              >
                <option value="" disabled>
                  Select District
                </option>
                {districtOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {/* Include current value if not in options */}
                {formData.district && !districtOptions.includes(formData.district) && (
                  <option value={formData.district}>{formData.district}</option>
                )}
              </select>
            </div>
          </div>

          {/* Sales Info */}
          <div className="mt-6">
            <div className="text-xl font-bold mb-2">SALES INFO:</div>
            <div className="grid grid-cols-2 gap-6 mb-4 text-xl">
              <div className="flex items-center">
                <strong className="mr-12">SALES ORG:</strong>
                <select
                  value={formData.salesinfosalesorg}
                  onChange={(e) => handleInputChange('salesinfosalesorg', e.target.value)}
                //   className="border rounded px-3 py-2 w-[300px]"
                className="w-[300px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                >
                  <option value="" disabled>
                  Select Sales Organization
                </option>
                {salesorgOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {/* Include current value if not in options */}
                {formData.salesinfosalesorg && !salesorgOptions.includes(formData.salesinfosalesorg) && (
                  <option value={formData.salesinfosalesorg}>{formData.salesinfosalesorg}</option>
                )}
                </select>
              </div>
              <div className="flex items-center">
                <strong className="mr-4">DISTRIBUTION CHANNEL:</strong>
                <select
                  value={formData.salesinfodistributionchannel}
                  onChange={(e) => handleInputChange('salesinfodistributionchannel', e.target.value)}
                //   className="border rounded px-3 py-2 w-[350px]"
                className="w-[350px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                >
                   <option value="" disabled>
                  Select Distribution Channel
                </option>
                {dcOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}

                {/* Include current value if not in options */}
                {formData.salesinfodistributionchannel && !dcOptions.includes(formData.salesinfodistributionchannel) && (
                  <option value={formData.salesinfodistributionchannel}>{formData.salesinfodistributionchannel}</option>
                )}
                </select>
              </div>
            </div>
            <div className="flex items-center mt-4 text-xl">
              <strong className="mr-20">DIVISION:</strong>
              <select
                value={formData.salesinfodivision}
                onChange={(e) => handleInputChange('salesinfodivision', e.target.value)}
                // className="border rounded px-3 py-2 w-[350px]"
                className="w-[350px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
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

          <div className="mt-6">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 w-[500px] text-center">TRUCK DESCRIPTION</th>
                    <th className="border border-gray-400 p-2 w-[700px] text-center">CHECK CAPACITY</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '2TONNER FRESH3 - 1500kg', field: 'checkcaprow1' },
                    { label: '2TONNER FROZEN - 1500kg', field: 'checkcaprow2' },
                    { label: '4TONNER FRESH - 2600kg', field: 'checkcaprow3' },
                    { label: '4TONNER FROZEN - 2600kg', field: 'checkcaprow4' },
                    { label: 'FORWARD FRESH - 6000kg', field: 'checkcaprow5' },
                    { label: 'FORWARD FROZEN - 6000kg', field: 'checkcaprow6' },
                  ].map((row) => (
                    <tr key={row.field}>
                      <td className="border border-gray-400 p-2 text-center">{row.label}</td>
                      <td className="border border-gray-400 p-2">
                        <input
                          type="text"
                          value={formData[row.field as keyof CustomerFormData] as string}
                          placeholder="Enter truck capacity"
                          onChange={(e) => handleInputChange(row.field as keyof CustomerFormData, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          {/* Date, Terms, Credit Limit */}
          <div className="grid grid-cols-3 gap-6 mb-4 text-xl">
            <div className="flex items-center">
              <strong className="mr-8">DATE TO START:</strong>
              <input
                type="date"
                value={formData.datestart}
                onChange={(e) => handleInputChange('datestart', e.target.value)}
                // className="border rounded px-3 py-2 w-[200px]"
                className="w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                readOnly
              />
            </div>
            <div className="flex items-center">
              <strong className="mr-4">TERMS:</strong>
              <select
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                // className="border rounded px-3 py-2 w-[220px]"
                className="w-[220px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                
              >
                <option value="">Select Terms</option>
                <option value="COD">COD</option>
                <option value="NET30">NET30</option>
                <option value="Z15">Z15</option>
              </select>
            </div>
            <div className="flex items-center">
              <strong className="mr-4">CREDIT LIMIT:</strong>
              <input
                type="text"
                value={formData.creditlimit}
                onChange={(e) => handleInputChange('creditlimit', e.target.value)}
                // className="border rounded px-3 py-2 w-[250px]"
                className="w-[250px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* Target Volume */}
          {formData.custtype !== 'HIGH RISK ACCOUNTS' && (
            <>
              <div className="flex items-center mt-8 text-xl">
                <strong className="mr-4">
                  TARGET VOLUME ({formData.custtype === 'LIVE SALES' ? 'hds' : 'kgs'})/DAY:
                </strong>
                <input
                  type="text"
                  value={formData.targetvolumeday}
                  onChange={(e) => handleInputChange('targetvolumeday', e.target.value)}
                //   className="border rounded px-3 py-2 w-[200px]"
                className="w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                />
              </div>
              <div className="flex items-center mt-8 text-xl">
                <strong className="mr-4">
                  TARGET VOLUME ({formData.custtype === 'LIVE SALES' ? 'hds' : 'kgs'})/MONTH:
                </strong>
                <input
                  type="text"
                  value={formData.targetvolumemonth}
                  onChange={(e) => handleInputChange('targetvolumemonth', e.target.value)}
                //   className="border rounded px-3 py-2 w-[200px]"
                  className="w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                  readOnly
                />
              </div>
            </>
          )}

          {/* Employee Section */}
          <div className="mt-6">
            <div className="grid grid-cols-[200px_1fr_1fr] gap-3 text-xl font-bold mb-2">
              <div></div> {/* Empty for label column */}
              <div>EMPLOYEE NUMBER</div>
              <div>NAME</div>
            </div>

            {[
              { label: 'EXECUTIVE:', codeField: 'bccode', nameField: 'bcname' },
              { label: 'GM/SAM/AM:', codeField: 'saocode', nameField: 'saoname' },
              { label: 'SAO/SUPERVISOR:', codeField: 'supcode', nameField: 'supname' },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-[200px_1fr_1fr] gap-3 items-center mt-3 text-xl">
                <strong>{row.label}</strong>
                <select
                  value={formData[row.codeField as keyof CustomerFormData] as string}
                  onChange={(e) => handleInputChange(row.codeField as keyof CustomerFormData, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                >
                  <option value="" disabled>
                    {formData[row.codeField as keyof CustomerFormData]|| 'Select'}
                  </option>
                  
                </select>
                <select
                  value={formData[row.nameField as keyof CustomerFormData] as string}
                  onChange={(e) => handleInputChange(row.nameField as keyof CustomerFormData, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm"
                >
                   <option value="" disabled>
                    {formData[row.nameField as keyof CustomerFormData]|| 'Select'}
                  </option>
                </select>
              </div>
            ))}
          </div>


          {/* Signature Section */}
          <div className="mt-10 pt-4">
            <div className="flex text-sm mb-2">
              <span>Requested By:</span>
              <span className="ml-[135px]">Processed By:</span>
              <span className="ml-[150px]">Approved By:</span>
            </div>

            <div className="flex mt-6 mb-2">
              <div className="w-[200px] border-b border-black"></div>
              <div className="w-[200px] border-b border-black ml-10"></div>
              <div className="w-[200px] border-b border-black ml-10"></div>
              <div className="w-[200px] border-b border-black ml-10"></div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 mt-8">
            <button
              type="button"
              onClick={closeDialog}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFormSubmit } from './useFormSubmit';
import { useFormApproval } from './useFormApproval';

export interface CustomerFormData {
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
  checkcapRow1: string;
  checkcapRow2: string;
  checkcapRow3: string;
  checkcapRow4: string;
  checkcapRow5: string;
  checkcapRow6: string;
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
  approvestatus: string;
  territoryregion: string;
  territoryprovince: string;
  territorycity: string;
  salesterritory: string;
  maker: string;
  datecreated: string;
  firstapprovername: string;
  initialapprovedate: string;
  secondapprovername: string;
  secondapproverdate: string;
  finalapprovername: string;
  thirdapproverdate: string;
  opscode: string;
  opsname: string;
}

export interface TermOption { code: string; name: string; }
export interface EmployeeOption { employeeno: string; employeename: string; }
export interface CodeTextOption { text: string; code: string; }

export const useCustomerForm = (
  initialData?: CustomerFormData | null,
  dialogVisible?: boolean,
  onClose?: () => void
) => {
  // ==================== FORM STATE ====================
  const [formData, setFormData] = useState<CustomerFormData>({
    requestfor: [], ismother: [], type: ['CORPORATION'], saletype: [],
    soldtoparty: '', idtype: 'TIN', tin: '', billaddress: '',
    shiptoparty: '', storecode: '', busstyle: '', deladdress: '',
    contactperson: '', email: '', position: '', contactnumber: '',
    boscode: '', bucenter: '', region: '', district: '',
    salesinfosalesorg: '', salesinfodistributionchannel: '', salesinfodivision: '',
    checkcapRow1: '', checkcapRow2: '', checkcapRow3: '',
    checkcapRow4: '', checkcapRow5: '', checkcapRow6: '',
    datestart: new Date().toISOString().split('T')[0],
    terms: '', creditlimit: '', targetvolumeday: '', targetvolumemonth: '',
    bccode: '', bcname: '', saocode: '', saoname: '',
    supcode: '', supname: '', custtype: '',
    lastname: '', firstname: '', middlename: '',
    approvestatus: '', territoryregion: '', territoryprovince: '',
    territorycity: '', salesterritory: '', maker: '', datecreated: '',
    firstapprovername: '', initialapprovedate: '', secondapprovername: '',
    secondapproverdate: '', finalapprovername: '', thirdapproverdate: '',
    opscode: '', opsname: '',
  });

  // ==================== OPTIONS STATE ====================
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [bucenterOptions, setBucenterOptions] = useState<string[]>([]);
  const [custTypeOptions, setCustTypeOptions] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [paymentLimitOptions, setpaymentLimitOptions] = useState<string[]>([]);
  const [paymentTermsOptions, setpaymentTermsOptions] = useState<TermOption[]>([]);
  const [salesorgOptions, setSalesOrgOptions] = useState<string[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<string[]>([]);
  const [dcOptions, setDCOPtions] = useState<string[]>([]);
  const [salesTerritoryOptions, setSalesTerritoryOptions] = useState<string[]>([]);
  const [regionTerritoryOptions, setRegionTerritoryOptions] = useState<CodeTextOption[]>([]);
  const [stateProvinceOptions, setStateProvinceOptions] = useState<CodeTextOption[]>([]);
  const [cityMunicipalityOptions, setCityMunicipalityOptions] = useState<CodeTextOption[]>([]);
  const [companyData, setCompanyData] = useState<Array<{ custname: string; street: string }>>([]);
  const [companyNameOptions, setCompanyNameOptions] = useState<string[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{
    GM: EmployeeOption[]; AM: EmployeeOption[]; SS: EmployeeOption[]; OPS: EmployeeOption[];
  }>({ GM: [], AM: [], SS: [], OPS: [] });

  // ==================== UI STATE ====================
  const [loading, setLoading] = useState(false);
  const [isCustomLimit, setIsCustomLimit] = useState(false);
  const [hasServerFiles, setHasServerFiles] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{
    birBusinessRegistration: File | null; sp2GovernmentId: File | null;
    secRegistration: File | null; generalInformation: File | null;
    boardResolution: File | null; others: File | null;
  }>({
    birBusinessRegistration: null, sp2GovernmentId: null,
    secRegistration: null, generalInformation: null,
    boardResolution: null, others: null,
  });
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const [userPermissions, setUserPermissions] = useState({ isApprover: false, hasEditAccess: false });
  const [makerName, setMakerName] = useState<string>('');

  // ==================== COMPOSE CHILD HOOKS ====================
  const formSubmit   = useFormSubmit(formData, setFormData, setInvalidFields, uploadedFiles, onClose);
  const formApproval = useFormApproval(onClose);

  // ==================== HELPERS ====================
  const parseApprovers = (value?: string): string[] =>
    (value || '').split(',').map((v) => v.trim()).filter(Boolean);

  const getUserPermissions = async (userid: string) => {
    try {
      const { data, error } = await supabase.from('users').select('approver, editaccess').eq('userid', userid).single();
      if (error) return { isApprover: false, hasEditAccess: false };
      return { isApprover: data?.approver || false, hasEditAccess: data?.editaccess || false };
    } catch { return { isApprover: false, hasEditAccess: false }; }
  };

  const getUserNameByUserId = async (userid: string): Promise<string> => {
    try {
      const { data, error } = await supabase.from('users').select('fullname').eq('userid', userid).single();
      if (error) return '';
      return data?.fullname || '';
    } catch { return ''; }
  };

  const getUserCompany = async (userid: string): Promise<string> => {
    try {
      const { data, error } = await supabase.from('users').select('company').eq('userid', userid).single();
      if (error) return '';
      return data?.company || '';
    } catch { return ''; }
  };

  const fetchMakerNameByUserId = async (makerUserId: string) => {
    if (!makerUserId) { setMakerName(''); return; }
    setMakerName(await getUserNameByUserId(makerUserId));
  };

  // ==================== USER PERMISSIONS ====================
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const userid = (window as any).getGlobal?.('userid');
        const userCompanyForPerms = (window as any).getGlobal?.('company') || '';
        const basePermissions = await getUserPermissions(userid);

        if (formData.custtype) {
          const { data: matrixData, error: matrixError } = await supabase
            .from('approvalmatrix')
            .select('firstapprover, secondapprover, thirdapprover')
            .eq('approvaltype', formData.custtype)
            .eq('company', userCompanyForPerms)
            .single();

          if (!matrixError && matrixData) {
            const isInMatrix =
              parseApprovers(matrixData.firstapprover).includes(userid) ||
              parseApprovers(matrixData.secondapprover).includes(userid) ||
              parseApprovers(matrixData.thirdapprover).includes(userid);
            setUserPermissions({ isApprover: isInMatrix && basePermissions.isApprover, hasEditAccess: basePermissions.hasEditAccess });
            return;
          }
        }
        setUserPermissions(basePermissions);
      } catch { setUserPermissions({ isApprover: false, hasEditAccess: false }); }
    };
    if (dialogVisible) fetchUserPermissions();
  }, [dialogVisible, formData.custtype]);

  useEffect(() => {
    if (dialogVisible && formData.maker) fetchMakerNameByUserId(formData.maker);
  }, [dialogVisible, formData.maker]);

  // ==================== INITIALIZE FORM DATA ====================
  useEffect(() => {
    if (initialData) { setFormData((prev) => ({ ...prev, ...initialData })); setIsEditMode(true); }
    else setIsEditMode(false);
  }, [initialData]);

  // ==================== REGION / DISTRICT CASCADE ====================
  useEffect(() => {
    setFormData((prev) => ({ ...prev, bucenter: prev.bucenter || '', district: prev.district || '' }));
  }, [formData.region]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, district: prev.district || '' }));
  }, [formData.bucenter]);

  // ==================== FETCH OPTIONS ====================
  useEffect(() => {
    supabase.from('customertypeseries').select('carftype').order('id', { ascending: true }).then(({ data, error }) => {
      if (!error && data) setCustTypeOptions(Array.from(new Set(data.map((r) => r.carftype).filter((v): v is string => !!v))));
    });
  }, []);

  useEffect(() => {
    supabase.from('regionbu').select('region').order('id', { ascending: true }).then(({ data, error }) => {
      if (!error && data) setRegionOptions(Array.from(new Set(data.map((r) => r.region).filter((v): v is string => !!v))));
    });
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('paymentterms').select('paymentterm,paymenttermname,limittype,limitgroup').order('id', { ascending: true });
      if (error || !data) return;
      let filtered = data.filter((r) => formData.type.includes(r.limittype) && r.limitgroup === formData.custtype);
      if (!filtered.length) filtered = data;
      const options = filtered.map((v) => v.paymentterm && v.paymenttermname ? { code: v.paymentterm, name: v.paymenttermname } : null).filter(Boolean) as TermOption[];
      setpaymentTermsOptions(Array.from(new Map(options.map((o) => [o.code, o])).values()));
    };
    fetch();
  }, [formData.type, formData.custtype]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: paymentData, error } = await supabase.from('paymentlimit').select('paymentlimit, limittype, limitgroup').order('id', { ascending: true });
        if (error || !paymentData) return;
        const { data: userData } = await supabase.from('users').select('customlimitaccess').eq('userid', (window as any).getGlobal?.('userid')).single();
        const canUseCustomLimit = userData?.customlimitaccess === true;
        let filtered = paymentData.filter((r) => formData.type.includes(r.limittype) && r.limitgroup === formData.custtype);
        if (!filtered.length) filtered = paymentData;
        const opts = Array.from(new Set(filtered.map((r) => r.paymentlimit).filter((v): v is string => !!v)));
        if (canUseCustomLimit && !opts.includes('Enter Custom Limit')) opts.push('Enter Custom Limit');
        setpaymentLimitOptions(opts);
      } catch (err) { console.error('Error fetching payment limits:', err); }
    };
    fetch();
  }, [formData.type, formData.custtype]);

  useEffect(() => {
    if (!formData.region) { setBucenterOptions([]); return; }
    supabase.from('regionbu').select('bucenter').eq('region', formData.region).order('id', { ascending: true }).then(({ data, error }) => {
      if (!error && data) {
        const opts = Array.from(new Set(data.map((r) => r.bucenter).filter((v): v is string => !!v)));
        if (formData.bucenter && !opts.includes(formData.bucenter)) opts.push(formData.bucenter);
        setBucenterOptions(opts);
      }
    });
  }, [formData.region]);

  useEffect(() => {
    if (!formData.bucenter) { setDistrictOptions([]); return; }
    supabase.from('regionbu').select('district').eq('bucenter', formData.bucenter).order('id', { ascending: true }).then(({ data, error }) => {
      if (!error && data) setDistrictOptions(Array.from(new Set(data.map((r) => r.district).filter((v): v is string => !!v))));
    });
  }, [formData.bucenter]);

  useEffect(() => {
    supabase.from('salesinfosalesorg').select('salesorganization').order('salesorganization', { ascending: true }).then(({ data, error }) => {
      if (!error && data) setSalesOrgOptions(Array.from(new Set(data.map((r) => r.salesorganization).filter((v): v is string => !!v))));
    });
  }, []);

  useEffect(() => {
    supabase.from('salesinfodivision').select('division').order('division', { ascending: true }).then(({ data, error }) => {
      if (!error && data) setDivisionOptions(Array.from(new Set(data.map((r) => r.division).filter((v): v is string => !!v))));
    });
  }, []);

  useEffect(() => {
    supabase.from('salesinfodistributionchannel').select('distributionchannel').order('distributionchannel', { ascending: true }).then(({ data, error }) => {
      if (!error && data) setDCOPtions(Array.from(new Set(data.map((r) => r.distributionchannel).filter((v): v is string => !!v))));
    });
  }, []);

  // ==================== CHECK FOR SERVER FILES ====================
  useEffect(() => {
    const check = async () => {
      const gencode = formData.gencode || initialData?.gencode;
      if (!gencode) { setHasServerFiles(false); return; }
      try {
        const res = await fetch(`${BASE_URL}/api/gencode/${gencode}`);
        const data = await res.json();
        const hasAny = Object.values(data).some((f: any) => Array.isArray(f) && f.length > 0);
        setHasServerFiles(hasAny);
        if (hasAny) {
          const newFiles: any = {};
          Object.keys(data).forEach((key) => {
            if (Array.isArray(data[key]) && data[key].length > 0)
              newFiles[key] = new File([''], 'server-files-exist', { type: 'application/placeholder' });
          });
          setUploadedFiles((prev) => ({ ...prev, ...newFiles }));
        }
      } catch { setHasServerFiles(false); }
    };
    if (dialogVisible) check();
  }, [dialogVisible, formData.gencode, initialData?.gencode]);

  // ==================== FETCH EMPLOYEES ====================
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('employees').select('employeeno, employeename, employeetype');
      if (error) { console.error(error); return; }
      const grouped: { GM: EmployeeOption[]; AM: EmployeeOption[]; SS: EmployeeOption[]; OPS: EmployeeOption[] } = { GM: [], AM: [], SS: [], OPS: [] };
      data.forEach((emp) => {
        const type = emp.employeetype?.toUpperCase();
        if (!['GM', 'AM', 'SS', 'OPS'].includes(type)) return;
        grouped[type as 'GM' | 'AM' | 'SS' | 'OPS'].push({ employeeno: emp.employeeno, employeename: emp.employeename });
      });
      (Object.keys(grouped) as Array<keyof typeof grouped>).forEach((key) => {
        const isNoFallback = (name: string) => {
          const n = (name || '').trim().toUpperCase();
          if (key === 'GM') return n.startsWith('NO EXECUTIVE');
          if (key === 'AM') return n.startsWith('NO GM/SAM/AM');
          if (key === 'SS') return n.startsWith('NO SAO/SUPERVISOR');
          if (key === 'OPS') return n.startsWith('NO OPS LEAD/ FIELD OFFICER');
          return false;
        };

        grouped[key].sort((a, b) => {
          const aUp = a.employeename.toUpperCase(), bUp = b.employeename.toUpperCase();
          const aNo = isNoFallback(a.employeename);
          const bNo = isNoFallback(b.employeename);
          if (aNo && !bNo) return -1;
          if (!aNo && bNo) return 1;
          return aUp.localeCompare(bUp);
        });
      });
      setEmployeeOptions(grouped);
    };
    fetch();
  }, []);

  // ==================== FETCH TERRITORY DATA ====================
  useEffect(() => {
    fetch('https://api-bounty.vercel.app/api/salesterritory').then((r) => r.json()).then((data) => {
      if (Array.isArray(data))
        setSalesTerritoryOptions(Array.from(new Set(data.slice(1).map((r: any) => r[0]).filter((v: string) => v && v !== 'N/A'))) as string[]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/regions/').then((r) => r.json()).then((data) => {
      setRegionTerritoryOptions(data.map((r: any) => ({ text: `${r.regionName}: ${r.name}`, code: r.code })));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!formData.territoryregion) { setStateProvinceOptions([]); return; }
    const code = formData.territoryregion;
    if (code === '130000000' || code === 'NCR') {
      setStateProvinceOptions([{ text: 'NCR', code: 'NCR' }]);
      fetch('https://psgc.gitlab.io/api/regions/130000000/cities/').then((r) => r.json())
        .then((d) => setCityMunicipalityOptions(d.map((c: any) => ({ text: c.name, code: c.code })))).catch(console.error);
      return;
    }
    fetch(`https://psgc.gitlab.io/api/regions/${code}/provinces/`).then((r) => r.json())
      .then((d) => setStateProvinceOptions(d.map((p: any) => ({ text: p.name, code: p.code })))).catch(console.error);
  }, [formData.territoryregion]);

  useEffect(() => {
    if (!formData.territoryprovince) { setCityMunicipalityOptions([]); return; }
    const pCode = formData.territoryprovince;
    const url = pCode === 'NCR'
      ? 'https://psgc.gitlab.io/api/regions/130000000/cities/'
      : `https://psgc.gitlab.io/api/provinces/${pCode}/cities-municipalities/`;
    fetch(url).then((r) => r.json())
      .then((d) => setCityMunicipalityOptions(d.map((c: any) => ({ text: c.name, code: c.code })))).catch(console.error);
  }, [formData.territoryprovince]);

  // ==================== SCROLL TO INVALID FIELD ====================
  useEffect(() => {
    if (!invalidFields.length) return;
    setTimeout(() => {
      const el = document.querySelector(`[data-field="${invalidFields[0]}"]`);
      if (!el) return;
      const scrollable = el.closest('.no-scrollbar');
      if (scrollable) (scrollable as HTMLElement).scrollTo({ top: (el as HTMLElement).offsetTop - 20, behavior: 'smooth' });
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) el.focus();
    }, 50);
  }, [invalidFields]);

  // ==================== FETCH COMPANY NAMES ====================
  useEffect(() => {
    if (!dialogVisible) return;
    fetch('https://bos-master-data-manager.bounty.org.ph/master/api_get_customers.php').then((r) => r.json()).then((data) => {
      if (data.success && data.data) {
        const customers = data.data
          .map((c: { custname: string; street: string }) => ({ custname: c.custname, street: c.street || '' }))
          .sort((a: { custname: string }, b: { custname: string }) => a.custname.localeCompare(b.custname));
        setCompanyData(customers);
        setCompanyNameOptions(customers.map((c: { custname: string }) => c.custname));
      }
    }).catch(console.error);
  }, [dialogVisible]);

  // ==================== HANDLERS ====================
  const handleCheckboxChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      return current.includes(value)
        ? { ...prev, [field]: current.filter((v) => v !== value) }
        : { ...prev, [field]: [...current, value] };
    });
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'email') {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isNA = ['NA', 'N/A'].includes(value.trim().toUpperCase());
        if (value.trim() && !valid && !isNA) setInvalidFields((p) => p.includes('email') ? p : [...p, 'email']);
        else setInvalidFields((p) => p.filter((f) => f !== 'email'));
      }
      if (field === 'targetvolumeday') {
        const day = parseFloat(value.replace(/,/g, '')) || 0;
        if (!updated.custtype) updated.targetvolumemonth = '';
        else if (updated.custtype === 'LIVE SALES') updated.targetvolumemonth = value === '' ? '' : (day * 15).toLocaleString();
        else updated.targetvolumemonth = value === '' ? '' : (day * 26).toLocaleString();
      }
      return updated;
    });
  };

  const handleFileUpload = (docType: keyof typeof uploadedFiles, file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleEmployeeNoChange = (codeField: keyof CustomerFormData, nameField: keyof CustomerFormData, list: EmployeeOption[], value: string) => {
    const emp = list.find((e) => e.employeeno === value);
    setFormData((prev) => ({ ...prev, [codeField]: value, [nameField]: emp?.employeename || '' }));
  };

  const handleEmployeeNameChange = (codeField: keyof CustomerFormData, nameField: keyof CustomerFormData, list: EmployeeOption[], value: string) => {
    const emp = list.find((e) => e.employeename === value);
    setFormData((prev) => ({ ...prev, [codeField]: emp?.employeeno || '', [nameField]: value }));
  };

  const handleCompanySelect = (selectedCompanyName: string) => {
    const selected = companyData.find((c) => c.custname === selectedCompanyName);
    if (selected) { handleInputChange('soldtoparty', selectedCompanyName); handleInputChange('billaddress', selected.street); }
  };

  // ==================== RETURN EVERYTHING ====================
  return {
    // form state
    formData, setFormData,
    loading: loading || formSubmit.loading || formApproval.loading,
    setLoading,
    isCustomLimit, setIsCustomLimit,
    hasServerFiles,
    dialogOpen, setDialogOpen,
    isEditMode,
    invalidFields, setInvalidFields,
    uploadedFiles,
    userPermissions,
    makerName,

    // options
    districtOptions, bucenterOptions, custTypeOptions, regionOptions,
    paymentLimitOptions, paymentTermsOptions, salesorgOptions,
    divisionOptions, dcOptions, salesTerritoryOptions,
    stateProvinceOptions, regionTerritoryOptions, cityMunicipalityOptions,
    employeeOptions, companyData, companyNameOptions,

    // helpers
    handleCheckboxChange, handleInputChange, handleFileUpload,
    handleEmployeeNoChange, handleEmployeeNameChange, handleCompanySelect,
    fetchMakerNameByUserId, getUserNameByUserId, getUserCompany, parseApprovers,

    // from useFormSubmit
    submitToGoogleSheet: formSubmit.submitToGoogleSheet,
    updateToGoogleSheet: formSubmit.updateToGoogleSheet,
    postToGoogleSheet:   formSubmit.postToGoogleSheet,

    // from useFormApproval
    approveForm:        formApproval.approveForm,
    cancelForm:         formApproval.cancelForm,
    returnForm:         formApproval.returnForm,
    returntomakerForm:  formApproval.returntomakerForm,
    submitToBOS:        formApproval.submitToBOS,
    submitToEmail:      formApproval.submitToEmail,
    submitToExecEmail:  formApproval.submitToExecEmail,
  };
};

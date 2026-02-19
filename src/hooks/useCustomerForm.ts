import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { VirtualizedMenuList } from '@/components/VirtualizedMenuList';

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
  opscode:string;
  opsname:string;
}

interface TermOption {
  code: string;
  name: string;
}

interface EmployeeOption {
  employeeno: string;
  employeename: string;
}

// Shared interface for region/province/city dropdowns
interface CodeTextOption {
  text: string;
  code: string;
}

export const useCustomerForm = (
  initialData?: CustomerFormData | null,
  dialogVisible?: boolean,
  onClose?: () => void
) => {
  // ==================== FORM STATE ====================
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
    checkcapRow1: '',
    checkcapRow2: '',
    checkcapRow3: '',
    checkcapRow4: '',
    checkcapRow5: '',
    checkcapRow6: '',
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
    approvestatus: '',
    territoryregion: '',
    territoryprovince: '',
    territorycity: '',
    salesterritory: '',
    maker: '',
    datecreated: '',
    firstapprovername: '',
    initialapprovedate: '',
    secondapprovername: '',
    secondapproverdate: '',
    finalapprovername: '',
    thirdapproverdate: '',
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

  // ✅ FIX: All three territory options now consistently use CodeTextOption
  const [regionTerritoryOptions, setRegionTerritoryOptions] = useState<CodeTextOption[]>([]);
  const [stateProvinceOptions, setStateProvinceOptions] = useState<CodeTextOption[]>([]);
  const [cityMunicipalityOptions, setCityMunicipalityOptions] = useState<CodeTextOption[]>([]);

  const [companyData, setCompanyData] = useState<Array<{ custname: string; street: string }>>([]);
  const [companyNameOptions, setCompanyNameOptions] = useState<string[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{
    GM: EmployeeOption[];
    AM: EmployeeOption[];
    SS: EmployeeOption[];
  }>({
    GM: [],
    AM: [],
    SS: [],
  });

  // ==================== UI STATE ====================
  const [loading, setLoading] = useState(false);
  const [isCustomLimit, setIsCustomLimit] = useState(false);
  const [hasServerFiles, setHasServerFiles] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState({
    birBusinessRegistration: null,
    sp2GovernmentId:null,
    secRegistration: null,
    generalInformation: null,
    boardResolution: null,
    others: null,
  });
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const [userPermissions, setUserPermissions] = useState({
    isApprover: false,
    hasEditAccess: false,
  });
  const [makerName, setMakerName] = useState<string>('');

  const getUserPermissions = async (userid: string): Promise<{ isApprover: boolean; hasEditAccess: boolean }> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('approver, editaccess')
        .eq('userid', userid)
        .single();
      if (error) {
        console.error('Error fetching user permissions:', error);
        return { isApprover: false, hasEditAccess: false };
      }
      return {
        isApprover: data?.approver || false,
        hasEditAccess: data?.editaccess || false,
      };
    } catch (err) {
      console.error('Error in getUserPermissions:', err);
      return { isApprover: false, hasEditAccess: false };
    }
  };

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const userid = window.getGlobal('userid');
        const basePermissions = await getUserPermissions(userid);

        if (formData.custtype) {
          const { data: matrixData, error: matrixError } = await supabase
            .from('approvalmatrix')
            .select('firstapprover, secondapprover, thirdapprover')
            .eq('approvaltype', formData.custtype)
            .single();

          if (!matrixError && matrixData) {
            const firstApprovers = parseApprovers(matrixData.firstapprover);
            const secondApprovers = parseApprovers(matrixData.secondapprover);
            const thirdApprovers = parseApprovers(matrixData.thirdapprover);

            const isInMatrix =
              firstApprovers.includes(userid) ||
              secondApprovers.includes(userid) ||
              thirdApprovers.includes(userid);

            setUserPermissions({
              isApprover: isInMatrix && basePermissions.isApprover,
              hasEditAccess: basePermissions.hasEditAccess,
            });
            return;
          }
        }
        setUserPermissions(basePermissions);
      } catch (err) {
        console.error('Error fetching user permissions:', err);
        setUserPermissions({ isApprover: false, hasEditAccess: false });
      }
    };

    if (dialogVisible) {
      fetchUserPermissions();
    }
  }, [dialogVisible, formData.custtype]);

  // ==================== HELPER: GET USER NAME BY USERID ====================
  const getUserNameByUserId = async (userid: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('fullname')
        .eq('userid', userid)
        .single();
      if (error) {
        console.error('Error fetching user name:', error);
        return '';
      }
      return data?.fullname || '';
    } catch (err) {
      console.error('Error in getUserNameByUserId:', err);
      return '';
    }
  };

  const fetchMakerNameByUserId = async (makerUserId: string) => {
    if (!makerUserId) {
      setMakerName('');
      return;
    }
    try {
      const userName = await getUserNameByUserId(makerUserId);
      setMakerName(userName || '');
    } catch (err) {
      console.error('Error fetching maker name:', err);
      setMakerName('');
    }
  };

  useEffect(() => {
    if (dialogVisible && formData.maker) {
      fetchMakerNameByUserId(formData.maker);
    }
  }, [dialogVisible, formData.maker]);

  // ==================== INITIALIZE FORM DATA ====================
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [initialData]);

  // ==================== REGION/DISTRICT DEPENDENCIES ====================
  useEffect(() => {
    setFormData((prev) => ({ ...prev, bucenter: prev.bucenter || '', district: prev.district || '' }));
  }, [formData.region]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, district: prev.district || '' }));
  }, [formData.bucenter]);

  // ==================== FETCH CUSTOMER TYPE SERIES ====================
  useEffect(() => {
    const fetchCustTypes = async () => {
      const { data, error } = await supabase
        .from('customertypeseries')
        .select('carftype')
        .order('id', { ascending: true });
      if (error) {
        console.error('Error fetching customer type series:', error);
      } else if (data) {
        const options = Array.from(
          new Set(data.map((row) => row.carftype).filter((v): v is string => !!v))
        );
        setCustTypeOptions(options);
      }
    };
    fetchCustTypes();
  }, []);

  // ==================== FETCH REGIONS ====================
  useEffect(() => {
    const fetchRegion = async () => {
      const { data, error } = await supabase
        .from('regionbu')
        .select('region')
        .order('id', { ascending: true });
      if (error) {
        console.error('Error fetching regions:', error);
      } else if (data) {
        const options = Array.from(
          new Set(data.map((row) => row.region).filter((v): v is string => !!v))
        );
        setRegionOptions(options);
      }
    };
    fetchRegion();
  }, []);

  // ==================== FETCH PAYMENT TERMS ====================
  useEffect(() => {
    const fetchPaymentTerms = async () => {
      let { data, error } = await supabase
        .from('paymentterms')
        .select('paymentterm,paymenttermname,limittype,limitgroup')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching payment terms:', error);
        return;
      }

      if (data) {
        let filtered = data.filter(
          (row) => formData.type.includes(row.limittype) && row.limitgroup === formData.custtype
        );
        if (filtered.length === 0) filtered = data;

        const options = filtered
          .map((v) =>
            v.paymentterm && v.paymenttermname
              ? { code: v.paymentterm, name: v.paymenttermname }
              : null
          )
          .filter(Boolean) as { code: string; name: string }[];

        const uniqueOptions = Array.from(new Map(options.map((opt) => [opt.code, opt])).values());
        setpaymentTermsOptions(uniqueOptions);
      }
    };
    fetchPaymentTerms();
  }, [formData.type, formData.custtype]);

  // ==================== FETCH PAYMENT LIMITS ====================
  useEffect(() => {
    const fetchPaymentLimit = async () => {
      try {
        let { data: paymentData, error: paymentError } = await supabase
          .from('paymentlimit')
          .select('paymentlimit, limittype, limitgroup')
          .order('id', { ascending: true });

        if (paymentError) throw paymentError;
        if (!paymentData) return;

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('customlimitaccess')
          .eq('userid', window.getGlobal('userid'))
          .single();

        if (userError) throw userError;

        const canUseCustomLimit = userData?.customlimitaccess === true;

        let filtered = paymentData.filter(
          (row) => formData.type.includes(row.limittype) && row.limitgroup === formData.custtype
        );
        if (filtered.length === 0) filtered = paymentData;

        let uniqueOptions = Array.from(
          new Set(filtered.map((row) => row.paymentlimit).filter((v): v is string => !!v))
        );

        if (canUseCustomLimit) uniqueOptions.push('Enter Custom Limit');
        setpaymentLimitOptions(uniqueOptions);
      } catch (err) {
        console.error('Error fetching payment limits or user access:', err);
      }
    };
    fetchPaymentLimit();
  }, [formData.type, formData.custtype]);

  // ==================== FETCH BU CENTER ====================
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
      if (error) {
        console.error('Error fetching BU center:', error);
      } else if (data) {
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

  // ==================== FETCH DISTRICT ====================
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
      if (error) {
        console.error('Error fetching district:', error);
      } else if (data) {
        const options = Array.from(
          new Set(data.map((row) => row.district).filter((v): v is string => !!v))
        );
        setDistrictOptions(options);
      }
    };
    fetchDistrict();
  }, [formData.bucenter]);

  // ==================== FETCH SALES ORGANIZATION ====================
  useEffect(() => {
    const fetchSalesOrg = async () => {
      const { data, error } = await supabase
        .from('salesinfosalesorg')
        .select('salesorganization')
        .order('salesorganization', { ascending: true });
      if (error) {
        console.error('Error fetching sales organization:', error);
      } else if (data) {
        const options = Array.from(
          new Set(data.map((row) => row.salesorganization).filter((v): v is string => !!v))
        );
        setSalesOrgOptions(options);
      }
    };
    fetchSalesOrg();
  }, []);

  // ==================== FETCH DIVISION ====================
  useEffect(() => {
    const fetchDivision = async () => {
      const { data, error } = await supabase
        .from('salesinfodivision')
        .select('division')
        .order('division', { ascending: true });
      if (error) {
        console.error('Error fetching division:', error);
      } else if (data) {
        const options = Array.from(
          new Set(data.map((row) => row.division).filter((v): v is string => !!v))
        );
        setDivisionOptions(options);
      }
    };
    fetchDivision();
  }, []);

  // ==================== FETCH DISTRIBUTION CHANNEL ====================
  useEffect(() => {
    const fetchDistributionChannel = async () => {
      const { data, error } = await supabase
        .from('salesinfodistributionchannel')
        .select('distributionchannel')
        .order('distributionchannel', { ascending: true });
      if (error) {
        console.error('Error fetching distribution channel:', error);
      } else if (data) {
        const options = Array.from(
          new Set(data.map((row) => row.distributionchannel).filter((v): v is string => !!v))
        );
        setDCOPtions(options);
      }
    };
    fetchDistributionChannel();
  }, []);

  // ==================== CHECK FOR SERVER FILES ====================
  useEffect(() => {
    const checkForServerFiles = async () => {
      const gencode = formData.gencode || initialData?.gencode;
      if (!gencode) {
        setHasServerFiles(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/gencode/${gencode}`);
        const data = await res.json();
        const hasAnyFiles = Object.values(data).some(
          (files: any) => Array.isArray(files) && files.length > 0
        );
        setHasServerFiles(hasAnyFiles);
        if (hasAnyFiles) {
          const newUploadedFiles: any = {};
          Object.keys(data).forEach((key) => {
            if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
              newUploadedFiles[key] = new File([''], 'server-files-exist', {
                type: 'application/placeholder',
              });
            }
          });
          setUploadedFiles((prev) => ({ ...prev, ...newUploadedFiles }));
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

  // ==================== FETCH EMPLOYEES ====================
  useEffect(() => {
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('employeeno, employeename, employeetype');

    if (error) {
      console.error(error);
      return;
    }

    const grouped: {
      GM: EmployeeOption[];
      AM: EmployeeOption[];
      SS: EmployeeOption[];
      OPS: EmployeeOption[];
    } = { GM: [], AM: [], SS: [], OPS: [] };

    data.forEach((emp) => {
      const type = emp.employeetype?.toUpperCase();
      if (!['GM', 'AM', 'SS', 'OPS'].includes(type)) return;

      grouped[type as 'GM' | 'AM' | 'SS' | 'OPS'].push({
        employeeno: emp.employeeno,
        employeename: emp.employeename,
      });
    });

    (Object.keys(grouped) as Array<keyof typeof grouped>).forEach((key) => {
      const noLabel =
        key === 'OPS'
          ? 'NO OPS LEAD/ FIELD OFFICER:'
          : key === 'AM'
          ? 'NO GM/SAM/AM'
          : 'NO SAO/SUPERVISOR';

      grouped[key].sort((a, b) => {
        const aName = a.employeename.toUpperCase();
        const bName = b.employeename.toUpperCase();

        if (aName === noLabel) return -1;
        if (bName === noLabel) return 1;

        return aName.localeCompare(bName);
      });
    });

    setEmployeeOptions(grouped);
  };

  fetchEmployees();
}, []);


  // ==================== FETCH SALES TERRITORY ====================
  useEffect(() => {
    const fetchSalesTerritory = async () => {
      try {
        const response = await fetch('https://api-bounty.vercel.app/api/salesterritory');
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const territories = Array.from(
            new Set(
              data
                .slice(1)
                .map((row: any) => row[0])
                .filter((v: string) => v && v !== 'N/A')
            )
          );
          setSalesTerritoryOptions(territories as string[]);
        }
      } catch (error) {
        console.error('Error fetching sales territory:', error);
      }
    };
    fetchSalesTerritory();
  }, []);

  // ==================== FETCH REGIONS (TERRITORY) ====================
  // ✅ FIX: maps to { text, code } and removed regionCodeMap entirely
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch('https://psgc.gitlab.io/api/regions/');
        const data = await response.json();

        const regions: CodeTextOption[] = data.map((r: any) => ({
          text: `${r.regionName}: ${r.name}`,
          code: r.code,                          // ✅ was "value", now "code"
        }));

        setRegionTerritoryOptions(regions);
        // ✅ REMOVED: (window as any).regionCodeMap — no longer needed
      } catch (error) {
        console.error('Error fetching regions:', error);
      }
    };
    fetchRegions();
  }, []);

  // ==================== FETCH PROVINCES ====================
  // ✅ FIX: uses formData.territoryregion directly as the code, maps to { text, code },
  //         fixed NCR branch to use cityData and proper { text, code } shape,
  //         removed provinceCodeMap entirely
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!formData.territoryregion) {
        setStateProvinceOptions([]);
        return;
      }

      try {
        // ✅ formData.territoryregion IS the code now — no map lookup needed
        const regionCode = formData.territoryregion;

        if (regionCode === '130000000' || regionCode === 'NCR') {
          // ✅ NCR province option as proper { text, code } object
          setStateProvinceOptions([{ text: 'NCR', code: 'NCR' }]);

          const cityResponse = await fetch(
            'https://psgc.gitlab.io/api/regions/130000000/cities/'
          );
          // ✅ was "data" (undefined in this scope), now correctly "cityData"
          const cityData = await cityResponse.json();

          // ✅ maps to { text, code } instead of plain strings
          const cities: CodeTextOption[] = cityData.map((c: any) => ({
            text: c.name,
            code: c.code,
          }));
          setCityMunicipalityOptions(cities);
          return;
        }

        const response = await fetch(
          `https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`
        );
        const data = await response.json();

        // ✅ was { text, value }, now { text, code }
        const provinces: CodeTextOption[] = data.map((p: any) => ({
          text: p.name,
          code: p.code,
        }));

        setStateProvinceOptions(provinces);
        // ✅ REMOVED: (window as any).provinceCodeMap — no longer needed
      } catch (error) {
        console.error('Error fetching provinces:', error);
      }
    };
    fetchProvinces();
  }, [formData.territoryregion]);

  // ==================== FETCH CITIES ====================
  // ✅ FIX: uses formData.territoryprovince directly as code, maps to { text, code }
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.territoryprovince) {
        setCityMunicipalityOptions([]);
        return;
      }

      try {
        // ✅ formData.territoryprovince IS the code now — no map lookup needed
        const provinceCode = formData.territoryprovince;

        let response;
        if (provinceCode === 'NCR') {
          response = await fetch('https://psgc.gitlab.io/api/regions/130000000/cities/');
        } else {
          response = await fetch(
            `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`
          );
        }

        const data = await response.json();

        // ✅ was plain strings (c.name), now { text, code }
        const cities: CodeTextOption[] = data.map((c: any) => ({
          text: c.name,
          code: c.code,
        }));

        setCityMunicipalityOptions(cities);
      } catch (error) {
        console.error('Error fetching cities/municipalities:', error);
      }
    };
    fetchCities();
  }, [formData.territoryprovince]);

  // ==================== SCROLL TO INVALID FIELD ====================
  useEffect(() => {
    if (invalidFields.length === 0) return;
    setTimeout(() => {
      const firstField = invalidFields[0];
      const el = document.querySelector(`[data-field="${firstField}"]`);
      if (!el) return;
      const scrollable = el.closest('.no-scrollbar');
      if (scrollable) {
        const offsetTop = (el as HTMLElement).offsetTop;
        (scrollable as HTMLElement).scrollTo({ top: offsetTop - 20, behavior: 'smooth' });
      }
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        el.focus();
      }
    }, 50);
  }, [invalidFields]);

  // ==================== FETCH COMPANY NAMES ====================
  useEffect(() => {
    const fetchCompanyNames = async () => {
      try {
        const response = await fetch('https://bos-master-data-manager.bounty.org.ph/master/api_get_customers.php');
        const data = await response.json();
        if (data.success && data.data) {
          const customers = data.data
            .map((customer: { custname: string; street: string }) => ({
              custname: customer.custname,
              street: customer.street || '',
            }))
            .sort((a: { custname: string }, b: { custname: string }) => a.custname.localeCompare(b.custname));
          setCompanyData(customers);
          const names = customers.map((customer: { custname: string }) => customer.custname);
          setCompanyNameOptions(names);
        }
      } catch (error) {
        console.error('Error fetching company names:', error);
      }
    };
    if (dialogVisible) {
      fetchCompanyNames();
    }
  }, [dialogVisible]);

  // ==================== HANDLER FUNCTIONS ====================
  const handleCheckboxChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [field]: value };

      if (field === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = emailRegex.test(value);
        const isNA = value.trim().toUpperCase() === 'NA' || value.trim().toUpperCase() === 'N/A';
        const isEmpty = value.trim() === '';
        if (!isEmpty && !isValidEmail && !isNA) {
          setInvalidFields((prev) => {
            if (!prev.includes('email')) return [...prev, 'email'];
            return prev;
          });
        } else {
          setInvalidFields((prev) => prev.filter((f) => f !== 'email'));
        }
      }

      if (field === 'targetvolumeday') {
        const rawValue = value ? value.toString().replace(/,/g, '') : '';
        const dayValue = parseFloat(rawValue) || 0;
        if (!updatedData.custtype) {
          updatedData.targetvolumemonth = '';
        } else if (updatedData.custtype === 'LIVE SALES') {
          updatedData.targetvolumemonth = value === '' ? '' : (dayValue * 15).toLocaleString();
        } else {
          updatedData.targetvolumemonth = value === '' ? '' : (dayValue * 26).toLocaleString();
        }
      }

      return updatedData;
    });
  };

  const handleFileUpload = (docType: keyof typeof uploadedFiles, file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleEmployeeNoChange = (
    codeField: keyof CustomerFormData,
    nameField: keyof CustomerFormData,
    list: EmployeeOption[],
    value: string
  ) => {
    const emp = list.find((e) => e.employeeno === value);
    setFormData((prev) => ({
      ...prev,
      [codeField]: value,
      [nameField]: emp?.employeename || '',
    }));
  };

  const handleEmployeeNameChange = (
    codeField: keyof CustomerFormData,
    nameField: keyof CustomerFormData,
    list: EmployeeOption[],
    value: string
  ) => {
    const emp = list.find((e) => e.employeename === value);
    setFormData((prev) => ({
      ...prev,
      [codeField]: emp?.employeeno || '',
      [nameField]: value,
    }));
  };

  // ==================== HANDLER: COMPANY SELECT ====================
  const handleCompanySelect = (selectedCompanyName: string) => {
    const selectedCompany = companyData.find(
      (company) => company.custname === selectedCompanyName
    );
    if (selectedCompany) {
      handleInputChange('soldtoparty', selectedCompanyName);
      handleInputChange('billaddress', selectedCompany.street);
    }
  };

  // ==================== API HELPER FUNCTIONS ====================
  // const getApprovalMatrix = async (
  //   custtype: string
  // ): Promise<{ nextApprover: string; finalApprover: string }> => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('approvalmatrix')
  //       .select('firstapprover, secondapprover, thirdapprover')
  //       .eq('approvaltype', custtype)
  //       .single();
  //     if (error) throw error;

  //     const allApprovers = [data.firstapprover, data.secondapprover, data.thirdapprover]
  //       .filter(Boolean)
  //       .join(',')
  //       .split(',')
  //       .map((a) => a.trim())
  //       .filter(Boolean);

  //     const uniqueApprovers = Array.from(new Set(allApprovers));
  //     return {
  //       nextApprover: uniqueApprovers.join(','),
  //       finalApprover: (data.thirdapprover || '').trim(),
  //     };
  //   } catch (err) {
  //     console.error('Error fetching approval matrix:', err);
  //     throw err;
  //   }
  // };

  const getApprovalMatrix = async (
  custtype: string,
  bucenter: string
): Promise<{ nextApprover: string; finalApprover: string }> => {
  try {
    /** 1️⃣ Base approval matrix */
    const { data: baseData, error: baseError } = await supabase
      .from('approvalmatrix')
      .select('firstapprover, secondapprover, thirdapprover')
      .eq('approvaltype', custtype)
      .single();

    if (baseError) throw baseError;

    const baseApprovers = [
      baseData.firstapprover,
      baseData.secondapprover,
      baseData.thirdapprover,
    ]
      .filter(Boolean)
      .join(',')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    /** 2️⃣ BC approval matrix (exception logic) */
    const { data: bcData, error: bcError } = await supabase
      .from('bcapprovalmatrix')
      .select('firstapprover, exception, exceptionapprover')
      .eq('approvaltype', bucenter);

    if (bcError) throw bcError;

    let bcApprovers: string[] = [];

    if (bcData && bcData.length > 0) {
      // check if exception matches custtype
      const exceptionRow = bcData.find(
        (row) => row.exception === custtype
      );

      if (exceptionRow && exceptionRow.exceptionapprover) {
        bcApprovers = exceptionRow.exceptionapprover
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      } else {
        // no exception match → fallback to firstapprover
        bcApprovers = bcData
          .map((row) => row.firstapprover)
          .filter(Boolean)
          .join(',')
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      }
    }

    /** 3️⃣ Merge + dedupe */
    const uniqueApprovers = Array.from(
      new Set([...baseApprovers, ...bcApprovers])
    );

    return {
      nextApprover: uniqueApprovers.join(','),
      finalApprover: (baseData.thirdapprover || '').trim(),
    };
  } catch (err) {
    console.error('Error fetching approval matrix:', err);
    throw err;
  }
};

  const generateCarfDocNo = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_carf_doc_no');
    if (error || !data) {
      console.error('Error generating CARF doc no:', error);
      throw new Error('Failed to generate document number');
    }
    if (Array.isArray(data)) return data[0]?.doc_no || data[0];
    if (typeof data === 'object') return (data as any).doc_no || JSON.stringify(data);
    return data as string;
  };

  const validateFormFields = async (formData: CustomerFormData) => {
    try {
      const { data: fields, error } = await supabase.from('formfields').select('fields, isrequired');
      if (error) throw error;

      const missingFields: string[] = [];
      const requestFor = formData.requestfor[0];
      const customerType = formData.type[0];
      const isActivation = requestFor === 'ACTIVATION';
      const isCorporation = customerType === 'CORPORATION';

      fields?.forEach((f) => {
        if (f.fields === 'boscode' && isActivation) return;
        if (isCorporation && ['firstname', 'middlename', 'lastname'].includes(f.fields)) return;

        if (f.isrequired) {
          const value = formData[f.fields as keyof CustomerFormData];
          if (
            value === '' ||
            value === null ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0)
          ) {
            missingFields.push(f.fields);
          }
        }
      });

      if (!isActivation) {
        if (!formData.boscode || formData.boscode.trim() === '') {
          missingFields.push('boscode');
        }
      }

      setInvalidFields([...new Set(missingFields)]);
      if (missingFields.length > 0) {
        toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
        return false;
      }
      return true;
    } catch (err) {
      console.error('Validation error:', err);
      alert('Error validating form fields.');
      return false;
    }
  };

  const parseApprovers = (value?: string): string[] =>
    (value || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

  // ==================== SUBMIT TO GOOGLE SHEET (DRAFT) ====================
  const submitToGoogleSheet = async (formData: CustomerFormData) => {
    try {
      setLoading(true);
      const isValid = await validateFormFields(formData);
      if (!isValid) {
        setLoading(false);
        return false;
      }

      let gencode = formData.gencode;
      if (!gencode) {
        gencode = await generateCarfDocNo();
        setFormData((prev) => ({ ...prev, gencode }));
      }

      const userid = (window as any).getGlobal?.('userid');
      if (!userid) {
        toast({ title: 'Error', description: 'User session not found. Please refresh the page.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('userid', userid)
        .single();

      if (userError) {
        console.error('Error fetching user company:', userError);
        toast({ title: 'Error', description: 'Failed to fetch user company information.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      const userCompany = userData?.company || '';
      const { nextApprover, finalApprover } = await getApprovalMatrix(formData.custtype, formData.bucenter);
      const now = new Date().toLocaleString();
      const dataToSend = {
        '#': 0,
        gencode,
        requestfor: formData.requestfor,
        ismother: formData.ismother,
        type: formData.type,
        saletype: formData.saletype,
        soldtoparty: formData.soldtoparty,
        idtype: formData.idtype,
        tin: formData.tin,
        billaddress: formData.billaddress,
        shiptoparty: formData.shiptoparty,
        storecode: formData.storecode,
        busstyle: formData.busstyle,
        deladdress: formData.deladdress,
        contactperson: formData.contactperson,
        email: formData.email,
        position: formData.position,
        contactnumber: formData.contactnumber,
        boscode: formData.boscode,
        bucenter: formData.bucenter,
        region: formData.region,
        district: formData.district,
        salesinfosalesorg: formData.salesinfosalesorg,
        salesinfodistributionchannel: formData.salesinfodistributionchannel,
        salesinfodivision: formData.salesinfodivision,
        checkcapRow1: formData.checkcapRow1,
        checkcapRow2: formData.checkcapRow2,
        checkcapRow3: formData.checkcapRow3,
        checkcapRow4: formData.checkcapRow4,
        checkcapRow5: formData.checkcapRow5,
        checkcapRow6: formData.checkcapRow6,
        datestart: formData.datestart,
        terms: formData.terms,
        creditlimit: formData.creditlimit,
        targetvolumeday: formData.targetvolumeday,
        targetvolumemonth: formData.targetvolumemonth,
        bccode: formData.bccode,
        bcname: formData.bcname,
        saocode: formData.saocode,
        saoname: formData.saoname,
        supcode: formData.supcode,
        supname: formData.supname,
        opscode: formData.opscode,
        opsname: formData.opsname,
        custtype: formData.custtype,
        lastname: formData.lastname,
        firstname: formData.firstname,
        middlename: formData.middlename,
        approvestatus: '',
        nextapprover: nextApprover,
        finalapprover: finalApprover,
        maker: userid,
        datecreated: now,
        territoryregion: formData.territoryregion,
        territoryprovince: formData.territoryprovince,
        territorycity: formData.territorycity,
        salesterritory: formData.salesterritory,
        company: userCompany,
      };

      const response = await fetch(`${BASE_URL}/api/submitform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: [dataToSend] }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: 'Success', description: 'Customer form submitted successfully.' });
        if (onClose) onClose();
        return true;
      } else {
        alert('Failed to submit!');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting form.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPDATE TO GOOGLE SHEET ====================
  const updateToGoogleSheet = async (formData: CustomerFormData) => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId) {
        alert('Cannot update: ID (#) is missing or invalid.');
        return false;
      }

      const userid = (window as any).getGlobal?.('userid');
      if (!userid) {
        toast({ title: 'Error', description: 'User session not found. Please refresh the page.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('userid', userid)
        .single();

      if (userError) {
        console.error('Error fetching user company:', userError);
        toast({ title: 'Error', description: 'Failed to fetch user company information.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      const userCompany = userData?.company || '';
      const { nextApprover, finalApprover } = await getApprovalMatrix(formData.custtype, formData.bucenter);

      const dataToSend = {
        '#': rowId,
        requestfor: formData.requestfor,
        gencode: formData.gencode,
        ismother: formData.ismother,
        type: formData.type,
        saletype: formData.saletype,
        soldtoparty: formData.soldtoparty,
        idtype: formData.idtype,
        tin: formData.tin,
        billaddress: formData.billaddress,
        shiptoparty: formData.shiptoparty,
        storecode: formData.storecode,
        busstyle: formData.busstyle,
        deladdress: formData.deladdress,
        contactperson: formData.contactperson,
        email: formData.email,
        position: formData.position,
        contactnumber: formData.contactnumber,
        boscode: formData.boscode,
        bucenter: formData.bucenter,
        region: formData.region,
        district: formData.district,
        salesinfosalesorg: formData.salesinfosalesorg,
        salesinfodistributionchannel: formData.salesinfodistributionchannel,
        salesinfodivision: formData.salesinfodivision,
        checkcaprow1: formData.checkcapRow1,
        checkcaprow2: formData.checkcapRow2,
        checkcaprow3: formData.checkcapRow3,
        checkcaprow4: formData.checkcapRow4,
        checkcaprow5: formData.checkcapRow5,
        checkcaprow6: formData.checkcapRow6,
        datestart: formData.datestart,
        terms: formData.terms,
        creditlimit: formData.creditlimit,
        targetvolumeday: formData.targetvolumeday,
        targetvolumemonth: formData.targetvolumemonth,
        bccode: formData.bccode,
        bcname: formData.bcname,
        saocode: formData.saocode,
        saoname: formData.saoname,
        supcode: formData.supcode,
        supname: formData.supname,
        opscode: formData.opscode,
        opsname: formData.opsname,
        custtype: formData.custtype,
        lastname: formData.lastname,
        firstname: formData.firstname,
        middlename: formData.middlename,
        approvestatus: formData.approvestatus,
        nextapprover: nextApprover,
        finalapprover: finalApprover,
        maker: formData.maker,
        datecreated: formData.datecreated,
        territoryregion: formData.territoryregion,
        territoryprovince: formData.territoryprovince,
        territorycity: formData.territorycity,
        salesterritory: formData.salesterritory,
        company: userCompany,
      };

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: 'Success', description: 'Customer form updated successfully.' });
        if (onClose) onClose();
        return true;
      } else {
        alert('Failed to update!');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Error updating form.');
      return false;
    }
  };

  // ==================== SUBMIT TO BOS (APPROVED FORMS) ====================
 const submitToBOS = async (formData: CustomerFormData) => {
  try {
    setLoading(true);

    // Only approved forms can be submitted to BOS
    if (formData.approvestatus !== 'APPROVED') {
      toast({ 
        title: 'Error', 
        description: 'Only approved forms can be submitted to BOS.', 
        variant: 'destructive' 
      });
      setLoading(false);
      return false;
    }

    // Get the # value from formData
    const rowId = (formData as any)['#'];
    if (!rowId) {
      toast({ 
        title: 'Error', 
        description: 'Cannot submit to BOS: ID (#) is missing.', 
        variant: 'destructive' 
      });
      setLoading(false);
      return false;
    }

    // Fetch bostype from customertypeseries table
    const { data: typeData, error: typeError } = await supabase
      .from('customertypeseries')
      .select('bostype')
      .eq('carftype', formData.custtype)
      .single();

    if (typeError) {
      console.error('Error fetching bostype:', typeError);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch BOS Type information.', 
        variant: 'destructive' 
      });
      setLoading(false);
      return false;
    }

    const bosType = typeData?.bostype || '';

    // Prepare data for BOS submission - ONLY these fields
    const dataToSend = {
      '#': rowId,
      requestfor: formData.requestfor,
      boscode: formData.boscode,
      soldtoparty: formData.soldtoparty,
      tin: formData.tin,
      shiptoparty: formData.shiptoparty,
      storecode: formData.storecode,
      busstyle: formData.busstyle,
      saletype: formData.saletype,
      deladdress: formData.deladdress,
      billaddress: formData.billaddress,
      contactperson: formData.contactperson,
      contactnumber: formData.contactnumber,
      email: formData.email,
      bucenter: formData.bucenter,
      region: formData.region,
      district: formData.district,
      datestart: formData.datestart,
      terms: formData.terms,
      creditlimit: formData.creditlimit,
      bccode: formData.bccode,
      bcname: formData.bcname,
      saocode: formData.saocode,
      saoname: formData.saoname,
      supcode: formData.supcode,
      supname: formData.supname,
      opscode: formData.opscode,
      opsname: formData.opsname,
      custtype: formData.custtype,
      approvestatus: formData.approvestatus,
      type: formData.type,
      position: formData.position,
      supname: formData.supname,
      isuploaded: 0,
      refid: rowId,
      boscusttype: bosType,
      series: bosType,
      group: bosType,
      firstname: formData.firstname || '',
      middlename: formData.middlename || '',
      lastname: formData.lastname || '',
      ismother: formData.ismother,
      salesinfosalesorg: formData.salesinfosalesorg,
      salesinfodistributionchannel: formData.salesinfodistributionchannel,
      salesinfodivision: formData.salesinfodivision,
      salesterritory: formData.salesterritory,
    };

    console.log('Submitting to BOS with data:', dataToSend);

    // Submit to BOS sheet
    const response = await fetch(`${BASE_URL}/api/submittobos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: [dataToSend] }),
    });

    const result = await response.json();
    console.log('BOS submission result:', result);

    if (!response.ok) {
      console.error('Submit to BOS failed:', result);
      toast({ 
        title: 'Error', 
        description: result.error || 'Failed to submit to BOS!', 
        variant: 'destructive' 
      });
      setLoading(false);
      return false;
    }

    if (result.success) {
      console.log('Successfully submitted to BOS');
      return true;
    } else {
      toast({ 
        title: 'Error', 
        description: 'Failed to submit to BOS!', 
        variant: 'destructive' 
      });
      return false;
    }
  } catch (err) {
    console.error('Submit to BOS error:', err);
    toast({ 
      title: 'Error', 
      description: 'Error submitting to BOS.', 
      variant: 'destructive' 
    });
    return false;
  } finally {
    setLoading(false);
  }
};

  const submitToEmail = async (formData: CustomerFormData, approvalValue: string, forFinalApproval: number, returnStatus:number,remarks:string) => {
    try {
      setLoading(true);
      const rowId = (formData as any)['#'];
      if (!rowId) {
        toast({ 
          title: 'Error', 
          description: 'Cannot submit to BOS: ID (#) is missing.', 
          variant: 'destructive' 
        });
        setLoading(false);
        return false;
      }
    const isMother =
      Array.isArray(formData.ismother) && formData.ismother.length > 0
        ? String(formData.ismother[0]).trim().toUpperCase()
        : "";


      const customerNo =
        isMother === "SOLD TO PARTY"
          ? formData.soldtoparty
          : isMother === "SHIP TO PARTY"
            ? formData.shiptoparty
            : "";


      // Prepare data for BOS submission - ONLY these fields
      const dataToSend = {
        refid: rowId,
        approvalValue: approvalValue,
        customerNo: customerNo,
        customerName: formData.soldtoparty,
        acValue: formData.custtype,
        globalUrl: "https://script.google.com/a/bounty.com.ph/macros/s/AKfycbyxbGUH_zstutWKxpIf5c9oALIb507vkQEYH6-olMn01KRq0kIa6fBxI2uXdrtvMMw3vQ/exec",
        alreadyemail: 0,
        forfinalapproval: forFinalApproval,
        boscode: "",
        bc: formData.bucenter,
        maker: formData.maker,
        requestfor: formData.requestfor,
        salestype: formData.saletype,
        soldtoparty: formData.soldtoparty,
        shiptoparty: formData.shiptoparty,
        tin: formData.tin,
        biladdress: formData.billaddress,
        deladdress: formData.deladdress,
        creditterms: formData.terms,
        creditlimit: formData.creditlimit,
        executive: formData.bcname,
        gm: formData.saoname,
        sao: formData.supname,
        return: returnStatus,
        remarks: remarks
      };

      // Submit to BOS sheet
      const response = await fetch(`${BASE_URL}/api/submittoemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: [dataToSend] }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Submit to BOS failed:', result);
        setLoading(false);
        return false;
      }

      if (result.success) {
        console.log('Successfully submitted to BOS');
        return true;
      } else {
        toast({ 
          title: 'Error', 
          description: 'Failed to submit to BOS!', 
          variant: 'destructive' 
        });
        return false;
      }
    } catch (err) {
      console.error('Submit to BOS error:', err);
      toast({ 
        title: 'Error', 
        description: 'Error submitting to BOS.', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitToExecEmail = async (formData: CustomerFormData) => {
    try {
      setLoading(true);
      const rowId = (formData as any)['#'];
      if (!rowId) {
        toast({ 
          title: 'Error', 
          description: 'Cannot submit to BOS: ID (#) is missing.', 
          variant: 'destructive' 
        });
        setLoading(false);
        return false;
      }

      const isMother =
        Array.isArray(formData.ismother) && formData.ismother.length > 0
          ? String(formData.ismother[0]).trim().toUpperCase()
          : "";

      const customerNo =
        isMother === "SOLD TO PARTY"
          ? formData.soldtoparty
          : isMother === "SHIP TO PARTY"
            ? formData.shiptoparty
            : "";

      // ✅ Fetch execemail data dynamically based on custtype
      let { data: execData, error: execError } = await supabase
        .from('execemail')
        .select('userid, exception, allaccess');

      if (execError) {
        console.error('Error fetching execemail data:', execError);
        toast({ title: 'Error', description: 'Failed to fetch execemail data.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      // Filter based on custtype
      execData = execData?.filter(user => {
        if (formData.custtype === "CTGI ACCOUNTS") {
          return user.exception === "CTGI ACCOUNTS";
        } else {
          return user.allaccess === true;
        }
      }) || [];

      if (!execData.length) {
        toast({ title: 'Info', description: 'No exec email users found for this custtype.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      // Prepare rows for sheet submission
      const rowsToSend = execData.map(user => ({
        id: rowId,
        approvalValue: user.userid, // ✅ Set approvalValue to userid
        customerNo,
        customerName: formData.soldtoparty,
        acValue: formData.custtype,
        globalUrl: "https://script.google.com/a/bounty.com.ph/macros/s/AKfycbyxbGUH_zstutWKxpIf5c9oALIb507vkQEYH6-olMn01KRq0kIa6fBxI2uXdrtvMMw3vQ/exec",
        alreadyemail: 1,
        forfinalapproval: 1,
        refid: rowId,
        boscode: "",
        bc: formData.bucenter,
        maker: formData.maker,
        requestfor: formData.requestfor,
        salestype: formData.saletype,
        soldtoparty: formData.soldtoparty,
        shiptoparty: formData.shiptoparty,
        tin: formData.tin,
        biladdress: formData.billaddress,
        deladdress: formData.deladdress,
        creditterms: formData.terms,
        creditlimit: formData.creditlimit,
        executive: formData.bcname,
        gm: formData.saoname,
        sao: formData.supname,
        forfinalapprover:1,
        approvedby: ""
      }));

      // Submit all rows to the sheet
      const response = await fetch(`${BASE_URL}/api/submittoexecemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Submit to BOS failed:', result);
        setLoading(false);
        return false;
      }

      if (result.success) {
        console.log('Successfully submitted to BOS');
        return true;
      } else {
        toast({ 
          title: 'Error', 
          description: 'Failed to submit to BOS!', 
          variant: 'destructive' 
        });
        return false;
      }

    } catch (err) {
      console.error('Submit to BOS error:', err);
      toast({ 
        title: 'Error', 
        description: 'Error submitting to BOS.', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkForServerFiles = async (gencode?: string): Promise<boolean> => {
    if (!gencode) return false;
    try {
      const res = await fetch(`${BASE_URL}/api/gencode/${gencode}`);
      const data = await res.json();
      return Object.values(data).some((files: any) => Array.isArray(files) && files.length > 0);
    } catch (err) {
      console.error('Error checking for server files:', err);
      return false;
    }
  };

  // ==================== POST TO GOOGLE SHEET (SUBMIT FOR APPROVAL) ====================
  const postToGoogleSheet = async (formData: CustomerFormData) => {
    try {
      const hasServerFiles = await checkForServerFiles(formData.gencode);
      const hasLocalFiles = Object.values(uploadedFiles).some((f) => f !== null);
      const hasAnyFiles = hasServerFiles || hasLocalFiles;

      if (!hasAnyFiles) {
        toast({ title: 'Error', description: 'Supporting documents are required before submission.', variant: 'destructive' });
        return false;
      }

      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) {
        alert('Cannot submit: Please save as draft first before submitting for approval.');
        return false;
      }

      const { nextApprover, finalApprover } = await getApprovalMatrix(formData.custtype, formData.bucenter);
      const userid = window.getGlobal('userid');

      if (!userid) {
        toast({ title: 'Error', description: 'User session not found. Please refresh the page.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('userid', userid)
        .single();

      if (userError) {
        console.error('Error fetching user company:', userError);
        toast({ title: 'Error', description: 'Failed to fetch user company information.', variant: 'destructive' });
        setLoading(false);
        return false;
      }

      const userCompany = userData?.company || '';
      const now = new Date().toLocaleString();

      const dataToSend = {
        '#': rowId,
        gencode: formData.gencode,
        requestfor: formData.requestfor,
        ismother: formData.ismother,
        type: formData.type,
        saletype: formData.saletype,
        soldtoparty: formData.soldtoparty,
        idtype: formData.idtype,
        tin: formData.tin,
        billaddress: formData.billaddress,
        shiptoparty: formData.shiptoparty,
        storecode: formData.storecode,
        busstyle: formData.busstyle,
        deladdress: formData.deladdress,
        contactperson: formData.contactperson,
        email: formData.email,
        position: formData.position,
        contactnumber: formData.contactnumber,
        boscode: formData.boscode,
        bucenter: formData.bucenter,
        region: formData.region,
        district: formData.district,
        salesinfosalesorg: formData.salesinfosalesorg,
        salesinfodistributionchannel: formData.salesinfodistributionchannel,
        salesinfodivision: formData.salesinfodivision,
        checkcaprow1: formData.checkcapRow1,
        checkcaprow2: formData.checkcapRow2,
        checkcaprow3: formData.checkcapRow3,
        checkcaprow4: formData.checkcapRow4,
        checkcaprow5: formData.checkcapRow5,
        checkcaprow6: formData.checkcapRow6,
        datestart: formData.datestart,
        terms: formData.terms,
        creditlimit: formData.creditlimit,
        targetvolumeday: formData.targetvolumeday,
        targetvolumemonth: formData.targetvolumemonth,
        bccode: formData.bccode,
        bcname: formData.bcname,
        saocode: formData.saocode,
        saoname: formData.saoname,
        supcode: formData.supcode,
        supname: formData.supname,
        custtype: formData.custtype,
        lastname: formData.lastname,
        firstname: formData.firstname,
        middlename: formData.middlename,
        approvestatus: 'PENDING',
        nextapprover: nextApprover,
        finalapprover: finalApprover,
        maker: userid,
        datecreated: now,
        // ✅ Already codes
        territoryregion: formData.territoryregion,
        territoryprovince: formData.territoryprovince,
        territorycity: formData.territorycity,
        salesterritory: formData.salesterritory,
        company: userCompany,
      };

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Submit for approval failed:', result);
        alert(result.error || 'Failed to submit for approval!');
        return false;
      }

      if (result.success) {
        toast({ title: 'Success', description: 'Submitted for approval successfully.' });
        if (onClose) onClose();
        return true;
      } else {
        alert('Failed to submit for approval!');
        return false;
      }
    } catch (err) {
      console.error('Submit for approval error:', err);
      alert('Error submitting form for approval.');
      return false;
    }
  };

  // ==================== APPROVE FORM ====================
  const approveForm = async (formData: any) => {
    try {
      const userid = window.getGlobal('userid');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('complianceandfinalapprover')
        .eq('userid', userid)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error('Failed to fetch user permissions');
      }

      const isComplianceFinalApprover = userData?.complianceandfinalapprover === true;

      const { data: matrix, error } = await supabase
        .from('approvalmatrix')
        .select('firstapprover, secondapprover, thirdapprover')
        .eq('approvaltype', formData.custtype)
        .single();

      console.log(error);
      if (error || !matrix) {
        throw new Error('Approval matrix not found');
      }

      const firstApprovers = parseApprovers(matrix.firstapprover);
      const secondApprovers = parseApprovers(matrix.secondapprover);
      const thirdApprovers = parseApprovers(matrix.thirdapprover);
      const finalApprovers = parseApprovers(formData.finalapprover);
      

      let updatedStatus = 'PENDING';
      let updatedNextApprover = formData.nextapprover;
      let updatedFinalApprover = formData.finalapprover;
      let shouldSubmitToBOS = false; 

      const now = new Date().toLocaleString();
      const approverName = await getUserNameByUserId(userid);

      if (isComplianceFinalApprover) {
        updatedStatus = 'APPROVED';
        updatedNextApprover = '';
        updatedFinalApprover = '';
        shouldSubmitToBOS = true;

        if (firstApprovers.includes(userid)) {
          formData.initialapprover = userid;
          formData.initialapprovedate = now;
          formData.firstapprovername = approverName;
        } else if (secondApprovers.includes(userid)) {
          formData.secondapprover = userid;
          formData.secondapproverdate = now;
          formData.secondapprovername = approverName;
        } else if (thirdApprovers.includes(userid)) {
          formData.thirdapprover = userid;
          formData.thirdapproverdate = now;
          formData.finalapprovername = approverName;
        } else {
          alert('You are not authorized to approve this request.');
          return false;
        }
      } else {
        // 1️⃣ FIRST APPROVER
        if (firstApprovers.includes(userid) && !finalApprovers.includes(userid)) {
          updatedStatus = 'PENDING';
          updatedNextApprover = matrix.secondapprover || '';
          updatedFinalApprover = matrix.secondapprover || '';
          formData.initialapprover = userid;
          formData.initialapprovedate = now;
          formData.firstapprovername = approverName;
        }
        // 2️⃣ SECOND APPROVER
        else if (secondApprovers.includes(userid) && !finalApprovers.includes(userid)) {
          if (formData.thirdapprover && formData.thirdapproverdate) {
            updatedStatus = 'APPROVED';
            updatedNextApprover = '';
            updatedFinalApprover = '';
            shouldSubmitToBOS = true;
          } else {
            updatedStatus = 'PENDING';
            updatedNextApprover = matrix.thirdapprover || '';
            updatedFinalApprover = matrix.thirdapprover || '';
          }
          formData.secondapprover = userid;
          formData.secondapproverdate = now;
          formData.secondapprovername = approverName;
        }
        // 3️⃣ THIRD APPROVER (FINAL)
        else if (thirdApprovers.includes(userid) && finalApprovers.includes(userid)) {
          if (formData.secondapprover && formData.secondapproverdate) {
            updatedStatus = 'APPROVED';
            updatedNextApprover = '';
            shouldSubmitToBOS = true;
          } else {
            updatedStatus = 'PENDING';
            updatedNextApprover = matrix.secondapprover || '';
          }
          formData.thirdapprover = userid;
          formData.thirdapproverdate = now;
          formData.finalapprovername = approverName;
        } else {
          alert('You are not authorized to approve this request.');
          return false;
        }
      }

      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) {
        alert('Cannot approve: ID (#) is missing or invalid.');
        return false;
      }

      const dataToSend = {
        ...formData,
        approvestatus: updatedStatus,
        nextapprover: updatedNextApprover,
        finalapprover: updatedFinalApprover,
      };

      const forFinalApprovalFlag = updatedStatus === 'APPROVED' ? 1 : 0;
      const approvalValueToSend =
      updatedStatus === 'APPROVED'
        ? formData.maker || ''
        : updatedNextApprover || '';
      const returnStatus = 1;
      await submitToEmail(
        dataToSend,
        approvalValueToSend,
        forFinalApprovalFlag,
        returnStatus,""
      );



      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Approve update failed:', result);
        alert(result.error || 'Failed to approve!');
        return false;
      }
      if (shouldSubmitToBOS) {      
        // Update formData with the approved status before sending to BOS
        const updatedFormData = {
          ...formData,
          approvestatus: 'APPROVED',
        };

        try {
          const bosSuccess = await submitToBOS(updatedFormData);
          if (bosSuccess) {
            toast({ 
              title: 'Success', 
              description: 'Form approved and submitted to BOS successfully!' 
            });

             await submitToExecEmail(dataToSend);
          } else {
            toast({ 
              title: 'Partial Success', 
              description: 'Form approved but BOS submission failed. Please submit manually.', 
              variant: 'destructive' 
            });
          }
        } catch (bosError) {
          console.error('BOS submission error:', bosError);
          toast({ 
            title: 'Partial Success', 
            description: 'Form approved but BOS submission failed. Please submit manually.', 
            variant: 'destructive' 
          });
        }
      } else {
        toast({ title: 'Success', description: 'Form approved successfully!' });
      }
      return true;
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve request.');
      return false;
    }
  };

  // ==================== CANCEL FORM ====================
  const cancelForm = async (formData: any) => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) {
        alert('Cannot cancel: ID (#) is missing or invalid.');
        return false;
      }

      const dataToSend = {
        ...formData,
        approvestatus: 'CANCELLED',
        nextapprover: '',
        finalapprover: '',
      };

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Cancel update failed:', result);
        alert(result.error || 'Failed to cancel request!');
        return false;
      }

      toast({ title: 'Success', description: 'Form cancelled successfully!' });
      if (onClose) onClose();
      return true;
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Failed to cancel request.');
      return false;
    }
  };

  // ==================== RETURN FORM ====================
  const returnForm = async (formData: any, remarksreturn:string) => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) {
        alert('Cannot cancel: ID (#) is missing or invalid.');
        return false;
      }

      const dataToSend = {
        ...formData,
        approvestatus: 'RETURN TO MAKER',
        nextapprover: '',
        finalapprover: '',
        remarks:remarksreturn
      };  

        const returnStatus = 0;
        await submitToEmail(
          dataToSend,
          formData.maker,
          0,
          returnStatus,remarksreturn
        );

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Cancel update failed:', result);
        alert(result.error || 'Failed to RETURN!');
        return false;
      }

      toast({ title: 'Success', description: 'Form Return successfully!' });
      if (onClose) onClose();
      return true;
    } catch (err) {
      console.error('return error:', err);
      alert('Failed to return request.');
      return false;
    }
  };

  // ==================== RETURN TO MAKER ====================
  const returntomakerForm = async (formData: any, remarksreturn:string) => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) {
        alert('Cannot return: ID (#) is missing or invalid.');
        return false;
      }

      const dataToSend = {
        ...formData,
        approvestatus: 'RETURN TO MAKER',
        nextapprover: '',
        finalapprover: '',
      };

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Return update failed:', result);
        alert(result.error || 'Failed to return request!');
        return false;
      }

      toast({ title: 'Success', description: 'Customer Form Return successfully!' });
      if (onClose) onClose();
      return true;
    } catch (err) {
      console.error('Return error:', err);
      alert('Failed to Return request.');
      return false;
    }
  };

  // ==================== RETURN ALL STATE AND FUNCTIONS ====================
  return {
    formData,
    setFormData,
    loading,
    setLoading,
    isCustomLimit,
    setIsCustomLimit,
    hasServerFiles,
    dialogOpen,
    setDialogOpen,
    isEditMode,
    invalidFields,
    uploadedFiles,
    userPermissions,
    makerName,
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
    companyData,
    companyNameOptions,
    handleCheckboxChange,
    handleInputChange,
    handleFileUpload,
    handleEmployeeNoChange,
    handleEmployeeNameChange,
    handleCompanySelect,
    fetchMakerNameByUserId,
    submitToGoogleSheet,
    updateToGoogleSheet,
    postToGoogleSheet,
    approveForm,
    cancelForm,
    returnForm,
    returntomakerForm,
  };
};
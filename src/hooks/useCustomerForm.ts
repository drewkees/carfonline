import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

interface TermOption {
  code: string;
  name: string;
}

interface EmployeeOption {
  employeeno: string;
  employeename: string;
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
  const [stateProvinceOptions, setStateProvinceOptions] = useState<string[]>([]);
  const [regionTerritoryOptions, setRegionTerritoryOptions] = useState<string[]>([]);
  const [cityMunicipalityOptions, setCityMunicipalityOptions] = useState<string[]>([]);
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
    secRegistration: null,
    generalInformation: null,
    boardResolution: null,
    others: null,
  });

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
        console.error('Error fetching customer type series:', error);
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
        console.error('Error fetching customer type series:', error);
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
        console.error('Error fetching customer type series:', error);
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
        const res = await fetch(`http://localhost:3001/api/gencode/${gencode}`);
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
      } = { GM: [], AM: [], SS: [] };

      data.forEach((emp) => {
        const type = emp.employeetype?.toUpperCase();

        if (!['GM', 'AM', 'SS'].includes(type)) return;

        grouped[type as 'GM' | 'AM' | 'SS'].push({
          employeeno: emp.employeeno,
          employeename: emp.employeename,
        });
      });

      (Object.keys(grouped) as Array<keyof typeof grouped>).forEach((key) => {
        const noLabel =
          key === 'GM' ? 'NO EXECUTIVE' : key === 'AM' ? 'NO GM/SAM/AM' : 'NO SAO/SUPERVISOR';

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
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch('https://psgc.gitlab.io/api/regions/');
        const data = await response.json();

        const regions = data.map((r: any) => ({
          text: `${r.regionName}: ${r.name}`,
          value: r.code,
        }));

        setRegionTerritoryOptions(regions.map((r: any) => r.text));

        (window as any).regionCodeMap = regions.reduce((acc: any, r: any) => {
          acc[r.text] = r.value;
          return acc;
        }, {});
      } catch (error) {
        console.error('Error fetching regions:', error);
      }
    };

    fetchRegions();
  }, []);

  // ==================== FETCH PROVINCES ====================
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!formData.territoryregion) {
        setStateProvinceOptions([]);
        return;
      }

      try {
        const regionCode = (window as any).regionCodeMap?.[formData.territoryregion];

        if (!regionCode) return;

        if (regionCode === '130000000' || regionCode === 'NCR') {
          setStateProvinceOptions(['NCR']);

          (window as any).provinceCodeMap = { NCR: 'NCR' };

          const cityResponse = await fetch(
            'https://psgc.gitlab.io/api/regions/130000000/cities/'
          );
          const cityData = await cityResponse.json();

          const cities = cityData.map((c: any) => c.name);
          setCityMunicipalityOptions(cities);
          return;
        }

        const response = await fetch(
          `https://psgc.gitlab.io/api/regions/${regionCode}/provinces/`
        );
        const data = await response.json();

        const provinces = data.map((p: any) => ({
          text: p.name,
          value: p.code,
        }));

        setStateProvinceOptions(provinces.map((p: any) => p.text));

        (window as any).provinceCodeMap = provinces.reduce((acc: any, p: any) => {
          acc[p.text] = p.value;
          return acc;
        }, {});
      } catch (error) {
        console.error('Error fetching provinces:', error);
      }
    };

    fetchProvinces();
  }, [formData.territoryregion]);

  // ==================== FETCH CITIES ====================
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.territoryprovince) {
        setCityMunicipalityOptions([]);
        return;
      }

      try {
        const provinceCode = (window as any).provinceCodeMap?.[formData.territoryprovince];

        if (!provinceCode) return;

        let response;

        if (provinceCode === 'NCR') {
          response = await fetch('https://psgc.gitlab.io/api/regions/130000000/cities/');
        } else {
          response = await fetch(
            `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`
          );
        }

        const data = await response.json();
        const cities = data.map((c: any) => c.name);

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
        (scrollable as HTMLElement).scrollTo({
          top: offsetTop - 20,
          behavior: 'smooth',
        });
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
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  // ==================== API HELPER FUNCTIONS ====================
  const getApprovalMatrix = async (
    custtype: string
  ): Promise<{ nextApprover: string; finalApprover: string }> => {
    try {
      const { data, error } = await supabase
        .from('approvalmatrix')
        .select('firstapprover, secondapprover, thirdapprover')
        .eq('approvaltype', custtype)
        .single();

      if (error) throw error;

      const allApprovers = [data.firstapprover, data.secondapprover, data.thirdapprover]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      const uniqueApprovers = Array.from(new Set(allApprovers));

      return {
        nextApprover: uniqueApprovers.join(','),
        finalApprover: (data.thirdapprover || '').trim(),
      };
    } catch (err) {
      console.error('Error fetching approval matrix:', err);
      throw err;
    }
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

        if (isCorporation && ['firstname', 'middlename', 'lastname'].includes(f.fields)) {
          return;
        }

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
        alert('Please fill in required fields.');
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

      const { nextApprover, finalApprover } = await getApprovalMatrix(formData.custtype);

      const dataToSend = {
        '#': 0,
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
        custtype: formData.custtype,
        lastname: formData.lastname,
        firstname: formData.firstname,
        middlename: formData.middlename,
        approvestatus: '',
        nextapprover: nextApprover,
        finalapprover: finalApprover,
        territoryregion: formData.territoryregion,
        territoryprovince: formData.territoryprovince,
        territorycity: formData.territorycity,
        salesterritory: formData.salesterritory,
      };

      const response = await fetch('http://localhost:3001/api/submitform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: [dataToSend] }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Submitted successfully!');
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
    }finally {
        setLoading(false); // ✅ ALWAYS STOP LOADING
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

      const { nextApprover, finalApprover } = await getApprovalMatrix(formData.custtype);

      const dataToSend = {
        '#': rowId,
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
        approvestatus: formData.approvestatus,
        nextapprover: nextApprover,
        finalapprover: finalApprover,
        territoryregion: formData.territoryregion,
        territoryprovince: formData.territoryprovince,
        territorycity: formData.territorycity,
        salesterritory: formData.salesterritory,
      };

      const response = await fetch('http://localhost:3001/api/updateform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Updated successfully! Row: ${result.updatedRow}`);
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

  // ==================== POST TO GOOGLE SHEET (SUBMIT FOR APPROVAL) ====================
  const postToGoogleSheet = async (formData: CustomerFormData) => {
    try {
      const { nextApprover, finalApprover } = await getApprovalMatrix(formData.custtype);

      const dataToSend = {
        '#': 0,
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
        territoryregion: formData.territoryregion,
        territoryprovince: formData.territoryprovince,
        territorycity: formData.territorycity,
        salesterritory: formData.salesterritory,
      };

      const response = await fetch('http://localhost:3001/api/submitform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: [dataToSend] }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Submitted successfully!');
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
    }
  };

  // ==================== APPROVE FORM ====================
  const approveForm = async (formData: any) => {
    try {
      const userid = window.getGlobal('userid');

      const { data: matrix, error } = await supabase
        .from('approvalmatrix')
        .select('firstapprover, secondapprover, thirdapprover')
        .eq('approvaltype', formData.custtype)
        .single();

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

      const now = new Date().toLocaleString();

      // 1️⃣ FIRST APPROVER
      if (firstApprovers.includes(userid) && !finalApprovers.includes(userid)) {
        updatedStatus = 'PENDING';
        updatedNextApprover = matrix.secondapprover || '';
        updatedFinalApprover = matrix.secondapprover || '';
        formData.initialapprover = userid;
        formData.initialapprovedate = now;
      }

      // 2️⃣ SECOND APPROVER
      else if (secondApprovers.includes(userid) && !finalApprovers.includes(userid)) {
        if (formData.thirdapprover && formData.thirdapproverdate) {
          updatedStatus = 'APPROVED';
          updatedNextApprover = '';
          updatedFinalApprover = '';
        } else {
          updatedStatus = 'PENDING';
          updatedNextApprover = matrix.thirdapprover || '';
          updatedFinalApprover = matrix.thirdapprover || '';
        }

        formData.secondapprover = userid;
        formData.secondapproverdate = now;
      }

      // 3️⃣ THIRD APPROVER (FINAL)
      else if (thirdApprovers.includes(userid) && finalApprovers.includes(userid)) {
        if (formData.secondapprover && formData.secondapproverdate) {
          updatedStatus = 'APPROVED';
          updatedNextApprover = '';
        } else {
          updatedStatus = 'PENDING';
          updatedNextApprover = matrix.secondapprover || '';
        }

        formData.thirdapprover = userid;
        formData.thirdapproverdate = now;
      } else {
        alert('You are not authorized to approve this request.');
        return false;
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

      const response = await fetch('http://localhost:3001/api/updateform', {
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

      alert(`Form approved successfully! Row: ${result.updatedRow}`);
      if (onClose) onClose();
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

      const response = await fetch('http://localhost:3001/api/updateform', {
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

      alert(`Form cancelled successfully! Row: ${result.updatedRow}`);
      if (onClose) onClose();
      return true;
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Failed to cancel request.');
      return false;
    }
  };

  // ==================== RETURN TO MAKER ====================
  const returntomakerForm = async (formData: any) => {
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

      const response = await fetch('http://localhost:3001/api/updateform', {
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

      alert(`Form Return successfully! Row: ${result.updatedRow}`);
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
    // State
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

    // Options
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

    // Handlers
    handleCheckboxChange,
    handleInputChange,
    handleFileUpload,
    handleEmployeeNoChange,
    handleEmployeeNameChange,

    // API Functions
    submitToGoogleSheet,
    updateToGoogleSheet,
    postToGoogleSheet,
    approveForm,
    cancelForm,
    returntomakerForm,
  };
};
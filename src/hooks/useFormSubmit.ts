import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { CustomerFormData } from './useCustomerForm';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ==================== APPROVAL MATRIX HELPER ====================
export const getApprovalMatrix = async (
  custtype: string,
  bucenter: string,
  company: string
): Promise<{ nextApprover: string; finalApprover: string }> => {
  try {
    const { data: baseData, error: baseError } = await supabase
      .from('approvalmatrix')
      .select('firstapprover, secondapprover, thirdapprover')
      .eq('approvaltype', custtype)
      .eq('company', company)
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

    const { data: bcData, error: bcError } = await supabase
      .from('bcapprovalmatrix')
      .select('firstapprover, exception, exceptionapprover')
      .eq('approvaltype', bucenter)
      .eq('company', company);

    if (bcError) throw bcError;

    let bcApprovers: string[] = [];

    if (bcData && bcData.length > 0) {
      const exceptionRow = bcData.find((row) => row.exception === custtype);
      if (exceptionRow && exceptionRow.exceptionapprover) {
        bcApprovers = exceptionRow.exceptionapprover
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      } else {
        bcApprovers = bcData
          .map((row) => row.firstapprover)
          .filter(Boolean)
          .join(',')
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      }
    }

    const uniqueApprovers = Array.from(new Set([...baseApprovers, ...bcApprovers]));

    return {
      nextApprover: uniqueApprovers.join(','),
      finalApprover: (baseData.thirdapprover || '').trim(),
    };
  } catch (err) {
    toast({ title: 'Error', description: 'No approval matrix found for this customer type.', variant: 'destructive' });
    throw err;
  }
};

// ==================== GENERATE CARF DOC NO ====================
const generateCarfDocNo = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_carf_doc_no');
  if (error || !data) throw new Error('Failed to generate document number');
  if (Array.isArray(data)) return data[0]?.doc_no || data[0];
  if (typeof data === 'object') return (data as any).doc_no || JSON.stringify(data);
  return data as string;
};

// ==================== VALIDATE FORM FIELDS ====================
const validateFormFields = async (
  formData: CustomerFormData,
  setInvalidFields: (fields: string[]) => void
): Promise<boolean> => {
  try {
    const { data: fields, error } = await supabase.from('formfields').select('fields, isrequired');
    if (error) throw error;

    const missingFields: string[] = [];
    const requestFor = formData.requestfor[0];
    const customerType = formData.type[0];
    const mother = formData.ismother[0];
    const isActivation = requestFor === 'ACTIVATION';
    const isCorporation = customerType === 'CORPORATION';
    const isPersonal = customerType === 'PERSONAL';
    const isMotherShipToParty = mother === 'SHIP TO PARTY';

    fields?.forEach((f) => {
      if (f.fields === 'boscode' && isActivation) return;
      if (isCorporation && ['firstname', 'middlename', 'lastname'].includes(f.fields)) return;
      if (isPersonal && isMotherShipToParty && ['firstname', 'middlename', 'lastname'].includes(f.fields)) return;
      if (f.isrequired) {
        const value = formData[f.fields as keyof CustomerFormData];
        if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
          missingFields.push(f.fields);
        }
      }
    });

    if (!isActivation && (!formData.boscode || formData.boscode.trim() === '')) {
      missingFields.push('boscode');
    }

    setInvalidFields([...new Set(missingFields)]);
    if (missingFields.length > 0) {
      toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return false;
    }
    return true;
  } catch (err) {
    console.error('Validation error:', err);
    toast({ title: 'Error', description: 'Error validating form fields.', variant: 'destructive' });
    return false;
  }
};

// ==================== CHECK SERVER FILES ====================
export const checkForServerFiles = async (gencode?: string): Promise<boolean> => {
  if (!gencode) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/gencode/${gencode}`);
    const data = await res.json();
    return Object.values(data).some((files: any) => Array.isArray(files) && files.length > 0);
  } catch {
    return false;
  }
};

// ==================== HOOK ====================
export const useFormSubmit = (
  formData: CustomerFormData,
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>,
  setInvalidFields: (fields: string[]) => void,
  uploadedFiles: Record<string, File | null>,
  onClose?: () => void
) => {
  const [loading, setLoading] = useState(false);

  // ── Helper: get userid + company ────────────────────────────────────────
  const getUserContext = async () => {
    const userid = (window as any).getGlobal?.('userid');
    if (!userid) {
      toast({ title: 'Error', description: 'User session not found. Please refresh the page.', variant: 'destructive' });
      return null;
    }
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company')
      .eq('userid', userid)
      .single();
    if (userError) {
      console.error('Error fetching user company:', userError);
      toast({ title: 'Error', description: 'Failed to fetch user company information.', variant: 'destructive' });
      return null;
    }
    return { userid, userCompany: userData?.company || '' };
  };

  // ── Shared payload builder ───────────────────────────────────────────────
  const buildPayload = (
    data: CustomerFormData,
    overrides: Record<string, any>
  ) => ({
    requestfor: data.requestfor,
    ismother: data.ismother,
    type: data.type,
    saletype: data.saletype,
    soldtoparty: data.soldtoparty,
    idtype: data.idtype,
    tin: data.tin,
    billaddress: data.billaddress,
    shiptoparty: data.shiptoparty,
    storecode: data.storecode,
    busstyle: data.busstyle,
    deladdress: data.deladdress,
    contactperson: data.contactperson,
    email: data.email,
    position: data.position,
    contactnumber: data.contactnumber,
    boscode: data.boscode,
    bucenter: data.bucenter,
    region: data.region,
    district: data.district,
    salesinfosalesorg: data.salesinfosalesorg,
    salesinfodistributionchannel: data.salesinfodistributionchannel,
    salesinfodivision: data.salesinfodivision,
    checkcaprow1: data.checkcapRow1,
    checkcaprow2: data.checkcapRow2,
    checkcaprow3: data.checkcapRow3,
    checkcaprow4: data.checkcapRow4,
    checkcaprow5: data.checkcapRow5,
    checkcaprow6: data.checkcapRow6,
    datestart: data.datestart,
    terms: data.terms,
    creditlimit: data.creditlimit,
    targetvolumeday: data.targetvolumeday,
    targetvolumemonth: data.targetvolumemonth,
    bccode: data.bccode,
    bcname: data.bcname,
    saocode: data.saocode,
    saoname: data.saoname,
    supcode: data.supcode,
    supname: data.supname,
    opscode: data.opscode,
    opsname: data.opsname,
    custtype: data.custtype,
    lastname: data.lastname,
    firstname: data.firstname,
    middlename: data.middlename,
    territoryregion: data.territoryregion,
    territoryprovince: data.territoryprovince,
    territorycity: data.territorycity,
    salesterritory: data.salesterritory,
    gencode: data.gencode,
    ...overrides,
  });

  // ==================== SAVE AS DRAFT ====================
  const submitToGoogleSheet = async () => {
    try {
      setLoading(true);
      const isValid = await validateFormFields(formData, setInvalidFields);
      if (!isValid) return false;

      const ctx = await getUserContext();
      if (!ctx) return false;
      const { userid, userCompany } = ctx;

      let gencode = formData.gencode;
      if (!gencode) {
        gencode = await generateCarfDocNo();
        setFormData((prev) => ({ ...prev, gencode }));
      }

      const { nextApprover, finalApprover } = await getApprovalMatrix(
        formData.custtype,
        formData.bucenter,
        userCompany
      );

      const now = new Date().toLocaleString();
      const dataToSend = {
        '#': 0,
        ...buildPayload(formData, {
          gencode,
          approvestatus: '',
          nextapprover: nextApprover,
          finalapprover: finalApprover,
          maker: userid,
          datecreated: now,
          company: userCompany,
        }),
      };
    //   alert(`${BASE_URL}/api/submitform`);
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
        toast({ title: 'Error', description: 'Failed to submit!', variant: 'destructive' });
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPDATE (EDIT DRAFT) ====================
  const updateToGoogleSheet = async () => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId) {
        toast({ title: 'Error', description: 'Cannot update: ID (#) is missing or invalid.', variant: 'destructive' });
        return false;
      }

      const ctx = await getUserContext();
      if (!ctx) return false;
      const { userid, userCompany } = ctx;

      const { nextApprover, finalApprover } = await getApprovalMatrix(
        formData.custtype,
        formData.bucenter,
        userCompany
      );

      const dataToSend = {
        '#': rowId,
        ...buildPayload(formData, {
          approvestatus: formData.approvestatus,
          nextapprover: nextApprover,
          finalapprover: finalApprover,
          maker: formData.maker,
          datecreated: formData.datecreated,
          company: userCompany,
        }),
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
        toast({ title: 'Error', description: 'Failed to update!', variant: 'destructive' });
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // ==================== POST FOR APPROVAL ====================
  const postToGoogleSheet = async () => {
    try {
      const hasServerFiles = await checkForServerFiles(formData.gencode);
      const hasLocalFiles = Object.values(uploadedFiles).some((f) => f !== null);
      if (!hasServerFiles && !hasLocalFiles) {
        toast({ title: 'Error', description: 'Supporting documents are required before submission.', variant: 'destructive' });
        return false;
      }

      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) {
        toast({ title: 'Error', description: 'Cannot submit: Please save as draft first before submitting for approval.', variant: 'destructive' });
        return false;
      }

      const ctx = await getUserContext();
      if (!ctx) return false;
      const { userid, userCompany } = ctx;

      const { nextApprover, finalApprover } = await getApprovalMatrix(
        formData.custtype,
        formData.bucenter,
        userCompany
      );

      const now = new Date().toLocaleString();
      const dataToSend = {
        '#': rowId,
        ...buildPayload(formData, {
          approvestatus: 'PENDING',
          nextapprover: nextApprover,
          finalapprover: finalApprover,
          maker: userid,
          datecreated: now,
          company: userCompany,
        }),
      };

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast({ title: 'Error', description: result.error || 'Failed to submit for approval!', variant: 'destructive' });
        return false;
      }

      if (result.success) {
        await fetch(`${BASE_URL}/api/submittoemail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: [{
              refid: rowId,
              approvalValue: nextApprover,
              customerNo: formData.soldtoparty,
              customerName: formData.soldtoparty,
              acValue: formData.custtype,
              globalUrl: BASE_URL,
              alreadyemail: 0,
              forfinalapproval: 0,
              boscode: '',
              bc: formData.bucenter,
              maker: userid,
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
              return: 1,
              remarks: '',
            }],
          }),
        });
        toast({ title: 'Success', description: 'Submitted for approval successfully.' });
        if (onClose) onClose();
        return true;
      } else {
        toast({ title: 'Error', description: 'Failed to submit for approval!', variant: 'destructive' });
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return {
    loading,
    submitToGoogleSheet,
    updateToGoogleSheet,
    postToGoogleSheet,
  };
};
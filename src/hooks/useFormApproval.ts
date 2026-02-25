import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { CustomerFormData } from './useCustomerForm';
import { getApprovalMatrix } from './useFormSubmit';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const parseApprovers = (value?: string): string[] =>
  (value || '').split(',').map((v) => v.trim()).filter(Boolean);

const getUserNameByUserId = async (userid: string): Promise<string> => {
  try {
    const { data, error } = await supabase.from('users').select('fullname').eq('userid', userid).single();
    if (error) return '';
    return data?.fullname || '';
  } catch {
    return '';
  }
};

export const useFormApproval = (onClose?: () => void) => {
  const [loading, setLoading] = useState(false);

  // ==================== SUBMIT TO BOS ====================
  const submitToBOS = async (formData: CustomerFormData): Promise<boolean> => {
    try {
      setLoading(true);

      if (formData.approvestatus !== 'APPROVED') {
        toast({ title: 'Error', description: 'Only approved forms can be submitted to BOS.', variant: 'destructive' });
        return false;
      }

      const rowId = (formData as any)['#'];
      if (!rowId) {
        toast({ title: 'Error', description: 'Cannot submit to BOS: ID (#) is missing.', variant: 'destructive' });
        return false;
      }

      const { data: typeData, error: typeError } = await supabase
        .from('customertypeseries')
        .select('bostype,bosseries,bosgroup')
        .eq('carftype', formData.custtype)
        .single();

      if (typeError) {
        toast({ title: 'Error', description: 'Failed to fetch BOS Type information.', variant: 'destructive' });
        return false;
      }

      const bosType = typeData?.bostype || '';

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
        creditlimit: Number(String(formData.creditlimit).replace(/,/g, '')),
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
        isuploaded: 0,
        refid: rowId,
        boscusttype: bosType,
        series: typeData?.bosseries || '',
        group: typeData?.bosgroup || '',
        firstname: formData.firstname || '',
        middlename: formData.middlename || '',
        lastname: formData.lastname || '',
        ismother: formData.ismother,
        salesinfosalesorg: formData.salesinfosalesorg,
        salesinfodistributionchannel: formData.salesinfodistributionchannel,
        salesinfodivision: formData.salesinfodivision,
        salesterritory: formData.salesterritory,
      };

      const response = await fetch(`${BASE_URL}/api/submittobos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: [dataToSend] }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast({ title: 'Error', description: result.error || 'Failed to submit to BOS!', variant: 'destructive' });
        return false;
      }

      return result.success;
    } catch (err) {
      console.error('Submit to BOS error:', err);
      toast({ title: 'Error', description: 'Error submitting to BOS.', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==================== SUBMIT TO EMAIL ====================
  const submitToEmail = async (
    formData: CustomerFormData,
    approvalValue: string,
    forFinalApproval: number,
    returnStatus: number,
    remarks: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const rowId = (formData as any)['#'];
      if (!rowId) return false;

      const isMother =
        Array.isArray(formData.ismother) && formData.ismother.length > 0
          ? String(formData.ismother[0]).trim().toUpperCase()
          : '';

      const customerNo =
        isMother === 'SOLD TO PARTY'
          ? formData.soldtoparty
          : isMother === 'SHIP TO PARTY'
          ? formData.shiptoparty
          : '';

      const dataToSend = {
        refid: rowId,
        approvalValue,
        customerNo,
        customerName: formData.soldtoparty,
        acValue: formData.custtype,
        globalUrl: BASE_URL,
        alreadyemail: 0,
        forfinalapproval: forFinalApproval,
        boscode: '',
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
        remarks,
      };

      const response = await fetch(`${BASE_URL}/api/submittoemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: [dataToSend] }),
      });

      const result = await response.json();
      if (!response.ok) return false;
      return result.success;
    } catch (err) {
      console.error('Submit to email error:', err);
      toast({ title: 'Error', description: 'Error submitting to email.', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==================== SUBMIT TO EXEC EMAIL ====================
  const submitToExecEmail = async (formData: CustomerFormData): Promise<boolean> => {
    try {
      setLoading(true);
      const rowId = (formData as any)['#'];
      if (!rowId) return false;

      const isMother =
        Array.isArray(formData.ismother) && formData.ismother.length > 0
          ? String(formData.ismother[0]).trim().toUpperCase()
          : '';

      const customerNo =
        isMother === 'SOLD TO PARTY'
          ? formData.soldtoparty
          : isMother === 'SHIP TO PARTY'
          ? formData.shiptoparty
          : '';

      const formCompany = (formData as any).company || '';

      // Fetch execemail with company info
      const { data: execData, error: execError } = await supabase
        .from('execemail')
        .select('userid, exception, allaccess, company');

      if (execError) {
        toast({ title: 'Error', description: 'Failed to fetch execemail data.', variant: 'destructive' });
        return false;
      }

      // Fetch user companies for ALL rows
      const allUserIds = (execData || []).filter(u => u.company === 'ALL').map(u => u.userid);
      let userCompanyMap: Record<string, string> = {};

      if (allUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('userid, company')
          .in('userid', allUserIds);

        usersData?.forEach(u => {
          userCompanyMap[u.userid] = u.company;
        });
      }

      const filtered = (execData || []).filter((user) => {
        const userExceptions = (user.exception || '')
          .split(',')
          .map((e: string) => e.trim())
          .filter(Boolean);

        // Exact company match
        if (user.company === formCompany) {
          // If user has exceptions, only include if one matches custtype
          if (userExceptions.length > 0) {
            return userExceptions.includes(formData.custtype);
          }
          return true;
        }

        // ALL: include if user's own company matches formData.company
        // OR if any exception matches formData.custtype
        if (user.company === 'ALL') {
          const userOwnCompany = userCompanyMap[user.userid] || '';
          const companyMatches = userOwnCompany === formCompany;
          const exceptionMatches = userExceptions.length > 0
            ? userExceptions.includes(formData.custtype)
            : false;
          return companyMatches || exceptionMatches;
        }

        return false;
      });

      if (!filtered.length) {
        toast({ title: 'Info', description: 'No exec email users found for this company.', variant: 'destructive' });
        return false;
      }

      const rowsToSend = filtered.map((user) => ({
        id: rowId,
        approvalValue: user.userid,
        customerNo,
        customerName: formData.soldtoparty,
        acValue: formData.custtype,
        globalUrl: BASE_URL,
        alreadyemail: 1,
        forfinalapproval: 1,
        refid: rowId,
        boscode: '',
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
        forfinalapprover: 1,
        approvedby: '',
      }));

      const response = await fetch(`${BASE_URL}/api/submittoexecemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToSend }),
      });

      const result = await response.json();
      if (!response.ok) return false;
      return result.success;
    } catch (err) {
      console.error('Submit to exec email error:', err);
      toast({ title: 'Error', description: 'Error submitting to exec email.', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==================== APPROVE FORM ====================
  const approveForm = async (formData: any): Promise<boolean> => {
    try {
      const userid = (window as any).getGlobal?.('userid');

      // Fetch user: complianceandfinalapprover + company in one call
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('complianceandfinalapprover, company')
        .eq('userid', userid)
        .single();

      if (userError) throw new Error('Failed to fetch user permissions');

      const isComplianceFinalApprover = userData?.complianceandfinalapprover === true;
      const userCompany = userData?.company || '';

      // Fetch approval matrix filtered by company
      const { data: matrix, error } = await supabase
        .from('approvalmatrix')
        .select('firstapprover, secondapprover, thirdapprover')
        .eq('approvaltype', formData.custtype)
        .eq('company', userCompany)
        .single();

      if (error || !matrix) throw new Error('Approval matrix not found');

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
          const secondList = parseApprovers(matrix.secondapprover);
          const thirdList = parseApprovers(matrix.thirdapprover);
          const combined = Array.from(new Set([...secondList, ...thirdList]));
          updatedNextApprover = combined.join(',');
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
        updatedStatus === 'APPROVED' ? formData.maker || '' : updatedNextApprover || '';

      await submitToEmail(dataToSend, approvalValueToSend, forFinalApprovalFlag, 1, '');

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error || 'Failed to approve!');
        return false;
      }

      if (shouldSubmitToBOS) {
        const updatedFormData = { ...formData, approvestatus: 'APPROVED' };
        try {
          const bosSuccess = await submitToBOS(updatedFormData);
          if (bosSuccess) {
            toast({ title: 'Success', description: 'Form approved and submitted to BOS successfully!' });
            await submitToExecEmail(dataToSend);
          } else {
            toast({ title: 'Partial Success', description: 'Form approved but BOS submission failed. Please submit manually.', variant: 'destructive' });
          }
        } catch (bosError) {
          console.error('BOS submission error:', bosError);
          toast({ title: 'Partial Success', description: 'Form approved but BOS submission failed. Please submit manually.', variant: 'destructive' });
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
  const cancelForm = async (formData: any): Promise<boolean> => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) { alert('Cannot cancel: ID (#) is missing or invalid.'); return false; }

      const dataToSend = { ...formData, approvestatus: 'CANCELLED', nextapprover: '', finalapprover: '' };

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) { alert(result.error || 'Failed to cancel request!'); return false; }

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
  const returnForm = async (formData: any, remarksreturn: string): Promise<boolean> => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) { alert('Cannot return: ID (#) is missing or invalid.'); return false; }

      const dataToSend = {
        ...formData,
        approvestatus: 'RETURN TO MAKER',
        nextapprover: '',
        finalapprover: '',
        remarks: remarksreturn,
      };
      await submitToEmail(dataToSend, formData.maker, 0, 0, remarksreturn);

      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) { alert(result.error || 'Failed to return!'); return false; }

      toast({ title: 'Success', description: 'Form returned successfully!' });
      if (onClose) onClose();
      return true;
    } catch (err) {
      console.error('Return error:', err);
      alert('Failed to return request.');
      return false;
    }
  };

  // ==================== RETURN TO MAKER ====================
  const returntomakerForm = async (formData: any, remarksreturn: string): Promise<boolean> => {
    try {
      const rowId = Number((formData as any)['#']);
      if (!rowId || Number.isNaN(rowId)) { alert('Cannot return: ID (#) is missing or invalid.'); return false; }

      const dataToSend = {
        ...formData,
        approvestatus: 'RETURN TO MAKER',
        nextapprover: '',
        finalapprover: '',
        remarks: remarksreturn,
      };
      await submitToEmail(dataToSend, formData.maker, 1, 0, remarksreturn);
      const response = await fetch(`${BASE_URL}/api/updateform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, data: dataToSend }),
      });

      const result = await response.json();
      if (!response.ok) { alert(result.error || 'Failed to return request!'); return false; }

      toast({ title: 'Success', description: 'Customer Form returned successfully!' });
      if (onClose) onClose();
      return true;
    } catch (err) {
      console.error('Return error:', err);
      alert('Failed to return request.');
      return false;
    }
  };

  return {
    loading,
    approveForm,
    cancelForm,
    returnForm,
    returntomakerForm,
    submitToBOS,
    submitToEmail,
    submitToExecEmail,
  };
};
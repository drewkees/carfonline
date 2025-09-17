import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CustomerFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CustomerActivationForm: React.FC<CustomerFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    request_for: [] as string[],
    apply_for: [] as string[],
    type: [] as string[],
    distribution_channel: [] as string[],
    registered_name: '',
    id_type: 'TIN',
    tin: '',
    billing_address: '',
    branch: '',
    store_code: '',
    trade_name: '',
    delivery_address: '',
    customer_name: '',
    email: '',
    position: '',
    cellphone: '',
    supporting_docs: null as File | null,
    bos_wms_code: '',
    business_center: '',
    region: '',
    district: '',
    sales_org: '',
    distribution_channel_sales: '',
    division: '',
    truck_capacity: {
      '2TONNER FRESH3 - 1500kg': '',
      '2TONNER FROZEN - 1500kg': '',
      '4TONNER FRESH - 2600kg': '',
      '4TONNER FROZEN - 2600kg': '',
      'FORWARD FRESH - 6000kg': '',
      'FORWARD FROZEN - 6000kg': '',
    },
    date_to_start: new Date().toISOString().split('T')[0],
    terms: '',
    credit_limit: '',
    target_volume_day: '',
    target_volume_month: '',
    executive: '',
    gm_sam_am: '',
    sao_supervisor: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string) => {
    setFormData(prev => {
      const current = prev[field as keyof typeof prev] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleTruckCapacityChange = (truck: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      truck_capacity: { ...prev.truck_capacity, [truck]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('customers').insert([formData]);
      if (error) throw error;
      toast({ title: 'Success', description: 'Customer form submitted successfully.' });
      onSuccess();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit form.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg overflow-y-auto max-h-[95vh] p-6 relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          ✕
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-center mb-6">CUSTOMER ACTIVATION REQUEST FORM</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request For */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Request For</Label>
              <div className="flex gap-2 mt-1">
                {['ACTIVATION', 'DEACTIVATION', 'EDIT'].map(option => (
                  <label key={option} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={formData.request_for.includes(option)}
                      onChange={() => handleCheckboxChange('request_for', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Apply For</Label>
              <div className="flex gap-2 mt-1">
                {['SOLD TO PARTY', 'SHIP TO PARTY'].map(option => (
                  <label key={option} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={formData.apply_for.includes(option)}
                      onChange={() => handleCheckboxChange('apply_for', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                {['INDIVIDUAL', 'CORPORATION'].map(option => (
                  <label key={option} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={formData.type.includes(option)}
                      onChange={() => handleCheckboxChange('type', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Distribution Channel</Label>
              <div className="flex gap-2 mt-1">
                {['OUTRIGHT', 'CONSIGNMENT'].map(option => (
                  <label key={option} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={formData.distribution_channel.includes(option)}
                      onChange={() => handleCheckboxChange('distribution_channel', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Registered Company Name (Sold to Party)</Label>
              <Input
                value={formData.registered_name}
                onChange={(e) => handleInputChange('registered_name', e.target.value)}
                className="bg-gray-100"
              />
            </div>
            <div>
              <Label>ID Type</Label>
              <div className="flex gap-2 mt-1">
                {['TIN', 'OTHERS'].map(option => (
                  <label key={option} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      checked={formData.id_type === option}
                      onChange={() => handleInputChange('id_type', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {formData.id_type === 'TIN' && (
                <Input
                  placeholder="TIN"
                  value={formData.tin}
                  onChange={(e) => handleInputChange('tin', e.target.value)}
                  className="bg-gray-100 mt-1"
                />
              )}
            </div>

            {/* Other fields */}
            <div>
              <Label>Billing Address</Label>
              <Input value={formData.billing_address} onChange={(e) => handleInputChange('billing_address', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Branch (Ship to Party)</Label>
              <Input value={formData.branch} onChange={(e) => handleInputChange('branch', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Store Code</Label>
              <Input value={formData.store_code} onChange={(e) => handleInputChange('store_code', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Trade Name (Business Style)</Label>
              <Input value={formData.trade_name} onChange={(e) => handleInputChange('trade_name', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Delivery Address</Label>
              <Input value={formData.delivery_address} onChange={(e) => handleInputChange('delivery_address', e.target.value)} className="bg-gray-100"/>
            </div>

            {/* Requester Info */}
            <div>
              <Label>Customer Name</Label>
              <Input value={formData.customer_name} onChange={(e) => handleInputChange('customer_name', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Email Address</Label>
              <Input value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Position</Label>
              <Input value={formData.position} onChange={(e) => handleInputChange('position', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Cellphone No.</Label>
              <Input value={formData.cellphone} onChange={(e) => handleInputChange('cellphone', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Supporting Documents</Label>
              <Input type="file" onChange={(e) => handleInputChange('supporting_docs', e.target.files?.[0] || null)} />
            </div>
          </div>

          {/* Truck Capacity Table */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="border border-gray-400">
                  <th className="border border-gray-400 p-2">Truck Description</th>
                  <th className="border border-gray-400 p-2">Check Capacity</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(formData.truck_capacity).map(truck => (
                  <tr key={truck}>
                    <td className="border border-gray-400 p-2">{truck}</td>
                    <td className="border border-gray-400 p-2">
                      <Input
                        value={formData.truck_capacity[truck]}
                        onChange={(e) => handleTruckCapacityChange(truck, e.target.value)}
                        className="bg-gray-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Other Details */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Date to Start</Label>
              <Input type="date" value={formData.date_to_start} onChange={(e) => handleInputChange('date_to_start', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Terms</Label>
              <Select value={formData.terms} onValueChange={(v) => handleInputChange('terms', v)}>
                <SelectTrigger className="bg-gray-100 border-gray-300"><SelectValue placeholder="Select Terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COD">COD</SelectItem>
                  <SelectItem value="NET30">NET30</SelectItem>
                  <SelectItem value="Z15">Z15</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Credit Limit</Label>
              <Input type="number" value={formData.credit_limit} onChange={(e) => handleInputChange('credit_limit', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Target Volume (kgs)/Day</Label>
              <Input value={formData.target_volume_day} onChange={(e) => handleInputChange('target_volume_day', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>Target Volume (kgs)/Month</Label>
              <Input value={formData.target_volume_month} onChange={(e) => handleInputChange('target_volume_month', e.target.value)} className="bg-gray-100"/>
            </div>
          </div>

          {/* Employee Signatures */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Executive</Label>
              <Input value={formData.executive} onChange={(e) => handleInputChange('executive', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>GM/SAM/AM</Label>
              <Input value={formData.gm_sam_am} onChange={(e) => handleInputChange('gm_sam_am', e.target.value)} className="bg-gray-100"/>
            </div>
            <div>
              <Label>SAO/Supervisor</Label>
              <Input value={formData.sao_supervisor} onChange={(e) => handleInputChange('sao_supervisor', e.target.value)} className="bg-gray-100"/>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={loading} className="bg-primary text-white hover:bg-primary/90">
              {loading ? 'Submitting...' : 'Submit Form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerActivationForm;

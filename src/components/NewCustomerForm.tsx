import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface NewCustomerFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const NewCustomerForm: React.FC<NewCustomerFormProps> = ({ onClose, onSuccess }) => {
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
            {[
              { label: 'Request For', field: 'request_for', options: ['ACTIVATION', 'DEACTIVATION', 'EDIT'] },
              { label: 'Apply For', field: 'apply_for', options: ['SOLD TO PARTY', 'SHIP TO PARTY'] },
              { label: 'Type', field: 'type', options: ['INDIVIDUAL', 'CORPORATION'] },
              { label: 'Distribution Channel', field: 'distribution_channel', options: ['OUTRIGHT', 'CONSIGNMENT'] },
            ].map(({ label, field, options }) => (
              <div key={field}>
                <Label>{label}</Label>
                <div className="flex gap-2 mt-1">
                  {options.map(option => (
                    <label key={option} className="flex items-center space-x-1 text-gray-900">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={(formData as any)[field].includes(option)}
                        onChange={() => handleCheckboxChange(field, option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Registered Company Name (Sold to Party)</Label>
              <Input
                value={formData.registered_name}
                onChange={(e) => handleInputChange('registered_name', e.target.value)}
                className="bg-gray-200 text-gray-900 border border-gray-300 px-2 py-1 rounded"
              />
            </div>

            <div>
              <Label>ID Type</Label>
              <div className="flex gap-2 mt-1">
                {['TIN', 'OTHERS'].map(option => (
                  <label key={option} className="flex items-center space-x-1 text-gray-900">
                    <input
                      type="radio"
                      className="accent-primary"
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
                  className="bg-gray-200 text-gray-900 border border-gray-300 px-2 py-1 mt-1 rounded"
                />
              )}
            </div>

            {/* Other Customer Fields */}
            {[
              { label: 'Billing Address', field: 'billing_address' },
              { label: 'Branch (Ship to Party)', field: 'branch' },
              { label: 'Store Code', field: 'store_code' },
              { label: 'Trade Name (Business Style)', field: 'trade_name' },
              { label: 'Delivery Address', field: 'delivery_address' },
              { label: 'Customer Name', field: 'customer_name' },
              { label: 'Email Address', field: 'email' },
              { label: 'Position', field: 'position' },
              { label: 'Cellphone No.', field: 'cellphone' },
            ].map(({ label, field }) => (
              <div key={field}>
                <Label>{label}</Label>
                <Input
                  value={(formData as any)[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="bg-gray-200 text-gray-900 border border-gray-300 px-2 py-1 rounded"
                />
              </div>
            ))}

            {/* Supporting Docs */}
            <div>
              <Label>Supporting Documents</Label>
              <Input
                type="file"
                onChange={(e) => handleInputChange('supporting_docs', e.target.files?.[0] || null)}
                className="bg-gray-200 text-gray-900 border border-gray-300 px-2 py-1 rounded"
              />
            </div>
          </div>

          {/* Truck Capacity Table */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="border border-gray-400 bg-gray-100 text-gray-900">
                  <th className="border border-gray-400 p-2">Truck Description</th>
                  <th className="border border-gray-400 p-2">Check Capacity</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(formData.truck_capacity).map(truck => (
                  <tr key={truck}>
                    <td className="border border-gray-400 p-2 text-gray-900">{truck}</td>
                    <td className="border border-gray-400 p-2">
                      <Input
                        value={formData.truck_capacity[truck]}
                        onChange={(e) => handleTruckCapacityChange(truck, e.target.value)}
                        className="bg-gray-200 text-gray-900 border border-gray-300 px-2 py-1 rounded"
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
              <Input
                type="date"
                value={formData.date_to_start}
                onChange={(e) => handleInputChange('date_to_start', e.target.value)}
                className="bg-gray-200 text-gray-900 border border-gray-300 px-2 py-1 rounded"
              />
            </div>
            <div>
              <Label>Terms</Label>
              <Select
                value={formData.terms}
                onValueChange={(v) => handleInputChange('terms', v)}
              >
                <SelectTrigger className="bg-gray-200 text-gray-900 border border-gray-300 rounded">
                  <SelectValue placeholder="Select Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COD">COD</SelectItem>
                  <SelectItem value="NET30">NET30</SelectItem>
                  <SelectItem value="Z15">Z15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {[
              { label: 'Credit Limit', field: 'credit_limit', type: 'number' },
              { label: 'Target Volume (kgs)/Day', field: 'target_volume_day', type: 'text' },
              { label: 'Target Volume (kgs)/Month', field: 'target_volume_month', type: 'text' },
              { label: 'Executive', field: 'executive', type: 'text' },
              { label: 'GM/SAM/AM', field: 'gm_sam_am', type: 'text' },
              { label: 'SAO/Supervisor', field: 'sao_supervisor', type: 'text' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <Label>{label}</Label>
                <Input
                  type={type as any}
                  value={(formData as any)[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="bg-gray-200 text-gray-900 border border-gray-300 px-2 py-1 rounded"
                />
              </div>
            ))}
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

export default NewCustomerForm;

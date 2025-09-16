import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface NewCustomerFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const NewCustomerForm: React.FC<NewCustomerFormProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    request_for: 'ACTIVATION',
    bos_mws_code: '',
    sold_to_party: '',
    ship_to_party: '',
    business_center: '',
    terms: '',
    credit_limit: '',
    distributor_type: '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sold_to_party) {
      toast({
        title: "Error",
        description: "Sold to Party is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('customers')
        .insert([{
          ...formData,
          credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : 0,
          ship_to_party: formData.ship_to_party || formData.sold_to_party,
        }]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Customer created successfully.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customer List
        </Button>
        <h2 className="text-xl font-semibold text-foreground">NEW CUSTOMER</h2>
      </div>

      {/* Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="request_for" className="text-foreground">Request For</Label>
                <Select
                  value={formData.request_for}
                  onValueChange={(value) => handleInputChange('request_for', value)}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVATION">ACTIVATION</SelectItem>
                    <SelectItem value="MODIFICATION">MODIFICATION</SelectItem>
                    <SelectItem value="DEACTIVATION">DEACTIVATION</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bos_mws_code" className="text-foreground">BOS/MWS Code</Label>
                <Input
                  id="bos_mws_code"
                  value={formData.bos_mws_code}
                  onChange={(e) => handleInputChange('bos_mws_code', e.target.value)}
                  placeholder="Enter BOS/MWS code"
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sold_to_party" className="text-foreground">Sold to Party *</Label>
                <Input
                  id="sold_to_party"
                  value={formData.sold_to_party}
                  onChange={(e) => handleInputChange('sold_to_party', e.target.value)}
                  placeholder="Enter customer name"
                  required
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ship_to_party" className="text-foreground">Ship to Party</Label>
                <Input
                  id="ship_to_party"
                  value={formData.ship_to_party}
                  onChange={(e) => handleInputChange('ship_to_party', e.target.value)}
                  placeholder="Enter shipping address (optional)"
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_center" className="text-foreground">Business Center</Label>
                <Select
                  value={formData.business_center}
                  onValueChange={(value) => handleInputChange('business_center', value)}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select business center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUTUAN">BUTUAN</SelectItem>
                    <SelectItem value="DAVAO">DAVAO</SelectItem>
                    <SelectItem value="BICOL">BICOL</SelectItem>
                    <SelectItem value="ROXAS">ROXAS</SelectItem>
                    <SelectItem value="MANILA">MANILA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms" className="text-foreground">Terms</Label>
                <Select
                  value={formData.terms}
                  onValueChange={(value) => handleInputChange('terms', value)}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">COD</SelectItem>
                    <SelectItem value="Z15">Z15</SelectItem>
                    <SelectItem value="Z15C">Z15C</SelectItem>
                    <SelectItem value="NET30">NET30</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_limit" className="text-foreground">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                  placeholder="Enter credit limit"
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distributor_type" className="text-foreground">Distributor Type</Label>
                <Select
                  value={formData.distributor_type}
                  onValueChange={(value) => handleInputChange('distributor_type', value)}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select distributor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MODE">MODE</SelectItem>
                    <SelectItem value="VAN S">VAN SALES</SelectItem>
                    <SelectItem value="LIVE S">LIVE SALES</SelectItem>
                    <SelectItem value="INDIVI">INDIVIDUAL</SelectItem>
                    <SelectItem value="WHOLE">WHOLESALE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                className="bg-secondary text-secondary-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Customer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewCustomerForm;
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  requestfor: string;
  boscode: string | null;
  soldtoparty: string;
  shiptoparty: string | null;
  bucenter: string | null;
  terms: string | null;
  creditlimit: number | null;
  custtype: string | null;
  approvestatus: string | null;
}

interface CustomerListProps {
  onNewCustomer: () => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ onNewCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customerdata')
        .select('*')
        .eq('approvestatus', 'PENDING')
        .order('datecreated', { ascending: false });

      if (error) {
        throw error;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

 const filteredCustomers = customers.filter(c =>
  (c.soldtoparty ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
  (c.shiptoparty ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
  (c.bucenter ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
  (c.boscode ?? '').toLowerCase().includes(searchQuery.toLowerCase())
);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-foreground" />
          <h2 className="text-xl font-semibold text-foreground">CUSTOMER LIST</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-input border-border"
            />
          </div>
          <Button
            onClick={onNewCustomer}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            NEW CUSTOMER
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground font-medium">REQUEST FOR</TableHead>
                  <TableHead className="text-foreground font-medium">BOS/MWS CODE</TableHead>
                  <TableHead className="text-foreground font-medium">SOLD TO PARTY</TableHead>
                  <TableHead className="text-foreground font-medium">SHIP TO PARTY</TableHead>
                  <TableHead className="text-foreground font-medium">BUSINESS CENTER</TableHead>
                  <TableHead className="text-foreground font-medium">TERMS</TableHead>
                  <TableHead className="text-foreground font-medium">CREDIT LIMIT</TableHead>
                  <TableHead className="text-foreground font-medium">DISTRIB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        {customer.requestfor}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {customer.boscode || '-'}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {customer.soldtoparty}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {customer.shiptoparty || customer.soldtoparty}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {customer.bucenter}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {customer.terms}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {formatCurrency(customer.creditlimit)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {customer.custtype}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <span>Items per page:</span>
          <span className="font-medium">{itemsPerPage}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>
            {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
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

const ApprovedCustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchApprovedCustomers();
  }, []);

  const fetchApprovedCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customerdata')
        .select('*')
        .eq('approvestatus', 'CANCELLED') // Only approved
        .order('datecreated', { ascending: false });
      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching approved customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch approved customers. Please try again.",
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

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading approved customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <User className="h-6 w-6 text-foreground" />
        <h2 className="text-xl font-semibold text-foreground">APPROVED CUSTOMERS</h2>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4 mt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64 bg-input border-border"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>REQUEST FOR</TableHead>
                  <TableHead>BOS/MWS CODE</TableHead>
                  <TableHead>SOLD TO PARTY</TableHead>
                  <TableHead>SHIP TO PARTY</TableHead>
                  <TableHead>BUSINESS CENTER</TableHead>
                  <TableHead>TERMS</TableHead>
                  <TableHead>CREDIT LIMIT</TableHead>
                  <TableHead>DISTRIB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCustomers.map((c) => (
                  <TableRow key={c.id} className="border-border hover:bg-muted/50">
                    <TableCell><Badge variant="secondary">{c.requestfor}</Badge></TableCell>
                    <TableCell>{c.boscode || '-'}</TableCell>
                    <TableCell className="font-medium">{c.soldtoparty}</TableCell>
                    <TableCell>{c.shiptoparty || c.soldtoparty}</TableCell>
                    <TableCell>{c.bucenter}</TableCell>
                    <TableCell>{c.terms}</TableCell>
                    <TableCell>{formatCurrency(c.creditlimit)}</TableCell>
                    <TableCell>{c.custtype}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
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
  );
};

export default ApprovedCustomerList;

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  [key: string]: any;
}

interface CustomerGSheetProps {
  onNewCustomer?: () => void;
  onEditCustomer?: (customer: Customer) => void;
}

const CustomerGSheet: React.FC<CustomerGSheetProps> = ({ onNewCustomer, onEditCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 200;
  const [columns, setColumns] = useState<string[]>([]);

  const SHEET_ID = "1JJDh_w_opcdy3QNPZ-1xh-wahsx_t0iElBw95TwK8iY";
  const API_KEY = "AIzaSyDy68c4i84RYAM-5iDKyzCGQVCJPimid4U";
  const RANGE = "CUSTOMER DATA!A1:Z1000"; // Adjust range as needed

  // Fetch Google Sheet data
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
      );
      const result = await res.json();

      if (!result.values || result.values.length === 0) {
        setCustomers([]);
        setColumns([]);
        return;
      }

      const [headerRow, ...rows] = result.values;
      setColumns(headerRow);

      const sheetCustomers = rows.map((row, idx) => {
        const customer: Customer = { id: idx.toString() };
        headerRow.forEach((key, i) => {
          customer[key] = row[i] ?? null;
        });
        return customer;
      });

      setCustomers(sheetCustomers);
    } catch (error) {
      console.error("Error fetching Google Sheet:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers from Google Sheet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    Object.values(c)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "-";
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-6">
        <div className="space-y-6 pb-24">
          {/* Page Header */}
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
                  className="pl-10 w-64 bg-input border-border transition-all duration-300 hover:w-80 focus:w-80"
                />
              </div>
              {onNewCustomer && (
                <Button
                  onClick={onNewCustomer}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6"
                >
                  <Plus className="h-2 w-4 mr-2" />
                  NEW CUSTOMER
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <Card className="bg-card border-border overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div
                className="w-full overflow-x-auto no-scrollbar"
                style={{ maxHeight: "calc(100vh - 300px)", width: "100%" }}
              >
                <table className="min-w-max w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b bg-muted">
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="text-foreground font-medium text-left px-4 py-2 whitespace-nowrap text-sm"
                          style={{ minWidth: "150px" }}
                        >
                          {col.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer"
                        onDoubleClick={() => onEditCustomer && onEditCustomer(customer)}
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="text-foreground px-4 py-2 whitespace-nowrap text-sm"
                          >
                            {formatValue(customer[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of{" "}
                {filteredCustomers.length}
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
      </main>
    </div>
  );
};

export default CustomerGSheet;

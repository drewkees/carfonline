import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Crown, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // ✅ Ensure this points to your configured Supabase client

interface Employee {
  employeeno: string;
  employeename: string;
  employeetype: string;
}

const EmployeeDirectory: React.FC = () => {
  const [executives, setExecutives] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [sao, setSao] = useState<Employee[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedemployeetype, setSelectedemployeetype] = useState("");
  const [formData, setFormData] = useState<Employee>({ employeeno: "", employeename: "", employeetype: "" });
  const [editedIndex, setEditedIndex] = useState(-1);

  // 🟢 Fetch employees from Supabase and categorize them
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("*");
      if (error) {
        console.error("Supabase fetch error:", error.message);
        return;
      }

      // Filter employees by employeetype
      setExecutives(data.filter((e: Employee) => e.employeetype === "GM"));
      setManagers(data.filter((e: Employee) => e.employeetype === "AM"));
      setSao(data.filter((e: Employee) => e.employeetype === "SS"));
    };

    fetchEmployees();
  }, []);

  const openDialogEmployee = (employeetype: string) => {
    setSelectedemployeetype(employeetype);
    setFormData({ employeeno: "", employeename: "", employeetype: "" });
    setEditedIndex(-1);
    setShowDialog(true);
  };

  const openEditDialog = (item: Employee, employeetype: string, index: number) => {
    setSelectedemployeetype(employeetype);
    setFormData({ ...item });
    setEditedIndex(index);
    setShowDialog(true);
  };

  const saveEmployee = async () => {
    const newEmp = { employeeno: formData.employeeno, employeename: formData.employeename, employeetype: formData.employeetype };
    const { error } = await supabase.from("employees").insert([newEmp]);
    if (error) {
      console.error("Insert failed:", error.message);
      return;
    }
    // Refresh data
    const { data } = await supabase.from("employees").select("*");
    setExecutives(data.filter((e: Employee) => e.employeetype === "GM"));
    setManagers(data.filter((e: Employee) => e.employeetype === "AM"));
    setSao(data.filter((e: Employee) => e.employeetype === "SS"));
    setShowDialog(false);
  };

  const updateEmployee = async () => {
    const { error } = await supabase
      .from("employees")
      .update({ employeeno: formData.employeeno, employeename: formData.employeename, employeetype: formData.employeetype })
      .eq("employeeno", formData.employeeno);

    if (error) {
      console.error("Update failed:", error.message);
      return;
    }
    // Refresh data
    const { data } = await supabase.from("employees").select("*");
    setExecutives(data.filter((e: Employee) => e.employeetype === "GM"));
    setManagers(data.filter((e: Employee) => e.employeetype === "AM"));
    setSao(data.filter((e: Employee) => e.employeetype === "SS"));
    setShowDialog(false);
  };

  const deleteEmployee = async () => {
    const { error } = await supabase.from("employees").delete().eq("employeeno", formData.employeeno);
    if (error) {
      console.error("Delete failed:", error.message);
      return;
    }
    // Refresh data
    const { data } = await supabase.from("employees").select("*");
    setExecutives(data.filter((e: Employee) => e.employeetype === "GM"));
    setManagers(data.filter((e: Employee) => e.employeetype === "AM"));
    setSao(data.filter((e: Employee) => e.employeetype === "SS"));
    setShowDialog(false);
  };

  const renderTable = (title: string, color: string, data: Employee[]) => (
    <Card className="bg-card border-border">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <Crown className={`text-${color}-500`} />
          <span className="font-bold">{title}</span>
        </CardTitle>
        <Button variant="warning" onClick={() => openDialogEmployee(title)}>
          <PlusCircle className="mr-2 h-4 w-4" /> ADD
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-y-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp No</TableHead>
                <TableHead>Employee Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openEditDialog(item, title, index)}
                >
                  <TableCell>{item.employeeno}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge className="rounded-full w-6 h-6 flex items-center justify-center mr-2">
                        {item.employeename.charAt(0)}
                      </Badge>
                      {item.employeename}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 text-foreground" />
        <h2 className="text-xl font-semibold">Employee Directory</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderTable("Executives", "yellow", executives)}
        {renderTable("Managers", "orange", managers)}
        {renderTable("SAO", "red", sao)}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editedIndex > -1 ? "Employee Details" : "Add Employee"} ({selectedemployeetype})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={formData.employeetype}
              readOnly
              placeholder="employeetype"
            />
            <Input
              value={formData.employeeno}
              placeholder="Employee No"
              onChange={(e) => setFormData({ ...formData, employeeno: e.target.value })}
            />
            <Input
              value={formData.employeename}
              placeholder="Employee Name"
              onChange={(e) => setFormData({ ...formData, employeename: e.target.value })}
            />
          </div>
          <DialogFooter className="mt-4 flex justify-between">
            {editedIndex === -1 && <Button onClick={saveEmployee}>Save</Button>}
            {editedIndex > -1 && (
              <>
                <Button onClick={updateEmployee} variant="success">
                  Update
                </Button>
                <Button onClick={deleteEmployee} variant="destructive">
                  Delete
                </Button>
              </>
            )}
            <Button onClick={() => setShowDialog(false)} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDirectory;

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Crown, PlusCircle, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"Executives" | "Managers" | "SAO">("Executives");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("*");
    if (error) {
      console.error("Supabase fetch error:", error.message);
      return;
    }

    setExecutives(data.filter((e: Employee) => e.employeetype === "GM"));
    setManagers(data.filter((e: Employee) => e.employeetype === "AM"));
    setSao(data.filter((e: Employee) => e.employeetype === "SS"));
  };

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
    await fetchEmployees();
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
    await fetchEmployees();
    setShowDialog(false);
  };

  const deleteEmployee = async () => {
    if (confirm('Are you sure you want to delete this employee?')) {
      const { error } = await supabase.from("employees").delete().eq("employeeno", formData.employeeno);
      if (error) {
        console.error("Delete failed:", error.message);
        return;
      }
      await fetchEmployees();
      setShowDialog(false);
    }
  };

  const renderDesktopTable = (title: string, color: string, data: Employee[]) => (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <Crown className={`text-${color}-500`} />
          <span className="font-bold">{title}</span>
        </CardTitle>
        <Button variant="warning" onClick={() => openDialogEmployee(title)}>
          <PlusCircle className="mr-2 h-4 w-4" /> ADD
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="no-scrollbar overflow-y-auto relative" style={{ maxHeight: 'calc(95vh - 280px)' }}>
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

  const renderMobileCards = (title: string, color: string, data: Employee[]) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className={`text-${color}-500`} size={20} />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <button
          onClick={() => openDialogEmployee(title)}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <PlusCircle size={16} />
          Add
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No {title.toLowerCase()} found
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((item, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge className="rounded-full w-10 h-10 flex items-center justify-center text-base">
                      {item.employeename.charAt(0)}
                    </Badge>
                    <div>
                      <div className="font-semibold text-foreground">{item.employeename}</div>
                      <div className="text-xs text-muted-foreground">Emp No: {item.employeeno}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditDialog(item, title, index)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full bg-background flex flex-col">
      {isMobile ? (
        /* Mobile Layout */
        <>
          <div className="flex-shrink-0 bg-background border-b border-border">
            <div className="flex items-center gap-3 px-4 py-4">
              <User className="h-6 w-6 text-foreground" />
              <h2 className="text-xl font-semibold">Employee Directory</h2>
            </div>
            
            {/* Tab Selection */}
            <div className="flex gap-2 px-4 pb-3">
              <button
                onClick={() => setActiveTab("Executives")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "Executives"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Executives
              </button>
              <button
                onClick={() => setActiveTab("Managers")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "Managers"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Managers
              </button>
              <button
                onClick={() => setActiveTab("SAO")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "SAO"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                SAO
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {activeTab === "Executives" && renderMobileCards("Executives", "yellow", executives)}
            {activeTab === "Managers" && renderMobileCards("Managers", "orange", managers)}
            {activeTab === "SAO" && renderMobileCards("SAO", "red", sao)}
          </div>
        </>
      ) : (
        /* Desktop Layout */
        <>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <User className="h-6 w-6 text-foreground" />
            <h2 className="text-xl font-semibold">Employee Directory</h2>
          </div>
          <div className="flex-1 overflow-auto px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {renderDesktopTable("Executives", "yellow", executives)}
              {renderDesktopTable("Managers", "orange", managers)}
              {renderDesktopTable("SAO", "red", sao)}
            </div>
          </div>
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-md" : ""}>
          <DialogHeader>
            <DialogTitle>
              {editedIndex > -1 ? "Employee Details" : "Add Employee"} ({selectedemployeetype})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm mb-1 block text-muted-foreground">Employee Type</label>
              <Input
                value={formData.employeetype}
                readOnly
                placeholder="Employee Type"
                className="bg-muted"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block text-muted-foreground">Employee No</label>
              <Input
                value={formData.employeeno}
                placeholder="Employee No"
                onChange={(e) => setFormData({ ...formData, employeeno: e.target.value })}
                disabled={editedIndex > -1}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block text-muted-foreground">Employee Name</label>
              <Input
                value={formData.employeename}
                placeholder="Employee Name"
                onChange={(e) => setFormData({ ...formData, employeename: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className={`mt-4 ${isMobile ? 'flex-col gap-2' : 'flex justify-between'}`}>
            {editedIndex === -1 ? (
              <>
                <Button onClick={saveEmployee} className="w-full md:w-auto">Save</Button>
                <Button onClick={() => setShowDialog(false)} variant="secondary" className="w-full md:w-auto">
                  Close
                </Button>
              </>
            ) : (
              <>
                <div className={isMobile ? 'flex gap-2 w-full' : 'flex gap-2'}>
                  <Button onClick={updateEmployee} variant="default" className={isMobile ? 'flex-1' : ''}>
                    Update
                  </Button>
                  <Button onClick={deleteEmployee} variant="destructive" className={isMobile ? 'flex-1' : ''}>
                    Delete
                  </Button>
                </div>
                <Button onClick={() => setShowDialog(false)} variant="secondary" className="w-full md:w-auto">
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDirectory;
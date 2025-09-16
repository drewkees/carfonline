import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Home, 
  Car, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';

interface DashboardLayoutProps {
  userEmail: string;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userEmail, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Sample data for demonstration
  const sampleVehicles = [
    { id: 1, model: 'Toyota Camry', year: '2023', status: 'Available', customer: 'John Doe' },
    { id: 2, model: 'Honda Accord', year: '2022', status: 'In Use', customer: 'Jane Smith' },
    { id: 3, model: 'BMW X5', year: '2024', status: 'Maintenance', customer: 'Mike Johnson' },
  ];

  const sampleRequests = [
    { id: 1, type: 'Vehicle Request', customer: 'John Doe', status: 'Pending', date: '2024-01-15' },
    { id: 2, type: 'Maintenance', customer: 'Jane Smith', status: 'Approved', date: '2024-01-14' },
    { id: 3, type: 'Return', customer: 'Mike Johnson', status: 'Completed', date: '2024-01-13' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="carf-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Vehicles</p>
                      <p className="text-3xl font-bold text-foreground">24</p>
                    </div>
                    <Car className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="carf-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Requests</p>
                      <p className="text-3xl font-bold text-foreground">8</p>
                    </div>
                    <FileText className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="carf-gradient-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Customers</p>
                      <p className="text-3xl font-bold text-foreground">156</p>
                    </div>
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'vehicles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Vehicle Management</h2>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
            
            <Card className="carf-gradient-card border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {sampleVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border">
                      <div className="flex items-center space-x-4">
                        <Car className="h-8 w-8 text-accent" />
                        <div>
                          <p className="font-semibold text-foreground">{vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">Year: {vehicle.year} | Customer: {vehicle.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={vehicle.status === 'Available' ? 'default' : vehicle.status === 'In Use' ? 'secondary' : 'destructive'}>
                          {vehicle.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'requests':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Request Management</h2>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
            
            <Card className="carf-gradient-card border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {sampleRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-accent" />
                        <div>
                          <p className="font-semibold text-foreground">{request.type}</p>
                          <p className="text-sm text-muted-foreground">Customer: {request.customer} | Date: {request.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={request.status === 'Completed' ? 'default' : request.status === 'Approved' ? 'secondary' : 'destructive'}>
                          {request.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card className="carf-gradient-card border-border">
            <CardContent className="p-6">
              <p className="text-foreground">Content for {activeTab} coming soon...</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-card border-r border-border flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-foreground">CARF System</h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-foreground"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  className={`w-full justify-start ${!sidebarOpen ? 'px-2' : ''} ${
                    activeTab === item.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-secondary hover:text-secondary-foreground'
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {sidebarOpen && <span className="ml-2">{item.label}</span>}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">Logged in as:</p>
              <p className="text-sm text-foreground font-medium truncate">{userEmail}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={onLogout}
            className={`w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive ${!sidebarOpen ? 'px-2' : ''}`}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground capitalize">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 carf-input-overlay border-border text-foreground"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
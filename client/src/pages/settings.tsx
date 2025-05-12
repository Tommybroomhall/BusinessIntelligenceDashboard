import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenant } from "@/context/tenant-context";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  // Business info state
  const [businessInfo, setBusinessInfo] = useState({
    name: tenant?.name || "",
    email: tenant?.email || "",
    phone: tenant?.phone || "",
    address: tenant?.address || "",
    website: tenant?.website || "",
  });
  
  // API keys state
  const [apiKeys, setApiKeys] = useState({
    stripeKey: "",
    ga4Key: "",
  });
  
  // New user state
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "viewer",
  });
  
  // Sample team members
  const teamMembers = [
    {
      id: "1",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: "2",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Editor",
      status: "Active",
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "michael.brown@example.com",
      role: "Viewer",
      status: "Invited",
    },
  ];
  
  // Handle business info submit
  const submitBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real app, this would update the tenant data in the database
      toast({
        title: "Business information updated",
        description: "Your business details have been successfully saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update business information.",
        variant: "destructive",
      });
    }
  };
  
  // Handle API keys submit
  const submitApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real app, this would update the API keys in the database
      toast({
        title: "API keys updated",
        description: "Your API keys have been successfully saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update API keys.",
        variant: "destructive",
      });
    }
  };
  
  // Handle invite user
  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real app, this would invite a new user
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${newUser.email}.`,
      });
      
      // Reset form
      setNewUser({
        email: "",
        name: "",
        role: "viewer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your business information, integrations, and team members.
        </p>
      </div>
      
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        {/* Business Info Tab */}
        <TabsContent value="business">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <form onSubmit={submitBusinessInfo}>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Update your business details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Business Name</Label>
                      <Input 
                        id="business-name" 
                        value={businessInfo.name}
                        onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-email">Email</Label>
                      <Input 
                        id="business-email" 
                        type="email"
                        value={businessInfo.email}
                        onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business-phone">Phone</Label>
                      <Input 
                        id="business-phone" 
                        value={businessInfo.phone}
                        onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-website">Website</Label>
                      <Input 
                        id="business-website" 
                        value={businessInfo.website}
                        onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-address">Address</Label>
                    <Textarea 
                      id="business-address" 
                      rows={3}
                      value={businessInfo.address}
                      onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Upload your company logo and customize your dashboard appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={tenant?.logoUrl} />
                    <AvatarFallback className="text-2xl">
                      {tenant?.name?.charAt(0) || "B"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="mt-4">
                    <Button variant="outline" size="sm">
                      Upload Logo
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-6">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex">
                    <Input 
                      id="primary-color" 
                      defaultValue="#0ea5e9"
                    />
                    <div 
                      className="ml-2 w-10 h-10 rounded border" 
                      style={{ backgroundColor: "#0ea5e9" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Reset to Default
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <form onSubmit={submitApiKeys}>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Configure your API keys for external service integrations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe-key">Stripe Secret Key</Label>
                    <Input 
                      id="stripe-key" 
                      type="password"
                      value={apiKeys.stripeKey}
                      onChange={(e) => setApiKeys({...apiKeys, stripeKey: e.target.value})}
                      placeholder="sk_test_..."
                    />
                    <p className="text-xs text-gray-500">
                      Used for processing payments and subscriptions.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ga4-key">Google Analytics 4 (GA4) API Key</Label>
                    <Input 
                      id="ga4-key" 
                      type="password"
                      value={apiKeys.ga4Key}
                      onChange={(e) => setApiKeys({...apiKeys, ga4Key: e.target.value})}
                      placeholder="Upload JSON key file or enter credentials"
                    />
                    <p className="text-xs text-gray-500">
                      Required for website traffic analytics.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Other Integrations</Label>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-500">
                        Additional integrations can be managed from the marketplace.
                      </p>
                      <Button variant="link" className="px-0">
                        Browse Integration Marketplace
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Save API Keys</Button>
                </CardFooter>
              </form>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Configure webhook endpoints to receive real-time data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Contact Form Webhook</h4>
                      <p className="text-sm text-gray-500">
                        https://api.yourdomain.com/webhooks/contact-form
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Stripe Events</h4>
                      <p className="text-sm text-gray-500">
                        https://api.yourdomain.com/webhooks/stripe
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Add New Webhook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Team Tab */}
        <TabsContent value="team">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members and their access permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === "Active" ? "default" : "outline"}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          {member.id !== "1" && (
                            <Button variant="ghost" size="sm" className="text-red-500">
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <form onSubmit={inviteUser}>
                <CardHeader>
                  <CardTitle>Invite Team Member</CardTitle>
                  <CardDescription>
                    Send an invitation to add a new team member.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input 
                      id="invite-email" 
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Name</Label>
                    <Input 
                      id="invite-name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select 
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({...newUser, role: value})}
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Admin:</span> Full access to all features<br />
                      <span className="font-medium">Editor:</span> Can edit content but not settings<br />
                      <span className="font-medium">Viewer:</span> Read-only access
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Send Invitation
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/context/tenant-context";
import { useCurrency } from "@/context/CurrencyContext";
import { SupportedCurrencies } from "@/shared/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Database,
  BarChart4,
  CreditCard,
  Globe,
  Server,
  Webhook,
  Trash2,
  Mail
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WebhookSettings } from "@/components/settings/webhook-settings";

export default function Settings() {
  const { tenant } = useTenant();
  const { currencySettings, refreshCurrency } = useCurrency();
  const { toast } = useToast();

  // Currency data mapping
  const currencyData = [
    { code: "GBP", symbol: "£", locale: "en-GB", name: "British Pound Sterling" },
    { code: "USD", symbol: "$", locale: "en-US", name: "US Dollar" },
    { code: "EUR", symbol: "€", locale: "en-IE", name: "Euro" },
    { code: "JPY", symbol: "¥", locale: "ja-JP", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", locale: "en-AU", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", locale: "en-CA", name: "Canadian Dollar" },
    { code: "CHF", symbol: "CHF", locale: "de-CH", name: "Swiss Franc" },
    { code: "CNY", symbol: "¥", locale: "zh-CN", name: "Chinese Yuan" },
    { code: "INR", symbol: "₹", locale: "en-IN", name: "Indian Rupee" },
    { code: "KRW", symbol: "₩", locale: "ko-KR", name: "South Korean Won" },
    { code: "SEK", symbol: "kr", locale: "sv-SE", name: "Swedish Krona" },
    { code: "NOK", symbol: "kr", locale: "nb-NO", name: "Norwegian Krone" },
    { code: "DKK", symbol: "kr", locale: "da-DK", name: "Danish Krone" },
    { code: "PLN", symbol: "zł", locale: "pl-PL", name: "Polish Złoty" },
    { code: "CZK", symbol: "Kč", locale: "cs-CZ", name: "Czech Koruna" },
    { code: "HUF", symbol: "Ft", locale: "hu-HU", name: "Hungarian Forint" },
    { code: "RUB", symbol: "₽", locale: "ru-RU", name: "Russian Ruble" },
    { code: "TRY", symbol: "₺", locale: "tr-TR", name: "Turkish Lira" },
    { code: "BRL", symbol: "R$", locale: "pt-BR", name: "Brazilian Real" },
    { code: "MXN", symbol: "$", locale: "es-MX", name: "Mexican Peso" },
    { code: "ZAR", symbol: "R", locale: "en-ZA", name: "South African Rand" },
    { code: "ILS", symbol: "₪", locale: "he-IL", name: "Israeli Shekel" },
    { code: "SAR", symbol: "﷼", locale: "ar-SA", name: "Saudi Riyal" },
    { code: "AED", symbol: "د.إ", locale: "ar-AE", name: "UAE Dirham" },
    { code: "SGD", symbol: "S$", locale: "en-SG", name: "Singapore Dollar" },
    { code: "HKD", symbol: "HK$", locale: "en-HK", name: "Hong Kong Dollar" },
    { code: "NZD", symbol: "NZ$", locale: "en-NZ", name: "New Zealand Dollar" },
  ];

  // Business info state
  const [businessInfo, setBusinessInfo] = useState({
    name: tenant?.name || "",
    email: tenant?.email || "",
    phone: tenant?.phone || "",
    address: tenant?.address || "",
    website: tenant?.website || "",
    currencyCode: tenant?.currencyCode || "GBP",
    currencySymbol: tenant?.currencySymbol || "£",
    currencyLocale: tenant?.currencyLocale || "en-GB",
  });

  // API keys and integration state
  const [integrations, setIntegrations] = useState({
    // Google Analytics
    ga4MeasurementId: "",
    ga4PropertyId: "",
    ga4Enabled: false,

    // Stripe
    stripeSecretKey: "",
    stripePublicKey: "",
    stripePriceId: "",
    stripeEnabled: false,

    // Resend Email
    resendApiKey: "",
    resendFromDomain: "",
    resendFromName: "",
    resendEnabled: false,

    // Database
    databaseUrl: "",
    databaseEnabled: true,

    // System
    sessionSecret: "",
    port: "5000",
    nodeEnv: "development",

    // Traffic Data Source
    trafficDataSource: "google_analytics"
  });

  // New user state
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "viewer",
  });

  // Team members from API
  const { data: teamMembers, isLoading: isTeamLoading, error: teamError } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Handle business info submit
  const submitBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/tenant', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(businessInfo),
      });

      if (!response.ok) {
        throw new Error('Failed to update business information');
      }

      // Refresh currency context after successful update
      refreshCurrency();

      // Invalidate all sales data queries to trigger refetch with new currency
      queryClient.invalidateQueries({ queryKey: ['sales-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/sales'] });

      toast({
        title: "Business information updated",
        description: "Your business details and currency settings have been successfully saved.",
      });
    } catch (error) {
      console.error('Error updating business info:', error);
      toast({
        title: "Error",
        description: "Failed to update business information. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load environment variables from API
  const { data: envData, isLoading: isEnvLoading } = useQuery({
    queryKey: ['/api/settings/env'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Update integrations when env data is loaded
  useEffect(() => {
    if (envData) {
      setIntegrations({
        ...integrations,
        ...envData
      });
    }
  }, [envData]);

  // Toggle password visibility
  const [showSecrets, setShowSecrets] = useState({
    vercelApiToken: false,
    stripeSecretKey: false,
    stripePublicKey: false,
    resendApiKey: false,
    databaseUrl: false,
    sessionSecret: false
  });

  // Toggle visibility for a specific field
  const toggleVisibility = (field: keyof typeof showSecrets) => {
    setShowSecrets({
      ...showSecrets,
      [field]: !showSecrets[field]
    });
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The value has been copied to your clipboard.",
    });
  };

  // Handle integrations submit
  const submitIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update environment variables/integrations
      const response = await fetch('/api/settings/env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(integrations),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const result = await response.json();

      // Update traffic data source preferences if they've changed
      if (integrations.trafficDataSource) {
        const trafficResponse = await fetch('/api/traffic/analytics/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            source: integrations.trafficDataSource
          }),
        });

        if (!trafficResponse.ok) {
          console.warn('Failed to update traffic preferences, but other settings were saved');
        }
      }

      toast({
        title: "Settings updated",
        description: `Successfully updated: ${result.updated?.join(', ') || 'integration settings'}`,
      });
    } catch (error) {
      console.error('Error updating integration settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update integration settings.",
        variant: "destructive",
      });
    }
  };

  // Test connection function
  const testConnection = async (service: string) => {
    const serviceMap: { [key: string]: string } = {
      'Vercel Analytics': 'vercel',
      'Google Analytics': 'google-analytics',
      'Stripe': 'stripe',
      'MongoDB': 'mongodb',
      'Cloudinary': 'cloudinary',
      'Resend': 'resend'
    };

    const apiService = serviceMap[service] || service.toLowerCase();

    toast({
      title: `Testing ${service} connection`,
      description: "Attempting to connect...",
    });

    try {
      const response = await fetch(`/api/settings/test-connection/${apiService}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Connection successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Connection failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Connection test failed",
        description: "Unable to test connection. Please try again.",
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

  // Test traffic connection
  const testTrafficConnection = async () => {
    toast({
      title: "Testing traffic connection",
      description: "Attempting to connect...",
    });

    try {
      const response = await fetch('/api/settings/test-traffic-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Traffic connection successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Traffic connection failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing traffic connection:', error);
      toast({
        title: "Traffic connection test failed",
        description: "Unable to test traffic connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Clear traffic cache
  const clearTrafficCache = async () => {
    toast({
      title: "Clearing traffic cache",
      description: "Clearing traffic cache...",
    });

    try {
      const response = await fetch('/api/settings/clear-traffic-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to clear traffic cache');
      }

      toast({
        title: "Traffic cache cleared",
        description: "Traffic cache has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing traffic cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear traffic cache. Please try again.",
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
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
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
                    <Label htmlFor="currency-code">Business Currency</Label>
                    <Select
                      value={businessInfo.currencyCode}
                      onValueChange={(value) => {
                        const currency = currencyData.find(c => c.code === value);
                        if (currency) {
                          setBusinessInfo({
                            ...businessInfo,
                            currencyCode: value,
                            currencySymbol: currency.symbol,
                            currencyLocale: currency.locale,
                          });
                        }
                      }}
                    >
                      <SelectTrigger id="currency-code">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyData.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      This currency will be used throughout your dashboard for all monetary displays.
                      Current setting: {businessInfo.currencySymbol} ({businessInfo.currencyCode})
                    </p>
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
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Configuration Settings</AlertTitle>
              <AlertDescription>
                These settings correspond to your environment variables. Changes will be applied to both the database and your .env file.
              </AlertDescription>
            </Alert>

            <form onSubmit={submitIntegrations}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">


                {/* Google Analytics Integration */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <CardTitle>Google Analytics</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="ga4-enabled" className="text-sm">Enabled</Label>
                        <Switch
                          id="ga4-enabled"
                          checked={integrations.ga4Enabled}
                          onCheckedChange={(checked) => setIntegrations({...integrations, ga4Enabled: checked})}
                        />
                      </div>
                    </div>
                    <CardDescription>
                      Connect to Google Analytics 4 to track user behavior and website performance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ga4-measurement-id">Measurement ID (Client-side)</Label>
                      <div className="flex">
                        <Input
                          id="ga4-measurement-id"
                          value={integrations.ga4MeasurementId}
                          onChange={(e) => setIntegrations({...integrations, ga4MeasurementId: e.target.value})}
                          placeholder="G-XXXXXXXXXX"
                          className="rounded-r-none"
                          disabled={!integrations.ga4Enabled}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-l-none"
                          type="button"
                          onClick={() => copyToClipboard(integrations.ga4MeasurementId)}
                          disabled={!integrations.ga4Enabled}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        For website tracking. Get this from Google Analytics → Admin → Property → Data Streams → Web
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ga4-property-id">Property ID (Server-side)</Label>
                      <div className="flex">
                        <Input
                          id="ga4-property-id"
                          value={integrations.ga4PropertyId}
                          onChange={(e) => setIntegrations({...integrations, ga4PropertyId: e.target.value})}
                          placeholder="123456789"
                          className="rounded-r-none"
                          disabled={!integrations.ga4Enabled}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-l-none"
                          type="button"
                          onClick={() => copyToClipboard(integrations.ga4PropertyId)}
                          disabled={!integrations.ga4Enabled}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        For dashboard analytics. Get this from Google Analytics → Admin → Property Settings
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => testConnection('Google Analytics')}
                        disabled={!integrations.ga4Enabled || !integrations.ga4PropertyId}
                        className="w-full"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => window.open('https://analytics.google.com/', '_blank')}
                        disabled={!integrations.ga4Enabled}
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Google Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Traffic Data Source Selection */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle>Traffic Analytics</CardTitle>
                  </div>
                  <CardDescription>
                    Traffic analytics are provided by Google Analytics with pixel tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="traffic-data-source">Analytics Source</Label>
                    <Select
                      value={integrations.trafficDataSource || 'google_analytics'}
                      onValueChange={(value) => setIntegrations({...integrations, trafficDataSource: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select traffic data source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_analytics">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span>Google Analytics</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Google Analytics provides comprehensive traffic analytics with pixel tracking
                    </p>
                  </div>

                  {integrations.ga4Enabled && integrations.ga4MeasurementId && integrations.ga4PropertyId && (
                    <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="text-sm font-medium text-green-700">Google Analytics Fully Configured</div>
                      </div>
                      <p className="text-xs text-green-600">
                        Both client-side tracking and server-side analytics are configured
                      </p>
                    </div>
                  )}

                  {integrations.ga4Enabled && integrations.ga4MeasurementId && !integrations.ga4PropertyId && (
                    <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="text-sm font-medium text-yellow-700">Partial Configuration</div>
                      </div>
                      <p className="text-xs text-yellow-600">
                        Client-side tracking is active, but Property ID is needed for dashboard analytics
                      </p>
                    </div>
                  )}

                  {!integrations.ga4Enabled && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <div className="text-sm font-medium text-gray-700">Google Analytics Disabled</div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Enable Google Analytics above to start tracking traffic data
                      </p>
                    </div>
                  )}


                </CardContent>
              </Card>

              {/* Stripe Integration */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <CardTitle>Stripe</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="stripe-enabled" className="text-sm">Enabled</Label>
                      <Switch
                        id="stripe-enabled"
                        checked={integrations.stripeEnabled}
                        onCheckedChange={(checked) => setIntegrations({...integrations, stripeEnabled: checked})}
                      />
                    </div>
                  </div>
                  <CardDescription>
                    Connect to Stripe for payment processing and subscription management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe-secret-key" className="flex items-center justify-between">
                      <span>Secret Key</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        type="button"
                        onClick={() => toggleVisibility('stripeSecretKey')}
                      >
                        {showSecrets.stripeSecretKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </Label>
                    <div className="flex">
                      <Input
                        id="stripe-secret-key"
                        type={showSecrets.stripeSecretKey ? "text" : "password"}
                        value={integrations.stripeSecretKey}
                        onChange={(e) => setIntegrations({...integrations, stripeSecretKey: e.target.value})}
                        placeholder="sk_test_..."
                        className="rounded-r-none"
                        disabled={!integrations.stripeEnabled}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        type="button"
                        onClick={() => copyToClipboard(integrations.stripeSecretKey)}
                        disabled={!integrations.stripeEnabled}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Used for server-side API calls to Stripe
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe-public-key" className="flex items-center justify-between">
                      <span>Public Key</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        type="button"
                        onClick={() => toggleVisibility('stripePublicKey')}
                      >
                        {showSecrets.stripePublicKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </Label>
                    <div className="flex">
                      <Input
                        id="stripe-public-key"
                        type={showSecrets.stripePublicKey ? "text" : "password"}
                        value={integrations.stripePublicKey}
                        onChange={(e) => setIntegrations({...integrations, stripePublicKey: e.target.value})}
                        placeholder="pk_test_..."
                        className="rounded-r-none"
                        disabled={!integrations.stripeEnabled}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        type="button"
                        onClick={() => copyToClipboard(integrations.stripePublicKey)}
                        disabled={!integrations.stripeEnabled}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Used for client-side Stripe elements
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe-price-id">Price ID (for subscriptions)</Label>
                    <div className="flex">
                      <Input
                        id="stripe-price-id"
                        value={integrations.stripePriceId}
                        onChange={(e) => setIntegrations({...integrations, stripePriceId: e.target.value})}
                        placeholder="price_..."
                        className="rounded-r-none"
                        disabled={!integrations.stripeEnabled}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        type="button"
                        onClick={() => copyToClipboard(integrations.stripePriceId)}
                        disabled={!integrations.stripeEnabled}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      The default subscription price ID
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => testConnection('Stripe')}
                      disabled={!integrations.stripeEnabled}
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resend Email Integration */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <CardTitle>Resend Email</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="resend-enabled" className="text-sm">Enabled</Label>
                      <Switch
                        id="resend-enabled"
                        checked={integrations.resendEnabled}
                        onCheckedChange={(checked) => setIntegrations({...integrations, resendEnabled: checked})}
                      />
                    </div>
                  </div>
                  <CardDescription>
                    Connect to Resend for email sending and management capabilities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resend-api-key" className="flex items-center justify-between">
                      <span>API Key</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        type="button"
                        onClick={() => toggleVisibility('resendApiKey')}
                      >
                        {showSecrets.resendApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </Label>
                    <div className="flex">
                      <Input
                        id="resend-api-key"
                        type={showSecrets.resendApiKey ? "text" : "password"}
                        value={integrations.resendApiKey}
                        onChange={(e) => setIntegrations({...integrations, resendApiKey: e.target.value})}
                        placeholder="re_..."
                        className="rounded-r-none"
                        disabled={!integrations.resendEnabled}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        type="button"
                        onClick={() => copyToClipboard(integrations.resendApiKey)}
                        disabled={!integrations.resendEnabled}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Get this from Resend → API Keys
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resend-from-domain">From Domain</Label>
                    <div className="flex">
                      <Input
                        id="resend-from-domain"
                        value={integrations.resendFromDomain}
                        onChange={(e) => setIntegrations({...integrations, resendFromDomain: e.target.value})}
                        placeholder="your-domain.com"
                        className="rounded-r-none"
                        disabled={!integrations.resendEnabled}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        type="button"
                        onClick={() => copyToClipboard(integrations.resendFromDomain)}
                        disabled={!integrations.resendEnabled}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Domain verified in your Resend account
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resend-from-name">From Name</Label>
                    <div className="flex">
                      <Input
                        id="resend-from-name"
                        value={integrations.resendFromName}
                        onChange={(e) => setIntegrations({...integrations, resendFromName: e.target.value})}
                        placeholder="Your Business Name"
                        className="rounded-r-none"
                        disabled={!integrations.resendEnabled}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        type="button"
                        onClick={() => copyToClipboard(integrations.resendFromName)}
                        disabled={!integrations.resendEnabled}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Display name for outgoing emails
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => testConnection('Resend')}
                      disabled={!integrations.resendEnabled}
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Database Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-primary" />
                      <CardTitle>Database</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="database-enabled" className="text-sm">Enabled</Label>
                      <Switch
                        id="database-enabled"
                        checked={integrations.databaseEnabled}
                        onCheckedChange={(checked) => setIntegrations({...integrations, databaseEnabled: checked})}
                      />
                    </div>
                  </div>
                  <CardDescription>
                    Configure your MongoDB database connection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="database-url" className="flex items-center justify-between">
                      <span>Connection String</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        type="button"
                        onClick={() => toggleVisibility('databaseUrl')}
                      >
                        {showSecrets.databaseUrl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </Label>
                    <div className="flex">
                      <Input
                        id="database-url"
                        type={showSecrets.databaseUrl ? "text" : "password"}
                        value={integrations.databaseUrl}
                        onChange={(e) => setIntegrations({...integrations, databaseUrl: e.target.value})}
                        placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                        className="rounded-r-none"
                        disabled={!integrations.databaseEnabled}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none"
                        type="button"
                        onClick={() => copyToClipboard(integrations.databaseUrl)}
                        disabled={!integrations.databaseEnabled}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      MongoDB connection string in the format: mongodb+srv://username:password@cluster.mongodb.net/database
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => testConnection('MongoDB')}
                      disabled={!integrations.databaseEnabled}
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Server className="h-5 w-5 text-primary" />
                    <CardTitle>System Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Configure system-wide settings for your application.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="session-secret">
                      <AccordionTrigger className="py-3">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span>Session Secret</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="session-secret">Secret Key</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              type="button"
                              onClick={() => toggleVisibility('sessionSecret')}
                            >
                              {showSecrets.sessionSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                          <div className="flex">
                            <Input
                              id="session-secret"
                              type={showSecrets.sessionSecret ? "text" : "password"}
                              value={integrations.sessionSecret}
                              onChange={(e) => setIntegrations({...integrations, sessionSecret: e.target.value})}
                              placeholder="Enter a strong random string"
                              className="rounded-r-none"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-l-none"
                              type="button"
                              onClick={() => copyToClipboard(integrations.sessionSecret)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Used for encrypting session cookies. Should be a long, random string.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              // Generate a random string for session secret
                              const randomSecret = Array(64).fill(0).map(() =>
                                Math.random().toString(36).charAt(2)).join('');
                              setIntegrations({...integrations, sessionSecret: randomSecret});
                              toast({
                                title: "New secret generated",
                                description: "A new random session secret has been generated.",
                              });
                            }}
                            className="mt-2"
                          >
                            Generate New Secret
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="server-config">
                      <AccordionTrigger className="py-3">
                        <div className="flex items-center space-x-2">
                          <SettingsIcon className="h-4 w-4 text-primary" />
                          <span>Server Configuration</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="port">Port</Label>
                            <Input
                              id="port"
                              type="number"
                              value={integrations.port}
                              onChange={(e) => setIntegrations({...integrations, port: e.target.value})}
                              placeholder="5000"
                            />
                            <p className="text-xs text-gray-500">
                              The port on which the server will run (default: 5000)
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="node-env">Node Environment</Label>
                            <Select
                              value={integrations.nodeEnv}
                              onValueChange={(value) => setIntegrations({...integrations, nodeEnv: value})}
                            >
                              <SelectTrigger id="node-env">
                                <SelectValue placeholder="Select environment" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="development">Development</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                                <SelectItem value="test">Test</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                              The environment in which the application will run
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => {
                  // Reset to initial values
                  toast({
                    title: "Settings reset",
                    description: "All settings have been reset to their initial values.",
                  });
                }}>
                  Reset
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save All Settings
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <WebhookSettings />
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
                {isTeamLoading && (
                  <div className="flex items-center justify-center p-6">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    <span className="ml-3 text-gray-600">Loading team members...</span>
                  </div>
                )}

                {teamError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <h3 className="font-medium">Error Loading Team Members</h3>
                        <p className="text-sm">Could not load team members from MongoDB. Please check your database connection.</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isTeamLoading && !teamError && !teamMembers && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <h3 className="font-medium">No Team Data Available</h3>
                        <p className="text-sm">No team members data is available from MongoDB. Please check your database connection.</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isTeamLoading && !teamError && teamMembers && teamMembers.length > 0 && (
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
                      {teamMembers?.filter(member => member && member.id).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback>
                                  {member.name && member.name.length > 0 ? member.name.charAt(0).toUpperCase() : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name || 'Unknown User'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{member.email || 'No email'}</TableCell>
                          <TableCell>{member.role || 'No role'}</TableCell>
                          <TableCell>
                            <Badge variant={member.status === "Active" ? "default" : "outline"}>
                              {member.status || 'Unknown'}
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
                )}

                {!isTeamLoading && !teamError && teamMembers && teamMembers.length === 0 && (
                  <div className="text-center p-6 border rounded-lg bg-gray-50">
                    <UserX className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Team Members</h3>
                    <p className="text-gray-500 mt-1">You haven't added any team members yet.</p>
                  </div>
                )}
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

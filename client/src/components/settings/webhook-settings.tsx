import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Webhook,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  Zap,
  Lock,
  Globe
} from 'lucide-react';

interface WebhookSettings {
  webhookEnabled: boolean;
  webhookEndpoints: {
    orders: boolean;
    notifications: boolean;
    payments: boolean;
  };
  webhookRetryAttempts: number;
  webhookTimeoutMs: number;
  hasWebhookSecret: boolean;
  webhookSecretPreview: string | null;
  webhookUrls: {
    orders: string;
    notifications: string;
    payments: string;
    health: string;
  };
}

export function WebhookSettings() {
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState(false);
  const [isGeneratingSecret, setIsGeneratingSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch webhook settings
  const { data: webhookSettings, isLoading, error, refetch } = useQuery<WebhookSettings>({
    queryKey: ['/api/webhooks/settings'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch webhook secret when needed
  const { data: secretData, refetch: refetchSecret } = useQuery({
    queryKey: ['/api/webhooks/settings/secret'],
    enabled: false, // Only fetch when explicitly requested
  });

  // Update webhook settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<WebhookSettings>) =>
      apiRequest('/api/webhooks/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your webhook settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update webhook settings.',
        variant: 'destructive',
      });
    },
  });

  // Generate new secret mutation
  const generateSecretMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/webhooks/settings/generate-secret', {
        method: 'POST',
      }),
    onSuccess: (data) => {
      toast({
        title: 'Secret generated',
        description: 'A new webhook secret has been generated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks/settings'] });
      setIsGeneratingSecret(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate webhook secret.',
        variant: 'destructive',
      });
      setIsGeneratingSecret(false);
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/webhooks/settings/test', {
        method: 'POST',
      }),
    onSuccess: () => {
      toast({
        title: 'Test successful',
        description: 'Webhook test completed successfully. Check your notifications.',
      });
      setIsTesting(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Test failed',
        description: error.message || 'Webhook test failed.',
        variant: 'destructive',
      });
      setIsTesting(false);
    },
  });

  const handleSettingChange = (key: keyof WebhookSettings, value: any) => {
    if (!webhookSettings) return;

    const updatedSettings = {
      ...webhookSettings,
      [key]: value,
    };

    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleEndpointToggle = (endpoint: keyof WebhookSettings['webhookEndpoints'], enabled: boolean) => {
    if (!webhookSettings) return;

    const updatedEndpoints = {
      ...webhookSettings.webhookEndpoints,
      [endpoint]: enabled,
    };

    updateSettingsMutation.mutate({ webhookEndpoints: updatedEndpoints });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${label} has been copied to your clipboard.`,
    });
  };

  const handleShowSecret = async () => {
    if (!showSecret) {
      await refetchSecret();
    }
    setShowSecret(!showSecret);
  };

  const handleGenerateSecret = () => {
    setIsGeneratingSecret(true);
    generateSecretMutation.mutate();
  };

  const handleTestWebhook = () => {
    setIsTesting(true);
    testWebhookMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading webhook settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !webhookSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load webhook settings. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Webhook Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <CardTitle>Webhook Configuration</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={webhookSettings.webhookEnabled ? "default" : "secondary"}>
                {webhookSettings.webhookEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Configure webhook endpoints to receive real-time notifications from your e-commerce platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Webhooks */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Webhooks</Label>
              <div className="text-sm text-muted-foreground">
                Allow your dashboard to receive webhook notifications
              </div>
            </div>
            <Switch
              checked={webhookSettings.webhookEnabled}
              onCheckedChange={(checked) => handleSettingChange('webhookEnabled', checked)}
            />
          </div>

          {webhookSettings.webhookEnabled && (
            <>
              {/* Webhook Endpoints */}
              <div className="space-y-4">
                <Label className="text-base">Enabled Endpoints</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Orders</div>
                      <div className="text-sm text-muted-foreground">New order notifications</div>
                    </div>
                    <Switch
                      checked={webhookSettings.webhookEndpoints.orders}
                      onCheckedChange={(checked) => handleEndpointToggle('orders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Notifications</div>
                      <div className="text-sm text-muted-foreground">Custom notifications</div>
                    </div>
                    <Switch
                      checked={webhookSettings.webhookEndpoints.notifications}
                      onCheckedChange={(checked) => handleEndpointToggle('notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Payments</div>
                      <div className="text-sm text-muted-foreground">Payment confirmations</div>
                    </div>
                    <Switch
                      checked={webhookSettings.webhookEndpoints.payments}
                      onCheckedChange={(checked) => handleEndpointToggle('payments', checked)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      {webhookSettings.webhookEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>
              Secure your webhooks with signing secrets to verify request authenticity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Webhook Secret */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Webhook Signing Secret</Label>
                <div className="flex items-center gap-2">
                  {webhookSettings.hasWebhookSecret ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Lock className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Set
                    </Badge>
                  )}
                </div>
              </div>

              {webhookSettings.hasWebhookSecret ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={showSecret ? secretData?.secret || '' : webhookSettings.webhookSecretPreview || '••••••••'}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowSecret}
                      disabled={!webhookSettings.hasWebhookSecret}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(secretData?.secret || '', 'Webhook secret')}
                      disabled={!showSecret || !secretData?.secret}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSecret}
                      disabled={isGeneratingSecret}
                    >
                      {isGeneratingSecret ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Generate New Secret
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Security Recommendation</AlertTitle>
                    <AlertDescription>
                      Generate a webhook secret to verify that webhook requests are coming from your trusted sources.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleGenerateSecret}
                    disabled={isGeneratingSecret}
                    className="w-full"
                  >
                    {isGeneratingSecret ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Generate Webhook Secret
                  </Button>
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <Accordion type="single" collapsible>
              <AccordionItem value="advanced">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Advanced Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="retry-attempts">Retry Attempts</Label>
                      <Select
                        value={webhookSettings.webhookRetryAttempts.toString()}
                        onValueChange={(value) => handleSettingChange('webhookRetryAttempts', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 attempt</SelectItem>
                          <SelectItem value="2">2 attempts</SelectItem>
                          <SelectItem value="3">3 attempts</SelectItem>
                          <SelectItem value="5">5 attempts</SelectItem>
                          <SelectItem value="10">10 attempts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (seconds)</Label>
                      <Select
                        value={(webhookSettings.webhookTimeoutMs / 1000).toString()}
                        onValueChange={(value) => handleSettingChange('webhookTimeoutMs', parseInt(value) * 1000)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="120">120 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Webhook URLs */}
      {webhookSettings.webhookEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Webhook URLs</CardTitle>
            </div>
            <CardDescription>
              Use these URLs in your e-commerce platform or external systems to send webhook notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(webhookSettings.webhookUrls).map(([endpoint, url]) => (
              <div key={endpoint} className="space-y-2">
                <Label className="capitalize">{endpoint} Webhook</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(url, `${endpoint} webhook URL`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                    disabled={endpoint !== 'health'}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Test Webhook */}
      {webhookSettings.webhookEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Test Configuration</CardTitle>
            </div>
            <CardDescription>
              Send a test notification to verify your webhook configuration is working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTestWebhook}
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Send Test Notification
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
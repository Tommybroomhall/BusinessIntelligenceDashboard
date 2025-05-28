import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useTenant } from "@/context/tenant-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { setTenant } = useTenant();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);

  // Form definition
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@businessdash.com",
      password: "password123",
    },
  });

  // Submit handler
  const onSubmit = async (data: LoginFormValues) => {
    try {
      if (activeTab === "login") {
        setIsLoading(true);
        console.log("Submitting login form:", data.email);
        
        // Real login with API call
        const response = await login(data.email, data.password);
        console.log("Login response received:", response);

        // Set tenant data from the response
        if (response && response.tenant) {
          setTenant(response.tenant);
        }

        toast({
          title: "Login successful",
          description: "Welcome to your dashboard",
        });

        // Use a timeout to ensure the auth state is updated before navigation
        setTimeout(() => {
          console.log("Navigating to dashboard...");
          navigate("/");
          setIsLoading(false);
        }, 300);
      } else {
        // Register logic - in a real app, this would call a registration API
        toast({
          title: "Registration not implemented",
          description: "Please use the login tab with admin@businessdash.com / password123",
          variant: "destructive",
        });

        setActiveTab("login");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Login error in component:", error);
      toast({
        title: "Authentication failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center text-white text-2xl font-semibold">
              B
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome to BusinessDash</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-right text-sm">
                    <a href="#" className="text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="register">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M17.21 12c0-4.28-4.23-7.76-9.42-7.76a9.78 9.78 0 0 0-3.83.77" />
                <path d="M12 12h.01" />
                <path d="M16 12h.01" />
                <path d="M20 12h.01" />
                <path d="M2 17.7l2.28-1.9a9.5 9.5 0 0 0 2.7-5.2" />
              </svg>
              Google
            </Button>
            <Button variant="outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                <path d="M18 7 M9 12h6" />
                <path d="m11 9 3 3-3 3" />
              </svg>
              GitHub
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

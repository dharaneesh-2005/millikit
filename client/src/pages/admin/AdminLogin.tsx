import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/LOGO-removebg-preview.png";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Lock, User, KeyRound } from "lucide-react";

// Login Schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// OTP Schema
const otpSchema = z.object({
  token: z.string().min(6, "OTP code must be 6 digits").max(6, "OTP code must be 6 digits"),
});

// Setup Schema
const setupSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Define form types
type LoginFormValues = z.infer<typeof loginSchema>;
type OTPFormValues = z.infer<typeof otpSchema>;
type SetupFormValues = z.infer<typeof setupSchema>;

export default function AdminLogin() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Login states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  
  // Setup states
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [otpSecret, setOtpSecret] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Setup the login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Setup the OTP form
  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      token: "",
    },
  });
  
  // Setup the setup form
  const setupForm = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle login submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      const response = await apiRequest("POST", "/api/admin/login", data);
      const result = await response.json();
      
      if (result.otpRequired) {
        // User has OTP enabled, show OTP form
        setUserId(result.userId);
        setShowOtpForm(true);
        toast({
          title: "OTP Required",
          description: "Please enter your Google Authenticator code",
        });
      } else if (result.success) {
        // No OTP required, directly log in
        toast({
          title: "Login successful",
          description: "Welcome to admin dashboard",
        });
        navigate("/admin");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle OTP submission
  const onOtpSubmit = async (data: OTPFormValues) => {
    if (!userId) return;
    
    setIsLoggingIn(true);
    try {
      const response = await apiRequest("POST", "/api/admin/verify-otp", {
        userId,
        token: data.token,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Login successful",
          description: "Welcome to admin dashboard",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid or expired OTP code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification failed",
        description: "An error occurred during OTP verification",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle setup submission
  const onSetupSubmit = async (data: SetupFormValues) => {
    setIsSettingUp(true);
    try {
      // Step 1: Register the admin user
      const registerResponse = await apiRequest("POST", "/api/admin/register", {
        username: data.username,
        password: data.password,
      });
      
      const registerResult = await registerResponse.json();
      
      if (registerResult.success) {
        // Step 2: Generate OTP secret and QR code
        const setupResponse = await apiRequest("POST", "/api/admin/setup-otp", {
          userId: registerResult.userId,
        });
        
        const setupResult = await setupResponse.json();
        
        if (setupResult.success) {
          setUserId(registerResult.userId);
          setQrCodeUrl(setupResult.qrCodeUrl);
          setOtpSecret(setupResult.secret);
          
          toast({
            title: "Setup initialized",
            description: "Scan the QR code with Google Authenticator",
          });
        } else {
          throw new Error("Failed to setup OTP");
        }
      } else {
        throw new Error(registerResult.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Setup error:", error);
      toast({
        title: "Setup failed",
        description: error.message || "An error occurred during setup",
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };
  
  // Handle OTP verification after setup
  const onSetupVerifySubmit = async (data: OTPFormValues) => {
    if (!userId || !otpSecret) return;
    
    setIsSettingUp(true);
    try {
      const response = await apiRequest("POST", "/api/admin/verify-setup", {
        userId,
        token: data.token,
        secret: otpSecret,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Setup complete",
          description: "You can now log in with Google Authenticator",
        });
        setActiveTab("login");
        setOtpSecret(null);
        setQrCodeUrl(null);
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid OTP code. Try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Setup verification error:", error);
      toast({
        title: "Verification failed",
        description: "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.img
            src={logoPath}
            alt="Millikit Logo"
            className="h-20 mx-auto mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.h1 
            className="text-3xl font-bold text-green-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Admin Portal
          </motion.h1>
        </div>
        
        <Card className="shadow-lg border-green-100">
          <CardHeader className="bg-green-700 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center">
              <Lock className="mr-2" />
              Secure Admin Access
            </CardTitle>
            <CardDescription className="text-green-100">
              Login with your admin credentials and Google Authenticator
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="setup">First-Time Setup</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                {!showOtpForm ? (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input 
                                  placeholder="Enter your username" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                  type="password"
                                  placeholder="Enter your password"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800">Verification Required</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                          Please enter the 6-digit code from your Google Authenticator app
                        </AlertDescription>
                      </Alert>
                      
                      <FormField
                        control={otpForm.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Authentication Code</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                  placeholder="Enter 6-digit code"
                                  className="pl-10 text-center tracking-widest text-lg"
                                  maxLength={6}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowOtpForm(false)}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={isLoggingIn}
                        >
                          {isLoggingIn ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>
              
              <TabsContent value="setup" className="mt-0">
                {!qrCodeUrl ? (
                  <Form {...setupForm}>
                    <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-200 mb-4">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">First-time setup</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          Set up your admin account with Google Authenticator for secure access
                        </AlertDescription>
                      </Alert>
                      
                      <FormField
                        control={setupForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Choose Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input 
                                  placeholder="Admin username" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={setupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Choose Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                  type="password"
                                  placeholder="Secure password"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={setupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                  type="password"
                                  placeholder="Confirm password"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSettingUp}
                      >
                        {isSettingUp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Setting up...
                          </>
                        ) : (
                          "Continue to Setup"
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    <Alert className="bg-green-50 border-green-200">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Scan QR Code</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Scan this QR code with the Google Authenticator app on your phone
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
                      <div className="mb-4">
                        <img
                          src={qrCodeUrl}
                          alt="Google Authenticator QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-500 mb-1">Can't scan the QR code?</p>
                        <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                          {otpSecret}
                        </p>
                      </div>
                    </div>
                    
                    <Form {...otpForm}>
                      <form onSubmit={otpForm.handleSubmit(onSetupVerifySubmit)} className="space-y-4">
                        <FormField
                          control={otpForm.control}
                          name="token"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Verification Code</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                  <Input
                                    placeholder="Enter the 6-digit code"
                                    className="pl-10 text-center tracking-widest text-lg"
                                    maxLength={6}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setQrCodeUrl(null);
                              setOtpSecret(null);
                            }}
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSettingUp}
                          >
                            {isSettingUp ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              "Complete Setup"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t p-4">
            <Button variant="link" onClick={() => navigate("/")}>
              Return to Millikit Store
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { useTenant } from '@/context/tenant-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Building,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch detailed user profile
  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery<UserProfile>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      return data.user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch(`/api/users/${user?.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'viewer':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-red-500">
          <p>Error loading profile</p>
          <p className="text-sm">{profileError instanceof Error ? profileError.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const profile = userProfile || user;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile?.name ? getInitials(profile.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{profile?.name || 'Unknown User'}</CardTitle>
            <CardDescription>{profile?.email || 'No email'}</CardDescription>
            <div className="flex justify-center mt-2">
              <Badge variant="outline" className={getRoleColor(profile?.role || 'viewer')}>
                {profile?.role || 'viewer'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              <span>{tenant?.name || 'Unknown Organization'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Member since {profile?.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>
                Status: {profile?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="general" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <p className="text-sm text-gray-500">Update your personal details</p>
                  </div>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setProfileForm({
                          name: profile?.name || '',
                          email: profile?.email || ''
                        });
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingProfile(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Full Name</p>
                        <p className="text-sm text-gray-600">{profile?.name || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Email Address</p>
                        <p className="text-sm text-gray-600">{profile?.email || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Password</h3>
                    <p className="text-sm text-gray-500">Change your account password</p>
                  </div>
                  {!isChangingPassword && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  )}
                </div>

                {isChangingPassword ? (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Password</p>
                        <p className="text-sm text-gray-600">••••••••</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

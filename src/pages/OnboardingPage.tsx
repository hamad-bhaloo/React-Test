
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanySetup } from '@/hooks/useCompanySetup';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { markCompanyAsCreated } = useCompanySetup();
  const { isAdmin } = useUserRole();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Form data
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    website: '',
    tax_id: '',
    logo_url: '',
    industry: '',
    description: ''
  });

  const totalSteps = 3;
  const progressPercentage = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Insert company into Supabase
      const { error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          user_id: user.id
        });

      if (companyError) throw companyError;

      // Send welcome email
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            userId: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || companyData.name
          }
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail onboarding if email fails
      }

      // Optimistically update state/UI
      markCompanyAsCreated();
      toast.success('Welcome! Your company profile has been created.');

      // Add a flag to localStorage to trigger confetti on dashboard
      localStorage.setItem('showOnboardingConfetti', 'true');

      // Force a page reload to fully rehydrate session + state
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

      // Alternatively, use React Router + force reload:
      // setTimeout(() => navigate('/', { replace: true }), 500);

    } catch (error: any) {
      console.error('Error creating company profile:', error);
      setError(error.message || 'Failed to create company profile');
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyData = (field: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header with back/logout options */}
        <div className="flex justify-between items-start">
          <Button
            variant="ghost"
            onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={signOut}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>

        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">X</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome to X Invoice</h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's set up your company profile to get started
          </p>
        </div>

        <div className="space-y-6">
          <Progress value={progressPercentage} className="w-full" />

          <Card>
            <CardHeader>
              <CardTitle>Step {step} of {totalSteps}</CardTitle>
              <CardDescription>
                {step === 1 && "Basic Company Information"}
                {step === 2 && "Contact & Address Details"}
                {step === 3 && "Additional Information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      value={companyData.name}
                      onChange={(e) => updateCompanyData('name', e.target.value)}
                      placeholder="Enter your company name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Company Email *</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => updateCompanyData('email', e.target.value)}
                      placeholder="company@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone Number</Label>
                    <Input
                      id="company-phone"
                      value={companyData.phone}
                      onChange={(e) => updateCompanyData('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company-address">Address</Label>
                    <Input
                      id="company-address"
                      value={companyData.address}
                      onChange={(e) => updateCompanyData('address', e.target.value)}
                      placeholder="123 Business St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-city">City</Label>
                      <Input
                        id="company-city"
                        value={companyData.city}
                        onChange={(e) => updateCompanyData('city', e.target.value)}
                        placeholder="New York"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-state">State/Province</Label>
                      <Input
                        id="company-state"
                        value={companyData.state}
                        onChange={(e) => updateCompanyData('state', e.target.value)}
                        placeholder="NY"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-zip">ZIP/Postal Code</Label>
                      <Input
                        id="company-zip"
                        value={companyData.zip_code}
                        onChange={(e) => updateCompanyData('zip_code', e.target.value)}
                        placeholder="10001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-country">Country</Label>
                      <Input
                        id="company-country"
                        value={companyData.country}
                        onChange={(e) => updateCompanyData('country', e.target.value)}
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      value={companyData.website}
                      onChange={(e) => updateCompanyData('website', e.target.value)}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-tax-id">Tax ID/Registration Number</Label>
                    <Input
                      id="company-tax-id"
                      value={companyData.tax_id}
                      onChange={(e) => updateCompanyData('tax_id', e.target.value)}
                      placeholder="12-3456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-industry">Industry</Label>
                    <Select onValueChange={(value) => updateCompanyData('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-description">Company Description</Label>
                    <Textarea
                      id="company-description"
                      value={companyData.description}
                      onChange={(e) => updateCompanyData('description', e.target.value)}
                      placeholder="Brief description of your company and services..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={step === 1}
                >
                  Previous
                </Button>

                {step < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={step === 1 && (!companyData.name || !companyData.email)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !companyData.name || !companyData.email}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Setup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

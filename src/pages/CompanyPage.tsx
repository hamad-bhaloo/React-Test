import { Building2, Upload, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCompanySetup } from "@/hooks/useCompanySetup";
import { useSubscription } from "@/hooks/useSubscription";
import TeamMembersModal from "@/components/team/TeamMembersModal";

const CompanyPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { refetch: refetchCompanySetup } = useCompanySetup();
  const { subscribed } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    tax_id: '',
    registration_number: '',
    logo_url: ''
  });

  const { data: company, isLoading, refetch } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching company');
        return null;
      }
      
      console.log('Fetching company for user:', user.id);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching company:', error);
        throw error;
      }
      
      console.log('Company data fetched:', data);
      return data;
    },
    enabled: !!user,
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: any) => {
      if (!user) throw new Error('User not authenticated');

      console.log('Creating company with data:', companyData);

      // Validate required fields
      if (!companyData.name || companyData.name.trim() === '') {
        throw new Error('Company name is required');
      }

      const { data, error } = await supabase
        .from('companies')
        .insert({ 
          ...companyData, 
          user_id: user.id,
          name: companyData.name.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      console.log('Company created successfully:', data);
      return data;
    },
    onSuccess: async (data) => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['company', user?.id] });
      await queryClient.refetchQueries({ queryKey: ['company', user?.id] });
      
      // Refetch company setup hook
      await refetchCompanySetup();
      
      toast.success('Company created successfully!');
      setShowCreateForm(false);
      setIsEditing(false);
      
      // Force a refetch to ensure we get the latest data
      refetch();
    },
    onError: (error: any) => {
      console.error('Error creating company:', error);
      toast.error(error.message || 'Failed to create company. Please try again.');
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (companyData: any) => {
      if (!user || !company) throw new Error('User not authenticated or company not found');

      console.log('Updating company with data:', companyData);

      // Validate required fields
      if (!companyData.name || companyData.name.trim() === '') {
        throw new Error('Company name is required');
      }

      const { data, error } = await supabase
        .from('companies')
        .update({
          ...companyData,
          name: companyData.name.trim()
        })
        .eq('id', company.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company:', error);
        throw error;
      }

      console.log('Company updated successfully:', data);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['company', user?.id] });
      await refetchCompanySetup();
      toast.success('Company details updated successfully!');
      setIsEditing(false);
      refetch();
    },
    onError: (error: any) => {
      console.error('Error updating company:', error);
      toast.error(error.message || 'Failed to update company details. Please try again.');
    },
  });

  // Update form data when company data is loaded
  useEffect(() => {
    if (company) {
      console.log('Setting form data from company:', company);
      setFormData({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zip_code: company.zip_code || '',
        country: company.country || '',
        tax_id: company.tax_id || '',
        registration_number: company.registration_number || '',
        logo_url: company.logo_url || ''
      });
      setShowCreateForm(false);
      setIsEditing(false);
    } else if (!isLoading && user && !company) {
      // Only show create form if we're not loading, have a user, but no company
      console.log('No company found, showing create form');
      setShowCreateForm(true);
      setIsEditing(false);
    }
  }, [company, isLoading, user]);

  const handleSave = async () => {
    console.log('Saving company data:', formData);
    updateCompanyMutation.mutate(formData);
  };

  const handleCreate = async () => {
    console.log('Creating company data:', formData);
    createCompanyMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zip_code: company.zip_code || '',
        country: company.country || '',
        tax_id: company.tax_id || '',
        registration_number: company.registration_number || '',
        logo_url: company.logo_url || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        tax_id: '',
        registration_number: '',
        logo_url: ''
      });
    }
    setIsEditing(false);
    setShowCreateForm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('Form field changed:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Delete old logo if exists
      if (formData.logo_url) {
        const oldFileName = formData.logo_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('company-assets')
            .remove([`logos/${oldFileName}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        logo_url: publicUrl
      }));

      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show create form if no company exists
  if (!company && !showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="bg-orange-500 text-white px-6 py-4 rounded-t-xl">
            <h2 className="text-lg font-semibold">Company Setup</h2>
          </div>
          
          <div className="p-8 text-center">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Company Found</h3>
            <p className="text-gray-600 mb-6">
              To get started with invoicing, you need to set up your company details first. 
              This information will appear on your invoices and help identify your business.
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus size={16} className="mr-2" />
              Set Up Company Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isCreating = showCreateForm && !company;
  const canEdit = isEditing || isCreating;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-orange-500 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-lg font-semibold">
            {isCreating ? 'Set Up Company Details' : 'Company Details'}
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Form fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    required
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="company@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Company Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address (Line 1)</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="123 Business St"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tax_id">Tax Identification Number</Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="Tax ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="NY"
                  />
                </div>
                
                <div>
                  <Label htmlFor="zip_code">Postal Code</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="12345"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="United States"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="New York"
                  />
                </div>
                
                <div>
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="mt-1"
                    placeholder="Registration #"
                  />
                </div>
              </div>
            </div>
            
            {/* Right side - Logo upload */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4 bg-gray-50">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Company Logo" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Building2 size={48} className="text-gray-400" />
                )}
              </div>
              
              {canEdit && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploadingLogo}
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button 
                      type="button"
                      variant="outline"
                      className="bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100"
                      asChild
                      disabled={uploadingLogo}
                    >
                      <span>
                        <Upload size={16} className="mr-2" />
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            {isCreating ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleCreate}
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={createCompanyMutation.isPending || !formData.name.trim()}
                >
                  {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                </Button>
              </>
            ) : isEditing ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleSave}
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={updateCompanyMutation.isPending || !formData.name.trim()}
                >
                  {updateCompanyMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <div className="flex gap-3">
                <Button 
                  type="button"
                  onClick={() => setShowTeamModal(true)}
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  disabled={!company?.id || typeof company.id !== 'string' || company.id.trim() === ''}
                >
                  <Users size={16} className="mr-2" />
                  {!company?.id ? 'Loading...' : 'Team Members'}
                </Button>
                <Button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Edit Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Members Modal */}
      {company && company.id && typeof company.id === 'string' && company.id.trim() !== '' && (
        <TeamMembersModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          companyId={company.id}
        />
      )}
    </div>
  );
};

export default CompanyPage;

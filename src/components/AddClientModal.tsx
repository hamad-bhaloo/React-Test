
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Building2, User, Calendar, MapPin, Phone, Mail, Globe, Briefcase, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AIClientGenerator from "@/components/ai/AIClientGenerator";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddClientModal = ({ isOpen, onClose }: AddClientModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { refreshUsage } = useSubscription();
  const [clientType, setClientType] = useState<'individual' | 'organizational'>('individual');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    status: 'active',
    notes: '',
    
    // Individual fields
    first_name: '',
    last_name: '',
    job_title: '',
    date_of_birth: '',
    gender: '',
    linkedin_profile: '',
    twitter_profile: '',
    facebook_profile: '',
    instagram_profile: '',
    
    // Organizational fields
    name: '',
    company: '',
    website: '',
    tax_number: '',
    registration_number: '',
    industry: '',
    contact_person: '',
    contact_person_email: '',
    contact_person_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate required fields
    if (clientType === 'individual') {
      if (!formData.first_name || !formData.last_name) {
        toast.error('Please fill in all required fields: First Name and Last Name');
        return;
      }
    } else {
      if (!formData.name) {
        toast.error('Please fill in the required field: Company Name');
        return;
      }
    }

    try {
      // Prepare data for submission, handling empty dates
      const dataToSubmit = {
        ...formData,
        client_type: clientType,
        user_id: user.id,
        // Convert empty date strings to null
        date_of_birth: formData.date_of_birth || null,
      };

      const { error } = await supabase
        .from('clients')
        .insert([dataToSubmit]);

      if (error) throw error;

      // Invalidate queries and refresh usage counts
      queryClient.invalidateQueries({ queryKey: ['clients', user.id] });
      
      // Refresh usage counts after successful creation
      setTimeout(() => {
        refreshUsage();
      }, 500); // Small delay to ensure the client is fully created
      
      // Reset form
      setFormData({
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        status: 'active',
        notes: '',
        first_name: '',
        last_name: '',
        job_title: '',
        date_of_birth: '',
        gender: '',
        linkedin_profile: '',
        twitter_profile: '',
        facebook_profile: '',
        instagram_profile: '',
        name: '',
        company: '',
        website: '',
        tax_number: '',
        registration_number: '',
        industry: '',
        contact_person: '',
        contact_person_email: '',
        contact_person_phone: ''
      });
      setClientType('individual');
      
      toast.success('Client added successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAIGenerated = (clientData: any) => {
    // Update form data with AI generated data
    setFormData(prev => ({
      ...prev,
      ...clientData
    }));
    
    // Set client type based on AI generated data
    if (clientData.client_type) {
      setClientType(clientData.client_type);
    }
    
    // Close AI generator
    setShowAIGenerator(false);
    
    toast.success('Client data populated from AI! Review and save.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Generator Toggle */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div>
              <h3 className="font-semibold text-gray-900">Speed up with AI</h3>
              <p className="text-sm text-gray-600">Describe your client and let AI fill the form</p>
            </div>
            <Button
              type="button"
              variant={showAIGenerator ? "secondary" : "default"}
              onClick={() => setShowAIGenerator(!showAIGenerator)}
              className="flex items-center gap-2"
            >
              <Sparkles size={16} />
              {showAIGenerator ? 'Hide AI' : 'Use AI'}
            </Button>
          </div>

          {/* AI Generator Section */}
          {showAIGenerator && (
            <AIClientGenerator 
              onClientGenerated={handleAIGenerated}
              initialPrompt=""
            />
          )}

          {/* Client Type Selection */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <Button
              type="button"
              variant={clientType === 'individual' ? 'default' : 'outline'}
              onClick={() => setClientType('individual')}
              className={`flex-1 ${clientType === 'individual' ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
            >
              <User size={20} className="mr-2" />
              Individual Client
            </Button>
            <Button
              type="button"
              variant={clientType === 'organizational' ? 'default' : 'outline'}
              onClick={() => setClientType('organizational')}
              className={`flex-1 ${clientType === 'organizational' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
            >
              <Building2 size={20} className="mr-2" />
              Organizational Client
            </Button>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="contact">Contact & Address</TabsTrigger>
              <TabsTrigger value="additional">Additional Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {clientType === 'individual' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="flex items-center gap-2">
                      <User size={16} />
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="job_title" className="flex items-center gap-2">
                      <Briefcase size={16} />
                      Job Title
                    </Label>
                    <Input
                      id="job_title"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                      <Calendar size={16} />
                      Date of Birth
                    </Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <Building2 size={16} />
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact_person_email">Contact Person Email</Label>
                    <Input
                      id="contact_person_email"
                      name="contact_person_email"
                      type="email"
                      value={formData.contact_person_email}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact_person_phone">Contact Person Phone</Label>
                    <Input
                      id="contact_person_phone"
                      name="contact_person_phone"
                      value={formData.contact_person_phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe size={16} />
                      Website
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone size={16} />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin size={16} />
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="zip_code">Zip Code</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              {clientType === 'individual' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
                    <Input
                      id="linkedin_profile"
                      name="linkedin_profile"
                      value={formData.linkedin_profile}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="twitter_profile">Twitter Profile</Label>
                    <Input
                      id="twitter_profile"
                      name="twitter_profile"
                      value={formData.twitter_profile}
                      onChange={handleChange}
                      placeholder="https://twitter.com/username"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="facebook_profile">Facebook Profile</Label>
                    <Input
                      id="facebook_profile"
                      name="facebook_profile"
                      value={formData.facebook_profile}
                      onChange={handleChange}
                      placeholder="https://facebook.com/username"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="instagram_profile">Instagram Profile</Label>
                    <Input
                      id="instagram_profile"
                      name="instagram_profile"
                      value={formData.instagram_profile}
                      onChange={handleChange}
                      placeholder="https://instagram.com/username"
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_number">Tax Number</Label>
                    <Input
                      id="tax_number"
                      name="tax_number"
                      value={formData.tax_number}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Additional notes about this client..."
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              Add Client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientModal;

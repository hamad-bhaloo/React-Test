
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, MapPin, Phone, Mail, Building2, Edit, User, Calendar, Globe, Briefcase, Hash, FileText, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { useState } from "react";
import EditClientModal from "@/components/EditClientModal";

interface ViewClientModalProps {
  client: any;
  isOpen: boolean;
  onClose: () => void;
}

const ViewClientModal = ({ client, isOpen, onClose }: ViewClientModalProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!client) return null;

  const getClientDisplayName = () => {
    if (client.client_type === 'individual') {
      return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A';
    }
    return client.name || client.company || 'N/A';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  client.client_type === 'organizational' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {client.client_type === 'organizational' ? (
                    <Building2 size={32} className="text-blue-600" />
                  ) : (
                    <User size={32} className="text-purple-600" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {getClientDisplayName()}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={client.client_type === 'organizational' ? 'default' : 'secondary'}>
                      {client.client_type === 'organizational' ? 'Organization' : 'Individual'}
                    </Badge>
                    <Badge variant={client.status === 'active' ? 'default' : 'destructive'}>
                      {client.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setIsEditModalOpen(true)}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Edit size={16} className="mr-2" />
                Edit Client
              </Button>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  {client.client_type === 'individual' ? (
                    <>
                      <InfoItem icon={User} label="Full Name" value={getClientDisplayName()} />
                      <InfoItem icon={Briefcase} label="Job Title" value={client.job_title} />
                      <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(client.date_of_birth)} />
                      <InfoItem icon={User} label="Gender" value={client.gender} />
                    </>
                  ) : (
                    <>
                      <InfoItem icon={Building2} label="Company Name" value={client.name || client.company} />
                      <InfoItem icon={Briefcase} label="Industry" value={client.industry} />
                      <InfoItem icon={User} label="Contact Person" value={client.contact_person} />
                      <InfoItem icon={Mail} label="Contact Email" value={client.contact_person_email} />
                      <InfoItem icon={Phone} label="Contact Phone" value={client.contact_person_phone} />
                      <InfoItem icon={Globe} label="Website" value={client.website} />
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <InfoItem icon={Mail} label="Email" value={client.email} />
                  <InfoItem icon={Phone} label="Phone" value={client.phone} />
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-gray-900 font-medium">Address</p>
                    <p className="text-gray-600">
                      {client.address ? (
                        <>
                          {client.address}<br />
                          {client.city && `${client.city}, `}
                          {client.state && `${client.state} `}
                          {client.zip_code}<br />
                          {client.country}
                        </>
                      ) : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              {client.client_type === 'organizational' && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Information</h3>
                    <div className="space-y-3">
                      <InfoItem icon={Hash} label="Tax Number" value={client.tax_number} />
                      <InfoItem icon={FileText} label="Registration Number" value={client.registration_number} />
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {client.client_type === 'individual' && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Profiles</h3>
                    <div className="space-y-3">
                      <SocialLink icon={Linkedin} label="LinkedIn" url={client.linkedin_profile} />
                      <SocialLink icon={Twitter} label="Twitter" url={client.twitter_profile} />
                      <SocialLink icon={Facebook} label="Facebook" url={client.facebook_profile} />
                      <SocialLink icon={Instagram} label="Instagram" url={client.instagram_profile} />
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client History</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Created:</span> {formatDate(client.created_at)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Last Updated:</span> {formatDate(client.updated_at)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  <p className="text-gray-600">
                    {client.notes || 'No notes available'}
                  </p>
                </div>
              </div>

              {/* Invoice History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-center">No invoices found for this client</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditClientModal 
        client={client}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | null | undefined }) => (
  <div className="flex items-center space-x-3">
    <Icon className="text-gray-400" size={20} />
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-gray-600">{value || 'Not provided'}</p>
    </div>
  </div>
);

const SocialLink = ({ icon: Icon, label, url }: { icon: any, label: string, url: string | null | undefined }) => (
  <div className="flex items-center space-x-3">
    <Icon className="text-gray-400" size={20} />
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      {url ? (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-orange-600 hover:text-orange-700 text-sm"
        >
          {url}
        </a>
      ) : (
        <p className="text-gray-600 text-sm">Not provided</p>
      )}
    </div>
  </div>
);

export default ViewClientModal;

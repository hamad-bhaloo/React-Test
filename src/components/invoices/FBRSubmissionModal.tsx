import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FBRSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSubmissionSuccess?: () => void;
}

export const FBRSubmissionModal: React.FC<FBRSubmissionModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmissionSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Check if invoice was already submitted to FBR
  const fbrSubmission = invoice?.status_history?.find((h: any) => h.status === 'submitted_to_fbr');

  const submitToFBR = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('fbr-submit-invoice', {
        body: { invoiceId: invoice.id }
      });

      if (error) throw error;

      setSubmissionResult(data);
      toast.success('Invoice submitted to FBR successfully');
      onSubmissionSuccess?.();
      
    } catch (error: any) {
      console.error('FBR submission error:', error);
      toast.error(error.message || 'Failed to submit invoice to FBR');
      setSubmissionResult({ error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>FBR Submission</span>
          </DialogTitle>
          <DialogDescription>
            Submit invoice {invoice?.invoice_number} to Federal Board of Revenue (FBR)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Invoice Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Invoice #:</span>
                <span className="font-medium ml-2">{invoice?.invoice_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium ml-2">{invoice?.currency} {invoice?.total_amount}</span>
              </div>
              <div>
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium ml-2">{invoice?.issue_date}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="font-medium ml-2 capitalize">{invoice?.status}</span>
              </div>
            </div>
          </div>

          {/* Current FBR Status */}
          {fbrSubmission && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>Already submitted to FBR</span>
                  {getStatusBadge(fbrSubmission.fbr_status)}
                </div>
                {fbrSubmission.fbr_reference && (
                  <div className="mt-2 text-sm text-gray-600">
                    Reference: {fbrSubmission.fbr_reference}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  Submitted: {new Date(fbrSubmission.changed_at).toLocaleDateString()}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Submission Result */}
          {submissionResult && (
            <Alert className={submissionResult.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              {getStatusIcon(submissionResult.error ? 'error' : 'submitted')}
              <AlertDescription>
                {submissionResult.error ? (
                  <div>
                    <div className="font-medium text-red-800">Submission Failed</div>
                    <div className="text-red-700 text-sm mt-1">{submissionResult.error}</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-green-800">Submission Successful</div>
                    <div className="text-green-700 text-sm mt-1">
                      FBR Reference: {submissionResult.fbr_reference}
                    </div>
                    <div className="text-green-600 text-xs mt-1">
                      Status: {submissionResult.fbr_status}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Requirements */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-2">FBR Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-blue-600" />
                <span>Valid company registration</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-blue-600" />
                <span>Complete client information</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-blue-600" />
                <span>Accurate tax calculations</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-blue-600" />
                <span>Digital signature compliance</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={submitToFBR}
              disabled={isSubmitting || fbrSubmission}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : fbrSubmission ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Submitted
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Submit to FBR
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
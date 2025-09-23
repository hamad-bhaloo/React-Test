import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Mail, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const sendQuotationSchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().optional(),
});

type SendQuotationFormData = z.infer<typeof sendQuotationSchema>;

interface SendQuotationModalProps {
  quotation: any;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

const SendQuotationModal = ({ quotation, children, onSuccess }: SendQuotationModalProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientName = quotation?.clients?.name || 
                    `${quotation?.clients?.first_name || ''} ${quotation?.clients?.last_name || ''}`.trim() ||
                    quotation?.clients?.company || 
                    'Client';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendQuotationFormData>({
    resolver: zodResolver(sendQuotationSchema),
    defaultValues: {
      recipientEmail: quotation?.clients?.email || '',
      subject: `Quotation ${quotation?.quotation_number} from ${quotation?.companies?.name || 'Our Company'}`,
      message: `Dear ${clientName},\n\nPlease find attached our quotation ${quotation?.quotation_number}. We look forward to hearing from you.\n\nBest regards,`,
    },
  });

  const onSubmit = async (data: SendQuotationFormData) => {
    setIsSubmitting(true);

    try {
      const { data: response, error } = await supabase.functions.invoke('send-quotation-email', {
        body: {
          quotationId: quotation.id,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          message: data.message,
          includeAttachments: true,
        },
      });

      if (error) throw error;

      toast.success('Quotation sent successfully');
      setOpen(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error('Failed to send quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Send
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Quotation
          </DialogTitle>
          <DialogDescription>
            Send quotation {quotation?.quotation_number} to your client via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input
              id="recipientEmail"
              type="email"
              {...register('recipientEmail')}
              placeholder="client@example.com"
            />
            {errors.recipientEmail && (
              <p className="text-sm text-destructive">{errors.recipientEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Quotation subject..."
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Add a personal message..."
              rows={5}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Quotation Preview:</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Number:</span> {quotation?.quotation_number}</p>
              <p><span className="font-medium">Client:</span> {clientName}</p>
              <p><span className="font-medium">Amount:</span> {quotation?.currency} {quotation?.total_amount?.toFixed(2) || '0.00'}</p>
              <p><span className="font-medium">Valid Until:</span> {quotation?.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Quotation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendQuotationModal;
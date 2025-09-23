
import { useState, useCallback } from 'react';
import { sanitizeInput } from '@/utils/security';
import { useSecurity } from '@/components/SecurityProvider';

interface UseSecureFormProps {
  initialValues: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  validate?: (values: Record<string, string>) => Record<string, string>;
}

export const useSecureForm = ({ initialValues, onSubmit, validate }: UseSecureFormProps) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkRateLimit, reportSecurityEvent } = useSecurity();

  const setValue = useCallback((field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setValues(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting for form submissions
    if (!checkRateLimit('form_submit', 5, 60000)) {
      reportSecurityEvent('Form submission rate limit exceeded');
      setErrors({ general: 'Too many submission attempts. Please wait.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate if validator provided
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      // Sanitize all values before submission
      const sanitizedValues = Object.entries(values).reduce((acc, [key, value]) => {
        acc[key] = sanitizeInput(value);
        return acc;
      }, {} as Record<string, string>);

      await onSubmit(sanitizedValues);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
      reportSecurityEvent('Form submission error', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, checkRateLimit, reportSecurityEvent]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    handleSubmit,
  };
};

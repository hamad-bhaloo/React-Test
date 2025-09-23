
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { sanitizeInput, isValidEmail } from '@/utils/security';
import { useSecurity } from '@/components/SecurityProvider';

interface SecureInputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
}

export const SecureInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className,
  maxLength = 500,
  required = false,
  disabled = false,
}: SecureInputProps) => {
  const { checkRateLimit, reportSecurityEvent } = useSecurity();
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Rate limiting for input changes
    if (!checkRateLimit('input_changes', 100)) {
      reportSecurityEvent('Input rate limit exceeded');
      return;
    }

    // Sanitize input
    const sanitizedValue = sanitizeInput(inputValue);
    
    // Additional validation based on type
    if (type === 'email' && sanitizedValue && !isValidEmail(sanitizedValue)) {
      setError('Invalid email format');
    } else {
      setError('');
    }

    // Truncate if exceeds max length
    const finalValue = sanitizedValue.slice(0, maxLength);
    
    onChange(finalValue);
  };

  return (
    <div className="w-full">
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={`${className} ${error ? 'border-red-500' : ''}`}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

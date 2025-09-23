import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Gift, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromoCode {
  plan: string;
  code: string;
  coupon_id: string;
  promo_code_id: string;
  expires_at: string;
  max_redemptions: number;
  percent_off: number;
}

export const PromoCodeGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);

  const generatePromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-promo-codes');
      
      if (error) throw error;

      if (data.success) {
        setPromoCodes(data.promo_codes);
        toast.success(data.message);
      } else {
        throw new Error(data.error || 'Failed to create promo codes');
      }
    } catch (error) {
      console.error('Error generating promo codes:', error);
      toast.error('Failed to generate promo codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code} to clipboard`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Promotional Code Generator
          </CardTitle>
          <CardDescription>
            Generate 100% off promotional codes for all subscription plans, valid for 1 year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generatePromoCodes} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Promo Codes...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Generate Promo Codes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {promoCodes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Promotional Codes</h3>
          {promoCodes.map((promoCode) => (
            <Card key={promoCode.code} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{promoCode.plan} Plan</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {promoCode.percent_off}% OFF
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <code className="text-lg font-mono font-bold">{promoCode.code}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(promoCode.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Expires:</span>
                    <br />
                    {formatDate(promoCode.expires_at)}
                  </div>
                  <div>
                    <span className="font-medium">Max Uses:</span>
                    <br />
                    {promoCode.max_redemptions.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
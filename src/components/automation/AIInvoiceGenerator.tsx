
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LegoLoading } from '@/components/ui/lego-loading';
import { Bot, Sparkles, Zap, FileText, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AIInvoiceGeneratorProps {
  onInvoiceGenerated: (invoice: any) => void;
  initialPrompt?: string;
}

const AIInvoiceGenerator: React.FC<AIInvoiceGeneratorProps> = ({ 
  onInvoiceGenerated, 
  initialPrompt = '' 
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const generationSteps = [
    'Extracting client details from your description',
    'Identifying products, services, and pricing',
    'Calculating subtotals, taxes, and final amounts', 
    'Structuring invoice format and payment terms'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate an invoice');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);

    try {
      // Simulate step-by-step generation with delays
      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      // Parse the prompt to extract invoice details
      const invoiceData = parsePromptToInvoice(prompt);
      
      setTimeout(() => {
        setIsGenerating(false);
        setCurrentStep(0);
        onInvoiceGenerated(invoiceData);
        toast.success('Invoice generated successfully!');
      }, 800);
    } catch (error) {
      setIsGenerating(false);
      setCurrentStep(0);
      toast.error('Failed to generate invoice. Please try again.');
    }
  };

  const parsePromptToInvoice = (promptText: string) => {
    // Simple AI-like parsing logic (in a real app, this would be an actual AI API call)
    const lowerPrompt = promptText.toLowerCase();
    
    // Extract amounts using regex
    const amountMatches = promptText.match(/\$?\d+(?:,\d{3})*(?:\.\d{2})?|\d+\s*(?:dollars?|usd)/gi);
    const amounts = amountMatches?.map(match => parseFloat(match.replace(/[^0-9.]/g, ''))) || [500];
    
    // Extract company/client name
    const companyMatch = promptText.match(/for\s+([A-Z][a-zA-Z\s&]+(?:Company|Corp|Inc|LLC|Ltd)?)/i);
    const clientName = companyMatch ? companyMatch[1].trim() : 'Client Company';
    
    // Extract service description
    let serviceDescription = 'Professional Services';
    if (lowerPrompt.includes('web development') || lowerPrompt.includes('website')) {
      serviceDescription = 'Web Development Services';
    } else if (lowerPrompt.includes('design') || lowerPrompt.includes('logo')) {
      serviceDescription = 'Design Services';
    } else if (lowerPrompt.includes('consulting')) {
      serviceDescription = 'Consulting Services';
    }
    
    // Extract hours if mentioned
    const hoursMatch = promptText.match(/(\d+)\s*hours?/i);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 1;
    
    // Extract rate if mentioned
    const rateMatch = promptText.match(/\$(\d+)(?:\.\d{2})?(?:\/|\s*per\s*)hour/i);
    const hourlyRate = rateMatch ? parseFloat(rateMatch[1]) : amounts[0] / hours;
    
    const subtotal = hours * hourlyRate;
    const taxRate = lowerPrompt.includes('tax') ? 0.1 : 0; // Default 0% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // Extract payment terms
    let paymentTerms = 30; // default
    const termsMatch = promptText.match(/(\d+)\s*days?/i);
    if (termsMatch) {
      paymentTerms = parseInt(termsMatch[1]);
    }

    const invoiceNumber = `AI-${Date.now().toString().slice(-6)}`;
    const today = new Date();
    const dueDate = new Date(today.getTime() + paymentTerms * 24 * 60 * 60 * 1000);

    return {
      invoiceNumber,
      date: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      client: {
        name: clientName,
        email: `contact@${clientName.toLowerCase().replace(/\s+/g, '')}.com`,
        address: '123 Business Ave, City, State'
      },
       items: [
        {
          product_name: serviceDescription,
          description: serviceDescription,
          quantity: hours,
          rate: hourlyRate,
          amount: subtotal
        }
      ],
      subtotal,
      tax,
      total,
      notes: `Generated from AI prompt: "${promptText.slice(0, 100)}${promptText.length > 100 ? '...' : ''}"`
    };
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Invoice Generator
            </span>
            <p className="text-sm text-gray-600 font-normal mt-1">
              Describe your invoice needs and let AI create it for you
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Describe your invoice requirements
          </label>
          <Textarea
            placeholder="Example: Create an invoice for web development services, 40 hours at $75/hour for ABC Company, due in 30 days with 10% tax..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="resize-none border-2 border-gray-200 focus:border-blue-500 transition-colors"
            disabled={isGenerating}
          />
        </div>

        {isGenerating && (
          <div className="space-y-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Building Your Invoice</h4>
              <p className="text-sm text-gray-600">Watch the LEGO blocks connect as we process each step</p>
            </div>
            
            <LegoLoading 
              steps={generationSteps}
              currentStep={currentStep}
              isActive={isGenerating}
              className="py-4"
            />
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 animate-spin" />
              Generating Invoice...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Invoice with AI
            </div>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>💡 <strong>Pro tip:</strong> Be specific about client details, services, rates, and payment terms</p>
          <p>🎯 The more details you provide, the more accurate your invoice will be</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInvoiceGenerator;

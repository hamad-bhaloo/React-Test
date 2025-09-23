import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User, Building2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIClientGeneratorProps {
  onClientGenerated: (clientData: any) => void;
  initialPrompt?: string;
}

const AIClientGenerator: React.FC<AIClientGeneratorProps> = ({ 
  onClientGenerated, 
  initialPrompt = '' 
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  const steps = [
    'Analyzing prompt...',
    'Extracting client details...',
    'Generating contact information...',
    'Finalizing client data...'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for the client');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(steps[0]);

    try {
      // Simulate step progression
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const { data, error } = await supabase.functions.invoke('ai-client-generator', {
        body: { prompt }
      });

      if (error) throw error;

      const clientData = data.clientData;
      
      // Call the callback to populate the form
      onClientGenerated(clientData);
      
      toast.success('Client data generated successfully!');
    } catch (error) {
      console.error('Error generating client:', error);
      toast.error('Failed to generate client data. Please try again.');
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const examplePrompts = [
    "Tech startup in San Francisco, CEO Sarah Johnson, need for web development services",
    "Local restaurant owner Maria Garcia in Miami, family business, catering services", 
    "Corporate law firm Peterson & Associates in Chicago, 50+ employees",
    "Individual freelance designer Alex Chen in Austin, logo and branding work"
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Client Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="Describe the client you want to add (e.g., 'Tech startup in NYC, CEO John Smith, need for marketing services')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
            disabled={isGenerating}
          />
        </div>

        {isGenerating && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">{currentStep}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Client
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Example prompts:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100 text-xs p-2"
                onClick={() => setPrompt(example)}
              >
                {example.length > 50 ? example.substring(0, 50) + '...' : example}
              </Badge>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>💡 Tip: Be specific about the client type (individual vs company), location, industry, and services needed for best results.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIClientGenerator;
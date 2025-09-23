import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LegoLoading } from '@/components/ui/lego-loading';
import { Bot, Sparkles, Zap, FileText, Clock, CheckCircle, Wand2, Settings, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedAIInvoiceGeneratorProps {
  onInvoiceGenerated: (invoice: any) => void;
  initialPrompt?: string;
}

const EnhancedAIInvoiceGenerator: React.FC<EnhancedAIInvoiceGeneratorProps> = ({ 
  onInvoiceGenerated, 
  initialPrompt = '' 
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [isPreviewingAnimation, setIsPreviewingAnimation] = useState(false);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const generationSteps = [
    'Processing client information and contact details',
    'Building line items and service descriptions', 
    'Computing totals, taxes, and final calculations',
    'Applying payment terms and finalizing invoice structure'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your invoice requirements');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);

    try {
      // Animate through steps
      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      const { data: invoiceData, error } = await supabase.functions.invoke('ai-invoice-generator', {
        body: { 
          prompt,
          includeNotes,
          customNotes 
        },
      });

      if (error) throw error;

      setTimeout(() => {
        setIsGenerating(false);
        setCurrentStep(0);
        setGeneratedInvoice(invoiceData);
        onInvoiceGenerated(invoiceData);
        toast.success('✨ Invoice generated successfully!');
      }, 800);
    } catch (error) {
      setIsGenerating(false);
      setCurrentStep(0);
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice. Please try again.');
    }
  };

  const handlePreviewAnimation = async () => {
    setIsPreviewingAnimation(true);
    setCurrentStep(0);
    
    // Animate through steps for preview
    for (let i = 0; i < generationSteps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    
    setTimeout(() => {
      setIsPreviewingAnimation(false);
      setCurrentStep(0);
    }, 800);
  };

  const suggestions = [
    "Web development services for Tech Startup - 40 hours at $85/hour, due in 30 days",
    "Consulting services for Q4 strategy - $5,000 fixed price, payment terms NET 15",
    "Logo design project for Local Business - 3 concepts at $500 each, 50% upfront"
  ];

  return (
    <div className="space-y-6">
      {/* Enterprise Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-enterprise rounded-xl flex items-center justify-center shadow-enterprise">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold enterprise-gradient-text">AI Engine</h2>
            <p className="text-sm text-muted-foreground">Natural language processing</p>
          </div>
        </div>
        
        {/* System Status */}
        <Button
          onClick={handlePreviewAnimation}
          disabled={isGenerating || isPreviewingAnimation}
          variant="outline"
          size="sm"
          className="border-primary/20 hover:bg-primary/5 text-primary"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Preview System
        </Button>
      </div>

      {/* Configuration Panel */}
      <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Settings className="w-5 h-5 text-primary" />
          System Configuration
        </div>
        
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50">
            <div>
              <Label className="text-sm font-medium text-foreground">Intelligent Annotations</Label>
              <p className="text-xs text-muted-foreground">Auto-generate professional terms and conditions</p>
            </div>
            <Switch
              checked={includeNotes}
              onCheckedChange={setIncludeNotes}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Custom Instructions</Label>
            <Textarea
              placeholder="Enter specific payment terms, legal requirements, or custom instructions..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={3}
              className="bg-background border-border/50 focus:border-primary rounded-lg text-sm resize-none transition-all duration-300"
            />
            <p className="text-xs text-muted-foreground">
              These instructions will be integrated into the generated invoice
            </p>
          </div>
        </div>
      </div>

      {/* Input Interface */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Requirements Specification
          </Label>
          <Textarea
            placeholder="Describe your invoice requirements in detail. Include client information, services provided, pricing, payment terms, and any special conditions..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="bg-background border-2 border-border/60 focus:border-primary rounded-xl shadow-sm text-foreground placeholder:text-muted-foreground transition-all duration-300 resize-none"
            disabled={isGenerating}
          />
        </div>

        {/* Professional Templates */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-muted-foreground">Professional Templates:</Label>
          <div className="grid gap-2">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                className="text-left p-3 bg-muted/50 hover:bg-muted border border-border/50 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all duration-300 hover:shadow-sm"
                disabled={isGenerating}
              >
                <div className="font-medium text-foreground mb-1">Template {index + 1}</div>
                <div className="line-clamp-2">{suggestion}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LEGO Processing Status */}
      {(isGenerating || isPreviewingAnimation) && (
        <div className="space-y-8 p-8 bg-white/95 backdrop-blur-md rounded-2xl border border-border/50 shadow-premium">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-semibold enterprise-gradient-text">
              {isPreviewingAnimation ? 'LEGO System Preview' : 'AI Processing Pipeline'}
            </h3>
            <p className="text-muted-foreground">
              {isPreviewingAnimation ? 'Watch the LEGO blocks connect as each step completes...' : 'Building your invoice step by step...'}
            </p>
          </div>
          
          <LegoLoading 
            steps={generationSteps}
            currentStep={currentStep}
            isActive={isGenerating || isPreviewingAnimation}
            className="py-8"
          />
          
          {/* Status Information */}
          <div className="text-center p-4 bg-gradient-to-r from-muted/50 to-primary/5 rounded-xl border border-border/50">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>LEGO AI Processing System Active</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Each block represents a completed processing step in the AI pipeline
            </p>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating || isPreviewingAnimation}
        size="lg"
        className="w-full h-14 gradient-enterprise hover:shadow-premium text-white font-semibold text-base rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100"
      >
        {isGenerating ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing Request...
          </div>
        ) : generatedInvoice ? (
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            Generate New Invoice
            <ArrowRight className="w-4 h-4" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5" />
            Execute AI Generation
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </Button>

      {/* System Information */}
      <div className="text-center p-6 bg-gradient-to-r from-muted/30 to-primary/5 rounded-xl border border-border/30">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Enterprise AI Processing Engine</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Powered by advanced natural language processing and machine learning algorithms. 
          Delivers enterprise-grade accuracy and compliance standards.
        </p>
      </div>
    </div>
  );
};

export default EnhancedAIInvoiceGenerator;
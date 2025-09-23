import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { User, ShoppingCart, Calculator, FileCheck, Building, CreditCard, Calendar, Receipt } from 'lucide-react';

interface LegoLoadingProps {
  steps: string[];
  currentStep: number;
  isActive: boolean;
  className?: string;
}

const LegoLoading: React.FC<LegoLoadingProps> = ({ 
  steps, 
  currentStep, 
  isActive, 
  className 
}) => {
  const [connectedBlocks, setConnectedBlocks] = useState<number[]>([]);
  const [animatingBlock, setAnimatingBlock] = useState<number | null>(null);

  // Professional workflow components
  const invoiceParts = [
    { 
      icon: Building, 
      label: 'Client Data', 
      color: 'from-slate-600 to-slate-700',
      description: 'Customer information processing'
    },
    { 
      icon: Receipt, 
      label: 'Line Items', 
      color: 'from-blue-600 to-blue-700',
      description: 'Product and service cataloging'
    },
    { 
      icon: Calculator, 
      label: 'Financial Calculation', 
      color: 'from-emerald-600 to-emerald-700',
      description: 'Tax computation and totals'
    },
    { 
      icon: FileCheck, 
      label: 'Document Finalization', 
      color: 'from-indigo-600 to-indigo-700',
      description: 'Terms validation and completion'
    }
  ];

  useEffect(() => {
    if (!isActive) {
      setConnectedBlocks([]);
      setAnimatingBlock(null);
      return;
    }

    if (currentStep >= 0 && currentStep < steps.length) {
      setAnimatingBlock(currentStep);
      
      const timer = setTimeout(() => {
        setConnectedBlocks(prev => {
          if (!prev.includes(currentStep)) {
            return [...prev, currentStep];
          }
          return prev;
        });
        setAnimatingBlock(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isActive, steps.length]);

  return (
    <div className={cn("flex flex-col items-center space-y-8", className)}>
      {/* Invoice Parts Assembly */}
      <div className="relative flex items-center justify-center gap-3">
        {invoiceParts.map((part, index) => {
          const isConnected = connectedBlocks.includes(index);
          const isAnimating = animatingBlock === index;
          const showConnection = index > 0 && connectedBlocks.includes(index - 1);
          const Icon = part.icon;
          
          return (
            <div key={index} className="flex items-center">
              {/* Connection Pipeline */}
              {index > 0 && (
                <div className="relative mx-2">
                  <div className={cn(
                    "h-2 w-12 rounded-sm transition-all duration-500 relative overflow-hidden",
                    showConnection && connectedBlocks.includes(index)
                      ? "bg-gradient-to-r from-primary/60 to-primary border border-primary/30"
                      : "bg-border"
                  )}>
                    {showConnection && connectedBlocks.includes(index) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[slide-right_1.2s_ease-in-out_infinite]" />
                    )}
                  </div>
                  
                  {/* Data Processing Indicator */}
                  {isAnimating && showConnection && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-primary rounded-full animate-[fade-in_0.8s_ease-in-out_infinite]" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Workflow Component Block */}
              <div className="relative group">
                <div 
                  className={cn(
                    "w-24 h-18 rounded-lg border transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden",
                    isConnected || isAnimating
                      ? `bg-gradient-to-br ${part.color} border-border shadow-lg scale-105`
                      : "bg-card border-border/50 scale-100 opacity-70 shadow-sm"
                  )}
                >
                  {/* Connection Points */}
                  <div className="absolute top-1 flex gap-1">
                    {[...Array(3)].map((_, studIndex) => (
                      <div 
                        key={studIndex}
                        className={cn(
                          "w-1 h-1 rounded-sm transition-all duration-300",
                          isConnected || isAnimating
                            ? "bg-white/60 shadow-sm"
                            : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  
                  {/* Component Icon */}
                  <Icon className={cn(
                    "w-7 h-7 transition-colors duration-300 mb-2",
                    isConnected || isAnimating ? "text-white" : "text-muted-foreground"
                  )} />
                  
                  {/* Component Label */}
                  <div className={cn(
                    "text-xs font-medium transition-colors duration-300 text-center leading-tight px-1",
                    isConnected || isAnimating ? "text-white" : "text-muted-foreground"
                  )}>
                    {part.label}
                  </div>
                  
                  {/* Processing Indicator */}
                  {isAnimating && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg animate-fade-in" />
                  )}
                  
                  {/* Completion State */}
                  {isConnected && !isAnimating && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full shadow-sm" />
                  )}
                </div>
                
                {/* Tooltip */}
                <div className={cn(
                  "absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs rounded-md px-2 py-1 opacity-0 transition-opacity whitespace-nowrap",
                  "group-hover:opacity-100"
                )}>
                  {part.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Processing Status */}
      <div className="text-center space-y-3 max-w-lg">
        <h4 className="text-lg font-medium text-foreground tracking-tight">
          Document Processing Workflow
        </h4>
        
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = connectedBlocks.includes(index);
          const part = invoiceParts[index];
          
          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all duration-500",
                isActive
                  ? "text-foreground font-medium bg-primary/5 border-primary/20"
                  : isCompleted
                  ? "text-foreground/90 font-medium bg-card/50 border-border shadow-sm"
                  : "text-muted-foreground/70 bg-muted/30 border-transparent"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 border",
                isCompleted
                  ? `bg-gradient-to-br ${part?.color} text-white border-border/50`
                  : isActive
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted/50 text-muted-foreground border-transparent"
              )}>
                {part && <part.icon className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 text-left space-y-1">
                <div className="font-medium text-sm">{part?.label}</div>
                <div className="text-xs text-muted-foreground">{step}</div>
              </div>
              
              {isCompleted && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <FileCheck className="w-3 h-3 text-white" />
                </div>
              )}
              
              {isActive && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Processing Progress */}
      <div className="w-full max-w-md bg-muted/50 rounded-sm h-2 overflow-hidden border border-border/50">
        <div 
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out"
          style={{ 
            width: `${((connectedBlocks.length) / steps.length) * 100}%`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[slide-right_2s_ease-in-out_infinite]" />
        </div>
      </div>
      
      {/* Completion Status */}
      {connectedBlocks.length === steps.length && isActive && (
        <div className="flex items-center gap-3 text-foreground font-medium animate-fade-in p-3 rounded-lg bg-card border border-border/50 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <FileCheck className="w-3 h-3 text-white" />
          </div>
          Document Processing Complete
        </div>
      )}
    </div>
  );
};

export { LegoLoading };
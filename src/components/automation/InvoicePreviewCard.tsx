
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Save, Eye, Sparkles, Edit3, Check, X, FileText, Zap } from 'lucide-react';

interface InvoicePreviewCardProps {
  invoice: any;
  onSave: () => void;
  onDownload: () => void;
  onEdit?: () => void;
  editMode?: boolean;
  onSaveEdit?: (invoice: any) => void;
  onCancelEdit?: () => void;
}

const InvoicePreviewCard: React.FC<InvoicePreviewCardProps> = ({ 
  invoice, 
  onSave, 
  onDownload,
  onEdit,
  editMode = false,
  onSaveEdit,
  onCancelEdit
}) => {
  const [editData, setEditData] = useState<any>(invoice);

  if (!invoice) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="text-center space-y-8 max-w-md">
          <div className="relative">
            <div className="w-32 h-32 mx-auto gradient-surface rounded-3xl flex items-center justify-center shadow-premium">
              <Eye className="h-16 w-16 text-primary" />
            </div>
            <div className="absolute -top-3 -right-3 w-12 h-12 gradient-ai rounded-2xl flex items-center justify-center shadow-ai">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-3xl font-bold ai-gradient-text">
              Invoice Preview
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Your AI-generated invoice will appear here. Start by describing your requirements in the generator panel.
            </p>
            <div className="flex items-center justify-center gap-3 text-muted-foreground mt-6">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm">Waiting for AI generation...</span>
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse animation-delay-150" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-ai">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Invoice Preview</h2>
              <p className="text-muted-foreground">AI-generated and ready to customize</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">AI Generated</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {editMode ? (
            <>
              <Button 
                onClick={() => onSaveEdit?.(editData)} 
                size="sm" 
                className="gradient-primary text-primary-foreground shadow-ai hover:shadow-premium transition-all duration-300"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button 
                onClick={onCancelEdit} 
                variant="outline" 
                size="sm"
                className="border-border hover:bg-muted"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={onSave} 
                size="sm" 
                className="gradient-primary text-primary-foreground shadow-ai hover:shadow-premium transition-all duration-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Invoice
              </Button>
              <Button 
                onClick={onEdit} 
                variant="outline" 
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              <Button 
                onClick={onDownload} 
                variant="outline" 
                size="sm"
                className="border-accent/30 text-accent hover:bg-accent/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-background border-2 border-border/30 rounded-3xl p-12 space-y-10 shadow-premium">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-gray-600 font-medium">#{editMode ? editData?.invoiceNumber || invoice.invoiceNumber : invoice.invoiceNumber}</p>
              <p className="text-sm text-gray-500">Date: {editMode ? editData?.date || invoice.date : invoice.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Due Date</p>
              {editMode ? (
                <Input 
                  type="date" 
                  value={editData?.dueDate || invoice.dueDate} 
                  onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                  className="w-32 text-xs"
                />
              ) : (
                <p className="font-semibold text-gray-900">{invoice.dueDate}</p>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">Bill To</h3>
              <div className="text-sm text-gray-600 space-y-1">
                {editMode ? (
                  <>
                    <Input 
                      value={editData?.client?.name || invoice.client.name} 
                      onChange={(e) => setEditData({...editData, client: {...editData?.client, name: e.target.value}})}
                      placeholder="Client name"
                      className="font-medium text-gray-900 text-sm"
                    />
                    <Input 
                      value={editData?.client?.email || invoice.client.email} 
                      onChange={(e) => setEditData({...editData, client: {...editData?.client, email: e.target.value}})}
                      placeholder="Client email"
                      className="text-sm"
                    />
                    <Input 
                      value={editData?.client?.address || invoice.client.address} 
                      onChange={(e) => setEditData({...editData, client: {...editData?.client, address: e.target.value}})}
                      placeholder="Client address"
                      className="text-sm"
                    />
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">{invoice.client.name}</p>
                    <p>{invoice.client.email}</p>
                    <p>{invoice.client.address}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">DESCRIPTION</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">QTY</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">RATE</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{item.description}</td>
                    <td className="text-right py-3 px-4 text-sm text-gray-600">{item.quantity}</td>
                    <td className="text-right py-3 px-4 text-sm text-gray-600">${item.rate.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-sm font-medium text-gray-900">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (20%)</span>
                <span className="text-gray-900">${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span className="text-gray-900">TOTAL</span>
                <span className="text-blue-600">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-gray-900 text-sm uppercase tracking-wide">Notes</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewCard;

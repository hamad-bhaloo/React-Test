import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesBarProps {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

const UnsavedChangesBar: React.FC<UnsavedChangesBarProps> = ({ visible, onSave, onDiscard }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-foreground" aria-hidden="true" />
        <p className="text-sm">You have unsaved changes.</p>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={onDiscard}>Discard</Button>
          <Button size="sm" onClick={onSave}>Save changes</Button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesBar;

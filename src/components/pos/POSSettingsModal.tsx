import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { currencies } from '@/constants/currencies';
import { usePOSSettings } from '@/hooks/usePOSSettings';

interface POSSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POSSettingsModal: React.FC<POSSettingsModalProps> = ({ open, onOpenChange }) => {
  const { settings, loading, saving, save, setTillOpen } = usePOSSettings();
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');
  const [tillOpen, setTillOpenLocal] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimezone(settings.timezone || 'UTC');
      setCurrency(settings.currency || 'USD');
      setTillOpenLocal(!!settings.tillOpen);
    }
  }, [loading, settings]);

  useEffect(() => {
    const baseline = {
      timezone: settings.timezone || 'UTC',
      currency: settings.currency || 'USD',
      tillOpen: !!settings.tillOpen,
    };
    const current = { timezone, currency, tillOpen };
    setDirty(JSON.stringify(current) !== JSON.stringify(baseline));
  }, [settings, timezone, currency, tillOpen]);

  const handleSave = async () => {
    await save({ timezone, currency, tillOpen });
    setDirty(false);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (dirty) {
        setShowDiscardConfirm(true);
      } else {
        onOpenChange(false);
      }
    } else {
      onOpenChange(true);
    }
  };

  const discardChanges = () => {
    setTimezone(settings.timezone || 'UTC');
    setCurrency(settings.currency || 'USD');
    setTillOpenLocal(!!settings.tillOpen);
    setDirty(false);
    setShowDiscardConfirm(false);
    onOpenChange(false);
  };

  return (
    <> 
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>POS Settings</DialogTitle>
        </DialogHeader>

        {dirty && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
            <p className="text-sm">You have unsaved changes</p>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" onClick={discardChanges}>Discard</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              placeholder="e.g., Africa/Lagos"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Use IANA format like Europe/London or Africa/Lagos</p>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="block">Till Status</Label>
              <p className="text-xs text-muted-foreground">Toggle to open or close your till</p>
            </div>
            <Switch
              checked={tillOpen}
              onCheckedChange={(v) => setTillOpenLocal(v)}
              aria-label="Till status"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTillOpen(true)}
              disabled={saving || tillOpen}
            >
              Open Till
            </Button>
            <Button
              variant="outline"
              onClick={() => setTillOpen(false)}
              disabled={saving || !tillOpen}
            >
              Close Till
            </Button>
            <div className="ml-auto" />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction onClick={discardChanges}>Discard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default POSSettingsModal;

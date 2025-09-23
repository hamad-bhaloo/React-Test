import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: any;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      toast({
        title: 'Error loading API keys',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    // Generate a secure API key
    const prefix = 'invx_';
    const keyPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return prefix + keyPart;
  };

  const hashApiKey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive'
      });
      return;
    }

    try {
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 12) + '...';

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: ['invoices:read', 'invoices:write', 'clients:read', 'clients:write']
        });

      if (error) throw error;

      setNewKey(apiKey);
      setNewKeyName('');
      loadApiKeys();
      
      toast({
        title: 'API key created',
        description: 'Your new API key has been generated. Make sure to copy it now!',
      });

    } catch (error) {
      toast({
        title: 'Error creating API key',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const revokeApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      loadApiKeys();
      toast({
        title: 'API key revoked',
        description: 'The API key has been deactivated',
      });
    } catch (error) {
      toast({
        title: 'Error revoking API key',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The API key has been copied to your clipboard',
    });
  };

  if (loading) {
    return <div>Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage API keys for external integrations
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for external integrations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., My App Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              {newKey && (
                <div>
                  <Label>Your API Key (copy it now!)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newKey}
                      type={showNewKey ? 'text' : 'password'}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewKey(!showNewKey)}
                    >
                      {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is the only time you'll see this key. Store it securely!
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                {!newKey ? (
                  <Button onClick={createApiKey}>Generate API Key</Button>
                ) : (
                  <Button onClick={() => {
                    setShowCreateDialog(false);
                    setNewKey(null);
                    setShowNewKey(false);
                  }}>
                    Done
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No API keys found. Create your first API key to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{key.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(key.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                    {key.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Key Prefix</Label>
                    <p className="font-mono text-sm">{key.key_prefix}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(key.permissions) ? key.permissions : []).map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {key.last_used_at && (
                    <div>
                      <Label className="text-sm font-medium">Last Used</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(key.last_used_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
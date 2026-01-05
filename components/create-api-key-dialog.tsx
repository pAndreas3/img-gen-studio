"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createApiKeyAction } from '@/app/actions/api-key-actions';
import { Copy, Eye, EyeOff } from 'lucide-react';

interface CreateApiKeyDialogProps {
  children: React.ReactNode;
  onApiKeyCreated?: () => void;
}

export default function CreateApiKeyDialog({ children, onApiKeyCreated }: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await createApiKeyAction({
        name: formData.name,
        description: formData.description,
      });
      
      if (result.success && result.apiKey) {
        setCreatedKey(result.apiKey.plainKey);
        toast.success('API key created successfully!');
        // Don't close dialog yet - show the key first
      } else {
        toast.error(result.error || 'Failed to create API key');
      }
    } catch (error) {
      toast.error('Failed to create API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // If we had created a key and now closing, refresh the parent table
      if (createdKey) {
        onApiKeyCreated?.();
      }
      // Only reset when actually closing
      setCreatedKey(null);
      setShowKey(false);
      setFormData({ name: '', description: '' });
    }
  };

  const copyToClipboard = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      toast.success('API key copied to clipboard!');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? 'API Key Created' : 'Create New API Key'}
          </DialogTitle>
          <DialogDescription>
            {createdKey 
              ? 'Save this API key now. You won\'t be able to see it again!'
              : 'Create a new API key to access the DiffusionLab API programmatically.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {createdKey ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={showKey ? createdKey : '•'.repeat(createdKey.length)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Store this key securely. It will not be shown again.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter API key name (e.g., Production App)"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this API key"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </form>
        )}
        
        <DialogFooter>
          {createdKey ? (
            <Button onClick={() => handleClose(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleClose(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create API Key'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

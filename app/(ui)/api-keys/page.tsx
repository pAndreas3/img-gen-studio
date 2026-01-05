'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateApiKeyDialog from '@/components/create-api-key-dialog';
import { getUserApiKeysAction, type ApiKeyListItem } from '@/app/actions/api-key-actions';
import ApiKeysTable from '@/components/api-keys-table';

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (!session) {
      redirect('/login');
      return;
    }

    loadApiKeys();
  }, [session, status]);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await getUserApiKeysAction();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyCreated = () => {
    // Refresh the API keys list when a new key is created
    loadApiKeys();
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Manage your API keys for programmatic access to DiffusionLab
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Manage your API keys for programmatic access to DiffusionLab
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div> 
                <CardDescription>
                  Create and manage API keys to access the DiffusionLab API programmatically.
                </CardDescription>
              </div>
              <CreateApiKeyDialog onApiKeyCreated={handleApiKeyCreated}>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create API Key
                </Button>
              </CreateApiKeyDialog>
            </div>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No API keys created yet. Click "Create API Key" to get started with programmatic access to your models and generation capabilities.
                </p>
              </div>
            ) : (
              <ApiKeysTable apiKeys={apiKeys} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

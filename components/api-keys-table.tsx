'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { revokeApiKeyAction, type ApiKeyListItem } from '@/app/actions/api-key-actions';

interface ApiKeysTableProps {
  apiKeys: ApiKeyListItem[];
}

export default function ApiKeysTable({ apiKeys: initialApiKeys }: ApiKeysTableProps) {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [revokingKeys, setRevokingKeys] = useState<Set<string>>(new Set());

  const handleRevokeKey = async (keyId: string) => {
    setRevokingKeys(prev => new Set([...prev, keyId]));
    
    try {
      const result = await revokeApiKeyAction(keyId);
      
      if (result.success) {
        setApiKeys(prev => 
          prev.map(key => 
            key.id === keyId 
              ? { ...key, isActive: false }
              : key
          )
        );
        toast.success('API key revoked successfully');
      } else {
        toast.error(result.error || 'Failed to revoke API key');
      }
    } catch (error) {
      toast.error('Failed to revoke API key');
    } finally {
      setRevokingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell className="font-medium">
                {apiKey.name || 'Unnamed Key'}
              </TableCell>
              <TableCell>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {apiKey.keyPreview}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                  {apiKey.isActive ? 'Active' : 'Revoked'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(apiKey.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}
              </TableCell>
              <TableCell>
                {apiKey.isActive && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={revokingKeys.has(apiKey.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRevokeKey(apiKey.id)}
                        disabled={revokingKeys.has(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {revokingKeys.has(apiKey.id) ? 'Revoking...' : 'Revoke'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {apiKeys.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {apiKeys.filter(k => k.isActive).length} of {apiKeys.length} keys are active
        </div>
      )}
    </div>
  );
}

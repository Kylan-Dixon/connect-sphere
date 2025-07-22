
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { addBulkConnections } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';

interface BulkUploadProps {
  associatedCompany: 'Mohan Financial' | 'Mohan Coaching';
}

// Maps possible CSV header names to our application's data model keys.
const headerMapping: { [key: string]: keyof MappedConnection } = {
  'first name': 'firstName',
  'last name': 'lastName',
  'name': 'name',
  'url': 'linkedInUrl',
  'linkedin profile url': 'linkedInUrl',
  'email': 'email',
  'email address': 'email',
  'phone': 'phoneNumber',
  'phone number': 'phoneNumber',
  'company': 'company',
  'current company': 'company',
  'position': 'title',
  'title': 'title',
  'job title': 'title',
  'notes': 'notes',
};

type MappedConnection = {
    name?: string;
    firstName?: string;
    lastName?: string;
    linkedInUrl?: string;
    email?: string;
    phoneNumber?: string;
    company?: string;
    title?: string;
    notes?: string;
}

export function BulkUpload({ associatedCompany }: BulkUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a file and ensure you are logged in.',
      });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

        if (jsonData.length < 2) {
          throw new Error('Spreadsheet must contain a header row and at least one data row.');
        }

        const headers = (jsonData[0] as string[]).map(h => String(h).trim().toLowerCase());
        
        const mappedData = jsonData.slice(1).map(row => {
            const connection: MappedConnection = {};
            headers.forEach((header, index) => {
                const mappedKey = headerMapping[header];
                if (mappedKey) {
                    connection[mappedKey] = row[index];
                }
            });
            
            // Combine First and Last Name if they exist
            if (connection.firstName && connection.lastName) {
                connection.name = `${connection.firstName} ${connection.lastName}`;
            }

            return connection;
        }).filter(c => c.name); // Filter out rows without a name

        if (mappedData.length === 0) {
            throw new Error('No valid connections with a name could be found in the file. Please ensure the file has a "Name" column or "First Name" and "Last Name" columns.');
        }

        const result = await addBulkConnections(user.uid, associatedCompany, mappedData);

        if (result.success) {
          toast({
            title: 'Success!',
            description: result.message,
          });
          setFile(null);
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if(fileInput) fileInput.value = '';

        } else {
          throw new Error(result.message || 'Failed to upload connections.');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error.message,
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">Upload LinkedIn Export or Custom CSV/Excel</Label>
        <Input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="mt-1"
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground mt-2">
            Directly upload your `Connections.csv` from LinkedIn. The uploader will automatically recognize columns like: First/Last Name, URL, Company, Position, and Email. A 'Name' or 'First/Last Name' column is required.
        </p>
      </div>
      <Button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {isUploading ? 'Processing...' : 'Upload and Save Connections'}
      </Button>
    </div>
  );
}

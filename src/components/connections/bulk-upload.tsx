
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
import { type Connection } from '@/lib/types';

interface BulkUploadProps {
  associatedCompany: 'Mohan Financial' | 'Mohan Coaching';
}

const REQUIRED_HEADERS = ['name'];
const OPTIONAL_HEADERS = ['email', 'phoneNumber', 'company', 'title', 'notes'];

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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error('Spreadsheet must contain a header row and at least one data row.');
        }

        const headers = (jsonData[0] as string[]).map(h => h.trim().toLowerCase());
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}.`);
        }

        const dataRows = jsonData.slice(1).map(row => {
            const rowData: { [key: string]: any } = {};
            headers.forEach((header, index) => {
                if (REQUIRED_HEADERS.includes(header) || OPTIONAL_HEADERS.includes(header)) {
                    // Map spreadsheet header to our data model keys
                    const key = header === 'phonenumber' ? 'phoneNumber' : header;
                    rowData[key] = row[index] || '';
                }
            });
            return rowData;
        });
        
        const result = await addBulkConnections(user.uid, associatedCompany, dataRows);

        if (result.success) {
          toast({
            title: 'Success!',
            description: result.message,
          });
          setFile(null);
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
        <Label htmlFor="file-upload">Upload Spreadsheet</Label>
        <Input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="mt-1"
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground mt-2">
            Required columns: {REQUIRED_HEADERS.join(', ')}. Optional columns: {OPTIONAL_HEADERS.join(', ')}.
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

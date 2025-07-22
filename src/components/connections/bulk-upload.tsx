
'use client';

import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { addBulkConnections } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, ArrowLeft, ArrowRight, Table as TableIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BulkUploadProps {
  associatedCompany: 'Mohan Financial' | 'Mohan Coaching';
}

type UploadStep = 'select' | 'map' | 'uploading';
type MappedField = 'name' | 'email' | 'phoneNumber' | 'linkedInUrl' | 'company' | 'title' | 'notes';

const mappableFields: { value: MappedField | 'ignore', label: string }[] = [
    { value: 'ignore', label: 'Ignore this column' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phoneNumber', label: 'Phone Number' },
    { value: 'linkedInUrl', label: 'LinkedIn Profile URL' },
    { value: 'company', label: 'Company' },
    { value: 'title', label: 'Title' },
    { value: 'notes', label: 'Notes' },
];

const headerMappingSuggestions: { [key: string]: MappedField } = {
  'first name': 'name',
  'last name': 'name', // Will be combined into 'name'
  'name': 'name',
  'url': 'linkedInUrl',
  'linkedin profile url': 'linkedInUrl',
  'profile url': 'linkedInUrl',
  'email': 'email',
  'email address': 'email',
  'phone': 'phoneNumber',
  'phone number': 'phoneNumber',
  'company': 'company',
  'current company': 'company',
  'organization': 'company',
  'position': 'title',
  'title': 'title',
  'job title': 'title',
  'notes': 'notes',
};


export function BulkUpload({ associatedCompany }: BulkUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<UploadStep>('select');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: MappedField | 'ignore' }>({});

  const resetState = () => {
    setStep('select');
    setFile(null);
    setHeaders([]);
    setJsonData([]);
    setMapping({});
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      
      if (json.length < 2) {
        throw new Error('Spreadsheet must contain a header row and at least one data row.');
      }
      
      const fileHeaders = (json[0] as string[]).map(h => String(h || '').trim());
      setHeaders(fileHeaders);
      
      const fileJsonData = XLSX.utils.sheet_to_json(worksheet, {defval: ''});
      
      // Handle LinkedIn's "First Name" and "Last Name"
      const firstNameIndex = fileHeaders.findIndex(h => h.toLowerCase() === 'first name');
      const lastNameIndex = fileHeaders.findIndex(h => h.toLowerCase() === 'last name');
      const nameIndex = fileHeaders.findIndex(h => h.toLowerCase() === 'name');

      if (firstNameIndex !== -1 && lastNameIndex !== -1 && nameIndex === -1) {
        // If we have First/Last Name but not a combined Name, create one.
        const combinedData = fileJsonData.map((row: any) => ({
            ...row,
            "Name (Combined)": `${row[fileHeaders[firstNameIndex]] || ''} ${row[fileHeaders[lastNameIndex]] || ''}`.trim()
        }));
        setJsonData(combinedData);
        setHeaders(prev => [...prev, 'Name (Combined)']);
      } else {
        setJsonData(fileJsonData);
      }

      // Auto-map headers
      const initialMapping: { [key: string]: MappedField | 'ignore' } = {};
       [...fileHeaders, "Name (Combined)"].forEach(header => {
        const suggestion = headerMappingSuggestions[header.toLowerCase()];
        initialMapping[header] = suggestion || 'ignore';
      });

      setMapping(initialMapping);
      setStep('map');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: error.message || 'Could not parse the selected file.',
        });
        resetState();
    }
  };

  const handleMappingChange = (header: string, field: MappedField | 'ignore') => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };

  const handleUpload = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    if (!Object.values(mapping).includes('name')) {
        toast({ variant: 'destructive', title: 'Mapping Error', description: 'You must map a column to the "Name" field to proceed.' });
        return;
    }

    setStep('uploading');

    try {
      const result = await addBulkConnections({
        userId: user.uid,
        associatedCompany,
        jsonData,
        mapping
      });

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        resetState();
      } else {
        throw new Error(result.message || 'An unknown error occurred during upload.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
      });
      setStep('map'); // Revert to mapping step on failure
    }
  };

  const previewData = useMemo(() => {
    if(jsonData.length === 0) return [];
    
    return jsonData.slice(0, 3).map((row, rowIndex) => {
        const previewRow: { [key in MappedField]?: any } = {};
        for(const header in mapping) {
            const mappedField = mapping[header];
            if(mappedField !== 'ignore') {
                previewRow[mappedField] = row[header] || '';
            }
        }
        return previewRow;
    });
  }, [jsonData, mapping]);

  const renderContent = () => {
    switch (step) {
      case 'uploading':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">Processing your file...</p>
            <p className="text-muted-foreground">This may take a moment.</p>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Map Your Columns</CardTitle>
                    <CardDescription>
                        Match the columns from your file to the fields in ConnectSphere. We've made some suggestions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-1">
                        {headers.filter(h => h).map((header) => (
                            <div key={header} className="grid grid-cols-2 items-center gap-2">
                                <Label htmlFor={`map-${header}`} className="font-semibold truncate" title={header}>
                                {header}
                                </Label>
                                <Select
                                value={mapping[header]}
                                onValueChange={(value: MappedField | 'ignore') => handleMappingChange(header, value)}
                                >
                                <SelectTrigger id={`map-${header}`}>
                                    <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mappableFields.map(field => (
                                    <SelectItem key={field.value} value={field.value}>
                                        {field.label}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TableIcon className="h-5 w-5"/>
                        Data Preview
                    </CardTitle>
                    <CardDescription>
                        Here's a sample of how your data will be imported with the current mapping.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {mappableFields.filter(f => f.value !== 'ignore' && Object.values(mapping).includes(f.value as MappedField)).map(f => (
                                        <TableHead key={f.value}>{f.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {previewData.map((row, index) => (
                                 <TableRow key={index}>
                                    {mappableFields.filter(f => f.value !== 'ignore' && Object.values(mapping).includes(f.value as MappedField)).map(f => (
                                        <TableCell key={f.value} className="truncate max-w-[150px]">
                                            {row[f.value as MappedField]}
                                        </TableCell>
                                    ))}
                                 </TableRow>
                               ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetState}>
                <ArrowLeft/> Back
              </Button>
              <Button onClick={handleUpload}>
                <Upload/> Confirm and Import Connections
              </Button>
            </div>
          </div>
        );

      case 'select':
      default:
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
              />
              <p className="text-sm text-muted-foreground mt-2">
                  Directly upload your `Connections.csv` from LinkedIn or a custom spreadsheet. You'll be able to map columns in the next step.
              </p>
            </div>
          </div>
        );
    }
  };

  return <div className="w-full">{renderContent()}</div>;
}


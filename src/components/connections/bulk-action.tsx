
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { findBulkMatches, bulkConnectionsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, ArrowLeft, Table as TableIcon, Trash, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface BulkActionProps {
  associatedCompany?: 'Mohan Financial' | 'Mohan Coaching' | 'All';
}

type UploadStep = 'select' | 'map' | 'review' | 'uploading';
type ActionType = 'delete'; // Only delete is supported for now
type MappedField = 'name' | 'firstName' | 'lastName' | 'preferredName' | 'email' | 'personalEmail' | 'homePhone' | 'mobilePhone';

const mappableFields: { value: MappedField | 'ignore', label: string }[] = [
    { value: 'ignore', label: 'Ignore this column' },
    { value: 'name', label: 'Full Name' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'preferredName', label: 'Preferred Name' },
    { value: 'email', label: 'Best to use Email' },
    { value: 'personalEmail', label: 'Personal Email' },
    { value: 'homePhone', label: 'Home Phone' },
    { value: 'mobilePhone', label: 'Mobile Phone' },
];

const headerMappingSuggestions: { [key: string]: MappedField } = {
  'first name': 'firstName',
  'last name': 'lastName',
  'preferred name': 'preferredName',
  'name': 'name',
  'full name': 'name',
  'email': 'email',
  'email address': 'email',
  'best to use email': 'email',
  'personal email': 'personalEmail',
  'home phone': 'homePhone',
  'mobile phone': 'mobilePhone',
  'phone': 'mobilePhone',
  'phone number': 'mobilePhone',
};

export function BulkAction({ associatedCompany: initialCompany }: BulkActionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<UploadStep>('select');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: MappedField | 'ignore' }>({});
  const [action, setAction] = useState<ActionType>('delete');
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [isFinding, setIsFinding] = useState(false);
  const [companyScope, setCompanyScope] = useState<'Mohan Financial' | 'Mohan Coaching' | 'All'>(initialCompany || 'All');

  const resetState = () => {
    setStep('select');
    setFile(null);
    setHeaders([]);
    setJsonData([]);
    setMapping({});
    setMatches([]);
    setSelectedMatches([]);
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
      const fileJsonData = XLSX.utils.sheet_to_json(worksheet, {defval: ''});
      
      setHeaders(fileHeaders);
      setJsonData(fileJsonData);

      const initialMapping: { [key: string]: MappedField | 'ignore' } = {};
      fileHeaders.forEach(header => {
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
  
  const handleFindMatches = async () => {
    setIsFinding(true);
    try {
      const result = await findBulkMatches({
        associatedCompany: companyScope === 'All' ? undefined : companyScope,
        jsonData,
        mapping,
      });

      if (result.success && result.matches) {
        if(result.matches.length === 0) {
            toast({ title: 'No Matches', description: 'No potential matches were found based on your file.'});
            setStep('map');
        } else {
            setMatches(result.matches);
            setSelectedMatches(result.matches.map(m => m.connection.id)); // Default to all selected
            setStep('review');
        }
      } else {
        throw new Error(result.message || 'Failed to find matches.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Finding Matches',
        description: error.message,
      });
    } finally {
      setIsFinding(false);
    }
  }

  const handleAction = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    if(selectedMatches.length === 0) {
        toast({ variant: 'destructive', title: 'No Selection', description: 'Please select at least one connection to perform the action on.' });
        return;
    }

    setStep('uploading');

    try {
      const result = await bulkConnectionsAction({
        connectionIds: selectedMatches,
        action,
      });

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        resetState();
      } else {
        throw new Error(result.message || 'An unknown error occurred during the action.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message,
      });
      setStep('review'); // Revert to review step on failure
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'uploading':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">Performing {action} on {selectedMatches.length} connections...</p>
            <p className="text-muted-foreground">This may take a moment.</p>
          </div>
        );
    case 'review':
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Review Matches</CardTitle>
                        <CardDescription>We found {matches.length} potential matches. Select the connections you want to {action}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="rounded-md border max-h-[50vh] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox 
                                                checked={selectedMatches.length === matches.length}
                                                onCheckedChange={(checked) => {
                                                    setSelectedMatches(checked ? matches.map(m => m.connection.id) : []);
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>Matched On</TableHead>
                                        <TableHead>Your File Data</TableHead>
                                        <TableHead>Existing Connection Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {matches.map((match) => (
                                        <TableRow key={match.connection.id}>
                                            <TableCell>
                                                 <Checkbox 
                                                    checked={selectedMatches.includes(match.connection.id)}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedMatches(prev => 
                                                            checked ? [...prev, match.connection.id] : prev.filter(id => id !== match.connection.id)
                                                        );
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                {match.reasons.map((reason: string) => (
                                                    <Badge key={reason} variant="secondary">{reason}</Badge>
                                                ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {Object.entries(match.fileRow).map(([key, value]) => (
                                                   <div key={key}><span className="font-semibold">{key}:</span> {String(value)}</div>
                                                ))}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="font-bold text-base">{match.connection.name}</div>
                                                <div>{match.connection.email}</div>
                                                <div>{match.connection.phoneNumber}</div>
                                                <div>{match.connection.company}</div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => setStep('map')}>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to Mapping
                    </Button>
                    <div className="flex items-center gap-4">
                        <Select value={action} onValueChange={(value: ActionType) => setAction(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="delete">Bulk Delete</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAction} variant={action === 'delete' ? 'destructive' : 'default'}>
                            <Trash className="mr-2 h-4 w-4"/> {action.charAt(0).toUpperCase() + action.slice(1)} {selectedMatches.length} Connections
                        </Button>
                    </div>
                </div>
            </div>
        );
      case 'map':
        return (
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Map Your Columns</CardTitle>
                    <CardDescription>
                        Match the columns from your file to the fields in ConnectSphere to identify which connections to {action}.
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
            
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetState}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Back
              </Button>
              <Button onClick={handleFindMatches} disabled={isFinding}>
                {isFinding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                 Find Matches
              </Button>
            </div>
          </div>
        );

      case 'select':
      default:
        return (
          <div className="space-y-4">
            {!initialCompany && (
                 <div className="space-y-2">
                    <Label>Select Company Scope</Label>
                    <Select value={companyScope} onValueChange={(value: 'Mohan Financial' | 'Mohan Coaching' | 'All') => setCompanyScope(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a company scope"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Companies</SelectItem>
                            <SelectItem value="Mohan Financial">Mohan Financial</SelectItem>
                            <SelectItem value="Mohan Coaching">Mohan Coaching</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            )}
            <div>
              <Label htmlFor="file-upload">Upload CSV/Excel File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-2">
                  Select a file with a list of names or emails to perform bulk actions.
              </p>
            </div>
          </div>
        );
    }
  };

  return <div className="w-full">{renderContent()}</div>;
}

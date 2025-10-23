
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { findBulkMatches, bulkConnectionsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, ArrowLeft, Trash, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';

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
  const [selectedMatches, setSelectedMatches] = useState<{ [key: string]: string }>({});
  const [isFinding, setIsFinding] = useState(false);
  const [companyScope, setCompanyScope] = useState<'Mohan Financial' | 'Mohan Coaching' | 'All'>(initialCompany || 'All');

  const resetState = () => {
    setStep('select');
    setFile(null);
    setHeaders([]);
    setJsonData([]);
    setMapping({});
    setMatches([]);
    setSelectedMatches({});
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
      const fileJsonData = XLSX.utils.sheet_to_json(worksheet,{defval: ''});
      
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
            const initialSelections: { [key: string]: string } = {};
            result.matches.forEach(match => {
                if (match.options.length > 0) {
                    initialSelections[match.id] = match.options[0].connection.id;
                }
            });
            setSelectedMatches(initialSelections);
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

  const handleSelectionChange = (matchGroupId: string, connectionId: string) => {
    setSelectedMatches(prev => ({
        ...prev,
        [matchGroupId]: connectionId,
    }));
  };

  const handleAction = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const connectionIdsToDelete = Object.values(selectedMatches).filter(id => id !== 'ignore');

    if(connectionIdsToDelete.length === 0) {
        toast({ variant: 'destructive', title: 'No Selection', description: 'Please select at least one connection to perform the action on.' });
        return;
    }

    setStep('uploading');

    try {
      const result = await bulkConnectionsAction({
        connectionIds: connectionIdsToDelete,
        action,
      });

      if (!result) {
        throw new Error('An unexpected error occurred during the action.');
      }
      
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
  
  const getSelectedCount = () => {
    return Object.values(selectedMatches).filter(id => id !== 'ignore').length;
  }

  const renderContent = () => {
    switch (step) {
      case 'uploading':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">Performing {action} on {getSelectedCount()} connections...</p>
            <p className="text-muted-foreground">This may take a moment.</p>
          </div>
        );
    case 'review':
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Review Matches</CardTitle>
                        <CardDescription>We found {matches.length} potential matches from your file. Please review and select the connection to {action} for each row. The best match is selected by default.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="rounded-md border h-[50vh]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="w-1/3">Your File Data</TableHead>
                                        <TableHead>Potential Matches in ConnectSphere</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {matches.map((matchGroup) => (
                                        <TableRow key={matchGroup.id}>
                                            <TableCell className="text-sm align-top">
                                                <div className="space-y-1 pr-4">
                                                {Object.entries(matchGroup.fileRow).map(([key, value]) => (
                                                   <div key={key} className="truncate"><span className="font-semibold">{key}:</span> {String(value)}</div>
                                                ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <RadioGroup 
                                                    value={selectedMatches[matchGroup.id]} 
                                                    onValueChange={(connectionId) => handleSelectionChange(matchGroup.id, connectionId)}
                                                >
                                                    {matchGroup.options.map((option: any) => (
                                                        <div key={option.connection.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent">
                                                            <RadioGroupItem value={option.connection.id} id={`${matchGroup.id}-${option.connection.id}`} />
                                                            <Label htmlFor={`${matchGroup.id}-${option.connection.id}`} className="font-normal w-full">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="font-bold">{option.connection.name}</div>
                                                                        <div>{option.connection.email}</div>
                                                                        <div>{option.connection.phoneNumber}</div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1 items-end">
                                                                        {option.reasons.map((reason: string) => (
                                                                            <Badge key={reason} variant="secondary">{reason}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </Label>
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                                                        <RadioGroupItem value="ignore" id={`${matchGroup.id}-ignore`} />
                                                        <Label htmlFor={`${matchGroup.id}-ignore`} className="font-normal text-muted-foreground">None of these are a match. Ignore this row.</Label>
                                                    </div>
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
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
                        <Button onClick={handleAction} variant={action === 'delete' ? 'destructive' : 'default'} disabled={getSelectedCount() === 0}>
                            <Trash className="mr-2 h-4 w-4"/> {action.charAt(0).toUpperCase() + action.slice(1)} {getSelectedCount()} Connections
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
                <CardContent>
                    <ScrollArea className="h-60">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
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
                    </ScrollArea>
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

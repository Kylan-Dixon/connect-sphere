
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { addConnection } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { addDays, addWeeks, addMonths } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/datepicker';
import { Checkbox } from '@/components/ui/checkbox';

const tagsList = ['Connection', 'Referral'] as const;

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  linkedInUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  associatedCompany: z.enum(['Mohan Financial', 'Mohan Coaching'], {
    required_error: 'You need to select an associated company.',
  }),
  tags: z.array(z.enum(tagsList)).optional(),
  referrerName: z.string().optional(),
  reminderDate: z.date().optional(),
  notes: z.string().optional(),
}).refine(data => {
    if (data.tags?.includes('Referral')) {
        return !!data.referrerName && data.referrerName.length > 0;
    }
    return true;
}, {
    message: 'Referrer name is required when tag is "Referral".',
    path: ['referrerName'],
});

type FormValues = z.infer<typeof formSchema>;

interface AddConnectionFormProps {
  onSuccess?: () => void;
}

export function AddConnectionForm({ onSuccess }: AddConnectionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      linkedInUrl: '',
      company: '',
      title: '',
      tags: [],
      referrerName: '',
      notes: '',
    },
  });

  const watchedTags = form.watch('tags');
  const isReferral = watchedTags?.includes('Referral');

  const setReminderDate = (date: Date) => {
    form.setValue('reminderDate', date, { shouldValidate: true });
  };

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a connection.',
      });
      return;
    }

    const result = await addConnection(values);

    if (result.success) {
      toast({
        title: 'Success!',
        description: 'New connection has been added.',
      });
      form.reset();
      onSuccess?.();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'Failed to add connection.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="(123) 456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="associatedCompany"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Company</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Mohan Financial">Mohan Financial</SelectItem>
                  <SelectItem value="Mohan Coaching">Mohan Coaching</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="linkedInUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn Profile URL</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="CEO" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Tags</FormLabel>
              </div>
              {tagsList.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="tags"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        {isReferral && (
             <FormField
                control={form.control}
                name="referrerName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Referrer Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <FormField
          control={form.control}
          name="reminderDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Reminder Date</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <div className="flex space-x-2 pt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addDays(new Date(), 3))}>3 days</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addWeeks(new Date(), 1))}>1 week</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addMonths(new Date(), 3))}>3 months</Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any relevant notes here..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Connection"}
        </Button>
      </form>
    </Form>
  );
}

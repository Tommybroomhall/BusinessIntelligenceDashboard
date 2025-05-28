import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { productApi, type StockLevel } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be greater than 0'),
  costPrice: z.coerce.number().nonnegative('Cost price must be 0 or greater').optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  supplierUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  stockLevel: z.enum(['none', 'low', 'good', 'high']),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      costPrice: 0,
      category: '',
      imageUrl: '',
      supplierUrl: '',
      stockLevel: 'good',
    },
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product created',
        description: 'The product has been created successfully.',
        variant: 'success',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      // If there's an image file, upload it to Cloudinary first
      if (imageFile) {
        setIsUploading(true);
        try {
          const imageUrl = await uploadToCloudinary(imageFile);
          data.imageUrl = imageUrl;
          console.log('Image uploaded successfully:', imageUrl);
        } catch (error) {
          console.error('Image upload error:', error);

          // Show toast with error message
          toast({
            title: 'Upload Failed',
            description: error instanceof Error
              ? `${error.message}. Using placeholder image instead.`
              : 'Failed to upload image to Cloudinary. Using placeholder image instead.',
            variant: 'destructive',
          });

          // Use a placeholder image instead of failing completely
          data.imageUrl = 'https://placehold.co/300x300?text=Upload+Failed';

          // Continue with product creation despite image upload failure
          console.log('Continuing with placeholder image');
        } finally {
          setIsUploading(false);
        }
      } else if (!data.imageUrl) {
        // Use a placeholder if no image is provided
        data.imageUrl = 'https://placehold.co/300x300?text=No+Image';
      }

      // Create the product in the database
      const result = await createProduct.mutateAsync(data);

      // Show success toast
      toast({
        title: 'Product Added',
        description: `${data.name} has been successfully added to your inventory.`,
        variant: 'default',
      });

      // Reset the form
      form.reset();
      setImageFile(null);
      setImagePreview(null);

      // Call the onSuccess callback to close the dialog
      if (onSuccess) {
        onSuccess();
      }

      return result;
    } catch (error) {
      console.error('Error submitting form:', error);

      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter product description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Your purchase cost (not shown to customers)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Electronics, Clothing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Level*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="supplierUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Page Link</FormLabel>
              <FormControl>
                <Input placeholder="https://supplier.com/product" {...field} />
              </FormControl>
              <FormDescription>
                Link to the product on the supplier's website
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Product Image</FormLabel>
          <div className="flex flex-col gap-2">
            <div className="relative border border-input rounded-md w-full h-[100px] flex items-center justify-center cursor-pointer overflow-hidden">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              />

              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload size={20} />
                  <span className="text-xs">Click to upload or drag and drop</span>
                </div>
              )}
            </div>

            <FormDescription>
              Upload a product image to Cloudinary (recommended size: 300x300px)
            </FormDescription>
          </div>
        </FormItem>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createProduct.isPending || isUploading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {createProduct.isPending || isUploading ? 'Creating...' : 'Create Product'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

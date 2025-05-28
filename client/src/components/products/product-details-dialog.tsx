// ProductDetailsDialog
// -------------------
// A modal dialog for viewing and editing all fields of a product, including image upload, in a Shopify-style e-commerce dashboard.
// - Loads live product data from MongoDB using productApi.getById and react-query.
// - All fields are editable, including image (uses same upload logic as AddProductForm).
// - On save, updates the product in MongoDB via productApi.update.
// - UI/UX matches AddProductDialog and CustomerDetailsDialog for consistency.
// - No mock data; all data is live.
// - All errors are surfaced to the user via toast or visible error UI (fail loudly, no silent fallback).

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, type Product, type StockLevel } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Validation schema (reuse AddProductForm's schema)
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be greater than 0'),
  costPrice: z.coerce.number().nonnegative('Cost price must be 0 or greater').optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  supplierUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  stockLevel: z.enum(['none', 'low', 'good', 'high']),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductDetailsDialogProps {
  productId: string | number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({ productId, open, onOpenChange }: ProductDetailsDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [editMode, setEditMode] = React.useState(true); // Always editable as per requirements

  // Fetch product data
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Product | undefined>({
    queryKey: ['/api/products', productId],
    queryFn: () => (productId ? productApi.getById(productId) : Promise.resolve(undefined)),
    enabled: !!productId && open,
  });

  // Form setup
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
      isActive: true,
    },
  });

  // When product loads, reset form
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || '',
        description: product.description || '',
        price: product.price,
        costPrice: product.costPrice ?? 0,
        category: product.category || '',
        imageUrl: product.imageUrl || '',
        supplierUrl: product.supplierUrl || '',
        stockLevel: product.stockLevel as StockLevel,
        isActive: product.isActive,
      });
      setImagePreview(product.imageUrl || null);
      setImageFile(null);
    }
  }, [product, form]);

  // Image upload logic
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Save mutation
  const updateProduct = useMutation({
    mutationFn: (data: Partial<Product>) =>
      productApi.update(productId as string | number, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product updated',
        description: 'The product has been updated successfully.',
        variant: 'default',
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submit
  const onSubmit = async (data: FormValues) => {
    try {
      let imageUrl = data.imageUrl;
      if (imageFile) {
        setIsUploading(true);
        try {
          imageUrl = await uploadToCloudinary(imageFile);
        } catch (error) {
          toast({
            title: 'Upload Failed',
            description: 'Failed to upload image. Using previous image.',
            variant: 'destructive',
          });
        } finally {
          setIsUploading(false);
        }
      }
      // Remove stockLevel from the update since it's handled separately
      const { stockLevel, ...updateData } = data;
      updateProduct.mutate({ ...updateData, imageUrl });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Cancel handler
  const handleCancel = () => {
    onOpenChange(false);
    setImageFile(null);
    setImagePreview(product?.imageUrl || null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Edit all product details. Changes will be saved to your store.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading product...</span>
          </div>
        ) : isError || !product ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
            <p className="font-medium">Error loading product</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center overflow-hidden border">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Product" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block"
                  disabled={isUploading}
                />
              </div>
            </div>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input {...form.register('name')} disabled={isUploading} />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea {...form.register('description')} rows={3} disabled={isUploading} />
            </div>
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} disabled={isUploading} />
            </div>
            {/* Cost Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
              <Input type="number" step="0.01" {...form.register('costPrice', { valueAsNumber: true })} disabled={isUploading} />
            </div>
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Input {...form.register('category')} disabled={isUploading} />
            </div>
            {/* Supplier URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier URL</label>
              <Input {...form.register('supplierUrl')} disabled={isUploading} />
            </div>
            {/* Stock Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
              <Select
                value={form.watch('stockLevel')}
                onValueChange={async (val) => {
                  const stockLevel = val as StockLevel;
                  form.setValue('stockLevel', stockLevel);
                  try {
                    await productApi.updateStockLevel(productId as string | number, stockLevel);
                    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                    toast({
                      title: 'Stock Level Updated',
                      description: `Stock level has been updated to ${stockLevel}.`,
                      variant: 'default',
                    });
                  } catch (error) {
                    console.error('Failed to update stock level:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to update stock level. Please try again.',
                      variant: 'destructive',
                    });
                    // Revert the form value
                    form.setValue('stockLevel', product?.stockLevel || 'good');
                  }
                }}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stock level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Stock</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Active toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <select {...form.register('isActive')} disabled={isUploading}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            {/* Save/Cancel buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || updateProduct.status === 'pending'}>
                {isUploading || updateProduct.status === 'pending' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 
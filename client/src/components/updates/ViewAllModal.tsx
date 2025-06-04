import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Mail, 
  Package, 
  ShoppingCart, 
  Bell,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface ViewAllModalProps {
  open: boolean;
  type: 'messages' | 'stock' | 'orders' | 'notifications' | null;
  title: string;
  data: any[];
  onClose: () => void;
  onMarkMessageRead?: (messageId: string) => void;
  onDismissNotification?: (notificationId: string) => void;
  onOrderClick?: (order: any) => void;
  formatCurrency?: (amount: number) => string;
  formatDate?: (dateString: string) => string;
}

export function ViewAllModal({ 
  open, 
  type, 
  title, 
  data, 
  onClose,
  onMarkMessageRead,
  onDismissNotification,
  onOrderClick,
  formatCurrency,
  formatDate
}: ViewAllModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const getNotificationIcon = (notificationType: string) => {
    switch (notificationType) {
      case 'info':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const renderContent = () => {
    if (!currentData.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No items to display</p>
        </div>
      );
    }

    switch (type) {
      case 'messages':
        return (
          <div className="space-y-4">
            {currentData.map((message: any) => (
              <div key={message.id} className={`flex items-start p-4 rounded-lg border ${!message.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                <Mail className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{message.title}</p>
                    {!message.read && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">New</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{message.content}</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span className="font-medium">{message.sender}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate?.(message.date)}</span>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={async () => {
                      await onMarkMessageRead?.(message.id);
                      // Close and reopen modal to refresh data
                      onClose();
                    }}
                    disabled={message.read}
                  >
                    {message.read ? 'Read' : 'Mark Read'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'stock':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((alert: any) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.productName}</TableCell>
                  <TableCell>{alert.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={alert.currentStock <= 5 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                      {alert.currentStock} left
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.threshold}</TableCell>
                  <TableCell>{formatDate?.(alert.lastUpdated)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2">View</Button>
                    <Button size="sm">Order</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'orders':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((order: any) => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{formatCurrency?.(order.amount)}</TableCell>
                  <TableCell>{formatDate?.(order.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      order.status === "paid" ? "bg-green-100 text-green-800" :
                      order.status === "processing" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => onOrderClick?.(order)}
                    >
                      Details
                    </Button>
                    {order.status === "paid" && (
                      <Button
                        size="sm"
                        onClick={() => onOrderClick?.(order)}
                      >
                        Dispatch
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {currentData.map((notification: any) => (
              <div key={notification.id} className="flex items-start p-4 rounded-lg border border-gray-200 bg-white">
                <div className="mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Badge variant="outline" className="mr-2">
                      {notification.priority.toUpperCase()}
                    </Badge>
                    <span>{formatDate?.(notification.createdAt)}</span>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={async () => {
                      await onDismissNotification?.(notification.id);
                      // Close and reopen modal to refresh data  
                      onClose();
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} items
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          {renderContent()}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 
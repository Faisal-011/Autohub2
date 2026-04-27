"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddSaleForm } from './add-sale-form';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type SaleWithDetails = {
  id: string;
  carName: string;
  customerName: string;
  saleDate: Date;
  price: number;
};

type CarOption = { id: string; make: string; model: string; price: number; };
type CustomerOption = { id: string; name: string; };

type SalesTableProps = {
  sales: SaleWithDetails[];
  cars: CarOption[];
  customers: CustomerOption[];
}

export function SalesTable({ sales: initialSales, cars, customers }: SalesTableProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSaleRecorded = () => {
    router.refresh(); // Refresh the page to show new sale and updated car status
    setIsDialogOpen(false);
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Record Sale
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record New Sale</DialogTitle>
                </DialogHeader>
                <AddSaleForm 
                  onSaleRecorded={handleSaleRecorded}
                  cars={cars}
                  customers={customers}
                />
              </DialogContent>
            </Dialog>
        </div>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {initialSales.map((sale) => (
                    <TableRow key={sale.id}>
                    <TableCell className="font-medium">SALE-{sale.id}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{sale.carName}</TableCell>
                    <TableCell>{isClient ? format(new Date(sale.saleDate), 'PPP') : ''}</TableCell>
                    <TableCell className="text-right">${sale.price.toLocaleString()}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}

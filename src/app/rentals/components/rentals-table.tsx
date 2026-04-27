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
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { RentalWithDetails } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddRentalForm } from './add-rental-form';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type CarOption = { id: string; make: string; model: string; };
type CustomerOption = { id: string; name: string; };

type RentalsTableProps = {
  rentals: RentalWithDetails[];
  cars: CarOption[];
  customers: CustomerOption[];
};

export function RentalsTable({ rentals, cars, customers }: RentalsTableProps) {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const getStatusVariant = (status: RentalWithDetails['status']) => {
        return status === 'Active' ? 'default' : 'secondary';
    };

    const handleRentalAdded = () => {
      setIsDialogOpen(false);
      router.refresh();
    }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Rental
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Rental</DialogTitle>
              </DialogHeader>
              <AddRentalForm 
                onRentalAdded={handleRentalAdded}
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
                    <TableHead>Rental ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Fee</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {rentals.map((rental) => (
                    <TableRow key={rental.id}>
                    <TableCell className="font-medium">RENT-{rental.id}</TableCell>
                    <TableCell>{rental.customerName}</TableCell>
                    <TableCell>{rental.carName}</TableCell>
                    <TableCell>{isClient ? `${format(new Date(rental.startDate), 'PPP')} - ${format(new Date(rental.endDate), 'PPP')}` : ''}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(rental.status)}>{rental.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${rental.totalFee.toLocaleString()}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}

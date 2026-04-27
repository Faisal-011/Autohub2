"use client";

import { useState } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import type { Car } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddCarForm } from './add-car-form';


export function CarTable({ initialData }: { initialData: Car[] }) {
  const [cars, setCars] = useState<Car[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCarAdded = (newCar: Car) => {
    setCars(prev => [newCar, ...prev]);
    setIsDialogOpen(false);
  }

  const getStatusVariant = (status: Car['status']) => {
    switch (status) {
      case 'Available':
        return 'secondary';
      case 'Sold':
        return 'destructive';
      case 'Rented':
        return 'default';
      case 'Reserved':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Car
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Car</DialogTitle>
                </DialogHeader>
                <AddCarForm onCarAdded={handleCarAdded} />
              </DialogContent>
            </Dialog>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Make & Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell>
                    <Image
                      src={car.imageUrl}
                      alt={`${car.make} ${car.model}`}
                      width={80}
                      height={60}
                      className="rounded-md object-cover"
                      data-ai-hint={car.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{car.make} {car.model}</TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell>{car.mileage.toLocaleString()} mi</TableCell>
                  <TableCell>${car.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(car.status)}>{car.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

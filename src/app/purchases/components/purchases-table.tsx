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
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type SaleWithDetails = {
  id: string;
  carName: string;
  customerName: string;
  saleDate: Date;
  price: number;
};

type PurchasesTableProps = {
  sales: SaleWithDetails[];
}

export function PurchasesTable({ sales }: PurchasesTableProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

  return (
    <Card>
      <CardContent className="p-0">
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
                {sales.map((sale) => (
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

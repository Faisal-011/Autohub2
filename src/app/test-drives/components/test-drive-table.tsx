"use client";

import { useState, useEffect } from 'react';
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
import type { TestDriveWithDetails } from '@/lib/types';
import { format } from 'date-fns';

export function TestDriveTable({ initialData }: { initialData: TestDriveWithDetails[] }) {
  const [testDrives, setTestDrives] = useState<TestDriveWithDetails[]>(initialData);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStatusVariant = (status: TestDriveWithDetails['status']) => {
    switch (status) {
      case 'Scheduled':
        return 'default';
      case 'Completed':
        return 'secondary';
      case 'Canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testDrives.map((drive) => (
                <TableRow key={drive.id}>
                  <TableCell className="font-medium">{drive.customerName}</TableCell>
                  <TableCell>{drive.carName}</TableCell>
                  <TableCell>{isClient ? format(new Date(drive.date), "Pp") : ''}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(drive.status)}>{drive.status}</Badge>
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

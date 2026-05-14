import { describe, it, expect } from 'vitest';
import type { Car, Customer, Sale, Rental } from '@/lib/types';

describe('Car type', () => {
  it('accepts all valid status values', () => {
    const statuses: Car['status'][] = ['Available', 'Sold', 'Rented', 'Reserved'];
    statuses.forEach(status => {
      const car: Car = {
        id: '1', make: 'Toyota', model: 'Camry', year: 2022,
        mileage: 1000, price: 25000, status,
        imageUrl: 'https://example.com/img.jpg', imageHint: 'sedan',
      };
      expect(car.status).toBe(status);
    });
  });
});

describe('Customer type', () => {
  it('allows empty purchase history', () => {
    const customer: Customer = {
      id: '1', name: 'Alice', email: 'alice@example.com',
      phone: '123-456-7890', purchaseHistory: [],
    };
    expect(customer.purchaseHistory).toHaveLength(0);
  });

  it('allows multiple entries in purchase history', () => {
    const customer: Customer = {
      id: '1', name: 'Bob', email: 'bob@example.com',
      phone: '234-567-8901', purchaseHistory: ['sale-1', 'sale-2'],
    };
    expect(customer.purchaseHistory).toHaveLength(2);
  });
});

describe('Sale type', () => {
  it('holds a numeric price', () => {
    const sale: Sale = {
      id: 's1', carId: 'c1', customerId: 'cu1',
      saleDate: new Date('2024-01-15'), price: 39000,
    };
    expect(sale.price).toBe(39000);
    expect(sale.saleDate).toBeInstanceOf(Date);
  });
});

describe('Rental type', () => {
  it('computes duration from start and end dates', () => {
    const rental: Rental = {
      id: 'r1', carId: 'c1', customerId: 'cu1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-08'),
      totalFee: 700, status: 'Active',
    };
    const days = (rental.endDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(days).toBe(7);
  });
});

import type { Car, Customer, Appointment, TestDrive, Sale } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const initialCars: Car[] = [
  { id: '1', make: 'Toyota', model: 'Camry', year: 2022, mileage: 15000, price: 25000, status: 'Available', imageUrl: PlaceHolderImages[0].imageUrl, imageHint: PlaceHolderImages[0].imageHint },
  { id: '2', make: 'Honda', model: 'CR-V', year: 2021, mileage: 25000, price: 28000, status: 'Available', imageUrl: PlaceHolderImages[1].imageUrl, imageHint: PlaceHolderImages[1].imageHint },
  { id: '3', make: 'Ford', model: 'Mustang', year: 2023, mileage: 5000, price: 45000, status: 'Available', imageUrl: PlaceHolderImages[2].imageUrl, imageHint: PlaceHolderImages[2].imageHint },
  { id: '4', make: 'Tesla', model: 'Model 3', year: 2022, mileage: 12000, price: 40000, status: 'Sold', imageUrl: PlaceHolderImages[3].imageUrl, imageHint: PlaceHolderImages[3].imageHint },
  { id: '5', make: 'Chevrolet', model: 'Suburban', year: 2020, mileage: 45000, price: 50000, status: 'Rented', imageUrl: PlaceHolderImages[4].imageUrl, imageHint: PlaceHolderImages[4].imageHint },
  { id: '6', make: 'Jeep', model: 'Wrangler', year: 2021, mileage: 18000, price: 35000, status: 'Available', imageUrl: PlaceHolderImages[5].imageUrl, imageHint: PlaceHolderImages[5].imageHint },
];

export const initialCustomers: Customer[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', purchaseHistory: ['1'] },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901', purchaseHistory: [] },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012', purchaseHistory: [] },
];

export const initialAppointments: Appointment[] = [
  { id: '1', customerId: '2', carId: '1', date: new Date(new Date().setDate(new Date().getDate() + 2)), status: 'Scheduled' },
  { id: '2', customerId: '3', carId: '2', date: new Date(new Date().setDate(new Date().getDate() + 3)), status: 'Scheduled' },
];

export const initialTestDrives: TestDrive[] = [
  { id: '1', customerId: '2', carId: '3', date: new Date(new Date().setDate(new Date().getDate() + 5)), status: 'Scheduled' },
];

export const initialSales: Sale[] = [
  { id: '1', carId: '4', customerId: '1', saleDate: new Date('2023-10-15'), price: 39000 },
];

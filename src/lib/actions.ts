'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Appointment, Car, Customer, Rental, Sale, TestDrive } from './types';
import { dbErrorCounter, dbQueryDuration, businessEventCounter } from '@/lib/metrics';

export async function addCustomer(formData: FormData): Promise<Customer | { error: string }> {
  const supabase = await createClient();

  const rawFormData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
  };

  if (!rawFormData.name || !rawFormData.email || !rawFormData.phone) {
    return { error: 'Missing required fields.' };
  }

  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        name: rawFormData.name,
        email: rawFormData.email,
        phone: rawFormData.phone,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding customer:', error);
    return { error: `Failed to add customer. ${error.message}` };
  }
  
  revalidatePath('/customers');

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    purchaseHistory: [],
  };
}

export async function addTestDrive(formData: FormData): Promise<TestDrive | { error: string }> {
  const supabase = await createClient();

  const rawFormData = {
    customerId: formData.get('customerId') as string,
    carId: formData.get('carId') as string,
    date: formData.get('date') as string,
  };
  
  if (!rawFormData.customerId || !rawFormData.carId || !rawFormData.date) {
    return { error: 'Missing required fields.' };
  }

  const { data, error } = await supabase
    .from('test_drives')
    .insert([
      {
        customer_id: rawFormData.customerId,
        car_id: rawFormData.carId,
        date: rawFormData.date,
        status: 'Scheduled',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding test drive:', error);
    return { error: `Failed to book test drive. ${error.message}` };
  }

  revalidatePath('/test-drives');
  
  return {
    id: data.id,
    customerId: data.customer_id,
    carId: data.car_id,
    date: new Date(data.date),
    status: data.status,
  };
}

export async function addCar(formData: FormData): Promise<Car | { error: string }> {
  const supabase = await createClient();

  const rawFormData = {
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      year: Number(formData.get('year')),
      mileage: Number(formData.get('mileage')),
      price: Number(formData.get('price')),
      image_url: formData.get('image_url') as string,
  };

  if (!rawFormData.make || !rawFormData.model || !rawFormData.year || !rawFormData.price || !rawFormData.image_url) {
    return { error: 'Missing required fields.' };
  }

  const { data, error } = await supabase
    .from('cars')
    .insert([{ 
      make: rawFormData.make,
      model: rawFormData.model,
      year: rawFormData.year,
      mileage: rawFormData.mileage,
      price: rawFormData.price,
      status: 'Available', 
      image_url: rawFormData.image_url, 
      image_hint: `${rawFormData.make} ${rawFormData.model}` 
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding car:', error);
    return { error: `Failed to add car. ${error.message}` };
  }

  revalidatePath('/inventory');

  return {
    id: data.id,
    make: data.make,
    model: data.model,
    year: data.year,
    mileage: data.mileage,
    price: data.price,
    status: data.status,
    imageUrl: data.image_url,
    imageHint: data.image_hint,
  };
}

export async function addAppointment(formData: FormData): Promise<Appointment | { error: string }> {
  const supabase = await createClient();

  const rawFormData = {
    customerId: formData.get('customerId') as string,
    carId: formData.get('carId') as string,
    date: formData.get('date') as string,
  };

  if (!rawFormData.customerId || !rawFormData.carId || !rawFormData.date) {
    return { error: 'Missing required fields.' };
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert([{ 
      customer_id: rawFormData.customerId, 
      car_id: rawFormData.carId, 
      date: rawFormData.date,
      status: 'Scheduled',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding appointment:', error);
    return { error: `Failed to add appointment. ${error.message}` };
  }

  revalidatePath('/bookings');

  return {
    id: data.id,
    customerId: data.customer_id,
    carId: data.car_id,
    date: new Date(data.date),
    status: data.status,
  };
}

export async function addRental(formData: FormData): Promise<Rental | { error: string }> {
    const supabase = await createClient();
  
    const rawFormData = {
      carId: formData.get('carId') as string,
      customerId: formData.get('customerId') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      totalFee: Number(formData.get('totalFee')),
    };
    
    if (!rawFormData.carId || !rawFormData.customerId || !rawFormData.startDate || !rawFormData.endDate || !rawFormData.totalFee) {
      return { error: 'Missing required fields.' };
    }

    const end = dbQueryDuration.startTimer({ operation: 'insert', table: 'rentals' });
    const { data: rentalData, error: rentalError } = await supabase
      .from('rentals')
      .insert({
          car_id: rawFormData.carId,
          customer_id: rawFormData.customerId,
          start_date: rawFormData.startDate,
          end_date: rawFormData.endDate,
          total_fee: rawFormData.totalFee,
          status: 'Active',
      })
      .select()
      .single();
    end();

    if (rentalError) {
      dbErrorCounter.inc({ operation: 'insert', table: 'rentals' });
      businessEventCounter.inc({ event_type: 'rental', status: 'failed' });
      console.error('Error creating rental:', rentalError);
      return { error: `Failed to create rental. ${rentalError.message}` };
    }

    businessEventCounter.inc({ event_type: 'rental', status: 'success' });

    const { error: carUpdateError } = await supabase
      .from('cars')
      .update({ status: 'Rented' })
      .eq('id', rawFormData.carId);

    if (carUpdateError) {
      dbErrorCounter.inc({ operation: 'update', table: 'cars' });
      console.error('Error updating car status:', carUpdateError);
      return { error: `Failed to update car status. ${carUpdateError.message}` };
    }
  
    revalidatePath('/rentals');
    revalidatePath('/inventory');

    return {
      id: rentalData.id,
      carId: rentalData.car_id,
      customerId: rentalData.customer_id,
      startDate: new Date(rentalData.start_date),
      endDate: new Date(rentalData.end_date),
      totalFee: rentalData.total_fee,
      status: rentalData.status,
    };
}


export async function recordSale(formData: FormData): Promise<Sale | { error: string }> {
  const supabase = await createClient();

  const rawFormData = {
    carId: formData.get('carId') as string,
    customerId: formData.get('customerId') as string,
    price: Number(formData.get('price')),
    saleDate: formData.get('saleDate') as string,
  };

  if (!rawFormData.carId || !rawFormData.customerId || !rawFormData.price || !rawFormData.saleDate) {
    return { error: 'Missing required fields.' };
  }

  const end = dbQueryDuration.startTimer({ operation: 'insert', table: 'sales' });
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert({
      car_id: rawFormData.carId,
      customer_id: rawFormData.customerId,
      price: rawFormData.price,
      sale_date: rawFormData.saleDate,
    })
    .select()
    .single();
  end();

  if (saleError) {
    dbErrorCounter.inc({ operation: 'insert', table: 'sales' });
    businessEventCounter.inc({ event_type: 'sale', status: 'failed' });
    console.error('Error recording sale:', saleError);
    return { error: `Failed to record sale. ${saleError.message}` };
  }

  businessEventCounter.inc({ event_type: 'sale', status: 'success' });

  const { error: carUpdateError } = await supabase
    .from('cars')
    .update({ status: 'Sold' })
    .eq('id', rawFormData.carId);
  
  if (carUpdateError) {
    dbErrorCounter.inc({ operation: 'update', table: 'cars' });
    console.error('Error updating car status:', carUpdateError);
    return { error: `Failed to update car status. ${carUpdateError.message}` };
  }


  revalidatePath('/sales');
  revalidatePath('/inventory');

  return {
    id: saleData.id,
    carId: saleData.car_id,
    customerId: saleData.customer_id,
    price: saleData.price,
    saleDate: new Date(saleData.sale_date),
  };
}

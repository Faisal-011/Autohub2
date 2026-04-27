// These types are for display purposes in the UI components
// They use camelCase properties

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  status: 'Available' | 'Sold' | 'Rented' | 'Reserved';
  imageUrl: string;
  imageHint: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  purchaseHistory: string[]; // array of sale IDs
};

export type Appointment = {
  id:string;
  customerId: string;
  carId: string;
  date: Date;
  status: 'Scheduled' | 'Completed' | 'Canceled';
};

export type TestDrive = {
  id: string;
  customerId: string;
  carId: string;
  date: Date;
  status: 'Scheduled' | 'Completed' | 'Canceled';
};

export type Sale = {
  id: string;
  carId: string;
  customerId: string;
  saleDate: Date;
  price: number;
};

export type Rental = {
  id: string;
  carId: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  totalFee: number;
  status: 'Active' | 'Completed';
};


// These types represent the data structure in the Supabase database
// They use snake_case for properties to match the table columns

export type DBCar = {
    id: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
    status: 'Available' | 'Sold' | 'Rented' | 'Reserved';
    image_url: string;
    image_hint: string;
  };
  
  export type DBCustomer = {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  
  export type DBAppointment = {
    id:string;
    customer_id: string;
    car_id: string;
    date: string; // Dates are strings from Supabase
    status: 'Scheduled' | 'Completed' | 'Canceled';
  };
  
  export type DBTestDrive = {
    id: string;
    customer_id: string;
    car_id: string;
    date: string; // Dates are strings from Supabase
    status: 'Scheduled' | 'Completed' | 'Canceled';
  };
  
  export type DBSale = {
    id: string;
    car_id: string;
    customer_id: string;
    sale_date: string; // Dates are strings from Supabase
    price: number;
  };

  export type DBRental = {
    id: string;
    car_id: string;
    customer_id: string;
    start_date: string;
    end_date: string;
    total_fee: number;
    status: 'Active' | 'Completed';
  };

export type AppointmentWithDetails = Appointment & {
  customerName: string;
  carName: string;
};
  
export type TestDriveWithDetails = TestDrive & {
  customerName: string;
  carName: string;
};

export type RentalWithDetails = Rental & {
  customerName: string;
  carName: string;
};

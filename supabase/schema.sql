-- Drop existing tables and types to avoid conflicts
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS test_drives CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TYPE IF EXISTS car_status;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS record_sale(uuid, uuid, integer, timestamp with time zone);

-- Recreate the car_status type
CREATE TYPE car_status AS ENUM ('Available', 'Sold', 'Rented', 'Reserved');

-- Create the customers table
CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL
);

-- Create the cars table
CREATE TABLE cars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    make text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    mileage integer NOT NULL,
    price integer NOT NULL,
    image_url text NOT NULL,
    image_hint text,
    status car_status NOT NULL DEFAULT 'Available'
);

-- Create the appointments table
CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES customers(id),
    car_id uuid REFERENCES cars(id),
    date timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'Scheduled'
);

-- Create the test_drives table
CREATE TABLE test_drives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES customers(id),
    car_id uuid REFERENCES cars(id),
    date timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'Scheduled'
);

-- Create the sales table
CREATE TABLE sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id uuid REFERENCES cars(id) UNIQUE,
    customer_id uuid REFERENCES customers(id),
    sale_date timestamp with time zone NOT NULL,
    price integer NOT NULL
);

-- Create the rentals table
CREATE TABLE rentals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id uuid REFERENCES cars(id),
    customer_id uuid REFERENCES customers(id),
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    total_fee integer NOT NULL,
    status text NOT NULL DEFAULT 'Active'
);

-- Create the record_sale function
CREATE OR REPLACE FUNCTION record_sale(
    p_car_id uuid,
    p_customer_id uuid,
    p_price integer,
    p_sale_date timestamp with time zone
)
RETURNS void AS $$
BEGIN
    -- Insert the new sale record
    INSERT INTO sales (car_id, customer_id, price, sale_date)
    VALUES (p_car_id, p_customer_id, p_price, p_sale_date);

    -- Update the car's status to 'Sold'
    UPDATE cars
    SET status = 'Sold'
    WHERE id = p_car_id;
END;
$$ LANGUAGE plpgsql;

-- Seed initial data (optional, but good for development)

-- Seed Customers
INSERT INTO customers (id, name, email, phone) VALUES
('8a8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e', 'Alice Johnson', 'alice@example.com', '123-456-7890'),
('9b9b9b9b-9b9b-9b9b-9b9b-9b9b9b9b9b9b', 'Bob Williams', 'bob@example.com', '234-567-8901'),
('1c1c1c1c-1c1c-1c1c-1c1c-1c1c1c1c1c1c', 'Charlie Brown', 'charlie@example.com', '345-678-9012');

-- Seed Cars
INSERT INTO cars (id, make, model, year, mileage, price, image_url, image_hint, status) VALUES
('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 'Toyota', 'Camry', 2022, 15000, 25000, 'https://images.unsplash.com/photo-1757782630216-9804d549afc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxyZWQlMjBzZWRhbnxlbnwwfHx8fDE3NjQ1OTIyNjl8MA&ixlib=rb-4.1.0&q=80&w=1080', 'red sedan', 'Available'),
('2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 'Honda', 'CR-V', 2021, 25000, 28000, 'https://images.unsplash.com/photo-1650938918197-d581a4cda022?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxibHVlJTIwc3V2fGVufDB8fHx8MTc2NDU2MTMyNXww&ixlib=rb-4.1.0&q=80&w=1080', 'blue suv', 'Available'),
('3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 'Ford', 'Mustang', 2023, 5000, 45000, 'https://images.unsplash.com/photo-1700461213583-32c00ffcb4de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx3aGl0ZSUyMGNvbnZlcnRpYmxlfGVufDB8fHx8MTc2NDUzODQ0NHww&ixlib=rb-4.1.0&q=80&w=1080', 'white convertible', 'Available'),
('4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 'Tesla', 'Model 3', 2022, 12000, 40000, 'https://images.unsplash.com/photo-1612095977457-0f2a6354574c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxibGFjayUyMHNwb3J0c2NhcnxlbnwwfHx8fDE3NjQ2MjA2NDF8MA&ixlib=rb-4.1.0&q=80&w=1080', 'black sportscar', 'Sold'),
('5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', 'Chevrolet', 'Suburban', 2020, 45000, 50000, 'https://images.unsplash.com/photo-1665064953802-eb2b6b216e6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxncmF5JTIwbWluaXZhbnxlbnwwfHx8fDE3NjQ2MjA2NDF8MA&ixlib=rb-4.1.0&q=80&w=1080', 'gray minivan', 'Rented');

-- Seed a sale for the 'Sold' car
INSERT INTO sales (car_id, customer_id, sale_date, price) VALUES
('4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', '8a8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e', '2023-10-15T10:00:00Z', 39000);

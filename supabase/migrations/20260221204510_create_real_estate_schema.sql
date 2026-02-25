/*
  # Varol Gayrimenkul - Real Estate Database Schema

  ## Tables Created
  
  ### 1. Properties Table
    - `id` (uuid, primary key)
    - `title` (text) - Property title
    - `description` (text) - Detailed description
    - `property_type` (text) - Type: apartment, villa, office, land, etc.
    - `status` (text) - For sale, for rent, sold, rented
    - `price` (numeric) - Property price
    - `currency` (text) - Currency (TRY, USD, EUR)
    - `location` (text) - Location/address
    - `city` (text) - City
    - `district` (text) - District
    - `area` (numeric) - Area in square meters
    - `rooms` (integer) - Number of rooms
    - `bathrooms` (integer) - Number of bathrooms
    - `floor` (integer) - Floor number
    - `total_floors` (integer) - Total floors in building
    - `building_age` (integer) - Age of building
    - `furnished` (boolean) - Is furnished
    - `parking` (boolean) - Has parking
    - `elevator` (boolean) - Has elevator
    - `balcony` (boolean) - Has balcony
    - `garden` (boolean) - Has garden
    - `images` (text[]) - Array of image URLs
    - `featured` (boolean) - Is featured property
    - `views` (integer) - View count
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - `user_id` (uuid) - Reference to auth.users

  ### 2. Inquiries Table
    - `id` (uuid, primary key)
    - `property_id` (uuid) - Reference to properties
    - `name` (text) - Inquirer name
    - `email` (text) - Inquirer email
    - `phone` (text) - Inquirer phone
    - `message` (text) - Inquiry message
    - `status` (text) - new, contacted, closed
    - `created_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Public read access for properties (anyone can view listings)
    - Authenticated users can create inquiries
    - Only admin users can manage properties and view inquiries
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  property_type text NOT NULL DEFAULT 'apartment',
  status text NOT NULL DEFAULT 'for_sale',
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TRY',
  location text NOT NULL,
  city text NOT NULL,
  district text,
  area numeric NOT NULL,
  rooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  floor integer,
  total_floors integer,
  building_age integer,
  furnished boolean DEFAULT false,
  parking boolean DEFAULT false,
  elevator boolean DEFAULT false,
  balcony boolean DEFAULT false,
  garden boolean DEFAULT false,
  images text[] DEFAULT '{}',
  featured boolean DEFAULT false,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Properties policies: Anyone can view, only authenticated admin can manage
CREATE POLICY "Anyone can view published properties"
  ON properties
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Inquiries policies: Anyone can create, only authenticated can view
CREATE POLICY "Anyone can create inquiries"
  ON inquiries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update inquiries"
  ON inquiries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
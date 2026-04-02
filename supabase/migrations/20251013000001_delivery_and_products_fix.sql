/*
  1. Add delivery_fee to products table (was missing — caused 400 on product insert)
  2. Add weight_class to orders
  3. Create rider_applications table for NIN + facial verification
  4. Create delivery_requests table (rider requests from sellers)
*/

-- Fix 1: Add missing delivery_fee column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0 CHECK (delivery_fee >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_class text DEFAULT 'small' CHECK (weight_class IN ('small','medium','heavy'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS pickup_location text;

-- Fix 2: Extend orders with weight and smart delivery pricing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight_class text DEFAULT 'small' CHECK (weight_class IN ('small','medium','heavy'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km decimal(8,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_within_community boolean DEFAULT true;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price_breakdown jsonb;

-- Fix 3: Rider applications / verification
CREATE TABLE IF NOT EXISTS rider_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  nin text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  vehicle_type text DEFAULT 'bike' CHECK (vehicle_type IN ('bike','drone','car')),
  selfie_url text,
  nin_verified boolean DEFAULT false,
  nin_verify_response jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id)
);

ALTER TABLE rider_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rider_app_select" ON rider_applications FOR SELECT USING (true);
CREATE POLICY "rider_app_insert" ON rider_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "rider_app_update" ON rider_applications FOR UPDATE USING (true) WITH CHECK (true);

-- Fix 4: Delivery requests (seller requests a rider for an order)
CREATE TABLE IF NOT EXISTS delivery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rider_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'open' CHECK (status IN ('open','accepted','picked_up','delivered','cancelled')),
  weight_class text DEFAULT 'small' CHECK (weight_class IN ('small','medium','heavy')),
  pickup_address text,
  delivery_address text,
  distance_km decimal(8,2),
  delivery_fee numeric DEFAULT 0,
  is_within_community boolean DEFAULT true,
  estimated_minutes integer,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  delivered_at timestamptz
);

ALTER TABLE delivery_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dr_select" ON delivery_requests FOR SELECT USING (true);
CREATE POLICY "dr_insert" ON delivery_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "dr_update" ON delivery_requests FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_rider ON delivery_requests(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_applications_user ON rider_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_rider_applications_status ON rider_applications(status);


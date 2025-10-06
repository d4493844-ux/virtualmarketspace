/*
  # Add Wallet, Orders and Admin Systems

  1. New Tables
    - `wallets` - User wallet balances
    - `transactions` - Wallet transaction history
    - `orders` - Track orders between buyers and sellers
    - `admins` - Admin user accounts

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated access
*/

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance decimal(15,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallets' AND policyname = 'Users can view own wallet'
  ) THEN
    CREATE POLICY "Users can view own wallet"
      ON wallets FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wallets' AND policyname = 'Users can update own wallet'
  ) THEN
    CREATE POLICY "Users can update own wallet"
      ON wallets FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment_received', 'payment_sent')),
  amount decimal(15,2) NOT NULL CHECK (amount > 0),
  description text,
  reference text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
      ON transactions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM wallets
          WHERE wallets.id = transactions.wallet_id
          AND wallets.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1 NOT NULL CHECK (quantity > 0),
  total_amount decimal(15,2) NOT NULL CHECK (total_amount >= 0),
  delivery_method text DEFAULT 'vms_standard' CHECK (delivery_method IN ('vms_standard', 'vms_drone', 'manual')),
  delivery_address text,
  delivery_fee decimal(15,2) DEFAULT 0.00,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Users can view own orders'
  ) THEN
    CREATE POLICY "Users can view own orders"
      ON orders FOR SELECT
      TO authenticated
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Buyers can create orders'
  ) THEN
    CREATE POLICY "Buyers can create orders"
      ON orders FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = buyer_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Users can update own orders'
  ) THEN
    CREATE POLICY "Users can update own orders"
      ON orders FOR UPDATE
      TO authenticated
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
      WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
END $$;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'moderator' CHECK (role IN ('super_admin', 'moderator')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_wallet_timestamp_trigger') THEN
    CREATE TRIGGER update_wallet_timestamp_trigger
      BEFORE UPDATE ON wallets
      FOR EACH ROW
      EXECUTE FUNCTION update_wallet_timestamp();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_order_timestamp_trigger') THEN
    CREATE TRIGGER update_order_timestamp_trigger
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_order_timestamp();
  END IF;
END $$;

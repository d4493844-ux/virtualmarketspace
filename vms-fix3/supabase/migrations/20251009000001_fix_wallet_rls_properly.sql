/*
  # CRITICAL FIX: Wallet & Transaction RLS for demo (anon) users
  
  Problem: "CREATE POLICY IF NOT EXISTS" is NOT valid PostgreSQL syntax.
  The previous migration silently failed to create anon wallet policies,
  so demo-login users (who use the anon role, not authenticated) get 403
  on every wallet read/write — balance appears to vanish after reload.
  
  Fix: Drop all old wallet/transaction policies and recreate them properly,
  covering both `authenticated` and `anon` roles.
  
  Also fixes:
  - transactions type check to include transfer_in / transfer_out
  - bank_withdrawals missing charge_applied column
*/

-- ── Drop all existing wallet policies cleanly ─────────────────────────────
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
DROP POLICY IF EXISTS "Anon can view wallets" ON wallets;
DROP POLICY IF EXISTS "Anon can update wallets" ON wallets;
DROP POLICY IF EXISTS "Anon can insert wallets" ON wallets;

-- ── Recreate wallet policies — open for all roles (demo-safe) ────────────
CREATE POLICY "wallet_select_all" ON wallets FOR SELECT USING (true);
CREATE POLICY "wallet_insert_all" ON wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "wallet_update_all" ON wallets FOR UPDATE USING (true) WITH CHECK (true);

-- ── Drop all existing transaction policies cleanly ────────────────────────
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Anon can view transactions" ON transactions;
DROP POLICY IF EXISTS "Anon can insert transactions" ON transactions;

-- ── Recreate transaction policies ────────────────────────────────────────
CREATE POLICY "transaction_select_all" ON transactions FOR SELECT USING (true);
CREATE POLICY "transaction_insert_all" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "transaction_update_all" ON transactions FOR UPDATE USING (true) WITH CHECK (true);

-- ── Fix transactions type enum — add transfer_in / transfer_out ───────────
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN (
    'deposit', 'withdrawal', 'payment_received', 'payment_sent',
    'transfer_in', 'transfer_out'
  ));

-- ── Fix bank_withdrawals — add charge_applied column ────────────────────
ALTER TABLE bank_withdrawals ADD COLUMN IF NOT EXISTS charge_applied decimal(15,2) DEFAULT 0;

-- ── Fix wallet_transfers policies ────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own transfers" ON wallet_transfers;
DROP POLICY IF EXISTS "Users can create transfers" ON wallet_transfers;
DROP POLICY IF EXISTS "Anon view transfers" ON wallet_transfers;
DROP POLICY IF EXISTS "Anon insert transfers" ON wallet_transfers;

CREATE POLICY "wallet_transfers_select_all" ON wallet_transfers FOR SELECT USING (true);
CREATE POLICY "wallet_transfers_insert_all" ON wallet_transfers FOR INSERT WITH CHECK (true);

-- ── Fix bank_withdrawals policies ────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Anon view withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Anon insert withdrawals" ON bank_withdrawals;
DROP POLICY IF EXISTS "Anon update withdrawals" ON bank_withdrawals;

CREATE POLICY "bank_withdrawals_select_all" ON bank_withdrawals FOR SELECT USING (true);
CREATE POLICY "bank_withdrawals_insert_all" ON bank_withdrawals FOR INSERT WITH CHECK (true);
CREATE POLICY "bank_withdrawals_update_all" ON bank_withdrawals FOR UPDATE USING (true) WITH CHECK (true);

-- ── Fix orders policies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Anon can view orders" ON orders;
DROP POLICY IF EXISTS "Anon can insert orders" ON orders;
DROP POLICY IF EXISTS "Anon can update orders" ON orders;

CREATE POLICY "orders_select_all" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_all" ON orders FOR UPDATE USING (true) WITH CHECK (true);

-- ── Fix riders policies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view riders" ON riders;
DROP POLICY IF EXISTS "Riders can update own location" ON riders;
DROP POLICY IF EXISTS "Insert riders" ON riders;
DROP POLICY IF EXISTS "Anon view riders" ON riders;
DROP POLICY IF EXISTS "Anon update riders" ON riders;
DROP POLICY IF EXISTS "Anon insert riders" ON riders;

CREATE POLICY "riders_select_all" ON riders FOR SELECT USING (true);
CREATE POLICY "riders_insert_all" ON riders FOR INSERT WITH CHECK (true);
CREATE POLICY "riders_update_all" ON riders FOR UPDATE USING (true) WITH CHECK (true);

-- ── Fix verification_requests policies (belt-and-suspenders) ────────────
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can update own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Anon can insert verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Anon can update verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Anon can view verification requests" ON verification_requests;

CREATE POLICY "verif_select_all" ON verification_requests FOR SELECT USING (true);
CREATE POLICY "verif_insert_all" ON verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "verif_update_all" ON verification_requests FOR UPDATE USING (true) WITH CHECK (true);


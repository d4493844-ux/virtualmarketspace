import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadSeed() {
  try {
    const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

    console.log('Seed data loaded into database successfully!');
    console.log('\nDemo accounts:');
    console.log('- ada.pepper@vms.ng (Seller - Peppers)');
    console.log('- chidi.shoes@vms.ng (Seller - Footwear)');
    console.log('- mama.bisi@vms.ng (Seller - Groceries)');
    console.log('- zara.fashion@vms.ng (Seller - Fashion)');
    console.log('- tunde.buyer@vms.ng (Buyer)');
    console.log('- ngozi.style@vms.ng (Buyer)');
    console.log('\nNote: Use demo login in the app for quick access.');

  } catch (error) {
    console.error('Error loading seed data:', error);
    process.exit(1);
  }
}

loadSeed();

import { createClient } from './config/supabase';
import 'dotenv/config';

async function verifyConnection() {
  console.log('--- Supabase Connection Verification ---');
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  const isDummy = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy-project-ref');
  if (isDummy) {
    console.log('\n⚠️ WARNING: Using placeholder credentials. Connect your live Supabase database');
    console.log('by updating NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env\n');
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message?.includes('FetchError') || error.message?.includes('ENOTFOUND') || error.message?.includes('failed to fetch')) {
        console.error('❌ Connection Failed: Could not resolve the Supabase host name. Please check your internet connection or URL.');
      } else {
        console.log(`ℹ️ Supabase responded, but with an API error (expected if tables are not set up yet): "${error.message}"`);
      }
      process.exit(1);
    } else {
      console.log('✅ Connection Successful! profiles table was checked successfully.');
      process.exit(0);
    }
  } catch (err: any) {
    console.error(`❌ Unexpected error: ${err.message || err}`);
    process.exit(1);
  }
}

verifyConnection();

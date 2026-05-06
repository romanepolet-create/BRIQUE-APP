// importData.js
require('dotenv').config(); // If you are using .env for your keys
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 1. Initialize Supabase (get these from Project Settings > API)
const supabaseUrl = 'https://mtvzhpqticnxqcxsadkg.supabase.co/rest/v1/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dnpocHF0aWNueHFjeHNhZGtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTc1MCwiZXhwIjoyMDkzNjA1NzUwfQ.r2JXBf8hLrukjKOLQFlVqCBXDx8AjxlgVMGKir1a55U'; // Use service_role for bypassing RLS during import
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadJson() {
  try {
    // 2. Read your JSON file
    const rawData = fs.readFileSync('./distrib');
    const distributeursData = JSON.parse(rawData);

    // 3. Insert into Supabase
    const { data, error } = await supabase
      .from('distributeurs')
      .insert(distributeursData);

    if (error) throw error;
    console.log('Successfully imported JSON data!', data);
    
  } catch (err) {
    console.error('Error importing data:', err.message);
  }
}

uploadJson();

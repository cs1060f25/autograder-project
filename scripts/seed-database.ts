/**
 * Database Seeding Script
 * 
 * This script creates auth users and seeds the database with mock data
 * Run with: npx tsx scripts/seed-database.ts
 * 
 * Prerequisites:
 * - Install tsx: npm install -D tsx
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock users data
const MOCK_USERS = [
  // Instructors
  { id: '11111111-1111-1111-1111-111111111111', email: 'instructor1@university.edu', password: 'password123', firstName: 'Sarah', lastName: 'Smith', role: 'instructor' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'instructor2@university.edu', password: 'password123', firstName: 'Michael', lastName: 'Johnson', role: 'instructor' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'instructor3@university.edu', password: 'password123', firstName: 'Emily', lastName: 'Williams', role: 'instructor' },
  
  // TAs
  { id: '44444444-4444-4444-4444-444444444444', email: 'ta1@university.edu', password: 'password123', firstName: 'Alex', lastName: 'Chen', role: 'ta' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'ta2@university.edu', password: 'password123', firstName: 'Jordan', lastName: 'Martinez', role: 'ta' },
  { id: '66666666-6666-6666-6666-666666666666', email: 'ta3@university.edu', password: 'password123', firstName: 'Taylor', lastName: 'Brown', role: 'ta' },
  { id: '77777777-7777-7777-7777-777777777777', email: 'ta4@university.edu', password: 'password123', firstName: 'Morgan', lastName: 'Davis', role: 'ta' },
  { id: '88888888-8888-8888-8888-888888888888', email: 'ta5@university.edu', password: 'password123', firstName: 'Casey', lastName: 'Wilson', role: 'ta' },
  
  // Students
  { id: 'a1111111-1111-1111-1111-111111111111', email: 'student1@university.edu', password: 'password123', firstName: 'Alice', lastName: 'Anderson', role: 'student' },
  { id: 'a2222222-2222-2222-2222-222222222222', email: 'student2@university.edu', password: 'password123', firstName: 'Bob', lastName: 'Baker', role: 'student' },
  { id: 'a3333333-3333-3333-3333-333333333333', email: 'student3@university.edu', password: 'password123', firstName: 'Carol', lastName: 'Carter', role: 'student' },
  { id: 'a4444444-4444-4444-4444-444444444444', email: 'student4@university.edu', password: 'password123', firstName: 'David', lastName: 'Davis', role: 'student' },
  { id: 'a5555555-5555-5555-5555-555555555555', email: 'student5@university.edu', password: 'password123', firstName: 'Emma', lastName: 'Evans', role: 'student' },
  { id: 'a6666666-6666-6666-6666-666666666666', email: 'student6@university.edu', password: 'password123', firstName: 'Frank', lastName: 'Foster', role: 'student' },
  { id: 'a7777777-7777-7777-7777-777777777777', email: 'student7@university.edu', password: 'password123', firstName: 'Grace', lastName: 'Garcia', role: 'student' },
  { id: 'a8888888-8888-8888-8888-888888888888', email: 'student8@university.edu', password: 'password123', firstName: 'Henry', lastName: 'Harris', role: 'student' },
  { id: 'a9999999-9999-9999-9999-999999999999', email: 'student9@university.edu', password: 'password123', firstName: 'Iris', lastName: 'Jackson', role: 'student' },
  { id: 'b1111111-1111-1111-1111-111111111111', email: 'student10@university.edu', password: 'password123', firstName: 'Jack', lastName: 'Johnson', role: 'student' },
  { id: 'b2222222-2222-2222-2222-222222222222', email: 'student11@university.edu', password: 'password123', firstName: 'Kelly', lastName: 'King', role: 'student' },
  { id: 'b3333333-3333-3333-3333-333333333333', email: 'student12@university.edu', password: 'password123', firstName: 'Liam', lastName: 'Lee', role: 'student' },
  { id: 'b4444444-4444-4444-4444-444444444444', email: 'student13@university.edu', password: 'password123', firstName: 'Mia', lastName: 'Miller', role: 'student' },
  { id: 'b5555555-5555-5555-5555-555555555555', email: 'student14@university.edu', password: 'password123', firstName: 'Noah', lastName: 'Nelson', role: 'student' },
  { id: 'b6666666-6666-6666-6666-666666666666', email: 'student15@university.edu', password: 'password123', firstName: 'Olivia', lastName: "O'Brien", role: 'student' },
];

async function createAuthUsers() {
  console.log('📝 Creating auth users...');
  
  for (const user of MOCK_USERS) {
    try {
      // Create auth user with admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  User ${user.email} already exists, skipping...`);
        } else {
          console.error(`   ❌ Error creating ${user.email}:`, error.message);
        }
      } else {
        console.log(`   ✅ Created ${user.role}: ${user.email}`);
        
        // Insert user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user!.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role
          });

        if (profileError && !profileError.message.includes('duplicate key')) {
          console.error(`   ❌ Error creating profile for ${user.email}:`, profileError.message);
        }
      }
    } catch (err) {
      console.error(`   ❌ Unexpected error for ${user.email}:`, err);
    }
  }
}

async function runSQLFile(filename: string) {
  console.log(`\n📄 Running ${filename}...`);
  
  const filePath = path.join(process.cwd(), 'supabase', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ File not found: ${filePath}`);
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  
  // Split by statement and execute (basic approach)
  // Note: This is simplified. For complex SQL, use Supabase CLI migrations
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.includes('INSERT INTO') || statement.includes('UPDATE') || statement.includes('DELETE')) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error && !error.message.includes('duplicate key')) {
          console.error(`   ⚠️  SQL Error:`, error.message.substring(0, 100));
        }
      } catch (err) {
        // Ignore errors for now - this is a simplified approach
      }
    }
  }
  
  console.log(`   ✅ Completed ${filename}`);
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Step 1: Create auth users and profiles
    await createAuthUsers();
    
    // Step 2: Run seed SQL files
    console.log('\n📊 Seeding database tables...');
    console.log('   Note: Run the SQL files manually via Supabase SQL Editor for best results');
    console.log('   Files to run:');
    console.log('   1. supabase/seed.sql');
    console.log('   2. supabase/seed_assignments.sql');
    
    console.log('\n✅ Auth users created successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run supabase/seed.sql');
    console.log('   4. Run supabase/seed_assignments.sql');
    console.log('\n🔑 Test credentials (all passwords: password123):');
    console.log('   Instructor: instructor1@university.edu');
    console.log('   TA: ta1@university.edu');
    console.log('   Student: student1@university.edu');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();

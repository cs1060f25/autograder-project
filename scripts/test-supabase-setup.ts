/**
 * Supabase Setup Test Script
 * 
 * This script verifies that the Supabase database setup is working correctly.
 * Run with: npx tsx scripts/test-supabase-setup.ts
 * 
 * Prerequisites:
 * - Migrations have been run
 * - Seed data has been loaded
 * - Environment variables are set
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test credentials
const TEST_USERS = {
  instructor: { email: 'instructor1@university.edu', password: 'password123' },
  ta: { email: 'ta1@university.edu', password: 'password123' },
  student: { email: 'student1@university.edu', password: 'password123' },
};

let testsPassed = 0;
let testsFailed = 0;

function logTest(name: string, passed: boolean, message?: string) {
  if (passed) {
    console.log(`   ✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`   ❌ ${name}${message ? ': ' + message : ''}`);
    testsFailed++;
  }
}

async function testDatabaseSchema() {
  console.log('\n📊 Testing Database Schema...');
  
  const tables = [
    'users',
    'courses',
    'assignments',
    'submissions',
    'rubrics',
    'rubric_scores',
    'course_enrollments',
    'course_ta_assignments'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      logTest(`Table '${table}' exists`, !error);
    } catch (err) {
      logTest(`Table '${table}' exists`, false, 'Table not found');
    }
  }
}

async function testStorageBuckets() {
  console.log('\n📁 Testing Storage Buckets...');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    logTest('List storage buckets', false, error.message);
    return;
  }
  
  const bucketNames = buckets?.map(b => b.id) || [];
  logTest('assignment-files bucket exists', bucketNames.includes('assignment-files'));
  logTest('submission-files bucket exists', bucketNames.includes('submission-files'));
}

async function testSeedData() {
  console.log('\n🌱 Testing Seed Data...');
  
  // Test users count
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('role');
  
  if (!usersError && users) {
    const roleCounts = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    logTest('Users seeded', users.length >= 23, `Found ${users.length} users`);
    logTest('Instructors seeded', roleCounts.instructor >= 3, `Found ${roleCounts.instructor || 0} instructors`);
    logTest('TAs seeded', roleCounts.ta >= 5, `Found ${roleCounts.ta || 0} TAs`);
    logTest('Students seeded', roleCounts.student >= 15, `Found ${roleCounts.student || 0} students`);
  } else {
    logTest('Users seeded', false, usersError?.message);
  }
  
  // Test courses count
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id');
  
  if (!coursesError && courses) {
    logTest('Courses seeded', courses.length >= 6, `Found ${courses.length} courses`);
  } else {
    logTest('Courses seeded', false, coursesError?.message);
  }
  
  // Test assignments count
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id');
  
  if (!assignmentsError && assignments) {
    logTest('Assignments seeded', assignments.length >= 20, `Found ${assignments.length} assignments`);
  } else {
    logTest('Assignments seeded', false, assignmentsError?.message);
  }
  
  // Test submissions count
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('id');
  
  if (!submissionsError && submissions) {
    logTest('Submissions seeded', submissions.length >= 15, `Found ${submissions.length} submissions`);
  } else {
    logTest('Submissions seeded', false, submissionsError?.message);
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test instructor login
  const { data: instructorAuth, error: instructorError } = await supabase.auth.signInWithPassword({
    email: TEST_USERS.instructor.email,
    password: TEST_USERS.instructor.password,
  });
  
  logTest('Instructor can login', !instructorError && !!instructorAuth.user);
  
  if (instructorAuth.user) {
    await supabase.auth.signOut();
  }
  
  // Test TA login
  const { data: taAuth, error: taError } = await supabase.auth.signInWithPassword({
    email: TEST_USERS.ta.email,
    password: TEST_USERS.ta.password,
  });
  
  logTest('TA can login', !taError && !!taAuth.user);
  
  if (taAuth.user) {
    await supabase.auth.signOut();
  }
  
  // Test student login
  const { data: studentAuth, error: studentError } = await supabase.auth.signInWithPassword({
    email: TEST_USERS.student.email,
    password: TEST_USERS.student.password,
  });
  
  logTest('Student can login', !studentError && !!studentAuth.user);
  
  if (studentAuth.user) {
    await supabase.auth.signOut();
  }
  
  // Test invalid login
  const { error: invalidError } = await supabase.auth.signInWithPassword({
    email: 'invalid@test.com',
    password: 'wrongpassword',
  });
  
  logTest('Invalid login fails', !!invalidError);
}

async function testRLSPolicies() {
  console.log('\n🔒 Testing Row Level Security Policies...');
  
  // Test as instructor
  const { data: instructorAuth } = await supabase.auth.signInWithPassword({
    email: TEST_USERS.instructor.email,
    password: TEST_USERS.instructor.password,
  });
  
  if (instructorAuth.user) {
    // Instructor should see their own courses
    const { data: instructorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*');
    
    logTest('Instructor can view courses', !coursesError && (instructorCourses?.length || 0) > 0);
    
    // Instructor should see assignments
    const { data: instructorAssignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*');
    
    logTest('Instructor can view assignments', !assignmentsError && (instructorAssignments?.length || 0) > 0);
    
    await supabase.auth.signOut();
  }
  
  // Test as TA
  const { data: taAuth } = await supabase.auth.signInWithPassword({
    email: TEST_USERS.ta.email,
    password: TEST_USERS.ta.password,
  });
  
  if (taAuth.user) {
    // TA should see assigned courses
    const { data: taCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*');
    
    logTest('TA can view assigned courses', !coursesError);
    
    // TA should see submissions
    const { data: taSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*');
    
    logTest('TA can view submissions', !submissionsError);
    
    await supabase.auth.signOut();
  }
  
  // Test as student
  const { data: studentAuth } = await supabase.auth.signInWithPassword({
    email: TEST_USERS.student.email,
    password: TEST_USERS.student.password,
  });
  
  if (studentAuth.user) {
    // Student should see enrolled courses
    const { data: studentCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*');
    
    logTest('Student can view enrolled courses', !coursesError);
    
    // Student should see own submissions
    const { data: studentSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*');
    
    logTest('Student can view own submissions', !submissionsError);
    
    await supabase.auth.signOut();
  }
  
  // Test unauthenticated access
  const { data: unauthCourses } = await supabase
    .from('courses')
    .select('*');
  
  logTest('Unauthenticated users cannot access data', !unauthCourses || unauthCourses.length === 0);
}

async function testDataIntegrity() {
  console.log('\n🔗 Testing Data Integrity...');
  
  // Login as instructor to run queries
  await supabase.auth.signInWithPassword({
    email: TEST_USERS.instructor.email,
    password: TEST_USERS.instructor.password,
  });
  
  // Test that all assignments have a course
  const { data: orphanedAssignments } = await supabase
    .from('assignments')
    .select('id')
    .is('course_id', null);
  
  logTest('All assignments have a course', !orphanedAssignments || orphanedAssignments.length === 0);
  
  // Test that all submissions have a student and assignment
  const { data: orphanedSubmissions } = await supabase
    .from('submissions')
    .select('id')
    .or('student_id.is.null,assignment_id.is.null');
  
  logTest('All submissions have student and assignment', !orphanedSubmissions || orphanedSubmissions.length === 0);
  
  // Test that enrollments link valid students to courses
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('student_id, course_id');
  
  logTest('Course enrollments exist', !!enrollments && enrollments.length > 0);
  
  await supabase.auth.signOut();
}

async function testRelationships() {
  console.log('\n🔗 Testing Table Relationships...');
  
  // Login as instructor
  await supabase.auth.signInWithPassword({
    email: TEST_USERS.instructor.email,
    password: TEST_USERS.instructor.password,
  });
  
  // Test course -> assignments relationship
  const { data: courseWithAssignments, error: courseError } = await supabase
    .from('courses')
    .select('id, name, assignments(id, title)')
    .limit(1)
    .single();
  
  logTest('Course -> Assignments relationship works', !courseError && !!courseWithAssignments);
  
  // Test assignment -> rubric relationship
  const { data: assignmentWithRubric, error: rubricError } = await supabase
    .from('assignments')
    .select('id, title, rubrics(id, criteria)')
    .limit(1)
    .single();
  
  logTest('Assignment -> Rubric relationship works', !rubricError && !!assignmentWithRubric);
  
  // Test submission -> student relationship
  const { data: submissionWithStudent, error: submissionError } = await supabase
    .from('submissions')
    .select('id, student_id, users!submissions_student_id_fkey(first_name, last_name)')
    .limit(1)
    .single();
  
  logTest('Submission -> Student relationship works', !submissionError && !!submissionWithStudent);
  
  await supabase.auth.signOut();
}

async function runAllTests() {
  console.log('🧪 Starting Supabase Setup Tests...\n');
  console.log('=' .repeat(60));
  
  try {
    await testDatabaseSchema();
    await testStorageBuckets();
    await testSeedData();
    await testAuthentication();
    await testRLSPolicies();
    await testDataIntegrity();
    await testRelationships();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Your Supabase setup is working correctly.\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
      console.log('💡 Common fixes:');
      console.log('   - Ensure all migrations have been run');
      console.log('   - Verify seed data has been loaded');
      console.log('   - Check that RLS policies are enabled');
      console.log('   - Confirm environment variables are set correctly\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

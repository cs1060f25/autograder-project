/**
 * Generate Sample PDF Files
 * 
 * This script generates sample PDF files for testing submissions
 * Run with: npx tsx scripts/generate-sample-pdfs.ts
 * 
 * Prerequisites:
 * - Install dependencies: npm install -D tsx pdf-lib
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sample-pdfs');

async function createSamplePDF(filename: string, title: string, content: string[]) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { height } = page.getSize();
  let yPosition = height - 50;

  // Title
  page.drawText(title, {
    x: 50,
    y: yPosition,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  yPosition -= 40;

  // Content
  for (const line of content) {
    if (yPosition < 50) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([600, 800]);
      yPosition = newPage.getSize().height - 50;
    }

    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;
  }

  const pdfBytes = await pdfDoc.save();
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, pdfBytes);
  console.log(`   ✅ Created ${filename}`);
}

async function generateSamplePDFs() {
  console.log('📄 Generating sample PDF files...\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Sample submission PDFs
  const samples = [
    {
      filename: 'hello-world-submission.pdf',
      title: 'CS101 - Hello World Assignment',
      content: [
        'Student: Alice Anderson',
        'Date: October 27, 2025',
        '',
        'Assignment: Hello World Program',
        '',
        'Code:',
        '```python',
        'print("Hello, World!")',
        '```',
        '',
        'Output:',
        'Hello, World!',
        '',
        'Explanation:',
        'This program uses the print() function to display',
        'the text "Hello, World!" to the console.',
      ]
    },
    {
      filename: 'variables-submission.pdf',
      title: 'CS101 - Variables and Data Types',
      content: [
        'Student: Bob Baker',
        'Date: October 27, 2025',
        '',
        'Assignment: Variables and Data Types',
        '',
        'Code Examples:',
        '',
        '# Integer',
        'age = 25',
        '',
        '# String',
        'name = "Bob Baker"',
        '',
        '# Float',
        'gpa = 3.85',
        '',
        '# Boolean',
        'is_student = True',
        '',
        '# List',
        'courses = ["CS101", "MATH201", "PHYS101"]',
        '',
        'print(f"Name: {name}, Age: {age}, GPA: {gpa}")',
      ]
    },
    {
      filename: 'control-flow-submission.pdf',
      title: 'CS101 - Control Flow Exercise',
      content: [
        'Student: Carol Carter',
        'Date: October 27, 2025',
        '',
        'Assignment: Control Flow',
        '',
        'Code:',
        '',
        '# If-else example',
        'score = 85',
        'if score >= 90:',
        '    grade = "A"',
        'elif score >= 80:',
        '    grade = "B"',
        'else:',
        '    grade = "C"',
        '',
        'print(f"Grade: {grade}")',
        '',
        '# Loop example',
        'for i in range(1, 11):',
        '    if i % 2 == 0:',
        '        print(f"{i} is even")',
        '    else:',
        '        print(f"{i} is odd")',
      ]
    },
    {
      filename: 'array-operations-submission.pdf',
      title: 'CS201 - Array Operations',
      content: [
        'Student: Alice Anderson',
        'Date: October 27, 2025',
        '',
        'Assignment: Array Sorting and Searching',
        '',
        'Bubble Sort Implementation:',
        '',
        'def bubble_sort(arr):',
        '    n = len(arr)',
        '    for i in range(n):',
        '        for j in range(0, n-i-1):',
        '            if arr[j] > arr[j+1]:',
        '                arr[j], arr[j+1] = arr[j+1], arr[j]',
        '    return arr',
        '',
        'Binary Search Implementation:',
        '',
        'def binary_search(arr, target):',
        '    left, right = 0, len(arr) - 1',
        '    while left <= right:',
        '        mid = (left + right) // 2',
        '        if arr[mid] == target:',
        '            return mid',
        '        elif arr[mid] < target:',
        '            left = mid + 1',
        '        else:',
        '            right = mid - 1',
        '    return -1',
      ]
    },
    {
      filename: 'sql-queries-submission.pdf',
      title: 'CS301 - SQL Basics',
      content: [
        'Student: Bob Baker',
        'Date: October 27, 2025',
        '',
        'Assignment: SQL Queries',
        '',
        'Query 1: Select all users',
        'SELECT * FROM users;',
        '',
        'Query 2: Filter by role',
        'SELECT first_name, last_name, email',
        'FROM users',
        'WHERE role = \'student\';',
        '',
        'Query 3: Join courses and enrollments',
        'SELECT c.name, c.code, COUNT(e.student_id) as student_count',
        'FROM courses c',
        'LEFT JOIN course_enrollments e ON c.id = e.course_id',
        'GROUP BY c.id, c.name, c.code',
        'ORDER BY student_count DESC;',
        '',
        'Query 4: Subquery example',
        'SELECT a.title, a.due_date',
        'FROM assignments a',
        'WHERE a.course_id IN (',
        '    SELECT course_id FROM course_enrollments',
        '    WHERE student_id = \'user-id-here\'',
        ');',
      ]
    },
    {
      filename: 'web-portfolio-submission.pdf',
      title: 'CS250 - HTML/CSS Portfolio',
      content: [
        'Student: Grace Garcia',
        'Date: October 27, 2025',
        '',
        'Assignment: Personal Portfolio Website',
        '',
        'HTML Structure:',
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="UTF-8">',
        '    <title>Grace Garcia - Portfolio</title>',
        '    <link rel="stylesheet" href="styles.css">',
        '</head>',
        '<body>',
        '    <header>',
        '        <h1>Grace Garcia</h1>',
        '        <nav>',
        '            <a href="#about">About</a>',
        '            <a href="#projects">Projects</a>',
        '            <a href="#contact">Contact</a>',
        '        </nav>',
        '    </header>',
        '    <main>',
        '        <section id="about">',
        '            <h2>About Me</h2>',
        '            <p>Computer Science student...</p>',
        '        </section>',
        '    </main>',
        '</body>',
        '</html>',
      ]
    },
  ];

  for (const sample of samples) {
    await createSamplePDF(sample.filename, sample.title, sample.content);
  }

  console.log(`\n✅ Generated ${samples.length} sample PDF files in ${OUTPUT_DIR}`);
  console.log('\n📋 Next steps:');
  console.log('   These PDFs can be used for testing file uploads and AI grading');
  console.log('   Upload them through the student submission interface');
}

// Run the generator
generateSamplePDFs().catch(console.error);

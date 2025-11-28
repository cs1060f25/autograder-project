# Course and Assignment Navigation is Flat and Confusing

## Description

### Current Behavior

When users (instructors or students) access the dashboard to view courses and assignments:

- **Flat display structure**: Courses and assignments are displayed side-by-side in a flat layout with no clear hierarchy
- **No course-first navigation**: Users cannot click into a course to see only its assignments
- **Information overload**: All assignments from all courses are shown at once, making it difficult to focus on a specific course
- **Confusing context**: When viewing assignments, users must rely on small course code labels to understand which course an assignment belongs to
- **No drill-down capability**: There's no way to filter or navigate to see assignments for a single course

### Expected Behavior

The navigation should follow a **course-first hierarchy**:

1. **Dashboard shows courses prominently**: Users see their courses as clickable cards with summary stats
2. **Click course → see assignments**: Clicking a course navigates to a dedicated course detail page
3. **Course detail shows filtered assignments**: Only assignments for that specific course are displayed
4. **Clear back navigation**: Users can easily return to the main dashboard
5. **Contextual actions**: Creating assignments from a course detail page pre-selects that course

## Impact

- **User confusion**: Users struggle to find assignments for specific courses
- **Cognitive overload**: Seeing all assignments at once is overwhelming for users with multiple courses
- **Poor discoverability**: New users don't understand the relationship between courses and assignments
- **Inefficient workflow**: Instructors must mentally filter assignments by course when grading
- **Reduced productivity**: Extra time spent searching for the right assignment

## Steps to Reproduce

1. Log in as an instructor with multiple courses
2. Navigate to the instructor dashboard
3. Observe that courses and "Recent Assignments" are displayed side-by-side
4. Note that clicking a course does NOT navigate to a course detail view
5. Note that assignments show course codes but there's no way to filter by course

## Environment

- **Application**: Autograder Platform
- **Components affected**:
  - `src/components/dashboard/instructor-dashboard-content.tsx`
  - `src/components/dashboard/student-dashboard-content.tsx`
  - `src/app/dashboard/instructor/page.tsx`
  - `src/app/dashboard/student/page.tsx`

## Frequency

Persistent - affects all users viewing the dashboard

## Predictability

Always occurs when using the dashboard

---

## Desired Behavior (Implemented Fix)

The revamped navigation now includes:

### For Instructors

1. **Clickable course cards**: Each course card on the dashboard is now clickable
2. **Course detail page**: New route `/dashboard/instructor/courses/[courseId]` shows:
   - Course stats (assignments, students, average grade, total submissions)
   - Full list of assignments for that course only
   - Back navigation to dashboard
   - "Manage Students" button for enrollment
3. **Pre-selected course**: Creating an assignment from a course detail page pre-selects that course
4. **Assignment actions**: Edit, publish, close, and delete assignments directly from the course view

### For Students

1. **Courses section**: New "Your Courses" section prominently displays enrolled courses
2. **Course stats**: Each course shows assignment count, submitted count, and pending count
3. **Course detail page**: New route `/dashboard/student/courses/[courseId]` shows:
   - Course-specific stats
   - Filtered assignments for that course only
   - Submission status and actions
   - Back navigation to dashboard
4. **Visual hierarchy**: Courses appear before the "Recent Assignments" section

### Data Layer

New functions added to `src/lib/data-utils.ts`:
- `getCourseById()` - Fetch single course
- `getCourseAssignments()` - Get assignments for a specific course with stats
- `getInstructorCourseDetail()` - Full course detail for instructors
- `getStudentEnrolledCourses()` - Get student's enrolled courses with stats
- `getStudentCourseDetail()` - Full course detail for students

---

## Triage

### Severity

**sev2-bug** - Significant usability issue affecting core navigation workflow

### Priority

**High** - Directly impacts user experience and platform usability

### Labels

- `ux-improvement`
- `navigation`
- `instructor-experience`
- `student-experience`
- `dashboard`

---

## Technical Notes

### Files Changed

1. **New Pages**:
   - `src/app/dashboard/instructor/courses/[courseId]/page.tsx`
   - `src/app/dashboard/student/courses/[courseId]/page.tsx`

2. **New Components**:
   - `src/components/dashboard/instructor-course-detail-content.tsx`
   - `src/components/dashboard/student-course-detail-content.tsx`

3. **Modified Components**:
   - `src/components/dashboard/instructor-dashboard-content.tsx` - Made courses clickable
   - `src/components/dashboard/student-dashboard-content.tsx` - Added courses section
   - `src/components/modals/assignment-modal.tsx` - Added `defaultCourseId` prop

4. **Data Layer**:
   - `src/lib/data-utils.ts` - Added new data fetching functions

5. **Page Updates**:
   - `src/app/dashboard/student/page.tsx` - Fetch and pass courses data

### Tests

Test files created in `src/__tests__/`:

1. **E2E Tests** (`e2e/course-navigation.spec.ts`):
   - Instructor can view and click courses
   - Course detail shows correct assignments
   - Back navigation works
   - Student sees only enrolled courses
   - Empty course handling

2. **Component Tests** (`components/dashboard/course-list.test.tsx`):
   - Renders list of courses
   - Course cards are clickable
   - Empty state handling
   - Accessibility (tabIndex, role)

3. **Component Tests** (`components/dashboard/course-detail.test.tsx`):
   - Displays course information
   - Shows assignments for course
   - Navigation buttons work
   - Empty assignments state

4. **Integration Tests** (`integration/course-navigation.test.ts`):
   - Data filtering by course ID
   - Instructor access control
   - Student enrollment verification
   - Error handling

### Testing Recommendations

1. **Manual Testing**:
   - Log in as instructor → click course → verify assignments shown
   - Log in as student → click course → verify only enrolled course assignments
   - Create assignment from course detail → verify course pre-selected
   - Test back navigation from course detail

2. **Run Tests**:
   ```bash
   # Unit/Component tests
   npm test -- course
   
   # E2E tests
   npm run test:e2e -- course-navigation
   ```

---

## AI Attempt

We used Windsurf with Claude to implement this navigation improvement. The AI was able to:

1. Analyze the existing dashboard structure
2. Create new route pages for course details
3. Build new components for course detail views
4. Update existing components to support course-first navigation
5. Add data fetching functions for course-specific data
6. Create comprehensive test files

The implementation followed existing patterns in the codebase and maintained consistency with the UI design.

---

## Review Checklist

- [ ] Course cards are clickable on instructor dashboard
- [ ] Course cards are clickable on student dashboard
- [ ] Course detail page shows correct assignments
- [ ] Back navigation returns to dashboard
- [ ] Assignment modal pre-selects course when opened from course detail
- [ ] Students can only see enrolled courses
- [ ] Instructors can only see owned courses
- [ ] Empty states display correctly
- [ ] All tests pass

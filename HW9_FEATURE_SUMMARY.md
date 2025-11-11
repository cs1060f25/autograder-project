# HW9 Feature Implementation Summary

**Developer**: evanjiang  
**Branch**: `evanjiang-hw9`  
**Date**: November 11, 2025

## Overview

This document describes two small feature enhancements implemented for the student dashboard to improve usability and help students better manage their assignments.

---

## TASK-15: Due Soon Badge for Student Assignments

### Feature Description

Adds a visual "Due Soon" badge to assignments on the student dashboard that are due within 48 hours. This helps students quickly identify urgent assignments that need immediate attention.

### Implementation Details

**Files Modified:**
- `src/components/dashboard/student-dashboard-content.tsx`

**Changes:**
1. Added `isDueSoon()` helper function that calculates if an assignment is due within 48 hours
2. Added conditional rendering of orange "Due Soon" badge next to assignment titles
3. Badge only displays for assignments that meet ALL criteria:
   - Due within 48 hours (0 < hours until due ≤ 48)
   - Not overdue
   - No submission OR submission status is "draft"

**Visual Design:**
- Badge: Orange background (`bg-orange-100`) with orange text (`text-orange-800`)
- Size: Extra small (`text-xs`)
- Shape: Rounded pill (`rounded-full`)
- Positioning: Inline with assignment title

### Acceptance Criteria

✅ Display orange "Due Soon" badge for assignments due within 48 hours  
✅ Badge appears next to assignment title  
✅ Only show for unsubmitted or draft submissions  
✅ Badge does not appear for overdue assignments  
✅ Badge does not appear for submitted/graded assignments  
✅ Handle edge cases (exactly 48 hours, etc.)

### Test Plan

**Manual Testing:**
1. **Test Case 1: Due Soon Badge Appears**
   - **Setup**: Create assignment due in 24 hours
   - **Expected**: Orange "Due Soon" badge displays next to assignment title
   - **Result**: ✅ Pass

2. **Test Case 2: No Badge for Future Assignments**
   - **Setup**: Create assignment due in 7 days
   - **Expected**: No "Due Soon" badge displays
   - **Result**: ✅ Pass

3. **Test Case 3: No Badge for Overdue**
   - **Setup**: Create assignment due yesterday
   - **Expected**: No "Due Soon" badge, "(Overdue)" text displays instead
   - **Result**: ✅ Pass

4. **Test Case 4: No Badge After Submission**
   - **Setup**: Assignment due in 24 hours with submitted status
   - **Expected**: No "Due Soon" badge displays
   - **Result**: ✅ Pass

5. **Test Case 5: Badge Shows for Draft**
   - **Setup**: Assignment due in 24 hours with draft submission
   - **Expected**: "Due Soon" badge displays
   - **Result**: ✅ Pass

6. **Test Case 6: Edge Case - Exactly 48 Hours**
   - **Setup**: Assignment due in exactly 48 hours
   - **Expected**: "Due Soon" badge displays
   - **Result**: ✅ Pass

**Automated Testing:**
- Location: `src/__tests__/components/dashboard/student-dashboard-features.test.tsx`
- Test Suite: "TASK-15: Due Soon Badge"
- Tests: 8 test cases covering all scenarios
- Coverage: Badge display logic, edge cases, submission status handling

### Known Issues

None identified. Feature working as expected.

---

## TASK-16: Assignment Sorting for Student Dashboard

### Feature Description

Adds a dropdown menu to the student dashboard that allows students to sort assignments by multiple criteria: due date (earliest/latest), title (A-Z/Z-A), and submission status. This improves navigation and helps students organize their work according to their preferences.

### Implementation Details

**Files Modified:**
- `src/components/dashboard/student-dashboard-content.tsx`

**Changes:**
1. Imported `Select` components from shadcn/ui
2. Added `sortBy` state variable (default: "due-date-asc")
3. Created `sortedAssignments` computed value using `useMemo` hook
4. Implemented sorting logic for 5 sort options:
   - Due Date (Earliest): Sort by `due_date` ascending
   - Due Date (Latest): Sort by `due_date` descending
   - Title (A-Z): Alphabetical sort ascending
   - Title (Z-A): Alphabetical sort descending
   - Status: Sort by submission status (draft → submitted → graded → none)
5. Added sort dropdown UI in card header
6. Updated assignment list to use `sortedAssignments` instead of raw `assignments`

**UI Design:**
- Dropdown width: 180px
- Label: "Sort by:" in gray text
- Location: Top-right of "Your Assignments" card header
- Responsive: Aligns properly on mobile and desktop

### Acceptance Criteria

✅ Dropdown with 5 sort options  
✅ Default sort is "Due Date (Earliest)"  
✅ Sorting applies immediately on selection  
✅ Sort persists during component lifecycle  
✅ Works with empty assignment list  
✅ Maintains correct order after data updates

### Test Plan

**Manual Testing:**
1. **Test Case 1: Default Sort**
   - **Setup**: Load student dashboard with multiple assignments
   - **Expected**: Assignments sorted by due date (earliest first)
   - **Result**: ✅ Pass

2. **Test Case 2: Sort by Due Date (Latest)**
   - **Setup**: Select "Due Date (Latest)" from dropdown
   - **Expected**: Assignments reorder with latest due dates first
   - **Result**: ✅ Pass

3. **Test Case 3: Sort by Title (A-Z)**
   - **Setup**: Select "Title (A-Z)" from dropdown
   - **Expected**: Assignments sorted alphabetically
   - **Result**: ✅ Pass

4. **Test Case 4: Sort by Title (Z-A)**
   - **Setup**: Select "Title (Z-A)" from dropdown
   - **Expected**: Assignments sorted reverse alphabetically
   - **Result**: ✅ Pass

5. **Test Case 5: Sort by Status**
   - **Setup**: Select "Status" from dropdown
   - **Expected**: Assignments grouped by status (draft, submitted, graded, unsubmitted)
   - **Result**: ✅ Pass

6. **Test Case 6: Empty List Handling**
   - **Setup**: Student with no assignments
   - **Expected**: Dropdown displays, empty state message shows
   - **Result**: ✅ Pass

7. **Test Case 7: Sort Persistence**
   - **Setup**: Select non-default sort, navigate away, return
   - **Expected**: Sort selection persists during session
   - **Result**: ✅ Pass

**Automated Testing:**
- Location: `src/__tests__/components/dashboard/student-dashboard-features.test.tsx`
- Test Suite: "TASK-16: Assignment Sorting"
- Tests: 8 test cases covering all sorting options
- Coverage: All sort algorithms, edge cases, UI interactions

### Known Issues

None identified. Feature working as expected.

---

## Combined Feature Testing

Both features work correctly together:
- "Due Soon" badges display correctly regardless of sort order
- Sorting maintains badge visibility for appropriate assignments
- UI remains responsive with both features active

**Test Coverage:**
- Combined test suite in `student-dashboard-features.test.tsx`
- Tests verify features work independently and together
- Total: 17 automated test cases

---

## Technical Notes

### Performance Considerations
- `useMemo` hook ensures sorting only recalculates when `assignments` or `sortBy` changes
- No performance impact observed with typical assignment counts (<100)
- Badge calculation is O(1) per assignment

### Browser Compatibility
- Tested on Chrome (latest)
- Uses standard JavaScript Date operations
- Tailwind CSS classes for styling (broadly compatible)

### Accessibility
- Sort dropdown is keyboard navigable
- Semantic HTML used throughout
- Color contrast meets WCAG AA standards

---

## Deployment Checklist

- [x] Features implemented and tested locally
- [x] Code committed with proper HW9 messages
- [x] Branch `evanjiang-hw9` pushed to GitHub
- [x] Unit tests written and passing
- [x] No linter errors
- [x] Documentation complete
- [ ] Manual testing in staging environment
- [ ] Ready for code review
- [ ] Ready to merge to main

---

## Screenshots

### Due Soon Badge
```
┌─────────────────────────────────────────────────────┐
│ Assignment Title [Due Soon] ← Orange badge          │
│ CS101 • Due: 11/12/2025                            │
└─────────────────────────────────────────────────────┘
```

### Sort Dropdown
```
┌─────────────────────────────────────────────────────┐
│ Your Assignments        Sort by: [Due Date ▼]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Dropdown Options]                                │
│  - Due Date (Earliest)                             │
│  - Due Date (Latest)                               │
│  - Title (A-Z)                                     │
│  - Title (Z-A)                                     │
│  - Status                                          │
└─────────────────────────────────────────────────────┘
```

---

## Future Enhancements (Out of Scope)

Potential improvements for future tickets:
1. Add assignment search/filter functionality
2. Allow custom sort order preferences saved to user profile
3. Add "Due This Week" filter quick action
4. Combine sorting with filtering (e.g., "Show only unsubmitted, sorted by due date")
5. Add visual timeline view for assignments

---

## Commits

1. `73a041e` - HW9 TASK-15: Add due soon badge for student assignments
2. `1de2516` - HW9 TASK-16: Add assignment sorting for student dashboard
3. `09706a6` - HW9 TASK-15 TASK-16: Add comprehensive tests for student dashboard features

---

## Questions & Answers

**Q: Why 48 hours for "Due Soon"?**  
A: 48 hours provides a reasonable buffer for students to complete work while being urgent enough to warrant highlighting. This can be made configurable in future iterations.

**Q: Why not show "Due Soon" for submitted assignments?**  
A: Once submitted, the assignment is no longer urgent from the student's perspective. However, draft submissions still need completion, so the badge shows for those.

**Q: Can sorting be saved across sessions?**  
A: Currently, sorting only persists during the session. Adding localStorage or user preferences would require database schema changes and is out of scope for this ticket.


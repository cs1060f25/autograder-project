# Score Distribution Feature

## Overview
This feature allows instructors to toggle whether students can view score distribution statistics for each assignment. When enabled, students can see how their grade compares to the class distribution.

## Implementation Details

### Database Changes
- **Migration**: `20250210000000_add_score_distribution_toggle.sql`
  - Added `show_score_distribution` boolean column to `assignments` table (default: false)
  - Added index for performance optimization

### Backend Changes

#### 1. Data Models (`src/lib/data-utils.ts`)
- Updated `Assignment` interface to include `show_score_distribution?: boolean`
- Added `ScoreDistribution` interface with:
  - Mean, median, min, max, standard deviation
  - Quartiles (Q1, Q2, Q3)
  - Histogram data (10-point ranges)
  - Total graded count
- Added `getScoreDistribution()` function to calculate statistics from graded submissions

#### 2. Assignment Actions (`src/lib/assignment-actions.ts`)
- Added `toggleScoreDistribution()` action for instructors to enable/disable the feature per assignment

### Frontend Changes

#### 1. Instructor UI (`src/components/dashboard/assignment-detail-content.tsx`)
- Added toggle switch in assignment detail page
- Instructors can enable/disable score distribution visibility for students
- Uses new `Switch` component from shadcn/ui
- Real-time toggle with loading state

#### 2. Student UI (`src/components/modals/submission-modal.tsx`)
- Enhanced submission modal to display score distribution when:
  - Assignment has `show_score_distribution` enabled
  - Submission is graded
- Displays:
  - **Summary Statistics**: Mean, Median, Standard Deviation, Total Graded
  - **Quartiles**: Q1, Q2 (median), Q3
  - **Histogram**: Visual bar chart showing distribution across 10-point ranges (0-9, 10-19, ..., 90-100)
  - **Student's Position**: Shows their score and percentage

#### 3. UI Components
- Created `src/components/ui/switch.tsx` using Radix UI primitives
- Added `@radix-ui/react-switch` dependency

### Student Dashboard Integration
- Updated `student-dashboard-content.tsx` to pass `show_score_distribution` and `max_points` props to submission modal

## Usage

### For Instructors
1. Navigate to an assignment detail page
2. Locate the "Show Score Distribution to Students" toggle at the bottom of the assignment info card
3. Toggle on to allow students to see class statistics
4. Toggle off to hide statistics from students

### For Students
1. View a graded assignment submission
2. If the instructor has enabled score distribution, a purple "Class Score Distribution" section will appear
3. View statistics including:
   - Class mean and median scores
   - Standard deviation
   - Your position relative to the class
   - Visual histogram of score distribution

## Privacy Considerations
- Individual student scores are never revealed
- Only aggregate statistics are shown
- Students can only see distribution data for assignments where they have a graded submission
- Instructors have full control over which assignments show distribution data

## Technical Notes
- Score distribution is calculated on-demand when the modal loads
- Calculations use all graded submissions for the assignment
- Histogram uses 10-point bins for clear visualization
- All statistics are rounded to 2 decimal places for readability

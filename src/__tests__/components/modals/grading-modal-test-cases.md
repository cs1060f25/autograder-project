# Grading Modal Test Cases - Rubric Presets & Keyboard Shortcuts

## Test Case 1: Number Key Shortcut Applies Preset When Rubric Input is Focused
**Description**: When a rubric score input field is focused and the user presses a number key (1-9), the corresponding preset should be applied to that criterion.
**Steps**:
1. Open grading modal with a submission that has a rubric with presets
2. Focus on a rubric score input field for a criterion with presets
3. Press number key "1"
4. Verify the score is updated to match preset 1's points value
5. Verify the preset description (if any) is appended to the feedback field

## Test Case 2: Number Key Shortcut Does Not Work When Feedback Input is Focused
**Description**: Number keys should not trigger preset shortcuts when typing in the feedback textarea.
**Steps**:
1. Open grading modal with a rubric containing presets
2. Focus on the feedback textarea
3. Press number key "1"
4. Verify the number "1" is typed into the feedback field (normal behavior)
5. Verify no preset is applied to any rubric criterion

## Test Case 3: Number Key Shortcut Does Not Work When Grade Input is Focused
**Description**: Number keys should not trigger preset shortcuts when typing in the grade input field.
**Steps**:
1. Open grading modal with a rubric containing presets
2. Focus on the grade input field
3. Press number key "1"
4. Verify the number "1" is typed into the grade field (normal behavior)
5. Verify no preset is applied to any rubric criterion

## Test Case 4: Preset Button Highlights When Score Matches Preset Points
**Description**: When a rubric criterion's score equals a preset's points value, that preset button should be visually highlighted/selected.
**Steps**:
1. Open grading modal with a rubric containing presets
2. Manually set a rubric score to match a preset's points value (e.g., preset 1 = 5 points, set score to 5)
3. Verify the preset button for that score is highlighted with blue background
4. Change the score to a different value
5. Verify the preset button is no longer highlighted

## Test Case 5: Clicking Preset Button Applies Preset and Updates Feedback
**Description**: Clicking a preset button should apply the preset's points and append its description to feedback.
**Steps**:
1. Open grading modal with a rubric containing presets with descriptions
2. Click on preset button "1" for a criterion
3. Verify the rubric score is updated to preset 1's points
4. Verify the preset description is added to the feedback field
5. Click another preset button for the same criterion
6. Verify the score updates and the new description is appended to feedback

## Test Case 6: Arrow Key Navigation Between Submissions
**Description**: Left and right arrow keys should navigate between submissions when not typing in an input field.
**Steps**:
1. Open grading modal with multiple submissions (submissionIds array provided)
2. Ensure no input field is focused
3. Press right arrow key
4. Verify onNavigateSubmission is called with the next submission ID
5. Press left arrow key
6. Verify onNavigateSubmission is called with the previous submission ID

## Test Case 7: Arrow Key Navigation Does Not Work When Input is Focused
**Description**: Arrow keys should not trigger navigation when typing in any input field.
**Steps**:
1. Open grading modal with multiple submissions
2. Focus on the feedback textarea
3. Press right arrow key
4. Verify the cursor moves within the textarea (normal behavior)
5. Verify onNavigateSubmission is NOT called
6. Repeat with grade input field and rubric score inputs

## Test Case 8: Number Key Shortcut Works for Multiple Presets (1-9)
**Description**: All number keys 1-9 should work for presets, with each key mapping to the corresponding preset index.
**Steps**:
1. Open grading modal with a rubric criterion that has 5 presets
2. Focus on the rubric score input
3. Press number keys 1, 2, 3, 4, 5 in sequence
4. Verify each key applies the correct preset (preset index = key number - 1)
5. Press number key 6 (no preset exists)
6. Verify nothing happens (no error, no preset applied)

## Test Case 9: Preset Shortcut Works When Criterion is Focused But Input Not Directly Focused
**Description**: Number key shortcuts should work when a criterion was previously focused, even if the input isn't currently focused (but no other input is focused).
**Steps**:
1. Open grading modal with a rubric containing presets
2. Focus on a rubric score input (sets focusedCriterionId)
3. Click elsewhere in the modal (not on another input)
4. Press number key "1"
5. Verify the preset is still applied to the previously focused criterion

## Test Case 10: Keyboard Shortcut Indicators Display in Modal Header
**Description**: The modal header should display UI indicators showing available keyboard shortcuts.
**Steps**:
1. Open grading modal with multiple submissions and rubric with presets
2. Verify the modal header displays text indicating arrow key navigation (e.g., "← → Navigate")
3. Verify the modal header displays text indicating number key shortcuts (e.g., "1-9 Apply Preset")
4. Open modal with only one submission
5. Verify navigation indicator is not shown (or shows appropriate message)
6. Open modal with rubric but no presets
7. Verify preset shortcut indicator is not shown (or shows appropriate message)


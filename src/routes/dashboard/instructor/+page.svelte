<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
import CardContent from '$lib/components/ui/card-content.svelte';
import CardHeader from '$lib/components/ui/card-header.svelte';
import CardTitle from '$lib/components/ui/card-title.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { GraduationCap, Users, FileText, TrendingUp, Plus, Edit, Trash2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	function formatGrade(averageGrade: number | null) {
		if (!averageGrade) return 'N/A';

		let letterGrade = 'F';
		if (averageGrade >= 90) letterGrade = 'A';
		else if (averageGrade >= 80) letterGrade = 'B';
		else if (averageGrade >= 70) letterGrade = 'C';
		else if (averageGrade >= 60) letterGrade = 'D';

		return letterGrade;
	}
</script>

<svelte:head>
	<title>Instructor Dashboard - AI Grading Platform</title>
</svelte:head>

<div class="space-y-6">
	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Courses</CardTitle>
				<GraduationCap class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.total_courses}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Students</CardTitle>
				<Users class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.total_students}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Active Assignments</CardTitle>
				<FileText class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.active_assignments}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Average Grade</CardTitle>
				<TrendingUp class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">
					{data.stats.average_grade ? formatGrade(data.stats.average_grade) : 'N/A'}
				</div>
			</CardContent>
		</Card>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Courses Overview -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between">
				<CardTitle>Your Courses</CardTitle>
				<Button size="sm">
					<Plus class="h-4 w-4 mr-2" />
					New Course
				</Button>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#if data.courses.length === 0}
						<div class="text-center py-8 text-gray-500">
							<GraduationCap class="h-12 w-12 mx-auto mb-4 text-gray-300" />
							<p>No courses found. Create your first course to get started.</p>
						</div>
					{:else}
						{#each data.courses as course}
							<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
								<div>
									<h3 class="font-medium text-gray-900">{course.name}</h3>
									<p class="text-sm text-gray-500">
										{course.code} • {course.students_count} students
									</p>
									<div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
										<span>{course.assignments_count} assignments</span>
										<span>Avg: {formatGrade(course.average_grade)}</span>
									</div>
								</div>
								<div class="flex space-x-2">
									<Button size="sm" variant="outline">
										<Users class="h-4 w-4 mr-2" />
										Manage
									</Button>
									<Button size="sm" variant="outline">
										<Edit class="h-4 w-4 mr-2" />
										Edit
									</Button>
									<Button size="sm" variant="outline" class="text-red-600 hover:text-red-700">
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Recent Assignments -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between">
				<CardTitle>Recent Assignments</CardTitle>
				<Button size="sm">
					<Plus class="h-4 w-4 mr-2" />
					New Assignment
				</Button>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#if data.recentAssignments.length === 0}
						<div class="text-center py-8 text-gray-500">
							<FileText class="h-12 w-12 mx-auto mb-4 text-gray-300" />
							<p>No assignments found. Create your first assignment to get started.</p>
						</div>
					{:else}
						{#each data.recentAssignments as assignment}
							<div class="flex items-center justify-between p-4 border rounded-lg">
								<div>
									<h3 class="font-medium text-gray-900">{assignment.title}</h3>
									<p class="text-sm text-gray-500">
										{assignment.course?.code || 'Unknown Course'} • Due: {new Date(assignment.due_date).toLocaleDateString()}
									</p>
									<div class="flex items-center space-x-4 mt-1 text-sm text-gray-600">
										<span>{assignment.submissions_count} submissions</span>
										<span>{assignment.graded_count} graded</span>
										{#if assignment.average_grade}
											<span>Avg: {formatGrade(assignment.average_grade)}</span>
										{/if}
									</div>
								</div>
								<div class="flex space-x-2">
									<Button size="sm" variant="outline">
										<Edit class="h-4 w-4 mr-2" />
										Edit
									</Button>
									<Button size="sm" variant="outline" class="text-red-600 hover:text-red-700">
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>
</div>

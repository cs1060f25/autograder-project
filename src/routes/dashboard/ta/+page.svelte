<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
import CardContent from '$lib/components/ui/card-content.svelte';
import CardHeader from '$lib/components/ui/card-header.svelte';
import CardTitle from '$lib/components/ui/card-title.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { FileText, Clock, CheckCircle, Users, TrendingUp } from 'lucide-svelte';
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
	<title>TA Dashboard - AI Grading Platform</title>
</svelte:head>

<div class="space-y-6">
	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Assignments</CardTitle>
				<FileText class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.total}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Pending Grading</CardTitle>
				<Clock class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.pending}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Graded Today</CardTitle>
				<CheckCircle class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.graded_today}</div>
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
		<!-- Assignments Overview -->
		<Card>
			<CardHeader>
				<CardTitle>Your Assignments</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#if data.assignments.length === 0}
						<div class="text-center py-8 text-gray-500">
							<FileText class="h-12 w-12 mx-auto mb-4 text-gray-300" />
							<p>No assignments assigned to you yet.</p>
						</div>
					{:else}
						{#each data.assignments as assignment}
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
								<Button size="sm" variant="outline">
									View
								</Button>
							</div>
						{/each}
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Pending Grading -->
		<Card>
			<CardHeader>
				<CardTitle>Pending Grading</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#if data.pendingGrading.length === 0}
						<div class="text-center py-8 text-gray-500">
							<CheckCircle class="h-12 w-12 mx-auto mb-4 text-gray-300" />
							<p>No pending submissions to grade.</p>
						</div>
					{:else}
						{#each data.pendingGrading as submission}
							<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
								<div>
									<h3 class="font-medium text-gray-900">
										{submission.student.first_name} {submission.student.last_name}
									</h3>
									<p class="text-sm text-gray-500">
										{submission.assignment.title} • {submission.assignment.course?.code}
									</p>
									<p class="text-sm text-gray-600">
										Submitted: {new Date(submission.submitted_at!).toLocaleDateString()}
									</p>
								</div>
								<Button size="sm" variant="outline">
									Grade
								</Button>
							</div>
						{/each}
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>
</div>

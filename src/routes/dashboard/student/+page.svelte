<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
import CardContent from '$lib/components/ui/card-content.svelte';
import CardHeader from '$lib/components/ui/card-header.svelte';
import CardTitle from '$lib/components/ui/card-title.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { FileText, Clock, CheckCircle, Upload } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	function getStatusIcon(assignment: any) {
		if (assignment.submission?.status === 'graded') {
			return CheckCircle;
		} else if (assignment.submission?.status === 'submitted') {
			return Clock;
		} else {
			return Clock;
		}
	}

	function getStatusText(assignment: any) {
		if (assignment.submission?.status === 'graded') {
			return 'Graded';
		} else if (assignment.submission?.status === 'submitted') {
			return 'Submitted';
		} else {
			return 'Not Submitted';
		}
	}

	function getStatusColor(assignment: any) {
		if (assignment.submission?.status === 'graded') {
			return 'text-green-600';
		} else if (assignment.submission?.status === 'submitted') {
			return 'text-yellow-600';
		} else {
			return 'text-gray-600';
		}
	}
</script>

<svelte:head>
	<title>Student Dashboard - AI Grading Platform</title>
</svelte:head>

<div class="space-y-6">
	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
				<CardTitle class="text-sm font-medium">Submitted</CardTitle>
				<CheckCircle class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.submitted}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Pending</CardTitle>
				<Clock class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.pending}</div>
			</CardContent>
		</Card>
	</div>

	<!-- Assignments List -->
	<Card>
		<CardHeader>
			<CardTitle>Your Assignments</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#if data.assignments.length === 0}
					<div class="text-center py-8 text-gray-500">
						<FileText class="h-12 w-12 mx-auto mb-4 text-gray-300" />
						<p>No assignments found. Check back later for new assignments.</p>
					</div>
				{:else}
					{#each data.assignments as assignment}
						<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
							<div class="flex items-center space-x-3">
								<svelte:component this={getStatusIcon(assignment)} class="h-5 w-5 {getStatusColor(assignment)}" />
								<div>
									<h3 class="font-medium text-gray-900">{assignment.title}</h3>
									<p class="text-sm text-gray-500">
										{assignment.course?.code || 'Unknown Course'} • Due: {new Date(assignment.due_date).toLocaleDateString()}
									</p>
									<p class="text-sm {getStatusColor(assignment)}">
										Status: {getStatusText(assignment)}
									</p>
									{#if assignment.submission?.grade !== null}
										<p class="text-sm text-gray-600">
											Grade: {assignment.submission.grade}/{assignment.max_points}
										</p>
									{/if}
								</div>
							</div>
							<div class="flex space-x-2">
								{#if !assignment.submission || assignment.submission.status === 'draft'}
									<Button size="sm" variant="outline">
										<Upload class="h-4 w-4 mr-2" />
										Submit
									</Button>
								{/if}
								{#if assignment.submission}
									<Button size="sm" variant="outline">
										View
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</CardContent>
	</Card>
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<svelte:head>
	<title>Dashboard - AI Grading Platform</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<h1 class="text-xl font-semibold text-gray-900">
						AI Grading Platform
					</h1>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-700">
						Welcome, {data.userProfile.first_name} {data.userProfile.last_name}
					</span>
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
						{data.userProfile.role}
					</span>
					<form method="POST" action="/auth/signout" use:enhance>
						<Button type="submit" variant="outline" size="sm">
							Sign Out
						</Button>
					</form>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<slot />
	</main>
</div>

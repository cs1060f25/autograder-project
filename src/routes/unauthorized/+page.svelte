<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
import CardContent from '$lib/components/ui/card-content.svelte';
import CardDescription from '$lib/components/ui/card-description.svelte';
import CardHeader from '$lib/components/ui/card-header.svelte';
import CardTitle from '$lib/components/ui/card-title.svelte';
	import { AlertTriangle } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Unauthorized - AI Grading Platform</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full">
		<Card>
			<CardHeader class="text-center">
				<AlertTriangle class="h-12 w-12 mx-auto mb-4 text-red-500" />
				<CardTitle class="text-2xl">Unauthorized Access</CardTitle>
				<CardDescription>
					You don't have permission to access this page. Please contact your administrator if you believe this is an error.
				</CardDescription>
			</CardHeader>
			<CardContent class="text-center">
				<Button onclick={() => window.history.back()}>
					Go Back
				</Button>
			</CardContent>
		</Card>
	</div>
</div>

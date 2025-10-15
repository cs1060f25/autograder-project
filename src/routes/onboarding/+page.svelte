<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
import CardContent from '$lib/components/ui/card-content.svelte';
import CardDescription from '$lib/components/ui/card-description.svelte';
import CardHeader from '$lib/components/ui/card-header.svelte';
import CardTitle from '$lib/components/ui/card-title.svelte';
	import { UserPlus } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Onboarding - AI Grading Platform</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full">
		<Card>
			<CardHeader class="text-center">
				<UserPlus class="h-12 w-12 mx-auto mb-4 text-blue-500" />
				<CardTitle class="text-2xl">Complete Your Profile</CardTitle>
				<CardDescription>
					Please complete your profile setup to continue using the platform.
				</CardDescription>
			</CardHeader>
			<CardContent class="text-center">
				<p class="text-sm text-gray-600 mb-4">
					This feature is coming soon. Please contact your administrator for assistance.
				</p>
				<Button onclick={() => window.location.href = '/login'}>
					Return to Login
				</Button>
			</CardContent>
		</Card>
	</div>
</div>

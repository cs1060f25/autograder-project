<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	export let form: { error?: string } | undefined;
</script>

<svelte:head>
	<title>Login - AI Grading Platform</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Sign in to your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Or
				<a href="/signup" class="font-medium text-indigo-600 hover:text-indigo-500">
					create a new account
				</a>
			</p>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Login to your account</CardTitle>
				<CardDescription>
					Enter your email below to login to your account.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if form?.error}
					<Alert variant="destructive" class="mb-4">
						{form.error}
					</Alert>
				{/if}

				<form method="POST" action="?/signin" use:enhance>
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="john@college.harvard.edu"
								required
							/>
						</div>
						<div class="space-y-2">
							<Label for="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="Enter your password"
								required
							/>
						</div>
						<Button type="submit" class="w-full">
							Login
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>

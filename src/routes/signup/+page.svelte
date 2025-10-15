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
	<title>Sign Up - AI Grading Platform</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Create your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Or
				<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
					sign in to your existing account
				</a>
			</p>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
				<CardDescription>
					Enter your information below to create your account.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if form?.error}
					<Alert variant="destructive" class="mb-4">
						{form.error}
					</Alert>
				{/if}

				<form method="POST" action="?/signup" use:enhance>
					<div class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="firstName">First Name</Label>
								<Input
									id="firstName"
									name="firstName"
									type="text"
									placeholder="John"
									required
								/>
							</div>
							<div class="space-y-2">
								<Label for="lastName">Last Name</Label>
								<Input
									id="lastName"
									name="lastName"
									type="text"
									placeholder="Doe"
									required
								/>
							</div>
						</div>
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
							<Label for="role">Role</Label>
							<select
								id="role"
								name="role"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								required
							>
								<option value="student">Student</option>
								<option value="instructor">Instructor</option>
								<option value="ta">Teaching Assistant</option>
							</select>
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
						<div class="space-y-2">
							<Label for="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								placeholder="Confirm your password"
								required
							/>
						</div>
						<Button type="submit" class="w-full">
							Create Account
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>

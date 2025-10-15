<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let htmlFor: string = '';
</script>

<label
	for={htmlFor}
	class={cn(
		'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
		className
	)}
	on:click
	{...$$restProps}
>
	<slot />
</label>

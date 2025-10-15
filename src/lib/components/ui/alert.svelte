<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let variant: 'default' | 'destructive' = 'default';
</script>

<div
	class={cn(
		'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
		variant === 'destructive' && 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
		className
	)}
	{...$$restProps}
>
	<slot />
</div>

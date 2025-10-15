<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
</script>

<h3 class={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...$$restProps}>
	<slot />
</h3>

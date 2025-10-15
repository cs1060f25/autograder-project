<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
</script>

<div class={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...$$restProps}>
	<slot />
</div>

<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
</script>

<div class={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...$$restProps}>
	<slot />
</div>

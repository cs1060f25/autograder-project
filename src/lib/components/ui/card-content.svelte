<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
</script>

<div class={cn('p-6 pt-0', className)} {...$$restProps}>
	<slot />
</div>

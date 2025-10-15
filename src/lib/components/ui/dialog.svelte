<script lang="ts">
	import { cn } from '$lib/utils';

	export let open: boolean = false;
	export let className: string = '';
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="fixed inset-0 bg-black/50" on:click={() => (open = false)}></div>
		<div class={cn('relative z-50 w-full max-w-lg', className)} {...$$restProps}>
			<slot />
		</div>
	</div>
{/if}

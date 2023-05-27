<script lang="ts">
    import { Link } from 'svelte-routing';

    export let customClasses = '';
    export let bgColor = '';

    // For forms
    export let btnSubmit = false;

    // For links (anchors)
    export let btnLink = false;
    export let path = '';
</script>

{#if btnSubmit}
    <button type="submit" class="{customClasses} {bgColor}"><slot /></button>
{:else if btnLink}
    <Link to="{path}">
        <button class="{customClasses} {bgColor}"><slot /></button>
    </Link>
{:else}
    <button class="{customClasses} {bgColor}"><slot /></button>
{/if}
<style>
    .btn {
        padding: 0.75rem;
        width: 100%;
        border: none;
        font-size: 0.75rem;
        text-align: center;
        border-radius: 0.25rem;
        cursor: pointer;
    }

    /* background colors */
    .btn__brown {
        background-color: #6d4927;
        color: #fff;
    }

    .btn__brown:hover {
        background-color: #5c3e21;
    }

    .btn__brown:active {
        background-color: #53371d;
    }

    .btn__orange {
        background-color: #af4819;
        color: #fff;
    }

    .btn__orange:hover {
        background-color: #a54417;
    }

    .btn__orange:active {
        background-color: #973e14;
    }
</style>
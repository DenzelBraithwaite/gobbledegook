<script lang="ts">
    import { Link } from 'svelte-routing';

    export let customClasses = '';
    export let bgColor = '';

    // For game
    export let gobbledegook = false;

    // For forms
    export let btnSubmit = false;

    // For links (anchors)
    export let btnLink = false;
    export let path = '';
</script>

{#if btnSubmit}
    <button on:click type="submit" class="{customClasses} {bgColor}"><slot /></button>
{:else if btnLink}
    <Link to="{path}">
        <button on:click class="{customClasses} {bgColor}"><slot /></button>
    </Link>
{:else if gobbledegook}
    <button on:click class="gobbledegook">Gobbledegook!</button>
{:else}
    <button on:click class="{customClasses} {bgColor}"><slot /></button>
{/if}

<style>
    button {
        padding: 0.75rem;
        border: none;
        font-size: 0.75rem;
        text-align: center;
        border-radius: 0.25rem;
        cursor: pointer;
        margin: 0.5rem 0;
    }

    .gobbledegook {
        background-color: #CAB097;
        color: #c04d31;
        font-weight: bold;
        font-size: 1rem;
        height: 10rem;
        width: 10rem;
        border-radius: 50%;
        text-align: center;
        border: 0.25rem solid #c04d31;
        transition: all 0.25s ease-out;
        font-family: Roboto;
    }

    .gobbledegook:hover {
        scale: 1.1;
        font-weight: 900;
        background-color: #c04d31;
        color: #CAB097;
        border-color: #CAB097;
    }

    /* utility classes */
    .w-100 {
        width: 100%;
    }

    .w-50 {
        width: 50%;
        display: block;
        margin-left: auto;
        margin-right: auto;
    }

    .w-25 {
        width: 25%;
        display: block;
        margin-left: auto;
        margin-right: auto;
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
    
    .btn__green {
        background-color: #31a744;
        color: #fff;
    }

    .btn__green:hover {
        background-color: #2d9b3f;
    }

    .btn__green:active {
        background-color: #278b38;
    }
</style>
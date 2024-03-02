<script lang="ts">
  import { Link } from 'svelte-routing';

  export let customClasses = '';
  export let bgColor = '';

  // For game
  export let round = false;

  // For forms
  export let btnSubmit = false;
</script>

{#if btnSubmit}
  <button on:click type="submit" class="{customClasses} {bgColor}"><slot /></button>
{:else if round}
  <button on:click class="round {customClasses}"><slot /></button>
{:else}
  <button on:click class="{customClasses} {bgColor}"><slot /></button>
{/if}

<style lang="scss">
  button {
    padding: 0.75rem;
    border: none;
    font-size: 0.75rem;
    text-align: center;
    border-radius: 0.25rem;
    cursor: pointer;
    margin: 0.5rem 0;
    transition: all 0.15s ease-out;
  }

  .round {
    font-weight: bold;
    font-size: 1.75rem;
    height: 9rem;
    width: 9rem;
    border-radius: 50%;
    text-align: center;
    font-family: Roboto;
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
  .btn__green {
    background-color: #217f30;
    color: #fff;
    box-shadow: 0 8px 0 #1a5f25;
    border: 2px solid #1a5f25;
  }

  .btn__green:hover {
    background-color: #278637;
  }

  .btn__green:active {
    transform: translate(0, 8px);
    box-shadow: 0 0 0 #1a5f25;
  }
  
  .btn__green_disabled {
    background-color: #7bc287c9;
    color: #fff;
    box-shadow: 0 8px 0 #345239;
    border: 2px solid #345239;
  }

  .btn__green_disabled:hover {
    background-color: #497752;
  }

  .btn__green_disabled:active {
    transform: translate(0, 1px);
    box-shadow: 0 7px 0 #345239;
  }

  .btn__grey:hover {
    background-color: #7bc287c9;
  }

  .btn__grey:active {
    background-color: #7bc287c9;
  }
      
  .btn__orange {
    background-color: #c04d31;
    color: #CAB097;
    box-shadow: 0 8px 0 #692b1c;
    border: 2px solid #692b1c;
  }

  .btn__orange:hover {
    background-color: #993e27;
  }

  .btn__orange:active {
    transform: translate(0, 8px);
    box-shadow: 0 0 0 #692b1c;
  }
      
  .btn__orange_disabled {
    background-color: #dd816b;
    color: #cacaca9d;
    box-shadow: 0 8px 0 #724337;
    border: 2px solid #724337;
  }

  .btn__orange_disabled:hover {
    background-color: #c5735f;
  }

  .btn__orange_disabled:active {
    transform: translate(0, 1px);
    box-shadow: 0 7px 0 #724337;
  }
          
  .btn__brown {
    background-color: #814d2f;
    color: #CAB097;
    box-shadow: 0 8px 0 #5c3824;
    border: 2px solid #613922;
  }

  .btn__brown:hover {
    background-color: #6b4128;
  }

  .btn__brown:active {
    transform: translate(0, 8px);
    box-shadow: 0 0 0 #613922;
  }

  /* For mobile devices */
  @media only screen and (max-width: 1100px) {
    button {
      padding: 0.5rem;
      font-size: 0.4rem;
      border-radius: 0.125rem;
      margin: 0.25rem 0;
    }

    .round {
      font-size: 1rem;
      height: 6rem;
      width: 6rem;
    } 
  }

  @media only screen and (max-width: 800px) {
    button {
      padding: 0.4rem;
    }

    .round {
      font-size: 0.75rem;
      height: 4rem;
      width: 4rem;
    } 
  }
</style>
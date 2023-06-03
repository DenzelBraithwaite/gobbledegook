<script lang="ts">
  export let blurred: boolean = false;
</script>

{#if blurred}
  <div class="card blur">
    <p>Enemy Card</p>
  </div>
{:else}
  <div class="card">
    <p>You card</p>
  </div>
{/if}

<style>
  .card {
    display: inline-block;
    width: 125px;
    height: 150px;
    position: relative;
    text-align: center;
    padding: 1rem;
    background-color: #f3d5b3;
    border-radius: 0.25rem;
    box-shadow: 0 4px 10px #000000a8;
    margin: 0 auto;
  }

  .blur {
    filter: blur(1.5px);
  }
</style>
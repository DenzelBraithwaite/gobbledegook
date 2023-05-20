<script lang="ts">
  // GobbledeGook card
  import GGCard from './lib/Card.svelte';
  import Api from './lib/Api.svelte';


</script>

<main>
  <div class="container">
    <GGCard />
    <Api />
  </div>
</main>

<style>
  main {
    position: relative;
  }
  
  .container {
    padding-top: 1rem;
    background-color: #4d2f0c;
    width: 60%;
    max-width: 1000px;
    margin: 0 auto;
    min-height: 100vh;
  }
</style>

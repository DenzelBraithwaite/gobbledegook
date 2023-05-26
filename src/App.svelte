<script lang="ts">
  // GobbledeGook card
  import GGCard from './lib/Card.svelte';
  import Api from './lib/Api.svelte';

  // Other custom components
  import LoginForm from './lib/LoginForm.svelte';


</script>

<main>
  <LoginForm />
  <div class="container">
    <!-- <GGCard /> -->
    <Api />
  </div>
</main>

<style>
  main {
    padding-top: 5rem;
    position: relative;
    /* background-image: url('/gg.png'); */
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    /* filter: blur(1rem); */
  }
  
  .container {
    padding-top: 1rem;
    background-color: #633f1e;
    width: 60%;
    max-width: 1000px;
    margin: 0 auto;
    min-height: 100vh;
  }
</style>

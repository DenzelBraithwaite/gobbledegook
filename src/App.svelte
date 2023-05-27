<script lang="ts">
  // Hooks
  import { Router, Route} from 'svelte-routing';

  // Pages/Routes
  import Home from '../src/routes/home.svelte';
  import Login from '../src/routes/login.svelte';

  let userLoggedIn = false;
</script>

{#if userLoggedIn}
  <Router>
    <Route path="/" component={Home}/>
  </Router>
{:else}
<Router>
  <Route path="/" component={Login}/>
</Router>
{/if}

<style>

</style>

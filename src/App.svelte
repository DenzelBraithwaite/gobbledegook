<script lang="ts">
  // Plugins
  import { Router, Route} from 'svelte-routing';

  // Pages/Routes
  import Home from './routes/home.svelte';
</script>

<Router>
  <Route path="/home" component={Home}/>
  <Route path="/" component={Home} />
</Router>

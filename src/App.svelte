<script lang="ts">
  // Hooks
  import { onMount } from 'svelte';
  
  // Plugins
  import { Router, Route} from 'svelte-routing';

  // Pages/Routes
  import Home from '../src/routes/home.svelte';
  import LoginPage from '../src/routes/login.svelte';

  onMount(() => {
    const cookieArray = (document.cookie.split(';'));
    const loggedInCookie = cookieArray[1];
    const userCookie = cookieArray[2];

    if (loggedInCookie) {
      userLoggedIn = true;
      user = userCookie;
    }
  });

  let userLoggedIn: boolean = false;
  let user: String = 'guest';

  function userLoginHandler(event) {
    userLoggedIn = event.detail.userLogged;
    user = event.detail.username;
    document.cookie = `userLoggedIn=${userLoggedIn}`;
    document.cookie = `username=${user}`;
  };
</script>

{#if userLoggedIn}
  <Router>
    <Route path="/home" component={Home}/>
    <Route path="/" component={Home} />
  </Router>
{:else}
  <Router>
    <Route path="/">
      <LoginPage on:onUserLogin={userLoginHandler}/>
    </Route>
    <Route path="/home">
      <LoginPage on:onUserLogin={userLoginHandler}/>
    </Route>
</Router>
{/if}

<style>

</style>

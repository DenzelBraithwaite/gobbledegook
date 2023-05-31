<script lang="ts">
  // Svelte Hooks
  import { createEventDispatcher } from 'svelte';
  
  // Custom components
  import LoginForm from '../lib/LoginForm.svelte';
  
  const createEvent = createEventDispatcher();

  function loginHandler(event) {
    createEvent('onUserLogin', event.detail);
  };
</script>
  
  <main>
    <div class="login-container">
        <LoginForm on:userLogin={loginHandler}/>
    </div>
  </main>
  
<style>
    main {
        height: 100vh;
        width: 100vw;
        position: relative;
        background-image: linear-gradient(to top, #000000bb, transparent), url('/gg.png');
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;

        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
  
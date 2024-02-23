<script lang="ts">
    // Plugins
    import { Link } from 'svelte-routing';
        
    // Other custom components
    import Game from '../lib/components/Game.svelte';
    import LoginForm from '../lib/components/LoginForm.svelte';
  
  </script>
  
  <main>
      <Game />
  </main>
  
  <style>
    main {
      width: 100%;
      height: 100%;
      position: relative;
      padding-top: 1rem;
    }
    
  </style>
  
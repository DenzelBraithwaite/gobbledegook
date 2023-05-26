<script lang="ts">
  // Svelte hooks
  import { onMount } from 'svelte';


  let gameTitle = 'no title yet';
  let otherData = 'no other data yet';
  let json = '';

  onMount(async () => {
    const response = await fetch('http://localhost/projects/gobbledegook_backend/api.php');
    const data = await response.json();
    gameTitle = data.title;
    otherData = data.testKey;
    otherData = data;
  });
</script>


<p>The variable value is: {gameTitle}</p>
<p>The variable value is: {otherData}</p>
<p>The full POST data is: {json}</p>


<style>
  p {
    color: red;
  }
</style>
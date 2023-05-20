<script lang="ts">
  import { onMount } from 'svelte';

  let gameTitle = 'no title yet';
  let otherData = 'no other data yet';

  onMount(async () => {
    const response = await fetch('http://localhost/projects/gobbledegook_backend/api.php');
    const data = await response.json();
    gameTitle = data.title;
    otherData = data.testKey;
  });
</script>


<p>The variable value is: {gameTitle}</p>
<p>The variable value is: {otherData}</p>



<style>
  p {
    color: red;
  }
</style>
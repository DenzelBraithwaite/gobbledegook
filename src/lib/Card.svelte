<script>
  // hooks
  import { createEventDispatcher } from 'svelte';

  export let faceDown = false;
  export let blur = false;

  // props
  export let displayTitle = 'Title here...';
  export let title = '';
  export let img = '/public/card-bg.png';
  export let points = 0;
  export let race = 'none';
  export let trait = 'none';

  const createEvent = createEventDispatcher();

  function cardClickHandler(event) {    
    createEvent('cardClick', {
      'title': title,
      'points': points,
      'race': race,
      'trait': trait
    })
  }
</script>

{#if faceDown}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div on:click class="card facedown bottom-deck"></div>
{:else if blur}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div on:click={cardClickHandler} class="card bg-{race} {blur ? 'blur' : ''}">
    <img class="card-img" src={img} alt="img of card">
    <div class="card-bottom-section">
      <p class="card-title">{displayTitle}</p>
      <p>Race: {race}</p>
      <p>Points: {points}</p>
      <p>Special trait: {trait}</p>
    </div>
  </div>
{:else}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click={cardClickHandler} class="card bg-{race} {blur ? 'blur' : ''}">
  <img class="card-img" src={img} alt="img of card">
  <div class="card-bottom-section">
    <p class="card-title">{displayTitle}</p>
    <p>Race: {race}</p>
    <p>Points: {points}</p>
    <p>Special trait: {trait}</p>
  </div>
</div>
{/if}

<style>
  .card {
    z-index: 1;
    cursor: pointer;
    position: relative;
    width: 11rem;
    height: 15rem;
    border-radius: 0.25rem;
    box-shadow: 0 4px 12px #00000063;
    transition: all 0.3s ease-out;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
  }

  .card:hover {
    scale: 1.5;
    z-index: 2;
    box-shadow: 0 4px 12px #000000a8;
  }

  .card-title {
    text-shadow: 0 2px 8px #00000062;
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    background-color: #cf9c8e82;
    border-radius: 0.5rem;
  }

  .card-img {
    height: 150px;
    width: 150px;
    border-radius: 0.25rem 0.25rem 0 0;
    background-size: cover;
  }

  .card-bottom-section {
    overflow-y: scroll;
    height: 40%;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-self: center;
    gap: 0.5rem;
  }

  .description::-webkit-scrollbar,
  .card-bottom-section::-webkit-scrollbar {
    background: transparent;
    width: 0;
  }

  .description {
    width: 90%;
    margin: 0 auto;
    font-size: 0.8rem;
    padding: 0.25rem;
    color: #ffe7d7;
    overflow-y: scroll;
  }

  .facedown {
    background: url('/public/card-bg.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }

  .facedown:hover {
    scale: 1.05;
    transform: translate(0, -0.4rem);
  }

  .facedown:active {
    scale: 1;
  }

  /* Utility classes */
  .blur {
    opacity: 10%;
    filter: blur(50px);
  }

  .flip-180 {
    transform: rotate(0.5turn);
  }

  /* bg color based on race */
  .bg-human {
    background: linear-gradient(to top left, #324277, #69c0ad 50%);
    outline: 4px solid #324277a8;
  }

  .bg-human-rare {
    background: linear-gradient(to top left, #324277 5%, #e0de69, #69c0ad 90%);
    outline: 4px solid #324277a8;
  }

  .bg-goblin {
    background: linear-gradient(to top left, #327738, #78c069 50%);
    outline: 4px solid #327738a8;
  }

  .bg-goblin-rare {
    background: linear-gradient(to top left, #327738 5%, #e0de69, #78c069 90%);
    outline: 4px solid #327738a8;
  }

  .bg-elf {
    background: linear-gradient(to top left, #726b7a, #ddceee 50%);
    outline: 4px solid #726b7a;
  }

  .bg-elf-rare {
    background: linear-gradient(to top left, #726b7a 5%, #e0de69, #ddceee 90%);
    outline: 4px solid #726b7a;
  }

  .bg-dwarf {
    background: linear-gradient(to top left, #774b32, #c07369 50%);
    outline: 4px solid #774b32a8;
  }

  .bg-dwarf-rare {
    background: linear-gradient(to top left, #774b32 5%, #e0de69, #c07369 90%);
    outline: 4px solid #774b32a8;
  }
  
  .bg-bot {
    background: linear-gradient(to top left, #424242, #7e7e7e 50%);
    outline: 4px solid #424242;
  }

  .bg-bot-rare {
    background: linear-gradient(to top left, #424242 5%, #e0de69, #7e7e7e 90%);
    outline: 4px solid #424242;
  }
  
  .bg-beast {
    background: linear-gradient(to top left, #55431e, #855a2a 50%);
    outline: 4px solid #55431e;
  }

  .bg-beast-rare {
    background: linear-gradient(to top left, #614d22 5%, #e0de69b6, #855a2a 90%);
    outline: 4px solid #774b32a8;
  }

</style>
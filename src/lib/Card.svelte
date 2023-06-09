<script>
  // hooks
  import { createEventDispatcher } from 'svelte';

  export let faceDown = false;
  export let blur = false;

  // props
  export let title = 'Title here...'
  export let img = '/public/card-bg.png';
  export let points = 0;
  export let race = 'none';
  export let trait = 'none';

  const createEvent = createEventDispatcher();

  function cardClickHandler(info) {    
    createEvent('cardClick', {
      'title': title,
      'points': points,
      'race': race,
      'trait': trait
    })
  }
</script>

{#if faceDown}
  <div on:click={cardClickHandler} class="card facedown bottom-deck"></div>
{:else if blur}
  <div on:click={cardClickHandler} class="card bg-{race} blur">
    <img class="card-img" src={img} alt="img of card">
    <div class="card-bottom-section">
      <p class="card-title">{title}</p>
      <p>Race: {race}</p>
      <p>Points: {points}</p>
      <p>Special trait: {trait}</p>
    </div>
  </div>
{:else}
<div on:click={cardClickHandler} class="card bg-{race}">
  <img class="card-img" src={img} alt="img of card">
  <div class="card-bottom-section">
    <p class="card-title">{title}</p>
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
    scale: 1;
    transform: translate(0, -0.4rem);
  }

  /* Utility classes */
  .blur {
    filter: blur(1.5px);
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
    background: linear-gradient(to top left, #324277, #e0de69, #69c0ad);
    outline: 4px solid #324277a8;
  }

  .bg-goblin {
    background: linear-gradient(to top left, #327738, #78c069 50%);
    outline: 4px solid #327738a8;
  }

  .bg-goblin-rare {
    background: linear-gradient(to top left, #327738, #e0de69, #78c069);
    outline: 4px solid #327738a8;
  }

  .bg-elf {
    background: linear-gradient(to top left, #7e837f, #c7cbce 50%);
    outline: 4px solid #7e837fa8;
  }

  .bg-elf-rare {
    background: linear-gradient(to top left, #7e837f, #e0de69, #c7cbce);
    outline: 4px solid #7e837fa8;
  }

  .bg-dwarf {
    background: linear-gradient(to top left, #774b32, #c07369 50%);
    outline: 4px solid #774b32a8;
  }

  .bg-dwarf-rare {
    background: linear-gradient(to top left, #774b32, #e0de69, #c07369);
    outline: 4px solid #774b32a8;
  }

</style>
<script>
  // hooks
  import { createEventDispatcher } from 'svelte';

  // props
  export let faceDown = false;
  export let displayTitle = 'Title here...';
  export let title = '';
  export let img = '/card-bg.png';
  export let points = 0;
  export let race = 'none';
  export let description = '';
  export let trait = '';
  export let traitTitle = '';
  export let newToHand = false;

  const createEvent = createEventDispatcher();

  function cardClickHandler(event) {    
    createEvent('cardClick', {
      'title': title,
      'points': points,
      'race': race,
      'trait': trait
    })
  }

  function capitalize(string){
    const firstHalf = string[0].toUpperCase();
    const secondHalf = string.slice(1);
    return firstHalf + secondHalf;
  };
</script>

{#if faceDown}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div on:click class="card facedown bottom-deck"></div>
{:else}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click={cardClickHandler} class="card bg-{race} {blur ? 'blur' : ''} {newToHand ? 'slide-in' : ''}">
  <img class="card-img" src={img} alt="img of card">
  <p class="race {race}-race">{capitalize(race)}</p>
  <p class="points {race}-race">{points}</p>
  <p class="card-title {race}-title">{displayTitle}</p>
  <div class="card-bottom-section">
    <div class="bottom-section-wrapper">
      <p class="description">{description}</p>
      {#if trait}<p class="special-trait">{traitTitle}</p>{/if}
      <p>{trait}</p>
    </div>
  </div>
</div>
{/if}

<style>
  /* Animation */
  @keyframes slideInLeft {
    from {
      transform: translateX(100px);
    }

    to {
      transform: translateX(0);
    }
  }

  .slide-in {
    /* Animation */
    animation-name: slideInLeft;
    animation-duration: 1s;
    /* animation-timing-function: ; */
    /* animation-delay: ; */
    /* animation-iteration-count: ; */
    /* animation-direction: ; */
    /* animation-fill-mode: ; */
  }

  .card {
    z-index: 0;
    cursor: pointer;
    position: relative;
    width: 10.5rem;
    height: 14.5rem;
    border-radius: 0.25rem;
    box-shadow: 0 4px 12px #00000063;
    transition: all 0.3s ease-out;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
  }

  .card:hover {
    scale: 1.4;
    z-index: 2;
    box-shadow: 0 4px 12px #000000a8;
  }

  .card-bottom-section {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #ffffff3b;
    overflow-y: scroll;
    border-radius: 0.25rem;
    text-align: center;
    line-height: 1.125;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .card-title {
    color: #ddd;
    width: 100%;
    height: 4rem;
    text-shadow: 0 2px 8px #000000a8;
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    z-index: 10;
    white-space: nowrap;
    font-size: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-img {
    height: 55%;
    width: 100%;
    object-fit: contain;
    object-position: center;
    border-radius: 0.25rem 0.25rem 0 0;
  }

  .bottom-section-wrapper::-webkit-scrollbar,
  .card-bottom-section::-webkit-scrollbar {
    background: transparent;
    width: 0;
  }

  .bottom-section-wrapper {
    width: 90%;
    padding-bottom: 0.9rem;
    font-size: 0.85rem;
    color: #ebebeb;
    text-shadow: 0 1px 3px #0000008f;
    padding-top: 0.5rem;
    overflow-y: scroll;
  }

  .race {
    color: #eee;
    z-index: 10;
    text-align: center;
    font-weight: 500;
    font-size: 0.8rem;
    letter-spacing: 1px;
    height: 1.5rem;
    border-radius: 1rem;
    padding: 0.25rem;
    width: 3.75rem;
    box-shadow: inset -2px -2px 8px #0000004d;

    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-25px, 10px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .points {
    color: #eee;
    z-index: 10;
    text-align: center;
    font-weight: 500;
    font-size: 0.9rem;
    letter-spacing: 1px;
    height: 1.75rem;
    width: 1.75rem;
    border-radius: 0 0 0.75rem 0;
    box-shadow: inset -2px -2px 8px #0000004d;

    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .special-trait {
    font-weight: bold;
    color: #fdf3c8;
  }

  .description {
    margin-bottom: 0.5rem;
  }

  .facedown {
    background: url('/card-bg.png');
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

  /* Race text color */
  .human-race {
    background-color: #324277;
    border: 2px solid #324277;
  }

  .goblin-race {
    background-color: #327738;
    border: 2px solid #327738;
  }

  .elf-race {
    background-color: #726b7a;
    border: 2px solid #726b7a;
  }

  .dwarf-race {
    background-color: #774b32;
    border: 2px solid #774b32;
  }

  .bot-race {
    background-color: #424242;
    border: 2px solid #424242;
  }

  .beast-race {
    background-color: #55431e;
    border: 2px solid #55431e;
  }

  /* race title color */
  .human-title {
    background-color: #3242775e;
  }

  .goblin-title {
    background-color: #3277385e;
  }

  .elf-title {
    background-color: #726b7a5e;
  }

  .dwarf-title {
    background-color: #774b325e;
  }

  .bot-title {
    background-color: #4242425e;
  }

  .beast-title {
    background-color: #55431e5e;
  }
</style>
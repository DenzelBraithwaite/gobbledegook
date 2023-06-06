<script>
  export let faceDown = false;
  export let bottomDeck = true;
  export let blurred = false;

  export let title = 'Title here...'
  export let img = '/public/card-bg.png';
  export let description = 'Card description here...';
  export let points = 0;
  export let race;
  export let trait = 'none';
</script>

{#if faceDown}
  {#if bottomDeck}
    <div class="card facedown bottom-deck"></div>
  {:else}
    <div class="card facedown top-deck"></div>
  {/if}
{:else}
  <div class="card">
    <p class="card-title">{title}</p>
      <img class="card-img" src={img} alt="img of card">
    <div class="card-bottom-section">
      <p class="description">{description}</p>
      <p>Race: {race}</p>
      <p>Points: {points}</p>
      <p>Special trait: {trait}</p>
    </div>
  </div>
{/if}

<style>
  .card {
    cursor: pointer;
    position: relative;
    width: 185px;
    height: 250px;
    background: linear-gradient(to top left, #1b1b1b, #975734);
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
    z-index: 10;
    box-shadow: 0 4px 12px #000000a8;
  }

  .card-title {
    color: #a5dab7;
    text-shadow: 0 2px 4px #000;
    font-size: 1.25rem;

    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
  }

  .card-img {
    height: 55%;
    width: 180px;
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

  /* Utility classes */
  .blur {
    filter: blur(1.5px);
  }

  .flip-180 {
    transform: rotate(0.5turn);
  }

  .bottom-deck {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
  }

  .top-deck {
    position: absolute;
    top: 2rem;
    right: 2rem;
  }

</style>
<script>
  export let faceDown = false;
  export let blurred = false;
  export let img = '/public/card-bg.png';
  export let description = 'Card description here...';
  export let dmg;
  export let points;
  export let hp;
</script>

{#if faceDown}
  <div class="card facedown"></div>
{:else}
  <div class="card">
      <img class="card-img" src={img} alt="img of card">
    <div class="card-bottom-section">
      <p class="description">{description}</p>
      <div class="stats-section">
        <p class="stat dmg-stat">{dmg}</p>
        <p class="stat point-stat">{points}</p>
        <p class="stat hp-stat">{hp}</p>
      </div>
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

  .stats-section {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
  }

  .description {
    width: 90%;
    margin: 0 auto;
    font-size: 0.8rem;
    padding: 0.25rem;
    color: #ffe7d7;
    overflow-y: scroll;
  }
  
  .stat {
    color: #fff;
    font-weight: bold;
    font-size: 0.75rem;
    height: 1.5rem;
    width: 1.5rem;
    border-radius: 40%;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .dmg-stat {
    background: linear-gradient(to top left, #5a0000, #d31d1d);
  }

  .point-stat {
    background: linear-gradient(to top left, #333, #b3b3b3);
  }

  .hp-stat {
    background: linear-gradient(to top left, #00095a, #2f1dd3);
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

</style>
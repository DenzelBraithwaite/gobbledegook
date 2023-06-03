<script lang="ts">
  export let blurred: boolean = false;
</script>

{#if blurred}
<div class="card blur"></div>
{:else}
  <div class="card">
    <img class="card-img" src="/public/goblin-card-img.png" alt="img of card">
    <div class="card-bottom-section">
      <p class="description">Description here: Lorem ipsum dolor sit amet consectetur adipisicing elit. A, vero iure quo voluptatum eligendi minus qui et? Dolores, ipsa accusantium eaque recusandae veritatis omnis unde porro nisi explicabo non rem.</p>
      <div class="stats-section">
        <p class="stat dmg-stat">0-1</p>
        <p class="stat point-stat">1</p>
        <p class="stat hp-stat">1</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .card {
    position: relative;
    width: 200px;
    height: 250px;
    background-color: #1b1b1b;
    border-radius: 0.25rem;
    box-shadow: 0 4px 12px #00000063;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
  }

  .card-img {
    height: 55%;
    border-radius: 0.25rem 0.25rem 0 0;
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
    background-color: red;
  }

  .point-stat {
    background-color: #333333;
  }

  .hp-stat {
    background-color: blue;
  }

  /* Utility classes */
  .blur {
    /* filter: blur(1.5px); */
    background: url('/public/card-bg.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }
</style>
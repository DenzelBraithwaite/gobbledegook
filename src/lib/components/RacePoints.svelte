<script>
  export let player = {};
</script>

<h2>Race Points:</h2>
<div class="race-points">
  <div>
    <p class="race-point__blue bold ">H</p>
    <p class="race-point__blue">{player.points.humans}</p>
  </div>
  <div>
    <p class="race-point__green bold">G</p>
    <p class="race-point__green">{player.points.goblins}</p>
  </div>
  <div>
    <p class="race-point__maroon bold">D</p>
    <p class="race-point__maroon">{player.points.dwarves}</p>
  </div>
  <div>
    <p class="race-point__silver bold">E</p>
    <p class="race-point__silver">{player.points.elves}</p>
  </div>
  <div>
    <!-- Bots -->
    <p class="race-point__grey bold">B</p>
    <p class="race-point__grey">{player.points.bots}</p>
  </div>
  <div>
    <!-- Beasts -->
    <p class="race-point__brown bold">B</p>
    <p class="race-point__brown">{player.points.beasts}</p>
  </div>
  <div>
    <p class="race-point__yellow bold">X</p>
    <p class="race-point__yellow">{player.points.xenos}</p>
  </div>
</div>

<style lang="scss">
  h2 {
    margin-top: 1rem;
    font-size: 1rem;
  }
  
  .race-points {
    text-align: center;

    display: flex;
    gap: 0.125rem;
  }

  .race-point__blue {
    color: #324277;
    background-color: #32773834;
    border: 1px solid #324277;
    padding: 0.125rem;
  }

  .race-point__green {
    color: #327738;
    background-color: #32773834;
    border: 1px solid #327738;
    padding: 0.125rem;
  }

  .race-point__brown {
    color: #55431e;
    background-color: #55431e34;
    border: 1px solid #55431e;
    padding: 0.125rem;
  }

  .race-point__grey {
    color: #424242;
    background-color: #42424234;
    border: 1px solid #424242;
    padding: 0.125rem;
  }

  .race-point__maroon {
    color: #c07369;
    background-color: #c0736934;
    border: 1px solid #c07369;
    padding: 0.125rem;
  }

  .race-point__silver {
    color: #baaec6;
    background-color: #ddceee34;
    border: 1px solid #baaec6;
    padding: 0.125rem;
  }

  .race-point__yellow {
    color: #8e7419;
    background-color: #8e741934;
    border: 1px solid #8e7419;
    padding: 0.125rem;
  }
</style>
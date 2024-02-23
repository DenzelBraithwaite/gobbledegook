<script>
</script>

<div class="spinner"></div>


<style>
  .spinner {
    z-index: 100;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 100px dotted transparent;
    border-top-color: #276a20ea;
    animation: spin 1.25s linear infinite;
    box-shadow: 0 0 32px #276a20ea;

    position: absolute;
    left: 45%;
    top: 40%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
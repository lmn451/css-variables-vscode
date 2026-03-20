<script>
  let name = 'World';
</script>

<style>
:root {
  --svelte-primary: #1abc9c;
  --svelte-spacing: 20px;
  --svelte-font: 'Georgia', serif;
}

h1 {
  color: var(--svelte-primary);
  padding: var(--svelte-spacing);
  font-family: var(--svelte-font);
}
</style>

<div class="container">
  <h1>Hello {name}!</h1>
</div>

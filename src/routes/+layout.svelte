<script>
  import '../app.css';
  
  let { children } = $props();
</script>

<div class="min-h-screen bg-gray-100 py-8">
  {@render children()}
</div>

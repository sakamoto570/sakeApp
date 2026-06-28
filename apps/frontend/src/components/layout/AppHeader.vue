<template>
  <header class="app-header">
    <RouterLink class="brand" to="/">日本酒レコメンド</RouterLink>
    <nav>
      <RouterLink to="/drinks/new">新規記録</RouterLink>
      <RouterLink to="/favorites">お気に入り</RouterLink>
      <RouterLink to="/drinks">飲酒記録</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  align-items: center;
  border-bottom: 1px solid #d8ddd7;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  padding: 16px 24px;
}

.brand {
  color: #173f2b;
  font-weight: 700;
  text-decoration: none;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

nav a {
  color: #385140;
  text-decoration: none;
}

nav a.router-link-active {
  color: #173f2b;
  font-weight: 700;
}
</style>

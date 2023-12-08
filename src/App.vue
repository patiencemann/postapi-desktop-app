<template>
  <div id="id">
    <router-view>
      <HomeScreen></HomeScreen>
    </router-view>
  </div>
</template>

<script>
import HomeScreen from "./views/HomeScreen.vue";

export default {
  name: "App",
  components: {
    HomeScreen,
  },
};
</script>

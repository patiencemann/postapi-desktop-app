import { createWebHashHistory, createRouter } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "main",
      component: () => import("@/views/HomeScreen.vue"),
    },
    {
      path: "/login",
      name: "login",
      meta: { title: "Login" },
      component: () => import("@/views/LoginView.vue"),
    },
    {
      path: "/published",
      name: "published",
      meta: { title: "Published Collections" },
      component: () => import("@/views/PublishedView.vue"),
    },
    {
      path: "/collection/:collection",
      name: "collection",
      meta: { title: "Collection" },
      component: () => import("@/views/CollectionView.vue"),
    },
    {
      path: "/dashboard",
      name: "dashboard",
      meta: { title: "Dashboard" },
      component: () => import("@/views/DashboardScreen.vue"),
    },
    {
      path: "/:catchAll(.*)",
      meta: { title: "Not found" },
      component: () => import("@/views/NotFound.vue"),
    },
  ],
});
export default router;

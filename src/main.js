import { createApp } from "vue";
import router from "./router";
import { createPinia } from "pinia";
import App from ".//App.vue";

import "./assets/css/app.css";
import "./assets/css/neon.css";
import "./assets/css/section.css";
import "./assets/css/customized_tail.css";
import "./assets/tailwind.css";

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);

app.mount("#app");

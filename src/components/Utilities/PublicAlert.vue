<!-- eslint-disable prettier/prettier -->
<template>
    <div class="fixed bottom-2 right-5 z-50 w-96">
      <transition name="alert" :duration="200" mode="out-in" v-for="alert in alerts" :key="alert.id">
          <div :id="'alert_'+alert.id" class="flex z-50 items-center p-4 mb-4 max-w-md text-gray-500 bg-white rounded-xl shadow dark:text-gray-400 dark:bg-gray-800" role="alert" style="font-size: 15px">
  
              <div v-if="alert.responseType == 'success'" class="inline-flex flex-shrink-0 justify-center items-center w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                  <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                  <span class="sr-only">Check icon</span>
              </div>
  
              <div v-else class="inline-flex flex-shrink-0 justify-center items-center w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
                  <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                  <span class="sr-only">Error icon</span>
              </div>
  
              <div class="ml-3 font-normal" style="font-size: 15px !important">{{ alert.response }}</div>
          </div>
      </transition>
    </div>
</template>

<style>
.alert-enter-active {
  transition: all 0.3s ease-out;
}
.alert-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.alert-enter-from,
.alert-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>

<script>
import { appwriteCollections } from "../../configs/services";
import { AppwriteService } from "../../resources/AppwriteService";
import { useUserStore } from "../../stores/UserStore";
import { tryCatch } from "../../Utils/GeneralUtils";

export default {
  name: "PublicAlert",
  data() {
    return {
      user: useUserStore().get,
      database: AppwriteService().database(),
      alerts: [],
    };
  },
  mounted() {
    this.$root.$on("new_message", (payload) => {
      let id = Math.random().toString(16).slice(2);

      this.alerts.push({
        response: payload.response,
        responseType: payload.responseType,
        id,
      });

      setTimeout(function () {
        document.getElementById(`alert_${id}`).remove();
      }, 5000);

      // If alert should be saved in DB
      // eslint-disable-next-line no-prototype-builtins
      if (payload.hasOwnProperty("shouldSave") && payload.shouldSave) {
        tryCatch(() => {
          this.database.collection(appwriteCollections.notifications_table);
          this.database
            .create({
              user_id: useUserStore().get.$id,
              subject: payload.subject,
              message: payload.response,
              type: payload.responseType,
              source: payload.source,
            })
            .then(() => {});
        });
      }
    });
  },
};
</script>
../../../stores/UserStore../../../Utils/GeneralUtils../../../configs/services
<!-- eslint-disable prettier/prettier -->
<template>
  <transition name="alert" v-if="isLoading">
    <div id="toast-success" class="flex fixed z-30 bottom-2 right-5 items-center p-4 mb-4 max-w-md text-gray-500 bg-white rounded-xl shadow dark:text-gray-400 dark:bg-gray-800" role="alert" style="font-size: 15px">

      <div class="inline-flex flex-shrink-0 justify-center items-center w-8 h-8">
        <div>
          <span class="relative inset-0 inline-flex h-6 w-6 animate-spin items-center justify-center rounded-full border-2 border-gray-300 after:absolute after:h-8 after:w-8 after:rounded-full after:border-2 after:border-y-indigo-500 after:border-x-transparent"></span>
        </div>
      </div>

      <div class="ml-3 font-normal" style="font-size: 15px !important">{{ response }}</div>

      <button @click="diableAlert()" type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close">
        <span class="sr-only">Close</span>
        <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
  </transition>
</template>

<script>
import { appwriteCollections } from "../../configs/services";
import { AppwriteService } from "../../resources/AppwriteService";
import { useCollectionStore } from "../../stores/CollectionStore";
import { randomId, tryCatch } from "../../Utils/GeneralUtils";

export default {
  data() {
    return {
      storage: AppwriteService().storage(),
      database: AppwriteService().database(),
      isLoading: false,
      response: "",
      purposes: {
        create_new_item: "add_item",
        update_folder: "update_folder",
      },
    };
  },
  methods: {
    /**
     * Submit newly changes to user collection
     *
     * **** 1. Get current collection data
     * **** 2. Find the target instance to update
     * **** 3. iterate over and change by it id
     * **** 4. Create new blob with new changes
     * **** 5. Create new file and upload it
     * **** 6. Delete the previous file and update DB document by id
     * **** 7. Update Collection store (PINIA) with new changes
     * **** 8. Push new notification
     *
     * @param {Object} data
     */
    async updateCollection(data) {
      tryCatch(
        () => {
          this.isLoading = true;

          let collection = useCollectionStore().get;
          let collectionFile = collection.file;
          let newCollection = {};

          if (data.section == "info.name") {
            collectionFile.info.name = data.name;
          }
          if (data.section == "info.description") {
            collectionFile.info.description = data.description;
          }

          // eslint-disable-next-line no-prototype-builtins
          if (collectionFile.hasOwnProperty("info")) {
            newCollection.info = collectionFile.info;
          }

          // eslint-disable-next-line no-prototype-builtins
          if (collectionFile.hasOwnProperty("auth")) {
            newCollection.auth = collectionFile.auth;
          }

          // eslint-disable-next-line no-prototype-builtins
          if (collectionFile.hasOwnProperty("event")) {
            newCollection.event = collectionFile.event;
          }

          // eslint-disable-next-line no-prototype-builtins
          if (collectionFile.hasOwnProperty("item")) {
            newCollection.item = collectionFile.item;
          }

          if (data.section == "item") {
            let collectionItems = this.traverseThroughJSON(
              collectionFile.item,
              data.id,
              this.purposes.update_folder,
              data
            );

            newCollection.item = collectionItems;
          }

          const blob = new Blob([JSON.stringify(newCollection)], {
            type: "application/json",
          });

          const file = new File(
            [blob],
            "patienceman_" + randomId(10) + ".json",
            {
              type: blob.type,
            }
          );

          // Create new file and update user collection document
          this.storage.store(file).then((collectionFile) => {
            const data = {
              storage_file_id: collectionFile.$id,
              collection_url: collectionFile.name,
            };

            this.database.collection(appwriteCollections.collection_table);
            this.database.update(collection.$id, data).then((response) => {
              this.storage.destroy(collection.file_id).then(() => {
                useCollectionStore().store({
                  ...response,
                  file: newCollection,
                  file_id: collectionFile.$id,
                });

                this.$root.$emit("new_message", {
                  responseType: "success",
                  response: "File updated successfully",
                  subject: "Updating file",
                  source: "/",
                  shouldSave: true,
                });

                this.isLoading = false;
              });
            });
          });
        },
        () => {
          this.isLoading = false;
          this.$root.$emit("new_message", {
            responseType: "error",
            response: "Unable to update file",
          });
        }
      );
    },

    /**
     * Traverse and update json file based on search
     * and requested changes
     */
    traverseThroughJSON(collectionItems, search, purpose, changes) {
      for (var k in collectionItems) {
        if (
          typeof collectionItems[k] === "object" &&
          collectionItems[k] !== null
        ) {
          collectionItems[k] = this.traverseThroughJSON(
            collectionItems[k],
            search,
            purpose,
            changes
          );
        } else if (k == "id" && collectionItems[k] == search) {
          if (purpose == this.purposes.create_new_item) {
            collectionItems["item"].push({
              id: changes.id,
              name: changes.name,
              description: changes.description,
              request: changes.request,
              response: changes.response,
            });
          }

          if (purpose == this.purposes.update_folder) {
            // eslint-disable-next-line no-prototype-builtins
            if (changes.hasOwnProperty("name")) {
              collectionItems["name"] = changes.name;
            }

            // eslint-disable-next-line no-prototype-builtins
            if (changes.hasOwnProperty("description")) {
              collectionItems["description"] = changes.description;
            }

            // eslint-disable-next-line no-prototype-builtins
            if (changes.hasOwnProperty("request")) {
              collectionItems["request"] = changes.request;
            }
          }
        }
      }

      return collectionItems;
    },

    /**
     * Submit newly changes to user collection
     *
     * @param {Object} data
     */
    async saveNewFolderInCollection(data) {
      tryCatch(
        () => {
          this.isLoading = true;

          let collection = useCollectionStore().get;
          let collectionFile = collection.file;
          let newCollection = {};

          newCollection.info = collectionFile.info;
          newCollection.auth = collectionFile.auth;
          newCollection.event = collectionFile.event;
          newCollection.item = collectionFile.item;
          newCollection.item.push(data);

          const blob = new Blob([JSON.stringify(newCollection)], {
            type: "application/json",
          });

          const file = new File(
            [blob],
            "patienceman_" + randomId(10) + ".json",
            {
              type: blob.type,
            }
          );

          // Create new file and update user collection document
          this.storage.store(file).then((collectionFile) => {
            const data = {
              storage_file_id: collectionFile.$id,
              collection_url: collectionFile.name,
            };

            this.database.collection(appwriteCollections.collection_table);
            this.database.update(collection.$id, data).then((response) => {
              this.storage.destroy(collection.file_id).then(() => {
                useCollectionStore().store({
                  ...response,
                  file: newCollection,
                  file_id: collectionFile.$id,
                });

                this.$root.$emit("new_message", {
                  responseType: "success",
                  response: "Folder created successfully",
                  subject: "Collection Folder",
                  source: "/",
                  shouldSave: true,
                });

                this.isLoading = false;
              });
            });
          });
        },
        () => {
          this.isLoading = false;
          this.$root.$emit("new_message", {
            responseType: "error",
            response: "Unable to save folder",
          });
        }
      );
    },

    /**
     * Submit newly request to collection folder
     *
     * @param {Object} data
     */
    async saveNewRequestInFolder(data) {
      tryCatch(
        () => {
          this.isLoading = true;

          let collection = useCollectionStore().get;
          let collectionFile = collection.file;
          let requestsHandler = data.folderId;
          let newCollection = {};

          newCollection.info = collectionFile.info;
          newCollection.auth = collectionFile.auth;
          newCollection.event = collectionFile.event;
          newCollection.item = collectionFile.item;

          let collectionItems = this.traverseThroughJSON(
            collectionFile.item,
            data.folderId,
            this.purposes.create_new_item,
            data
          );

          newCollection.item = collectionItems;

          const blob = new Blob([JSON.stringify(newCollection)], {
            type: "application/json",
          });

          const file = new File(
            [blob],
            "patienceman_" + randomId(10) + ".json",
            {
              type: blob.type,
            }
          );

          // Create new file and update user collection document
          this.storage.store(file).then((collectionFile) => {
            const data = {
              storage_file_id: collectionFile.$id,
              collection_url: collectionFile.name,
            };

            this.database.collection(appwriteCollections.collection_table);
            this.database.update(collection.$id, data).then((response) => {
              this.storage.destroy(collection.file_id).then(() => {
                useCollectionStore().store({
                  ...response,
                  file: newCollection,
                  file_id: collectionFile.$id,
                });

                this.$root.$emit("new_message", {
                  responseType: "success",
                  response: "Request created successfully",
                  subject: "Folder Request",
                  source: "/",
                  shouldSave: true,
                });

                this.isLoading = false;
                document.getElementById(requestsHandler).click();
              });
            });
          });
        },
        () => {
          this.isLoading = false;
          this.$root.$emit("new_message", {
            responseType: "error",
            response: "Unable to create new request file",
          });
        }
      );
    },
  },
  mounted() {
    /**
     * Listen to save collection request
     * and update given file generally
     */
    this.$root.$on("save_collection_changes", async (payload) => {
      // Check if payload has element to run before then execute
      // eslint-disable-next-line no-prototype-builtins
      payload.hasOwnProperty("before") && payload.before instanceof Function
        ? payload.before()
        : "";

      // Check if payload has custom message for alert
      // eslint-disable-next-line no-prototype-builtins
      this.response = payload.hasOwnProperty("alertMessage")
        ? payload.alertMessage
        : "Save changes";

      await this.updateCollection(payload.data);

      // Check if payload has elemtn to run after then execute
      // eslint-disable-next-line no-prototype-builtins
      payload.hasOwnProperty("after") &&
      payload.after instanceof Function &&
      !this.isLoading
        ? payload.after()
        : "";
    });

    /**
     * Listen to save collection new folder request
     * and add new item in collection file
     */
    this.$root.$on("new_folder", async (payload) => {
      // Check if payload has element to run before then execute
      // eslint-disable-next-line no-prototype-builtins
      payload.hasOwnProperty("before") && payload.before instanceof Function
        ? payload.before()
        : "";

      // Check if payload has custom message for alert
      // eslint-disable-next-line no-prototype-builtins
      this.response = payload.hasOwnProperty("alertMessage")
        ? payload.alertMessage
        : "Save changes";

      await this.saveNewFolderInCollection(payload.data);

      // Check if payload has elemtn to run after then execute
      // eslint-disable-next-line no-prototype-builtins
      payload.hasOwnProperty("after") &&
      payload.after instanceof Function &&
      !this.isLoading
        ? payload.after()
        : "";
    });

    /**
     * Listen to save folder request
     * and add new request in given collection folder
     */
    this.$root.$on("new_request", async (payload) => {
      // Check if payload has element to run before then execute
      // eslint-disable-next-line no-prototype-builtins
      payload.hasOwnProperty("before") && payload.before instanceof Function
        ? payload.before()
        : "";

      // Check if payload has custom message for alert
      // eslint-disable-next-line no-prototype-builtins
      this.response = payload.hasOwnProperty("alertMessage")
        ? payload.alertMessage
        : "Save changes";

      await this.saveNewRequestInFolder(payload.data);

      // Check if payload has elemtn to run after then execute
      // eslint-disable-next-line no-prototype-builtins
      payload.hasOwnProperty("after") &&
      payload.after instanceof Function &&
      !this.isLoading
        ? payload.after()
        : "";
    });
  },
};
</script>
../../../stores/CollectionStore../../../Utils/GeneralUtils../../../configs/services
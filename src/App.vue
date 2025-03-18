<template>
  <v-app>
    <!-- Sticky App Bar -->
    <v-app-bar color="primary" dark fixed app>
      <v-toolbar-title>Sammelliste</v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- 3-dot Menu -->
      <v-menu v-model="menu" :close-on-content-click="false" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <!-- Add Entry -->
          <v-list-item @click="openAddDialog">
            <template v-slot:prepend>
              <v-icon>mdi-plus</v-icon>
            </template>
            <v-list-item-title class="pr-5"
              >Eintrag hinzufügen</v-list-item-title
            >
          </v-list-item>

          <!-- Edit Entries -->
          <v-list-item @click="openEditDialog">
            <template v-slot:prepend>
              <v-icon>mdi-pencil</v-icon>
            </template>
            <v-list-item-title>Eintrag bearbeiten</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container>
        <!-- List of Entries -->
        <v-list bg-color="transparent">
          <v-list-item
            v-for="entry in entries"
            :key="entry.id"
            @click="cycleState(entry)"
            :class="entry.state"
            class="mb-2"
            density="comfortable"
            rounded="lg"
          >
            <v-list-item-title>{{ entry.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-container>
    </v-main>

    <!-- Add Entry Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title>Eintrag hinzufügen</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newEntryName"
            label="z.B. Straße und Hausnummer"
            outlined
            hide-details
            dense
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn color="primary" text @click="addEntry">Hinzufügen</v-btn>
          <v-btn text @click="showAddDialog = false">Abbruch</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Entries Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card>
        <v-card-title>Einträge bearbeiten</v-card-title>
        <v-card-text class="pa-0">
          <v-list>
            <!-- Use inline flex styling on each list item -->
            <v-list-item
              v-for="entry in entries"
              :key="entry.id"
              class="mb-2"
              style="flex-wrap: nowrap; align-items: center"
            >
              <v-row class="flex-nowrap ga-3" no-gutters>
                <v-col class="flex-grow-1 flex-shrink-1" cols="12">
                  <v-text-field
                    v-model="entry.name"
                    hide-details
                    variant="outlined"
                    density="compact"
                    style="flex: 1"
                  />
                </v-col>
                <v-col>
                  <v-btn
                    color="error"
                    text
                    @click="deleteEntry(entry.id)"
                    style="
                      width: 40px;
                      height: 40px;
                      min-width: 40px;
                      padding: 0;
                    "
                  >
                    <v-icon>mdi-close-thick</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn color="primary" text @click="showEditDialog = false">
            Fertig
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const menu = ref(false);
const showAddDialog = ref(false);
const showEditDialog = ref(false);

const newEntryName = ref("");

const entries = ref([]);

const loadEntries = () => {
  const stored = localStorage.getItem("sammellisteEntries");
  if (stored) {
    entries.value = JSON.parse(stored);
  }
};

const saveEntries = () => {
  localStorage.setItem("sammellisteEntries", JSON.stringify(entries.value));
};

onMounted(loadEntries);
watch(entries, saveEntries, { deep: true });

const openAddDialog = () => {
  menu.value = false;
  showAddDialog.value = true;
};

const openEditDialog = () => {
  menu.value = false;
  showEditDialog.value = true;
};

const addEntry = () => {
  if (newEntryName.value.trim() !== "") {
    entries.value.push({
      id: Date.now(),
      name: newEntryName.value,
      state: "grey",
    });
    newEntryName.value = "";
    showAddDialog.value = false;
  }
};

// Cycle states: grey → yellow → green → grey
const cycleState = (entry) => {
  if (entry.state === "grey") {
    entry.state = "yellow";
  } else if (entry.state === "yellow") {
    entry.state = "green";
  } else {
    entry.state = "grey";
  }
};

// Delete entry
const deleteEntry = (id) => {
  entries.value = entries.value.filter((entry) => entry.id !== id);
};
</script>

<style scoped>
.grey {
  background-color: #424242 !important;
  color: #ffffff !important;
}
.yellow {
  background-color: #fdd835 !important;
  color: #000000 !important;
}
.green {
  background-color: #66bb6a !important;
  color: #000000 !important;
}

/* Make sure the app bar is always on top */
.v-application--wrap {
  min-height: 100vh;
}
</style>

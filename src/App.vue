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

    <!-- Sync / session hints -->
    <v-snackbar v-model="snackbar" :timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

const menu = ref(false);
const showAddDialog = ref(false);
const showEditDialog = ref(false);

const newEntryName = ref("");

const entries = ref([]);

// --- Persistence: localStorage is the cache, the docstore backend is the source of truth.
// The hub forwards `${BASE_URL}api/*` to the backend (server/index.ts) with the prefix removed.
const STORAGE_KEY = "sammellisteEntries";
const REV_KEY = "sammellisteRev";
const PENDING_KEY = "sammellistePending";
const DOC_URL = `${process.env.BASE_URL}api/docs/entries`;
const SAVE_DEBOUNCE_MS = 800;

let rev = 0; // last revision known from the server (0 = nothing stored yet)
let pending = false; // local changes not yet confirmed by the server
let lastSynced = null; // JSON of the entries last confirmed by the server
let ready = false; // initial server load finished (or failed); saves run only afterwards
let syncing = false;
let queued = false;
let saveTimer = null;

const snackbar = ref(false);
const snackbarText = ref("");
const showSnackbar = (text) => {
  snackbarText.value = text;
  snackbar.value = true;
};

const readCache = () => {
  try {
    rev = Number(localStorage.getItem(REV_KEY)) || 0;
    pending = localStorage.getItem(PENDING_KEY) === "1";
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error("sammelliste: cache unreadable, starting empty", err);
    return null;
  }
};

const writeCache = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value));
    localStorage.setItem(REV_KEY, String(rev));
    localStorage.setItem(PENDING_KEY, pending ? "1" : "0");
  } catch (err) {
    console.error("sammelliste: cache write failed", err);
  }
};

const goToLogin = () => {
  showSnackbar("Sitzung abgelaufen, bitte neu einloggen");
  setTimeout(() => {
    location.assign(
      "/login?next=" +
        encodeURIComponent(location.pathname + location.search + location.hash)
    );
  }, 1500);
};

const adoptServerState = (doc) => {
  entries.value = Array.isArray(doc.data) ? doc.data : [];
  rev = doc.rev;
  lastSynced = JSON.stringify(entries.value);
  pending = false;
  writeCache();
};

const scheduleSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushToServer, SAVE_DEBOUNCE_MS);
};

const pushToServer = async () => {
  const json = JSON.stringify(entries.value);
  if (json === lastSynced) {
    pending = false;
    writeCache();
    return;
  }
  if (syncing) {
    queued = true;
    return;
  }
  syncing = true;
  try {
    const res = await fetch(DOC_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: `{"data":${json},"rev":${rev}}`,
    });
    if (res.status === 200) {
      rev = (await res.json()).rev;
      lastSynced = json;
      pending = false;
      writeCache();
    } else if (res.status === 409) {
      adoptServerState(await res.json());
      showSnackbar("Auf einem anderen Gerät geändert, Liste neu geladen");
    } else if (res.status === 401) {
      pending = true;
      writeCache();
      goToLogin();
    } else {
      pending = true;
      writeCache();
      console.error("sammelliste: save failed", res.status);
      showSnackbar(
        "Speichern am Server fehlgeschlagen, wird später wiederholt"
      );
    }
  } catch (err) {
    // offline or server unreachable: keep the local copy, retry later
    pending = true;
    writeCache();
  } finally {
    syncing = false;
    if (queued) {
      queued = false;
      scheduleSave();
    }
  }
};

const loadFromServer = async () => {
  try {
    const res = await fetch(DOC_URL, {
      headers: { Accept: "application/json" },
    });
    if (res.status === 200) {
      const doc = await res.json();
      if (pending && rev === doc.rev) {
        // unsent local changes based on the current server state: push them
        scheduleSave();
      } else {
        if (pending) {
          showSnackbar("Auf einem anderen Gerät geändert, Liste neu geladen");
        }
        adoptServerState(doc);
      }
    } else if (res.status === 404) {
      rev = 0;
      if (entries.value.length > 0) scheduleSave(); // first upload (e.g. migrated data)
    } else if (res.status === 401) {
      goToLogin();
    } else {
      console.error("sammelliste: load failed", res.status);
    }
  } catch (err) {
    // offline: keep working with the cache, retry when the connection is back
    if (pending) scheduleSave();
  }
};

const loadEntries = async () => {
  entries.value = readCache() || [];
  await loadFromServer();
  ready = true;
};

const onOnline = () => {
  if (!ready) return;
  if (lastSynced === null) loadFromServer();
  else if (pending) scheduleSave();
};

const saveEntries = () => {
  writeCache();
  if (ready) scheduleSave();
};

onMounted(() => {
  loadEntries();
  window.addEventListener("online", onOnline);
});
onBeforeUnmount(() => window.removeEventListener("online", onOnline));
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

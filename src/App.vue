<script setup>
import { ref, onMounted } from "vue";

let isRunning = ref(false);
let ostIsPlaying = ref(false);
let show = ref(false);
let rows = ref(40);
let allCells = ref([]);
let oldActiveCells = ref([]);
let intervalId = ref();
let ost = ref(new Audio());
let intervalSpeed = ref(1000);
let spawnEffect = ref();
let deathEffect = ref();

const loadCells = () => {
  allCells.value = [];
  if (rows.value > 50) {
    rows.value = 50;
  }
  for (let i = 0; i < rows.value; i++) {
    for (let j = 0; j < rows.value; j++) {
      allCells.value.push({
        x: i,
        y: j,
        active: false,
      });
    }
  }
};

const compareArrays = (array1, array2) => {
  return (
    array1.length === array2.length && array1.every((el) => array2.includes(el))
  );
};

const findingNeighbors = (x, y) => {
  let neighbors = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) {
        continue;
      }
      const newRow = x + i;
      const newCol = y + j;
      if (
        newRow >= 0 &&
        newRow < allCells.value.length &&
        newCol >= 0 &&
        newCol < rows.value
      ) {
        const index = newRow * rows.value + newCol;

        neighbors.push(allCells.value[index]);
      }
    }
  }
  return neighbors;
};

const activeNeighborCount = (x, y) => {
  return findingNeighbors(x, y).filter((s) => s.active).length;
};
const stop = () => {
  clearInterval(intervalId.value);
  isRunning.value = false;
};
const clear = () => {};
const run = () => {
  if (isRunning.value) {
    stop();
    return;
  }
  isRunning.value = true;

  intervalId.value = setInterval(() => {
    let cellsToEnable = [];
    let cellsToDisable = [];
    let oActiveCells = oldActiveCells.value;
    let activeCells = allCells.value.filter((s) => s.active);
    if (activeCells.length < 1 || compareArrays(oActiveCells, activeCells)) {
      // stop();
      // alert("Fin de la simulation");
    }
    activeCells.forEach((e) => {
      let sCount = activeNeighborCount(e.x, e.y);
      if (sCount == 0) {
        cellsToDisable.push(e);
      }

      try {
        findingNeighbors(e.x, e.y).forEach((n) => {
          let nCount = activeNeighborCount(n.x, n.y);

          if (
            (!n.active && nCount == 3) ||
            (n.active && [2, 3].includes(nCount))
          ) {
            cellsToEnable.push(n);
          } else if (n.active && (nCount < 2 || nCount > 3)) {
            cellsToDisable.push(n);
          }
        });
      } catch (est) {
        // stop();
        // alert("Fin de la simulation");
        // return;
      }
    });

    cellsToEnable.forEach((s) => {
      s.active = true;
      spawnEffect.value.play();
    });

    cellsToDisable.forEach((s) => {
      s.active = false;
      deathEffect.value.play();
    });
    oldActiveCells.value = allCells.value.filter((s) => s.active);
  }, intervalSpeed.value);
};
const activateCell = (c) => {
  if (c.active) {
    allCells.value.find((s) => s.x == c.x && s.y == c.y).active = false;
    deathEffect.value.play();
  } else {
    allCells.value.find((s) => s.x == c.x && s.y == c.y).active = true;
    spawnEffect.value.play();
  }
};

const playOst = () => {
  ost.value.paused ? (ost.value.play(), (ostIsPlaying.value = true)) : null;
};

const muteOst = () => {
  ostIsPlaying.value = !ostIsPlaying.value;
  ost.value.volume = ost.value.volume == 0 ? 1 : 0;
};
onMounted(() => {
  loadCells();

  ost.value = new Audio("/audios/ost-gol.mp3");
  ost.value.loop = true;
  deathEffect.value = new Audio("/audios/death.m4a");
  spawnEffect.value = new Audio("/audios/spawn.m4a");
});
</script>

<template>
  <div
    @click="playOst"
    class="px-44 py-10 relative bg-gray-900 min-h-screen gap-0"
    style="display: grid"
    :style="`grid-template-columns: repeat(${rows}, minmax(0, 1fr))`"
  >
    <!-- Container -->
    <!-- Cells -->
    <button
      :disabled="isRunning"
      v-for="c in allCells"
      class="border border-gray-800 aspect-square transition-all duration-400 disabled:cursor-not-allowed rounded-md"
      :class="c.active ? 'bg-green-500' : ''"
      @click="activateCell(c)"
    ></button>
  </div>

  <!-- Menu -->

  <div class="absolute top-5 left-5 text-white w-36 h-56 flex flex-col">
    <div class="w-full">
      <button @click="muteOst" class="p-2 rounded-full bg-gray-800 ml-2">
        <svg
          v-if="ostIsPlaying"
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="invert"
        >
          <path
            d="M12.5 8.89001V18.5M12.5 8.89001V5.57656C12.5 5.36922 12.5 5.26554 12.5347 5.17733C12.5653 5.09943 12.615 5.03047 12.6792 4.97678C12.752 4.91597 12.8503 4.88318 13.047 4.81761L17.447 3.35095C17.8025 3.23245 17.9803 3.17319 18.1218 3.20872C18.2456 3.23982 18.3529 3.31713 18.4216 3.42479C18.5 3.54779 18.5 3.73516 18.5 4.10989V7.42335C18.5 7.63069 18.5 7.73436 18.4653 7.82258C18.4347 7.90048 18.385 7.96943 18.3208 8.02313C18.248 8.08394 18.1497 8.11672 17.953 8.18229L13.553 9.64896C13.1975 9.76746 13.0197 9.82671 12.8782 9.79119C12.7544 9.76009 12.6471 9.68278 12.5784 9.57512C12.5 9.45212 12.5 9.26475 12.5 8.89001ZM12.5 18.5C12.5 19.8807 10.933 21 9 21C7.067 21 5.5 19.8807 5.5 18.5C5.5 17.1192 7.067 16 9 16C10.933 16 12.5 17.1192 12.5 18.5Z"
            stroke="#000000"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else
          class="invert"
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.5 6.8935V5.57661C12.5 5.36926 12.5 5.26559 12.5347 5.17738C12.5653 5.09948 12.615 5.03052 12.6792 4.97682C12.752 4.91601 12.8503 4.88323 13.047 4.81766L17.447 3.35099C17.8025 3.23249 17.9803 3.17324 18.1218 3.20877C18.2456 3.23987 18.3529 3.31718 18.4216 3.42484C18.5 3.54783 18.5 3.7352 18.5 4.10994V7.42339C18.5 7.63074 18.5 7.73441 18.4653 7.82262C18.4347 7.90052 18.385 7.96948 18.3208 8.02318C18.248 8.08399 18.1497 8.11677 17.953 8.18234L14.8192 9.22692M12.5 12.5V18.5M12.5 18.5C12.5 19.8807 10.933 21 9 21C7.067 21 5.5 19.8807 5.5 18.5C5.5 17.1193 7.067 16 9 16C10.933 16 12.5 17.1193 12.5 18.5ZM3 3L21 21"
            stroke="#000000"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button @click="show = true" class="ml-2 p-2 rounded-full bg-gray-800">
        <svg
          fill="#000000"
          version="1.1"
          class="invert"
          id="Capa_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          width="20px"
          height="20px"
          viewBox="0 0 416.979 416.979"
          xml:space="preserve"
        >
          <g>
            <path
              d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85
		c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786
		c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576
		c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765
		c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"
            />
          </g>
        </svg>
      </button>
    </div>

    <div class="mt-5">
      <label class="text-xs">Vitesse d'iteration</label>
      <select
        v-model="intervalSpeed"
        class="bg-gray-800 text-white rounded-md p-1 text-xs disabled:cursor-not-allowed w-full"
        :disabled="isRunning"
      >
        <option value="100">100 ms</option>
        <option value="500">500 ms</option>
        <option value="1000">1 s</option>
      </select>
    </div>
    <div class="mt-5">
      <label class="text-xs">Nombre de colonnes </label>
      <input
        type="number"
        v-model="rows"
        @input="loadCells"
        min="0"
        max="60"
        class="bg-gray-800 text-white rounded-md p-1 text-xs disabled:cursor-not-allowed w-full"
        :disabled="isRunning"
      />
    </div>
    <div class="flex gap-2">
      <button
        class="p-3 bg-teal-700 rounded-full shadow-lg text-sm mt-5"
        @click="run"
      >
        <svg
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          v-if="!isRunning"
          class="invert"
        >
          <path
            d="M16.6582 9.28638C18.098 10.1862 18.8178 10.6361 19.0647 11.2122C19.2803 11.7152 19.2803 12.2847 19.0647 12.7878C18.8178 13.3638 18.098 13.8137 16.6582 14.7136L9.896 18.94C8.29805 19.9387 7.49907 20.4381 6.83973 20.385C6.26501 20.3388 5.73818 20.0469 5.3944 19.584C5 19.053 5 18.1108 5 16.2264V7.77357C5 5.88919 5 4.94701 5.3944 4.41598C5.73818 3.9531 6.26501 3.66111 6.83973 3.6149C7.49907 3.5619 8.29805 4.06126 9.896 5.05998L16.6582 9.28638Z"
            stroke="#000000"
            stroke-width="2"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else
          class="invert"
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 5V19M16 5V19"
            stroke="#000000"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        class="px-3 py-2 bg-yellow-500 rounded-full shadow-lg text-sm mt-5"
        @click="clear"
        title="Lancer/Arreter la simulation"
      >
        <svg
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="invert"
        >
          <g clip-path="url(#clip0_429_11071)">
            <path
              d="M12 2.99982C16.9706 2.99982 21 7.02925 21 11.9998C21 16.9704 16.9706 20.9998 12 20.9998C7.02944 20.9998 3 16.9704 3 11.9998C3 9.17255 4.30367 6.64977 6.34267 4.99982"
              stroke="#292929"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3 4.49982H7V8.49982"
              stroke="#292929"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_429_11071">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </button>
      <button
        class="px-3 py-2 bg-red-700 rounded-full shadow-lg text-sm mt-5"
        title="Revenir a la simulation de base"
      >
        <svg
          fill="#000000"
          class="invert"
          width="20px"
          height="20px"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.004 23.087l7.08-7.081-7.07-7.071L8.929 7.02l7.067 7.069L23.084 7l1.912 1.913-7.089 7.093 7.075 7.077-1.912 1.913-7.074-7.073L8.917 25z"
          />
        </svg>
      </button>
    </div>
  </div>
  <teleport to="body">
    <transition leave-active-class="duration-200">
      <div
        v-show="show"
        class="fixed inset-0 overflow-y-auto px-4 py-6 sm:px-0 z-50"
        scroll-region
      >
        <transition
          enter-active-class="ease-out duration-300"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="ease-in duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-show="show"
            class="fixed inset-0 transform transition-all"
            @click="show = false"
          >
            <div class="absolute inset-0 bg-gray-900 opacity-75" />
          </div>
        </transition>

        <transition
          enter-active-class="ease-out duration-300"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            v-show="show"
            class="mb-6 bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all mx-auto text-white p-5 w-1/2"
          >
            <div v-if="show">
              Le Jeu de la Vie, créé par John Conway, est un automate cellulaire
              fascinant.<br />
              Il se déroule sur une grille bidimensionnelle , où chaque case
              peut être soit vivante, soit morte.
              <br /><br />
              Les règles simples déterminent l'évolution des cellules au fil des
              générations:
              <br />- Une cellule vivante survit si elle a 2 ou 3 voisins
              vivants, sinon elle meurt de solitude ou de surpopulation. <br />-
              Une cellule morte peut devenir vivante si elle a exactement 3
              voisins vivants. <br /><br />
              Le jeu commence avec une configuration initiale, et les joueurs
              observent comment cette société cellulaire évolue de génération en
              génération, souvent conduisant à des motifs complexes, des
              oscillateurs, voire des formes stables. <br />
              Bien que les règles soient simples, le Jeu de la Vie peut produire
              des résultats surprenants et offre une perspective intéressante
              sur l'émergence de la complexité à partir de règles élémentaires.
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

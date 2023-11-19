<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

let isRunning = ref(false);
let ostIsPlaying = ref(false);
let sfxIsPlaying = ref(false);

let show = ref(false);
let rows = ref(40);
let generationCount = ref(0);
let allCells = ref([]);
let activeCells = ref([]);
let oldActiveCells = ref([]);
let olderActiveCells = ref([]);
let intervalId = ref();
let modalContent = ref();
let ost = ref(new Audio());
let intervalSpeed = ref(100);
let zoomQty = ref(79);
let spawnEffect = ref();
let deathEffect = ref();

const explanationText = `Le Jeu de la Vie, créé par John Conway, est un automate cellulaire
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
              sur l'émergence de la complexité à partir de règles élémentaires.`;

const loadCells = () => {
  allCells.value = [];
  if (rows.value > 65) {
    rows.value = 65;
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

const defaultConfig = () => {
  rows.value = 40;
  loadCells();
  const indices = [
    440, 441, 480, 481, 450, 490, 530, 411, 571, 372, 373, 612, 613, 494, 415,
    575, 456, 496, 536, 497, 380, 381, 420, 421, 460, 461, 342, 502, 304, 504,
    344, 544, 394, 395, 435, 434,
  ];

  for (const index of indices) {
    allCells.value[index - 7 * 40].active = true;
  }
};

const randomize = () => {
  allCells.value.forEach((e) => {
    e.active = parseInt(Math.random() * 10) % 2 == 1 ? true : false;
  });
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
  try {
    return findingNeighbors(x, y).filter((s) => s.active).length;
  } catch (error) {
    allCells.value.find((s) => s.x == x && s.y == y).active = false;
  }
};
const pause = () => {
  clearInterval(intervalId.value);
  isRunning.value = false;
};
const stop = () => {
  pause();
  modalContent.value = `<strong class="font-bold"> Fin de la simulation ✅. </strong> <br /> <div class="text-xs">
    Cette configuration cellulaire a survécu ${generationCount.value} génération(s)
    </div>`;
  show.value = true;
  generationCount.value = 0;
};

const clear = () => {
  allCells.value.forEach((e) => {
    e.active = false;
  });
  isRunning.value = false;
};

const run = () => {
  if (isRunning.value) {
    pause();
    return;
  }
  isRunning.value = true;
  intervalId.value = setInterval(() => {
    let cellsToEnable = [];
    let cellsToDisable = [];

    activeCells.value = allCells.value.filter((s) => s.active);
    activeCells.value.forEach((e) => {
      // disable a cell if it is alone
      if (activeNeighborCount(e.x, e.y) == 0) {
        cellsToDisable.push(e);
      }
      try {
        findingNeighbors(e.x, e.y)?.forEach((n) => {
          let nCount = activeNeighborCount(n.x, n.y);
          // find cells that match conditions to be enabled
          if (
            (!n.active && nCount === 3) ||
            (n.active && [2, 3].includes(nCount))
          ) {
            cellsToEnable.push(n);
          }
          // find cells that match conditions to be disabled
          else if (n.active && (nCount < 2 || nCount > 3)) {
            cellsToDisable.push(n);
          }
        });
      } catch (e) {
        e.active = false;
      }
    });

    // committing changes
    cellsToEnable.forEach((s) => {
      s.active = true;
    });

    cellsToDisable.forEach((s) => {
      s.active = false;
    });

    // checking if a pattern from the previous previous iteration is not repeating itself
    if (generationCount.value % 2 == 0) {
      // pause the simulation to avoid infinite loop
      if (compareArrays(olderActiveCells.value, activeCells.value)) {
        modalContent.value = `<strong class="font-bold"> Cette configuration cellulaire va tourner indéfiniment 😐.</strong> <br /> <div class="text-xs">Elle a survécu ${generationCount.value} génération(s) <br /> Pour changer son déroulement, il suffit d'ajouter une (ou plusieurs) cellule vivante ou d'en retirer .</div>`;
        show.value = true;
        pause();
      }

      olderActiveCells.value = oldActiveCells.value;
    }

    // checking if a pattern from the previous iteration is not repeating itself
    oldActiveCells.value = allCells.value.filter((s) => s.active);
    // stop the simulation if no new cells are born or die

    compareArrays(oldActiveCells.value, activeCells.value) ? stop() : null;
    generationCount.value++;
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
const muteSfx = () => {
  sfxIsPlaying.value = !sfxIsPlaying.value;
  spawnEffect.value.volume = spawnEffect.value.volume == 0 ? 1 : 0;
  deathEffect.value.volume = deathEffect.value.volume == 0 ? 1 : 0;
};
onMounted(() => {
  defaultConfig();
  document.body.addEventListener("click", playOst);
  ost.value = new Audio("/audios/ost-gol.mp3");
  ost.value.loop = true;
  deathEffect.value = new Audio("/audios/death.m4a");
  spawnEffect.value = new Audio("/audios/spawn.m4a");
  spawnEffect.value.volume = 0.1;
});
onBeforeUnmount(() => {
  document.body.removeEventListener("click", playOst);
});
</script>

<template>
  <div class="bg-gray-900 min-h-screen flex flex-col md:flex-row">
    <!-- Menu -->
    <div
      class="text-white w-full md:w-56 flex flex-row md:flex-col px-3 md:pt-5 md:pl-5 items-center gap-2 h-44"
    >
    <div
     class="text-sm font-bold hidden md:block">Le jeu de la vie</div
      >
      <div class="w-full flex flex-col md:flex-row justify-center flex-[1] gap-3">
        <!-- Music toggle button -->
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

        <!-- Sfx toggle button -->
        <button @click="muteSfx" class="p-2 rounded-full bg-gray-800 ml-2">
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            class="invert"
            xmlns="http://www.w3.org/2000/svg"
            v-if="sfxIsPlaying"
          >
            <path
              d="M18 9.00009C18.6277 9.83575 18.9996 10.8745 18.9996 12.0001C18.9996 13.1257 18.6277 14.1644 18 15.0001M6.6 9.00009H7.5012C8.05213 9.00009 8.32759 9.00009 8.58285 8.93141C8.80903 8.87056 9.02275 8.77046 9.21429 8.63566C9.43047 8.48353 9.60681 8.27191 9.95951 7.84868L12.5854 4.69758C13.0211 4.17476 13.2389 3.91335 13.4292 3.88614C13.594 3.86258 13.7597 3.92258 13.8712 4.04617C14 4.18889 14 4.52917 14 5.20973V18.7904C14 19.471 14 19.8113 13.8712 19.954C13.7597 20.0776 13.594 20.1376 13.4292 20.114C13.239 20.0868 13.0211 19.8254 12.5854 19.3026L9.95951 16.1515C9.60681 15.7283 9.43047 15.5166 9.21429 15.3645C9.02275 15.2297 8.80903 15.1296 8.58285 15.0688C8.32759 15.0001 8.05213 15.0001 7.5012 15.0001H6.6C6.03995 15.0001 5.75992 15.0001 5.54601 14.8911C5.35785 14.7952 5.20487 14.6422 5.10899 14.4541C5 14.2402 5 13.9601 5 13.4001V10.6001C5 10.04 5 9.76001 5.10899 9.54609C5.20487 9.35793 5.35785 9.20495 5.54601 9.10908C5.75992 9.00009 6.03995 9.00009 6.6 9.00009Z"
              stroke="#000000"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            class="invert"
            xmlns="http://www.w3.org/2000/svg"
            v-else
          >
            <path
              d="M16 9.50009L21 14.5001M21 9.50009L16 14.5001M4.6 9.00009H5.5012C6.05213 9.00009 6.32759 9.00009 6.58285 8.93141C6.80903 8.87056 7.02275 8.77046 7.21429 8.63566C7.43047 8.48353 7.60681 8.27191 7.95951 7.84868L10.5854 4.69758C11.0211 4.17476 11.2389 3.91335 11.4292 3.88614C11.594 3.86258 11.7597 3.92258 11.8712 4.04617C12 4.18889 12 4.52917 12 5.20973V18.7904C12 19.471 12 19.8113 11.8712 19.954C11.7597 20.0776 11.594 20.1376 11.4292 20.114C11.239 20.0868 11.0211 19.8254 10.5854 19.3026L7.95951 16.1515C7.60681 15.7283 7.43047 15.5166 7.21429 15.3645C7.02275 15.2297 6.80903 15.1296 6.58285 15.0688C6.32759 15.0001 6.05213 15.0001 5.5012 15.0001H4.6C4.03995 15.0001 3.75992 15.0001 3.54601 14.8911C3.35785 14.7952 3.20487 14.6422 3.10899 14.4541C3 14.2402 3 13.9601 3 13.4001V10.6001C3 10.04 3 9.76001 3.10899 9.54609C3.20487 9.35793 3.35785 9.20495 3.54601 9.10908C3.75992 9.00009 4.03995 9.00009 4.6 9.00009Z"
              stroke="#000000"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- Info button  -->
        <button
          @click="(modalContent = explanationText), (show = true)"
          class="ml-2 p-2 rounded-full bg-gray-800"
        >
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

      <div class="flex flex-col flex-[3]">
        <div>
          <!-- Iteration speed input -->

          <label class="text-xs">Vitesse d'itération (en ms)</label>
          <input
            v-model="intervalSpeed"
            min="0"
            type="number"
            class="bg-gray-800 text-white rounded-md p-1 text-xs disabled:cursor-not-allowed w-full"
            :disabled="isRunning"
          />
        </div>
        <div class="mt-5">
          <!-- Column count input -->
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
      </div>
      <div class="grid grid-cols-2 justify-center md:flex gap-2 items-start flex-[3]">
        <!-- Play button -->
        <button
          class="p-3 bg-teal-600 rounded-full shadow-lg text-sm mt-5 flex justify-center"
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

        <!-- Randomize -->
        <button
          class="p-3 bg-amber-400 rounded-full shadow-lg text-sm mt-5 flex justify-center"
          @click="randomize"
          title="Lancer une configuration au hasard"
        >
          <svg
            width="20px"
            height="20px"
            class="invert"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 4L21 7M21 7L18 10M21 7H17C16.0707 7 15.606 7 15.2196 7.07686C13.6329 7.39249 12.3925 8.63288 12.0769 10.2196C12 10.606 12 11.0707 12 12C12 12.9293 12 13.394 11.9231 13.7804C11.6075 15.3671 10.3671 16.6075 8.78036 16.9231C8.39397 17 7.92931 17 7 17H3M18 20L21 17M21 17L18 14M21 17H17C16.0707 17 15.606 17 15.2196 16.9231C15.1457 16.9084 15.0724 16.8917 15 16.873M3 7H7C7.92931 7 8.39397 7 8.78036 7.07686C8.85435 7.09158 8.92758 7.1083 9 7.12698"
              stroke="#000000"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <!-- Reset button -->
        <button
          class="p-3 bg-cyan-500 rounded-full shadow-lg text-sm mt-5 flex justify-center"
          @click="defaultConfig"
          title="Retourner à la configuration de base"
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

        <!-- Clear button -->
        <button
          class="p-3 bg-red-500 rounded-full shadow-lg text-sm mt-5 flex justify-center"
          title="Réinitialiser"
          @click="clear"
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
   

    <!-- Grid  -->
    <div class="overflow-auto h-screen w-full">
      <div class="w-full flex justify-center items-center h-10 my-5">
        <button class="p-2 rounded-full bg-gray-800 ml-2" @click="zoomQty-=10">
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="invert"
          >
            <path
              d="M10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17Z"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M20.9992 21L14.9492 14.95"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M6 10H14"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button class="p-2 rounded-full bg-gray-800 ml-2" @click="zoomQty+=10">
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="invert"
          >
            <path
              d="M10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17Z"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M20.9992 21L14.9492 14.95"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M6 10H14"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M10 6V14"
              stroke="#000000"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <div
        class="pr-0 md:px-5 gap-0 mx-auto "
        style="display: grid;"
        :style="`width: ${zoomQty}vw;grid-template-columns: repeat(${rows}, 1fr);grid-auto-rows: minmax(0, 1fr);aspect-ratio: 1 / 1;`"
      >
        <!-- Cells -->
        <button
          :disabled="isRunning"
          v-for="c in allCells"
          class="border border-gray-800 aspect-square h-full w-full disabled:cursor-not-allowed rounded-md"
          :class="
            c.active
              ? 'bg-green-600 duration-[' + intervalSpeed / 2 + ']'
              : 'duration-[' + intervalSpeed / 2 + ']'
          "
          @click="activateCell(c)"
        ></button>
      </div>
    </div>
  </div>

  <!-- Modal -->
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
            class="mb-6 bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all mx-auto text-white p-5 w-5/6 md:w-1/2"
          >
            <div v-if="show" v-html="modalContent"></div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

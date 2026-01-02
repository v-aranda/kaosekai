import { createApp } from 'vue'
import { createPinia } from 'pinia' // <--- Importar
import './styles/main.scss'
import App from './App.vue'
import Vue3EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';

import { OhVueIcon, addIcons } from "oh-vue-icons";
import {
  // ... outros ícones ...
  GiHarpoonTrident, GiHarpoonChain, GiSpearHook, GiStoneSpear, GiBarbedSpear, GiTrident, GiCoiledNail, GiGlaive,
  GiClawHammer, GiFlatHammer, GiThorHammer, GiWarhammer,
  GiAxeSwing, GiBatteredAxe, GiBattleAxe, GiFireAxe, GiMagicAxe, GiSharpAxe, GiWarAxe, GiHatchet, GiTomahawk,
  GiBroadsword, GiFragmentedSword, GiRelicBlade, GiBladeDrag, GiKatana, GiLightningSaber, GiGladius, GiStiletto, GiTwoHandedSword,
  GiBowieKnife, GiBoneKnife, GiCurvyKnife, GiTrenchKnife, GiThrownKnife,
  GiHand,
  GiSwapBag,
  GiHealthPotion,
  GiFlashlight,
  GiFirstAidKit,
  GiWaterBottle,
  GiBackpack,
  GiSkullCrack,
  FaSpinner,
  HiSolidHome, HiSolidSun, HiSolidMoon, HiSolidLogout, FaSave, GiExitDoor, FaTrash,
  GiCheckedShield, GiThreeFriends, GiGears

} from "oh-vue-icons/icons";

addIcons(
  // ...
  GiHarpoonTrident, GiHarpoonChain, GiSpearHook, GiStoneSpear, GiBarbedSpear, GiTrident, GiCoiledNail, GiGlaive,
  GiClawHammer, GiFlatHammer, GiThorHammer, GiWarhammer,
  GiAxeSwing, GiBatteredAxe, GiBattleAxe, GiFireAxe, GiMagicAxe, GiSharpAxe, GiWarAxe, GiHatchet, GiTomahawk,
  GiBroadsword, GiFragmentedSword, GiRelicBlade, GiBladeDrag, GiKatana, GiLightningSaber, GiGladius, GiStiletto, GiTwoHandedSword,
  GiBoneKnife, GiBowieKnife, GiCurvyKnife, GiTrenchKnife, GiThrownKnife,
  GiHand, GiSwapBag, GiHealthPotion,
  GiFlashlight, GiFirstAidKit,
  GiWaterBottle, GiBackpack, GiSkullCrack, FaSpinner,
  HiSolidHome, HiSolidSun, HiSolidMoon, HiSolidLogout, FaSave, GiExitDoor, FaTrash,
  GiCheckedShield, GiThreeFriends, GiGears

);


const app = createApp(App);
const pinia = createPinia(); // <--- Criar instância

app.use(pinia); // <--- Usar no App
app.component("v-icon", OhVueIcon);
app.component('EasyDataTable', Vue3EasyDataTable);
app.mount('#app');
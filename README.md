# Aarkam.Calendar

An offline-first, dual Umm al-Qura (Hijri) and Gregorian calendar component for Vue 2 and Vue 3. Built with vanilla JavaScript, requiring zero external dependencies, zero bundlers, and zero API round-trips[cite: 1, 2].

* **Author:** Eng. Mohamed Elhelbawi
* **Team:** Aarkam Core Architecture
* **Repository:** [https://github.com/melhelbawi/Aarkam.Calendar](https://github.com/melhelbawi/Aarkam.Calendar)
* **License:** MIT

---

## Key Features

* **Official Umm al-Qura Accuracy:** Leverages the native offline ICU/Intl engine (`islamic-umalqura`) with bitmask alignment, eliminating day-drift errors.
* **Dual Display Mode:** View Hijri and Gregorian dates side-by-side with synchronized dual headers and secondary day badges.
* **Zero Dependencies:** Pure JavaScript implementation that runs directly via `<script>` tag or standard ESM imports[cite: 1, 2].
* **Multi-Framework:** Universal component compatible with Vue 2 and Vue 3 runtime instances[cite: 1, 2].
* **Themeable:** Native CSS variables exposed as component props for brand customization.
* **Authority Overrides:** In-memory registry to patch specific moon-sighting anomalies or official legal adjustments.

---

## Installation & Setup

### Vue 3 (Browser / Script Tag)
```html
<script src="[https://unpkg.com/vue@3/dist/vue.global.prod.js](https://unpkg.com/vue@3/dist/vue.global.prod.js)"></script>
<script src="Aarkam.Calendar.v1.7.1.js"></script>

<script>
  const { createApp } = Vue;
  const app = createApp({ /* root logic */ });

  // Registers <aarkam-calendar> globally
  app.use(AarkamCalendar).mount('#app');
</script>
Vue 2 (Browser / Script Tag)HTML<script src="[https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.js](https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.js)"></script>
<script src="Aarkam.Calendar.v1.7.1.js"></script>

<script>
  // Registers <aarkam-calendar> globally
  Vue.use(AarkamCalendar.Vue2Plugin || AarkamCalendar);

  new Vue({
    el: '#app',
    data: {
      selectedDate: null
    }
  });
</script>
Props ReferencePropTypeDefaultDescriptionmodel-value / v-modelObject | StringnullThe active selected date (e.g., { year: 1448, month: 4, day: 25 } or "2026-10-06")[cite: 1, 2].calendarString"hijri"Initial calendar view. Accepted values: "hijri" or "gregorian".   dualBooleanfalseEnables dual-mode display (split header and secondary day numbers).   input-modeBooleanfalseWraps the calendar in an input box trigger with a floating dropdown popup.   labelString"التاريخ"Label text shown above the input box when input-mode is true.   show-switcherBooleantrueShows the top segmented switcher pills (هجري / ميلادي / مزدوج)[cite: 2].localeString"ar"Component language and numbering system. Options: "ar" or "en".   primary-colorString"#156643"Main theme color used for selected days, active pill, and focus rings.   header-bgString"#156643"Custom background color for the calendar header banner.   bg-lightString"#f7faf8"Background color for empty grid cells and the footer strip.   border-colorString"#e2ece7"Border color used for grid dividers, input boxes, and card edges.   date-authorityObjectnullInjects manual authority mappings, adjustments, or resets.   Events ReferenceEventPayloadTrigger Conditionupdate:modelValueObject (Selected Date)Emitted when a day is selected (standard Vue 3 v-model binding).   inputObject (Selected Date)Emitted when a day is selected (standard Vue 2 v-model binding).   changeObject (Selected Date)Emitted on any date selection change.   calendar-changeString ("hijri" | "gregorian")Emitted when switching calendar views via the toolbar[cite: 1].Data StructureSelected dates emitted by @change and v-model use a normalized object schema:JSON{
  "calendar": "hijri",
  "year": 1448,
  "month": 4,
  "day": 25
}
Complete Examples1. Vue 3 ExamplesStandard Dual Calendar (Inline View)HTML<template>
  <div class="calendar-wrapper">
    <aarkam-calendar
      v-model="bookingDate"
      :dual="true"
      :show-switcher="true"
      calendar="hijri"
      @change="onDateChanged"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const bookingDate = ref({ year: 1448, month: 4, day: 25, calendar: 'hijri' });

function onDateChanged(date) {
  console.log('Selected date:', date);
}
</script>
Form Input with Custom Theme ColorsHTML<template>
  <form @submit.prevent="submitForm">
    <aarkam-calendar
      v-model="invoiceDate"
      :input-mode="true"
      label="تاريخ الفاتورة"
      primary-color="#1A2B45"
      header-bg="#0f1b2d"
      border-color="#cbd5e1"
      @change="validateDate"
    />
    <button type="submit">حفظ</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const invoiceDate = ref(null);

function validateDate(date) {
  console.log('Validating:', date);
}

function submitForm() {
  console.log('Submitted payload:', invoiceDate.value);
}
</script>
2. Vue 2 ExamplesStandard Dual CalendarHTML<template>
  <div id="app">
    <aarkam-calendar
      v-model="selectedDate"
      :dual="true"
      calendar="hijri"
      @change="handleDateSelect"
    />
    <p>Selected: {{ selectedDate }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedDate: null
    };
  },
  methods: {
    handleDateSelect(val) {
      this.selectedDate = val;
    }
  }
};
</script>
Input Field Mode in Vue 2HTML<template>
  <div>
    <aarkam-calendar
      v-model="deliveryDate"
      :input-mode="true"
      label="تاريخ التوصيل"
      primary-color="#0e7490"
      header-bg="#155e75"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      deliveryDate: { year: 1448, month: 4, day: 25, calendar: 'hijri' }
    };
  }
};
</script>
Custom Authority OverridesTo adjust for official legal moon sightings or manual overrides, pass :date-authority or use the global static configuration[cite: 1]:JavaScript// Globally configure overrides across all calendar instances
AarkamCalendar.configureDateAuthority({
  // Manually override a specific date
  overrides: {
    "2026-10-06": { year: 1448, month: 4, day: 25 }
  },
  // Reset all overrides back to factory defaults
  reset: false
});
Via template prop:HTML<aarkam-calendar
  v-model="selectedDate"
  :date-authority="{
    overrides: {
      '2026-10-06': { year: 1448, month: 4, day: 25 }
    }
  }"
/>
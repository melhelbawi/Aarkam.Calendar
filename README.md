# Aarkam.Calendar

### Offline-First Umm al-Qura / Hijri + Gregorian Calendar for Vue 2 & Vue 3

**A modern, dependency-free calendar component built for Saudi, Arabic, government, enterprise, education, financial, and offline applications.**

[![Version](https://img.shields.io/badge/version-1.7.2-156643.svg)](https://github.com/melhelbawi/Aarkam.Calendar)
[![Vue 2](https://img.shields.io/badge/Vue-2.x-42b883.svg)](https://v2.vuejs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883.svg)](https://vuejs.org/)
[![Dependencies](https://img.shields.io/badge/runtime_dependencies-zero-success.svg)](https://github.com/melhelbawi/Aarkam.Calendar)
[![Offline](https://img.shields.io/badge/offline-first-success.svg)](https://github.com/melhelbawi/Aarkam.Calendar)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/melhelbawi/Aarkam.Calendar)

---

## ✨ Overview

**Aarkam.Calendar** is an offline-first calendar component for applications that need **Hijri/Umm al-Qura and Gregorian calendars as first-class date systems**.

It is designed to work with both:

* **Vue 2**
* **Vue 3**

using the familiar **Options API** style.

The component provides:

* 🇸🇦 Umm al-Qura / Hijri calendar
* 📅 Gregorian calendar
* 🔄 Hijri ↔ Gregorian switching
* 🌓 Dual-calendar display
* 🗓 Month picker
* 📆 Ten-year year picker
* 📝 Input / popup mode
* 🌐 Arabic and English localization
* 🎨 Configurable theme
* ⚙️ Date authority / override support
* 📴 Offline operation
* 📦 Script-tag deployment
* 🚫 No jQuery
* 🚫 No Moment.js
* 🚫 No Day.js
* 🚫 No calendar API
* 🚫 No backend dependency

The same calendar behavior and public component API are intended to be available from both Vue 2 and Vue 3.

---

# 🎯 Why Aarkam.Calendar?

Most JavaScript calendar components are fundamentally Gregorian calendars with optional Hijri formatting.

Aarkam.Calendar is designed around a different concept:

> **The selected day is the canonical value; Hijri and Gregorian are projections of that same day.**

For example:

```text
User selects:

25 ربيع الآخر 1448 هـ

            ↓

   Canonical selected day

            ↓

Gregorian projection:

06 October 2026
```

Changing from Hijri to Gregorian therefore does **not** mean selecting another date.

It changes the calendar representation of the same selected day.

This is particularly important in Saudi applications where a business process may be displayed in Hijri while backend systems continue to store Gregorian dates.

---

# 🧩 Framework Compatibility

| Feature             | Vue 2 | Vue 3 |
| ------------------- | :---: | :---: |
| Options API         |   ✅   |   ✅   |
| `<aarkam-calendar>` |   ✅   |   ✅   |
| `v-model`           |   ✅   |   ✅   |
| Hijri / Umm al-Qura |   ✅   |   ✅   |
| Gregorian           |   ✅   |   ✅   |
| Dual mode           |   ✅   |   ✅   |
| Calendar switcher   |   ✅   |   ✅   |
| Month picker        |   ✅   |   ✅   |
| Year picker         |   ✅   |   ✅   |
| Input / popup mode  |   ✅   |   ✅   |
| Arabic              |   ✅   |   ✅   |
| English             |   ✅   |   ✅   |
| Theme customization |   ✅   |   ✅   |
| Date authority      |   ✅   |   ✅   |
| Offline operation   |   ✅   |   ✅   |

The important design goal is that **application code does not need to change its calendar usage when moving between Vue 2 and Vue 3**.

---

# 🏗 Architecture

Aarkam.Calendar separates the calendar engine from the framework adapter.

```text
                    ┌──────────────────────────┐
                    │   Aarkam.Calendar Core   │
                    │                          │
                    │  Date conversion         │
                    │  Umm al-Qura resolution  │
                    │  Gregorian resolution     │
                    │  Calendar navigation     │
                    │  Date authority          │
                    └────────────┬─────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
         ┌────────▼────────┐          ┌─────────▼────────┐
         │    Vue 2 API    │          │    Vue 3 API     │
         │                 │          │                  │
         │ Options API     │          │ Options API      │
         └────────┬────────┘          └─────────┬────────┘
                  │                             │
                  └──────────────┬──────────────┘
                                 │
                         Same component API
```

This means the calendar engine is not conceptually tied to a particular Vue generation.

---

# 📦 Installation

Aarkam.Calendar is distributed as a standalone JavaScript file.

```text
src/Vue/Aarkam.Calendar.v1.7.1.js
```

You can deploy it directly into:

```text
wwwroot/js/
public/js/
assets/js/
Scripts/
```

or another static asset directory.

No package manager is required for script-tag usage.

---

# 🌐 Direct Script Usage

## Vue 2

```html
<script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>
<script src="./Aarkam.Calendar.v1.7.1.js"></script>
```

Then:

```html
<div id="app">

    <aarkam-calendar
        v-model="selectedDate"
        :dual="true"
    />

</div>
```

```javascript
new Vue({
    el: "#app",

    data: {
        selectedDate: null
    },

    methods: {

        onDateChanged: function (date) {
            console.log("Selected:", date);
        }

    }
});
```

---

# Vue 3

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="./Aarkam.Calendar.v1.7.1.js"></script>
```

```html
<div id="app">

    <aarkam-calendar
        v-model="selectedDate"
        :dual="true"
        @change="onDateChanged"
    />

</div>
```

```javascript
Vue.createApp({

    data: function () {

        return {
            selectedDate: null
        };

    },

    methods: {

        onDateChanged: function (date) {
            console.log("Selected:", date);
        }

    }

})
.use(AarkamCalendar)
.mount("#app");
```

---

# 🧠 Options API

Aarkam.Calendar is designed to work naturally with the Vue Options API.

### Vue 2

```javascript
new Vue({

    data: function () {

        return {
            selectedDate: null
        };

    },

    methods: {

        handleDateChange: function (date) {
            console.log(date);
        }

    }

});
```

### Vue 3

```javascript
Vue.createApp({

    data: function () {

        return {
            selectedDate: null
        };

    },

    methods: {

        handleDateChange: function (date) {
            console.log(date);
        }

    }

});
```

The calendar itself does not require developers to adopt the Composition API.

---

# 🔌 Component Registration

## Vue 2

The component can be registered globally:

```javascript
Vue.component(
    "aarkam-calendar",
    AarkamCalendar.Component
);
```

or through the plugin:

```javascript
Vue.use(AarkamCalendar);
```

---

## Vue 3

```javascript
app.use(AarkamCalendar);
```

The plugin registers:

```text
AarkamCalendar
aarkam-calendar
```

---

# 🧾 Basic Usage

```html
<aarkam-calendar
    v-model="selectedDate"
/>
```

Default behavior:

```text
Calendar: Hijri
Locale:   Arabic
Dual:     false
Switcher: true
Input:    false
```

---

# 📅 Gregorian Calendar

```html
<aarkam-calendar
    v-model="selectedDate"
    calendar="gregorian"
/>
```

---

# 🕌 Hijri Calendar

```html
<aarkam-calendar
    v-model="selectedDate"
    calendar="hijri"
/>
```

Hijri is the default calendar.

---

# 🔄 Dual Calendar

```html
<aarkam-calendar
    v-model="selectedDate"
    :dual="true"
/>
```

Dual mode displays both calendar systems.

For example:

```text
ربيع الآخر 1448
        │
        │
October 2026
```

The day grid can display the primary calendar day together with its corresponding secondary-calendar day.

---

# 🔀 Switching Calendar Systems

The built-in switcher allows users to move between:

```text
هجري
ميلادي
مزدوج
```

or:

```text
Hijri
Gregorian
Dual
```

The selected day remains stable while its representation changes.

---

# 🗓 Month Picker

Clicking the month title switches from the day grid to the month picker.

Example:

```text
محرم
صفر
ربيع الأول
ربيع الثاني
جمادى الأولى
جمادى الآخرة
رجب
شعبان
رمضان
شوال
ذو القعدة
ذو الحجة
```

Selecting a month returns to the day grid.

---

# 📆 Year Picker

Clicking the year title opens a ten-year range.

Example:

```text
1440   1441   1442   1443   1444
1445   1446   1447   1448   1449
```

Navigation moves between ten-year ranges.

This makes selecting older dates significantly faster than clicking the previous-month button hundreds of times.

---

# 📝 Input Mode

Use:

```html
<aarkam-calendar
    v-model="date"
    :input-mode="true"
/>
```

The component becomes an input-style control.

Example:

```html
<aarkam-calendar
    v-model="birthDate"
    :input-mode="true"
    label="تاريخ الميلاد"
/>
```

The user clicks the input and the calendar opens as a popup.

Selecting a date closes the popup.

---

# 🌐 Localization

## Arabic

```html
<aarkam-calendar
    locale="ar"
/>
```

## English

```html
<aarkam-calendar
    locale="en"
/>
```

Arabic is the default.

---

# 🇸🇦 Saudi Government Example

```html
<aarkam-calendar
    v-model="applicationDate"
    calendar="hijri"
    locale="ar"
    :input-mode="true"
    label="تاريخ الطلب"
    primary-color="#0f6c3d"
    header-bg="#0f6c3d"
/>
```

Suitable for:

* government portals
* ministry systems
* citizen services
* official requests
* permits
* applications
* contracts

---

# 🧑‍💼 HR Example

```html
<aarkam-calendar
    v-model="employeeBirthDate"
    :input-mode="true"
    label="تاريخ الميلاد"
/>
```

---

# 📄 Contract Example

```html
<aarkam-calendar
    v-model="contractDate"
    :dual="true"
    :input-mode="true"
    label="تاريخ العقد"
/>
```

Dual mode is useful when both Hijri and Gregorian dates must be visible to the user.

---

# 💰 Invoice Example

```html
<aarkam-calendar
    v-model="invoiceDate"
    calendar="gregorian"
    :input-mode="true"
    label="Invoice Date"
    locale="en"
/>
```

---

# 🎓 Education Example

```html
<aarkam-calendar
    v-model="registrationDate"
    calendar="hijri"
    locale="ar"
    label="تاريخ التسجيل"
/>
```

---

# 🏥 Healthcare Example

```html
<aarkam-calendar
    v-model="visitDate"
    :dual="true"
    :input-mode="true"
    label="تاريخ الزيارة"
/>
```

---

# 📴 Offline Usage

Aarkam.Calendar is designed to operate without a network connection.

It does not require:

```text
Calendar API
REST API
Backend service
Cloud service
CDN
Database
```

after the JavaScript file has been deployed locally.

Example:

```text
Application
│
├── index.html
├── css/
└── js/
    ├── vue.js
    └── Aarkam.Calendar.v1.7.1.js
```

The application can operate inside an isolated network.

---

# 🛡 Date Authority

Aarkam.Calendar provides an authority mechanism for applications that need controlled date mappings.

The public API includes:

```javascript
AarkamCalendar.configureDateAuthority(...)
```

This can be used to register:

* Umm al-Qura mappings
* explicit date overrides
* controlled "today" values

---

# Authority Example

```javascript
AarkamCalendar.configureDateAuthority({

    overrides: {

        "2026-10-06": {
            year: 1448,
            month: 4,
            day: 25
        }

    }

});
```

The Gregorian date is used as the mapping key.

---

# Reset Authority

```javascript
AarkamCalendar.configureDateAuthority({

    reset: true

});
```

This clears the configured authority state.

---

# Component-Level Authority

The component also accepts:

```html
<aarkam-calendar
    v-model="date"
    :date-authority="authority"
/>
```

Example:

```javascript
data: function () {

    return {

        authority: {

            overrides: {

                "2026-10-06": {
                    year: 1448,
                    month: 4,
                    day: 25
                }

            }

        }

    };

}
```

---

# 🎨 Theme Customization

## Primary Color

```html
<aarkam-calendar
    primary-color="#0f6c3d"
/>
```

## Header

```html
<aarkam-calendar
    header-bg="#0f6c3d"
/>
```

## Light Background

```html
<aarkam-calendar
    bg-light="#f7faf8"
/>
```

## Border

```html
<aarkam-calendar
    border-color="#dce7e1"
/>
```

Complete Saudi-style example:

```html
<aarkam-calendar
    v-model="date"
    locale="ar"
    :dual="true"
    primary-color="#0f6c3d"
    header-bg="#0f6c3d"
    bg-light="#f7faf8"
    border-color="#dce7e1"
/>
```

---

# 📚 API Reference

## Component Name

```text
AarkamCalendar
```

HTML/component alias:

```text
aarkam-calendar
```

---

# Props

| Prop            | Type               | Default     | Description                         |
| --------------- | ------------------ | ----------- | ----------------------------------- |
| `modelValue`    | `Object \| String` | `null`      | Selected date model                 |
| `calendar`      | `String`           | `"hijri"`   | Active calendar                     |
| `dual`          | `Boolean`          | `false`     | Enables dual-calendar presentation  |
| `showSwitcher`  | `Boolean`          | `true`      | Shows Hijri/Gregorian/Dual switcher |
| `inputMode`     | `Boolean`          | `false`     | Enables input/popup presentation    |
| `label`         | `String`           | `"التاريخ"` | Input label                         |
| `locale`        | `String`           | `"ar"`      | UI locale                           |
| `dateAuthority` | `Object`           | `null`      | Date authority configuration        |
| `primaryColor`  | `String`           | `"#156643"` | Primary theme color                 |
| `headerBg`      | `String`           | `null`      | Header background                   |
| `bgLight`       | `String`           | `"#f7faf8"` | Light background                    |
| `borderColor`   | `String`           | `"#e2ece7"` | Border color                        |

These are the props exposed by the v1.7.1 component definition.

---

# `modelValue`

The selected date.

Example:

```javascript
{
    calendar: "hijri",
    year: 1448,
    month: 4,
    day: 25
}
```

Gregorian:

```javascript
{
    calendar: "gregorian",
    year: 2026,
    month: 10,
    day: 6
}
```

The model represents the date using the active calendar projection.

---

# `calendar`

Accepted values:

```text
"hijri"
"gregorian"
```

Example:

```html
<aarkam-calendar
    calendar="gregorian"
/>
```

---

# `dual`

```html
<aarkam-calendar
    :dual="true"
/>
```

Default:

```javascript
false
```

---

# `showSwitcher`

```html
<aarkam-calendar
    :show-switcher="false"
/>
```

Default:

```javascript
true
```

Use this when the host application should prevent the user from switching calendar presentation.

---

# `inputMode`

```html
<aarkam-calendar
    :input-mode="true"
/>
```

Default:

```javascript
false
```

---

# `label`

```html
<aarkam-calendar
    :input-mode="true"
    label="تاريخ الإصدار"
/>
```

---

# `locale`

Supported UI locales:

```text
ar
en
```

Default:

```text
ar
```

---

# `dateAuthority`

Accepts an authority configuration object.

```html
<aarkam-calendar
    :date-authority="authority"
/>
```

---

# `primaryColor`

```html
<aarkam-calendar
    primary-color="#156643"
/>
```

---

# `headerBg`

```html
<aarkam-calendar
    header-bg="#0f6c3d"
/>
```

---

# `bgLight`

```html
<aarkam-calendar
    bg-light="#f7faf8"
/>
```

---

# `borderColor`

```html
<aarkam-calendar
    border-color="#e2ece7"
/>
```

---

# 📣 Events

The component exposes:

```text
update:modelValue
change
calendar-change
```

The v1.7.1 component definition declares these events.

---

## `change`

Triggered when the user selects a day.

```html
<aarkam-calendar
    v-model="selectedDate"
    @change="onDateChanged"
/>
```

```javascript
methods: {

    onDateChanged: function (date) {

        console.log(
            "Selected date:",
            date
        );

    }

}
```

The current implementation emits both the model update and `change` when a day is selected.

---

## `update:modelValue`

Vue 3 standard model-update event.

```html
<aarkam-calendar
    :model-value="selectedDate"
    @update:model-value="selectedDate = $event"
/>
```

For Vue 2 applications, use the normal Vue 2 `v-model` integration supplied by the Vue 2 adapter.

---

## `calendar-change`

Reserved public event for calendar-mode changes.

```html
<aarkam-calendar
    @calendar-change="onCalendarChanged"
/>
```

---

# 🔁 Vue 2 `v-model`

Vue 2 applications should be able to use:

```html
<aarkam-calendar
    v-model="selectedDate"
/>
```

without changing their application architecture.

Example:

```javascript
new Vue({

    el: "#app",

    data: {
        selectedDate: null
    },

    methods: {

        save: function () {

            console.log(
                this.selectedDate
            );

        }

    }

});
```

---

# 🔁 Vue 3 `v-model`

Vue 3 applications use the same high-level syntax:

```html
<aarkam-calendar
    v-model="selectedDate"
/>
```

The underlying Vue 3 adapter maps the model to:

```text
modelValue
update:modelValue
```

---

# 📅 Initial Date

## Hijri

```javascript
selectedDate: {

    calendar: "hijri",

    year: 1448,
    month: 4,
    day: 25

}
```

## Gregorian

```javascript
selectedDate: {

    calendar: "gregorian",

    year: 2026,
    month: 10,
    day: 6

}
```

---

# 📅 ISO Date Input

The model can also accept a string:

```javascript
selectedDate: "2026-10-06"
```

For enterprise applications, the normalized object representation is recommended when the calendar system must be explicit.

---

# 🔄 Calendar Conversion Model

The component follows this conceptual model:

```text
             Selected Day
                  │
        ┌─────────┴─────────┐
        │                   │
      Hijri              Gregorian
        │                   │
        └─────────┬─────────┘
                  │
             Same Day
```

Switching calendars should therefore never destroy the selected date.

---

# 🧭 Navigation Model

The calendar supports three navigation levels.

### Days

Move between months.

### Months

Click the month title and select directly from the twelve months.

### Years

Click the year title and select from a ten-year range.

This gives users a fast path to both nearby and historical dates.

---

# 🗓 Date Range Selection

**v1.7.1 is a single-date picker.**

It does not expose a native:

```text
range
startDate
endDate
```

API.

Applications requiring a range can compose two instances:

```html
<aarkam-calendar
    v-model="startDate"
    :input-mode="true"
    label="من"
/>

<aarkam-calendar
    v-model="endDate"
    :input-mode="true"
    label="إلى"
/>
```

Then validate the range in the application layer.

---

# 🧪 Testing / Controlled Dates

The date-authority mechanism can be useful for deterministic testing.

For example, an application can provide a controlled "today" value instead of relying on the machine's current date.

This is useful for:

* unit tests
* regression testing
* historical demonstrations
* offline testing
* reproducing date-specific issues

---

# 🏢 Enterprise Usage

A recommended architecture is:

```text
                    UI
                     │
                     ▼
            Aarkam.Calendar
                     │
                     ▼
             Date Model
                     │
                     ▼
            Application Layer
                     │
          ┌──────────┴──────────┐
          │                     │
       Validation             API DTO
                                │
                                ▼
                            Database
```

The calendar should remain a **presentation/input component**.

Business rules should remain in the application's domain/service layer.

---

# 🗄 Backend Recommendation

If the backend uses Gregorian dates, do not store the formatted Hijri string directly as the primary database value.

Prefer:

```text
Database
    ↓
Canonical date
    ↓
Application DTO
    ↓
Aarkam.Calendar
    ↓
Hijri/Gregorian presentation
```

This prevents UI formatting concerns from leaking into persistence.

---

# 📴 Air-Gapped / Government Networks

Aarkam.Calendar is especially suitable for environments where:

* outbound internet is restricted
* CDN resources are prohibited
* external APIs are prohibited
* systems run inside private networks
* systems must continue operating without connectivity

Deploy:

```text
Vue
+
Aarkam.Calendar.v1.7.1.js
```

as local application assets.

---

# 🔐 Authority vs. Calculation

Aarkam.Calendar provides conversion functionality, but applications handling legally or financially authoritative dates should be able to supply their own authority mapping.

This is why the authority API exists.

For example:

```javascript
AarkamCalendar.configureDateAuthority({
    overrides: {
        "YYYY-MM-DD": {
            year: 1448,
            month: 4,
            day: 25
        }
    }
});
```

This allows the application to override a calculated mapping when an authoritative source requires it.

---

# 🌍 Browser Environment

The calendar is designed to use browser date/calendar capabilities where available and maintains an offline fallback strategy.

For production systems, validate the exact browser/runtime versions deployed by the organization.

---

# 🚫 No Runtime Framework Lock-In

Aarkam.Calendar does not require:

* Bootstrap
* jQuery
* Moment.js
* Day.js
* date-fns
* Axios
* a remote calendar service

The Vue adapter is intentionally lightweight.

---

# 📦 Deployment Models

Aarkam.Calendar can fit several application architectures.

### Traditional Server Rendered

```text
ASP.NET MVC
Razor Pages
Web Forms
+
Vue runtime
+
Aarkam.Calendar
```

### Vue 2 Application

```text
Vue 2
+
Aarkam.Calendar
```

### Vue 3 Application

```text
Vue 3
+
Aarkam.Calendar
```

### Offline Enterprise Application

```text
Local Vue
+
Local Aarkam.Calendar
+
No external network dependency
```

---

# 🔧 Public API

The global object is:

```javascript
AarkamCalendar
```

The library exposes:

```javascript
AarkamCalendar.version
AarkamCalendar.author
AarkamCalendar.repository
AarkamCalendar.license
AarkamCalendar.configureDateAuthority
AarkamCalendar.install
AarkamCalendar.Component
```

The Vue 3 build currently exposes the plugin/component registration through the global object; the dual-adapter release should expose the corresponding Vue 2 registration path as well.

---

# 🧱 Recommended Component Naming

Both of these should be supported:

```html
<aarkam-calendar />
```

and:

```html
<AarkamCalendar />
```

The preferred HTML usage is:

```html
<aarkam-calendar />
```

---

# 🛠 Complete Vue 2 Example

```html
<!DOCTYPE html>

<html lang="ar" dir="rtl">

<head>

    <meta charset="UTF-8">

    <title>
        Aarkam.Calendar Vue 2
    </title>

</head>

<body>

<div id="app">

    <aarkam-calendar
        v-model="selectedDate"
        :dual="true"
        :input-mode="true"
        label="التاريخ"
        locale="ar"
        primary-color="#0f6c3d"
        header-bg="#0f6c3d"
        @change="onDateChanged"
    />

    <pre>{{ selectedDate }}</pre>

</div>

<script src="./vue.js"></script>
<script src="./Aarkam.Calendar.v1.7.1.js"></script>

<script>

Vue.use(AarkamCalendar);

new Vue({

    el: "#app",

    data: {

        selectedDate: null

    },

    methods: {

        onDateChanged: function (date) {

            console.log(
                "Selected:",
                date
            );

        }

    }

});

</script>

</body>

</html>
```

---

# 🛠 Complete Vue 3 Example

```html
<!DOCTYPE html>

<html lang="ar" dir="rtl">

<head>

    <meta charset="UTF-8">

    <title>
        Aarkam.Calendar Vue 3
    </title>

</head>

<body>

<div id="app">

    <aarkam-calendar
        v-model="selectedDate"
        :dual="true"
        :input-mode="true"
        label="التاريخ"
        locale="ar"
        primary-color="#0f6c3d"
        header-bg="#0f6c3d"
        @change="onDateChanged"
    />

    <pre>{{ selectedDate }}</pre>

</div>

<script src="./vue.global.prod.js"></script>
<script src="./Aarkam.Calendar.v1.7.1.js"></script>

<script>

const app = Vue.createApp({

    data: function () {

        return {

            selectedDate: null

        };

    },

    methods: {

        onDateChanged: function (date) {

            console.log(
                "Selected:",
                date
            );

        }

    }

});

app.use(AarkamCalendar);

app.mount("#app");

</script>

</body>

</html>
```

---

# 🧪 Recommended Testing Matrix

Before releasing v1.7.1 as a dual Vue version, test:

| Test                   | Vue 2 | Vue 3 |
| ---------------------- | :---: | :---: |
| Initial Hijri date     |   ✅   |   ✅   |
| Initial Gregorian date |   ✅   |   ✅   |
| Today default          |   ✅   |   ✅   |
| Select day             |   ✅   |   ✅   |
| Previous month         |   ✅   |   ✅   |
| Next month             |   ✅   |   ✅   |
| Month picker           |   ✅   |   ✅   |
| Year picker            |   ✅   |   ✅   |
| Hijri → Gregorian      |   ✅   |   ✅   |
| Gregorian → Hijri      |   ✅   |   ✅   |
| Dual mode              |   ✅   |   ✅   |
| Input mode             |   ✅   |   ✅   |
| Arabic                 |   ✅   |   ✅   |
| English                |   ✅   |   ✅   |
| `v-model`              |   ✅   |   ✅   |
| `change`               |   ✅   |   ✅   |
| Authority override     |   ✅   |   ✅   |
| Offline                |   ✅   |   ✅   |

---

# ⚠️ Important Version Note

**v1.7.1 is intended to provide the same public calendar experience across Vue 2 and Vue 3.**

The framework-specific adapter should remain an implementation detail.

Applications should not need separate business logic for:

```text
Vue 2
```

versus:

```text
Vue 3
```

The preferred application API is:

```html
<aarkam-calendar
    v-model="date"
/>
```

regardless of the Vue generation.

---

# 📋 Feature Summary

| Capability                  |  Status  |
| --------------------------- | :------: |
| Hijri / Umm al-Qura         |     ✅    |
| Gregorian                   |     ✅    |
| Dual display                |     ✅    |
| Calendar switching          |     ✅    |
| Month selection             |     ✅    |
| Ten-year year selection     |     ✅    |
| Single-date selection       |     ✅    |
| Input popup                 |     ✅    |
| Arabic                      |     ✅    |
| English                     |     ✅    |
| Offline                     |     ✅    |
| Authority overrides         |     ✅    |
| Theme customization         |     ✅    |
| Vue 2                       |     ✅    |
| Vue 3                       |     ✅    |
| Options API                 |     ✅    |
| Date range                  | ❌ v1.7.1 |
| Native multi-date selection | ❌ v1.7.1 |

---

# 🚀 Design Philosophy

Aarkam.Calendar is built around a few principles.

### 1. Offline First

A calendar should not require an internet connection.

### 2. Hijri First-Class

Umm al-Qura is not merely a formatting option.

### 3. One Day, Multiple Representations

Hijri and Gregorian views represent the same selected day.

### 4. Framework Friendly

Vue 2 and Vue 3 should share the same application-level API.

### 5. Options API Friendly

Developers should be able to use the component without adopting the Composition API.

### 6. Enterprise Ready

The component should fit government, enterprise, education, finance, healthcare, and traditional server-rendered systems.

### 7. Authority Aware

Applications can provide authoritative mappings when calculated dates are not sufficient.

---

# 🗺 Roadmap

Potential future versions may add:

* native date-range selection
* min/max date
* disabled dates
* custom day rendering
* keyboard navigation improvements
* richer accessibility support
* programmatic navigation API
* expanded authority-table tooling
* additional calendar systems
* ESM/NPM distribution
* dedicated framework adapters

Features listed here are roadmap items and should not be interpreted as v1.7.1 functionality.

---

# 🤝 Contributing

When reporting a date discrepancy, please include:

1. Gregorian date
2. Expected Hijri date
3. Actual Hijri date
4. Browser
5. Browser version
6. Operating system
7. Vue version
8. Whether an authority override was configured
9. Whether the application was operating offline

This makes calendar discrepancies easier to reproduce.

---

# 📚 Repository

Source code:

https://github.com/melhelbawi/Aarkam.Calendar

Stable Vue component:

`src/Vue/Aarkam.Calendar.v1.7.1.js`

---

# 👨‍💻 Author

**Eng. Mohamed Elhelbawi**

Aarkam

---

# ❤️ Aarkam.Calendar

> **One selected day. Two calendars. Zero network dependency.**

Built for applications where **Hijri and Gregorian dates are both first-class citizens.**

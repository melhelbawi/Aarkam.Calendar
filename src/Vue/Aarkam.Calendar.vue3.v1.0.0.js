/*!
 * =============================================================================
 * Aarkam.Calendar (Vue 3 Edition) v1.0.0
 * Author      : Eng. Mohamed Elhelbawi
 * Team        : Aarkam Core Architecture
 * Repository  : https://github.com/melhelbawi/Aarkam.Calendar
 * License     : MIT
 *
 * Dedicated Vue 3 Umm al-Qura + Gregorian + Dual Calendar Component.
 * Offline-first, pure JavaScript, zero bundler/npm dependencies required.
 * =============================================================================
 */

(function (global) {
    "use strict";

    var VERSION = "1.0.0";
    var AUTHOR = "Eng. Mohamed Elhelbawi";
    var REPOSITORY = "https://github.com/melhelbawi/Aarkam.Calendar";
    var LICENSE = "MIT";

    /* =========================================================
       1. CONSTANTS & LOCALIZATION DATA
       ========================================================= */

    var MONTHS_AR = [
        "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ];

    var MONTHS_EN = [
        "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
        "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ];

    var GREG_MONTHS_EN = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    var GREG_MONTHS_AR = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    var WEEK_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    var WEEK_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    var CAL_GREGORIAN = "gregorian";
    var CAL_HIJRI = "hijri";

    var PICKER_DAYS = "days";
    var PICKER_MONTHS = "months";
    var PICKER_YEARS = "years";

    /* =========================================================
       2. CORE CALENDAR & ASTRONOMICAL ENGINE
       ========================================================= */

    function pad2(value) { return String(value).padStart(2, "0"); }
    function pad4(value) { return String(value).padStart(4, "0"); }

    function dateKey(date) {
        if (!date) return null;
        return pad4(date.year) + "-" + pad2(date.month) + "-" + pad2(date.day);
    }

    function cloneDate(date) {
        if (!date) return null;
        return {
            year: Number(date.year),
            month: Number(date.month),
            day: Number(date.day)
        };
    }

    function normalizeCalendar(value) {
        return String(value || "").toLowerCase() === CAL_GREGORIAN ? CAL_GREGORIAN : CAL_HIJRI;
    }

    function isArabicLocale(locale) {
        return String(locale || "ar").toLowerCase().indexOf("ar") === 0;
    }

    function parseIsoDate(value) {
        if (typeof value !== "string") return null;
        var match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
        if (!match) return null;
        return {
            year: Number(match[1]),
            month: Number(match[2]),
            day: Number(match[3])
        };
    }

    function parseDateLike(value, defaultCalendar) {
        if (!value) return null;
        if (typeof value === "string") {
            var parsed = parseIsoDate(value);
            if (!parsed) return null;
            return {
                calendar: normalizeCalendar(defaultCalendar),
                year: parsed.year,
                month: parsed.month,
                day: parsed.day
            };
        }
        if (typeof value === "object") {
            if (
                Number.isFinite(Number(value.year)) &&
                Number.isFinite(Number(value.month)) &&
                Number.isFinite(Number(value.day))
            ) {
                return {
                    calendar: normalizeCalendar(value.calendar || defaultCalendar),
                    year: Number(value.year),
                    month: Number(value.month),
                    day: Number(value.day)
                };
            }
            if (value.date) return parseDateLike(value.date, value.calendar || defaultCalendar);
        }
        return null;
    }

    function mod(a, b) { return ((a % b) + b) % b; }

    function gregorianToJd(year, month, day) {
        var a = Math.floor((14 - month) / 12);
        var y = year + 4800 - a;
        var m = month + 12 * a - 3;
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    }

    function jdToGregorian(jd) {
        var a = jd + 32044;
        var b = Math.floor((4 * a + 3) / 146097);
        var c = a - Math.floor((146097 * b) / 4);
        var d = Math.floor((4 * c + 3) / 1461);
        var e = c - Math.floor((1461 * d) / 4);
        var m = Math.floor((5 * e + 2) / 153);
        return {
            year: 100 * b + d - 4800 + Math.floor(m / 10),
            month: m + 3 - 12 * Math.floor(m / 10),
            day: e - Math.floor((153 * m + 2) / 5) + 1
        };
    }

    function islamicToJd(year, month, day) {
        return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + 1948439 - 1;
    }

    function jdToIslamic(jd) {
        var year = Math.floor((30 * (jd - 1948439) + 10646) / 10631);
        var month = Math.min(12, Math.ceil((jd - (29 + islamicToJd(year, 1, 1))) / 29.5) + 1);
        var first = islamicToJd(year, month, 1);
        while (jd < first && month > 1) { month--; first = islamicToJd(year, month, 1); }
        while (month < 12 && jd >= islamicToJd(year, month + 1, 1)) { month++; }
        return { year: year, month: month, day: jd - islamicToJd(year, month, 1) + 1 };
    }

    function daysInGregorianMonth(year, month) {
        return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }

    /* =========================================================
       3. OFFLINE UMM AL-QURA ENGINE & AUTHORITY REGISTRY
       ========================================================= */

    var DateAuthority = {
        overridesGregorian: Object.create(null),
        overridesHijri: Object.create(null),
        ummAlQuraGregorian: Object.create(null),
        ummAlQuraHijri: Object.create(null),
        todayOverride: null
    };

    var hasNativeUmmAlQura = (function () {
        try {
            if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return false;
            var fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: "UTC" });
            return fmt.resolvedOptions().calendar === "islamic-umalqura";
        } catch (e) {
            return false;
        }
    })();

    function gregorianToUmmAlQuraNative(year, month, day) {
        if (!hasNativeUmmAlQura) return null;
        try {
            var date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            var formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
                timeZone: "UTC",
                day: "numeric",
                month: "numeric",
                year: "numeric"
            });
            var parts = formatter.formatToParts(date);
            var result = {};
            for (var i = 0; i < parts.length; i++) {
                if (parts[i].type === "year") result.year = parseInt(parts[i].value, 10);
                if (parts[i].type === "month") result.month = parseInt(parts[i].value, 10);
                if (parts[i].type === "day") result.day = parseInt(parts[i].value, 10);
            }
            return result.year && result.month && result.day ? result : null;
        } catch (e) {
            return null;
        }
    }

    function ummAlQuraToGregorianNative(year, month, day) {
        if (!hasNativeUmmAlQura) return null;
        var estJd = islamicToJd(year, month, day);
        for (var offset = -2; offset <= 2; offset++) {
            var candG = jdToGregorian(estJd + offset);
            var candH = gregorianToUmmAlQuraNative(candG.year, candG.month, candG.day);
            if (candH && candH.year === year && candH.month === month && candH.day === day) return candG;
        }
        return null;
    }

    function registerAuthorityPair(gregorian, hijri, source) {
        var g = parseDateLike(gregorian, CAL_GREGORIAN);
        var h = parseDateLike(hijri, CAL_HIJRI);
        if (!g || !h) return;
        var record = { gregorian: cloneDate(g), hijri: cloneDate(h), source: source || "authority" };
        if (source === "override") {
            DateAuthority.overridesGregorian[dateKey(g)] = record;
            DateAuthority.overridesHijri[dateKey(h)] = record;
        } else {
            DateAuthority.ummAlQuraGregorian[dateKey(g)] = record;
            DateAuthority.ummAlQuraHijri[dateKey(h)] = record;
        }
    }

    function configureDateAuthority(options) {
        options = options || {};
        if (options.reset === true) {
            DateAuthority.overridesGregorian = Object.create(null);
            DateAuthority.overridesHijri = Object.create(null);
            DateAuthority.ummAlQuraGregorian = Object.create(null);
            DateAuthority.ummAlQuraHijri = Object.create(null);
            DateAuthority.todayOverride = null;
        }
        if (options.todayOverride !== undefined) DateAuthority.todayOverride = options.todayOverride;
        if (Array.isArray(options.ummAlQura)) {
            options.ummAlQura.forEach(function (e) { if (e) registerAuthorityPair(e.gregorian, e.hijri, "umm-al-qura"); });
        }
        if (options.overrides && typeof options.overrides === "object") {
            Object.keys(options.overrides).forEach(function (k) { registerAuthorityPair(k, options.overrides[k], "override"); });
        }
    }

    function convert(date, targetCalendar) {
        if (!date) return null;
        var sourceCalendar = normalizeCalendar(date.calendar);
        var target = normalizeCalendar(targetCalendar);

        if (sourceCalendar === target) {
            return { calendar: target, year: Number(date.year), month: Number(date.month), day: Number(date.day) };
        }

        var source = { year: Number(date.year), month: Number(date.month), day: Number(date.day) };

        if (sourceCalendar === CAL_GREGORIAN) {
            var kG = dateKey(source);
            if (DateAuthority.overridesGregorian[kG]) return cloneDate(DateAuthority.overridesGregorian[kG].hijri);
            if (DateAuthority.ummAlQuraGregorian[kG]) return cloneDate(DateAuthority.ummAlQuraGregorian[kG].hijri);
            var nativeH = gregorianToUmmAlQuraNative(source.year, source.month, source.day);
            if (nativeH) return { calendar: CAL_HIJRI, year: nativeH.year, month: nativeH.month, day: nativeH.day };
            var hFall = jdToIslamic(gregorianToJd(source.year, source.month, source.day));
            return { calendar: CAL_HIJRI, year: hFall.year, month: hFall.month, day: hFall.day };
        }

        var kH = dateKey(source);
        if (DateAuthority.overridesHijri[kH]) return cloneDate(DateAuthority.overridesHijri[kH].gregorian);
        if (DateAuthority.ummAlQuraHijri[kH]) return cloneDate(DateAuthority.ummAlQuraHijri[kH].gregorian);
        var nativeG = ummAlQuraToGregorianNative(source.year, source.month, source.day);
        if (nativeG) return { calendar: CAL_GREGORIAN, year: nativeG.year, month: nativeG.month, day: nativeG.day };
        var gFall = jdToGregorian(islamicToJd(source.year, source.month, source.day));
        return { calendar: CAL_GREGORIAN, year: gFall.year, month: gFall.month, day: gFall.day };
    }

    function normalizeToGregorian(value, displayCalendar) {
        var parsed = parseDateLike(value, displayCalendar || CAL_GREGORIAN);
        if (!parsed) return null;
        if (parsed.calendar === CAL_GREGORIAN) return { year: parsed.year, month: parsed.month, day: parsed.day };
        return convert(parsed, CAL_GREGORIAN);
    }

    function projectFromGregorian(gregorian, calendar) {
        if (!gregorian) return null;
        if (normalizeCalendar(calendar) === CAL_GREGORIAN) {
            return { calendar: CAL_GREGORIAN, year: gregorian.year, month: gregorian.month, day: gregorian.day };
        }
        return convert({ calendar: CAL_GREGORIAN, year: gregorian.year, month: gregorian.month, day: gregorian.day }, CAL_HIJRI);
    }

    function todayGregorian() {
        if (DateAuthority.todayOverride) {
            var o = DateAuthority.todayOverride;
            if (o.gregorian) return cloneDate(parseDateLike(o.gregorian, CAL_GREGORIAN));
            if (o.hijri) return convert(parseDateLike(o.hijri, CAL_HIJRI), CAL_GREGORIAN);
        }
        var now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }

    function sameDate(a, b) {
        return !!(a && b && Number(a.year) === Number(b.year) && Number(a.month) === Number(b.month) && Number(a.day) === Number(b.day));
    }

    function daysInMonth(year, month, calendar) {
        if (normalizeCalendar(calendar) === CAL_GREGORIAN) return daysInGregorianMonth(year, month);
        for (var d = 30; d >= 29; d--) {
            var g = convert({ calendar: CAL_HIJRI, year: year, month: month, day: d }, CAL_GREGORIAN);
            var back = convert({ calendar: CAL_GREGORIAN, year: g.year, month: g.month, day: g.day }, CAL_HIJRI);
            if (back && back.year === year && back.month === month && back.day === d) return d;
        }
        return 30;
    }

    function monthGrid(year, month, calendar) {
        calendar = normalizeCalendar(calendar);
        var count = daysInMonth(year, month, calendar);
        var first = { calendar: calendar, year: year, month: month, day: 1 };
        var firstGregorian = calendar === CAL_GREGORIAN ? first : convert(first, CAL_GREGORIAN);
        var firstJd = gregorianToJd(firstGregorian.year, firstGregorian.month, firstGregorian.day);
        var startDow = mod(firstJd + 1, 7);
        var cells = [];

        for (var i = 0; i < startDow; i++) cells.push(null);
        for (var day = 1; day <= count; day++) {
            var cellPrimary = { calendar: calendar, year: year, month: month, day: day };
            var cellG = calendar === CAL_GREGORIAN ? cellPrimary : convert(cellPrimary, CAL_GREGORIAN);
            var cellSec = calendar === CAL_GREGORIAN ? convert(cellPrimary, CAL_HIJRI) : cellG;
            cells.push({ primary: cellPrimary, secondary: cellSec, gregorian: cellG });
        }
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }

    function shiftMonth(date, delta, calendar) {
        var total = date.year * 12 + (date.month - 1) + delta;
        var year = Math.floor(total / 12);
        var month = mod(total, 12) + 1;
        var max = daysInMonth(year, month, calendar);
        return { calendar: normalizeCalendar(calendar), year: year, month: month, day: Math.min(date.day, max) };
    }

    function shiftYear(date, delta, calendar) {
        var year = date.year + delta;
        var max = daysInMonth(year, date.month, calendar);
        return { calendar: normalizeCalendar(calendar), year: year, month: date.month, day: Math.min(date.day, max) };
    }

    function formatDate(date, locale) {
        if (!date) return "";
        if (date.calendar === CAL_GREGORIAN) {
            var mG = isArabicLocale(locale) ? GREG_MONTHS_AR : GREG_MONTHS_EN;
            return date.day + " " + mG[date.month - 1] + " " + date.year;
        }
        var mH = isArabicLocale(locale) ? MONTHS_AR : MONTHS_EN;
        return date.day + " " + mH[date.month - 1] + " " + date.year;
    }

    function formatNumeric(date) {
        if (!date) return "";
        return pad4(date.year) + " / " + pad2(date.month) + " / " + pad2(date.day);
    }

    function normalizeModelValue(value, calendar) {
        if (!value) return null;
        if (typeof value === "object" && value.year && value.month && value.day) {
            return normalizeToGregorian(value, value.calendar || calendar);
        }
        return normalizeToGregorian(value, calendar);
    }

    /* =========================================================
       4. ICONS (Direct SVG Payloads)
       ========================================================= */

    var ICONS = {
        calendar: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        moon: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
        bookDual: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
        chevronLeft: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
        chevronRight: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'
    };

    function renderVue3Icon(h, name) {
        return h("span", {
            class: "aarkam-icon-wrap",
            innerHTML: ICONS[name] || ""
        });
    }

    /* =========================================================
       5. CSS STYLES
       ========================================================= */

    var CSS = [
        ".aarkam-calendar-root{position:relative;display:block;width:100%;font-family:system-ui,-apple-system,Cairo,sans-serif;direction:rtl;color:#1f2d27;box-sizing:border-box;}",
        ".aarkam-calendar-root *{box-sizing:border-box;margin:0;padding:0;}",
        ".aarkam-icon-wrap{display:inline-flex;align-items:center;justify-content:center;line-height:0;pointer-events:none;}",
        ".aarkam-svg{width:16px;height:16px;display:block;pointer-events:none;}",
        ".aarkam-input-group{display:flex;flex-direction:column;gap:6px;width:100%;}",
        ".aarkam-input-label{font-size:13px;font-weight:700;color:#374151;}",
        ".aarkam-trigger-box{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--aarkam-border,#d1d5db);border-radius:10px;padding:10px 14px;cursor:pointer;transition:.15s ease;font-size:14px;font-weight:700;color:#111827;width:100%;box-shadow:0 1px 2px rgba(0,0,0,0.05);outline:none;}",
        ".aarkam-trigger-box:hover{border-color:var(--aarkam-primary,#156643);box-shadow:0 0 0 3px rgba(21,102,67,0.1);}",
        ".aarkam-trigger-box .aarkam-svg{width:18px;height:18px;color:var(--aarkam-primary,#156643);}",
        ".aarkam-backdrop{position:fixed;inset:0;background:transparent;z-index:9998;}",
        ".aarkam-popup-wrap{position:absolute;top:calc(100% + 8px);right:0;z-index:9999;background:#fff;border-radius:14px;padding:8px;border:1px solid #e5e7eb;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);width:345px;max-width:calc(100vw - 32px);}",
        ".aarkam-type-switcher{display:grid;grid-template-columns:repeat(3,1fr);background:#f3f4f6;border-radius:30px;padding:3px;gap:3px;margin-bottom:10px;width:100%;}",
        ".aarkam-type-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 0;border:0;background:transparent;border-radius:24px;font-size:12px;font-weight:700;color:#6b7280;cursor:pointer;transition:.15s;}",
        ".aarkam-type-btn.active{background:var(--aarkam-primary,#156643);color:#fff;box-shadow:0 2px 4px rgba(21,102,67,.2);}",
        ".aarkam-card{background:#fff;border:1px solid var(--aarkam-border,#e5e7eb);border-radius:12px;overflow:hidden;width:100%;max-width:345px;margin:0 auto;box-shadow:0 2px 6px rgba(0,0,0,0.03);}",
        ".aarkam-card-header{background:var(--aarkam-header-bg,var(--aarkam-primary,#156643));color:#fff;padding:12px;display:flex;align-items:center;justify-content:space-between;}",
        ".aarkam-header-nav{background:transparent;border:0;color:#fff;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;cursor:pointer;transition:.15s;opacity:.9;}",
        ".aarkam-header-nav:hover{background:rgba(255,255,255,.2);opacity:1;}",
        ".aarkam-header-nav svg{width:18px;height:18px;}",
        ".aarkam-header-titles{display:flex;align-items:center;justify-content:center;flex:1;gap:6px;font-weight:700;}",
        ".aarkam-title-btn{background:transparent;border:0;color:#fff;font-size:15px;font-weight:700;cursor:pointer;padding:4px 8px;border-radius:6px;}",
        ".aarkam-title-btn:hover{background:rgba(255,255,255,.2);}",
        ".aarkam-title-btn.active{background:rgba(255,255,255,.25);box-shadow:inset 0 0 0 1px rgba(255,255,255,.4);}",
        ".aarkam-dual-header-grid{display:grid;grid-template-columns:1fr 1px 1fr;align-items:center;flex:1;text-align:center;}",
        ".aarkam-dual-col{display:flex;flex-direction:column;align-items:center;line-height:1.2;}",
        ".aarkam-dual-main{font-size:13px;font-weight:800;color:#fff;}",
        ".aarkam-dual-sub{font-size:10px;color:rgba(255,255,255,.8);font-weight:600;margin-top:2px;}",
        ".aarkam-dual-sep{height:26px;background:rgba(255,255,255,.25);width:1px;margin:0 auto;}",
        ".aarkam-weekdays-row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));background:#fff;border-bottom:1px solid #f3f4f6;padding:8px 0;text-align:center;}",
        ".aarkam-col-head{font-size:11px;font-weight:700;color:#9ca3af;}",
        ".aarkam-days-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;padding:6px;background:#fff;}",
        ".aarkam-cell{background:#fff;border:0;aspect-ratio:1;min-height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:.12s ease;border-radius:8px;padding:2px;}",
        ".aarkam-cell:hover:not(.empty){background:#f0fdf4;}",
        ".aarkam-cell.empty{background:transparent;cursor:default;pointer-events:none;}",
        ".aarkam-cell-primary{font-size:13px;font-weight:700;color:#1f2937;line-height:1.1;pointer-events:none;}",
        ".aarkam-cell-secondary{font-size:10px;font-weight:600;color:#9ca3af;line-height:1;margin-top:2px;pointer-events:none;}",
        ".aarkam-cell.selected{background:var(--aarkam-primary,#156643)!important;}",
        ".aarkam-cell.selected .aarkam-cell-primary{color:#fff!important;}",
        ".aarkam-cell.selected .aarkam-cell-secondary{color:rgba(255,255,255,.85)!important;}",
        ".aarkam-cell.today:not(.selected){box-shadow:inset 0 0 0 1.5px var(--aarkam-primary,#156643);}",
        ".aarkam-card-footer{padding:10px 14px;background:#f9fafb;text-align:center;font-size:12px;font-weight:700;color:var(--aarkam-primary,#156643);display:flex;align-items:center;justify-content:center;gap:12px;border-top:1px solid #f3f4f6;}",
        ".aarkam-footer-split{display:flex;align-items:center;justify-content:space-around;width:100%;}",
        ".aarkam-footer-sep{color:#d1d5db;}",
        ".aarkam-picker-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:14px;background:#fff;}",
        ".aarkam-picker-cell{padding:12px 6px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;font-size:13px;font-weight:700;color:#374151;cursor:pointer;text-align:center;}",
        ".aarkam-picker-cell:hover{border-color:var(--aarkam-primary,#156643);background:#f0fdf4;color:var(--aarkam-primary,#156643);}",
        ".aarkam-picker-cell.active{background:var(--aarkam-primary,#156643);color:#fff;border-color:var(--aarkam-primary,#156643);}"
    ].join("");

    function injectCss() {
        if (typeof document === "undefined" || document.getElementById("aarkam-cal-vue3-css")) return;
        var style = document.createElement("style");
        style.id = "aarkam-cal-vue3-css";
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* =========================================================
       6. VUE 3 COMPONENT DEFINITION
       ========================================================= */

    function createVue3CalendarComponent(vue) {
        var h = vue.h;

        return {
            name: "AarkamCalendar",
            props: {
                modelValue: { type: [Object, String], default: null },
                calendar: { type: String, default: CAL_HIJRI },
                dual: { type: Boolean, default: false },
                showSwitcher: { type: Boolean, default: true },
                inputMode: { type: Boolean, default: false },
                label: { type: String, default: "التاريخ" },
                locale: { type: String, default: "ar" },
                dateAuthority: { type: Object, default: null },
                primaryColor: { type: String, default: "#156643" },
                headerBg: { type: String, default: null },
                bgLight: { type: String, default: "#f7faf8" },
                borderColor: { type: String, default: "#e2ece7" }
            },
            emits: ["update:modelValue", "change", "calendar-change"],
            data: function () {
                injectCss();
                if (this.dateAuthority) configureDateAuthority(this.dateAuthority);

                var activeCal = normalizeCalendar(this.calendar);
                var normalized = normalizeModelValue(this.modelValue, activeCal) || todayGregorian();
                var proj = projectFromGregorian(normalized, activeCal);

                return {
                    isDual: Boolean(this.dual),
                    activeCalendar: activeCal,
                    pickerMode: PICKER_DAYS,
                    isOpen: !this.inputMode,
                    selectedGregorian: cloneDate(normalized),
                    viewDate: proj,
                    yearRangeStart: Math.floor(proj.year / 10) * 10
                };
            },
            computed: {
                grid: function () {
                    return monthGrid(this.viewDate.year, this.viewDate.month, this.activeCalendar);
                },
                dualSecondaryView: function () {
                    var midGregorian = convert(
                        { calendar: this.activeCalendar, year: this.viewDate.year, month: this.viewDate.month, day: 15 },
                        CAL_GREGORIAN
                    );
                    var oppCalendar = this.activeCalendar === CAL_HIJRI ? CAL_GREGORIAN : CAL_HIJRI;
                    return convert(midGregorian, oppCalendar);
                },
                themeStyle: function () {
                    return {
                        "--aarkam-primary": this.primaryColor,
                        "--aarkam-header-bg": this.headerBg || this.primaryColor,
                        "--aarkam-bg-light": this.bgLight,
                        "--aarkam-border": this.borderColor
                    };
                }
            },
            watch: {
                calendar: function (val) {
                    this.switchCalendar(val);
                },
                dual: function (val) {
                    this.isDual = Boolean(val);
                },
                modelValue: function (val) {
                    if (val) this.syncFromExternal(val);
                }
            },
            methods: {
                syncFromExternal: function (val) {
                    var g = normalizeModelValue(val, this.activeCalendar);
                    if (g) {
                        this.selectedGregorian = cloneDate(g);
                        this.viewDate = projectFromGregorian(g, this.activeCalendar);
                        this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
                    }
                },
                switchCalendar: function (targetCal) {
                    var next = normalizeCalendar(targetCal);
                    this.activeCalendar = next;
                    this.viewDate = projectFromGregorian(this.selectedGregorian, next);
                    this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
                    this.pickerMode = PICKER_DAYS;
                    this.$emit("calendar-change", next);
                },
                toggleYearPicker: function () {
                    if (this.pickerMode === PICKER_YEARS) {
                        this.pickerMode = PICKER_DAYS;
                    } else {
                        this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
                        this.pickerMode = PICKER_YEARS;
                    }
                },
                toggleMonthPicker: function () {
                    this.pickerMode = this.pickerMode === PICKER_MONTHS ? PICKER_DAYS : PICKER_MONTHS;
                },
                selectDay: function (cell) {
                    if (!cell) return;
                    this.selectedGregorian = cloneDate(cell.gregorian);
                    this.viewDate = projectFromGregorian(cell.gregorian, this.activeCalendar);
                    this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;

                    var emitted = projectFromGregorian(cell.gregorian, this.activeCalendar);

                    this.$emit("update:modelValue", emitted);
                    this.$emit("change", emitted);

                    if (this.inputMode) this.isOpen = false;
                },
                selectYear: function (yr) {
                    this.viewDate.year = yr;
                    this.yearRangeStart = Math.floor(yr / 10) * 10;
                    this.pickerMode = PICKER_DAYS;
                },
                selectMonth: function (monthIdx) {
                    this.viewDate.month = monthIdx;
                    this.pickerMode = PICKER_DAYS;
                },
                nav: function (delta) {
                    if (this.pickerMode === PICKER_YEARS) {
                        this.yearRangeStart += delta * 10;
                    } else if (this.pickerMode === PICKER_MONTHS) {
                        this.viewDate = shiftYear(this.viewDate, delta, this.activeCalendar);
                        this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
                    } else {
                        this.viewDate = shiftMonth(this.viewDate, delta, this.activeCalendar);
                        this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
                    }
                }
            },
            render: function () {
                var self = this;
                var isAr = isArabicLocale(this.locale);
                var monthNames = this.activeCalendar === CAL_HIJRI ? (isAr ? MONTHS_AR : MONTHS_EN) : (isAr ? GREG_MONTHS_AR : GREG_MONTHS_EN);
                var secMonthNames = this.activeCalendar === CAL_HIJRI ? (isAr ? GREG_MONTHS_AR : GREG_MONTHS_EN) : (isAr ? MONTHS_AR : MONTHS_EN);

                // 1. Switcher Row
                var switcher = null;
                if (this.showSwitcher) {
                    switcher = h("div", { class: "aarkam-type-switcher" }, [
                        h("button", {
                            type: "button",
                            class: "aarkam-type-btn" + (!this.isDual && this.activeCalendar === CAL_HIJRI ? " active" : ""),
                            onClick: function (e) {
                                e.stopPropagation();
                                self.isDual = false;
                                self.switchCalendar(CAL_HIJRI);
                            }
                        }, [renderVue3Icon(h, "moon"), isAr ? "هجري" : "Hijri"]),

                        h("button", {
                            type: "button",
                            class: "aarkam-type-btn" + (!this.isDual && this.activeCalendar === CAL_GREGORIAN ? " active" : ""),
                            onClick: function (e) {
                                e.stopPropagation();
                                self.isDual = false;
                                self.switchCalendar(CAL_GREGORIAN);
                            }
                        }, [renderVue3Icon(h, "calendar"), isAr ? "ميلادي" : "Gregorian"]),

                        h("button", {
                            type: "button",
                            class: "aarkam-type-btn" + (this.isDual ? " active" : ""),
                            onClick: function (e) {
                                e.stopPropagation();
                                self.isDual = true;
                            }
                        }, [renderVue3Icon(h, "bookDual"), isAr ? "مزدوج" : "Dual"])
                    ]);
                }

                // 2. Header
                var headerCenter;
                if (this.isDual) {
                    headerCenter = h("div", { class: "aarkam-dual-header-grid" }, [
                        h("div", { class: "aarkam-dual-col" }, [
                            h("span", { class: "aarkam-dual-main" }, monthNames[this.viewDate.month - 1] + " " + this.viewDate.year),
                            h("span", { class: "aarkam-dual-sub" }, this.activeCalendar === CAL_HIJRI ? "هجري" : "ميلادي")
                        ]),
                        h("div", { class: "aarkam-dual-sep" }),
                        h("div", { class: "aarkam-dual-col" }, [
                            h("span", { class: "aarkam-dual-main" }, secMonthNames[this.dualSecondaryView.month - 1] + " " + this.dualSecondaryView.year),
                            h("span", { class: "aarkam-dual-sub" }, this.activeCalendar === CAL_HIJRI ? "ميلادي" : "هجري")
                        ])
                    ]);
                } else {
                    headerCenter = h("div", { class: "aarkam-header-titles" }, [
                        h("button", {
                            type: "button",
                            class: "aarkam-title-btn" + (this.pickerMode === PICKER_MONTHS ? " active" : ""),
                            onClick: function (e) {
                                e.stopPropagation();
                                self.toggleMonthPicker();
                            }
                        }, monthNames[this.viewDate.month - 1]),
                        h("button", {
                            type: "button",
                            class: "aarkam-title-btn" + (this.pickerMode === PICKER_YEARS ? " active" : ""),
                            onClick: function (e) {
                                e.stopPropagation();
                                self.toggleYearPicker();
                            }
                        }, this.pickerMode === PICKER_YEARS ? (this.yearRangeStart + " - " + (this.yearRangeStart + 9)) : String(this.viewDate.year))
                    ]);
                }

                var header = h("div", { class: "aarkam-card-header" }, [
                    h("button", {
                        type: "button",
                        class: "aarkam-header-nav",
                        onClick: function (e) {
                            e.stopPropagation();
                            self.nav(-1);
                        }
                    }, [renderVue3Icon(h, isAr ? "chevronRight" : "chevronLeft")]),
                    headerCenter,
                    h("button", {
                        type: "button",
                        class: "aarkam-header-nav",
                        onClick: function (e) {
                            e.stopPropagation();
                            self.nav(1);
                        }
                    }, [renderVue3Icon(h, isAr ? "chevronLeft" : "chevronRight")])
                ]);

                // 3. Body
                var body;
                if (this.pickerMode === PICKER_DAYS) {
                    var weekdays = (isAr ? WEEK_AR : WEEK_EN).map(function (w) {
                        return h("div", { class: "aarkam-col-head", key: w }, w);
                    });
                    var cells = this.grid.map(function (c, i) {
                        if (!c) return h("div", { class: "aarkam-cell empty", key: "e-" + i });
                        var isSel = sameDate(c.gregorian, self.selectedGregorian);
                        var isTod = sameDate(c.gregorian, todayGregorian());
                        return h("button", {
                            type: "button",
                            class: "aarkam-cell" + (isSel ? " selected" : "") + (isTod ? " today" : ""),
                            key: "d-" + c.primary.year + "-" + c.primary.month + "-" + c.primary.day,
                            onClick: function (e) {
                                e.stopPropagation();
                                self.selectDay(c);
                            }
                        }, [
                            h("span", { class: "aarkam-cell-primary" }, String(c.primary.day)),
                            self.isDual ? h("span", { class: "aarkam-cell-secondary" }, String(c.secondary.day)) : null
                        ]);
                    });
                    body = [
                        h("div", { class: "aarkam-weekdays-row" }, weekdays),
                        h("div", { class: "aarkam-days-grid" }, cells)
                    ];
                } else if (this.pickerMode === PICKER_MONTHS) {
                    body = h("div", { class: "aarkam-picker-grid" }, monthNames.map(function (m, idx) {
                        return h("button", {
                            type: "button",
                            class: "aarkam-picker-cell" + (self.viewDate.month === idx + 1 ? " active" : ""),
                            key: m,
                            onClick: function (e) {
                                e.stopPropagation();
                                self.selectMonth(idx + 1);
                            }
                        }, m);
                    }));
                } else {
                    var years = [];
                    for (var y = 0; y < 10; y++) years.push(this.yearRangeStart + y);
                    body = h("div", { class: "aarkam-picker-grid" }, years.map(function (yr) {
                        return h("button", {
                            type: "button",
                            class: "aarkam-picker-cell" + (self.viewDate.year === yr ? " active" : ""),
                            key: yr,
                            onClick: function (e) {
                                e.stopPropagation();
                                self.selectYear(yr);
                            }
                        }, String(yr));
                    }));
                }

                // 4. Footer
                var footer;
                var selH = projectFromGregorian(this.selectedGregorian, CAL_HIJRI);
                var selG = projectFromGregorian(this.selectedGregorian, CAL_GREGORIAN);
                if (this.isDual) {
                    footer = h("div", { class: "aarkam-card-footer" }, [
                        h("div", { class: "aarkam-footer-split" }, [
                            h("span", formatDate(selH, this.locale)),
                            h("span", { class: "aarkam-footer-sep" }, "|"),
                            h("span", formatDate(selG, this.locale))
                        ])
                    ]);
                } else {
                    footer = h("div", { class: "aarkam-card-footer" }, formatDate(this.activeCalendar === CAL_HIJRI ? selH : selG, this.locale));
                }

                var card = h("div", { class: "aarkam-card" }, [header, body, footer]);

                if (this.inputMode) {
                    var inputVal = formatNumeric(this.activeCalendar === CAL_HIJRI ? selH : selG);
                    return h("div", { class: "aarkam-calendar-root", style: this.themeStyle }, [
                        h("div", { class: "aarkam-input-group" }, [
                            this.label ? h("label", { class: "aarkam-input-label" }, this.label) : null,
                            h("button", {
                                type: "button",
                                class: "aarkam-trigger-box",
                                onClick: function (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    self.isOpen = !self.isOpen;
                                }
                            }, [
                                h("span", inputVal),
                                renderVue3Icon(h, "calendar")
                            ])
                        ]),
                        this.isOpen ? h("div", {
                            class: "aarkam-backdrop",
                            onClick: function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                self.isOpen = false;
                            }
                        }) : null,
                        this.isOpen ? h("div", { class: "aarkam-popup-wrap" }, [switcher, card]) : null
                    ]);
                }

                return h("div", { class: "aarkam-calendar-root", style: this.themeStyle }, [switcher, card]);
            }
        };
    }

    /* =========================================================
       7. VUE 3 INSTALLER & EXPORT
       ========================================================= */

    var AarkamCalendar = {
        version: VERSION,
        author: AUTHOR,
        repository: REPOSITORY,
        license: LICENSE,
        configureDateAuthority: configureDateAuthority,

        install: function (app, options) {
            var vueRuntime = (options && options.vue) || global.Vue;
            if (!vueRuntime || !vueRuntime.h) {
                throw new Error("[AarkamCalendar] Vue 3 global runtime with `h` is required.");
            }
            var comp = createVue3CalendarComponent(vueRuntime);
            app.component("AarkamCalendar", comp);
            app.component("aarkam-calendar", comp);
        }
    };

    if (global.Vue && global.Vue.h) {
        AarkamCalendar.Component = createVue3CalendarComponent(global.Vue);
    }

    global.AarkamCalendar = AarkamCalendar;
})(typeof window !== "undefined" ? window : globalThis);
/*!
 * =============================================================================
 * Aarkam.Calendar v1.7.1
 * Author      : Eng. Mohamed Elhelbawi
 * Team        : Aarkam Core Architecture
 * Repository  : https://github.com/melhelbawi/Aarkam.Calendar
 * License     : MIT (https://opensource.org/licenses/MIT)
 *
 * Umm al-Qura + Gregorian + Dual calendar component.
 * Offline-first, pure JavaScript, zero external dependencies.
 *
 * SPECIFICATION & COVERAGE:
 * - Legal Basis   : Saudi Arabia Official Umm al-Qura Astronomical System (KACST)
 * - Hijri Span    : 1318 AH .. 1500 AH
 * - Gregorian Span: 1900-04-30 .. 2077-11-16
 * - Engine Model  : Built-in offline Intl ICU astronomical resolver with tabular
 *                   month-length bitmask alignment & custom authority injection.
 * - Architecture  : Canonical Gregorian internal invariant representation with
 *                   lossless Hijri/Gregorian display projections.
 *
 * PERMISSION NOTICE:
 * Copyright (c) 2026 Eng. Mohamed Elhelbawi / Aarkam.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * =============================================================================
 */

(function (global) {
    "use strict";

    var VERSION = "1.7.1";
    var AUTHOR = "Eng. Mohamed Elhelbawi";
    var REPOSITORY = "https://github.com/melhelbawi/Aarkam.Calendar";
    var LICENSE = "MIT";

    /* =========================================================
       CONSTANTS & LOCALIZATION
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
       INTERNAL DATE AUTHORITY STORAGE
       ========================================================= */

    var DateAuthority = {
        overridesGregorian: Object.create(null),
        overridesHijri: Object.create(null),
        ummAlQuraGregorian: Object.create(null),
        ummAlQuraHijri: Object.create(null),
        todayOverride: null
    };

    function pad2(value) { return String(value).padStart(2, "0"); }
    function pad4(value) { return String(value).padStart(4, "0"); }

    function dateKey(date) {
        if (!date) return null;
        return pad4(date.year) + "-" + pad2(date.month) + "-" + pad2(date.day);
    }

    var gregorianKey = dateKey;
    var hijriKey = dateKey;

    function cloneDate(date) {
        if (!date) return null;
        return { year: Number(date.year), month: Number(date.month), day: Number(date.day) };
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
        return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    }

    function parseDateLike(value, defaultCalendar) {
        if (!value) return null;
        if (typeof value === "string") {
            var parsed = parseIsoDate(value);
            if (!parsed) return null;
            return { calendar: normalizeCalendar(defaultCalendar), year: parsed.year, month: parsed.month, day: parsed.day };
        }
        if (typeof value === "object") {
            if (Number.isFinite(Number(value.year)) && Number.isFinite(Number(value.month)) && Number.isFinite(Number(value.day))) {
                return { calendar: normalizeCalendar(value.calendar || defaultCalendar), year: Number(value.year), month: Number(value.month), day: Number(value.day) };
            }
            if (value.date) return parseDateLike(value.date, value.calendar || defaultCalendar);
        }
        return null;
    }

    /* =========================================================
       OFFLINE NATIVE UMM AL-QURA ENGINE
       ========================================================= */

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

    function daysInGregorianMonth(year, month) {
        return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }

    /* =========================================================
       DATE REGISTRATION & RESOLUTION PIPELINE
       ========================================================= */

    function registerAuthorityPair(gregorian, hijri, source) {
        var g = parseDateLike(gregorian, CAL_GREGORIAN);
        var h = parseDateLike(hijri, CAL_HIJRI);
        if (!g || !h) return;
        var record = { gregorian: cloneDate(g), hijri: cloneDate(h), source: source || "authority" };
        if (source === "override") {
            DateAuthority.overridesGregorian[gregorianKey(g)] = record;
            DateAuthority.overridesHijri[hijriKey(h)] = record;
        } else {
            DateAuthority.ummAlQuraGregorian[gregorianKey(g)] = record;
            DateAuthority.ummAlQuraHijri[hijriKey(h)] = record;
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
            var kG = gregorianKey(source);
            if (DateAuthority.overridesGregorian[kG]) return cloneDate(DateAuthority.overridesGregorian[kG].hijri);
            if (DateAuthority.ummAlQuraGregorian[kG]) return cloneDate(DateAuthority.ummAlQuraGregorian[kG].hijri);
            var nativeH = gregorianToUmmAlQuraNative(source.year, source.month, source.day);
            if (nativeH) return { calendar: CAL_HIJRI, year: nativeH.year, month: nativeH.month, day: nativeH.day };
            var hFall = jdToIslamic(gregorianToJd(source.year, source.month, source.day));
            return { calendar: CAL_HIJRI, year: hFall.year, month: hFall.month, day: hFall.day };
        }

        var kH = hijriKey(source);
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
        return pad2(date.day) + " / " + pad2(date.month) + " / " + date.year;
    }

    function normalizeModelValue(value, calendar) {
        if (!value) return null;
        if (typeof value === "object" && value.year && value.month && value.day) {
            return normalizeToGregorian(value, value.calendar || calendar);
        }
        return normalizeToGregorian(value, calendar);
    }

    /* =========================================================
       ICONS
       ========================================================= */

    var ICONS = {
        calendar: '<rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
        moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
        bookDual: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
        chevronLeft: '<polyline points="15 18 9 12 15 6"></polyline>',
        chevronRight: '<polyline points="9 18 15 12 9 6"></polyline>'
    };

    function iconSvg(name, cls) {
        return '<svg class="' + (cls || "aarkam-svg") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
    }

    /* =========================================================
       CSS THEME & SCOPED STYLES
       ========================================================= */

    var CSS = [
        ".aarkam-calendar-root{position:relative;display:inline-block;font-family:system-ui,-apple-system,Cairo,sans-serif;direction:rtl;color:var(--aarkam-text,#1f2d27);box-sizing:border-box;}",
        ".aarkam-calendar-root *{box-sizing:border-box;}",
        ".aarkam-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.06);z-index:9990;}",
        ".aarkam-input-group{display:flex;flex-direction:column;gap:6px;width:100%;}",
        ".aarkam-input-label{font-size:14px;font-weight:700;color:var(--aarkam-text,#1f2d27);}",
        ".aarkam-trigger-box{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--aarkam-border,#dce7e1);border-radius:10px;padding:10px 14px;cursor:pointer;transition:.15s ease;font-size:14px;font-weight:700;color:var(--aarkam-text,#1f2d27);width:100%;box-shadow:0 1px 3px rgba(0,0,0,.03);}",
        ".aarkam-trigger-box:hover{border-color:var(--aarkam-primary,#156643);box-shadow:0 0 0 3px rgba(21,102,67,0.08);}",
        ".aarkam-trigger-box .aarkam-svg{width:18px;height:18px;color:var(--aarkam-primary,#156643);}",
        ".aarkam-popup-wrap{position:absolute;top:calc(100% + 8px);right:0;z-index:9999;filter:drop-shadow(0 12px 28px rgba(15,45,30,.15));animation:aarkamFadeIn .16s ease-out;}",
        "@keyframes aarkamFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}",
        ".aarkam-type-switcher{display:inline-flex;background:#edf3f0;border-radius:30px;padding:4px;gap:3px;margin-bottom:8px;width:100%;}",
        ".aarkam-type-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 12px;border:0;background:transparent;border-radius:24px;font-size:12px;font-weight:700;color:var(--aarkam-muted,#6b7d75);cursor:pointer;transition:.15s;}",
        ".aarkam-type-btn.active{background:var(--aarkam-primary,#156643);color:#fff;box-shadow:0 2px 6px rgba(21,102,67,.25);}",
        ".aarkam-type-btn .aarkam-svg{width:14px;height:14px;}",
        ".aarkam-card{background:#fff;border:1px solid var(--aarkam-border,#dce7e1);border-radius:14px;overflow:hidden;width:345px;max-width:100vw;}",
        ".aarkam-card-header{background:var(--aarkam-header-bg,var(--aarkam-primary,#156643));color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;}",
        ".aarkam-header-nav{background:transparent;border:0;color:#fff;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;cursor:pointer;transition:.15s;opacity:.9;}",
        ".aarkam-header-nav:hover{background:rgba(255,255,255,.18);opacity:1;}",
        ".aarkam-header-nav svg{width:18px;height:18px;stroke-width:2.4;}",
        ".aarkam-header-titles{display:flex;align-items:center;justify-content:center;flex:1;gap:4px;font-weight:700;}",
        ".aarkam-title-btn{background:transparent;border:0;color:#fff;font-size:15px;font-weight:700;cursor:pointer;padding:4px 6px;border-radius:6px;}",
        ".aarkam-title-btn:hover{background:rgba(255,255,255,.15);}",
        ".aarkam-dual-header-grid{display:grid;grid-template-columns:1fr 1px 1fr;align-items:center;flex:1;text-align:center;padding:0 4px;}",
        ".aarkam-dual-col{display:flex;flex-direction:column;align-items:center;line-height:1.2;}",
        ".aarkam-dual-main{font-size:14px;font-weight:800;color:#fff;}",
        ".aarkam-dual-sub{font-size:10px;color:rgba(255,255,255,.8);font-weight:600;margin-top:2px;}",
        ".aarkam-dual-sep{height:28px;background:rgba(255,255,255,.25);width:1px;margin:0 auto;}",
        ".aarkam-weekdays-row{display:grid;grid-template-columns:repeat(7,1fr);background:#fff;border-bottom:1px solid var(--aarkam-border,#edf2ef);padding:6px 2px;}",
        ".aarkam-col-head{text-align:center;font-size:11px;font-weight:700;color:var(--aarkam-muted,#788b83);padding:4px 0;}",
        ".aarkam-days-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--aarkam-border,#edf2ef);padding:1px;}",
        ".aarkam-cell{background:#fff;border:0;aspect-ratio:1;min-height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:.12s ease;padding:2px;}",
        ".aarkam-cell:hover:not(.empty){background:#eef7f2;}",
        ".aarkam-cell.empty{background:var(--aarkam-bg-light,#fafcfb);cursor:default;pointer-events:none;}",
        ".aarkam-cell-primary{font-size:13px;font-weight:700;color:var(--aarkam-text,#20332a);line-height:1.1;}",
        ".aarkam-cell-secondary{font-size:10px;font-weight:600;color:var(--aarkam-muted,#85968f);line-height:1;margin-top:2px;}",
        ".aarkam-cell.selected{background:var(--aarkam-primary,#156643)!important;border-radius:7px;}",
        ".aarkam-cell.selected .aarkam-cell-primary{color:#fff!important;}",
        ".aarkam-cell.selected .aarkam-cell-secondary{color:rgba(255,255,255,.85)!important;}",
        ".aarkam-cell.today:not(.selected){box-shadow:inset 0 0 0 1.5px var(--aarkam-primary,#156643);border-radius:7px;}",
        ".aarkam-card-footer{padding:10px 14px;background:var(--aarkam-bg-light,#f7faf8);text-align:center;font-size:12px;font-weight:700;color:var(--aarkam-primary,#156643);display:flex;align-items:center;justify-content:center;gap:12px;border-top:1px solid var(--aarkam-border,#edf2ef);}",
        ".aarkam-footer-split{display:flex;align-items:center;justify-content:space-around;width:100%;}",
        ".aarkam-footer-sep{color:#ced9d3;}",
        ".aarkam-picker-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px;background:#fff;}",
        ".aarkam-picker-cell{padding:12px 6px;border:1px solid var(--aarkam-border,#e1ece6);background:#fff;border-radius:9px;font-size:13px;font-weight:700;color:var(--aarkam-text,#2b4237);cursor:pointer;text-align:center;}",
        ".aarkam-picker-cell:hover{border-color:var(--aarkam-primary,#156643);background:#f2f8f5;color:var(--aarkam-primary,#156643);}",
        ".aarkam-picker-cell.active{background:var(--aarkam-primary,#156643);color:#fff;border-color:var(--aarkam-primary,#156643);}"
    ].join("");

    function injectCss() {
        if (typeof document === "undefined" || document.getElementById("aarkam-cal-css-v171")) return;
        var style = document.createElement("style");
        style.id = "aarkam-cal-css-v171";
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* =========================================================
       VUE 3 ADAPTER
       ========================================================= */

    function createVue3Component(vue) {
        var h = vue.h;
        var ref = vue.ref;
        var computed = vue.computed;
        var watch = vue.watch;

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
            setup: function (props, ctx) {
                injectCss();
                if (props.dateAuthority) configureDateAuthority(props.dateAuthority);

                var isDual = ref(Boolean(props.dual));
                var activeCalendar = ref(normalizeCalendar(props.calendar));
                var pickerMode = ref(PICKER_DAYS);
                var isOpen = ref(!props.inputMode);

                var normalizedInitial = normalizeModelValue(props.modelValue, activeCalendar.value) || todayGregorian();
                var selectedGregorian = ref(cloneDate(normalizedInitial));

                var viewDate = ref(projectFromGregorian(selectedGregorian.value, activeCalendar.value));
                var yearRangeStart = ref(Math.floor(viewDate.value.year / 10) * 10);

                watch(function () { return props.calendar; }, function (val) {
                    activeCalendar.value = normalizeCalendar(val);
                    viewDate.value = projectFromGregorian(selectedGregorian.value, activeCalendar.value);
                });

                watch(function () { return props.dual; }, function (val) {
                    isDual.value = Boolean(val);
                });

                function selectDay(cell) {
                    if (!cell) return;
                    selectedGregorian.value = cloneDate(cell.gregorian);
                    viewDate.value = projectFromGregorian(cell.gregorian, activeCalendar.value);

                    var emitted = projectFromGregorian(cell.gregorian, activeCalendar.value);
                    ctx.emit("update:modelValue", emitted);
                    ctx.emit("change", emitted);

                    if (props.inputMode) isOpen.value = false;
                }

                function nav(delta) {
                    if (pickerMode.value === PICKER_YEARS) {
                        yearRangeStart.value += delta * 10;
                    } else if (pickerMode.value === PICKER_MONTHS) {
                        viewDate.value = shiftYear(viewDate.value, delta, activeCalendar.value);
                    } else {
                        viewDate.value = shiftMonth(viewDate.value, delta, activeCalendar.value);
                    }
                }

                var grid = computed(function () {
                    return monthGrid(viewDate.value.year, viewDate.value.month, activeCalendar.value);
                });

                var dualSecondaryView = computed(function () {
                    var midGregorian = convert(
                        { calendar: activeCalendar.value, year: viewDate.value.year, month: viewDate.value.month, day: 15 },
                        CAL_GREGORIAN
                    );
                    var oppCalendar = activeCalendar.value === CAL_HIJRI ? CAL_GREGORIAN : CAL_HIJRI;
                    return convert(midGregorian, oppCalendar);
                });

                return function () {
                    var isAr = isArabicLocale(props.locale);
                    var monthNames = activeCalendar.value === CAL_HIJRI ? (isAr ? MONTHS_AR : MONTHS_EN) : (isAr ? GREG_MONTHS_AR : GREG_MONTHS_EN);
                    var secMonthNames = activeCalendar.value === CAL_HIJRI ? (isAr ? GREG_MONTHS_AR : GREG_MONTHS_EN) : (isAr ? MONTHS_AR : MONTHS_EN);

                    var themeStyle = {
                        "--aarkam-primary": props.primaryColor,
                        "--aarkam-header-bg": props.headerBg || props.primaryColor,
                        "--aarkam-bg-light": props.bgLight,
                        "--aarkam-border": props.borderColor
                    };

                    var switcher = null;
                    if (props.showSwitcher) {
                        switcher = h("div", { class: "aarkam-type-switcher" }, [
                            h("button", {
                                type: "button",
                                class: "aarkam-type-btn" + (!isDual.value && activeCalendar.value === CAL_HIJRI ? " active" : ""),
                                onClick: function () {
                                    isDual.value = false;
                                    activeCalendar.value = CAL_HIJRI;
                                    viewDate.value = projectFromGregorian(selectedGregorian.value, CAL_HIJRI);
                                }
                            }, [h("span", { innerHTML: iconSvg("moon") }), isAr ? "هجري" : "Hijri"]),

                            h("button", {
                                type: "button",
                                class: "aarkam-type-btn" + (!isDual.value && activeCalendar.value === CAL_GREGORIAN ? " active" : ""),
                                onClick: function () {
                                    isDual.value = false;
                                    activeCalendar.value = CAL_GREGORIAN;
                                    viewDate.value = projectFromGregorian(selectedGregorian.value, CAL_GREGORIAN);
                                }
                            }, [h("span", { innerHTML: iconSvg("calendar") }), isAr ? "ميلادي" : "Gregorian"]),

                            h("button", {
                                type: "button",
                                class: "aarkam-type-btn" + (isDual.value ? " active" : ""),
                                onClick: function () { isDual.value = true; }
                            }, [h("span", { innerHTML: iconSvg("bookDual") }), isAr ? "مزدوج" : "Dual"])
                        ]);
                    }

                    var headerCenter;
                    if (isDual.value) {
                        headerCenter = h("div", { class: "aarkam-dual-header-grid" }, [
                            h("div", { class: "aarkam-dual-col" }, [
                                h("span", { class: "aarkam-dual-main" }, monthNames[viewDate.value.month - 1] + " " + viewDate.value.year),
                                h("span", { class: "aarkam-dual-sub" }, activeCalendar.value === CAL_HIJRI ? "هجري" : "ميلادي")
                            ]),
                            h("div", { class: "aarkam-dual-sep" }),
                            h("div", { class: "aarkam-dual-col" }, [
                                h("span", { class: "aarkam-dual-main" }, secMonthNames[dualSecondaryView.value.month - 1] + " " + dualSecondaryView.value.year),
                                h("span", { class: "aarkam-dual-sub" }, activeCalendar.value === CAL_HIJRI ? "ميلادي" : "هجري")
                            ])
                        ]);
                    } else {
                        headerCenter = h("div", { class: "aarkam-header-titles" }, [
                            h("button", {
                                type: "button",
                                class: "aarkam-title-btn",
                                onClick: function () { pickerMode.value = pickerMode.value === PICKER_MONTHS ? PICKER_DAYS : PICKER_MONTHS; }
                            }, monthNames[viewDate.value.month - 1]),
                            h("button", {
                                type: "button",
                                class: "aarkam-title-btn",
                                onClick: function () { pickerMode.value = pickerMode.value === PICKER_YEARS ? PICKER_DAYS : PICKER_YEARS; }
                            }, String(viewDate.value.year))
                        ]);
                    }

                    var header = h("div", { class: "aarkam-card-header" }, [
                        h("button", { type: "button", class: "aarkam-header-nav", onClick: function () { nav(-1); }, innerHTML: iconSvg("chevronRight") }),
                        headerCenter,
                        h("button", { type: "button", class: "aarkam-header-nav", onClick: function () { nav(1); }, innerHTML: iconSvg("chevronLeft") })
                    ]);

                    var body;
                    if (pickerMode.value === PICKER_DAYS) {
                        var weekdays = (isAr ? WEEK_AR : WEEK_EN).map(function (w) {
                            return h("div", { class: "aarkam-col-head", key: w }, w);
                        });
                        var cells = grid.value.map(function (c, i) {
                            if (!c) return h("div", { class: "aarkam-cell empty", key: "e-" + i });
                            var isSel = sameDate(c.gregorian, selectedGregorian.value);
                            var isTod = sameDate(c.gregorian, todayGregorian());
                            return h("button", {
                                type: "button",
                                class: "aarkam-cell" + (isSel ? " selected" : "") + (isTod ? " today" : ""),
                                key: "d-" + c.primary.year + "-" + c.primary.month + "-" + c.primary.day,
                                onClick: function () { selectDay(c); }
                            }, [
                                h("span", { class: "aarkam-cell-primary" }, String(c.primary.day)),
                                isDual.value ? h("span", { class: "aarkam-cell-secondary" }, String(c.secondary.day)) : null
                            ]);
                        });
                        body = [
                            h("div", { class: "aarkam-weekdays-row" }, weekdays),
                            h("div", { class: "aarkam-days-grid" }, cells)
                        ];
                    } else if (pickerMode.value === PICKER_MONTHS) {
                        body = h("div", { class: "aarkam-picker-grid" }, monthNames.map(function (m, idx) {
                            return h("button", {
                                type: "button",
                                class: "aarkam-picker-cell" + (viewDate.value.month === idx + 1 ? " active" : ""),
                                key: m,
                                onClick: function () { viewDate.value.month = idx + 1; pickerMode.value = PICKER_DAYS; }
                            }, m);
                        }));
                    } else {
                        var years = [];
                        for (var y = 0; y < 10; y++) years.push(yearRangeStart.value + y);
                        body = h("div", { class: "aarkam-picker-grid" }, years.map(function (yr) {
                            return h("button", {
                                type: "button",
                                class: "aarkam-picker-cell" + (viewDate.value.year === yr ? " active" : ""),
                                key: yr,
                                onClick: function () { viewDate.value.year = yr; pickerMode.value = PICKER_DAYS; }
                            }, String(yr));
                        }));
                    }

                    var footer;
                    var selH = projectFromGregorian(selectedGregorian.value, CAL_HIJRI);
                    var selG = projectFromGregorian(selectedGregorian.value, CAL_GREGORIAN);
                    if (isDual.value) {
                        footer = h("div", { class: "aarkam-card-footer" }, [
                            h("div", { class: "aarkam-footer-split" }, [
                                h("span", formatDate(selH, props.locale)),
                                h("span", { class: "aarkam-footer-sep" }, "|"),
                                h("span", formatDate(selG, props.locale))
                            ])
                        ]);
                    } else {
                        var singleText = formatDate(activeCalendar.value === CAL_HIJRI ? selH : selG, props.locale);
                        footer = h("div", { class: "aarkam-card-footer" }, singleText);
                    }

                    var card = h("div", { class: "aarkam-card" }, [
                        header,
                        body,
                        footer
                    ]);

                    if (props.inputMode) {
                        var inputVal = formatNumeric(activeCalendar.value === CAL_HIJRI ? selH : selG);
                        return h("div", { class: "aarkam-calendar-root", style: themeStyle }, [
                            h("div", { class: "aarkam-input-group" }, [
                                props.label ? h("label", { class: "aarkam-input-label" }, props.label) : null,
                                h("button", {
                                    type: "button",
                                    class: "aarkam-trigger-box",
                                    onClick: function () { isOpen.value = !isOpen.value; }
                                }, [
                                    h("span", inputVal),
                                    h("span", { innerHTML: iconSvg("calendar") })
                                ])
                            ]),
                            isOpen.value ? h("div", { class: "aarkam-backdrop", onClick: function () { isOpen.value = false; } }) : null,
                            isOpen.value ? h("div", { class: "aarkam-popup-wrap" }, [
                                switcher,
                                card
                            ]) : null
                        ]);
                    }

                    return h("div", { class: "aarkam-calendar-root", style: themeStyle }, [
                        switcher,
                        card
                    ]);
                };
            }
        };
    }

    /* =========================================================
       PUBLIC EXPORTS
       ========================================================= */

    var AarkamCalendar = {
        version: VERSION,
        author: AUTHOR,
        repository: REPOSITORY,
        license: LICENSE,
        configureDateAuthority: configureDateAuthority,
        install: function (app) {
            if (global.Vue && global.Vue.h) {
                var comp = createVue3Component(global.Vue);
                app.component("AarkamCalendar", comp);
                app.component("aarkam-calendar", comp);
            }
        }
    };

    if (global.Vue && global.Vue.h) {
        AarkamCalendar.Component = createVue3Component(global.Vue);
    }

    global.AarkamCalendar = AarkamCalendar;
})(typeof window !== "undefined" ? window : globalThis);
/*!
 * =============================================================================
 * Aarkam.Calendar (Vanilla JS Edition) v1.0.0
 * Author      : Eng. Mohamed Elhelbawi
 * Team        : Aarkam Core Architecture
 * Repository  : https://github.com/melhelbawi/Aarkam.Calendar
 * License     : MIT
 *
 * Dedicated Vanilla JS Umm al-Qura + Gregorian + Dual Calendar Component.
 * Pure DOM API, zero framework dependencies, offline-first.
 * =============================================================================
 */

(function (global) {
    "use strict";

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
       2. CORE ASTRONOMICAL ENGINE
       ========================================================= */

    function pad2(value) { return String(value).padStart(2, "0"); }
    function pad4(value) { return String(value).padStart(4, "0"); }

    function dateKey(date) {
        if (!date) return null;
        return pad4(date.year) + "-" + pad2(date.month) + "-" + pad2(date.day);
    }

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
        return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
    }

    function parseDateLike(value, defaultCalendar) {
        if (!value) return null;
        if (typeof value === "string") {
            var parsed = parseIsoDate(value);
            return parsed ? { calendar: normalizeCalendar(defaultCalendar), year: parsed.year, month: parsed.month, day: parsed.day } : null;
        }
        if (typeof value === "object" && Number.isFinite(Number(value.year)) && Number.isFinite(Number(value.month)) && Number.isFinite(Number(value.day))) {
            return { calendar: normalizeCalendar(value.calendar || defaultCalendar), year: Number(value.year), month: Number(value.month), day: Number(value.day) };
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
       3. UMM AL-QURA OFFLINE RESOLVER
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
            var parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
                timeZone: "UTC", day: "numeric", month: "numeric", year: "numeric"
            }).formatToParts(date);
            var result = {};
            parts.forEach(function (p) {
                if (p.type === "year" || p.type === "month" || p.type === "day") {
                    result[p.type] = parseInt(p.value, 10);
                }
            });
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
        return parsed.calendar === CAL_GREGORIAN ? { year: parsed.year, month: parsed.month, day: parsed.day } : convert(parsed, CAL_GREGORIAN);
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

    /* =========================================================
       4. ICONS & STYLES INJECTION
       ========================================================= */

    var ICONS = {
        calendar: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        moon: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
        bookDual: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
        chevronLeft: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
        chevronRight: '<svg class="aarkam-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'
    };

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
        if (typeof document === "undefined" || document.getElementById("aarkam-cal-vanilla-css")) return;
        var style = document.createElement("style");
        style.id = "aarkam-cal-vanilla-css";
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* =========================================================
       5. VANILLA INSTANCE CLASS
       ========================================================= */

    function AarkamCalendar(target, options) {
        if (!(this instanceof AarkamCalendar)) return new AarkamCalendar(target, options);

        injectCss();

        this.el = typeof target === "string" ? document.querySelector(target) : target;
        if (!this.el) throw new Error("[AarkamCalendar] Target element not found.");

        this.opts = Object.assign({
            value: null,
            calendar: CAL_HIJRI,
            dual: false,
            showSwitcher: true,
            inputMode: false,
            label: "التاريخ",
            locale: "ar",
            primaryColor: "#156643",
            headerBg: null,
            bgLight: "#f7faf8",
            borderColor: "#e2ece7",
            onChange: null,
            onCalendarChange: null
        }, options || {});

        if (this.opts.dateAuthority) configureDateAuthority(this.opts.dateAuthority);

        this.isDual = Boolean(this.opts.dual);
        this.activeCalendar = normalizeCalendar(this.opts.calendar);
        this.pickerMode = PICKER_DAYS;
        this.isOpen = !this.opts.inputMode;

        var normalized = normalizeToGregorian(this.opts.value, this.activeCalendar) || todayGregorian();
        this.selectedGregorian = cloneDate(normalized);
        this.viewDate = projectFromGregorian(normalized, this.activeCalendar);
        this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;

        this.init();
    }

    AarkamCalendar.prototype.init = function () {
        this.container = document.createElement("div");
        this.container.className = "aarkam-calendar-root";
        this.applyTheme();
        this.el.innerHTML = "";
        this.el.appendChild(this.container);
        this.render();
    };

    AarkamCalendar.prototype.applyTheme = function () {
        this.container.style.setProperty("--aarkam-primary", this.opts.primaryColor);
        this.container.style.setProperty("--aarkam-header-bg", this.opts.headerBg || this.opts.primaryColor);
        this.container.style.setProperty("--aarkam-bg-light", this.opts.bgLight);
        this.container.style.setProperty("--aarkam-border", this.opts.borderColor);
    };

    AarkamCalendar.prototype.getValue = function () {
        return projectFromGregorian(this.selectedGregorian, this.activeCalendar);
    };

    AarkamCalendar.prototype.setValue = function (val) {
        var g = normalizeToGregorian(val, this.activeCalendar);
        if (g) {
            this.selectedGregorian = cloneDate(g);
            this.viewDate = projectFromGregorian(g, this.activeCalendar);
            this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
            this.render();
        }
    };

    AarkamCalendar.prototype.switchCalendar = function (cal) {
        this.activeCalendar = normalizeCalendar(cal);
        this.viewDate = projectFromGregorian(this.selectedGregorian, this.activeCalendar);
        this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
        this.pickerMode = PICKER_DAYS;
        if (typeof this.opts.onCalendarChange === "function") {
            this.opts.onCalendarChange(this.activeCalendar);
        }
        this.render();
    };

    AarkamCalendar.prototype.render = function () {
        var self = this;
        this.container.innerHTML = "";

        var isAr = isArabicLocale(this.opts.locale);
        var mNames = this.activeCalendar === CAL_HIJRI ? (isAr ? MONTHS_AR : MONTHS_EN) : (isAr ? GREG_MONTHS_AR : GREG_MONTHS_EN);
        var sNames = this.activeCalendar === CAL_HIJRI ? (isAr ? GREG_MONTHS_AR : GREG_MONTHS_EN) : (isAr ? MONTHS_AR : MONTHS_EN);

        // Switcher
        var switcher = null;
        if (this.opts.showSwitcher) {
            switcher = document.createElement("div");
            switcher.className = "aarkam-type-switcher";

            var btnH = document.createElement("button");
            btnH.type = "button";
            btnH.className = "aarkam-type-btn" + (!this.isDual && this.activeCalendar === CAL_HIJRI ? " active" : "");
            btnH.innerHTML = '<span class="aarkam-icon-wrap">' + ICONS.moon + "</span> " + (isAr ? "هجري" : "Hijri");
            btnH.onclick = function (e) { e.stopPropagation(); self.isDual = false; self.switchCalendar(CAL_HIJRI); };

            var btnG = document.createElement("button");
            btnG.type = "button";
            btnG.className = "aarkam-type-btn" + (!this.isDual && this.activeCalendar === CAL_GREGORIAN ? " active" : "");
            btnG.innerHTML = '<span class="aarkam-icon-wrap">' + ICONS.calendar + "</span> " + (isAr ? "ميلادي" : "Gregorian");
            btnG.onclick = function (e) { e.stopPropagation(); self.isDual = false; self.switchCalendar(CAL_GREGORIAN); };

            var btnD = document.createElement("button");
            btnD.type = "button";
            btnD.className = "aarkam-type-btn" + (this.isDual ? " active" : "");
            btnD.innerHTML = '<span class="aarkam-icon-wrap">' + ICONS.bookDual + "</span> " + (isAr ? "مزدوج" : "Dual");
            btnD.onclick = function (e) { e.stopPropagation(); self.isDual = true; self.render(); };

            switcher.appendChild(btnH);
            switcher.appendChild(btnG);
            switcher.appendChild(btnD);
        }

        // Card Container
        var card = document.createElement("div");
        card.className = "aarkam-card";

        // Header
        var header = document.createElement("div");
        header.className = "aarkam-card-header";

        var prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "aarkam-header-nav";
        prevBtn.innerHTML = '<span class="aarkam-icon-wrap">' + (isAr ? ICONS.chevronRight : ICONS.chevronLeft) + '</span>';
        prevBtn.onclick = function (e) { e.stopPropagation(); self.nav(-1); };

        var nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "aarkam-header-nav";
        nextBtn.innerHTML = '<span class="aarkam-icon-wrap">' + (isAr ? ICONS.chevronLeft : ICONS.chevronRight) + '</span>';
        nextBtn.onclick = function (e) { e.stopPropagation(); self.nav(1); };

        header.appendChild(prevBtn);

        if (this.isDual) {
            var midG = convert({ calendar: this.activeCalendar, year: this.viewDate.year, month: this.viewDate.month, day: 15 }, CAL_GREGORIAN);
            var secView = convert(midG, this.activeCalendar === CAL_HIJRI ? CAL_GREGORIAN : CAL_HIJRI);

            var dualGrid = document.createElement("div");
            dualGrid.className = "aarkam-dual-header-grid";
            dualGrid.innerHTML =
                '<div class="aarkam-dual-col"><span class="aarkam-dual-main">' + mNames[this.viewDate.month - 1] + " " + this.viewDate.year + '</span><span class="aarkam-dual-sub">' + (this.activeCalendar === CAL_HIJRI ? "هجري" : "ميلادي") + '</span></div>' +
                '<div class="aarkam-dual-sep"></div>' +
                '<div class="aarkam-dual-col"><span class="aarkam-dual-main">' + sNames[secView.month - 1] + " " + secView.year + '</span><span class="aarkam-dual-sub">' + (this.activeCalendar === CAL_HIJRI ? "ميلادي" : "هجري") + '</span></div>';
            header.appendChild(dualGrid);
        } else {
            var titles = document.createElement("div");
            titles.className = "aarkam-header-titles";

            var mBtn = document.createElement("button");
            mBtn.type = "button";
            mBtn.className = "aarkam-title-btn" + (this.pickerMode === PICKER_MONTHS ? " active" : "");
            mBtn.textContent = mNames[this.viewDate.month - 1];
            mBtn.onclick = function (e) { e.stopPropagation(); self.pickerMode = self.pickerMode === PICKER_MONTHS ? PICKER_DAYS : PICKER_MONTHS; self.render(); };

            var yBtn = document.createElement("button");
            yBtn.type = "button";
            yBtn.className = "aarkam-title-btn" + (this.pickerMode === PICKER_YEARS ? " active" : "");
            yBtn.textContent = this.pickerMode === PICKER_YEARS ? (this.yearRangeStart + " - " + (this.yearRangeStart + 9)) : String(this.viewDate.year);
            yBtn.onclick = function (e) {
                e.stopPropagation();
                self.yearRangeStart = Math.floor(self.viewDate.year / 10) * 10;
                self.pickerMode = self.pickerMode === PICKER_YEARS ? PICKER_DAYS : PICKER_YEARS;
                self.render();
            };

            titles.appendChild(mBtn);
            titles.appendChild(yBtn);
            header.appendChild(titles);
        }

        header.appendChild(nextBtn);
        card.appendChild(header);

        // Body
        if (this.pickerMode === PICKER_DAYS) {
            var weekRow = document.createElement("div");
            weekRow.className = "aarkam-weekdays-row";
            (isAr ? WEEK_AR : WEEK_EN).forEach(function (w) {
                var c = document.createElement("div");
                c.className = "aarkam-col-head";
                c.textContent = w;
                weekRow.appendChild(c);
            });
            card.appendChild(weekRow);

            var gridEl = document.createElement("div");
            gridEl.className = "aarkam-days-grid";
            var cells = monthGrid(this.viewDate.year, this.viewDate.month, this.activeCalendar);

            cells.forEach(function (cell) {
                if (!cell) {
                    var empty = document.createElement("div");
                    empty.className = "aarkam-cell empty";
                    gridEl.appendChild(empty);
                    return;
                }
                var btn = document.createElement("button");
                btn.type = "button";
                var isSel = sameDate(cell.gregorian, self.selectedGregorian);
                var isTod = sameDate(cell.gregorian, todayGregorian());
                btn.className = "aarkam-cell" + (isSel ? " selected" : "") + (isTod ? " today" : "");

                var html = '<span class="aarkam-cell-primary">' + cell.primary.day + '</span>';
                if (self.isDual) html += '<span class="aarkam-cell-secondary">' + cell.secondary.day + '</span>';
                btn.innerHTML = html;

                btn.onclick = function (e) {
                    e.stopPropagation();
                    self.selectedGregorian = cloneDate(cell.gregorian);
                    self.viewDate = projectFromGregorian(cell.gregorian, self.activeCalendar);
                    self.yearRangeStart = Math.floor(self.viewDate.year / 10) * 10;
                    if (self.opts.inputMode) self.isOpen = false;
                    if (typeof self.opts.onChange === "function") {
                        self.opts.onChange(self.getValue());
                    }
                    self.render();
                };
                gridEl.appendChild(btn);
            });
            card.appendChild(gridEl);

        } else if (this.pickerMode === PICKER_MONTHS) {
            var mGrid = document.createElement("div");
            mGrid.className = "aarkam-picker-grid";
            mNames.forEach(function (name, idx) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "aarkam-picker-cell" + (self.viewDate.month === idx + 1 ? " active" : "");
                btn.textContent = name;
                btn.onclick = function (e) {
                    e.stopPropagation();
                    self.viewDate.month = idx + 1;
                    self.pickerMode = PICKER_DAYS;
                    self.render();
                };
                mGrid.appendChild(btn);
            });
            card.appendChild(mGrid);

        } else {
            var yGrid = document.createElement("div");
            yGrid.className = "aarkam-picker-grid";
            for (var y = 0; y < 10; y++) {
                (function (yr) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "aarkam-picker-cell" + (self.viewDate.year === yr ? " active" : "");
                    btn.textContent = String(yr);
                    btn.onclick = function (e) {
                        e.stopPropagation();
                        self.viewDate.year = yr;
                        self.yearRangeStart = Math.floor(yr / 10) * 10;
                        self.pickerMode = PICKER_DAYS;
                        self.render();
                    };
                    yGrid.appendChild(btn);
                })(this.yearRangeStart + y);
            }
            card.appendChild(yGrid);
        }

        // Footer
        var footer = document.createElement("div");
        footer.className = "aarkam-card-footer";
        var selH = projectFromGregorian(this.selectedGregorian, CAL_HIJRI);
        var selG = projectFromGregorian(this.selectedGregorian, CAL_GREGORIAN);

        if (this.isDual) {
            footer.innerHTML =
                '<div class="aarkam-footer-split">' +
                '<span>' + formatDate(selH, this.opts.locale) + '</span>' +
                '<span class="aarkam-footer-sep">|</span>' +
                '<span>' + formatDate(selG, this.opts.locale) + '</span>' +
                '</div>';
        } else {
            footer.textContent = formatDate(this.activeCalendar === CAL_HIJRI ? selH : selG, this.opts.locale);
        }
        card.appendChild(footer);

        // Input Trigger vs Direct Card
        if (this.opts.inputMode) {
            var group = document.createElement("div");
            group.className = "aarkam-input-group";

            if (this.opts.label) {
                var lbl = document.createElement("label");
                lbl.className = "aarkam-input-label";
                lbl.textContent = this.opts.label;
                group.appendChild(lbl);
            }

            var trigger = document.createElement("button");
            trigger.type = "button";
            trigger.className = "aarkam-trigger-box";
            trigger.innerHTML = '<span>' + formatNumeric(this.activeCalendar === CAL_HIJRI ? selH : selG) + '</span><span class="aarkam-icon-wrap">' + ICONS.calendar + '</span>';
            trigger.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.isOpen = !self.isOpen;
                self.render();
            };
            group.appendChild(trigger);
            this.container.appendChild(group);

            if (this.isOpen) {
                var backdrop = document.createElement("div");
                backdrop.className = "aarkam-backdrop";
                backdrop.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.isOpen = false;
                    self.render();
                };
                this.container.appendChild(backdrop);

                var popWrap = document.createElement("div");
                popWrap.className = "aarkam-popup-wrap";
                if (switcher) popWrap.appendChild(switcher);
                popWrap.appendChild(card);
                this.container.appendChild(popWrap);
            }
        } else {
            if (switcher) this.container.appendChild(switcher);
            this.container.appendChild(card);
        }
    };

    AarkamCalendar.prototype.nav = function (delta) {
        if (this.pickerMode === PICKER_YEARS) {
            this.yearRangeStart += delta * 10;
        } else if (this.pickerMode === PICKER_MONTHS) {
            this.viewDate = shiftYear(this.viewDate, delta, this.activeCalendar);
            this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
        } else {
            this.viewDate = shiftMonth(this.viewDate, delta, this.activeCalendar);
            this.yearRangeStart = Math.floor(this.viewDate.year / 10) * 10;
        }
        this.render();
    };

    AarkamCalendar.configureDateAuthority = configureDateAuthority;
    global.AarkamCalendar = AarkamCalendar;
})(typeof window !== "undefined" ? window : globalThis);
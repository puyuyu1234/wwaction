//@ts-check
"use strict";

/**
 *
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

/**
 *
 * @param {string} str
 * @returns {boolean}
 */
const isBlock = (str) => /^[a-zA-z ]+$/g.test(str);

/**
 *
 * @param {number} start
 * @param {number} end
 * @param {number} step
 * @returns {number[]}
 */
const makeRangeWithEnd = (start, end, step) => {
    const range = [];
    for (let i = start; i < end; i += step) {
        range.push(i);
    }
    range.push(end);
    return range;
};

const lerp = (/** @type {number} */ start, /** @type {number} */ end, /** @type {number} */ t) =>
    start + (end - start) * t;

const easeLinear = (
    /** @type {number} */ start,
    /** @type {number} */ end,
    /** @type {number} */ time,
    /** @type {number} */ duration
) => {
    const x = clamp(time, 0, duration) / duration;
    const t = x;
    return lerp(start, end, t);
};

const easeOutExpo = (
    /** @type {number} */ start,
    /** @type {number} */ end,
    /** @type {number} */ time,
    /** @type {number} */ duration
) => {
    const x = clamp(time, 0, duration) / duration;
    const t = x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    return lerp(start, end, t);
};

const easeOutSine = (
    /** @type {number} */ start,
    /** @type {number} */ end,
    /** @type {number} */ time,
    /** @type {number} */ duration
) => {
    const x = clamp(time, 0, duration) / duration;
    const t = Math.sin((x * Math.PI) / 2);
    return lerp(start, end, t);
};

const easeInSine = (
    /** @type {number} */ start,
    /** @type {number} */ end,
    /** @type {number} */ time,
    /** @type {number} */ duration
) => {
    const x = clamp(time, 0, duration) / duration;
    const t = 1 - Math.cos((x * Math.PI) / 2);
    return lerp(start, end, t);
};

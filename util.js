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
const isUpperCase = (str) => /^[A-Z]+$/g.test(str);

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

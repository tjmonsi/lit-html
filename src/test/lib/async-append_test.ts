/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />

import {asyncAppend} from '../../lib/async-append.js';
import {html, render} from '../../lit-html.js';

import {TestAsyncIterable} from './test-async-iterable.js';

const assert = chai.assert;

// Set Symbol.asyncIterator on browsers without it
if (typeof Symbol !== undefined && Symbol.asyncIterator === undefined) {
  Object.defineProperty(Symbol, 'asyncIterator', {value: Symbol()});
}

suite('asyncAppend', () => {

  let container: HTMLDivElement;
  let iterable: TestAsyncIterable<string>;

  setup(() => {
    container = document.createElement('div');
    iterable = new TestAsyncIterable<string>();
  });

  test('renders an async iterable', async () => {
    render(html`<div>${asyncAppend(iterable)}</div>`, container);
    assert.equal(container.innerHTML, '<div></div>');

    await iterable.push('foo');
    assert.equal(container.innerHTML, '<div>foo</div>');

    await iterable.push('bar');
    assert.equal(container.innerHTML, '<div>foobar</div>');
  });

  test('renders an async iterable containing undefined', async () => {
    render(html`<div>${asyncAppend(iterable)}</div>`, container);
    assert.equal(container.innerHTML, '<div></div>');

    await iterable.push('foo');
    assert.equal(container.innerHTML, '<div>foo</div>');

    await iterable.push(undefined);
    assert.equal(container.innerHTML, '<div>foo</div>');
  });

  test('renders a mapped async iterable', async () => {
    render(
        html`<div>${asyncAppend(iterable, (v, i) => html`${i}: ${v} `)}</div>`,
        container);
    assert.equal(container.innerHTML, '<div></div>');

    await iterable.push('foo');
    assert.equal(container.innerHTML, '<div>0: foo </div>');

    await iterable.push('bar');
    assert.equal(container.innerHTML, '<div>0: foo 1: bar </div>');
  });

  test('renders new iterable over a pending iterable', async () => {
    const t = (iterable: any) => html`<div>${asyncAppend(iterable)}</div>`;
    render(t(iterable), container);
    assert.equal(container.innerHTML, '<div></div>');

    await iterable.push('foo');
    assert.equal(container.innerHTML, '<div>foo</div>');

    const iterable2 = new TestAsyncIterable<string>();
    render(t(iterable2), container);
    assert.equal(container.innerHTML, '<div></div>');

    await iterable2.push('hello');
    assert.equal(container.innerHTML, '<div>hello</div>');

    await iterable.push('bar');
    assert.equal(container.innerHTML, '<div>hello</div>');
  });

  test('renders new value over a pending iterable', async () => {
    const t = (v: any) => html`<div>${v}</div>`;
    // This is a little bit of an odd usage of directives as values, but it
    // it possible, and we check here that asyncAppend plays nice in this case
    render(t(asyncAppend(iterable)), container);
    assert.equal(container.innerHTML, '<div></div>');

    await iterable.push('foo');
    assert.equal(container.innerHTML, '<div>foo</div>');

    render(t('hello'), container);
    assert.equal(container.innerHTML, '<div>hello</div>');

    await iterable.push('bar');
    assert.equal(container.innerHTML, '<div>hello</div>');
  });

});
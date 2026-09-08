import test from 'node:test';
import assert from 'node:assert/strict';
import { getChestRevelations } from './chestRevelation.js';
test('deduplicates a chest but preserves two distinct chests with the same result', () => {
 const card={id:'a',specialType:'CH'};
 const result=getChestRevelations({players:[{name:'A',hand:[card,card,{id:'b',specialType:'CH'}]}],chestResults:{a:15,b:15}});
 assert.deepEqual(result.map(c=>c.id),['a','b']);
 assert.deepEqual(result.map(c=>c.result),[15,15]);
});
test('uses engine results without inventing a missing chest outcome', () => {
 assert.deepEqual(getChestRevelations({players:[{name:'A',hand:[{id:'a',specialType:'CH'}]}]}),[]);
 assert.equal(getChestRevelations({players:[{name:'A',hand:[{id:'a',specialType:'CH'}]}],chestResults:{a:-15}})[0].result,-15);
});

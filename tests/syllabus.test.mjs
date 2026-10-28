import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "public/syllabus.js"), "utf8");
const window = {};
vm.runInNewContext(source, { window, console, Object, Array, String, Math, RegExp });
const catalog = window.STUDYSENSE_SYLLABUS;

function part(grade, subject, label) {
  const key = subject + " — " + label;
  assert.ok(catalog[grade][key], `Missing ${key} for Grade ${grade}`);
  return catalog[grade][key];
}
function assertDisjoint(a, b) {
  const left = new Set(a.chapters);
  for (const chapter of b.chapters) assert.ok(!left.has(chapter), `Chapter appears in both volumes: ${chapter}`);
}

test("Class 7 Mathematics maps each chapter to the correct named volume", () => {
  const p1 = part("7", "Mathematics", "Part I");
  const p2 = part("7", "Mathematics", "Part II");
  assert.equal(p1.chapters.length, 8);
  assert.equal(p2.chapters.length, 7);
  assertDisjoint(p1, p2);
  assert.ok(p1.chapters.includes("Working with Fractions"));
  assert.ok(p2.chapters.includes("Geometric Twins"));
});

test("Class 8 Mathematics maps seven chapters into each volume", () => {
  const p1 = part("8", "Mathematics", "Part I");
  const p2 = part("8", "Mathematics", "Part II");
  assert.equal(p1.chapters.length, 7);
  assert.equal(p2.chapters.length, 7);
  assertDisjoint(p1, p2);
  assert.ok(!p1.chapters.includes("Fractions in Disguise"));
  assert.ok(p2.chapters.includes("Fractions in Disguise"));
});

test("Class 7 Social Science uses the twelve/eight official part grouping", () => {
  const p1 = part("7", "Social Science", "Part I");
  const p2 = part("7", "Social Science", "Part II");
  assert.equal(p1.chapters.length, 12);
  assert.equal(p2.chapters.length, 8);
  assertDisjoint(p1, p2);
  assert.ok(p1.chapters.includes("The Constitution of India — An Introduction"));
  assert.ok(p2.chapters.includes("The Story of Indian Farming"));
});

test("Class 8 Social Science keeps its recall caveat visible in catalogue data", () => {
  const p1 = part("8", "Social Science", "Part I");
  const p2 = part("8", "Social Science", "Part II");
  assert.equal(p1.chapters.length, 7);
  assert.equal(p2.chapters.length, 8);
  assertDisjoint(p1, p2);
  assert.match(p2.sourceNote, /recall\/hold notice/i);
});

test("Class 9 Social Science uses explicit Part I/II prefixes, not a midpoint", () => {
  const p1 = part("9", "Social Science", "Part I");
  const p2 = part("9", "Social Science", "Part II");
  assert.equal(p1.chapters.length, 9);
  assert.equal(p2.chapters.length, 6);
  assertDisjoint(p1, p2);
  assert.ok(p1.chapters.every(chapter => !/^Part [I|II] —/.test(chapter)));
  assert.ok(p2.chapters.every(chapter => !/^Part [I|II] —/.test(chapter)));
});

test("Single-volume Grade 6 Social Science is not falsely split", () => {
  assert.ok(catalog["6"]["Social Science"]);
  assert.ok(!catalog["6"]["Social Science — Part I"]);
  assert.equal(catalog["6"]["Social Science"].chapters.length, 14);
});

test("Class 9 Mathematics maps the 2026–27 Ganita Manjari chapters into both parts", () => {
  const p1 = part("9", "Mathematics", "Part I");
  const p2 = part("9", "Mathematics", "Part II");
  assert.equal(p1.chapters.length, 8);
  assert.equal(p2.chapters.length, 6);
  assert.equal(p1.book, "Ganita Manjari · Part I");
  assert.equal(p2.book, "Ganita Manjari · Part II");
  assertDisjoint(p1, p2);
  assert.equal(p1.chapters[0], "Orienting Yourself: The Use of Coordinates");
  assert.equal(p1.chapters[2], "The World of Numbers");
  assert.equal(p2.chapters[0], "Propositions and their Converses");
  assert.equal(p2.chapters[5], "Math of Space: Surface Area and Volume");
});

test("Class 9 English uses the current Kaveri prose and poetry list", () => {
  const english = catalog["9"].English;
  assert.match(english.book, /Kaveri/);
  assert.equal(english.chapters.length, 16);
  assert.ok(english.chapters.includes("How I Taught My Grandmother to Read"));
  assert.ok(english.chapters.includes("Follow That Dream"));
  assert.ok(english.chapters.includes("Bharat Our Land"));
  assert.ok(english.chapters.includes("Believe in Yourself"));
  assert.match(english.sourceNote, /2026–27/);
});

test("Class 9 Hindi uses the current Ganga chapter list", () => {
  const hindi = catalog["9"].Hindi;
  assert.match(hindi.book, /Ganga/);
  assert.equal(hindi.chapters.length, 12);
  assert.ok(hindi.chapters.includes("दो बैलों की कथा"));
  assert.ok(hindi.chapters.includes("रीढ़ की हड्डी"));
  assert.ok(hindi.chapters.includes("राम-लक्ष्मण-परशुराम संवाद"));
  assert.ok(hindi.chapters.includes("घर की याद"));
  assert.match(hindi.sourceNote, /2026–27/);
});

test("Language catalogues for other grades do not fabricate chapter titles", () => {
  for (const grade of ["6", "7", "8"]) {
    assert.equal(catalog[grade].English.chapters.length, 0);
    assert.equal(catalog[grade].Hindi.chapters.length, 0);
    assert.ok(catalog[grade].English.sourceNote);
    assert.ok(catalog[grade].Hindi.sourceNote);
  }
});

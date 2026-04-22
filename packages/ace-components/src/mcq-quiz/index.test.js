import { describe, it, expect, beforeEach } from "bun:test";
import { MCQQuiz } from "./index.js";

const props = {
  id: "test-quiz",
  questions: [
    { q: "2+2?", options: ["3", "4", "5"], answer: 1, explanation: "Basic arithmetic." },
    { q: "Capital of France?", options: ["London", "Paris", "Berlin"], answer: 1, explanation: "Paris is the capital." }
  ]
};

describe("MCQQuiz", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("renders a block per question with options", () => {
    const w = new MCQQuiz();
    w.mount(root, props, { siteId: "test" });
    expect(root.querySelectorAll(".ace-mcq__item").length).toBe(2);
    const firstOpts = root.querySelector(".ace-mcq__item .ace-mcq__opts").querySelectorAll("button");
    expect(firstOpts.length).toBe(3);
  });

  it("clicking a correct answer marks it and reveals explanation", () => {
    const w = new MCQQuiz();
    w.mount(root, props, { siteId: "test" });
    const buttons = root.querySelectorAll(".ace-mcq__item .ace-mcq__opts button");
    buttons[1].click(); // correct answer index 1
    const first = root.querySelector(".ace-mcq__item");
    expect(first.classList.contains("is-answered")).toBe(true);
    expect(first.querySelector(".ace-mcq__exp").textContent).toMatch(/Correct/);
    expect(first.querySelector(".is-correct")).not.toBeNull();
  });

  it("clicking a wrong answer shows both wrong and correct highlights", () => {
    const w = new MCQQuiz();
    w.mount(root, props, { siteId: "test" });
    const buttons = root.querySelectorAll(".ace-mcq__item .ace-mcq__opts button");
    buttons[0].click(); // wrong
    const first = root.querySelector(".ace-mcq__item");
    expect(first.querySelector(".is-wrong")).not.toBeNull();
    expect(first.querySelector(".is-correct")).not.toBeNull();
    expect(first.querySelector(".ace-mcq__exp").textContent).toMatch(/Answer:/);
  });

  it("persists answers across remount", () => {
    const w = new MCQQuiz();
    w.mount(root, props, { siteId: "siteA" });
    const buttons = root.querySelectorAll(".ace-mcq__item .ace-mcq__opts button");
    buttons[1].click();
    w.destroy();

    const root2 = document.createElement("div");
    document.body.appendChild(root2);
    const w2 = new MCQQuiz();
    w2.mount(root2, props, { siteId: "siteA" });
    expect(root2.querySelector(".ace-mcq__item").classList.contains("is-answered")).toBe(true);
  });

  it("updates score as questions are answered", () => {
    const w = new MCQQuiz();
    w.mount(root, props, { siteId: "test" });
    expect(root.querySelector(".ace-mcq__score").textContent).toMatch(/0 correct/);
    root.querySelectorAll(".ace-mcq__item .ace-mcq__opts button")[1].click();
    expect(root.querySelector(".ace-mcq__score").textContent).toMatch(/1 correct/);
    root.querySelectorAll(".ace-mcq__item")[1].querySelectorAll(".ace-mcq__opts button")[1].click();
    expect(root.querySelector(".ace-mcq__score").textContent).toMatch(/2 correct/);
  });

  it("rejects props missing questions", () => {
    const w = new MCQQuiz();
    w.mount(root, {}, { siteId: "test" });
    expect(root.querySelector(".ace-error")).not.toBeNull();
  });
});

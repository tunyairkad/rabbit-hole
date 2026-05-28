"use strict";

const { EMOJIS, PAIR_COUNT, shuffle, buildDeck, createGame } = require("./game");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDOMFixture() {
  const boardEl = document.createElement("div");
  const movesEl = document.createElement("span");
  const winOverlay = document.createElement("div");
  const winMessage = document.createElement("p");
  winOverlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(boardEl);
  document.body.appendChild(movesEl);
  document.body.appendChild(winOverlay);
  document.body.appendChild(winMessage);
  return { boardEl, movesEl, winOverlay, winMessage };
}

// ---------------------------------------------------------------------------
// shuffle()
// ---------------------------------------------------------------------------

describe("shuffle()", () => {
  it("returns an array of the same length", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input)).toHaveLength(input.length);
  });

  it("returns a new array, not the original reference", () => {
    const input = [1, 2, 3];
    expect(shuffle(input)).not.toBe(input);
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("contains exactly the same elements as the input", () => {
    const input = ["a", "b", "c", "d", "e"];
    const result = shuffle(input);
    expect(result.sort()).toEqual([...input].sort());
  });

  it("handles an empty array", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("handles a single-element array", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("produces at least one different ordering over many runs (statistical)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const serialized = JSON.stringify(input);
    // Run 20 times; the probability that every single run returns the same
    // order is (1/8!)^20 ≈ 10^-80, so this is effectively deterministic.
    const allSame = Array.from({ length: 20 }, () =>
      JSON.stringify(shuffle(input))
    ).every((s) => s === serialized);
    expect(allSame).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildDeck()
// ---------------------------------------------------------------------------

describe("buildDeck()", () => {
  it("returns an array with 2 * PAIR_COUNT cards", () => {
    expect(buildDeck()).toHaveLength(PAIR_COUNT * 2);
  });

  it("contains exactly two copies of each emoji", () => {
    const deck = buildDeck();
    EMOJIS.forEach((emoji) => {
      const count = deck.filter((e) => e === emoji).length;
      expect(count).toBe(2);
    });
  });

  it("contains only valid emojis from the EMOJIS set", () => {
    const deck = buildDeck();
    deck.forEach((emoji) => {
      expect(EMOJIS).toContain(emoji);
    });
  });

  it("returns a shuffled (non-deterministic) deck", () => {
    // Same statistical argument as for shuffle() above.
    const ordered = [...EMOJIS, ...EMOJIS];
    const serialized = JSON.stringify(ordered);
    const allSame = Array.from({ length: 20 }, () =>
      JSON.stringify(buildDeck())
    ).every((s) => s === serialized);
    expect(allSame).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createGame() – createCard()
// ---------------------------------------------------------------------------

describe("createCard()", () => {
  let dom, game;

  beforeEach(() => {
    dom = makeDOMFixture();
    game = createGame(dom.boardEl, dom.movesEl, dom.winOverlay, dom.winMessage);
    game.initGame();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates a <button> element", () => {
    const card = game.createCard("🐶", 0);
    expect(card.tagName).toBe("BUTTON");
  });

  it("sets the correct data-emoji attribute", () => {
    const card = game.createCard("🐱", 3);
    expect(card.dataset.emoji).toBe("🐱");
  });

  it("sets the correct data-index attribute", () => {
    const card = game.createCard("🦊", 7);
    expect(card.dataset.index).toBe("7");
  });

  it("has the 'card' CSS class", () => {
    const card = game.createCard("🐼", 0);
    expect(card.classList.contains("card")).toBe(true);
  });

  it("has the initial aria-label 'Face down card'", () => {
    const card = game.createCard("🐸", 0);
    expect(card.getAttribute("aria-label")).toBe("Face down card");
  });

  it("contains a card-back face element", () => {
    const card = game.createCard("🦋", 0);
    expect(card.querySelector(".card-back")).not.toBeNull();
  });

  it("contains a card-front face element with the emoji", () => {
    const card = game.createCard("🌮", 0);
    const front = card.querySelector(".card-front");
    expect(front).not.toBeNull();
    expect(front.textContent.trim()).toBe("🌮");
  });
});

// ---------------------------------------------------------------------------
// createGame() – initGame()
// ---------------------------------------------------------------------------

describe("initGame()", () => {
  let dom, game;

  beforeEach(() => {
    dom = makeDOMFixture();
    game = createGame(dom.boardEl, dom.movesEl, dom.winOverlay, dom.winMessage);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("populates the board with exactly 2 * PAIR_COUNT cards", () => {
    game.initGame();
    expect(dom.boardEl.children).toHaveLength(PAIR_COUNT * 2);
  });

  it("resets the moves display to '0'", () => {
    dom.movesEl.textContent = "99";
    game.initGame();
    expect(dom.movesEl.textContent).toBe("0");
  });

  it("resets internal move counter to 0", () => {
    game.initGame();
    expect(game.getState().moves).toBe(0);
  });

  it("resets matchedCount to 0", () => {
    game.initGame();
    expect(game.getState().matchedCount).toBe(0);
  });

  it("clears the flipped array", () => {
    game.initGame();
    expect(game.getState().flipped).toHaveLength(0);
  });

  it("releases the lock", () => {
    game.initGame();
    expect(game.getState().lock).toBe(false);
  });

  it("removes 'visible' class from win overlay", () => {
    dom.winOverlay.classList.add("visible");
    game.initGame();
    expect(dom.winOverlay.classList.contains("visible")).toBe(false);
  });

  it("sets win overlay aria-hidden to 'true'", () => {
    dom.winOverlay.setAttribute("aria-hidden", "false");
    game.initGame();
    expect(dom.winOverlay.getAttribute("aria-hidden")).toBe("true");
  });

  it("clears any previous board children", () => {
    game.initGame();
    const firstCard = dom.boardEl.firstChild;
    game.initGame();
    expect(dom.boardEl.contains(firstCard)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createGame() – flipCard()
// ---------------------------------------------------------------------------

describe("flipCard()", () => {
  let dom, game;

  beforeEach(() => {
    dom = makeDOMFixture();
    game = createGame(dom.boardEl, dom.movesEl, dom.winOverlay, dom.winMessage);
    game.initGame();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("adds 'flipped' class when faceUp=true", () => {
    const card = game.createCard("🐶", 0);
    game.flipCard(card, true);
    expect(card.classList.contains("flipped")).toBe(true);
  });

  it("removes 'flipped' class when faceUp=false", () => {
    const card = game.createCard("🐶", 0);
    card.classList.add("flipped");
    game.flipCard(card, false);
    expect(card.classList.contains("flipped")).toBe(false);
  });

  it("sets aria-label to 'Revealed <emoji>' when faceUp=true", () => {
    const card = game.createCard("🚀", 0);
    game.flipCard(card, true);
    expect(card.getAttribute("aria-label")).toBe("Revealed 🚀");
  });

  it("sets aria-label to 'Face down card' when faceUp=false", () => {
    const card = game.createCard("🚀", 0);
    card.classList.add("flipped");
    card.setAttribute("aria-label", "Revealed 🚀");
    game.flipCard(card, false);
    expect(card.getAttribute("aria-label")).toBe("Face down card");
  });
});

// ---------------------------------------------------------------------------
// createGame() – showWin()
// ---------------------------------------------------------------------------

describe("showWin()", () => {
  let dom, game;

  beforeEach(() => {
    dom = makeDOMFixture();
    game = createGame(dom.boardEl, dom.movesEl, dom.winOverlay, dom.winMessage);
    game.initGame();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("adds 'visible' class to winOverlay", () => {
    game.showWin();
    expect(dom.winOverlay.classList.contains("visible")).toBe(true);
  });

  it("sets winOverlay aria-hidden to 'false'", () => {
    game.showWin();
    expect(dom.winOverlay.getAttribute("aria-hidden")).toBe("false");
  });

  it("sets winMessage text to include the move count", () => {
    // Simulate some moves by clicking two matching cards.
    game.showWin();
    expect(dom.winMessage.textContent).toContain("moves");
  });

  it("includes current move count in win message", () => {
    // Drive moves counter to a known value by bypassing click logic.
    game.initGame();
    // Manually verify getState then call showWin
    const state = game.getState();
    // moves starts at 0
    expect(dom.winMessage.textContent || "").toBe("");
    game.showWin();
    expect(dom.winMessage.textContent).toBe(
      `You found all pairs in ${state.moves} moves!`
    );
  });
});

// ---------------------------------------------------------------------------
// createGame() – onCardClick()
// ---------------------------------------------------------------------------

describe("onCardClick()", () => {
  let dom, game;

  beforeEach(() => {
    jest.useFakeTimers();
    dom = makeDOMFixture();
    game = createGame(dom.boardEl, dom.movesEl, dom.winOverlay, dom.winMessage);
    game.initGame();
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  it("ignores click when lock is true", () => {
    const cards = game.getState().cards;
    // Force lock by clicking two non-matching cards; lock is set before setTimeout
    const [c0, c1] = getFirstNonMatchingPair(cards);
    c0.click();
    c1.click(); // lock = true here, pending setTimeout
    // Now try a third card
    const c2 = cards.find(
      (c) =>
        c !== c0 &&
        c !== c1 &&
        !c.classList.contains("matched") &&
        !c.classList.contains("flipped")
    );
    if (c2) {
      c2.click();
      expect(c2.classList.contains("flipped")).toBe(false);
    }
  });

  it("ignores click on an already-flipped card", () => {
    const cards = game.getState().cards;
    const card = cards[0];
    card.click(); // flip once
    expect(card.classList.contains("flipped")).toBe(true);
    card.click(); // click again — should be ignored
    // flipped array should still only contain this one card
    expect(game.getState().flipped).toHaveLength(1);
  });

  it("ignores click on an already-matched card", () => {
    const cards = game.getState().cards;
    const card = cards[0];
    card.classList.add("matched");
    card.click();
    expect(game.getState().flipped).toHaveLength(0);
  });

  it("flips a card face-up on first click", () => {
    const card = game.getState().cards[0];
    card.click();
    expect(card.classList.contains("flipped")).toBe(true);
  });

  it("does not increment moves after the first card flip", () => {
    const card = game.getState().cards[0];
    card.click();
    expect(game.getState().moves).toBe(0);
  });

  it("increments moves after the second card flip", () => {
    const cards = game.getState().cards;
    cards[0].click();
    cards[1].click();
    expect(game.getState().moves).toBe(1);
  });

  it("updates moves display element after second flip", () => {
    const cards = game.getState().cards;
    cards[0].click();
    cards[1].click();
    expect(dom.movesEl.textContent).toBe("1");
  });

  describe("matching pair", () => {
    it("adds 'matched' class to both cards", () => {
      const [a, b] = getFirstMatchingPair(game.getState().cards);
      a.click();
      b.click();
      expect(a.classList.contains("matched")).toBe(true);
      expect(b.classList.contains("matched")).toBe(true);
    });

    it("releases lock immediately after a match", () => {
      const [a, b] = getFirstMatchingPair(game.getState().cards);
      a.click();
      b.click();
      expect(game.getState().lock).toBe(false);
    });

    it("clears flipped array after a match", () => {
      const [a, b] = getFirstMatchingPair(game.getState().cards);
      a.click();
      b.click();
      expect(game.getState().flipped).toHaveLength(0);
    });

    it("increments matchedCount after a match", () => {
      const [a, b] = getFirstMatchingPair(game.getState().cards);
      a.click();
      b.click();
      expect(game.getState().matchedCount).toBe(1);
    });

    it("sets aria-label on both matched cards", () => {
      const [a, b] = getFirstMatchingPair(game.getState().cards);
      const emoji = a.dataset.emoji;
      a.click();
      b.click();
      expect(a.getAttribute("aria-label")).toBe(`Matched ${emoji}`);
      expect(b.getAttribute("aria-label")).toBe(`Matched ${emoji}`);
    });

    it("triggers win overlay after all pairs are matched (via setTimeout)", () => {
      matchAllPairs(game);
      jest.advanceTimersByTime(400);
      expect(dom.winOverlay.classList.contains("visible")).toBe(true);
    });

    it("does not show win overlay before the 400 ms delay", () => {
      matchAllPairs(game);
      jest.advanceTimersByTime(399);
      expect(dom.winOverlay.classList.contains("visible")).toBe(false);
    });
  });

  describe("non-matching pair", () => {
    it("adds 'shake' class to both cards immediately", () => {
      const [a, b] = getFirstNonMatchingPair(game.getState().cards);
      a.click();
      b.click();
      expect(a.classList.contains("shake")).toBe(true);
      expect(b.classList.contains("shake")).toBe(true);
    });

    it("keeps lock true before the 800 ms delay", () => {
      const [a, b] = getFirstNonMatchingPair(game.getState().cards);
      a.click();
      b.click();
      jest.advanceTimersByTime(799);
      expect(game.getState().lock).toBe(true);
    });

    it("releases lock after the 800 ms delay", () => {
      const [a, b] = getFirstNonMatchingPair(game.getState().cards);
      a.click();
      b.click();
      jest.advanceTimersByTime(800);
      expect(game.getState().lock).toBe(false);
    });

    it("flips both cards back down after the 800 ms delay", () => {
      const [a, b] = getFirstNonMatchingPair(game.getState().cards);
      a.click();
      b.click();
      jest.advanceTimersByTime(800);
      expect(a.classList.contains("flipped")).toBe(false);
      expect(b.classList.contains("flipped")).toBe(false);
    });

    it("removes 'shake' class after the 800 ms delay", () => {
      const [a, b] = getFirstNonMatchingPair(game.getState().cards);
      a.click();
      b.click();
      jest.advanceTimersByTime(800);
      expect(a.classList.contains("shake")).toBe(false);
      expect(b.classList.contains("shake")).toBe(false);
    });

    it("clears flipped array after the 800 ms delay", () => {
      const [a, b] = getFirstNonMatchingPair(game.getState().cards);
      a.click();
      b.click();
      jest.advanceTimersByTime(800);
      expect(game.getState().flipped).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// EMOJIS / PAIR_COUNT constants
// ---------------------------------------------------------------------------

describe("EMOJIS and PAIR_COUNT", () => {
  it("PAIR_COUNT equals the length of EMOJIS", () => {
    expect(PAIR_COUNT).toBe(EMOJIS.length);
  });

  it("EMOJIS contains 8 entries", () => {
    expect(EMOJIS).toHaveLength(8);
  });

  it("EMOJIS has no duplicates", () => {
    const unique = new Set(EMOJIS);
    expect(unique.size).toBe(EMOJIS.length);
  });
});

// ---------------------------------------------------------------------------
// Internal test helpers
// ---------------------------------------------------------------------------

/** Return the first two cards in the deck that share the same emoji. */
function getFirstMatchingPair(cards) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].dataset.emoji === cards[j].dataset.emoji) {
        return [cards[i], cards[j]];
      }
    }
  }
  throw new Error("No matching pair found in cards");
}

/** Return two cards that do NOT share the same emoji. */
function getFirstNonMatchingPair(cards) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].dataset.emoji !== cards[j].dataset.emoji) {
        return [cards[i], cards[j]];
      }
    }
  }
  throw new Error("No non-matching pair found in cards");
}

/** Click through all pairs to reach win condition. */
function matchAllPairs(game) {
  const cards = game.getState().cards;
  EMOJIS.forEach((emoji) => {
    const pair = cards.filter((c) => c.dataset.emoji === emoji);
    pair[0].click();
    pair[1].click();
  });
}
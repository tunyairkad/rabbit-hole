const EMOJIS = ["🐶", "🐱", "🦊", "🐼", "🐸", "🦋", "🌮", "🚀"];
const PAIR_COUNT = EMOJIS.length;

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  return shuffle([...EMOJIS, ...EMOJIS]);
}

function createGame(boardEl, movesEl, winOverlay, winMessage) {
  let cards = [];
  let flipped = [];
  let matchedCount = 0;
  let moves = 0;
  let lock = false;

  function flipCard(card, faceUp) {
    card.classList.toggle("flipped", faceUp);
    card.setAttribute(
      "aria-label",
      faceUp ? `Revealed ${card.dataset.emoji}` : "Face down card"
    );
  }

  function showWin() {
    winMessage.textContent = `You found all pairs in ${moves} moves!`;
    winOverlay.classList.add("visible");
    winOverlay.setAttribute("aria-hidden", "false");
  }

  function createCard(emoji, index) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.index = index;
    card.dataset.emoji = emoji;
    card.setAttribute("aria-label", "Face down card");

    card.innerHTML = `
      <span class="card-face card-back" aria-hidden="true"></span>
      <span class="card-face card-front" aria-hidden="true">${emoji}</span>
    `;

    card.addEventListener("click", () => onCardClick(card));
    return card;
  }

  function initGame() {
    boardEl.innerHTML = "";
    flipped = [];
    matchedCount = 0;
    moves = 0;
    lock = false;
    movesEl.textContent = "0";
    winOverlay.classList.remove("visible");
    winOverlay.setAttribute("aria-hidden", "true");

    const deck = buildDeck();
    cards = deck.map((emoji, i) => {
      const card = createCard(emoji, i);
      boardEl.appendChild(card);
      return card;
    });
  }

  function onCardClick(card) {
    if (
      lock ||
      card.classList.contains("flipped") ||
      card.classList.contains("matched")
    ) {
      return;
    }

    flipCard(card, true);
    flipped.push(card);

    if (flipped.length < 2) return;

    lock = true;
    moves++;
    movesEl.textContent = moves;

    const [first, second] = flipped;
    const match = first.dataset.emoji === second.dataset.emoji;

    if (match) {
      first.classList.add("matched");
      second.classList.add("matched");
      first.setAttribute("aria-label", `Matched ${first.dataset.emoji}`);
      second.setAttribute("aria-label", `Matched ${second.dataset.emoji}`);
      matchedCount++;
      flipped = [];
      lock = false;

      if (matchedCount === PAIR_COUNT) {
        setTimeout(showWin, 400);
      }
    } else {
      first.classList.add("shake");
      second.classList.add("shake");
      setTimeout(() => {
        flipCard(first, false);
        flipCard(second, false);
        first.classList.remove("shake");
        second.classList.remove("shake");
        flipped = [];
        lock = false;
      }, 800);
    }
  }

  function getState() {
    return { cards, flipped, matchedCount, moves, lock };
  }

  return { initGame, onCardClick, flipCard, showWin, createCard, getState };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { EMOJIS, PAIR_COUNT, shuffle, buildDeck, createGame };
}
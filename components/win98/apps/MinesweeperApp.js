import { useState, useEffect, useCallback, useRef } from "react";

// Difficulty table, à la 98.js.org's `difficulty_levels` = [cols, rows, mines].
const DIFFICULTIES = {
  beginner: { label: "Beginner", cols: 9, rows: 9, mines: 10 },
  intermediate: { label: "Intermediate", cols: 16, rows: 16, mines: 40 },
  expert: { label: "Expert", cols: 30, rows: 16, mines: 99 },
};

// Win98 bevels: raised = a button-like face, sunken = a recessed well.
const RAISED = {
  background: "#c0c0c0",
  boxShadow:
    "inset -1px -1px 0 #404040, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #fff",
};
const SUNKEN = {
  boxShadow:
    "inset 1px 1px 0 #404040, inset -1px -1px 0 #fff, inset 2px 2px 0 #808080, inset -2px -2px 0 #fff",
};
// Number colours indexed by neighbouring-mine count (1..8).
const NUM_COLORS = [null, "blue", "green", "red", "darkblue", "darkred", "teal", "black", "gray"];

// Original Win98-style reset-button smiley (3 states) — drawn here rather than
// copying WinMine's sprite sheet.
function Face({ status }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="7" fill="#ffd800" stroke="#000" strokeWidth="1" />
      {status === "won" ? (
        <>
          <rect x="3.5" y="6.4" width="11" height="2.6" fill="#000" />
          <path d="M5.5 12 Q9 14.4 12.5 12" stroke="#000" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      ) : status === "lost" ? (
        <>
          <path d="M5 6 l2.2 2.2 M7.2 6 l-2.2 2.2" stroke="#000" strokeWidth="1" strokeLinecap="round" />
          <path d="M10.8 6 l2.2 2.2 M13 6 l-2.2 2.2" stroke="#000" strokeWidth="1" strokeLinecap="round" />
          <path d="M5.5 13 Q9 10.6 12.5 13" stroke="#000" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="6.4" cy="7.4" r="1" fill="#000" />
          <circle cx="11.6" cy="7.4" r="1" fill="#000" />
          <path d="M5.5 11 Q9 14 12.5 11" stroke="#000" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// Original red flag for marked cells.
function Flag() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" shapeRendering="crispEdges">
      <rect x="6" y="2" width="1" height="6" fill="#000" />
      <path d="M6 2 L2 3.6 L6 5.2 Z" fill="#e00000" />
      <rect x="3" y="9.5" width="6" height="1.5" fill="#000" />
      <rect x="4" y="8" width="4" height="1.5" fill="#000" />
    </svg>
  );
}

// Original 7-segment LED digit — lit segments full red, the rest a faint glow —
// for the mine counter and timer (the classic Minesweeper display), drawn here
// rather than using any sprite.
const SEG_PATHS = {
  t: "M2 1 L11 1 L9 3 L4 3 Z",
  lt: "M1 2 L3 4 L3 9 L1 11 Z",
  rt: "M12 2 L10 4 L10 9 L12 11 Z",
  m: "M3 11.5 L4 10.5 L9 10.5 L10 11.5 L9 12.5 L4 12.5 Z",
  lb: "M1 12 L3 14 L3 19 L1 21 Z",
  rb: "M12 12 L10 14 L10 19 L12 21 Z",
  b: "M4 20 L9 20 L11 22 L2 22 Z",
};
const DIGIT_SEGS = {
  "0": "t lt rt lb rb b",
  "1": "rt rb",
  "2": "t rt m lb b",
  "3": "t rt m rb b",
  "4": "lt rt m rb",
  "5": "t lt m rb b",
  "6": "t lt m lb rb b",
  "7": "t rt rb",
  "8": "t lt rt m lb rb b",
  "9": "t lt rt m rb b",
};
function SevenSegDigit({ ch }) {
  const on = (DIGIT_SEGS[ch] || "").split(" ");
  return (
    <svg width="13" height="23" viewBox="0 0 13 23" style={{ display: "block" }}>
      {Object.keys(SEG_PATHS).map((seg) => (
        <path key={seg} d={SEG_PATHS[seg]} fill={on.includes(seg) ? "#ff1a1a" : "#3a0000"} />
      ))}
    </svg>
  );
}
function SevenSeg({ val }) {
  const str = Math.max(0, Math.min(999, Math.floor(val))).toString().padStart(3, "0");
  return (
    <div style={{ display: "flex", gap: 1, background: "#000", padding: "2px 3px", ...SUNKEN }}>
      {str.split("").map((c, i) => (
        <SevenSegDigit key={i} ch={c} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu bar (Win98 "Game"/"Help" dropdowns), driven by a plain item array like
// 98.js.org's menus.js. Items: { label, action?, checked?, enabled?, divider? }.
// ---------------------------------------------------------------------------
function MenuItem({ item, onChoose }) {
  const disabled = item.enabled === false;
  const [hover, setHover] = useState(false);
  if (item.divider) {
    return <div style={{ borderTop: "1px solid #808080", borderBottom: "1px solid #fff", margin: "3px 2px" }} />;
  }
  const lit = hover && !disabled;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        if (disabled) return;
        item.action && item.action();
        onChoose();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 20px 2px 4px",
        whiteSpace: "nowrap",
        cursor: "default",
        color: disabled ? "#808080" : lit ? "#fff" : "#000",
        textShadow: disabled ? "1px 1px 0 #fff" : "none",
        background: lit ? "#000080" : "transparent",
      }}
    >
      <span style={{ width: 12, textAlign: "center" }}>{item.checked ? "✓" : ""}</span>
      <span>{item.label}</span>
    </div>
  );
}

function Menu({ label, items, openName, setOpenName }) {
  const open = openName === label;
  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpenName(open ? null : label)}
        onMouseEnter={() => openName !== null && setOpenName(label)}
        style={{
          padding: "2px 7px",
          cursor: "default",
          background: open ? "#000080" : "transparent",
          color: open ? "#fff" : "#000",
        }}
      >
        {label}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: 150,
            zIndex: 1000,
            padding: 2,
            ...RAISED,
          }}
        >
          {items.map((it, i) => (
            <MenuItem key={i} item={it} onChoose={() => setOpenName(null)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MinesweeperApp({ onClose }) {
  const [diffKey, setDiffKey] = useState("beginner");
  const { cols, rows, mines } = DIFFICULTIES[diffKey];

  const [grid, setGrid] = useState([]);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [minesLeft, setMinesLeft] = useState(mines);
  const [timer, setTimer] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);
  const [pressed, setPressed] = useState([]); // cells shown depressed during a chord hold
  const [marksEnabled, setMarksEnabled] = useState(true); // Game > Marks (?) toggle
  const timerRef = useRef(null);
  const barRef = useRef(null);

  const initGrid = useCallback((cols, rows, mines) => {
    const total = cols * rows;
    const newGrid = Array(total)
      .fill(null)
      .map((_, i) => ({ id: i, isMine: false, isRevealed: false, isFlagged: false, isQuestioned: false, neighborMines: 0 }));

    let placed = 0;
    while (placed < mines) {
      const idx = Math.floor(Math.random() * total);
      if (!newGrid[idx].isMine) {
        newGrid[idx].isMine = true;
        placed++;
      }
    }

    newGrid.forEach((cell, i) => {
      if (cell.isMine) return;
      const r = Math.floor(i / cols);
      const c = i % cols;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr * cols + nc].isMine) n++;
        }
      }
      cell.neighborMines = n;
    });

    return newGrid;
  }, []);

  const startNewGame = useCallback(() => {
    setGrid(initGrid(cols, rows, mines));
    setStatus("playing");
    setMinesLeft(mines);
    setTimer(0);
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, [initGrid, cols, rows, mines]);

  // Runs on mount and whenever the difficulty changes (which changes the deps of
  // startNewGame) — switching difficulty restarts at the new board size, like
  // 98.js.org's set_difficulty -> new_game.
  useEffect(() => {
    startNewGame();
    return () => clearInterval(timerRef.current);
  }, [startNewGame]);

  // Close an open menu when clicking anywhere outside the menu bar.
  useEffect(() => {
    if (!openMenu) return;
    const onDocDown = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [openMenu]);

  const reveal = (idx) => {
    if (status !== "playing" || grid[idx].isRevealed || grid[idx].isFlagged) return;

    const newGrid = [...grid];
    if (!timerRef.current) {
      timerRef.current = setInterval(() => setTimer((t) => Math.min(t + 1, 999)), 1000);
    }

    if (newGrid[idx].isMine) {
      newGrid.forEach((cell) => {
        if (cell.isMine) cell.isRevealed = true;
      });
      setGrid(newGrid);
      setStatus("lost");
      clearInterval(timerRef.current);
      return;
    }

    const flood = (i) => {
      if (newGrid[i].isRevealed || newGrid[i].isFlagged) return;
      newGrid[i].isRevealed = true;
      if (newGrid[i].neighborMines === 0 && !newGrid[i].isMine) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) flood(nr * cols + nc);
          }
        }
      }
    };
    flood(idx);

    const remaining = newGrid.filter((c) => !c.isRevealed && !c.isMine).length;
    if (remaining === 0) {
      setStatus("won");
      clearInterval(timerRef.current);
    }
    setGrid(newGrid);
  };

  // Right-click cycles: blank -> flag -> question (if Marks enabled) -> blank.
  // Only flags count against the mine counter; a "?" can still be revealed/chorded.
  const cycleMark = (e, idx) => {
    e.preventDefault();
    if (status !== "playing" || grid[idx].isRevealed) return;
    const newGrid = [...grid];
    const cell = newGrid[idx];
    if (cell.isFlagged) {
      cell.isFlagged = false;
      setMinesLeft((prev) => prev + 1);
      cell.isQuestioned = marksEnabled; // flag -> question (or blank if marks off)
    } else if (cell.isQuestioned) {
      cell.isQuestioned = false; // question -> blank
    } else {
      cell.isFlagged = true; // blank -> flag
      setMinesLeft((prev) => prev - 1);
    }
    setGrid(newGrid);
  };

  // "Chord": on a revealed number whose flagged-neighbour count equals the
  // number, reveal all the remaining (unflagged) neighbours in one go. If a
  // flag was wrong, this hits a mine and loses — same as the real game.
  const chord = (idx) => {
    if (status !== "playing") return;
    const cell = grid[idx];
    if (!cell.isRevealed || cell.isMine || cell.neighborMines === 0) return;

    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const neighbors = [];
    let flags = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const ni = nr * cols + nc;
          neighbors.push(ni);
          if (grid[ni].isFlagged) flags++;
        }
      }
    }
    if (flags !== cell.neighborMines) return; // only when flags match the number

    const newGrid = [...grid];
    const flood = (i) => {
      if (newGrid[i].isRevealed || newGrid[i].isFlagged) return;
      newGrid[i].isRevealed = true;
      if (newGrid[i].neighborMines === 0 && !newGrid[i].isMine) {
        const rr = Math.floor(i / cols);
        const cc = i % cols;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = rr + dr;
            const nc = cc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) flood(nr * cols + nc);
          }
        }
      }
    };

    let hitMine = false;
    for (const ni of neighbors) {
      if (newGrid[ni].isFlagged || newGrid[ni].isRevealed) continue;
      if (newGrid[ni].isMine) {
        newGrid[ni].isRevealed = true;
        hitMine = true;
        continue;
      }
      flood(ni);
    }

    if (hitMine) {
      newGrid.forEach((cl) => {
        if (cl.isMine) cl.isRevealed = true;
      });
      setGrid(newGrid);
      setStatus("lost");
      clearInterval(timerRef.current);
      return;
    }
    const remaining = newGrid.filter((cl) => !cl.isRevealed && !cl.isMine).length;
    if (remaining === 0) {
      setStatus("won");
      clearInterval(timerRef.current);
    }
    setGrid(newGrid);
  };

  // Unrevealed, unflagged neighbours of a cell.
  const unopenedNeighbors = (idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const ni = nr * cols + nc;
          if (!grid[ni].isRevealed && !grid[ni].isFlagged) out.push(ni);
        }
      }
    }
    return out;
  };

  // While the chord buttons are held, depress the surrounding hidden tiles
  // (the classic "press-in" feedback); on release, resolve the chord.
  const startChordPreview = (idx) => {
    if (status !== "playing") return;
    setPressed(unopenedNeighbors(idx));
    const onUp = () => {
      window.removeEventListener("mouseup", onUp);
      setPressed([]);
      chord(idx);
    };
    window.addEventListener("mouseup", onUp);
  };

  // Menu definitions — working items act; the rest are present-but-disabled,
  // mirroring 98.js.org (Custom/Marks/Color/Best Times are TODO stubs there too).
  const gameItems = [
    { label: "New", action: startNewGame },
    { divider: true },
    { label: "Beginner", checked: diffKey === "beginner", action: () => setDiffKey("beginner") },
    { label: "Intermediate", checked: diffKey === "intermediate", action: () => setDiffKey("intermediate") },
    { label: "Expert", checked: diffKey === "expert", action: () => setDiffKey("expert") },
    { label: "Custom...", enabled: false },
    { divider: true },
    { label: "Marks (?)", checked: marksEnabled, action: () => setMarksEnabled((m) => !m) },
    { label: "Color", enabled: false },
    { divider: true },
    { label: "Best Times...", enabled: false },
    { divider: true },
    { label: "Exit", action: () => onClose && onClose() },
  ];
  const helpItems = [
    { label: "Help Topics", enabled: false },
    { divider: true },
    {
      label: "About Minesweeper...",
      action: () => alert("Minesweeper\n\nA Windows 98–style clone built for this desktop."),
    },
  ];

  return (
    <div style={{ background: "#c0c0c0", userSelect: "none", width: "fit-content" }}>
      {/* Menu bar */}
      <div ref={barRef} style={{ display: "flex", fontSize: 11, padding: "1px 1px 2px" }}>
        <Menu label="Game" items={gameItems} openName={openMenu} setOpenName={setOpenMenu} />
        <Menu label="Help" items={helpItems} openName={openMenu} setOpenName={setOpenMenu} />
      </div>

      {/* Game */}
      <div style={{ padding: 8 }}>
        <div
          style={{
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: "fit-content",
            ...RAISED,
            border: "3px solid",
            borderColor: "#fff #808080 #808080 #fff",
          }}
        >
          {/* Header: mines-left counter, reset face, timer. */}
          <div
            style={{
              padding: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 6,
              background: "#c0c0c0",
              ...SUNKEN,
            }}
          >
            <SevenSeg val={minesLeft} />
            <button
              onClick={startNewGame}
              style={{
                minWidth: 26,
                width: 26,
                height: 26,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                ...RAISED,
              }}
            >
              <Face status={status} />
            </button>
            <SevenSeg val={timer} />
          </div>

          {/* Board */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 16px)`,
              gridTemplateRows: `repeat(${rows}, 16px)`,
              border: "3px solid",
              borderColor: "#808080 #fff #fff #808080",
              background: "#bdbdbd",
            }}
          >
            {grid.map((cell, i) => (
              <div
                key={i}
                onMouseDown={(e) => {
                  // Chord: middle button, or left+right held together — show the
                  // press-in preview and resolve on release.
                  if (e.button === 1 || ((e.buttons & 1) && (e.buttons & 2))) {
                    e.preventDefault();
                    startChordPreview(i);
                    return;
                  }
                  if (e.button === 0) reveal(i);
                  else cycleMark(e, i);
                }}
                onDoubleClick={() => chord(i)}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  width: 16,
                  height: 16,
                  boxSizing: "border-box",
                  fontSize: 11,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "default",
                  color: NUM_COLORS[cell.neighborMines],
                  ...(cell.isRevealed || pressed.includes(i)
                    ? { border: "1px solid #7b7b7b", background: "#bdbdbd" }
                    : { border: "2px solid", borderColor: "#fff #7b7b7b #7b7b7b #fff" }),
                }}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    <img
                      src="/win98/icons/mine.png"
                      width={14}
                      height={14}
                      alt="mine"
                      style={{ display: "block", objectFit: "contain" }}
                    />
                  ) : (
                    cell.neighborMines || ""
                  )
                ) : cell.isFlagged ? (
                  <Flag />
                ) : cell.isQuestioned ? (
                  <span style={{ color: "#000", fontWeight: "bold", fontSize: 12 }}>?</span>
                ) : (
                  ""
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

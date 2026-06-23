"use client";

import { useEffect, useState } from "react";

const PLAYER_COLORS = [
  { name: "赤", color: "#e53935" },
  { name: "青", color: "#1e88e5" },
  { name: "黄", color: "#fbc02d" },
  { name: "緑", color: "#43a047" },
];

const TIME_OPTIONS = [1, 3, 5];

export default function Home() {
  const [playerCount, setPlayerCount] = useState(4);
  const [timeLimit, setTimeLimit] = useState(5);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [running, setRunning] = useState(false);
  const [pressed, setPressed] = useState(false);

  const players = PLAYER_COLORS.slice(0, playerCount);

  useEffect(() => {
    if (!running || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [running, timeLeft]);

  const vibrate = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  };

  const resetGame = (count = playerCount, limit = timeLimit) => {
    setTimeLeft(limit * 60);
    setCurrentPlayer(0);
    setScores(Array(count).fill(0));
    setRunning(false);
    setPressed(false);
  };

  const changePlayerCount = (count: number) => {
    setPlayerCount(count);
    resetGame(count, timeLimit);
  };

  const changeTimeLimit = (limit: number) => {
    setTimeLimit(limit);
    resetGame(playerCount, limit);
  };

  const pressButton = () => {
    if (timeLeft <= 0) return;

    vibrate();

    setPressed(true);
    setTimeout(() => setPressed(false), 120);

    setRunning(true);

    setScores((prev) => {
      const next = [...prev];
      next[currentPlayer] += 1;
      return next;
    });

    setCurrentPlayer((p) => (p + 1) % playerCount);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentColor = players[currentPlayer].color;
  const currentTextColor =
    players[currentPlayer].name === "黄" ? "#333" : "white";

  return (
    <main style={styles.main}>
      <div style={styles.selectArea}>
        <div style={styles.selectGroup}>
          <div style={styles.label}>人数</div>
          <div style={styles.buttonRow}>
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => changePlayerCount(count)}
                style={{
                  ...styles.selectButton,
                  ...(playerCount === count ? styles.selectButtonActive : {}),
                }}
              >
                {count}人
              </button>
            ))}
          </div>
        </div>

        <div style={styles.selectGroup}>
          <div style={styles.label}>制限時間</div>
          <div style={styles.buttonRow}>
            {TIME_OPTIONS.map((limit) => (
              <button
                key={limit}
                onClick={() => changeTimeLimit(limit)}
                style={{
                  ...styles.selectButton,
                  ...(timeLimit === limit ? styles.selectButtonActive : {}),
                }}
              >
                {limit}分
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.timer}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>

      <div
        style={{
          ...styles.current,
          background: currentColor,
          color: currentTextColor,
        }}
      >
        現在：{players[currentPlayer].name}プレイヤー
      </div>

      <button
        onClick={pressButton}
        disabled={timeLeft <= 0}
        style={{
          ...styles.bigButton,
          ...(pressed ? styles.bigButtonPressed : {}),
          ...(timeLeft <= 0 ? styles.disabledButton : {}),
        }}
      >
        言えた！
      </button>

      <div style={styles.scores}>
        {players.map((player, i) => (
          <div
            key={player.name}
            style={{
              ...styles.scoreCard,
              background: player.color,
              color: player.name === "黄" ? "#333" : "white",
            }}
          >
            <div>{player.name}</div>
            <strong>{scores[i]}駅</strong>
          </div>
        ))}
      </div>

      <button onClick={() => resetGame()} style={styles.resetButton}>
        リセット
      </button>

      {timeLeft <= 0 && <div style={styles.end}>終了！</div>}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    fontFamily: "sans-serif",
    background: "#f5f5f5",
  },

  selectArea: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  selectGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },

  label: {
    fontSize: 16,
    fontWeight: "bold",
  },

  buttonRow: {
    display: "flex",
    gap: 10,
  },

  selectButton: {
    padding: "10px 20px",
    fontSize: 18,
    borderRadius: 999,
    border: "2px solid #999",
    background: "white",
    cursor: "pointer",
  },

  selectButtonActive: {
    background: "#222",
    color: "white",
    borderColor: "#222",
  },

  timer: {
    fontSize: 64,
    fontWeight: "bold",
  },

  current: {
    fontSize: 28,
    fontWeight: "bold",
    padding: "12px 28px",
    borderRadius: 999,
  },

  bigButton: {
    width: 250,
    height: 250,
    borderRadius: "50%",
    fontSize: 40,
    fontWeight: "bold",
    border: "8px solid #8b0000",
    background:
      "radial-gradient(circle at 35% 30%, #ff9999, #e60000 45%, #8b0000 100%)",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 18px 0 #4a0000, 0 28px 36px rgba(0,0,0,0.35)",
    transform: "translateY(0)",
    transition: "transform 0.08s ease, box-shadow 0.08s ease",
  },

  bigButtonPressed: {
    transform: "translateY(16px)",
    boxShadow: "0 2px 0 #4a0000, 0 10px 18px rgba(0,0,0,0.35)",
  },

  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  scores: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  scoreCard: {
    padding: 16,
    borderRadius: 12,
    minWidth: 90,
    textAlign: "center",
    fontSize: 20,
  },

  resetButton: {
    padding: "12px 24px",
    fontSize: 18,
    borderRadius: 8,
    border: "1px solid #999",
    cursor: "pointer",
    background: "white",
  },

  end: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#d00000",
  },
};
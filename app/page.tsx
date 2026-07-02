"use client";

import { useEffect, useState } from "react";

type GameMode = "normal" | "special";
type EventType = "plus" | "minus" | "normal";

const PLAYER_COLORS = [
  { name: "赤", color: "#e53935" },
  { name: "青", color: "#1e88e5" },
  { name: "黄", color: "#fbc02d" },
  { name: "緑", color: "#43a047" },
];

const DEFAULT_TURN_TIME = 15;
const TURN_TIME_OPTIONS = [30];
const IS_DEV = process.env.NODE_ENV === "development";
const LOCK_SECONDS = IS_DEV ? 10 : 15 * 60;

export default function Home() {
  const [now, setNow] = useState(Date.now());
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [eventMessage, setEventMessage] = useState("");
  const [eventType, setEventType] = useState<EventType>("normal");
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [playerCount, setPlayerCount] = useState(4);
  const [turnTime, setTurnTime] = useState(DEFAULT_TURN_TIME);
  const [turnTimeLeft, setTurnTimeLeft] = useState(DEFAULT_TURN_TIME);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [eliminated, setEliminated] = useState([false, false, false, false]);
  const [running, setRunning] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const players = PLAYER_COLORS.slice(0, playerCount);
  const isLocked = lockedUntil !== null && now < lockedUntil;

  const remainingLockSeconds =
    lockedUntil !== null ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;

  const lockMinutes = Math.floor(remainingLockSeconds / 60);
  const lockSeconds = remainingLockSeconds % 60;

  useEffect(() => {
    const saved = localStorage.getItem("lockedUntil");
    if (saved) {
      const savedTime = Number(saved);
      if (Date.now() < savedTime) {
        setLockedUntil(savedTime);
      } else {
        localStorage.removeItem("lockedUntil");
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const findNextPlayer = (from: number, eliminatedList = eliminated) => {
    for (let i = 1; i <= playerCount; i++) {
      const next = (from + i) % playerCount;
      if (!eliminatedList[next]) return next;
    }
    return from;
  };

  const getAlivePlayers = (eliminatedList = eliminated) => {
    return eliminatedList
      .slice(0, playerCount)
      .map((isOut, i) => (!isOut ? i : null))
      .filter((v): v is number => v !== null);
  };

  useEffect(() => {
    if (!running || winner !== null || isLocked) return;

    const timer = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          setEliminated((prevEliminated) => {
            const nextEliminated = [...prevEliminated];
            nextEliminated[currentPlayer] = true;

            const alive = getAlivePlayers(nextEliminated);

            if (alive.length === 1) {
              const lockTime = Date.now() + LOCK_SECONDS * 1000;
              localStorage.setItem("lockedUntil", String(lockTime));
              setLockedUntil(lockTime);

              setWinner(alive[0]);
              setRunning(false);
              return nextEliminated;
            }

            setCurrentPlayer(findNextPlayer(currentPlayer, nextEliminated));
            setTurnTimeLeft(turnTime);

            return nextEliminated;
          });

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, currentPlayer, winner, playerCount, eliminated, turnTime, isLocked]);

  const vibrate = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  };

  const showEvent = (message: string, type: EventType) => {
    setEventMessage(message);
    setEventType(type);
    setTimeout(() => {
      setEventMessage("");
      setEventType("normal");
    }, 1500);
  };

  const resetGame = (count = playerCount, time = turnTime) => {
    setPlayerCount(count);
    setTurnTime(time);
    setTurnTimeLeft(time);
    setCurrentPlayer(0);
    setScores(Array(count).fill(0));
    setEliminated(Array(count).fill(false));
    setRunning(false);
    setPressed(false);
    setWinner(null);
    setEventMessage("");
    setEventType("normal");
  };

  const changePlayerCount = (count: number) => {
    resetGame(count, turnTime);
  };

  const changeTurnTime = (time: number) => {
    resetGame(playerCount, time);
  };

  const getRandomTurnTime = () => {
    if (gameMode !== "special") return turnTime;

    const r = Math.random();

    if (r < 0.05) {
      showEvent("信号トラブル！次の人 -7秒", "minus");
      return Math.max(5, turnTime - 7);
    }

    if (r < 0.1) {
      showEvent("駆け込み乗車！次の人 -5秒", "minus");
      return Math.max(5, turnTime - 5);
    }

    if (r < 0.2) {
      showEvent("遅延発生！次の人 -3秒", "minus");
      return Math.max(5, turnTime - 3);
    }

    if (r < 0.3) {
      showEvent("臨時列車！次の人 +5秒", "plus");
      return turnTime + 5;
    }

    if (r < 0.4) {
      showEvent("ドクターイエロー！次の人 +7秒", "plus");
      return turnTime + 7;
    }

    return turnTime;
  };

  const pressButton = () => {
    if (isLocked) return;
    if (winner !== null || eliminated[currentPlayer]) return;

    vibrate();

    setPressed(true);
    setTimeout(() => setPressed(false), 120);

    setRunning(true);

    setScores((prev) => {
      const next = [...prev];
      next[currentPlayer] += 1;
      return next;
    });

    setCurrentPlayer(findNextPlayer(currentPlayer));
    setTurnTimeLeft(getRandomTurnTime());
  };

  const current = players[currentPlayer];
  const currentTextColor = current.name === "黄" ? "#333" : "white";

  return (
    <main style={styles.main}>
      <div style={styles.selectGroup}>
        <div style={styles.label}>モード</div>

        <div style={styles.buttonRow}>
          <button
            onClick={() => setGameMode("normal")}
            style={{
              ...styles.selectButton,
              ...(gameMode === "normal" ? styles.selectButtonActive : {}),
            }}
          >
            通常版
          </button>

          <button
            onClick={() => setGameMode("special")}
            style={{
              ...styles.selectButton,
              ...(gameMode === "special" ? styles.selectButtonActive : {}),
            }}
          >
            特別版
          </button>
        </div>
      </div>

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
          <div style={styles.label}>1ターンの時間</div>
          <div style={styles.buttonRow}>
            {TURN_TIME_OPTIONS.map((time) => (
              <button
                key={time}
                onClick={() => changeTurnTime(time)}
                style={{
                  ...styles.selectButton,
                  ...(turnTime === time ? styles.selectButtonActive : {}),
                }}
              >
                {time}秒
              </button>
            ))}
          </div>
        </div>
      </div>

      {winner === null ? (
        <>
          <div
            style={{
              ...styles.current,
              background: current.color,
              color: currentTextColor,
            }}
          >
            現在：{current.name}プレイヤー
          </div>

          <div style={styles.currentTimer}>{turnTimeLeft}</div>
        </>
      ) : (
        <div
          style={{
            ...styles.current,
            background: players[winner].color,
            color: players[winner].name === "黄" ? "#333" : "white",
          }}
        >
          {players[winner].name}プレイヤー優勝！
        </div>
      )}

      {eventMessage && (
        <div
          style={{
            ...styles.eventMessage,
            ...(eventType === "minus" ? styles.minusEvent : {}),
            ...(eventType === "plus" ? styles.plusEvent : {}),
          }}
        >
          {eventMessage}
        </div>
      )}

      {isLocked && (
        <div style={styles.eventMessage}>
          次に遊べるまで {lockMinutes}:{String(lockSeconds).padStart(2, "0")}
        </div>
      )}

      <button
        onClick={pressButton}
        disabled={winner !== null || isLocked}
        style={{
          ...styles.bigButton,
          ...(pressed ? styles.bigButtonPressed : {}),
          ...(winner !== null || isLocked ? styles.disabledButton : {}),
        }}
      >
        言えた！
      </button>

      <div style={styles.playersArea}>
        {players.map((player, i) => (
          <div
            key={player.name}
            style={{
              ...styles.playerCard,
              background: player.color,
              color: player.name === "黄" ? "#333" : "white",
              opacity: eliminated[i] ? 0.35 : 1,
              outline:
                i === currentPlayer && winner === null ? "5px solid #222" : "none",
            }}
          >
            <div style={styles.playerName}>
              {player.name}
              {eliminated[i] && " 脱落"}
            </div>
            <strong>{scores[i]}駅</strong>
          </div>
        ))}
      </div>

      <button onClick={() => resetGame()} style={styles.resetButton}>
        リセット
      </button>
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
    gap: 22,
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 16,
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
    flexWrap: "wrap",
    justifyContent: "center",
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
    border: "2px solid #222",
  },

  current: {
    fontSize: 28,
    fontWeight: "bold",
    padding: "12px 28px",
    borderRadius: 999,
  },

  currentTimer: {
    fontSize: 96,
    fontWeight: "bold",
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

  playersArea: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  playerCard: {
    padding: 16,
    borderRadius: 14,
    minWidth: 115,
    textAlign: "center",
    fontSize: 20,
  },

  playerName: {
    fontWeight: "bold",
    marginBottom: 8,
  },

  resetButton: {
    padding: "12px 24px",
    fontSize: 18,
    borderRadius: 8,
    border: "1px solid #999",
    cursor: "pointer",
    background: "white",
  },

  eventMessage: {
    fontSize: 24,
    fontWeight: "bold",
    background: "white",
    padding: "10px 18px",
    borderRadius: 999,
    border: "2px solid #222",
  },

  minusEvent: {
    color: "red",
  },

  plusEvent: {
    color: "blue",
  },
};
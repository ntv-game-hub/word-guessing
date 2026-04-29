import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Decorations } from "./components/Decorations";
import { HOST_SESSION, PLAYER_SESSION } from "./constants";
import { CreateGameScreen } from "./screens/CreateGameScreen";
import { HostDashboard } from "./screens/HostDashboard";
import { JoinGameScreen } from "./screens/JoinGameScreen";
import { PlayerGameScreen } from "./screens/PlayerGameScreen";
import { RoleScreen } from "./screens/RoleScreen";
import type { GameState, Screen, SocketResponse } from "./types";
import { getQueryCode } from "./utils/navigation";
import { readSession, writeSession } from "./utils/wordGuessing";

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function AppShell() {
  const socket = useMemo<Socket>(
    () =>
      io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000
      }),
    []
  );
  const [screen, setScreen] = useState<Screen>("role");
  const [game, setGame] = useState<GameState | null>(null);
  const [hostToken, setHostToken] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(socket.connected);
  const [restoreTried, setRestoreTried] = useState(false);
  const restoreAttemptRef = useRef(0);

  useEffect(() => {
    const onConnect = () => {
      restoreAttemptRef.current += 1;
      setRestoreTried(false);
      setConnected(true);
    };
    const onDisconnect = () => setConnected(false);
    const onState = (state: GameState) => {
      setGame(state);
      if (state.viewer.role === "host") {
        setScreen("host");
      } else {
        setPlayerId(state.viewer.playerId || "");
        setScreen("player");
      }
    };
    const onError = (payload: { message?: string } | string) => {
      if (typeof payload === "string") {
        setNotice(payload);
        return;
      }
      setNotice(payload.message || "Có lỗi xảy ra. Thử lại nhé!");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game:state", onState);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game:state", onState);
      socket.off("error", onError);
    };
  }, [socket]);

  useEffect(() => {
    if (!connected || restoreTried) return;
    setRestoreTried(true);

    const savedHost = readSession<{ code: string; hostToken: string }>(HOST_SESSION);
    const savedPlayer = readSession<{ code: string; playerId: string }>(PLAYER_SESSION);
    const queryCode = getQueryCode();

    if (savedHost?.code && savedHost.hostToken) {
      socket.emit("game:get", { role: "host", code: savedHost.code, hostToken: savedHost.hostToken }, (res: SocketResponse) => {
        if (res.ok && res.state) {
          setHostToken(savedHost.hostToken);
          setGame(res.state);
          setScreen("host");
          return;
        }
        localStorage.removeItem(HOST_SESSION);
        setHostToken("");
        setGame(null);
        setScreen(queryCode ? "join" : "role");
      });
      return;
    }

    if (savedPlayer?.code && savedPlayer.playerId) {
      socket.emit("game:get", { role: "player", code: savedPlayer.code, playerId: savedPlayer.playerId }, (res: SocketResponse) => {
        if (res.ok && res.state && res.playerId) {
          setPlayerId(res.playerId);
          setGame(res.state);
          setScreen("player");
          return;
        }
        localStorage.removeItem(PLAYER_SESSION);
        setPlayerId("");
        setGame(null);
        setScreen(queryCode ? "join" : "role");
      });
      return;
    }

    if (queryCode) {
      setScreen("join");
    }
  }, [connected, restoreTried, socket]);

  const handleHome = () => {
    setGame(null);
    setHostToken("");
    setPlayerId("");
    setNotice("");
    setScreen("role");
    window.history.replaceState({}, "", window.location.pathname);
  };

  const handleCreateNewRoom = () => {
    const goCreate = () => {
      localStorage.removeItem(HOST_SESSION);
      setGame(null);
      setHostToken("");
      setNotice("");
      setScreen("create");
    };

    if (game && hostToken) {
      socket.emit("game:finish", { code: game.code, hostToken }, () => goCreate());
      return;
    }
    goCreate();
  };

  const handleJoinNewRoom = () => {
    localStorage.removeItem(PLAYER_SESSION);
    setGame(null);
    setPlayerId("");
    setNotice("");
    setScreen("join");
  };

  return (
    <main className="app-shell">
      <Decorations />
      <header className="topbar">
        <button className="brand" type="button" onClick={handleHome} aria-label="Về màn hình chính">
          <span className="brand-mark">
            <Sparkles size={24} />
          </span>
          <span>Ô Chữ Vui Vẻ</span>
          <span className={`connection ${connected ? "online" : "offline"}`}>
            <span />
            {connected ? "Online" : "Đang nối"}
          </span>
        </button>
      </header>

      {notice && (
        <button className="toast" type="button" onClick={() => setNotice("")}>
          {notice}
        </button>
      )}

      {screen === "role" && <RoleScreen onCreate={() => setScreen("create")} onJoin={() => setScreen("join")} />}
      {screen === "create" && (
        <CreateGameScreen
          socket={socket}
          onBack={() => setScreen("role")}
          onCreated={(state, token) => {
            setGame(state);
            setHostToken(token);
            setScreen("host");
            writeSession(HOST_SESSION, { code: state.code, hostToken: token });
          }}
          onError={setNotice}
        />
      )}
      {screen === "join" && (
        <JoinGameScreen
          socket={socket}
          onBack={() => setScreen("role")}
          onJoined={(state, joinedPlayerId) => {
            setGame(state);
            setPlayerId(joinedPlayerId);
            setScreen("player");
            writeSession(PLAYER_SESSION, { code: state.code, playerId: joinedPlayerId });
          }}
          onError={setNotice}
        />
      )}
      {screen === "host" && game && (
        <HostDashboard
          game={game}
          hostToken={hostToken}
          socket={socket}
          onError={setNotice}
          onHome={handleHome}
          onCreateNewRoom={handleCreateNewRoom}
        />
      )}
      {screen === "player" && game?.player && (
        <PlayerGameScreen
          game={game}
          player={game.player}
          playerId={playerId}
          socket={socket}
          onError={setNotice}
          onHome={handleHome}
          onJoinNewRoom={handleJoinNewRoom}
        />
      )}
    </main>
  );
}

export default AppShell;

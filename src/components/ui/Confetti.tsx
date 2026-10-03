interface Piece {
  dx: string;
  dy: string;
  rot: string;
  color: string;
  delay: string;
  round?: boolean;
}

const SMALL_BURST: Piece[] = [
  { dx: "-120px", dy: "-90px", rot: "220deg", color: "#00C9A7", delay: "0ms" },
  { dx: "110px", dy: "-100px", rot: "-180deg", color: "#F59E0B", delay: "40ms", round: true },
  { dx: "-150px", dy: "10px", rot: "160deg", color: "#FF6B4A", delay: "80ms" },
  { dx: "140px", dy: "20px", rot: "-240deg", color: "#60A5FA", delay: "20ms", round: true },
  { dx: "-60px", dy: "-140px", rot: "300deg", color: "#F59E0B", delay: "60ms" },
  { dx: "70px", dy: "-150px", rot: "-120deg", color: "#00C9A7", delay: "100ms", round: true },
  { dx: "-100px", dy: "90px", rot: "200deg", color: "#60A5FA", delay: "120ms" },
  { dx: "100px", dy: "100px", rot: "-200deg", color: "#FF6B4A", delay: "90ms", round: true },
];

/** Computed from the index, so the burst is the same on every render. */
const BIG_BURST: Piece[] = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const dist = 140 + ((i * 37) % 90);
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist * 0.8 + 60)}px`,
    rot: `${(i * 97) % 360}deg`,
    color: ["#00C9A7", "#FF9F43", "#F59E0B", "#60A5FA", "#F472B6"][i % 5],
    delay: `${(i % 6) * 30}ms`,
    round: i % 3 === 0,
  };
});

const BURSTS = { small: SMALL_BURST, big: BIG_BURST };

/** A burst from the centre of its relative parent. */
export default function Confetti({ burst = "small" }: { burst?: keyof typeof BURSTS }) {
  return (
    <>
      {BURSTS[burst].map((piece, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`story-confetti absolute left-1/2 top-1/2 h-2.5 w-2.5 ${piece.round ? "rounded-full" : "rounded-sm"}`}
          style={{
            background: piece.color,
            animationDelay: piece.delay,
            ["--dx" as string]: piece.dx,
            ["--dy" as string]: piece.dy,
            ["--rot" as string]: piece.rot,
          }}
        />
      ))}
    </>
  );
}

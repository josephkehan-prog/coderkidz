import { useEffect, useRef } from "react";
import { BUILDINGS, GRID_HEIGHT, GRID_WIDTH, type CityState } from "../sim/types.js";

const TILE = 34;

export function CityCanvas({ city }: { city: CityState }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#a7d78a" : "#9ccf7e";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    ctx.font = `${TILE - 8}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const tile of Object.values(city.tiles)) {
      if (tile.building === "road") {
        ctx.fillStyle = "#8a8f98";
        ctx.fillRect(tile.x * TILE + 2, tile.y * TILE + 2, TILE - 4, TILE - 4);
      } else {
        ctx.fillText(
          BUILDINGS[tile.building].emoji,
          tile.x * TILE + TILE / 2,
          tile.y * TILE + TILE / 2 + 2,
        );
      }
    }
  }, [city]);

  return (
    <canvas
      ref={ref}
      width={GRID_WIDTH * TILE}
      height={GRID_HEIGHT * TILE}
      className="city-canvas"
      aria-label={`Map of ${city.name}`}
    />
  );
}

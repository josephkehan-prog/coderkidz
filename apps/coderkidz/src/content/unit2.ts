// Unit 2 — Growth. Concepts: for loops, range, while loops.
import { countOf, graded, type UnitSpec } from "../challenges/types.js";

export const unit2: UnitSpec = {
  id: "u2-growth",
  title: "Boom Town",
  concept: "for loops, range(), while loops",
  challenges: [
    {
      id: "u2-road-loop",
      unitId: "u2-growth",
      title: "The Highway",
      prompt:
        "Paving roads one line at a time is slow. Use a **for loop** to build a road at every x from 0 to 7 along row y=6.",
      starterCode:
        'from city import city\n\nfor x in range(8):\n    city.build("road", x, 6)\n',
      hints: [
        "range(8) counts 0,1,2,3,4,5,6,7.",
        "The loop variable x becomes each number in turn.",
      ],
      validate: ({ city }) => {
        const roads = countOf(city, "road");
        return roads >= 8
          ? graded(true, "8 roads with 2 lines of code. That's the power of loops!")
          : graded(false, `Only ${roads} roads. The loop should build 8.`);
      },
    },
    {
      id: "u2-block-of-houses",
      unitId: "u2-growth",
      title: "Housing Block",
      prompt: "Use a loop to build **5 houses in a row** along y=3.",
      starterCode: "from city import city\n\n# loop to build 5 houses at y=3\n",
      hints: ["Start from the highway loop and change the building and range.", 'city.build("house", x, 3) inside the loop.'],
      validate: ({ city }) =>
        countOf(city, "house") >= 5
          ? graded(true, "20 new residents have room now.")
          : graded(false, `${countOf(city, "house")} house(s) built — the loop should make 5.`),
    },
    {
      id: "u2-grid-town",
      unitId: "u2-growth",
      title: "The Grid",
      prompt:
        "Real cities are grids. Use a **loop inside a loop** to build houses in a 4-wide, 3-tall block (12 houses).\n\nCareful with money: 12 houses cost 360 and you only have 200 — so **demolish nothing, build 6 houses and 6 roads instead**: houses on rows y=0 and y=1 (4 wide is too pricey — make it 3 wide), roads on row y=2.",
      starterCode:
        'from city import city\n\nfor x in range(3):\n    for y in range(2):\n        city.build("house", x, y)\n\n# now a loop for 3 roads on row y=2\n',
      hints: [
        "The inner loop runs completely for every step of the outer loop.",
        "6 houses = 180 coins, 3 roads = 15. Total 195 — just fits!",
      ],
      validate: ({ city }) => {
        const houses = countOf(city, "house");
        const roads = countOf(city, "road");
        if (houses >= 6 && roads >= 3) return graded(true, "A real city block, built by nested loops.");
        return graded(false, `Have ${houses} houses and ${roads} roads — need 6 and 3.`);
      },
    },
    {
      id: "u2-countdown",
      unitId: "u2-growth",
      title: "Rocket Countdown",
      prompt:
        "The city is launching a fireworks rocket. Print a countdown from **5 to 1**, then print **Liftoff!**",
      starterCode: "# countdown loop, then the liftoff message\n",
      hints: [
        "range(5, 0, -1) counts 5,4,3,2,1.",
        "The Liftoff! print goes AFTER the loop (not indented).",
      ],
      validate: ({ stdout }) => {
        const wants = ["5", "4", "3", "2", "1"];
        const lines = stdout.split("\n").map((l) => l.trim());
        const hasCount = wants.every((n) => lines.includes(n));
        const hasLiftoff = stdout.toLowerCase().includes("liftoff");
        if (hasCount && hasLiftoff) return graded(true, "🚀 Perfect launch!");
        if (!hasCount) return graded(false, "Print each number 5 down to 1 on its own line.");
        return graded(false, "Countdown works — now print Liftoff! after the loop.");
      },
    },
    {
      id: "u2-farm-belt",
      unitId: "u2-growth",
      title: "Feed the Town",
      prompt:
        "Each farm feeds 10 people. Use a loop to build **3 farms** so the town can feed 30.",
      starterCode: "from city import city\n\n# loop to build 3 farms\n",
      hints: ["Farms cost 40 each — 3 farms = 120 coins.", "Pick a row and loop x across it."],
      validate: ({ city }) =>
        countOf(city, "farm") >= 3
          ? graded(true, "Food for 30! No hungry citizens here.")
          : graded(false, `${countOf(city, "farm")} farm(s) — the loop should build 3.`),
    },
    {
      id: "u2-while-savings",
      unitId: "u2-growth",
      title: "Spend Until Broke(ish)",
      prompt:
        "The council says: pave roads **while** the treasury has more than 150 coins.\n\nUse a `while` loop that checks `city.money` and builds one road each time.",
      starterCode:
        'from city import city\n\nx = 0\nwhile city.money > 150:\n    city.build("road", x, 9)\n    x = x + 1\n',
      hints: [
        "The while loop keeps going as long as the condition is True.",
        "Move x each time or you'll build on the same spot (error!).",
      ],
      validate: ({ city }) =>
        city.money <= 150 && countOf(city, "road") >= 10
          ? graded(true, "Stopped at exactly the right time. That's a while loop.")
          : graded(false, `Money is ${city.money} with ${countOf(city, "road")} roads. Keep building while money > 150.`),
    },
    {
      id: "u2-first-days",
      unitId: "u2-growth",
      title: "Open the Gates",
      prompt:
        "Time to let people in! Build **2 houses** and **1 farm**, then call `city.run_days(10)` to simulate 10 days. Watch the population grow — print it at the end.",
      starterCode:
        "from city import city\n\n# build, then run_days(10), then print city.population\n",
      hints: [
        "People move in one per day while there's room and food.",
        "print(city.population) after run_days.",
      ],
      validate: ({ city, stdout }) => {
        if (city.day < 10) return graded(false, "Run the simulation: city.run_days(10).");
        if (city.population < 1) return graded(false, "Nobody moved in — do they have houses AND food?");
        if (!stdout.includes(String(city.population)))
          return graded(false, "Now print(city.population) so the council can celebrate.");
        return graded(true, `${city.population} citizens after ${city.day} days!`);
      },
    },
    {
      id: "u2-boom-town",
      unitId: "u2-growth",
      title: "Boom Town",
      prompt:
        "Season finale! Using loops, build a town with **at least 15 buildings** (any mix — watch the budget), then `run_days(15)` and end with population above 5.",
      starterCode: "from city import city\n\n# your loop-powered master plan\n",
      hints: [
        "Roads are cheap (5) — great for hitting 15 buildings.",
        "Population needs houses (room) and farms (food) to grow.",
      ],
      validate: ({ city }) => {
        const total = Object.keys(city.tiles).length;
        if (total < 15) return graded(false, `${total} buildings — loops can get you to 15.`);
        if (city.day < 15) return graded(false, "Now run the town: city.run_days(15).");
        if (city.population <= 5)
          return graded(false, `Population is ${city.population}. More houses + farms = more growth.`);
        return graded(
          true,
          `Boom! ${total} buildings, ${city.population} citizens.`,
          city.population >= 8 ? 3 : 2,
        );
      },
    },
  ],
};

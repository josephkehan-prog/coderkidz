// Unit 1 — Founding. Concepts: print, variables, math expressions.
import { countOf, graded, type UnitSpec } from "../challenges/types.js";

export const unit1: UnitSpec = {
  id: "u1-founding",
  title: "Founding Day",
  concept: "print(), variables, and math",
  challenges: [
    {
      id: "u1-hello-mayor",
      unitId: "u1-founding",
      title: "Hello, Mayor!",
      prompt:
        "You just got elected mayor! Introduce yourself to the city.\n\nUse `print()` to say hello — print at least one message.",
      starterCode: '# Type your greeting below\nprint("Hello, ")\n',
      hints: [
        "print() shows text on the screen.",
        'Text goes inside quotes: print("Hello, city!")',
      ],
      validate: ({ stdout }) =>
        stdout.trim().length > 0
          ? graded(true, "The city hears you loud and clear!")
          : graded(false, "Nothing was printed. Use print() with some text inside quotes."),
    },
    {
      id: "u1-name-the-town",
      unitId: "u1-founding",
      title: "Name the Town",
      prompt:
        "Every city needs a name.\n\nImport the city module and use `city.set_name(...)` to give your town a real name.",
      starterCode: 'from city import city\n\ncity.set_name("?")\n',
      hints: [
        "Put your town's name inside the quotes.",
        'city.set_name("Starville") names the town Starville.',
      ],
      validate: ({ city }) =>
        city.name !== "New Town" && city.name !== "?"
          ? graded(true, `Welcome to ${city.name}!`)
          : graded(false, "The town is still unnamed. Change the text inside set_name()."),
    },
    {
      id: "u1-first-house",
      unitId: "u1-founding",
      title: "The First House",
      prompt:
        "People want to move in! Build the town's first house.\n\nUse `city.build(\"house\", x, y)` — pick any spot on the map (x is 0-15, y is 0-11).",
      starterCode: 'from city import city\n\ncity.build("house", 5, 5)\n',
      hints: ["The map is a grid. (0, 0) is the top-left corner.", "A house costs 30 coins — you start with 200."],
      validate: ({ city }) =>
        countOf(city, "house") >= 1
          ? graded(true, "First family moved in!")
          : graded(false, 'No house yet. Call city.build("house", x, y).'),
    },
    {
      id: "u1-main-street",
      unitId: "u1-founding",
      title: "Main Street",
      prompt: "A town needs roads. Build **3 roads** anywhere on the map.",
      starterCode:
        'from city import city\n\ncity.build("road", 4, 6)\n# build two more roads below\n',
      hints: [
        "Copy the build line and change the numbers.",
        "Two buildings can't share a spot — use different coordinates.",
      ],
      validate: ({ city }) => {
        const roads = countOf(city, "road");
        return roads >= 3
          ? graded(true, `${roads} roads paved. Traffic is flowing!`)
          : graded(false, `Only ${roads} road(s) so far — the town needs 3.`);
      },
    },
    {
      id: "u1-budget-math",
      unitId: "u1-founding",
      title: "The Budget Meeting",
      prompt:
        "The council asks: **how much would 2 houses and 1 park cost?**\n\nA house costs 30, a park costs 25. Store the prices in variables, calculate the total with math, and `print()` the answer.",
      starterCode: "house_cost = 30\npark_cost = 25\n\n# calculate and print the total\n",
      hints: [
        "total = house_cost * 2 + park_cost",
        "Then print(total).",
      ],
      validate: ({ stdout }) =>
        stdout.includes("85")
          ? graded(true, "Correct! 2 × 30 + 25 = 85 coins.")
          : graded(false, "The council needs the number. Calculate 2 houses + 1 park and print it."),
    },
    {
      id: "u1-shopping-district",
      unitId: "u1-founding",
      title: "Open for Business",
      prompt:
        "Time to earn money. Build **1 shop** and **1 house** so the shop has customers nearby.",
      starterCode: "from city import city\n\n# build a shop and a house\n",
      hints: ['city.build("shop", 8, 5) and city.build("house", 9, 5).', "A shop costs 60 coins."],
      validate: ({ city }) =>
        countOf(city, "shop") >= 1 && countOf(city, "house") >= 1
          ? graded(true, "The shop has its first neighbors!")
          : graded(false, "The city needs at least one shop AND one house."),
    },
    {
      id: "u1-park-promise",
      unitId: "u1-founding",
      title: "The Park Promise",
      prompt:
        "You promised voters green space! Build **2 parks**, then print how much money the city has left using `city.money`.",
      starterCode: "from city import city\n\n# build 2 parks, then print city.money\n",
      hints: ["Parks cost 25 each.", "print(city.money) shows the treasury."],
      validate: ({ city, stdout }) => {
        if (countOf(city, "park") < 2) return graded(false, "Voters are waiting — build 2 parks.");
        if (!stdout.includes(String(city.money)))
          return graded(false, "Parks built! Now print(city.money) so the council sees the balance.");
        return graded(true, "Promise kept, books balanced.");
      },
    },
    {
      id: "u1-grand-opening",
      unitId: "u1-founding",
      title: "Grand Opening",
      prompt:
        "Founding festival! Make the town complete:\n\n- a real name\n- at least 1 house, 1 shop, 1 park\n- at least 3 roads\n\nThen print a festival announcement.",
      starterCode: "from city import city\n\n# your whole founding plan goes here\n",
      hints: [
        "Do it step by step: name, house, shop, park, roads.",
        "You start with 200 coins: 30 + 60 + 25 + 3×5 = 130. It fits!",
      ],
      validate: ({ city, stdout }) => {
        const missing: string[] = [];
        if (city.name === "New Town") missing.push("a name");
        if (countOf(city, "house") < 1) missing.push("a house");
        if (countOf(city, "shop") < 1) missing.push("a shop");
        if (countOf(city, "park") < 1) missing.push("a park");
        if (countOf(city, "road") < 3) missing.push("3 roads");
        if (stdout.trim().length === 0) missing.push("a printed announcement");
        return missing.length === 0
          ? graded(true, `${city.name} is officially founded! 🎉`)
          : graded(false, `Almost! Still missing: ${missing.join(", ")}.`);
      },
    },
  ],
};

// Unit 4 — Services. Concepts: def, parameters, return values. Capstone.
import { prosperity } from "../sim/engine.js";
import { countOf, graded, type UnitSpec } from "../challenges/types.js";

export const unit4: UnitSpec = {
  id: "u4-services",
  title: "City Services",
  concept: "functions: def, parameters, return",
  challenges: [
    {
      id: "u4-build-block",
      unitId: "u4-services",
      title: "The Block Builder",
      prompt:
        "City crews repeat the same job everywhere. Write a **function** `block(x)` that builds a house at (x, 2) and a road at (x, 3). Call it for x = 0, 1, and 2.",
      starterCode:
        'from city import city\n\ndef block(x):\n    city.build("house", x, 2)\n    city.build("road", x, 3)\n\nblock(0)\n# call it two more times\n',
      hints: [
        "def creates the function; calling block(1) runs it with x = 1.",
        "3 houses + 3 roads = 105 coins.",
      ],
      validate: ({ city }) =>
        countOf(city, "house") >= 3 && countOf(city, "road") >= 3
          ? graded(true, "One function, three city blocks. Efficient!")
          : graded(false, "Call block(0), block(1), block(2) — expect 3 houses and 3 roads."),
    },
    {
      id: "u4-neighborhood",
      unitId: "u4-services",
      title: "Neighborhood Kit",
      prompt:
        "Level up: write `neighborhood(n)` that uses a **loop inside the function** to build n houses along row y=5. Call `neighborhood(4)`.",
      starterCode:
        "from city import city\n\ndef neighborhood(n):\n    # a for loop that builds n houses at y=5\n    pass\n\nneighborhood(4)\n",
      hints: ["for x in range(n): inside the function.", "4 houses = 120 coins."],
      validate: ({ city }) =>
        countOf(city, "house") >= 4
          ? graded(true, "A whole neighborhood from one function call.")
          : graded(false, "neighborhood(4) should leave 4 houses on the map."),
    },
    {
      id: "u4-price-function",
      unitId: "u4-services",
      title: "The Pricing Brain",
      prompt:
        "Turn your Unit 3 pricing rules into a reusable brain: write `best_price(pop)` that **returns** 2 if pop < 5, 3 if pop < 10, else 4.\n\nThe starter grows a town — finish by calling `city.set_price(best_price(city.population))`.",
      starterCode:
        'from city import city\n\ndef best_price(pop):\n    # return 2, 3, or 4 based on pop\n    pass\n\ncity.build("house", 1, 1)\ncity.build("house", 2, 1)\ncity.build("farm", 3, 1)\ncity.build("shop", 4, 1)\ncity.run_days(12)\n\ncity.set_price(best_price(city.population))\n',
      hints: [
        "return sends a value back to whoever called the function.",
        "Test it: print(best_price(3)) should show 2.",
      ],
      validate: ({ city }) => {
        const want = city.population < 5 ? 2 : city.population < 10 ? 3 : 4;
        return city.shopPrice === want
          ? graded(true, "The pricing brain works for ANY town size now.")
          : graded(false, `Population ${city.population} should give price ${want}, got ${city.shopPrice}.`);
      },
    },
    {
      id: "u4-report-function",
      unitId: "u4-services",
      title: "The Report Generator",
      prompt:
        "Write `report()` that **returns** a string like `Day 5: 8 people, 120 coins` using `city.day`, `city.population`, and `city.money`. The starter runs the town — print the report at the end.",
      starterCode:
        'from city import city\n\ndef report():\n    # build and return the report string\n    pass\n\ncity.build("house", 6, 6)\ncity.build("farm", 7, 6)\ncity.run_days(5)\nprint(report())\n',
      hints: [
        'f-strings make this easy: f"Day {city.day}: ..."',
        "return the string; print happens outside.",
      ],
      validate: ({ city, stdout }) => {
        const hasAll =
          stdout.includes(String(city.day)) &&
          stdout.includes(String(city.population)) &&
          stdout.includes(String(city.money));
        return hasAll
          ? graded(true, "A one-line dashboard for the whole city.")
          : graded(false, "The printed report must include the day, population, and money numbers.");
      },
    },
    {
      id: "u4-park-every",
      unitId: "u4-services",
      title: "Parks Department",
      prompt:
        "Write `park_row(y, count)` that builds `count` parks along row y — then use it ONCE to build 3 parks on row 8. Functions with two parameters!",
      starterCode:
        "from city import city\n\ndef park_row(y, count):\n    # loop count times, build parks along row y\n    pass\n\npark_row(8, 3)\n",
      hints: ["Two parameters, comma-separated: def park_row(y, count):", "3 parks = 75 coins."],
      validate: ({ city }) =>
        countOf(city, "park") >= 3
          ? graded(true, "The parks department runs itself now.")
          : graded(false, "park_row(8, 3) should leave 3 parks on the map."),
    },
    {
      id: "u4-profit-projection",
      unitId: "u4-services",
      title: "The Projection",
      prompt:
        "Investors ask: how much does a full shop earn in 30 days?\n\nWrite `projection(price, days)` that **returns** `5 * price * days` (5 customers a day), then print `projection(3, 30)`.",
      starterCode:
        "def projection(price, days):\n    # return the total earnings\n    pass\n\nprint(projection(3, 30))\n",
      hints: ["5 customers × price coins × days.", "5 * 3 * 30 = 450."],
      validate: ({ stdout }) =>
        stdout.includes("450")
          ? graded(true, "450 coins projected. The investors are in!")
          : graded(false, "projection(3, 30) should print 450."),
    },
    {
      id: "u4-capstone",
      unitId: "u4-services",
      title: "CAPSTONE: Shop Empire",
      prompt:
        "Run the whole economy for a month. Build any town you want, then `city.run_days(30)`.\n\nGraded on **prosperity** (population, treasury, happiness):\n\n- ⭐ prosperity 100+\n- ⭐⭐ prosperity 200+\n- ⭐⭐⭐ prosperity 300+\n\nUse everything: loops, ifs, functions, pricing.",
      starterCode:
        "from city import city\n\n# your empire. plan the build, set your price, run 30 days.\n",
      hints: [
        "Balance: houses for people, farms for food, shops for income, parks for happiness.",
        "More people = more customers, but only if they're fed and housed.",
        "Try different prices — greed can backfire.",
      ],
      validate: ({ city }) => {
        if (city.day < 30) return graded(false, "The month has to run: city.run_days(30).");
        const p = prosperity(city);
        if (p >= 300) return graded(true, `Prosperity ${p}. LEGENDARY. ⭐⭐⭐`, 3);
        if (p >= 200) return graded(true, `Prosperity ${p}. Strong economy! ⭐⭐`, 2);
        if (p >= 100) return graded(true, `Prosperity ${p}. A solid start. ⭐`, 1);
        return graded(false, `Prosperity ${p} — below 100. Feed, house, and employ your citizens.`);
      },
    },
  ],
};

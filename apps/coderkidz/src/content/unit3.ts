// Unit 3 — Events. Concepts: if / elif / else, comparisons, % (even/odd).
import { countOf, graded, type UnitSpec } from "../challenges/types.js";

export const unit3: UnitSpec = {
  id: "u3-events",
  title: "Storm Season",
  concept: "if / elif / else and comparisons",
  challenges: [
    {
      id: "u3-weather-check",
      unitId: "u3-events",
      title: "Rainy Day Plan",
      prompt:
        'The forecast is in the `weather` variable. **If** it\'s `"rain"`, print `Stay dry!`; **otherwise** print `Sunscreen on!`.\n\nThen change weather to "sun" and run again to see the other branch.',
      starterCode:
        'weather = "rain"\n\nif weather == "rain":\n    print("Stay dry!")\n# add the else branch\n',
      hints: [
        "== checks if two things are equal (= puts a value in a variable).",
        "else: lines up with if: and runs when the if is False.",
      ],
      validate: ({ stdout }) =>
        stdout.includes("Stay dry!") || stdout.includes("Sunscreen on!")
          ? graded(true, "The town is prepared for any weather.")
          : graded(false, "Print Stay dry! when it rains or Sunscreen on! otherwise."),
    },
    {
      id: "u3-affordable",
      unitId: "u3-events",
      title: "Can We Afford It?",
      prompt:
        "A shop costs 60. Write code that checks `city.money`: **if** there's at least 60, build the shop; **else** print `Saving up...`.\n\nYour code must work either way — the grader trusts the check, not luck.",
      starterCode:
        'from city import city\n\nif city.money >= 60:\n    city.build("shop", 7, 7)\nelse:\n    print("Saving up...")\n',
      hints: [">= means 'at least'.", "You start with 200, so the shop branch should run."],
      validate: ({ city, stdout }) =>
        countOf(city, "shop") >= 1 && !stdout.includes("Saving up")
          ? graded(true, "Checked the books, built the shop. Responsible!")
          : graded(false, "With 200 coins the if branch should build the shop."),
    },
    {
      id: "u3-lemonade-price",
      unitId: "u3-events",
      title: "Price the Lemonade",
      prompt:
        "Real business decision! Small towns need low prices; bigger towns can pay more.\n\nThe starter builds a town and runs 12 days. Then: **if** population is under 5, `city.set_price(2)`; **elif** under 10, price 3; **else** price 4.",
      starterCode:
        'from city import city\n\ncity.build("house", 2, 2)\ncity.build("house", 3, 2)\ncity.build("farm", 4, 2)\ncity.build("shop", 5, 2)\ncity.run_days(12)\n\n# your pricing rules here, using city.population\n',
      hints: [
        "elif means 'else, if' — Python checks them top to bottom.",
        "print(city.population) first if you want to see the number.",
      ],
      validate: ({ city }) => {
        const pop = city.population;
        const want = pop < 5 ? 2 : pop < 10 ? 3 : 4;
        return city.shopPrice === want
          ? graded(true, `Population ${pop}, price ${want}. Perfect pricing!`)
          : graded(false, `Population is ${pop} but the price is ${city.shopPrice}. Check your if/elif rules.`);
      },
    },
    {
      id: "u3-staff-the-store",
      unitId: "u3-events",
      title: "Second Location",
      prompt:
        "One shop serves about 5 customers a day. The starter grows the town — add a check: **if** population is more than 5, build a second shop.",
      starterCode:
        'from city import city\n\nfor x in range(2):\n    city.build("house", x, 1)\ncity.build("farm", 3, 1)\ncity.build("shop", 4, 1)\ncity.run_days(10)\n\n# if the town is big enough, open shop #2\n',
      hints: ["city.population > 5 is the check.", "Build the second shop at a free spot."],
      validate: ({ city }) => {
        if (city.population > 5 && countOf(city, "shop") >= 2)
          return graded(true, "Two locations! The mall era begins.");
        if (city.population > 5)
          return graded(false, `Population is ${city.population} — the if should build shop #2.`);
        return graded(false, "Let the starter code grow the town first, then add your check.");
      },
    },
    {
      id: "u3-happiness-guard",
      unitId: "u3-events",
      title: "The Happiness Inspector",
      prompt:
        "The starter makes a crowded, unhappy town. Add a rule: **if** `city.happiness` is below 50, build a park and print `Emergency park!`",
      starterCode:
        'from city import city\n\nfor x in range(3):\n    city.build("house", x, 0)\ncity.run_days(20)\n\n# inspector rule goes here\n',
      hints: [
        "No farms = hungry citizens = low happiness.",
        "Check city.happiness < 50, then build the park.",
      ],
      validate: ({ city, stdout }) =>
        countOf(city, "park") >= 1 && stdout.includes("Emergency park!")
          ? graded(true, "Crisis handled. The inspector is impressed.")
          : graded(false, "Happiness is low — the if should build a park AND print Emergency park!"),
    },
    {
      id: "u3-even-odd-streets",
      unitId: "u3-events",
      title: "Even & Odd Streets",
      prompt:
        "City planning pattern: loop x from 0 to 7 on row y=10 — on **even** x build a road, on **odd** x build a park. (Careful: 4 parks cost 100!)",
      starterCode:
        "from city import city\n\nfor x in range(8):\n    # if x is even: road, else: park\n    pass\n",
      hints: ["x % 2 == 0 is True for even numbers.", "Delete the pass line once you write real code."],
      validate: ({ city }) => {
        const roads = countOf(city, "road");
        const parks = countOf(city, "park");
        return roads >= 4 && parks >= 4
          ? graded(true, "Road, park, road, park — beautiful pattern.")
          : graded(false, `Have ${roads} roads, ${parks} parks — the pattern makes 4 of each.`);
      },
    },
    {
      id: "u3-city-inspector",
      unitId: "u3-events",
      title: "State of the City",
      prompt:
        "Write the mayor's report. Check `city.money`:\n\n- 150 or more → print `Rich town`\n- 50 to 149 → print `Doing fine`\n- under 50 → print `Tight budget`\n\nThe starter spends some money first — your report must print the right line for whatever is left.",
      starterCode:
        'from city import city\n\ncity.build("shop", 1, 1)\ncity.build("park", 2, 1)\ncity.build("road", 3, 1)\n\n# if / elif / else report on city.money\n',
      hints: ["200 - 60 - 25 - 5 = 110 left.", "Order matters: check the biggest tier first."],
      validate: ({ city, stdout }) => {
        const want =
          city.money >= 150 ? "Rich town" : city.money >= 50 ? "Doing fine" : "Tight budget";
        return stdout.includes(want)
          ? graded(true, `Money is ${city.money} — "${want}" is exactly right.`)
          : graded(false, `Money is ${city.money}. Which tier is that? Print the matching line.`);
      },
    },
  ],
};

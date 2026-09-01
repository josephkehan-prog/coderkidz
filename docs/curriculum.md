# Coderkidz — Semester 1 Scope & Sequence

Real Python, taught through running a simulated city. One unit = one
leaderboard **season**. 30 challenges total. Grade level: middle school
(designed for 6th grade), works for any beginner.

| # | Unit (Season) | Python concepts | Challenges | City payoff |
|---|---|---|---|---|
| 1 | Founding Day (`u1-founding`) | `print()`, variables, arithmetic | 8 | Found the town: name it, first buildings, budget math |
| 2 | Boom Town (`u2-growth`) | `for`, `range()`, nested loops, `while` | 8 | Build at scale — the city visibly explodes; first `run_days` simulation |
| 3 | Storm Season (`u3-events`) | `if` / `elif` / `else`, comparisons, `%` | 7 | React to the world: pricing, staffing, happiness emergencies |
| 4 | City Services (`u4-services`) | `def`, parameters, `return` | 7 | Reusable city crews; CAPSTONE: run a 30-day shop economy graded on prosperity |

## The scholar-facing API (`city` module)

```python
from city import city

city.build("house", x, y)   # house / shop / road / park / farm
city.demolish(x, y)
city.set_name("Starville")
city.set_price(3)           # 1..10, what every shop charges
city.run_days(10)           # simulate the economy

city.money  city.population  city.happiness  city.day  city.name
```

## Economy rules (deterministic — same code, same city)

- Start: 200 coins, empty 16×12 grid.
- Costs: road 5, park 25, house 30, farm 40, shop 60. Demolish refunds half.
- Each day: population +1 while happy (≥50) and housed; −1 when miserable (<30).
- Happiness = 50 + 5·parks − 20 if overcrowded − 20 if hungry (clamped 0–100).
- A house holds 4 people; a farm feeds 10.
- Shops: up to 5 customers/day each; demand falls as price rises
  (`floor(pop · (11 − price) / 10)`); income = customers × price.
- Upkeep: 1 coin per building per day.
- **Prosperity** (capstone + leaderboard bonus) = pop·10 + money/10 + happiness.

## Grading

- Validators check the **end state and stdout**, never the code text — any
  correct approach passes.
- Stars → XP: ★ 50, ★★ 75, ★★★ 100. Best attempt per challenge counts.
- Season score = XP + 10·stars + prosperity bonus, posted (best-wins) to the
  class leaderboard.

## Authoring a new challenge

Add a `ChallengeSpec` to the unit file in `apps/coderkidz/src/content/` —
id, prompt, starterCode, hints, and a pure `validate({city, stdout})`.
Budget-check the intended solution against the cost table above (start = 200),
then add a replay test in `content.test.ts`. Season config derives
automatically from the unit.

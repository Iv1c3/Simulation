// Импорты классов и утилит
import Organism from '../models/Organism';
import PlantFood from '../models/PlantFood';
import Hunter from '../models/Hunter';
import { randomBetween, randomGender, randomColor } from '../models/utils';

// Основной класс симуляции экосистемы
export default class EcoSimulation {
  constructor(params) {
    // Списки объектов
    this.creatures = []; // живые существа
    this.foods = [];     // пища
    this.hunters = [];   // хищники

    // Статистика симуляции
    this.stats = {
      oldAgeDeaths: 0,      // смерти от старости
      hungerDeaths: 0,      // смерти от голода
      eaten: 0,             // количество съеденной пищи
      born: 0,              // количество рожденных существ
      killedByHunter: 0     // количество убитых хищниками
    };

    this.params = params; // параметры симуляции
  }

  // Добавление случайного существа
  addRandomCreature() {
    this.creatures.push(new Organism(
      randomBetween(40, 860), // случайная позиция X
      randomBetween(40, 860), // случайная позиция Y
      randomGender(),         // случайный пол
      randomColor(),          // случайный цвет
      randomBetween(0, 40)    // случайный возраст
    ));
  }

  // Добавление существа с определёнными параметрами
  addCustomCreature(gender, color, age) {
    this.creatures.push(new Organism(
      randomBetween(40, 860),
      randomBetween(40, 860),
      gender,
      color,
      age
    ));
  }

  // Добавление еды
  addFood(n) {
    for (let i = 0; i < n; i++) {
      this.foods.push(new PlantFood(
        randomBetween(30, 870),
        randomBetween(30, 870)
      ));
    }
  }

  // Добавление хищника
  addHunter() {
    this.hunters.push(new Hunter(
      randomBetween(40, 860),
      randomBetween(40, 860),
      this.params.hunterCooldown,
      this.params.hunterSpeed
    ));
  }

  // Основной метод обновления симуляции
  update(dt) {
    // Перебор всех существ (обратный цикл для безопасного удаления в процессе)
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];

      // Обновление жизненного цикла существа
      if (c.update(dt)) {
        // Удаляем существо, если оно умерло
        if (c.energy <= 0) this.stats.hungerDeaths++;     // смерть от голода
        if (c.age > 80) this.stats.oldAgeDeaths++;        // смерть от старости
        this.creatures.splice(i, 1);
        continue;
      }

      // Провека на наличие поблизости хищника
      const escapeRadius = 120;
      let hunterNearby = null;
      for (const h of this.hunters) {
        if (c.distanceTo(h) < escapeRadius) {
          hunterNearby = h;
          break;
        }
      }

      // Побег от хищника
      if (hunterNearby) {
        const dx = c.x - hunterNearby.x;
        const dy = c.y - hunterNearby.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          c.dx = dx / dist;
          c.dy = dy / dist;
        }
        c.move(dt, 1.5); // ускоренное движение при побеге
      } else {
        // Поиск ближайшей еды, если голоден
        let closestFood = null, minDist = 9999;
        for (const f of this.foods) {
          const d = c.distanceTo(f);
          if (d < c.vision && d < minDist) {
            minDist = d;
            closestFood = f;
          }
        }

        // Движение к еде, если она найдена
        if (closestFood && c.isHungry) {
          const dx = closestFood.x - c.x, dy = closestFood.y - c.y;
          const d = Math.hypot(dx, dy);
          c.dx = dx / d;
          c.dy = dy / d;
          c.move(dt, 1.2); // немного быстрее при поиске еды
        } else {
          c.move(dt); // случайное движение
        }
      }

      // Проверка на факт поедания еды
      for (let j = this.foods.length - 1; j >= 0; j--) {
        const f = this.foods[j];
        if (c.distanceTo(f) < c.size + f.size) {
          c.energy = Math.min(120, c.energy + f.energy);   // восполнение энергии
          c.tired = Math.max(0, c.tired - 1.5);             // уменьшение усталости
          this.foods.splice(j, 1);                          // удалить съеденную еду
          this.stats.eaten++;
        }
      }

      // Попытка размножения
      for (const other of this.creatures) {
        if (other === c) continue;

        // Проверка на возможность размножения
        if (
          c.canBreedWith(
            other,
            this.params.breedMinAge,
            this.params.breedMaxAgeDiff
          ) &&
          c.distanceTo(other) < (c.size + other.size) * 0.7
        ) {
          // Успешное размножение с вероятностью breedChance
          if (Math.random() < (this.params.breedChance / 100) * dt) {
            const child = c.breedWith(other);    // потомок
            this.creatures.push(child);          // добавляем его в массив
            c.birthCooldown = this.params.breedCooldown;  // время до следующего рождения
            other.birthCooldown = this.params.breedCooldown;
            this.stats.born++;
          }
        }
      }
    }

    // Обновление хищников
    for (let h = 0; h < this.hunters.length; h++) {
      const hunter = this.hunters[h];
      hunter.speed = this.params.hunterSpeed;
      hunter.update(dt); // обновление логики хищника

      // Если хищник готов охотиться
      if (!hunter.waiting) {
        let minDist = 9999, target = null, tIndex = -1;

        // Поиск ближайшего существа
        for (let i = 0; i < this.creatures.length; i++) {
          const c = this.creatures[i];
          const d = hunter.distanceTo(c);
          if (d < minDist) {
            minDist = d;
            target = c;
            tIndex = i;
          }
        }

        // Если цель найдена — охотимся
        if (target) {
          hunter.moveToTarget(target, dt);

          // Если в радиусе атаки и перезарядка завершена — убить
          if (hunter.killCooldown <= 0 && minDist < hunter.size + target.size) {
            this.creatures.splice(tIndex, 1);      // удаление жертвы
            this.stats.killedByHunter++;
            hunter.killCooldown = this.params.hunterCooldown; // перезарядка
            hunter.waiting = true;                            // отдых
          }
        }
      }
    }

    // Случайное появление еды в симуляции с некоторой вероятностью
    if (Math.random() < 0.07 * dt) this.addFood(1);
  }
}

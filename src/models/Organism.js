// Импорт утилит, генерирующих случайные значения
import { randomBetween, randomGender, randomColor } from './utils';

// Класс обычного существа в экосистеме
export default class Organism {
  constructor(x, y, gender, color, age = 0) {
    // Положение существа на карте
    this.x = x;
    this.y = y;

    // Пол и цвет существа
    this.gender = gender || randomGender();     // случайный пол, если не указан
    this.color = color || randomColor();       // случайный цвет, если не указан

    // Характеристики
    this.age = age || 0;                       // возраст
    this.energy = 100;                         // изначальная энергия
    this.size = randomBetween(12, 22);         // размер (влияет на столкновения и расход энергии)
    this.speed = randomBetween(0.7, 1.7);       // скорость передвижения
    this.vision = randomBetween(60, 140);      // радиус видимости

    // Направление движения (вектор)
    this.dx = Math.random() * 2 - 1;
    this.dy = Math.random() * 2 - 1;

    // Внутренние состояния
    this.isHungry = false;
    this.isOld = false;
    this.tired = 0;                            // уровень усталости
    this.birthCooldown = 0;                    // кулдаун между рождениями потомства

    this.type = "creature";                    // тип существа (можно использовать в фильтрации)
  }

  // Метод обновления состояния существа по времени
  update(dt) {
    this.age += dt * 0.1;                      // существо стареет с течением времени
    this.energy -= dt * (0.7 + this.size / 25); // потребление энергии (чем больше, тем быстрее тратит)
    this.tired += dt * 0.05;                   // постепенное накопление усталости

    this.isHungry = this.energy < 40;          // если энергия ниже порога — существо голодное
    this.isOld = this.age > 60;                // если возраст больше порога — считается старым

    // Уменьшаем кулдаун перед возможным размножением
    if (this.birthCooldown > 0) this.birthCooldown -= dt;

    // Если усталость слишком большая — ускоряется старение
    if (this.tired > 10) this.age += dt * 0.1;

    // Возвращаем true, если существо должно умереть
    return this.energy <= 0 || this.age > 80;
  }

  // Метод движения
  move(dt, speedMul = 1) {
    // Перемещение по координатам с учетом скорости и направления
    this.x += this.dx * this.speed * 25 * dt * speedMul;
    this.y += this.dy * this.speed * 25 * dt * speedMul;

    // Отскоки от границ поля
    if (this.x < 20) { this.x = 20; this.dx *= -1; }
    if (this.x > 880) { this.x = 880; this.dx *= -1; }
    if (this.y < 20) { this.y = 20; this.dy *= -1; }
    if (this.y > 880) { this.y = 880; this.dy *= -1; }

    // С небольшой вероятностью (2%) существо меняет направление случайно
    if (Math.random() < 0.02) {
      const a = Math.random() * Math.PI * 2;
      this.dx = Math.cos(a);
      this.dy = Math.sin(a);
    }
  }

  // Расстояние до другого объекта (например, еды или хищника)
  distanceTo(obj) {
    return Math.hypot(this.x - obj.x, this.y - obj.y);
  }

  // Проверка, можно ли размножиться с другим существом
  canBreedWith(other, minAge, maxAgeDiff) {
    return (
      this.gender !== other.gender &&                         // разный пол
      this.age >= minAge && other.age >= minAge &&           // оба достигли минимального возраста
      Math.abs(this.age - other.age) <= maxAgeDiff &&        // возрастная разница в пределах нормы
      this.birthCooldown <= 0 && other.birthCooldown <= 0    // оба готовы к размножению
    );
  }

  // Создание потомка при размножении
  breedWith(other) {
    const child = new Organism(
      (this.x + other.x) / 2 + randomBetween(-20, 20),    // позиция — между родителями + разброс
      (this.y + other.y) / 2 + randomBetween(-20, 20),
      randomGender(),                                     // случайный пол
      Math.random() < 0.5 ? this.color : other.color,     // цвет одного из родителей
      0                                                   // возраст 0 (новорожденный)
    );

    // Наследование свойств от родителей + небольшое случайное отклонение
    child.size = (this.size + other.size) / 2 + randomBetween(-2, 2);
    child.speed = (this.speed + other.speed) / 2 + randomBetween(-0.1, 0.1);
    child.vision = (this.vision + other.vision) / 2 + randomBetween(-5, 5);

    return child;
  }
}

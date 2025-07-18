// Класс Хищника
export default class Hunter {
  constructor(x, y, cooldown, speed) {
    this.x = x;                    // координата X
    this.y = y;                    // координата Y
    this.size = 18;               // размер хищника (используется при столкновениях)
    this.color = "#ff2222";       // цвет (красный оттенок для визуализации)
    this.speed = speed || 2.3;    // базовая скорость (по умолчанию 2.3, если не задано)
    this.vision = 999;            // радиус "зрения" (очень большой, чтобы всегда видеть цель)
    this.dx = Math.random() * 2 - 1; // направление движения по X (случайное от -1 до 1)
    this.dy = Math.random() * 2 - 1; // направление движения по Y

    this.cooldown = cooldown;     // переустановка интервала между атакой
    this.killCooldown = 0;        // обратный отсчет до следующей возможности убить
    this.type = "hunter";         // тип объекта (может быть полезен для обработки)
    this.age = 0;                 // возраст хищника
    this.waiting = false;         // индикатор "ожидания" (пока кулдаун не прошел)
  }

  // Обновление состояния хищника
  update(dt) {
    this.age += dt * 0.1; // возраст увеличивается со временем

    // Если кулдаун ещё не прошел — уменьшаем его и активируем режим ожидания
    if (this.killCooldown > 0) {
      this.killCooldown -= dt;
      this.waiting = true;
    } else {
      this.waiting = false;
    }

    return false; // возвращаем false, потому что хищники не умирают как организмы
  }

  // Метод передвижения к цели (жертве)
  moveToTarget(target, dt) {
    // Если хищник в ожидании или цели нет — ничего не делаем
    if (this.waiting || !target) return;

    // Вычисляем вектор между хищником и целью
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy); // расстояние между ними

    // Если расстояние достаточно велико — пересчитываем направление
    if (dist > 1) {
      this.dx = dx / dist; // нормализуем направление по X
      this.dy = dy / dist; // нормализуем направление по Y
    }

    // Обновляем позицию с учетом скорости, времени и направления
    this.x += this.dx * this.speed * 30 * dt;
    this.y += this.dy * this.speed * 30 * dt;

    // Ограничения по краям: хищник не выходит за границы поля
    if (this.x < 20) this.x = 20;
    if (this.x > 880) this.x = 880;
    if (this.y < 20) this.y = 20;
    if (this.y > 880) this.y = 880;
  }

  // Вычисление расстояния до другого объекта (используется для определения ближней цели)
  distanceTo(obj) {
    return Math.hypot(this.x - obj.x, this.y - obj.y);
  }
}

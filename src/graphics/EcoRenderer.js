// Экспорт класса EcoRenderer, отвечающего за отрисовку состояния симуляции на canvas
export default class EcoRenderer {
  // Конструктор принимает контекст canvas для рисования (2D context)
  constructor(ctx) {
    this.ctx = ctx;
  }

  // Основной метод, рисующий текущее состояние симуляции
  draw(sim) {
    const ctx = this.ctx;

    // Заливка фона canvas базовым цветом (серый)
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(0, 0, 900, 900);

    // --- Рисование сетки ---
    ctx.save();
    ctx.strokeStyle = "#b0b0b0"; // цвет линий сетки
    ctx.lineWidth = 1;           // толщина линий сетки
    const step = 60;             // шаг сетки в пикселях

    // Вертикальные линии сетки
    for (let x = step; x < 900; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 900);
      ctx.stroke();
    }
    // Горизонтальные линии сетки
    for (let y = step; y < 900; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(900, y);
      ctx.stroke();
    }
    ctx.restore();

    // --- Рисование еды ---
    // Каждый объект пищи — это круг с соответствующим цветом и размером
    for (const f of sim.foods) {
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Рисование существ ---
    for (const c of sim.creatures) {
      ctx.save();
      // Если существо старое, делаем его полупрозрачным
      ctx.globalAlpha = c.isOld ? 0.5 : 1;
      // Основное тело существа: цвет и квадрат
      ctx.fillStyle = c.color;
      const half = c.size;
      ctx.fillRect(c.x - half, c.y - half, half * 2, half * 2);

      // Глаз существа: цвет зависит от пола
      ctx.fillStyle = c.gender === 'male' ? '#3399ff' : '#ff66cc';
      const eyeOffsetX = c.dx * c.size * 0.5;
      const eyeOffsetY = c.dy * c.size * 0.5;
      const eyeSize = c.size * 0.36;
      ctx.fillRect(
        c.x + eyeOffsetX - eyeSize/2,
        c.y + eyeOffsetY - eyeSize/2,
        eyeSize, eyeSize
      );

      // Отображение возраста (число по центру существа)
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(Math.floor(c.age), c.x, c.y + 3);

      // Символ пола над существом (♂ для самцов и ♀ для самок)
      ctx.fillStyle = c.gender === 'male' ? "#3399ff" : "#ff66cc";
      ctx.font = "bold 13px Arial";
      ctx.fillText(
        c.gender === 'male' ? "♂" : "♀",
        c.x, c.y - c.size * 0.8
      );
      ctx.restore();
    }

    // --- Рисование убийц ---
    for (const h of sim.hunters) {
      ctx.save();
      ctx.globalAlpha = 1;
      // Красная обводка вокруг убийцы
      ctx.strokeStyle = "#ff2222";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.size + 3, 0, Math.PI * 2);
      ctx.stroke();
      // Основное тело убийцы (круг с заданным цветом)
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.size, 0, Math.PI * 2);
      ctx.fill();
      // "Глаз" убийцы (маленький белый круг в направлении движения)
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(
        h.x + h.dx * h.size * 0.5,
        h.y + h.dy * h.size * 0.5,
        h.size * 0.2,
        0, Math.PI * 2
      );
      ctx.fill();
      // Символ "череп" над убийцей
      ctx.fillStyle = "#fff";
      ctx.font = "bold 17px Arial";
      ctx.textAlign = "center";
      ctx.fillText("☠", h.x, h.y - h.size * 0.7);
      ctx.restore();
    }
  }
}

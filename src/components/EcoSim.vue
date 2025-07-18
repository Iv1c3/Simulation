<template>
  <!-- Корневой контейнер симуляции -->
  <div class="eco-sim-root">
    <div class="eco-main">
      <!-- Панель статистики и управления -->
      <div class="eco-stats-panel">
        <h2>Популяция</h2>
        <div class="eco-population">
          <!-- Основные показатели популяции -->
          <p>Всего: {{ sim?.creatures.length || 0 }}</p>
          <p>М ♂: {{ maleCount }}, Ж ♀: {{ femaleCount }}</p>
          <p>Средний возраст: {{ avgAge.toFixed(1) }}</p>
          <p>Средняя энергия: {{ avgEnergy.toFixed(1) }}</p>
        </div>
        <!-- Статистика смертности -->
        <h3>Погибло</h3>
        <p>От старости: {{ sim?.stats.oldAgeDeaths || 0 }}</p>
        <p>От голода: {{ sim?.stats.hungerDeaths || 0 }}</p>
        <p>Съедено: {{ sim?.stats.eaten || 0 }}</p>
        <!-- Статистика рождаемости -->
        <h3>Родилось</h3>
        <p>Всего: {{ sim?.stats.born || 0 }}</p>
        <!-- Статистика убийств -->
        <h3>Убито убийцей</h3>
        <p>Всего: {{ sim?.stats.killedByHunter || 0 }}</p>
        <!-- Кнопки управления симуляцией -->
        <h3>Управление</h3>
        <button @click="togglePause">{{ paused ? 'Старт' : 'Пауза' }}</button>
        <button @click="addRandomCreature">+ Случайное существо</button>
        <button @click="addFood(10)">+10 еды</button>
        <button @click="addHunter">+ Убийца</button>
        <!-- Добавление кастомного существа -->
        <div class="eco-custom">
          <label>Пол:
            <select v-model="custom.gender">
              <option value="male">♂</option>
              <option value="female">♀</option>
            </select>
          </label>
          <label>Возраст: <input type="number" v-model.number="custom.age" min="0" max="60" /></label>
          <label>Цвет: <input type="color" v-model="custom.color" /></label>
          <button @click="addCustomCreature">Добавить</button>
        </div>
        <!-- Управление скоростью симуляции -->
        <div class="eco-speed">
          <label>Скорость симуляции:
            <input type="range" min="1" max="10" v-model.number="simSpeed" />
            x{{ simSpeed }}
          </label>
        </div>
        <!-- Параметры размножения -->
        <div class="eco-breed-params">
          <label>Минимальный возраст для размножения:
            <input type="range" min="0" max="60" v-model.number="breedMinAge" />
            {{ breedMinAge }}
          </label>
          <label>Макс. разница в возрасте:
            <input type="range" min="1" max="40" v-model.number="breedMaxAgeDiff" />
            {{ breedMaxAgeDiff }}
          </label>
          <label>Время отката (сек):
            <input type="range" min="1" max="20" v-model.number="breedCooldown" />
            {{ breedCooldown }}
          </label>
          <label>Шанс размножения (%):
            <input type="range" min="1" max="100" v-model.number="breedChance" />
            {{ breedChance }}%
          </label>
        </div>
        <!-- Параметры поведения убийцы -->
        <div class="eco-hunter-params">
          <label>Ожидание между убийствами (сек):
            <input type="range" min="1" max="20" v-model.number="hunterCooldown" />
            {{ hunterCooldown }}
          </label>
          <label>Скорость убийцы:
            <input type="range" min="0.5" max="5" step="0.1" v-model.number="hunterSpeed" />
            {{ hunterSpeed.toFixed(1) }}
          </label>
        </div>
      </div>
      <!-- Канвас для графического отображения эко-системы -->
      <canvas ref="canvas" width="900" height="900" class="eco-canvas"></canvas>
    </div>
  </div>
</template>

<script>
// Импорт основной логики симуляции и рендера
import EcoSimulation from '../logic/EcoSimulation';
import EcoRenderer from '../graphics/EcoRenderer';

export default {
  data() {
    return {
      // Экземпляр симуляции
      sim: null,
      // Рендерер для работы с canvas
      renderer: null,
      // Флаг паузы
      paused: false,
      // Скорость симуляции
      simSpeed: 1,
      // Данные для создания кастомного существа
      custom: { gender: "male", age: 0, color: "#ff8800" },
      // Таймер, управляющий анимацией
      timer: null,
      // Время последнего кадра
      lastTime: 0,
      // Параметры размножения
      breedMinAge: 10,
      breedMaxAgeDiff: 12,
      breedCooldown: 7,
      breedChance: 70,
      // Параметры убийцы
      hunterCooldown: 5,
      hunterSpeed: 2.3,
    };
  },
  computed: {
    // Количество самцов
    maleCount() { return this.sim ? this.sim.creatures.filter(c => c.gender === 'male').length : 0; },
    // Количество самок
    femaleCount() { return this.sim ? this.sim.creatures.filter(c => c.gender === 'female').length : 0; },
    // Средний возраст популяции
    avgAge() {
      return this.sim && this.sim.creatures.length
        ? this.sim.creatures.reduce((s, c) => s + c.age, 0) / this.sim.creatures.length
        : 0;
    },
    // Средняя энергия
    avgEnergy() {
      return this.sim && this.sim.creatures.length
        ? this.sim.creatures.reduce((s, c) => s + c.energy, 0) / this.sim.creatures.length
        : 0;
    }
  },
  mounted() {
    // Инициализация симуляции с начальными параметрами
    this.sim = new EcoSimulation({
      breedMinAge: this.breedMinAge,
      breedMaxAgeDiff: this.breedMaxAgeDiff,
      breedCooldown: this.breedCooldown,
      breedChance: this.breedChance,
      hunterCooldown: this.hunterCooldown,
      hunterSpeed: this.hunterSpeed,
    });
    // Добавление стартовой популяции и еды
    for (let i = 0; i < 12; i++) this.sim.addRandomCreature();
    this.sim.addFood(20);
    // Настройка canvas и рендерера
    this.canvas = this.$refs.canvas;
    this.renderer = new EcoRenderer(this.canvas.getContext('2d'));
    // Запуск анимации
    this.lastTime = performance.now();
    this.timer = requestAnimationFrame(this.loop);
  },
  beforeUnmount() {
    // Остановка анимации при демонтировании компонента
    cancelAnimationFrame(this.timer);
  },
  watch: {
    // Реактивное обновление параметров размножения и поведения убийцы
    breedMinAge(val) { if (this.sim) this.sim.params.breedMinAge = val; },
    breedMaxAgeDiff(val) { if (this.sim) this.sim.params.breedMaxAgeDiff = val; },
    breedCooldown(val) { if (this.sim) this.sim.params.breedCooldown = val; },
    breedChance(val) { if (this.sim) this.sim.params.breedChance = val; },
    hunterCooldown(val) { if (this.sim) this.sim.params.hunterCooldown = val; },
    hunterSpeed(val) { if (this.sim) this.sim.params.hunterSpeed = val; },
  },
  methods: {
    // Основной цикл симуляции и отрисовки
    loop(now) {
      if (!this.paused) {
        // Вычисляем дельту времени и обновляем симуляцию
        const dt = Math.min((now - this.lastTime) / 1000, 0.07) * this.simSpeed;
        this.lastTime = now;
        this.sim.update(dt);
        this.renderer.draw(this.sim);
      }
      // Следующий кадр
      this.timer = requestAnimationFrame(this.loop);
    },
    // Добавление существа со случайными параметрами
    addRandomCreature() { this.sim.addRandomCreature(); },
    // Добавление кастомизированного существа
    addCustomCreature() {
      this.sim.addCustomCreature(this.custom.gender, this.custom.color, this.custom.age);
    },
    // Добавление порции еды
    addFood(n) { this.sim.addFood(n); },
    // Добавление нового убийцы
    addHunter() { this.sim.addHunter(); },
    // Переключение состояния паузы
    togglePause() {
      this.paused = !this.paused;
      // Обновляем time, чтобы избежать скачков при продолжении
      this.lastTime = performance.now();
    }
  }
};
</script>

<style scoped>
/* Корневой стиль основного контейнера */
.eco-sim-root {
  width: 100vw;
  display: flex;
  justify-content: center;
  background: #eaf2f8;
  min-height: 100vh;
}
/* Основная зона симуляции и статистики */
.eco-main {
  display: flex;
  gap: 18px;
  margin: 30px 0;
}
/* Canvas для отображения экосистемы */
.eco-canvas {
  background: #c0c0c0;
  border-radius: 10px;
  box-shadow: 0 2px 8px #0003;
  width: 900px;
  height: 900px;
}
/* Панель статистики и управления */
.eco-stats-panel {
  width: 260px;
  background: #f7f7fa;
  border-radius: 10px;
  padding: 18px 14px;
  box-shadow: 0 2px 8px #0002;
  font-size: 1em;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* Вспомогательные стили для внутренних элементов */
.eco-population p { margin: 3px 0; }
.eco-custom {
  background: #f0f0e0;
  border-radius: 6px;
  padding: 7px 6px;
  margin: 7px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.eco-speed, .eco-breed-params, .eco-hunter-params {
  margin-top: 10px;
  background: #eaf7e0;
  border-radius: 6px;
  padding: 7px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
/* Стили для кнопок */
button {
  margin: 2px 0;
  background: #16a085;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.2s;
}
button:hover {
  background: #138d75;
}
/* Стили для выбора цвета */
input[type="color"] {
  width: 32px;
  height: 22px;
  border: none;
  background: none;
  padding: 0;
}
/* Форматирование селекторов и инпутов */
select, input[type="number"], input[type="range"] {
  margin-left: 6px;
  border-radius: 4px;
  border: 1px solid #bbb;
  padding: 2px 5px;
  font-size: 1em;
}
input[type="range"] {
  width: 90px;
  vertical-align: middle;
}
/* Адаптивная верстка под малые экраны */
@media (max-width: 1200px) {
  .eco-main { flex-direction: column; align-items: center; }
  .eco-canvas { width: 98vw; height: 98vw; max-width: 900px; max-height: 900px;}
  .eco-stats-panel { width: 98vw; max-width: 350px;}
}
</style>

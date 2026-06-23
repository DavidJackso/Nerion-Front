<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const navScrolled = ref(false)
const codeTab = ref('curl')

const SAMPLES: Record<string, string> = {
  curl: `curl -X GET 'https://app.nerion.ru/api/math-dept/teachers' \\
  -H 'Authorization: Bearer nrn_live_••••3f2a' \\
  -H 'Content-Type: application/json'`,
  js: `const res = await fetch(
  'https://app.nerion.ru/api/math-dept/teachers',
  { headers: { 'Authorization': \`Bearer \${process.env.NERION_KEY}\` } }
);
const { data } = await res.json();`,
  py: `import requests, os

r = requests.get(
  'https://app.nerion.ru/api/math-dept/teachers',
  headers={'Authorization': f'Bearer {os.environ["NERION_KEY"]}'},
)
data = r.json()`,
}

function go(screen: string) {
  navigateTo(screen === 'login' ? '/login' : '/register')
}

let scrollHandler: (() => void) | null = null
let io: IntersectionObserver | null = null

onMounted(() => {
  if (localStorage.getItem('nerion_access_token')) {
    navigateTo('/spaces')
    return
  }

  scrollHandler = () => { navScrolled.value = window.scrollY > 8 }
  scrollHandler()
  window.addEventListener('scroll', scrollHandler, { passive: true })

  io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in')
        io!.unobserve(en.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  document.querySelectorAll('.reveal').forEach(el => io!.observe(el))
})

onUnmounted(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
  if (io) io.disconnect()
})
</script>

<template>
  <div class="landing">

    <!-- ══ HEADER ══ -->
    <header class="nav" :class="{ scrolled: navScrolled }">
      <div class="wrap nav-inner">
        <a href="#top" class="brand"><span class="logo">N</span>Nerion</a>
        <nav class="nav-links">
          <a href="#how">Как работает</a>
          <a href="#features">Возможности</a>
          <a href="#api">API</a>
          <a href="#pricing">Тарифы</a>
        </nav>
        <div class="nav-actions">
          <button class="btn btn-ghost" @click="go('login')">Войти</button>
          <button class="btn btn-pri btn-sm" @click="go('register')">Начать бесплатно</button>
        </div>
      </div>
    </header>

    <a id="top"></a>

    <!-- ══ HERO ══ -->
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <span class="eyebrow"><span class="dot"></span>MVP · бэкенд без бэкенд-разработчика</span>
          <h1>Опиши данные —<br/>получи <span class="accent">готовый бэкенд</span></h1>
          <p class="lede">Nerion превращает обычные таблицы в REST API, публичные списки и PDF по ГОСТ. Без кода, без сервера и без DevOps — за минуты, а не за спринты.</p>
          <div class="hero-cta">
            <button class="btn btn-pri" @click="go('register')">
              Начать бесплатно
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button class="btn btn-sec" @click="go('login')">Войти в аккаунт</button>
          </div>
          <div class="hero-trust">
            14 дней Pro бесплатно · карта не нужна · изолированные пространства
          </div>
        </div>

        <!-- Product mock -->
        <div class="mock reveal">
          <div class="mock-window">
            <div class="mock-bar">
              <span class="tl" style="background:#ff5f57"></span>
              <span class="tl" style="background:#febc2e"></span>
              <span class="tl" style="background:#28c840"></span>
              <span class="mock-url">app.nerion.ru/math-dept/teachers</span>
            </div>
            <div class="mock-body">
              <aside class="mock-side">
                <div class="lbl">Таблицы</div>
                <div class="mock-row active">
                  <svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                  Преподаватели<span class="ct">14</span>
                </div>
                <div class="mock-row">
                  <svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Курсы<span class="ct">42</span>
                </div>
                <div class="mock-row">
                  <svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  Учебные планы<span class="ct">8</span>
                </div>
                <div class="lbl">Выходы</div>
                <div class="mock-row">
                  <svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  REST API
                </div>
                <div class="mock-row">
                  <svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                  Файлы
                </div>
                <div class="mock-row">
                  <svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  PDF
                </div>
              </aside>
              <div class="mock-main">
                <div class="mock-tablehd">
                  <span class="t">Преподаватели</span>
                  <span class="mpill" style="background:var(--green-100);color:var(--green-700)">● API активен</span>
                </div>
                <table class="mtable">
                  <thead><tr><th>ФИО</th><th>Степень</th><th>Ставка</th><th>Статус</th></tr></thead>
                  <tbody>
                    <tr><td>Иванова А. П.</td><td>д.ф.-м.н.</td><td class="mono">1.0</td><td><span class="mpill" style="background:var(--green-100);color:var(--green-700)">активен</span></td></tr>
                    <tr><td>Соколов Д. В.</td><td>к.т.н.</td><td class="mono">0.5</td><td><span class="mpill" style="background:var(--green-100);color:var(--green-700)">активен</span></td></tr>
                    <tr><td>Петров М. С.</td><td>доцент</td><td class="mono">1.0</td><td><span class="mpill" style="background:var(--amber-100);color:var(--amber-700)">отпуск</span></td></tr>
                    <tr><td>Кузьмина Е. А.</td><td>к.ф.-м.н.</td><td class="mono">0.75</td><td><span class="mpill" style="background:var(--green-100);color:var(--green-700)">активен</span></td></tr>
                    <tr><td>Орлов В. И.</td><td>профессор</td><td class="mono">1.0</td><td><span class="mpill" style="background:var(--green-100);color:var(--green-700)">активен</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- floating: generated API -->
          <div class="mock-float">
            <div class="fhd"><span class="m">GET</span><span class="u">/api/math-dept/teachers</span></div>
            <pre><span class="tok-p">{</span>
            <span class="tok-k">"count"</span><span class="tok-p">:</span> <span class="tok-n">14</span><span class="tok-p">,</span>
            <span class="tok-k">"data"</span><span class="tok-p">:</span> <span class="tok-p">[{</span>
              <span class="tok-k">"id"</span><span class="tok-p">:</span> <span class="tok-s">"rec_a8f2b4"</span><span class="tok-p">,</span>
              <span class="tok-k">"fio"</span><span class="tok-p">:</span> <span class="tok-s">"Иванова А. П."</span><span class="tok-p">,</span>
              <span class="tok-k">"stavka"</span><span class="tok-p">:</span> <span class="tok-n">1.0</span>
            <span class="tok-p">}]</span>
          <span class="tok-p">}</span></pre>
          </div>
          <!-- floating badge -->
          <div class="float-badge">
            <span class="fi">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ HOW IT WORKS ══ -->
    <section class="band band-tint" id="how">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="section-tag">Как это работает</span>
          <h2>Одна модель — три готовых выхода</h2>
          <p>Опиши данные один раз. REST API, публичные списки и документы читают одну и ту же модель и обновляются сами.</p>
        </div>
        <div class="steps">
          <div class="step reveal">
            <span class="n">01</span>
            <div class="ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
            </div>
            <h3>Опиши таблицы</h3>
            <p>Выбери шаблон или собери поля сам: текст, число, дата, файл, связь. Бизнес-язык вместо SQL — «Курс», «Преподаватель», а не таблицы и джойны.</p>
            <svg class="step-arrow" width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="34" y2="12" stroke-dasharray="3 4"/><polyline points="28 6 36 12 28 18"/></svg>
          </div>
          <div class="step reveal">
            <span class="n">02</span>
            <div class="ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
            </div>
            <h3>Заполни данные</h3>
            <p>Добавляй записи в удобной таблице, прикрепляй файлы и связывай сущности между собой. Платформа сама строит схему и миграции под капотом.</p>
            <svg class="step-arrow" width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="34" y2="12" stroke-dasharray="3 4"/><polyline points="28 6 36 12 28 18"/></svg>
          </div>
          <div class="step reveal">
            <span class="n">03</span>
            <div class="ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <h3>Получи выходы</h3>
            <p>Готовый REST API со Swagger, публичные списки по постоянному адресу и документы PDF по ГОСТ. Меняешь данные — выдача обновляется сама.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FEATURES ══ -->
    <section class="band" id="features">
      <div class="wrap">
        <div class="sec-head reveal">
          <span class="section-tag">Возможности</span>
          <h2>Всё, что нужно для бэкенда — внутри</h2>
          <p>От динамической схемы до публичной выдачи. Никаких отдельных сервисов, серверов и интеграций.</p>
        </div>
        <div class="feat-grid">
          <div class="feat reveal">
            <div class="ico" style="background:var(--brand-tint);color:var(--brand-primary-hover)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <h3>Авто-REST API + Swagger</h3>
            <p>Для каждой таблицы автоматически появляются эндпоинты CRUD с фильтрами и пагинацией, готовая Swagger-документация и примеры на cURL, JS и Python.</p>
            <div class="tagrow"><span class="minitag">GET</span><span class="minitag">POST</span><span class="minitag">PATCH</span><span class="minitag">DELETE</span></div>
          </div>
          <div class="feat reveal">
            <div class="ico" style="background:var(--green-100);color:var(--green-700)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            </div>
            <h3>Публичные списки</h3>
            <p>Опубликованный список — постоянный адрес, по которому фронт забирает данные массивом. id знать не нужно: добавил запись — выдача обновилась сама.</p>
            <div class="tagrow"><span class="minitag">публичный URL</span><span class="minitag">авто-обновление</span></div>
          </div>
          <div class="feat reveal">
            <div class="ico" style="background:var(--amber-100);color:var(--amber-700)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
            </div>
            <h3>PDF по ГОСТ</h3>
            <p>Генерируй справки, приказы и отчёты из данных по утверждённым шаблонам. Поля подставляются автоматически, оформление — по ГОСТ.</p>
            <div class="tagrow"><span class="minitag">шаблоны</span><span class="minitag">пакетная выгрузка</span></div>
          </div>
          <div class="feat reveal">
            <div class="ico" style="background:var(--blue-100);color:#1E40AF">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
            </div>
            <h3>Изолированные пространства</h3>
            <p>Каждое пространство — отдельная схема данных с собственным API и командой. Данные одного арендатора недоступны из контекста другого.</p>
            <div class="tagrow"><span class="minitag">multi-tenant</span><span class="minitag">собственный URL</span></div>
          </div>
          <div class="feat reveal">
            <div class="ico" style="background:var(--brand-tint);color:var(--brand-primary-hover)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>Команда и роли</h3>
            <p>Приглашай участников по email. Admin управляет схемой, ключами и биллингом, Member работает с данными и документами — права на уровне сервера.</p>
            <div class="tagrow"><span class="minitag">Admin</span><span class="minitag">Member</span></div>
          </div>
          <div class="feat reveal">
            <div class="ico" style="background:var(--red-100);color:var(--red-700)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15 19 4M18 5l2 2M15 8l2 2"/></svg>
            </div>
            <h3>Ключи и безопасность</h3>
            <p>API-ключи с заголовком <code>Authorization: Bearer</code>, связи по внешним ключам и версионирование схемы при каждой миграции.</p>
            <div class="tagrow"><span class="minitag">API-ключи</span><span class="minitag">миграции</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ API SHOWCASE ══ -->
    <section class="band band-tint" id="api">
      <div class="wrap api-split">
        <div class="reveal">
          <span class="section-tag">Готовый API</span>
          <h2 style="font-size:clamp(28px,3.2vw,38px);margin-top:14px">От таблицы до запроса — за минуту</h2>
          <p style="font-size:17px;color:var(--fg-2);margin-top:16px;margin-bottom:8px">Не нужно поднимать сервер, писать роуты и описывать модели. Описал поля — эндпоинты уже работают.</p>
          <ul class="api-list">
            <li>
              <span class="ai"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              <div><h4>CRUD из коробки</h4><p>Список, чтение, создание, обновление и удаление — для каждой таблицы автоматически.</p></div>
            </li>
            <li>
              <span class="ai"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></span>
              <div><h4>Фильтры и пагинация</h4><p>Параметры запроса для выборки нужных записей — без дополнительного кода.</p></div>
            </li>
            <li>
              <span class="ai"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15 19 4M18 5l2 2M15 8l2 2"/></svg></span>
              <div><h4>Аутентификация по ключу</h4><p>Защита через <code>Authorization: Bearer</code> и отдельные ключи на интеграцию.</p></div>
            </li>
          </ul>
        </div>
        <div class="code-card reveal">
          <div class="code-tabs">
            <button class="ctab" :class="{ active: codeTab === 'curl' }" @click="codeTab = 'curl'">cURL</button>
            <button class="ctab" :class="{ active: codeTab === 'js' }" @click="codeTab = 'js'">JavaScript</button>
            <button class="ctab" :class="{ active: codeTab === 'py' }" @click="codeTab = 'py'">Python</button>
            <span class="ttl">app.nerion.ru</span>
          </div>
          <pre>{{ SAMPLES[codeTab] }}</pre>
        </div>
      </div>
    </section>

    <!-- ══ SCREENSHOTS ══ -->
    <section class="band">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="section-tag">Внутри продукта</span>
          <h2>Реальные экраны, а не картинки</h2>
          <p>Так выглядит работа с данными и выходами в Nerion — от списков файлов до сгенерированного API.</p>
        </div>
        <div class="shots">
          <div class="shot reveal">
            <div class="cap">
              <span class="tl" style="background:#ff5f57"></span>
              <span class="tl" style="background:#febc2e"></span>
              <span class="tl" style="background:#28c840"></span>
              <span>app.nerion.ru/math-dept/files</span>
            </div>
            <img src="/shots/create.png" alt="Списки файлов в Nerion" loading="lazy"/>
            <div class="desc"><h4>Публичные списки файлов</h4><p>Опубликованный список — постоянный адрес, по которому фронт забирает массив файлов. Без хардкода ссылок.</p></div>
          </div>
          <div class="shot reveal">
            <div class="cap">
              <span class="tl" style="background:#ff5f57"></span>
              <span class="tl" style="background:#febc2e"></span>
              <span class="tl" style="background:#28c840"></span>
              <span>app.nerion.ru/math-dept/lists</span>
            </div>
            <img src="/shots/detail.png" alt="Список и его API в Nerion" loading="lazy"/>
            <div class="desc"><h4>Список и его API</h4><p>Каждый список сразу доступен по REST с примерами на JavaScript и cURL — копируй и вставляй в проект.</p></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ AUDIENCE ══ -->
    <section class="band band-tint">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="section-tag">Для кого</span>
          <h2>Кафедрам, командам и продуктам</h2>
          <p>Везде, где данные живут в таблицах, а наружу нужны API, списки и документы.</p>
        </div>
        <div class="aud reveal">
          <span class="chip"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 3v18"/></svg>Кафедры и факультеты</span>
          <span class="chip"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Деканаты</span>
          <span class="chip"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Приёмные комиссии</span>
          <span class="chip"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>Небольшие команды и стартапы</span>
          <span class="chip"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>CRM и внутренние каталоги</span>
        </div>
      </div>
    </section>

    <!-- ══ PRICING ══ -->
    <section class="band" id="pricing">
      <div class="wrap">
        <div class="sec-head center reveal">
          <span class="section-tag">Тарифы</span>
          <h2>Начни бесплатно, расти по мере надобности</h2>
          <p>Без карты на старте. Pro снимает лимиты и добавляет ёмкость в каждом пространстве.</p>
        </div>
        <div class="price-grid">
          <div class="plan reveal">
            <div class="pname">Free</div>
            <div class="pprice">0 ₽ <span class="per">/ навсегда</span></div>
            <p class="pdesc">Чтобы попробовать и собрать первый бэкенд без затрат.</p>
            <ul>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>До 2 пространств</li>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Авто-REST API и Swagger</li>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Публичные списки и PDF</li>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>До 5 участников в команде</li>
            </ul>
            <button class="btn btn-sec" @click="go('register')">Начать бесплатно</button>
          </div>
          <div class="plan pro reveal">
            <span class="ribbon">Популярный</span>
            <div class="pname" style="color:var(--brand-primary-hover)">Pro</div>
            <div class="pprice">990 ₽ <span class="per">/ мес за пространство</span></div>
            <p class="pdesc">Когда бэкенд пошёл в работу и нужны объём и масштаб.</p>
            <ul>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Без лимита пространств</li>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>100k записей в каждом пространстве</li>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Неограниченная команда и роли</li>
              <li><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Приоритетная поддержка</li>
            </ul>
            <button class="btn btn-pri" @click="go('register')">Попробовать 14 дней Pro</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FINAL CTA ══ -->
    <section style="padding:40px 0 96px">
      <div class="wrap">
        <div class="cta-band reveal">
          <h2>Опиши данные сегодня — получи API сегодня</h2>
          <p>Регистрация занимает минуту. Первое пространство и готовый бэкенд — ещё несколько.</p>
          <button class="btn btn-light" @click="go('register')">Создать аккаунт бесплатно</button>
          <div class="note">14 дней Pro · карта не нужна · отмена в любой момент</div>
        </div>
      </div>
    </section>

    <!-- ══ FOOTER ══ -->
    <footer class="ft">
      <div class="wrap">
        <div class="ft-grid">
          <div class="ft-about">
            <a href="#top" class="brand"><span class="logo">N</span>Nerion</a>
            <p>Серверная платформа, которая превращает описанные данные в REST API, публичные списки и документы.</p>
          </div>
          <div>
            <h5>Продукт</h5>
            <a href="#how">Как работает</a>
            <a href="#features">Возможности</a>
            <a href="#api">API и Swagger</a>
            <a href="#pricing">Тарифы</a>
          </div>
          <div>
            <h5>Ресурсы</h5>
            <a href="#">Документация</a>
            <a href="#">Шаблоны таблиц</a>
            <a href="#">Статус сервиса</a>
            <a href="#">Поддержка</a>
          </div>
          <div>
            <h5>Аккаунт</h5>
            <a href="#" @click.prevent="go('login')">Войти</a>
            <a href="#" @click.prevent="go('register')">Регистрация</a>
            <a href="#">Условия использования</a>
            <a href="#">Конфиденциальность</a>
          </div>
        </div>
        <div class="ft-bottom">
          <span>© Nerion · 2026</span>
          <span class="mono" style="font-size:12px">app.nerion.ru</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ── Variable aliases ─────────────────────────────────────── */
.landing {
  --brand: var(--brand-primary);
  --brand-hover: var(--brand-primary-hover);
  --brand-active: var(--brand-primary-active);
  --tint: var(--brand-tint);
  --tint-strong: var(--brand-tint-strong);
  --shadow-4: 0 30px 70px -20px rgba(20,14,58,.30),0 12px 28px -12px rgba(20,14,58,.16);
  --maxw: 1160px;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.55;
  color: var(--fg-1);
  background: var(--bg-0);
}

/* ── Utilities ────────────────────────────────────────────── */
.wrap { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.eyebrow { display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--purple-700);background:var(--tint);border:0.5px solid var(--purple-100);padding:6px 12px 6px 8px;border-radius:999px;letter-spacing:0; }
.eyebrow .dot { width:6px;height:6px;border-radius:50%;background:var(--green-500);box-shadow:0 0 0 3px rgba(16,163,127,.18); }
.section-tag { font-family:var(--font-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--purple-500);font-weight:600; }
.mono { font-family: var(--font-mono); }

/* ── Buttons ──────────────────────────────────────────────── */
.btn { display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:9px;cursor:pointer;font-family:var(--font-sans);font-weight:600;line-height:1;white-space:nowrap;transition:background .14s,transform .08s,box-shadow .14s,border-color .14s;text-decoration:none; }
.btn:active { transform:translateY(1px); }
.btn-pri { background:var(--brand);color:#fff;height:46px;padding:0 22px;font-size:15px;box-shadow:0 2px 8px rgba(127,119,221,.35); }
.btn-pri:hover { background:var(--brand-hover);box-shadow:0 6px 18px rgba(127,119,221,.40); }
.btn-sec { background:var(--bg-0);color:var(--fg-1);height:46px;padding:0 20px;font-size:15px;border:0.5px solid var(--border-strong);box-shadow:var(--shadow-1); }
.btn-sec:hover { background:var(--bg-1);border-color:var(--neutral-400); }
.btn-sm { height:38px;padding:0 16px;font-size:14px;border-radius:8px; }
.btn-ghost { background:transparent;color:var(--fg-2);height:38px;padding:0 14px;font-size:14px;border-radius:8px;font-weight:600;border:none; }
.btn-ghost:hover { background:var(--bg-2);color:var(--fg-1); }

/* ── Header ───────────────────────────────────────────────── */
.nav { position:sticky;top:0;z-index:50;backdrop-filter:saturate(180%) blur(14px);background:rgba(255,255,255,.78);border-bottom:0.5px solid transparent;transition:border-color .2s,background .2s; }
.nav.scrolled { border-bottom-color:var(--border-default);background:rgba(255,255,255,.86); }
.nav-inner { height:66px;display:flex;align-items:center;gap:28px; }
.brand { display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;letter-spacing:-0.02em;color:var(--fg-1);text-decoration:none; }
.brand .logo { width:30px;height:30px;border-radius:8px;background:var(--brand);color:#fff;display:grid;place-items:center;font-weight:800;font-size:16px;box-shadow:0 2px 8px rgba(127,119,221,.4); }
.nav-links { display:flex;gap:4px;margin-left:8px; }
.nav-links a { padding:8px 12px;border-radius:7px;font-size:14px;font-weight:500;color:var(--fg-2);transition:color .14s,background .14s;text-decoration:none; }
.nav-links a:hover { color:var(--fg-1);background:var(--bg-2); }
.nav-actions { margin-left:auto;display:flex;align-items:center;gap:8px; }

/* ── Hero ─────────────────────────────────────────────────── */
.hero { position:relative;overflow:hidden;padding:88px 0 90px; }
.hero::before { content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(800px 420px at 78% -8%,rgba(127,119,221,.16),transparent 70%),radial-gradient(620px 380px at 6% 8%,rgba(127,119,221,.08),transparent 68%); }
.hero-grid { display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,1.18fr);gap:56px;align-items:center; }
.hero h1 { font-size:clamp(38px,4.6vw,60px);font-weight:800;margin:22px 0 0;line-height:1.1;letter-spacing:-0.022em; }
.hero h1 .accent { color:var(--brand); }
.hero .lede { font-size:19px;color:var(--fg-2);margin-top:22px;max-width:520px;line-height:1.5; }
.hero-cta { display:flex;gap:12px;margin-top:32px;flex-wrap:wrap; }
.hero-trust { margin-top:20px;display:flex;align-items:center;gap:10px;font-size:13px;color:var(--fg-3); }

/* ── Product mock ─────────────────────────────────────────── */
.mock { position:relative; }
.mock-window { background:var(--bg-0);border:0.5px solid var(--border-default);border-radius:16px;box-shadow:var(--shadow-4);overflow:hidden; }
.mock-bar { height:42px;display:flex;align-items:center;gap:7px;padding:0 16px;border-bottom:0.5px solid var(--border-default);background:var(--bg-1); }
.mock-bar .tl { width:11px;height:11px;border-radius:50%; }
.mock-url { margin-left:14px;flex:1;height:24px;border-radius:6px;background:var(--bg-0);border:0.5px solid var(--border-default);display:flex;align-items:center;padding:0 10px;font-family:var(--font-mono);font-size:11.5px;color:var(--fg-3); }
.mock-body { display:grid;grid-template-columns:172px 1fr;min-height:340px; }
.mock-side { background:var(--bg-1);border-right:0.5px solid var(--border-default);padding:14px 12px; }
.mock-side .lbl { font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--fg-mute);font-weight:700;margin:12px 4px 6px; }
.mock-side .lbl:first-child { margin-top:0; }
.mock-row { display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:7px;font-size:12.5px;color:var(--fg-2); }
.mock-row.active { background:var(--tint-strong);color:var(--purple-700);font-weight:600; }
.mock-row .ic { color:var(--fg-3); }
.mock-row.active .ic { color:var(--purple-600); }
.mock-row .ct { margin-left:auto;font-family:var(--font-mono);font-size:10.5px;color:var(--fg-mute); }
.mock-main { padding:18px 18px 20px; }
.mock-tablehd { display:flex;align-items:center;justify-content:space-between;margin-bottom:14px; }
.mock-tablehd .t { font-size:15px;font-weight:700; }
.mtable { width:100%;border-collapse:collapse;font-size:11.5px; }
.mtable th { text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-3);font-weight:700;padding:6px 8px;border-bottom:0.5px solid var(--border-default); }
.mtable td { padding:7px 8px;border-bottom:0.5px solid var(--border-default);color:var(--fg-1); }
.mtable tr:last-child td { border-bottom:0; }
.mpill { display:inline-block;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600;font-family:var(--font-mono); }
.mock-float { position:absolute;right:-22px;bottom:-26px;width:330px;background:var(--neutral-950);border-radius:13px;box-shadow:var(--shadow-4);overflow:hidden;border:1px solid rgba(255,255,255,.06); }
.mock-float .fhd { display:flex;align-items:center;gap:8px;padding:9px 13px;border-bottom:1px solid rgba(255,255,255,.07); }
.mock-float .fhd .m { font-family:var(--font-mono);font-size:9.5px;font-weight:700;color:#fff;background:var(--green-500);padding:2px 6px;border-radius:4px; }
.mock-float .fhd .u { font-family:var(--font-mono);font-size:10.5px;color:#cdd0e0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.mock-float pre { margin:0;padding:13px;font-family:var(--font-mono);font-size:10.5px;line-height:1.65;color:#d7dae8;overflow:hidden; }
.tok-k { color:#c0b8ff; } .tok-s { color:#8fe3c0; } .tok-p { color:#8896c4; } .tok-n { color:#f0b66b; }
.float-badge .fi { width:22px;height:22px;border-radius:6px;background:var(--green-100);color:var(--green-700);display:grid;place-items:center;flex:0 0 auto; }
.float-badge .ft { font-size:10px;line-height:1.3; }
.float-badge .ft b { display:block;font-size:11px; }

/* ── Sections ─────────────────────────────────────────────── */
.band { padding:96px 0; }
.band-tint { background:var(--bg-1);border-top:0.5px solid var(--border-default);border-bottom:0.5px solid var(--border-default); }
.sec-head { max-width:660px;margin-bottom:54px; }
.sec-head.center { margin-left:auto;margin-right:auto;text-align:center; }
.sec-head h2 { font-size:clamp(28px,3.2vw,40px);margin-top:14px;font-weight:700;line-height:1.1;letter-spacing:-0.022em; }
.sec-head p { font-size:18px;color:var(--fg-2);margin-top:16px; }

/* ── Steps ────────────────────────────────────────────────── */
.steps { display:grid;grid-template-columns:repeat(3,1fr);gap:22px; }
.step { position:relative;padding:28px 26px;border-radius:16px;background:var(--bg-0);border:0.5px solid var(--border-default);box-shadow:var(--shadow-1); }
.step .n { font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--purple-500); }
.step .ico { width:46px;height:46px;border-radius:12px;background:var(--tint);color:var(--brand-hover);display:grid;place-items:center;margin:16px 0 18px; }
.step h3 { font-size:19px;margin-bottom:8px;font-weight:700;line-height:1.1; }
.step p { font-size:14.5px;color:var(--fg-2);line-height:1.55; }
.step-arrow { position:absolute;top:42px;right:-22px;color:var(--neutral-300);z-index:2; }

/* ── Features ─────────────────────────────────────────────── */
.feat-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:18px; }
.feat { padding:26px 24px;border-radius:16px;background:var(--bg-0);border:0.5px solid var(--border-default);transition:transform .16s,box-shadow .16s,border-color .16s; }
.feat:hover { transform:translateY(-3px);box-shadow:var(--shadow-2);border-color:var(--purple-200); }
.feat .ico { width:42px;height:42px;border-radius:11px;display:grid;place-items:center;margin-bottom:16px; }
.feat h3 { font-size:17px;margin-bottom:8px;font-weight:700; }
.feat p { font-size:14px;color:var(--fg-2);line-height:1.55; }
.feat code { font-size:12px;background:var(--bg-2);padding:1px 5px;border-radius:4px; }
.feat .tagrow { margin-top:14px;display:flex;flex-wrap:wrap;gap:6px; }
.minitag { font-family:var(--font-mono);font-size:11px;color:var(--fg-3);background:var(--bg-2);border:0.5px solid var(--border-default);padding:2px 8px;border-radius:6px; }

/* ── API showcase ─────────────────────────────────────────── */
.api-split { display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:54px;align-items:center; }
.api-list { list-style:none;margin:0;padding:0; }
.api-list li { display:flex;gap:14px;padding:16px 0;border-bottom:0.5px solid var(--border-default); }
.api-list li:last-child { border-bottom:0; }
.api-list .ai { width:34px;height:34px;border-radius:9px;background:var(--bg-2);color:var(--brand-hover);display:grid;place-items:center;flex:0 0 auto; }
.api-list h4 { font-size:15.5px;margin-bottom:3px;font-weight:700; }
.api-list p { font-size:13.5px;color:var(--fg-2);margin:0; }
.api-list code { font-size:12.5px; }
.code-card { background:var(--neutral-950);border-radius:16px;box-shadow:var(--shadow-4);overflow:hidden;border:1px solid rgba(255,255,255,.06); }
.code-tabs { display:flex;align-items:center;gap:4px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.07); }
.code-tabs .ttl { margin-left:auto;font-family:var(--font-mono);font-size:11px;color:#6f7596; }
.ctab { font-family:var(--font-mono);font-size:12px;color:#9aa0c0;background:transparent;border:none;padding:5px 11px;border-radius:7px;cursor:pointer;transition:background .14s,color .14s; }
.ctab.active { background:rgba(127,119,221,.22);color:#fff; }
.code-card pre { margin:0;padding:20px 22px;font-family:var(--font-mono);font-size:13px;line-height:1.85;color:#d7dae8;overflow-x:auto;white-space:pre-wrap; }

/* ── Screenshots ──────────────────────────────────────────── */
.shots { display:grid;grid-template-columns:1fr 1fr;gap:26px; }
.shot { border-radius:14px;overflow:hidden;border:0.5px solid var(--border-default);box-shadow:var(--shadow-3);background:var(--bg-0); }
.shot .cap { display:flex;align-items:center;gap:7px;padding:9px 14px;border-bottom:0.5px solid var(--border-default);background:var(--bg-1); }
.shot .cap .tl { width:9px;height:9px;border-radius:50%; }
.shot .cap span { margin-left:8px;font-family:var(--font-mono);font-size:11px;color:var(--fg-3); }
.shot .cap .tl:first-child { margin-left:0; }
.shot img { display:block;width:100%;height:auto; }
.shot .desc { padding:16px 18px; }
.shot .desc h4 { font-size:15px;margin-bottom:5px;font-weight:700; }
.shot .desc p { font-size:13.5px;color:var(--fg-2); }

/* ── Audience ─────────────────────────────────────────────── */
.aud { display:flex;flex-wrap:wrap;gap:10px;justify-content:center; }
.aud .chip { display:inline-flex;align-items:center;gap:9px;padding:11px 18px;border-radius:999px;background:var(--bg-0);border:0.5px solid var(--border-default);font-size:14.5px;font-weight:500;box-shadow:var(--shadow-1); }
.aud .chip svg { color:var(--brand-hover); }

/* ── Pricing ──────────────────────────────────────────────── */
.price-grid { display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:840px;margin:0 auto; }
.plan { position:relative;border-radius:18px;background:var(--bg-0);border:0.5px solid var(--border-default);padding:34px 32px;box-shadow:var(--shadow-1); }
.plan.pro { border:1.5px solid var(--purple-300);box-shadow:var(--shadow-3); }
.plan .ribbon { position:absolute;top:-12px;right:28px;background:var(--brand);color:#fff;font-size:11.5px;font-weight:700;padding:5px 12px;border-radius:999px;letter-spacing:.02em;box-shadow:0 4px 12px rgba(127,119,221,.4); }
.plan .pname { font-size:14px;font-weight:700;color:var(--purple-600);text-transform:uppercase;letter-spacing:.06em; }
.plan .pprice { font-size:42px;font-weight:800;letter-spacing:-0.03em;margin-top:14px;display:flex;align-items:baseline;gap:8px; }
.plan .pprice .per { font-size:15px;font-weight:500;color:var(--fg-3);letter-spacing:0; }
.plan .pdesc { font-size:14px;color:var(--fg-2);margin-top:8px;min-height:42px; }
.plan ul { margin:22px 0 26px;display:flex;flex-direction:column;gap:11px;padding:0;list-style:none; }
.plan li { display:flex;gap:10px;font-size:14.5px;color:var(--fg-1);align-items:flex-start; }
.plan li svg { flex:0 0 auto;margin-top:2px;color:var(--green-500); }
.plan .btn { width:100%; }

/* ── Final CTA ────────────────────────────────────────────── */
.cta-band { position:relative;overflow:hidden;border-radius:24px;background:linear-gradient(135deg,var(--purple-700),var(--purple-500) 60%,var(--purple-400));color:#fff;padding:64px 48px;text-align:center;box-shadow:var(--shadow-4); }
.cta-band::after { content:"";position:absolute;inset:0;background:radial-gradient(600px 300px at 85% 120%,rgba(255,255,255,.16),transparent 60%);pointer-events:none; }
.cta-band h2 { color:#fff;font-size:clamp(28px,3.4vw,42px);position:relative;font-weight:700;line-height:1.1; }
.cta-band p { color:rgba(255,255,255,.86);font-size:18px;margin:16px auto 30px;max-width:540px;position:relative; }
.btn-light { background:#fff;color:var(--purple-700);height:50px;padding:0 28px;font-size:16px;box-shadow:0 8px 24px rgba(0,0,0,.18);position:relative; }
.btn-light:hover { background:var(--purple-50); }
.cta-band .note { margin-top:18px;font-size:13px;color:rgba(255,255,255,.72);position:relative; }

/* ── Footer ───────────────────────────────────────────────── */
.ft { padding:64px 0 40px;border-top:0.5px solid var(--border-default);background:var(--bg-1); }
.ft-grid { display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px; }
.ft-grid h5 { font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--fg-3);font-weight:700;margin-bottom:16px; }
.ft-grid a { display:block;font-size:14px;color:var(--fg-2);padding:5px 0;transition:color .14s;text-decoration:none; }
.ft-grid a:hover { color:var(--brand-hover); }
.ft-about p { font-size:14px;color:var(--fg-2);margin-top:14px;max-width:280px;line-height:1.55; }
.ft-bottom { margin-top:48px;padding-top:24px;border-top:0.5px solid var(--border-default);display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--fg-3); }

/* ── Reveal ───────────────────────────────────────────────── */
.reveal { opacity:0;transform:translateY(18px);transition:opacity .6s cubic-bezier(.22,.61,.36,1),transform .6s cubic-bezier(.22,.61,.36,1); }
.reveal.in { opacity:1;transform:none; }
@media (prefers-reduced-motion:reduce) { .reveal { opacity:1;transform:none;transition:none; } }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width:1080px) {
  .float-badge { display:none; }
  .mock-float { right:-8px;width:300px; }
}
@media (max-width:920px) {
  .hero-grid { grid-template-columns:1fr;gap:64px; }
  .mock { max-width:560px; }
  .api-split { grid-template-columns:1fr;gap:36px; }
  .nav-links { display:none; }
  .steps { grid-template-columns:1fr; }
  .step-arrow { display:none; }
  .feat-grid { grid-template-columns:1fr 1fr; }
  .shots { grid-template-columns:1fr; }
}
@media (max-width:600px) {
  .wrap { padding:0 18px; }
  .band { padding:64px 0; }
  .feat-grid { grid-template-columns:1fr; }
  .price-grid { grid-template-columns:1fr; }
  .mock-float { display:none; }
  .cta-band { padding:48px 24px; }
  .ft-grid { grid-template-columns:1fr 1fr;gap:28px; }
  .hero { padding:56px 0 70px; }
}
</style>

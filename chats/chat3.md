# Функциональные требования бекенда

_Started 2026-06-21 10:02 UTC_

---

## User

можешь собрать функциональные требования к бекенду для этого дизайна

## Assistant

Сначала изучу прототип и дизайн-систему, чтобы понять, что за продукт.

_[tool: read_file]_

_[tool: local_ls]_

Изучу экраны прототипа, чтобы понять реальную функциональность продукта.

_[tool: list_files]_

_[tool: local_read]_

Прочитаю экраны прототипа, чтобы извлечь конкретную функциональность каждого экрана.

_[tool: read_file]_

_[tool: read_file]_

Прочитаю оставшиеся экраны — аутентификацию/пространства, PDF и файлы.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Проверю shell.jsx для полноты — навигация и структура.

_[tool: read_file]_

I have a complete picture of the Nerion product surface. This is a documentation deliverable — a backend functional requirements spec derived from the prototype. Let me read the doc skill to nail the print formatting, then build it in the Nerion visual language.

_[tool: read_skill_prompt]_

_[tool: update_todos]_

## Assistant

Let me re-read the design system README and prototype shell to capture the exact visual language before writing.

_[tool: local_read]_

_[tool: read_file]_

Я изучил прототип (23 экрана) и дизайн-систему. Собираю функциональные требования к бекенду как печатный документ в стиле Nerion.

_[tool: update_todos]_

_[tool: write_file]_

_[tool: update_todos]_

Готов документ. Открываю и проверяю.

_[tool: ready_for_verification]_

Готово. Собрал **функциональные требования к бекенду** как печатный документ A4 в стиле Nerion — выведены из прототипа (23 экрана) и дизайн-документа.

13 разделов с трассируемыми ID (FR‑N.N): архитектура и многоарендность (схема-на-пространство), аутентификация, пространства, команда/роли, схема таблиц и полей, записи (CRUD), авто-REST + Swagger, API-ключи, публичные списки, генерация PDF по ГОСТ, хранилище, настройки, нефункциональные. Каждый раздел — таблица эндпоинтов и приоритеты Must/Should; в конце — открытые вопросы к ревью.

Допущения, которые стоит подтвердить: тарифные лимиты, режим публичных списков (анонимно vs токен), кардинальность связей в MVP, версионирование публичного API. Биллинг и вебхуки оставил за рамками — отметил в открытых вопросах. Документ готов к печати в PDF (Cmd/Ctrl+P).


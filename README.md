# TODO API - Dokumentacja

REST API dla menadżera zadań (TODO list) z persystencją danych w pliku JSON.

## Instalacja

```bash
cd endpoint
npm install
```

## Uruchomienie

```bash
npm start
```

Serwer uruchomi się na porcie **3000**.

## Endpointy API

### 1. Sprawdzenie statusu API

**GET** `/status`

Zwraca informacje o statusie API.

**Przykładowa odpowiedź:**
```json
{
  "status": "OK",
  "message": "TODO API is running",
  "timestamp": "2025-11-22T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. Pobranie wszystkich zadań

**GET** `/tasks`

Zwraca listę wszystkich zadań.

**Przykładowa odpowiedź:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "1732270800123abc",
      "title": "Przykładowe zadanie",
      "description": "Opis zadania",
      "assignee": "Jan Kowalski",
      "priority": "high",
      "deadline": "2025-11-30",
      "category": "Praca",
      "completed": false,
      "createdAt": "2025-11-22T10:00:00.000Z",
      "updatedAt": "2025-11-22T10:00:00.000Z"
    }
  ]
}
```

### 3. Pobranie pojedynczego zadania

**GET** `/tasks/:id`

Zwraca szczegóły konkretnego zadania.

**Przykładowa odpowiedź:**
```json
{
  "success": true,
  "data": {
    "id": "1732270800123abc",
    "title": "Przykładowe zadanie",
    "completed": false
  }
}
```

### 4. Dodanie nowego zadania

**POST** `/tasks`

Tworzy nowe zadanie.

**Body (JSON):**
```json
{
  "title": "Nowe zadanie",
  "description": "Opis",
  "assignee": "Jan Kowalski",
  "priority": "medium",
  "deadline": "2025-12-01",
  "category": "Praca"
}
```

**Wymagane pola:**
- `title` - tytuł zadania (obowiązkowy)

**Opcjonalne pola:**
- `description` - opis zadania
- `assignee` - osoba przypisana
- `priority` - priorytet (low/medium/high)
- `deadline` - termin (format: YYYY-MM-DD)
- `category` - kategoria

**Przykładowa odpowiedź:**
```json
{
  "success": true,
  "message": "Zadanie zostało utworzone",
  "data": {
    "id": "1732270800123abc",
    "title": "Nowe zadanie",
    "description": "Opis",
    "assignee": "Jan Kowalski",
    "priority": "medium",
    "deadline": "2025-12-01",
    "category": "Praca",
    "completed": false,
    "createdAt": "2025-11-22T10:30:00.000Z",
    "updatedAt": "2025-11-22T10:30:00.000Z"
  }
}
```

### 5. Modyfikacja zadania

**PUT** `/tasks/:id`

Aktualizuje istniejące zadanie.

**Body (JSON):**
```json
{
  "title": "Zaktualizowany tytuł",
  "completed": true,
  "priority": "high"
}
```

**Przykładowa odpowiedź:**
```json
{
  "success": true,
  "message": "Zadanie zostało zaktualizowane",
  "data": {
    "id": "1732270800123abc",
    "title": "Zaktualizowany tytuł",
    "completed": true,
    "priority": "high",
    "updatedAt": "2025-11-22T11:00:00.000Z"
  }
}
```

### 6. Usunięcie zadania

**DELETE** `/tasks/:id`

Usuwa zadanie.

**Przykładowa odpowiedź:**
```json
{
  "success": true,
  "message": "Zadanie zostało usunięte",
  "data": {
    "id": "1732270800123abc",
    "title": "Usunięte zadanie"
  }
}
```

## Kody odpowiedzi HTTP

- `200 OK` - Operacja zakończona sukcesem
- `201 Created` - Zasób został utworzony
- `400 Bad Request` - Błędne dane wejściowe
- `404 Not Found` - Nie znaleziono zasobu
- `500 Internal Server Error` - Błąd serwera

## Przykłady użycia (curl)

### Sprawdzenie statusu
```bash
curl http://localhost:3000/status
```

### Pobranie wszystkich zadań
```bash
curl http://localhost:3000/tasks
```

### Dodanie zadania
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Nowe zadanie\",\"priority\":\"high\"}"
```

### Aktualizacja zadania
```bash
curl -X PUT http://localhost:3000/tasks/1732270800123abc \
  -H "Content-Type: application/json" \
  -d "{\"completed\":true}"
```

### Usunięcie zadania
```bash
curl -X DELETE http://localhost:3000/tasks/1732270800123abc
```

## Przechowywanie danych

Wszystkie zadania są zapisywane w pliku `tasks.json` w tym samym folderze co serwer. Dane są persystentne i zachowują się między restartami serwera.

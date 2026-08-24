# Semester Routes Documentation

## Semester Management Routes

### Create Semester
```http
POST http://localhost:3000/api/semesters/create
```
- **Auth Required**: Yes (Bearer Token)
- **Content-Type**: application/json
```json
{
    "semester": "Agosto - Diciembre 2025"
}
```

### Get All Semesters
```http
GET http://localhost:3000/api/semesters/list
```
- **Auth Required**: Yes (Bearer Token)
- **Content-Type**: application/json

### Update Semester
```http
PUT http://localhost:3000/api/semesters/update
```
- **Auth Required**: Yes (Bearer Token)
- **Content-Type**: application/json
```json
{
    "semester_id": 1,
    "semester": "2025-1"
}
```

### Delete Semester
```http
DELETE http://localhost:3000/api/semesters/delete/:semester_id
```
- **Auth Required**: Yes (Bearer Token)
- **URL Parameters**: 
  - `semester_id`: ID of the semester to delete

## Response Format
All endpoints return responses in the following format:
```json
{
    "status": true,
    "message": "Operation message",
    "data": null | {} | []
}
```

### Success Response Example
```json
{
    "status": true,
    "message": "Semester created successfully",
    "data": {
        "id": 1,
        "semester": "Agosto - Diciembre 2025"
    }
}
```

### Error Response Example
```json
{
    "status": false,
    "message": "Semester already exists in database",
    "data": null
}
```

## Notes
- All routes require authentication via Bearer token
- Semester values must be unique
- Semester values are limited to 30 characters
- Canonical format: "<Period> <Year>", i.e. "Enero - Junio 2025" or "Agosto - Diciembre 2025".
  The frontend sorter (`src/utils/semesters.js`) reads the last space-separated token as
  the year and looks for "AGO"/"DIC" in the leading text to identify the second period.
  A format like "2025-2" makes both semesters of a year sort as a tie.
- The two semesters of the current year are created automatically at backend startup;
  older ones are added by an admin from the Semestres screen.
- Deleting a semester will affect all reports associated with it
- Consider checking for existing reports before deletion
### ตัวอย่าง CRUD ที่สามารถใช้งานได้ ใน NextJS + NodeJS ###
### การติดตั้ง
1. Clone โปรเจกต์ไปที่เครื่อง
2. รันคำสั่ง `npm install`
3. สร้าง Database ใน MySQL ชื่อ `my_db`
4. รัน SQL Script:
   ```sql
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255),
     email VARCHAR(255),
     image VARCHAR(255)
   );
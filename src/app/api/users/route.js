import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'node:path';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'my_db',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

const deletePhysicalFile = async (fileName) => {
    if (!fileName) return;
    try {
        const filePath = path.join(process.cwd(), 'public/uploads', fileName);
        await unlink(filePath);
    } catch (err) {
        console.error(`ลบไฟล์ล้มเหลว: ${err.message}`);
    }
};

const uploadFile = async (file) => {
    if (!file || typeof file === 'string') return null;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(process.cwd(), 'public/uploads', fileName);
    await writeFile(filePath, buffer);
    return fileName;
};

export async function POST(req) {
    try {
        const formData = await req.formData();
        const name = formData.get('name');
        const email = formData.get('email');
        const file = formData.get('image');

        const fileName = await uploadFile(file);
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, image) VALUES (?, ?, ?)',
            [name, email, fileName]
        );

        return NextResponse.json({ id: result.insertId, success: true });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const [rows] = await pool.execute('SELECT * FROM users ORDER BY id DESC');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const formData = await req.formData();
        const id = formData.get('id');
        const name = formData.get('name');
        const email = formData.get('email');
        const file = formData.get('image');
        const deleteImage = formData.get('deleteImage');

        const [currentUser] = await pool.execute('SELECT image FROM users WHERE id = ?', [id]);
        const oldImage = currentUser[0]?.image;

        let sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
        let params = [name, email, id];

        if (file && typeof file !== 'string') {
            const fileName = await uploadFile(file);
            await deletePhysicalFile(oldImage);
            sql = 'UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?';
            params = [name, email, fileName, id];
        } 
        else if (deleteImage === 'true') {
            await deletePhysicalFile(oldImage);
            sql = 'UPDATE users SET name = ?, email = ?, image = NULL WHERE id = ?';
            params = [name, email, id];
        }

        await pool.execute(sql, params);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { id } = await req.json();
        const [currentUser] = await pool.execute('SELECT image FROM users WHERE id = ?', [id]);
        const imageToDelete = currentUser[0]?.image;

        if (imageToDelete) {
            await deletePhysicalFile(imageToDelete);
        }

        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
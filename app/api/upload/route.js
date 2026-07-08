import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'public/uploads', file.name);
        await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

        return new Response(JSON.stringify({ message: "File uploaded", path: `/uploads/${file.name}` }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises"; // Use promises version
import path from "path";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[]; // Accept multiple files

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public/uploads");

        // Ensure upload directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        const uploadedUrls: string[] = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            // Clean filename and add timestamp to avoid duplicates
            const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
            const filePath = path.join(uploadDir, filename);

            await writeFile(filePath, buffer);
            uploadedUrls.push(`/uploads/${filename}`);
        }

        return NextResponse.json({ urls: uploadedUrls });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

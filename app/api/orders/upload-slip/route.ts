import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import pool from "@/lib/db";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const orderId = formData.get("order_id");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        if (!orderId) {
            return NextResponse.json({ error: "Order ID required" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public/uploads/slips");

        // Ensure upload directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `slip-${orderId}-${Date.now()}-${file.name.replace(/\s/g, "_")}`;
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);
        const fileUrl = `/uploads/slips/${filename}`;

        // Update Order in Database
        await pool.execute(
            "UPDATE orders SET payment_slip = ?, payment_status = 'Pending Verification' WHERE id = ?",
            [fileUrl, orderId]
        );

        // Notify Admins/Sellers (Optional - implementing for Admin here as primary verifier)
        // In a real multi-seller app, each seller might need notification if the order is split.
        // For simplicity, we assume Admin verifies payments or user waits.

        return NextResponse.json({ success: true, url: fileUrl });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

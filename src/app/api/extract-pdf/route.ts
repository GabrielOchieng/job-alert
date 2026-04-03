import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParser = new (PDFParser as any)(undefined, true);

    const extractedText = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError || "Unknown parsing error");
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const rawText = (pdfParser as any).getRawTextContent();
        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

    // SAFE CLEANUP:
    // 1. Manually replace %20 with spaces instead of decodeURIComponent
    // 2. Remove the page break markers
    const cleanText = extractedText
      .replace(/%20/g, " ")
      .replace(/%2C/g, ",")
      .replace(/%2F/g, "/")
      .replace(/----------------page \(\d+\) break----------------/g, "\n")
      .trim();

    return NextResponse.json({ text: cleanText });
  } catch (error: any) {
    console.error("PDF Extraction Error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 },
    );
  }
}

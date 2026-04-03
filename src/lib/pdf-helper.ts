// import { jsPDF } from "jspdf";

// export const generateTailoredPDF = (tailoredData: any, job: any) => {
//   // 1. Layout Config: A4 Format (8.27" x 11.69")
//   const doc = new jsPDF({
//     format: "a4",
//     unit: "pt", // Using points for fine control over pt spacing
//   });

//   const pageWidth = doc.internal.pageSize.getWidth();

//   // 2. Margins & Padding
//   const marginX = 72; // 1 inch = 72pt (Left & Right margins)
//   const marginY = 72; // 1 inch = 72pt (Top & Bottom margins)
//   const leftColWidth = 160;
//   const rightColX = marginX + leftColWidth + 24; // 24pt gap between sections

//   // 3. Text Config: Font Size "S" and Line Height 100%
//   const baseFontSize = 9; // "Small" typically maps to 9pt
//   const titleFontSize = 11;
//   const nameFontSize = 24;
//   const lineHeight = 1.2; // Equivalent to 100% line height for readability in PDF

//   // --- Header: GABRIEL OCHIENG ---
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(nameFontSize);
//   doc.setTextColor(33, 33, 33);
//   doc.text("GABRIEL OCHIENG", pageWidth / 2, marginY - 20, { align: "center" });

//   doc.setFontSize(baseFontSize);
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(100);
//   doc.text(
//     "SOFTWARE DEVELOPER  |  NAIROBI, KENYA  |  +254792390805",
//     pageWidth / 2,
//     marginY - 5,
//     { align: "center" },
//   );

//   // --- Left Column (Sidebar) ---
//   let leftY = marginY + 20;
//   doc.setTextColor(33, 33, 33);

//   // Details Section
//   doc.setFont("helvetica", "bold");
//   doc.text("DETAILS", marginX, leftY);
//   leftY += 12; // Inside content block spacing
//   doc.setFont("helvetica", "normal");
//   doc.text(
//     ["Nairobi", "Kenya", "+254792390805", "ogingagabriel@gmail.com"],
//     marginX,
//     leftY,
//     { lineHeightFactor: lineHeight },
//   );

//   // Skills Section (Merging Base + AI Missing Keywords)
//   leftY += 48; // Between sections: 24pt-48pt
//   doc.setFont("helvetica", "bold");
//   doc.text("SKILLS", marginX, leftY);
//   leftY += 12;
//   doc.setFont("helvetica", "normal");
//   const baseSkills = [
//     "JavaScript, TypeScript",
//     "React, Next.js",
//     "Node.js, Express",
//     "Redux, Zustand",
//     "Tailwind, MUI",
//   ];
//   const combinedSkills = [
//     ...baseSkills,
//     ...(tailoredData.keyKeywordsMissing || []),
//   ];
//   doc.text(combinedSkills, marginX, leftY, { lineHeightFactor: 1.5 });

//   // --- Right Column (Main Content) ---
//   let rightY = marginY + 20;

//   // Profile Section (AI Optimized)
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(titleFontSize);
//   doc.text("PROFILE", rightColX, rightY);
//   rightY += 16; // Between Title & Content
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(baseFontSize);
//   const summary = doc.splitTextToSize(
//     tailoredData.optimizedSummary,
//     pageWidth - rightColX - marginX,
//   );
//   doc.text(summary, rightColX, rightY, { lineHeightFactor: lineHeight });

//   // Employment History Section
//   rightY += summary.length * 12 + 24; // Between sections
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(titleFontSize);
//   doc.text("EMPLOYMENT HISTORY", rightColX, rightY);

//   // 1. Jambojet (AI Optimized Bullets)
//   rightY += 16;
//   doc.setFontSize(baseFontSize + 1);
//   doc.text("Frontend Developer at Jambojet, Nairobi", rightColX, rightY);
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(baseFontSize - 1);
//   doc.setTextColor(120);
//   doc.text("Nov 2024 — Present", rightColX, rightY + 12);

//   doc.setTextColor(33, 33, 33);
//   doc.setFontSize(baseFontSize);
//   rightY += 24; // Between Content blocks
//   tailoredData.suggestedBulletPoints.forEach((point: string) => {
//     const lines = doc.splitTextToSize(
//       `• ${point}`,
//       pageWidth - rightColX - marginX - 10,
//     );
//     doc.text(lines, rightColX, rightY, { lineHeightFactor: lineHeight });
//     rightY += lines.length * 12 + 4; // Inside content block
//   });

//   // 2. Shop Online
//   rightY += 12;
//   doc.setFont("helvetica", "bold");
//   doc.text(
//     "Junior Full Stack Developer at Shop Online, New York",
//     rightColX,
//     rightY,
//   );
//   doc.setFont("helvetica", "normal");
//   doc.text(
//     "• Completed products through SDLC and enhanced backend performance.",
//     rightColX,
//     rightY + 12,
//   );

//   // --- Vertical Divider (Mimicking resume.io layout) ---
//   doc.setDrawColor(230);
//   doc.setLineWidth(1);
//   doc.line(
//     rightColX - 12,
//     marginY,
//     rightColX - 12,
//     doc.internal.pageSize.getHeight() - marginY,
//   );

//   doc.save(`Gabriel_Ochieng_Resume_${job.company}.pdf`);
// };

import { jsPDF } from "jspdf";

export const generateTailoredPDF = (tailoredData: any, job: any) => {
  // A4 Config (8.27" x 11.69") based on your layout settings
  const doc = new jsPDF({
    format: "a4",
    unit: "pt",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 72; // 1 inch margins
  const marginY = 72;
  const leftColX = marginX;
  const dividerX = 230; // Sidebar boundary
  const rightColX = dividerX + 24; // 24pt gap between sections

  const baseFontSize = 9; // "Small" font setting
  const titleFontSize = 11;
  const nameFontSize = 24;
  const lineHeight = 1.2;

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameFontSize);
  doc.setTextColor(33, 33, 33);
  doc.text("GABRIEL OCHIENG", pageWidth / 2, marginY - 20, { align: "center" });

  doc.setFontSize(baseFontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    "FRONTEND ENGINEER & AI INTEGRATOR  |  NAIROBI  |  +254792390805",
    pageWidth / 2,
    marginY - 5,
    { align: "center" },
  );

  // --- Left Column (Sidebar) ---
  let leftY = marginY + 20;
  doc.setTextColor(33, 33, 33);

  // Details from your CV
  doc.setFont("helvetica", "bold");
  doc.text("DETAILS", leftColX, leftY);
  leftY += 12;
  doc.setFont("helvetica", "normal");
  doc.text(
    ["Nairobi, Kenya", "+254792390805", "ogingagabriel@gmail.com"],
    leftColX,
    leftY,
    { lineHeightFactor: lineHeight },
  );

  // Links from your CV
  leftY += 40;
  doc.setFont("helvetica", "bold");
  doc.text("LINKS", leftColX, leftY);
  leftY += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(37, 99, 235);
  doc.text(["Portfolio", "Github", "LinkedIn"], leftColX, leftY, {
    lineHeightFactor: 1.5,
  });

  // Technical Skills (Merged Base + AI Keywords)
  leftY += 60;
  doc.setTextColor(33, 33, 33);
  doc.setFont("helvetica", "bold");
  doc.text("TECHNICAL SKILLS", leftColX, leftY);
  leftY += 12;
  doc.setFont("helvetica", "normal");
  const baseSkills = [
    "React, Next.js, TypeScript",
    "Node.js, Express",
    "Redux, Zustand",
    "Tanstack Query",
    "Tailwind, MUI",
  ];
  const combinedSkills = [
    ...baseSkills,
    ...(tailoredData.keyKeywordsMissing || []),
  ];
  doc.text(combinedSkills, leftColX, leftY, { lineHeightFactor: 1.6 });

  // AI & Automation Section
  leftY += combinedSkills.length * 12 + 15;
  doc.setFont("helvetica", "bold");
  doc.text("AI & AUTOMATION", leftColX, leftY);
  leftY += 12;
  doc.setFont("helvetica", "normal");
  doc.text(
    [
      "LLM Integration (Gemini, OpenAI)",
      "AI Prompt Engineering",
      "Workflow Automation",
    ],
    leftColX,
    leftY,
    { lineHeightFactor: 1.6 },
  );

  // --- Vertical Divider ---
  doc.setDrawColor(230);
  doc.line(dividerX, marginY, dividerX, 780);

  // --- Right Column (Main Content) ---
  let rightY = marginY + 20;

  // Profile (AI Optimized)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleFontSize);
  doc.text("PROFILE", rightColX, rightY);
  rightY += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(baseFontSize);
  const summary = doc.splitTextToSize(
    tailoredData.optimizedSummary,
    pageWidth - rightColX - marginX,
  );
  doc.text(summary, rightColX, rightY, { lineHeightFactor: lineHeight });

  // Employment History
  rightY += summary.length * 12 + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleFontSize);
  doc.text("EMPLOYMENT HISTORY", rightColX, rightY);

  // 1. Jambojet (AI Impact Bullets)
  rightY += 16;
  doc.setFontSize(baseFontSize);
  doc.text("Frontend Developer at Jambojet, Nairobi", rightColX, rightY);
  doc.setFontSize(baseFontSize - 1);
  doc.setTextColor(120);
  doc.text("Nov 2024 — Present", rightColX, rightY + 12);

  doc.setTextColor(33, 33, 33);
  doc.setFontSize(baseFontSize);
  rightY += 24;
  tailoredData.suggestedBulletPoints.forEach((point: string) => {
    const lines = doc.splitTextToSize(
      `• ${point}`,
      pageWidth - rightColX - marginX,
    );
    doc.text(lines, rightColX, rightY, { lineHeightFactor: lineHeight });
    rightY += lines.length * 12 + 4;
  });

  // 2. Shop Online (Original CV Data)
  rightY += 12;
  doc.setFont("helvetica", "bold");
  doc.text(
    "Junior Full Stack Developer at Shop Online, New York",
    rightColX,
    rightY,
  );
  doc.setFont("helvetica", "normal");
  doc.text("Jan 2024 — Oct 2024", pageWidth - marginX, rightY, {
    align: "right",
  });
  rightY += 12;
  const shopBullets = [
    "Successfully completed software products through the SDLC, ensuring timely delivery.",
    "Implemented robust backend solutions, significantly enhancing system performance.",
  ];
  shopBullets.forEach((b) => {
    doc.text(`• ${b}`, rightColX, rightY);
    rightY += 12;
  });

  // Education (Original CV Data)
  rightY += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleFontSize);
  doc.text("EDUCATION", rightColX, rightY);
  rightY += 16;
  doc.setFontSize(baseFontSize);
  doc.text(
    "BSc. Environmental Health, Kenyatta University, Nairobi",
    rightColX,
    rightY,
  );
  doc.setFont("helvetica", "normal");
  doc.text("Aug 2016 — Jul 2021", pageWidth - marginX, rightY, {
    align: "right",
  });

  doc.save(`Gabriel_Ochieng_Tailored_${job.company.replace(/\s+/g, "_")}.pdf`);
};

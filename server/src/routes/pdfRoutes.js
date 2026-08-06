const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { PDFDocument, rgb, StandardFonts, PageSizes } = require('pdf-lib');

// Typography
const FONT_SIZES = {
  name: 28,          // Candidate Name
  designation: 14,   // Job Title (optional)
  section: 13,       // Section Heading
  itemTitle: 11.5,   // Company / School / Project
  body: 10.5,        // Main Text
  contact: 9.5,      // Contact Info
  small: 8.5         // Dates / Minor Text
};

// Layout
const MARGINS = {
  left: 45,
  right: 45,
  top: 45,
  bottom: 45
};

const LINE_HEIGHT = 17;

const SECTION_GAP = 18;
const ITEM_GAP = 12;
const PARAGRAPH_GAP = 6;

const PAGE_WIDTH = PageSizes.A4[0];
const PAGE_HEIGHT = PageSizes.A4[1];
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

const CONTACT_ICONS = {
  Email: '\u0040',
  Phone: '\u0028\u0029',
  LinkedIn: 'in/',
  GitHub: 'gh/',
  Portfolio: '\u005B\u005D'
};

const clean = (text = '') => {
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
};

const wrapText = (text = '', font, fontSize, maxWidth) => {
  text = clean(text);

  if (!text) return [''];

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }

      // Handle extremely long words
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let part = '';

        for (const char of word) {
          const testPart = part + char;

          if (font.widthOfTextAtSize(testPart, fontSize) <= maxWidth) {
            part = testPart;
          } else {
            lines.push(part);
            part = char;
          }
        }

        currentLine = part;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};
const parseResumeLines = (lines) => {
  const sections = [];
  let currentSection = null;

  const sectionNames = [
    'SUMMARY',
    'OBJECTIVE',
    'SKILLS',
    'TECHNICAL SKILLS',
    'EXPERIENCE',
    'WORK EXPERIENCE',
    'EDUCATION',
    'PROJECTS',
    'CERTIFICATIONS',
    'ACHIEVEMENTS',
    'LANGUAGES',
    'INTERESTS',
    'HOBBIES',
    'REFERENCES'
  ];

  for (let line of lines) {
    line = clean(line);

    if (!line) continue;

    const upper = line.toUpperCase();

    // Detect section headings
    if (sectionNames.includes(upper)) {
      currentSection = {
        title: upper,
        items: []
      };
      sections.push(currentSection);
      continue;
    }

    // Everything before first section becomes header
    if (!currentSection) {
      if (!sections.length || sections[0].title !== 'HEADER') {
        sections.push({
          title: 'HEADER',
          items: []
        });
      }

      sections[0].items.push(line);
      continue;
    }

    currentSection.items.push(line);
  }

  return sections;
};

const drawSectionHeader = (
  page,
  font,
  boldFont,
  y,
  title,
  accentColor,
  style = "underline"
) => {

  const text = clean(title).toUpperCase();
  const textWidth = boldFont.widthOfTextAtSize(text, FONT_SIZES.section);

  // Filled Header
  if (style === "box" || style === "fill") {

    page.drawRectangle({
      x: MARGINS.left,
      y: y - 4,
      width: textWidth + 18,
      height: 20,
      color: accentColor,
      borderRadius: 2
    });

    page.drawText(text, {
      x: MARGINS.left + 9,
      y: y + 2,
      size: FONT_SIZES.section,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    return y - 28;
  }

  // Draw title
  page.drawText(text, {
    x: MARGINS.left,
    y,
    size: FONT_SIZES.section,
    font: boldFont,
    color: accentColor
  });

  // Underline
  if (style === "underline") {

    page.drawLine({
      start: {
        x: MARGINS.left,
        y: y - 5
      },
      end: {
        x: MARGINS.left + textWidth + 12,
        y: y - 5
      },
      color: accentColor,
      thickness: 2
    });
  }

  // Full width line
  else if (style === "line") {

    page.drawLine({
      start: {
        x: MARGINS.left,
        y: y - 5
      },
      end: {
        x: PAGE_WIDTH - MARGINS.right,
        y: y - 5
      },
      color: accentColor,
      thickness: 1
    });
  }

  // Double line
  else if (style === "double") {

    page.drawLine({
      start: {
        x: MARGINS.left,
        y: y + 3
      },
      end: {
        x: PAGE_WIDTH - MARGINS.right,
        y: y + 3
      },
      color: accentColor,
      thickness: 1
    });

    page.drawLine({
      start: {
        x: MARGINS.left,
        y: y - 6
      },
      end: {
        x: PAGE_WIDTH - MARGINS.right,
        y: y - 6
      },
      color: accentColor,
      thickness: 1
    });
  }

  return y - 26;
};

const renderBullet = (
  page,
  font,
 boldFont,
  y,
  text,
  accentColor,
  textColor,
  maxWidth
) => {
  // Clean unwanted characters
  const cleanedText = clean(text || "");

  if (!cleanedText.trim()) return y;

  // Bullet and text positions
  const bulletX = MARGINS.left;
  const textX = bulletX + 16;

  // Wrap text so it fits within page width
  const wrappedLines = wrapText(
    cleanedText,
    font,
    FONT_SIZES.body,
    maxWidth - 16
  );

  wrappedLines.forEach((line, index) => {
    if (y < MARGINS.bottom + 20) return;

    // Draw bullet only for first line
    if (index === 0) {
      page.drawText("•", {
        x: bulletX,
        y,
        size: FONT_SIZES.body + 1,
        font: boldFont,
        color: accentColor,
      });
    }

    // Draw wrapped text
    page.drawText(line, {
      x: textX,
      y,
      size: FONT_SIZES.body,
      font,
      color: textColor,
    });

    y -= LINE_HEIGHT;
  });

  // Extra spacing between bullet points
  y -= 4;

  return y;
};
const renderContactItem = (
  page,
  font,
  boldFont,
  y,
  label,
  value,
  bulletColor,
  textColor,
  bulletChar = "\u2022"
) => {
  if (!value || !value.trim()) return y;

  if (y < MARGINS.bottom + 20) return y;

  const iconChar = label && CONTACT_ICONS[label] ? CONTACT_ICONS[label] : bulletChar;

  const contactText = clean(
    label ? `${label}: ${value}` : value
  );

  const bulletX = MARGINS.left;
  const textX = bulletX + 16;

  // Wrap long contact information
  const wrappedLines = wrapText(
    contactText,
    font,
    FONT_SIZES.contact,
    CONTENT_WIDTH - 20
  );

  wrappedLines.forEach((line, index) => {
    if (y < MARGINS.bottom + 15) return;

    // Draw bullet only once
    if (index === 0) {
      page.drawText(iconChar, {
        x: bulletX,
        y,
        size: FONT_SIZES.contact + 1,
        font: boldFont,
        color: bulletColor || rgb(0.25, 0.45, 0.75),
      });
    }

    page.drawText(line, {
      x: textX,
      y,
      size: FONT_SIZES.contact,
      font,
      color: textColor || rgb(0.35, 0.35, 0.35),
    });

    y -= LINE_HEIGHT * 0.9;
  });

  // Small gap before next contact item
  y -= 3;

  return y;
};

const renderSection = (
  page,
  font,
  boldFont,
  y,
  section,
  accentColor,
  textColor,
  headerStyle = "underline"
) => {

  // Skip empty sections
  if (!section || !section.items || section.items.length === 0) {
    return { page, y };
  }

  // Ensure enough room for heading + first bullet
  const minimumRequiredSpace = 80;

  if (y < MARGINS.bottom + minimumRequiredSpace) {
    page = pdfDoc.addPage(PageSizes.A4);
    y = PAGE_HEIGHT - MARGINS.top;
  }

  // Draw section heading
  y = drawSectionHeader(
    page,
    font,
    boldFont,
    y,
    section.title,
    accentColor,
    headerStyle
  );

  // Draw all bullet items
  for (const item of section.items) {

    // Create new page if necessary
    if (y < MARGINS.bottom + 25) {
      page = pdfDoc.addPage(PageSizes.A4);
      y = PAGE_HEIGHT - MARGINS.top;
    }

    y = renderBullet(
      page,
      font,
      boldFont,
      y,
      item,
      accentColor,
      textColor,
      CONTENT_WIDTH - 15
    );
  }

  // Consistent spacing before next section
  y -= 12;

  return {
    page,
    y
  };
};

// Global PDF instance
let pdfDoc;

const generateModernTemplate = async (pdfDoc, lines, font, boldFont) => {

  let page = pdfDoc.addPage(PageSizes.A4);

  // Modern color palette
  const accent = rgb(0.10, 0.35, 0.75);
  const textColor = rgb(0.20, 0.20, 0.20);
  const secondaryText = rgb(0.45, 0.45, 0.45);
  const divider = rgb(0.85, 0.85, 0.85);

  // Left Accent Bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 8,
    height: PAGE_HEIGHT,
    color: accent
  });

  const sections = parseResumeLines(lines);

  let y = PAGE_HEIGHT - MARGINS.top;

  for (const section of sections) {

    /* =======================
       HEADER
    ======================== */

    if (section.title === "HEADER") {

      const name = clean(section.items[0] || "Your Name");

      page.drawText(name, {
        x: MARGINS.left,
        y,
        size: FONT_SIZES.name,
        font: boldFont,
        color: accent
      });

      y -= 32;

      // Contact Information
      for (let i = 1; i < section.items.length; i++) {

        const parts = section.items[i].split(":");

        const label = parts.length > 1
          ? parts.shift().trim()
          : "";

        const value = parts.length > 0
          ? parts.join(":").trim()
          : section.items[i];

        y = renderContactItem(
          page,
          font,
          boldFont,
          y,
          label,
          value,
           accent,
          secondaryText
        );
      }

      y -= 8;

      // Divider
      page.drawLine({
        start: {
          x: MARGINS.left,
          y
        },
        end: {
          x: PAGE_WIDTH - MARGINS.right,
          y
        },
        thickness: 1,
        color: divider
      });

      y -= 24;

      continue;
    }

    /* =======================
       SECTION
    ======================== */

    const result = renderSection(
      page,
      font,
      boldFont,
      y,
      section,
      accent,
      textColor,
      "underline"
    );

    page = result.page;
    y = result.y;
  }

  return page;
};

const generateClassicTemplate = async (pdfDoc, lines, font, boldFont) => {

  let page = pdfDoc.addPage(PageSizes.A4);

  // Classic monochrome palette
  const accent = rgb(0.15, 0.15, 0.15);
  const textColor = rgb(0.25, 0.25, 0.25);
  const divider = rgb(0.55, 0.55, 0.55);

  const sections = parseResumeLines(lines);

  let y = PAGE_HEIGHT - MARGINS.top;

  for (const section of sections) {

    /* ================= HEADER ================= */

    if (section.title === "HEADER") {

      const name = clean(section.items[0] || "Your Name");

      const nameWidth = boldFont.widthOfTextAtSize(
        name,
        FONT_SIZES.name
      );

      // Center Name
      page.drawText(name, {
        x: (PAGE_WIDTH - nameWidth) / 2,
        y,
        size: FONT_SIZES.name,
        font: boldFont,
        color: accent
      });

      y -= 32;

      // Contact Information
      if (section.items.length > 1) {

        const contact = clean(
          section.items.slice(1).join("   |   ")
        );

        const wrappedContacts = wrapText(
          contact,
          font,
          FONT_SIZES.contact,
          CONTENT_WIDTH
        );

        wrappedContacts.forEach(line => {

          const width = font.widthOfTextAtSize(
            line,
            FONT_SIZES.contact
          );

          page.drawText(line, {
            x: (PAGE_WIDTH - width) / 2,
            y,
            size: FONT_SIZES.contact,
            font,
            color: textColor
          });

          y -= LINE_HEIGHT * 0.9;
        });
      }

      y -= 10;

      // Elegant Divider
      page.drawLine({
        start: {
          x: MARGINS.left,
          y
        },
        end: {
          x: PAGE_WIDTH - MARGINS.right,
          y
        },
        color: divider,
        thickness: 1.2
      });

      y -= 22;

      continue;
    }

    /* ================= BODY ================= */

    const result = renderSection(
      page,
      font,
      boldFont,
      y,
      section,
      accent,
      textColor,
      "line"
    );

    page = result.page;
    y = result.y;
  }

  return page;
};

const generateProfessionalTemplate = async (pdfDoc, lines, font, boldFont) => {

  let page = pdfDoc.addPage(PageSizes.A4);

  const accent = rgb(0.08, 0.18, 0.42);
  const textColor = rgb(0.20, 0.20, 0.20);
  const lightText = rgb(0.90, 0.90, 0.90);
  const divider = rgb(0.80, 0.80, 0.80);

  const sidebarWidth = 170;
  const contentX = sidebarWidth + 20;
  const bulletX = contentX;
  const textX = bulletX + 14;
  const textWidth = PAGE_WIDTH - MARGINS.right - textX;

  const drawSidebarHeader = (page, y) => {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: sidebarWidth,
      height: PAGE_HEIGHT,
      color: accent
    });

    const header = parseResumeLines(lines).find(s => s.title === "HEADER");
    if (!header) return y;

    const name = clean(header.items[0] || "Your Name");
    const nameLines = wrapText(name, boldFont, FONT_SIZES.name, sidebarWidth - 30);
    for (let n = 0; n < nameLines.length; n++) {
      page.drawText(nameLines[n], {
        x: 18,
        y: y - n * LINE_HEIGHT * 0.9,
        size: FONT_SIZES.name,
        font: boldFont,
        color: rgb(1, 1, 1)
      });
    }

    const nameHeight = Math.max(0, (nameLines.length - 1) * LINE_HEIGHT * 0.9);
    let contactY = y - nameHeight - 30;
    for (let i = 1; i < header.items.length; i++) {
      const parts = header.items[i].split(":");
      const label = parts.length > 1 ? parts.shift().trim() : "";
      const value = parts.length ? parts.join(":").trim() : header.items[i];
      
      const contactText = label ? `${label}: ${value}` : value;
      const wrapped = wrapText(contactText, font, FONT_SIZES.contact, sidebarWidth - 24);
      
      for (const line of wrapped) {
        if (contactY < MARGINS.bottom + 20) break;
        page.drawText(line, {
          x: 18,
          y: contactY,
          size: FONT_SIZES.contact,
          font,
          color: lightText
        });
        contactY -= LINE_HEIGHT * 0.85;
      }
    }

    return contactY;
  };

  drawSidebarHeader(page, PAGE_HEIGHT - MARGINS.top);

  const sections = parseResumeLines(lines);
  const contentSections = sections.filter(s => s.title !== "HEADER");

  let mainY = PAGE_HEIGHT - MARGINS.top - 50;

  for (const section of contentSections) {

    if (mainY < MARGINS.bottom + 80) {
      page = pdfDoc.addPage(PageSizes.A4);
      drawSidebarHeader(page, PAGE_HEIGHT - MARGINS.top);
      mainY = PAGE_HEIGHT - MARGINS.top - 50;
    }

    page.drawText(section.title.toUpperCase(), {
      x: contentX,
      y: mainY,
      size: FONT_SIZES.section,
      font: boldFont,
      color: accent
    });

    const titleWidth = boldFont.widthOfTextAtSize(section.title.toUpperCase(), FONT_SIZES.section);
    page.drawLine({
      start: { x: contentX, y: mainY - 4 },
      end: { x: contentX + Math.max(titleWidth + 30, 120), y: mainY - 4 },
      thickness: 1.2,
      color: divider
    });

    mainY -= 22;

    for (const item of section.items) {
      if (mainY < MARGINS.bottom + 20) {
        page = pdfDoc.addPage(PageSizes.A4);
        drawSidebarHeader(page, PAGE_HEIGHT - MARGINS.top);
        mainY = PAGE_HEIGHT - MARGINS.top - 50;

        page.drawText(section.title.toUpperCase(), {
          x: contentX,
          y: mainY,
          size: FONT_SIZES.section,
          font: boldFont,
          color: accent
        });

        const titleWidth = boldFont.widthOfTextAtSize(section.title.toUpperCase(), FONT_SIZES.section);
        page.drawLine({
          start: { x: contentX, y: mainY - 4 },
          end: { x: contentX + Math.max(titleWidth + 30, 120), y: mainY - 4 },
          thickness: 1.2,
          color: divider
        });

        mainY -= 22;
      }

      let itemText = clean(item);
      const hasBullet = itemText.startsWith('- ');
      if (hasBullet) {
        itemText = itemText.substring(2);
      }

      const wrapped = wrapText(itemText, font, FONT_SIZES.body, textWidth);

      for (let i = 0; i < wrapped.length; i++) {
        if (mainY < MARGINS.bottom + 20) break;

        const line = wrapped[i];

        if (i === 0 && hasBullet) {
          page.drawText("\u2022", {
            x: bulletX,
            y: mainY,
            size: FONT_SIZES.body + 1,
            font: boldFont,
            color: accent
          });
        }

        page.drawText(line, {
          x: textX,
          y: mainY,
          size: FONT_SIZES.body,
          font,
          color: textColor
        });

        mainY -= LINE_HEIGHT;
      }

      mainY -= 4;
    }

    mainY -= 10;
  }

  return page;
};

const generateMinimalTemplate = async (pdfDoc, lines, font, boldFont) => {

  let page = pdfDoc.addPage(PageSizes.A4);

  // Minimal Color Palette
  const accent = rgb(0.45, 0.45, 0.45);
  const textColor = rgb(0.18, 0.18, 0.18);
  const divider = rgb(0.82, 0.82, 0.82);

  const sections = parseResumeLines(lines);

  let y = PAGE_HEIGHT - MARGINS.top;

  /* ======================
          HEADER
  ======================= */

  const header = sections.find(s => s.title === "HEADER");

  if (header) {

    const name = clean(header.items[0] || "Your Name");

    page.drawText(name, {
      x: MARGINS.left,
      y,
      size: FONT_SIZES.name,
      font: boldFont,
      color: textColor
    });

    y -= 30;

    // Contact Information
    if (header.items.length > 1) {

      const contact = clean(
        header.items.slice(1).join("   |   ")
      );

      const wrapped = wrapText(
        contact,
        font,
        FONT_SIZES.contact,
        CONTENT_WIDTH
      );

      wrapped.forEach(line => {

        page.drawText(line, {
          x: MARGINS.left,
          y,
          size: FONT_SIZES.contact,
          font,
          color: accent
        });

        y -= LINE_HEIGHT * 0.9;
      });
    }

    y -= 10;

    // Thin Divider
    page.drawLine({
      start: {
        x: MARGINS.left,
        y
      },
      end: {
        x: PAGE_WIDTH - MARGINS.right,
        y
      },
      thickness: 0.8,
      color: divider
    });

    y -= 24;
  }

  /* ======================
        BODY SECTIONS
  ======================= */

  const bodySections = sections.filter(
    s => s.title !== "HEADER"
  );

  for (const section of bodySections) {

    if (y < MARGINS.bottom + 80) {

      page = pdfDoc.addPage(PageSizes.A4);

      y = PAGE_HEIGHT - MARGINS.top;
    }

    const result = renderSection(
      page,
      font,
      boldFont,
      y,
      section,
      accent,
      textColor,
      "line"
    );

    page = result.page;
    y = result.y;
  }

  return page;
};

const generateCreativeTemplate = async (pdfDoc, lines, font, boldFont) => {
  let page = pdfDoc.addPage(PageSizes.A4);

  const accent = rgb(0.50, 0.18, 0.72);
  const accentLight = rgb(0.93, 0.88, 0.98);
  const textColor = rgb(0.20, 0.20, 0.20);
  const secondaryText = rgb(0.55, 0.55, 0.55);

  // ---------- Background ----------
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 140,
    width: PAGE_WIDTH,
    height: 140,
    color: accent
  });

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 148,
    width: PAGE_WIDTH,
    height: 8,
    color: accentLight
  });

  const sections = parseResumeLines(lines);
  const header = sections.find(section => section.title === "HEADER");

  let y = PAGE_HEIGHT - 55;

  // ==========================
  // HEADER
  // ==========================
  if (header) {

    const name = clean(header.items[0] || "Your Name");

    page.drawText(name, {
      x: MARGINS.left,
      y,
      font: boldFont,
      size: FONT_SIZES.name + 4,
      color: rgb(1,1,1)
    });

    y -= LINE_HEIGHT * 1.8;

    // Decorative white line
    page.drawLine({
      start: {
        x: MARGINS.left,
        y
      },
      end: {
        x: MARGINS.left + 120,
        y
      },
      thickness: 2,
      color: rgb(1,1,1)
    });

    y -= 18;

    if (header.items.length > 1) {

      const contacts = header.items.slice(1).join("  •  ");

      const wrapped = wrapText(
        contacts,
        font,
        FONT_SIZES.contact,
        CONTENT_WIDTH - 10
      );

      wrapped.forEach(line => {

        page.drawText(clean(line), {
          x: MARGINS.left,
          y,
          font,
          size: FONT_SIZES.contact,
          color: rgb(0.95,0.95,0.95)
        });

        y -= LINE_HEIGHT * 0.95;

      });

    }

    y -= 25;

  }

  // ==========================
  // BODY
  // ==========================

  for (const section of sections.filter(s => s.title !== "HEADER")) {

    if (y < MARGINS.bottom + 60) {

      page = pdfDoc.addPage(PageSizes.A4);

      y = PAGE_HEIGHT - 60;

    }

    // Decorative purple square

    page.drawRectangle({
      x: MARGINS.left,
      y: y + 4,
      width: 8,
      height: 8,
      color: accent
    });

    page.drawText(section.title.toUpperCase(), {
      x: MARGINS.left + 18,
      y,
      font: boldFont,
      size: FONT_SIZES.section,
      color: accent
    });

    const titleWidth = boldFont.widthOfTextAtSize(
      section.title.toUpperCase(),
      FONT_SIZES.section
    );

    page.drawLine({
      start: {
        x: MARGINS.left + 18 + titleWidth + 10,
        y: y + 5
      },
      end: {
        x: PAGE_WIDTH - MARGINS.right,
        y: y + 5
      },
      thickness: 1,
      color: accentLight
    });

    y -= LINE_HEIGHT * 1.7;

    // Items

    for (const item of section.items) {

      if (y < MARGINS.bottom + 20) {

        page = pdfDoc.addPage(PageSizes.A4);

        y = PAGE_HEIGHT - 60;

      }

      const wrapped = wrapText(
        clean(item),
        font,
        FONT_SIZES.body,
        CONTENT_WIDTH - 18
      );

      wrapped.forEach(line => {

        page.drawCircle({
          x: MARGINS.left + 3,
          y: y + 4,
          size: 2.3,
          color: accent
        });

        page.drawText(line, {
          x: MARGINS.left + 14,
          y,
          font,
          size: FONT_SIZES.body,
          color: textColor
        });

        y -= LINE_HEIGHT;

      });

      y -= 5;

    }

    y -= 12;

  }

};

const generateExecutiveTemplate = async (pdfDoc, lines, font, boldFont) => {
  let page = pdfDoc.addPage(PageSizes.A4);

  const accent = rgb(0.08, 0.08, 0.08);
  const textColor = rgb(0.20, 0.20, 0.20);
  const lightText = rgb(0.85, 0.85, 0.85);

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 100,
    width: PAGE_WIDTH,
    height: 100,
    color: accent
  });

  const sections = parseResumeLines(lines);
  const headerSection = sections.find(s => s.title === "HEADER");
  let y = PAGE_HEIGHT - 50;

  if (headerSection) {
    const name = clean(headerSection.items[0] || "Your Name");

    page.drawText(name, {
      x: MARGINS.left,
      y,
      size: FONT_SIZES.name,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    y -= LINE_HEIGHT * 1.6;

    if (headerSection.items.length > 1) {
      const contact = headerSection.items.slice(1).join("   |   ");
      const wrapped = wrapText(contact, font, FONT_SIZES.contact, CONTENT_WIDTH - 20);

      for (const wLine of wrapped) {
        if (y < MARGINS.bottom) break;
        page.drawText(wLine, {
          x: MARGINS.left,
          y,
          size: FONT_SIZES.contact,
          font,
          color: lightText
        });
        y -= LINE_HEIGHT * 0.9;
      }
    }

    y -= 14;
  }

  for (const section of sections.filter(s => s.title !== "HEADER")) {
    const result = renderSection(
      page,
      font,
      boldFont,
      y,
      section,
      accent,
      textColor,
      "double"
    );

    page = result.page;
    y = result.y;
  }
};

const generateResumePDF = async (req, res) => {

  console.log("Generate PDF route hit");
  
  try {
    // ==========================================
    // Request Body
    // ==========================================
    const {
      resumeText,
      template = "modern",
    } = req.body;

    // ==========================================
    // Validation
    // ==========================================
    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({
        success: false,
        message: "Resume content is required.",
      });
    }

    // ==========================================
    // Clean Resume Text
    // ==========================================
    const sanitizedText = resumeText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, "")
      .trim();

    if (!sanitizedText.length) {
      return res.status(400).json({
        success: false,
        message: "Resume contains no printable content.",
      });
    }

    // ==========================================
    // Create PDF
    // ==========================================
    pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const lines = sanitizedText
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    // ==========================================
    // Template Registry
    // ==========================================
    const templateMap = {
      modern: generateModernTemplate,
      classic: generateClassicTemplate,
      professional: generateProfessionalTemplate,
      minimal: generateMinimalTemplate,
      creative: generateCreativeTemplate,
      executive: generateExecutiveTemplate,
    };

    const selectedTemplate =
      templateMap[template] || templateMap.modern;

    // ==========================================
    // Generate Resume
    // ==========================================
    await selectedTemplate(
      pdfDoc,
      lines,
      font,
      boldFont
    );

    // ==========================================
    // Save PDF
    // ==========================================
    const pdfBytes = await pdfDoc.save();

    // ==========================================
    // Response Headers
    // ==========================================
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume-${Date.now()}.pdf"`,
      "Content-Length": pdfBytes.length,
      "Cache-Control": "no-store",
    });

    return res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("PDF Generation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// Routes
// ==========================================
router.post(
  "/generate-pdf",
  authMiddleware,
  generateResumePDF
);

module.exports = router;
// ==========================================================================
// PdfRenderer — Published View → PDF representation artifact
// Sprint 9.4
//
// Generates a structured JSON representation of the PDF content.
// Real PDF generation requires a PDF library at the engine level;
// this domain-level renderer defines the contract.
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ArtifactRenderer, RenderedArtifact, ViewData, ViewSection } from './types.js';

const CHARS_PER_PAGE = 3000;

interface PageElement {
  type: 'heading' | 'text';
  content: string;
  sectionId?: string;
}

interface PdfPage {
  pageNumber: number;
  elements: PageElement[];
}

interface PdfRepresentation {
  format: 'pdf-representation';
  title: string;
  source: string;
  generatedAt: string;
  renderedAt: string;
  pages: PdfPage[];
  totalPages: number;
}

/**
 * Split sections into pages, respecting section boundaries where possible.
 * Each section heading starts on its own element.
 */
function paginate(sections: ViewSection[], charsPerPage: number): PdfPage[] {
  const pages: PdfPage[] = [];
  let currentPage: PdfPage = { pageNumber: 1, elements: [] };
  let currentChars = 0;

  for (const section of sections) {
    const contentText = typeof section.content === 'string' ? section.content : JSON.stringify(section.content);
    const headingElement: PageElement = {
      type: 'heading',
      content: section.heading,
      sectionId: section.sectionId,
    };
    const textElement: PageElement = {
      type: 'text',
      content: contentText,
      sectionId: section.sectionId,
    };

    const sectionChars = section.heading.length + contentText.length;

    // If this section alone exceeds a page, split mid-section
    if (sectionChars > charsPerPage) {
      // Push heading on current page if there's room, or start new page
      if (currentChars + section.heading.length > charsPerPage && currentPage.elements.length > 0) {
        pages.push(currentPage);
        currentPage = { pageNumber: pages.length + 1, elements: [] };
        currentChars = 0;
      }
      currentPage.elements.push(headingElement);
      currentChars += section.heading.length;

      // Split content across pages
      let remaining = contentText;
      while (remaining.length > 0) {
        const available = charsPerPage - currentChars;
        if (available <= 0) {
          pages.push(currentPage);
          currentPage = { pageNumber: pages.length + 1, elements: [] };
          currentChars = 0;
        }
        const chunk = remaining.slice(0, Math.min(charsPerPage - currentChars, remaining.length));
        currentPage.elements.push({ type: 'text', content: chunk, sectionId: section.sectionId });
        currentChars += chunk.length;
        remaining = remaining.slice(chunk.length);

        if (remaining.length > 0) {
          pages.push(currentPage);
          currentPage = { pageNumber: pages.length + 1, elements: [] };
          currentChars = 0;
        }
      }
      continue;
    }

    // Try to fit the whole section on the current page
    if (currentChars + sectionChars > charsPerPage && currentPage.elements.length > 0) {
      pages.push(currentPage);
      currentPage = { pageNumber: pages.length + 1, elements: [] };
      currentChars = 0;
    }

    currentPage.elements.push(headingElement);
    currentPage.elements.push(textElement);
    currentChars += sectionChars;
  }

  // Push last page if it has content
  if (currentPage.elements.length > 0) {
    pages.push(currentPage);
  }

  // Ensure at least one page
  if (pages.length === 0) {
    pages.push({ pageNumber: 1, elements: [] });
  }

  return pages;
}

export class PdfRenderer implements ArtifactRenderer {
  readonly artifactType: ArtifactType = 'pdf';

  render(view: ViewData): RenderedArtifact {
    const renderedAt = new Date().toISOString();

    const pages = paginate(view.sections, CHARS_PER_PAGE);

    const representation: PdfRepresentation = {
      format: 'pdf-representation',
      title: view.title,
      source: view.source,
      generatedAt: view.generatedAt,
      renderedAt,
      pages,
      totalPages: pages.length,
    };

    const data = JSON.stringify(representation, null, 2);

    return {
      contentType: 'application/pdf',
      data,
      artifactType: 'pdf',
      renderedAt,
      viewId: view.id,
      metadata: view.metadata,
    };
  }
}

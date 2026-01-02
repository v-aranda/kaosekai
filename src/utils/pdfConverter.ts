/**
 * PDF Converter Utility
 * Converte páginas de PDF para array de imagens usando pdfjs-dist
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Garante worker alinhado à mesma versão do bundle (evita mismatch API/worker)
GlobalWorkerOptions.workerSrc = workerSrc;

export interface PdfConversionOptions {
  scale?: number;
  quality?: number;
}

/**
 * Converte todas as páginas de um PDF para array de imagens base64
 * @param pdfUrl URL do arquivo PDF
 * @param options Opções de conversão (escala, qualidade)
 * @returns Promise com array de URLs de imagens
 */
export async function convertPdfToImages(
  pdfUrl: string,
  options: PdfConversionOptions = {}
): Promise<string[]> {
  const { scale = 1.5, quality = 0.92 } = options;

  try {
    // Carregar PDF
    const loadingTask = getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const images: string[] = [];

    // Renderizar cada página
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Criar canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Não foi possível obter contexto 2D do canvas');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Renderizar página no canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // Converter canvas para imagem base64
      const imageUrl = canvas.toDataURL('image/jpeg', quality);
      images.push(imageUrl);
    }

    return images;
  } catch (error) {
    console.error('Erro ao converter PDF:', error);
    throw error;
  }
}

/**
 * Converte uma página específica do PDF
 * @param pdfUrl URL do arquivo PDF
 * @param pageNum Número da página (1-indexed)
 * @param options Opções de conversão
 * @returns Promise com URL da imagem
 */
export async function convertPdfPage(
  pdfUrl: string,
  pageNum: number,
  options: PdfConversionOptions = {}
): Promise<string> {
  const { scale = 1.5, quality = 0.92 } = options;

  try {
    const loadingTask = getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Não foi possível obter contexto 2D do canvas');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.error(`Erro ao converter página ${pageNum}:`, error);
    throw error;
  }
}

/**
 * Obtém número total de páginas de um PDF
 * @param pdfUrl URL do arquivo PDF
 * @returns Promise com número de páginas
 */
export async function getPdfPageCount(pdfUrl: string): Promise<number> {
  try {
    const loadingTask = PDFJS.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Erro ao obter total de páginas:', error);
    throw error;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Lazy-load pdfmake (keeps it out of the main bundle) and download the document. */
export async function downloadPdf(doc: any, filename: string): Promise<void> {
  const pdfMakeMod: any = await import('pdfmake/build/pdfmake')
  const vfsMod: any = await import('pdfmake/build/vfs_fonts')
  const pdfMake = pdfMakeMod.default ?? pdfMakeMod
  // vfs_fonts export shape varies across pdfmake versions — handle the common ones.
  const vfs = vfsMod.pdfMake?.vfs ?? vfsMod.default?.pdfMake?.vfs ?? vfsMod.default?.vfs ?? vfsMod.vfs
  if (vfs) pdfMake.vfs = vfs
  pdfMake.createPdf(doc).download(filename)
}

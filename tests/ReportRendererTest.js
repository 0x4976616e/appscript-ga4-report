function testDocumentRenderer_()
{
  const service = new SpreadsheetService()
  let document = service.openOrCreateSpreadsheetFile('testDocumentRenderer')

  const renderer = new DocumentReportRenderer(document, document.getActiveSheet())
  renderer.addHeader("Header 1", "h1")
  
  createRow = (id)=> { const row = new Map()
    row.set('h1', `value${id}`)
    return row
  }
  
  renderer.render(0,[createRow(1), createRow(2)], new ReportConfig())
}
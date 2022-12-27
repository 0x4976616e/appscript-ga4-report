/**
 * Creates a report with header row in Google Sheeet
 */
class DocumentReportRenderer {
  /**
   * 
   * @param {ReportConfig} config Report configuration 
   * @param {*} reportSheet 
   * @param {*} headerObj 
   */
  constructor(config, reportSheet, headerObj) {
    this._config = config
    this._reportDataSheet = reportSheet

    // 
    this.headerMap = headerObj ? new Map(Object.entries(headerObj)) : new Map()
    this.headerLabels = headerObj ? [...this.headerMap.keys()] : []
    this.headerRow = 1
  }

  /**
   * Adds a header to the renderer
   * 
   * @param {name} a name of header that will be inserted to header row
   * @param {key} a key of data in rows' map (each row is a Map type)
   * 
   * @return renderer instance
   */
  addHeader(name, key)
  {
    this.headerMap.set(name, key)
    this.headerLabels.push(name)
  }

  renderHeader() {
    LogRendering && console.info(`[Google Sheets Renderer] Render header: ${this.headerLabels}`)
    this._reportDataSheet.appendRow(this.headerLabels)

    /*let headerRange = this.sheet.getRange(1, 1, 1, this.headerLabels.length)
    this.spreadsheet.setNamedRange(`Header-${this.sheet.getName()}`, headerRange)*/
  }

  render(fromRow, mappedRows, config) {
    LogRendering && console.info(`[Google Sheets Renderer] Render report: '${this._reportDataSheet.getName()}' from row ${fromRow}`)
    
    if (!mappedRows || mappedRows.length == 0) {
      console.warn('No report data')
      return
    }
    
    const mappedRowsExtended =  this._addDomainAndLastRun(!!config ? config.getDomain() : "", mappedRows).slice(0, config.getTopLimit())

    let data = mappedRowsExtended.map(row =>
      this.headerLabels.map(t => {
        let dataKey = this.headerMap.get(t),
          value = row.get(dataKey)
        return value
      })
    )

    this._reportDataSheet.getRange(fromRow > 0 ? fromRow : 1 /* start row */, 
      1 /* start column */, 
      data.length /* rows */, 
      this.headerLabels.length /* columns */)
        .setValues(data)

    this._addTotalsRow(config)
    this._autoSizeHeader()
  }

    createTotalsRenderer(rowId) {
    return new TotalsRenderer(this._reportDataSheet, rowId)
  }

  createTotalsRenderer() {
    return new TotalsRenderer(this._reportDataSheet, this._reportDataSheet.getLastRow() + 1)
  }

  renderCell(header, row, value)
  {
    const columnId = this.headerLabels.findIndex((e)=> e == header)
    if(columnId == -1)
      throw `Failed render cell, header '${header}' not found`

    this._reportDataSheet.getRange(row, columnId+1).setValue(value)
  }

  findHeaderIndex(headerName)
  {
    if(!this.__headerIndexCache)
    {
      this.__headerIndexCache = new Map()
    }

    if(this.__headerIndexCache.has(headerName))
      return this.__headerIndexCache.get(headerName)

    throw 'Not implemented'
    const headerRange = this._reportDataSheet.getRange(this.headerRow, 1, 1, this.headerLabels.length)
      .createTextFinder(headerName)
      .findNext()

    return headerRange.getColumn()
  }

  _addDomainAndLastRun(domain, rowsOfObject = []) {
    let rows = rowsOfObject.map(row => {
      row.set('product', domain)
      row.set('lastRun', Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyy.MM.dd'))
      return row
    })

    return rows
  }

  _autoSizeHeader()
  {
    this._reportDataSheet.autoResizeColumns(1, this._reportDataSheet.getLastColumn())
  }

  _addTotalsRow(config)
  {
    if (config && config.hasTotals()) {
      this.createTotalsRenderer() // create totals row at the end of document
        .addLabel(config.getDomain(), 1)
        .addAllMetricColumnsSum()
    }
  }
}


class TotalsRenderer {
  constructor(sheet, rowId) {
    this.sheet = sheet
    this.totalRows = sheet.getLastRow()
    this.totalCols = sheet.getLastColumn()
    this.rowId = rowId
  }

  addLabel(label, col) {
    this.sheet
      .getRange(this.rowId, col)
      .setValue(label)
    return this
  }

  addColumnSum(col, firstRow, numberOfRows) {
    let range = this.sheet.getRange(firstRow, col, numberOfRows).getA1Notation()

    this.sheet
      .getRange(this.rowId, col)
      .setFormula(`=SUM(${range})`)
    return this
  }

  addColumnListSum(cols, firstRow, numberOfRows) {
    for (col in cols) {
      this.addColumnSum(col, firstRow, numberOfRows)
    }
    return this
  }

  addColumnsSum(fromColumn, toColumn, firstRow, numberOfRows) {
    let cols = [...new Array(toColumn - fromColumn + 1)].map((e, id) => fromColumn + id)
    cols.forEach(col => this.addColumnSum(col, firstRow, numberOfRows))
    return this
  }

  addAllMetricColumnsSum()
  {
    return this.addColumnsSum(2, this.totalCols - 1, 2, this.totalRows - 1)
  }

}

/**
 * Creates a report in HTML
 */
class HtmlReportRenderer {
  constructor(sheet, templateName, headerObj) {
    this.sheet = sheet
    this.htmlTemplate = HtmlService.createTemplateFromFile(templateName)
    this.headerMap = new Map(Object.entries(headerObj))
    this.headers = [...this.headerMap.keys()]
  }

  /**
   * Renders report data to html from data source
   */
  render(mappedRows, skipColumns = []) {
    LogRendering && console.info(`[Html Renderer] Render report: ${this.sheet.getName()} to HTML using Google Analytics as a data source`)
    let reportHeaders = this.headers.filter(h => skipColumns.indexOf(h) == -1)
    let data = mappedRows.map(row =>
      reportHeaders.map(header => {
        let dataKey = this.headerMap.get(header),
          value = row.get(dataKey)
        return value
      })
    )

    this.htmlTemplate.header = reportHeaders //this.getData()[0]
    this.htmlTemplate.data = data //this.getData().slice(1)
    this.htmlTemplate.totals = null
    let html = this.htmlTemplate.evaluate().getContent()

    return html
  }

  /**
   * Renders 
   */
  renderFromSheetData(hasTotals, skipColumns = []) {
    LogRendering && console.info(`[Html Renderer] Render report: ${this.sheet.getName()} to HTML using Google Sheet as a data source`)

    let allReportData = this.getReportData()

    let skipSet = new Set()
    let reportHeaders = allReportData[0].filter((h, i) => {
      let includeItem = skipColumns.indexOf(h) == -1
      if (!includeItem)
        skipSet.add(i)

      return includeItem
    })

    this.htmlTemplate.header = reportHeaders
    LogRendering && console.log(allReportData.slice(1, allReportData.length - 1),allReportData[allReportData.length-1])

    this.htmlTemplate.data = hasTotals
      ? this._filterData(allReportData.slice(1, allReportData.length - 1), skipSet)
      : this._filterData(allReportData.slice(1), skipSet)

    this.htmlTemplate.totals = hasTotals
      ? this._filterDataRow(allReportData[allReportData.length-1], skipSet)
      : null
    
    LogRendering && console.log(this.htmlTemplate)
    
    let html = this.htmlTemplate.evaluate().getContent()
    return html
  }

  _filterData(rows, skipSet) {
    LogRendering && console.log("_filterData", rows, skipSet)
    return rows.map(row => this._filterDataRow(row, skipSet))
  }

  _filterDataRow(row, skipSet) {
    LogRendering && console.log("_filterDataRow", row) 
    return row.filter((e, id) => !skipSet.has(id))
  }

  getReportData() {
    return this.sheet.getDataRange().getDisplayValues()
  }
}
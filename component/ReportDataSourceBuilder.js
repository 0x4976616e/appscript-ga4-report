
function createWeeklyReportDataBuilder_(startDate = "7daysAgo", endDate = "yesterday") {
  let builder = new ReportDataBuilder()
  builder.setDateRange(startDate, endDate)
    //.addDimension('sessionMedium')
    //.addDimension('hostName')
    .addMetric('totalUsers')
    .addMetric('newUsers')
    .addMetric('sessions')
    .addMetric('bounceRate')
    .addMetric('averageSessionDuration')
    .addMetric('screenPageViewsPerSession')

  return builder
}

/**
 * GA4 report data source. It requests data and provides access to header and rows of report data.   
 */
class ReportDataSource {
  constructor(propertyId, reportRequest) {
    this.reportRequest = reportRequest
    this.propertyId = propertyId
    this.reportData = null
    
    LogVerbose && console.log(reportRequest, propertyId)
  }

  fetch() {
    if (this.reportData) {
      return this.reportData
    }

    if (!this.propertyId) {
      throw "Cannot fetch data, google analytics property id is not set"
    }

    if (!this.reportRequest) {
      throw "Cannot fetch data, google analytics report request is not set"
    }

    /*  console.info(`Run report
    PropertyId: ${this.propertyId} 
    Request: ${this.reportRequest}`)
    */

    this.reportData = AnalyticsData.Properties.runReport(this.reportRequest,
      'properties/' + this.propertyId)

    // See refernces for report instance fields': https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/RunReportResponse
    if (!this.reportData.rows) {
      console.warn(`No rows returned, report: ${this.reportData}`)
    }

    //console.log(`Report: ${this.reportData}`)
    return this.reportData
  }

  getHeaders() {
    const report = this.fetch()
    // Append the headers.
    const dimensionHeaders = report.dimensionHeaders && report.dimensionHeaders.map(
      (dimensionHeader) => {
        return dimensionHeader.name;
      });

    const metricHeaders = report.metricHeaders && report.metricHeaders.map(
      (metricHeader) => {
        return metricHeader.name;
      });

    const headers = [...(dimensionHeaders || []), ...(metricHeaders || [])];
    return headers
  }

  getRows() {
    const report = this.fetch()
    const rowData = report.rows || []

    const rows = rowData.map((row) => {
      const dimensionValues = row.dimensionValues && row.dimensionValues.map(
        (dimensionValue, i) => {
          return this.formatDimension(report, i, dimensionValue.value)
        })

      const metricValues = row.metricValues && row.metricValues.map(
        (metricValue, i) => {
          return this.formatMetric(report, i, metricValue.value)
        })
      return [...(dimensionValues || []), ...(metricValues || [])]
    })

    return rows
  }

  getObjectRows() {
    const report = this.fetch()
    const rowData = report.rows || []
    const mHeaders = report.metricHeaders
    const dHeaders = report.dimensionHeaders

    return rowData.map((row) => {
      let rowMap = new Map()
      if (row.dimensionValues) {
        row.dimensionValues.forEach((dimensionValue, i) => {
          let value = this.formatDimension(report, i, dimensionValue.value)
          rowMap.set(dHeaders[i].name, value)
        })
      }

      if (row.metricValues)
        row.metricValues.forEach((metricValue, i) => {
          let value = this.formatMetric(report, i, metricValue.value)
          rowMap.set(mHeaders[i].name, value)
        })

      return rowMap
    })
  }

  formatDimension(report, i, value) {
    return value
  }

  formatMetric(report, i, value) {
    const formatter = new Intl.NumberFormat('en', { maximumSignificantDigits: 2 })
    let metricType = report.metricHeaders[i].type
    return metricType ? formatter.format(value) : value
  }

  populateWithDefaults(rows) {
    if (rows.length != 0) {
      return
    }

    const fieldMap = new Map()
    this.getHeaders().forEach(f => {
      fieldMap.set(f, "0")
    })
    rows.push(fieldMap)
  }
}

/**
 * Builds data ordering rules
 */
class OrderByCollectionBuilder {
  constructor() {
    this.orderBys = []
  }

  addMetricOrderBy(name, desc) {
    let orderBy = AnalyticsData.newOrderBy()
    let metricOrderBy = AnalyticsData.newMetricOrderBy()
    metricOrderBy.metricName = name
    orderBy.metric = metricOrderBy
    orderBy.desc = desc
    this.orderBys.push(orderBy)
    return this
  }

  addDimensionOrderBy(name, desc) {
    let orderBy = AnalyticsData.newOrderBy()
    let dimOrderBy = AnalyticsData.newDimensionOrderBy()
    dimOrderBy.dimensionName = name
    orderBy.dimension = dimOrderBy
    orderBy.desc = desc
    this.orderBys.push(orderBy)
    return this
  }

  build() {
    return this.orderBys
  }
}

/**
 * Builds metrics aggregation rules.
 * 
 * METRIC_AGGREGATION_UNSPECIFIED 	Unspecified operator.
 * TOTAL 	SUM operator.
 * MINIMUM 	Minimum operator.
 * MAXIMUM 	Maximum operator.
 * COUNT 	Count operator.
 */
class MetricAggrigationBuilder {
  constructor() {
    this.aggregators = []
  }

  addTotal() {
    this.aggregators.push('TOTAL')
    return this
  }

  addMinimum() {
    this.aggregators.push('MINIMUM')
    return this
  }

  addMaximum() {
    this.aggregators.push('MAXIMUM')
    return this
  }

  addCount() {
    this.aggregators.push('COUNT')
    return this
  }

  build() {
    return this.aggregators
  }
}

/**
 * Filter expression factory
 *  
 * MATCH_TYPE_UNSPECIFIED 	Unspecified
 * EXACT 	Exact match of the string value.
 * BEGINS_WITH 	Begins with the string value.
 * ENDS_WITH 	Ends with the string value.
 * CONTAINS 	Contains the string value.
 * FULL_REGEXP 	Full match for the regular expression with the string value.
 * PARTIAL_REGEXP 	Partial match for the regular expression with the string value.
 */
class StringFilterFactory {
  createStringEqualsFilter(field, value, caseSensitive = true) {
    return this.createStringFilter(field, value, 'EXACT', caseSensitive)
  }

  createStringStartWithFilter(field, value, caseSensitive = true) {
    return this.createStringFilter(field, value, 'BEGINS_WITH', caseSensitive)
  }

  createContainsFilter(field, value, caseSensitive = true) {
    return this.createStringFilter(field, value, 'CONTAINS', caseSensitive)
  }

  createRegexFilter(field, value, caseSensitive = true) {
    return this.createStringFilter(field, value, 'FULL_REGEXP', caseSensitive)
  }

  createOneOfFilter(field, values, caseSensitive = true) {
    let inListFilter = AnalyticsData.newInListFilter()
    inListFilter.values = values
    inListFilter.caseSensitive = caseSensitive

    let filter = AnalyticsData.newFilter()
    filter.fieldName = field
    filter.inListFilter = inListFilter

    let expression = AnalyticsData.newFilterExpression()
    expression.filter = filter
    return expression
  }

  createStringFilter(field, value, matchType, caseSensitive = true) {
    let stringFilter = AnalyticsData.newStringFilter()
    stringFilter.matchType = matchType
    stringFilter.caseSensitive = caseSensitive
    stringFilter.value = value

    let filter = AnalyticsData.newFilter()
    filter.fieldName = field
    filter.stringFilter = stringFilter

    let expression = AnalyticsData.newFilterExpression()
    expression.filter = filter
    return expression
  }
}

/**
 * Report builder for GA4
 * Metric names and dimension names are descriped here: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
 */
class ReportDataBuilder {
  constructor() {
    this.dimensions = []
    this.metrics = []
    this.dateRange = AnalyticsData.newDateRange()
    this.dimensionFilter = null
    this.aggregations = []
  }

  addMetric(metricName) {
    if (!metricName) {
      Logger.log("Empty metric cannot be added")
      return this
    }

    let metric = AnalyticsData.newMetric();
    metric.name = metricName
    this.metrics.push(metric)
    return this
  }

  addDimension(dimensionName) {
    if (!dimensionName) {
      Logger.log("Empty dimension cannot be added")
      return this
    }

    let dimension = AnalyticsData.newDimension();
    dimension.name = dimensionName
    this.dimensions.push(dimension)

    return this
  }

  setStartDate(startDate) {
    this.dateRange.startDate = startDate
    return this
  }

  setEndDate(endDate) {
    this.dateRange.endDate = endDate
    return this
  }

  setDateRange(startDate, endDate) {
    this.dateRange.startDate = startDate
    this.dateRange.endDate = endDate

    return this
  }

  build() {
    const request = AnalyticsData.newRunReportRequest()
    request.dimensions = this.dimensions
    request.metrics = this.metrics
    request.dateRanges = this.dateRange
    //request.metricAggregations = "TOTAL"
    request.keepEmptyRows = true
    request.limit = this.limit

    if (this.orderByBuilder) {
      request.orderBys = this.orderByBuilder.build()
    }

    if (this.dimensionFilter) {
      request.dimensionFilter = this.dimensionFilter
    }

    if (this.metricFilter) {
      request.metricFilter = this.metricFilter
    }

    return request
  }

  setDimensionFilter(filter) {
    this.dimensionFilter = filter
    return this
  }
  setMetricFilter(filter) {
    this.metricFilter = filter
    return this
  }

  setOrderBy(orderByBuilder) {
    this.orderByBuilder = orderByBuilder
    return this
  }

  setLimit(limit) {
    this.limit = limit
    return this
  }
}
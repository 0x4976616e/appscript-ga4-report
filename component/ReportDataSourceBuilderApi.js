// Report data source builder API is not ready for production

/**
 * Creates a report data builder to create GA4 data query using AnalyticsData
 * 
 * @returns {ReportDataBuilder} Report data builder class
 */
function createBuilder_() {
	return new ReportDataBuilder()
}
  
function createFilterFactory_() {
	return new FilterFactory()
}
  
function createDataSource_(propertyId, builder) {
	return new ReportDataSource(propertyId, builder.build())
}
  
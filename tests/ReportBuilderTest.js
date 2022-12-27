function testReportDataSource_() {
	let builder = new ReportDataBuilder()
	builder
		.addMetric("totalUsers")
		.addDimension("sessionSource")
		.setDateRange('14daysAgo', 'today')

	const reportRequest = builder.build()
	const dataSource = new ReportDataSource("335810657", reportRequest)
	dataSource.fetch()

	console.log(dataSource.getRows())
}
  
function testReportDataSourceBuilder_() {
	let builder = new ReportDataBuilder()
	let orderBy = new OrderByCollectionBuilder()
	orderBy.addMetricOrderBy("totalUsers")

	builder
			.addMetric("totalUsers")
			.addDimension("sessionSource")
			.setOrderBy(orderBy)

	console.log(`Test: Build report request ${builder.build()}`)
}
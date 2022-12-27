const testDomainName = "codeporting.app",
testPostByEmail = "boxe964hiho@post.wordpress.com" // publish to personal blog

function testSuite_()
{
  testDeleteSheets_()
  testDocumentRenderer_()
  testReportConfig_()
  testTrafficSourcesReports_()
  testTrafficChannelsReports_()
}

function testReportConfig_(){
  const config = new ReportConfig()
    .setTrafficChannels(['1'])

   console.log(config.getTrafficChannels()) 
}

